import fsp from 'node:fs/promises';
import path from 'node:path';
import type { ProjectStats } from '../plugins/types.js';

/**
 * Generates CSV content from ProjectStats.
 * Strictly per-file data — no summary row.
 * Columns: Path, Lines, Blank Lines, Comment Lines, Size, Debt Markers
 */
export function generateCsvReport(stats: ProjectStats): string {
  const header = 'Path,Lines,Blank Lines,Comment Lines,Size,Debt Markers';
  const rows: string[] = [header];

  const totalLinesPerFile = stats.pluginResults.get('TotalLines')?.perFile ?? new Map();
  const blankPerFile = stats.pluginResults.get('BlankLines')?.perFile ?? new Map();
  const commentPerFile = stats.pluginResults.get('CommentLines')?.perFile ?? new Map();
  const sizePerFile = stats.pluginResults.get('FileSize')?.perFile ?? new Map();
  const debtPerFile = stats.pluginResults.get('DebtTracker')?.perFile ?? new Map();

  for (const [filePath, lines] of totalLinesPerFile) {
    const relPath = path.relative(stats.rootDir, filePath);
    // Escape paths that contain commas or quotes
    const escapedPath = relPath.includes(',') || relPath.includes('"')
      ? `"${relPath.replace(/"/g, '""')}"`
      : relPath;

    rows.push([
      escapedPath,
      lines,
      blankPerFile.get(filePath) ?? 0,
      commentPerFile.get(filePath) ?? 0,
      sizePerFile.get(filePath) ?? 0,
      debtPerFile.get(filePath) ?? 0,
    ].join(','));
  }

  return rows.join('\n') + '\n';
}

/**
 * Writes the CSV report to disk.
 *
 * @param stats The aggregated project statistics.
 * @param outputPath Optional output path (defaults to kount-report.csv in rootDir).
 * @returns The path the file was written to.
 */
export async function writeCsvReport(
  stats: ProjectStats,
  outputPath?: string
): Promise<string> {
  const targetPath = outputPath ?? path.join(stats.rootDir, 'kount-report.csv');
  const content = generateCsvReport(stats);
  await fsp.writeFile(targetPath, content, 'utf8');
  return targetPath;
}
