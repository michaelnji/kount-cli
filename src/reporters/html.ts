import { exec } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import type { ProjectStats } from '../plugins/types.js';
import { getHistory } from '../state/history.js';
import { buildHtmlTemplate } from './html-template.js';

/**
 * Generates the full HTML dashboard page with injected data.
 * Uses Chart.js (CDN), Alpine.js (CDN), and Lucide Icons for the dashboard.
 */
async function generateHtmlDashboard(stats: ProjectStats): Promise<string> {
  const totalLines = stats.pluginResults.get('TotalLines')?.summaryValue ?? 0;
  const blankLines = stats.pluginResults.get('BlankLines')?.summaryValue ?? 0;
  const commentLines = stats.pluginResults.get('CommentLines')?.summaryValue ?? 0;
  const totalBytes = stats.pluginResults.get('FileSize')?.summaryValue ?? 0;
  const codeLines = totalLines - blankLines - commentLines;
  const codeRatio = totalLines > 0 ? ((codeLines / totalLines) * 100).toFixed(1) : '0.0';

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Prepare language data
  const langData = [...stats.languageDistribution.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([lang, count]) => ({
      lang,
      count,
      pct: ((count / stats.totalFiles) * 100).toFixed(1),
    }));

  // Prepare largest files data
  const largestData = stats.largestFiles.map((f, i) => ({
    rank: i + 1,
    path: path.relative(stats.rootDir, f.filePath),
    size: formatSize(f.size),
    rawSize: f.size,
  }));

  // Prepare debt hotspots data
  const debtData = stats.debtHotspots.map((d, i) => ({
    rank: i + 1,
    path: path.relative(stats.rootDir, d.filePath),
    count: d.count,
  }));
  const debtMarkers = stats.pluginResults.get('DebtTracker')?.summaryValue ?? 0;

  // Prepare git insights data
  const gitData = stats.gitInsights ? {
    diffBranch: stats.gitInsights.diffBranch ?? null,
    topAuthors: stats.gitInsights.topAuthors,
    highChurnFiles: stats.gitInsights.highChurnFiles.map((f, i) => ({
      rank: i + 1,
      path: path.relative(stats.rootDir, f.filePath),
      commits: f.commits,
    })),
    staleFilesCount: stats.gitInsights.staleFilesCount,
    knowledgeSilos: stats.gitInsights.knowledgeSilos,
    suggestedReviewers: stats.gitInsights.suggestedReviewers,
  } : null;

  // Prepare tech debt data
  const techDebtScore = stats.techDebtScore ?? 0;
  const highDebtData = (stats.highDebtFiles ?? []).map((f, i) => ({
    rank: i + 1,
    path: path.relative(stats.rootDir, f.filePath),
    score: f.score,
  }));

  // Build per-file data for interactive table
  const totalLinesPerFile = stats.pluginResults.get('TotalLines')?.perFile ?? new Map();
  const blankPerFile = stats.pluginResults.get('BlankLines')?.perFile ?? new Map();
  const commentPerFile = stats.pluginResults.get('CommentLines')?.perFile ?? new Map();
  const sizePerFile = stats.pluginResults.get('FileSize')?.perFile ?? new Map();
  const debtPerFile = stats.pluginResults.get('DebtTracker')?.perFile ?? new Map();
  const churnPerFile = stats.pluginResults.get('CodeChurn')?.perFile ?? new Map();
  const debtScorePerFile = stats.pluginResults.get('TechDebt')?.perFile ?? new Map();

  const filesData: Array<Record<string, unknown>> = [];
  const gitMetricsMap = stats.gitInsights?.fileGitMetrics ?? new Map();

  for (const [filePath, lines] of totalLinesPerFile) {
    const rawSize = sizePerFile.get(filePath) ?? 0;
    const relPath = path.relative(stats.rootDir, filePath);
    const gitMeta = gitMetricsMap.get(relPath);

    filesData.push({
      path: relPath,
      lines,
      comments: commentPerFile.get(filePath) ?? 0,
      blanks: blankPerFile.get(filePath) ?? 0,
      size: rawSize,
      sizeFormatted: formatSize(rawSize),
      debt: debtPerFile.get(filePath) ?? 0,
      commits: churnPerFile.get(filePath) ?? 0,
      debtScore: debtScorePerFile.get(filePath) ?? 0,
      age: gitMeta?.age ?? null,
      busFactor: gitMeta?.busFactor ?? null,
      topOwner: gitMeta?.topOwner ?? null,
      volatility: gitMeta?.volatility ?? null,
    });
  }

  const history = await getHistory(stats.rootDir, 30);

  const jsonData = JSON.stringify({
    summary: {
      files: stats.totalFiles,
      totalLines,
      codeLines,
      commentLines,
      blankLines,
      codeRatio,
      totalSize: formatSize(totalBytes),
      debtMarkers,
      techDebtScore,
    },
    files: filesData,
    languages: langData,
    largestFiles: largestData,
    debtHotspots: debtData,
    gitInsights: gitData,
    highDebtFiles: highDebtData,
    topDependencies: stats.topDependencies ?? [],
    trends: stats.trends ?? null,
    history,
    scannedAt: stats.scannedAt.toISOString(),
    rootDir: stats.rootDir,
  });

  return buildHtmlTemplate(jsonData);
}

/**
 * Spins up a temporary HTTP server, serves the HTML dashboard,
 * and auto-opens the user's default browser.
 *
 * @param stats The aggregated project statistics.
 * @param port The port to serve on (defaults to 0 for auto-assign).
 * @returns A cleanup function to shut down the server.
 */
export async function serveHtmlDashboard(
  stats: ProjectStats,
  port: number = 0
): Promise<{ url: string; close: () => void }> {
  const html = await generateHtmlDashboard(stats);

  return new Promise((resolve, reject) => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(html);
    });

    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to get server address'));
        return;
      }

      const url = `http://127.0.0.1:${address.port}`;

      // Auto-open the default browser (platform-independent)
      const openCmd = process.platform === 'darwin'
        ? `open "${url}"`
        : process.platform === 'win32'
          ? `start "${url}"`
          : `xdg-open "${url}"`;

      exec(openCmd);

      resolve({
        url,
        close: () => server.close(),
      });
    });

    server.on('error', reject);
  });
}

export { generateHtmlDashboard };
