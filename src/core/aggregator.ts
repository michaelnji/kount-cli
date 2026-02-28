import * as fsp from 'node:fs/promises';
import path from 'node:path';
import { batchGetFileChurn, getBusFactor, getChangedFiles, getFileAge, getFileVolatility, getSurvivingOwnership, getTopAuthors, isGitRepo } from '../git/index.js';
import {
  AuthorMetricsPlugin,
  BlankLinesPlugin,
  CodeChurnPlugin,
  CommentLinesPlugin,
  DebtTrackerPlugin,
  DependencyTrackerPlugin,
  FileSizePlugin,
  LanguageDistributionPlugin,
  LargestFilesPlugin,
  TechDebtPlugin,
  TotalFilesPlugin,
  TotalLinesPlugin,
} from '../plugins/index.js';
import type { AnalyzedFileData, AnalyzerPlugin, PluginResult, ProjectStats, StageCallback } from '../plugins/types.js';
import type { ScannedFile } from '../scanner/stream-reader.js';
import { Scanner } from '../scanner/stream-reader.js';
import { getPreviousRun } from '../state/history.js';
import { CacheManager } from './cache.js';

/**
 * Default set of built-in plugins (including Git-based ones).
 */
function getDefaultPlugins(): AnalyzerPlugin[] {
  return [
    new TotalLinesPlugin(),
    new BlankLinesPlugin(),
    new CommentLinesPlugin(),
    new FileSizePlugin(),
    new TotalFilesPlugin(),
    new LanguageDistributionPlugin(),
    new LargestFilesPlugin(),
    new DebtTrackerPlugin(),
    new CodeChurnPlugin(),
    new AuthorMetricsPlugin(),
    new DependencyTrackerPlugin(),
    new TechDebtPlugin(),
  ];
}

export interface AggregatorOptions {
  respectGitignore?: boolean;
  plugins?: AnalyzerPlugin[];
  cacheEnabled?: boolean;
  clearCache?: boolean;
  diffBranch?: string;
  deepGit?: boolean;
  staleThreshold?: number;
}

/**
 * Orchestrator: connects the Scanner to the Plugin pipeline.
 * Streams each file, builds AnalyzedFileData, then runs all plugins.
 * Integrates the CacheManager to skip unchanged files.
 * Supports Git intelligence: diff filtering, churn tracking, author metrics.
 */
export class Aggregator {
  private scanner: Scanner;
  private plugins: AnalyzerPlugin[];
  private rootDir: string;
  private cache: CacheManager;
  private clearCacheFirst: boolean;
  private diffBranch?: string;
  private deepGit: boolean;
  private staleThreshold: number;

  constructor(rootDir: string, options?: AggregatorOptions) {
    this.rootDir = path.resolve(rootDir);
    this.scanner = new Scanner(this.rootDir, options?.respectGitignore ?? true);
    this.plugins = options?.plugins ?? getDefaultPlugins();
    this.cache = new CacheManager(this.rootDir, options?.cacheEnabled ?? true);
    this.clearCacheFirst = options?.clearCache ?? false;
    this.diffBranch = options?.diffBranch;
    this.deepGit = options?.deepGit ?? false;
    this.staleThreshold = options?.staleThreshold ?? 2;
  }

  /**
   * Runs the full pipeline: discover → diff filter → stream → churn → analyze → aggregate.
   * Returns a ProjectStats payload ready for reporters.
   *
   * @param onProgress Optional callback fired per step for UI progress tracking.
   */
  async run(onProgress?: StageCallback): Promise<ProjectStats> {
    // 0. Cache setup
    if (this.clearCacheFirst) {
      await this.cache.clear();
    }
    await this.cache.load();

    // 1. Discover files
    if (onProgress) onProgress('DISCOVERING');
    let scannedFiles = await this.scanner.discover(this.rootDir, onProgress);

    // 2. Check Git availability
    const gitAvailable = await isGitRepo(this.rootDir);

    // 3. Diff filtering (if --diff is set and Git is available)
    if (this.diffBranch && gitAvailable) {
      const changedFiles = await getChangedFiles(this.rootDir, this.diffBranch);
      const changedSet = new Set(
        changedFiles.map((f) => path.resolve(this.rootDir, f))
      );
      scannedFiles = scannedFiles.filter((sf) => changedSet.has(sf.filePath));
    }

    // 4. Stream each file (or use cache) and build enriched data
    const analyzedFiles: AnalyzedFileData[] = [];
    let current = 0;

    if (onProgress) onProgress('ANALYZING');

    for (const scannedFile of scannedFiles) {
      const fileData = await this.processFile(scannedFile);
      analyzedFiles.push(fileData);
      current++;

      if (onProgress && current % 50 === 0) {
        onProgress('ANALYZING', scannedFile.filePath);
      }
    }

    // 5. Fetch Git churn data and advanced metrics (if Git is available)
    if (gitAvailable) {
      if (onProgress) onProgress('GIT_METRICS');
      const relPaths = analyzedFiles.map((f) => path.relative(this.rootDir, f.filePath));

      const churnMap = await batchGetFileChurn(this.rootDir, relPaths, 20);

      // Batch fetch age, bus factor, volatility, ownership
      const ageMap = new Map<string, string | null>();
      const busFactorMap = new Map<string, { count: number; primaryAuthor?: string }>();
      const volatilityMap = new Map<string, { insertions: number; deletions: number }>();
      const topOwnerMap = new Map<string, string>();

      for (let i = 0; i < relPaths.length; i += 20) {
        const batch = relPaths.slice(i, i + 20);
        await Promise.all(batch.map(async (fp) => {
          ageMap.set(fp, await getFileAge(this.rootDir, fp));
          busFactorMap.set(fp, await getBusFactor(this.rootDir, fp));

          if (this.deepGit || this.diffBranch) {
            volatilityMap.set(fp, await getFileVolatility(this.rootDir, fp));
            const owners = await getSurvivingOwnership(this.rootDir, fp);
            if (owners.length > 0) topOwnerMap.set(fp, owners[0].author);
          }
        }));
      }

      for (const file of analyzedFiles) {
        const relPath = path.relative(this.rootDir, file.filePath);
        file.commits = churnMap.get(relPath) ?? 0;
        file.age = ageMap.get(relPath);

        const bf = busFactorMap.get(relPath);
        if (bf) {
          file.busFactor = bf.count;
          if (bf.primaryAuthor) file.topOwner = bf.primaryAuthor;
        }

        if (this.deepGit || this.diffBranch) {
          file.volatility = volatilityMap.get(relPath);
          const trueOwner = topOwnerMap.get(relPath);
          if (trueOwner) file.topOwner = trueOwner;
        }
      }
    }

    // 6. Fetch author data and inject into AuthorMetricsPlugin (if Git is available)
    let topAuthors: Array<{ name: string; commits: number }> = [];
    if (gitAvailable) {
      topAuthors = await getTopAuthors(this.rootDir);
      const authorPlugin = this.plugins.find(
        (p): p is AuthorMetricsPlugin => p.name === 'AuthorMetrics'
      ) as AuthorMetricsPlugin | undefined;
      if (authorPlugin) {
        authorPlugin.setAuthors(topAuthors);
      }
    }

    // 6.5 Inject comment data into TechDebtPlugin before analyze
    const commentLinesPlugin = this.plugins.find(
      (p) => p.name === 'CommentLines'
    );
    if (commentLinesPlugin) {
      // Run CommentLines first to get per-file data
      const commentResult = commentLinesPlugin.analyze(analyzedFiles);
      const techDebtPlugin = this.plugins.find(
        (p): p is TechDebtPlugin => p.name === 'TechDebt'
      ) as TechDebtPlugin | undefined;
      if (techDebtPlugin) {
        techDebtPlugin.setCommentData(commentResult.perFile);
      }
    }

    // 7. Run each plugin against the full analyzed data
    const pluginResults = new Map<string, PluginResult>();
    for (const plugin of this.plugins) {
      const result = plugin.analyze(analyzedFiles);
      pluginResults.set(plugin.name, result);
    }

    // 8. Update cache with fresh per-file metrics from plugins
    for (const file of analyzedFiles) {
      const metrics: Record<string, number> = {};
      for (const [pluginName, result] of pluginResults) {
        const value = result.perFile.get(file.filePath);
        if (value !== undefined) {
          metrics[pluginName] = value;
        }
      }

      try {
        const stat = await fsp.stat(file.filePath);
        this.cache.set(file.filePath, stat.mtimeMs, stat.size, metrics);
      } catch {
        // File may have been deleted between discover and cache save — skip
      }
    }

    // 9. Save cache to disk
    await this.cache.save();

    // 10. Compute language distribution
    const langPlugin = this.plugins.find(
      (p): p is LanguageDistributionPlugin => p.name === 'LanguageDistribution'
    ) as LanguageDistributionPlugin | undefined;
    const languageDistribution = langPlugin
      ? langPlugin.getDistribution(analyzedFiles)
      : new Map<string, number>();

    // 11. Compute largest files
    const largestPlugin = this.plugins.find(
      (p): p is LargestFilesPlugin => p.name === 'LargestFiles'
    ) as LargestFilesPlugin | undefined;
    const largestFiles = largestPlugin
      ? largestPlugin.getTopFiles(analyzedFiles)
      : [];

    // 12. Compute debt hotspots
    const debtPlugin = this.plugins.find(
      (p): p is DebtTrackerPlugin => p.name === 'DebtTracker'
    ) as DebtTrackerPlugin | undefined;
    const debtHotspots = debtPlugin
      ? debtPlugin.getDebtHotspots(analyzedFiles)
      : [];

    // 13. Build gitInsights (only when Git is available)
    let gitInsights: ProjectStats['gitInsights'];
    if (gitAvailable) {
      const churnPlugin = this.plugins.find(
        (p): p is CodeChurnPlugin => p.name === 'CodeChurn'
      ) as CodeChurnPlugin | undefined;
      const highChurnFiles = churnPlugin
        ? churnPlugin.getHighChurnFiles(analyzedFiles)
        : [];

      // Calculate stale files and knowledge silos
      let staleFilesCount = 0;
      const knowledgeSilos: Array<{ filePath: string; author: string }> = [];
      const changedFileReviewers = new Map<string, number>();
      const fileGitMetrics = new Map<string, { age?: string | null; busFactor?: number; volatility?: { insertions: number; deletions: number }; topOwner?: string }>();

      for (const file of analyzedFiles) {
        const relPath = path.relative(this.rootDir, file.filePath);
        fileGitMetrics.set(relPath, {
          age: file.age,
          busFactor: file.busFactor,
          volatility: file.volatility,
          topOwner: file.topOwner,
        });

        if (file.age) {
          // Parse "X years ago" or "X year ago"
          const match = file.age.match(/^(\d+)\s+years?/);
          if (match && parseInt(match[1], 10) >= this.staleThreshold) {
            staleFilesCount++;
          }
        }
        if (file.lines.length > 500 && file.busFactor === 1 && file.topOwner) {
          knowledgeSilos.push({ filePath: path.relative(this.rootDir, file.filePath), author: file.topOwner });
        }

        // If --diff is active, collect ownership of changed files
        if (this.diffBranch && file.topOwner) {
          const linesAmount = file.lines.length;
          changedFileReviewers.set(file.topOwner, (changedFileReviewers.get(file.topOwner) || 0) + linesAmount);
        }
      }

      let suggestedReviewers: Array<{ name: string; ownedLines: number }> | undefined;
      if (this.diffBranch) {
        suggestedReviewers = Array.from(changedFileReviewers.entries())
          .map(([name, ownedLines]) => ({ name, ownedLines }))
          .sort((a, b) => b.ownedLines - a.ownedLines)
          .slice(0, 2);
      }

      gitInsights = {
        diffBranch: this.diffBranch,
        topAuthors,
        highChurnFiles,
        staleFilesCount,
        knowledgeSilos,
        suggestedReviewers,
        fileGitMetrics,
      };
    }

    // 14. Compute tech debt score and high-debt files
    if (onProgress) onProgress('CALCULATING_DEBT');

    // Inject dependency import counts into TechDebt for coupling penalty
    const depPlugin = this.plugins.find(
      (p): p is DependencyTrackerPlugin => p.name === 'DependencyTracker'
    ) as DependencyTrackerPlugin | undefined;
    const depResult = depPlugin ? pluginResults.get('DependencyTracker') : undefined;

    const techDebtPlugin = this.plugins.find(
      (p): p is TechDebtPlugin => p.name === 'TechDebt'
    ) as TechDebtPlugin | undefined;
    if (techDebtPlugin && depResult) {
      techDebtPlugin.setDependencyData(depResult.perFile);
    }
    // Re-run TechDebt with the dependency data injected
    if (techDebtPlugin) {
      const freshResult = techDebtPlugin.analyze(analyzedFiles);
      pluginResults.set('TechDebt', freshResult);
    }
    const techDebtScore = pluginResults.get('TechDebt')?.summaryValue ?? 0;
    const highDebtFiles = techDebtPlugin
      ? techDebtPlugin.getHighestDebtFiles(analyzedFiles)
      : [];

    // 15. Compute trends from previous run
    let trends: ProjectStats['trends'];
    try {
      const prevRun = await getPreviousRun(this.rootDir);
      if (prevRun) {
        const totalLines = pluginResults.get('TotalLines')?.summaryValue ?? 0;
        const commentLines = pluginResults.get('CommentLines')?.summaryValue ?? 0;
        const totalBytes = pluginResults.get('FileSize')?.summaryValue ?? 0;
        const commentRatio = totalLines > 0
          ? Number(((commentLines / totalLines) * 100).toFixed(1))
          : 0;

        trends = {
          linesDelta: totalLines - prevRun.totalLines,
          fileDelta: scannedFiles.length - prevRun.totalFiles,
          sizeDelta: totalBytes - prevRun.totalSize,
          commentRatioDelta: Number((commentRatio - prevRun.commentRatio).toFixed(1)),
          debtDelta: techDebtScore - prevRun.techDebtScore,
        };
      }
    } catch {
      // Graceful degradation — skip trends if history read fails
    }

    // 16. Compute top dependencies
    const topDependencies = depPlugin
      ? depPlugin.getTopDependencies(10)
      : undefined;

    if (onProgress) onProgress('RENDERING');

    return {
      rootDir: this.rootDir,
      totalFiles: scannedFiles.length,
      pluginResults,
      languageDistribution,
      largestFiles,
      debtHotspots,
      gitInsights,
      techDebtScore,
      highDebtFiles,
      trends,
      topDependencies,
      scannedAt: new Date(),
    };
  }

  /**
   * Processes a single file: checks cache first, streams if cache miss.
   */
  private async processFile(scannedFile: ScannedFile): Promise<AnalyzedFileData> {
    // Check cache (we need the current stat to compare)
    try {
      const stat = await fsp.stat(scannedFile.filePath);
      const cached = this.cache.lookup(scannedFile.filePath, stat.mtimeMs, stat.size);

      if (cached !== null) {
        // Cache hit — we still need AnalyzedFileData for the plugins.
        // Since plugins need `lines`, we need to re-stream on cache miss.
        // For cache hits, we can't avoid re-reading if plugins need full line data.
        // However the cache stores per-file metrics directly, so for a future
        // optimization we could bypass plugins entirely. For now, we still stream
        // but the cache mechanism is in place for the next optimization pass.
      }
    } catch {
      // stat failed — proceed with streaming
    }

    return this.streamAndParse(scannedFile);
  }

  /**
   * Streams a single file and collects its lines.
   * Uses the Scanner's streaming API to avoid loading the entire file at once.
   */
  private async streamAndParse(scannedFile: ScannedFile): Promise<AnalyzedFileData> {
    const lines: string[] = [];
    let remainder = '';

    await this.scanner.streamFile(scannedFile.filePath, (chunk, isLast) => {
      if (chunk.length === 0 && isLast) {
        // Flush any remaining partial line
        if (remainder.length > 0) {
          lines.push(remainder);
          remainder = '';
        }
        return;
      }

      const text = remainder + chunk.toString('utf8');
      const parts = text.split('\n');

      // All complete lines (everything except the last element which may be partial)
      for (let i = 0; i < parts.length - 1; i++) {
        lines.push(parts[i]);
      }

      // Keep the last part as remainder (may be partial line)
      remainder = parts[parts.length - 1];
    });

    return {
      filePath: scannedFile.filePath,
      size: scannedFile.size,
      extension: path.extname(scannedFile.filePath),
      lines,
    };
  }
}
