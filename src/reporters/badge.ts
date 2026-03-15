import * as fsp from 'node:fs/promises';
import path from 'node:path';
import type { ProjectStats } from '../plugins/types.js';

interface BadgePayload {
  schemaVersion: 1;
  label: string;
  message: string;
  color: 'brightgreen' | 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'lightgrey';
}

function buildPayload(stats: ProjectStats, metric: string): BadgePayload {
  switch (metric) {
    case 'files': {
      return {
        schemaVersion: 1,
        label: 'files',
        message: stats.totalFiles.toLocaleString(),
        color: 'blue',
      };
    }

    case 'lines': {
      const totalLines = stats.pluginResults.get('TotalLines')?.summaryValue ?? 0;
      return {
        schemaVersion: 1,
        label: 'lines of code',
        message: totalLines.toLocaleString(),
        color: 'blue',
      };
    }

    case 'comment-ratio': {
      const totalLines = stats.pluginResults.get('TotalLines')?.summaryValue ?? 0;
      const commentLines = stats.pluginResults.get('CommentLines')?.summaryValue ?? 0;
      const ratio = totalLines > 0 ? (commentLines / totalLines) * 100 : 0;
      return {
        schemaVersion: 1,
        label: 'comment ratio',
        message: `${ratio.toFixed(1)}%`,
        color: ratio >= 20 ? 'green' : ratio >= 10 ? 'yellow' : 'red',
      };
    }

    case 'debt-score': {
      const score = stats.techDebtScore ?? 0;
      return {
        schemaVersion: 1,
        label: 'cleanup score',
        message: score.toLocaleString(),
        color: score <= 100 ? 'green' : score <= 500 ? 'yellow' : 'red',
      };
    }

    case 'complexity': {
      const perFile = stats.pluginResults.get('Complexity')?.perFile ?? new Map<string, number>();
      const values = [...perFile.values()];
      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      return {
        schemaVersion: 1,
        label: 'complexity',
        message: `${avg.toFixed(1)} avg`,
        color: avg <= 5 ? 'green' : avg <= 10 ? 'yellow' : 'red',
      };
    }

    default:
      return {
        schemaVersion: 1,
        label: metric,
        message: 'unknown metric',
        color: 'lightgrey',
      };
  }
}

/**
 * Generates a Shields.io endpoint-compatible JSON badge file.
 *
 * @param stats    Aggregated project statistics.
 * @param metric   One of: files, lines, comment-ratio, debt-score, complexity.
 * @param outputPath  Destination file path (defaults to .kount-badge.json in cwd).
 * @returns        The absolute path of the written file.
 */
export async function writeBadge(
  stats: ProjectStats,
  metric: string,
  outputPath?: string
): Promise<string> {
  const payload = buildPayload(stats, metric);
  const dest = outputPath
    ? path.resolve(outputPath)
    : path.join(process.cwd(), '.kount-badge.json');

  await fsp.writeFile(dest, JSON.stringify(payload, null, 2), 'utf8');
  return dest;
}
