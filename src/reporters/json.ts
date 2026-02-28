import fsp from 'node:fs/promises';
import path from 'node:path';
import type { ProjectStats } from '../plugins/types.js';

/**
 * Builds a flat, API-friendly JSON object from ProjectStats.
 */
function buildJsonReport(stats: ProjectStats): Record<string, unknown> {
  const totalLines = stats.pluginResults.get('TotalLines')?.summaryValue ?? 0;
  const blankLines = stats.pluginResults.get('BlankLines')?.summaryValue ?? 0;
  const commentLines = stats.pluginResults.get('CommentLines')?.summaryValue ?? 0;
  const totalBytes = stats.pluginResults.get('FileSize')?.summaryValue ?? 0;
  const debtMarkers = stats.pluginResults.get('DebtTracker')?.summaryValue ?? 0;
  const codeLines = totalLines - blankLines - commentLines;
  const commentRatio = totalLines > 0 ? Number(((commentLines / totalLines) * 100).toFixed(1)) : 0;

  // Build per-file array
  const files: Array<Record<string, unknown>> = [];
  const totalLinesPerFile = stats.pluginResults.get('TotalLines')?.perFile ?? new Map();
  const blankPerFile = stats.pluginResults.get('BlankLines')?.perFile ?? new Map();
  const commentPerFile = stats.pluginResults.get('CommentLines')?.perFile ?? new Map();
  const sizePerFile = stats.pluginResults.get('FileSize')?.perFile ?? new Map();
  const debtPerFile = stats.pluginResults.get('DebtTracker')?.perFile ?? new Map();
  const churnPerFile = stats.pluginResults.get('CodeChurn')?.perFile ?? new Map();
  const debtScorePerFile = stats.pluginResults.get('TechDebt')?.perFile ?? new Map();

  for (const [filePath, lines] of totalLinesPerFile) {
    files.push({
      path: path.relative(stats.rootDir, filePath),
      lines,
      blankLines: blankPerFile.get(filePath) ?? 0,
      commentLines: commentPerFile.get(filePath) ?? 0,
      size: sizePerFile.get(filePath) ?? 0,
      debtMarkers: debtPerFile.get(filePath) ?? 0,
      commits: churnPerFile.get(filePath) ?? 0,
      debtScore: debtScorePerFile.get(filePath) ?? 0,
    });
  }

  // Build language distribution object
  const languages: Record<string, number> = {};
  for (const [lang, count] of stats.languageDistribution) {
    languages[lang] = count;
  }

  const report: Record<string, unknown> = {
    summary: {
      totalFiles: stats.totalFiles,
      totalLines,
      codeLines,
      commentLines,
      blankLines,
      commentRatio,
      totalBytes,
      debtMarkers,
    },
    files,
    languages,
    largestFiles: stats.largestFiles.map((f) => ({
      path: path.relative(stats.rootDir, f.filePath),
      size: f.size,
    })),
    debtHotspots: stats.debtHotspots.map((d) => ({
      path: path.relative(stats.rootDir, d.filePath),
      count: d.count,
    })),
    scannedAt: stats.scannedAt.toISOString(),
  };

  // Include Git insights only when available
  if (stats.gitInsights) {
    report.gitInsights = {
      diffBranch: stats.gitInsights.diffBranch ?? null,
      topAuthors: stats.gitInsights.topAuthors,
      highChurnFiles: stats.gitInsights.highChurnFiles.map((f) => ({
        path: path.relative(stats.rootDir, f.filePath),
        commits: f.commits,
      })),
    };
  }

  // Include tech debt only when available
  if (stats.techDebtScore !== undefined) {
    report.techDebtScore = stats.techDebtScore;
  }
  if (stats.highDebtFiles && stats.highDebtFiles.length > 0) {
    report.highDebtFiles = stats.highDebtFiles.map((f) => ({
      path: path.relative(stats.rootDir, f.filePath),
      score: f.score,
    }));
  }

  // Include trends only when available
  if (stats.trends) {
    report.trends = stats.trends;
  }

  return report;
}

/**
 * Generates the JSON string from ProjectStats.
 */
export function generateJsonReport(stats: ProjectStats): string {
  return JSON.stringify(buildJsonReport(stats), null, 2);
}

/**
 * Writes the JSON report to disk.
 *
 * @param stats The aggregated project statistics.
 * @param outputPath Optional output path (defaults to kount-report.json in rootDir).
 * @returns The path the file was written to.
 */
export async function writeJsonReport(
  stats: ProjectStats,
  outputPath?: string
): Promise<string> {
  const targetPath = outputPath ?? path.join(stats.rootDir, 'kount-report.json');
  const content = generateJsonReport(stats);
  await fsp.writeFile(targetPath, content, 'utf8');
  return targetPath;
}
