import type { KountConfig } from '../cli/config-resolver.js';
import type { ProjectStats } from '../plugins/types.js';

/**
 * Checks project stats against configured quality gate thresholds.
 * Returns an array of human-readable failure messages.
 * An empty array means all gates passed.
 *
 * This is a pure function — side effects (printing, exiting) are the caller's responsibility.
 */
export function checkQualityGates(
  config: KountConfig,
  stats: ProjectStats
): string[] {
  const failures: string[] = [];

  if (!config.qualityGates) {
    return failures;
  }

  const { failOnSize, minCommentRatio } = config.qualityGates;

  // Check codebase size
  if (failOnSize !== undefined) {
    const totalBytes = stats.pluginResults.get('FileSize')?.summaryValue ?? 0;
    const totalMB = totalBytes / (1024 * 1024);

    if (totalMB > failOnSize) {
      failures.push(
        `Codebase size of ${totalMB.toFixed(2)}MB exceeds the ${failOnSize}MB limit.`
      );
    }
  }

  // Check comment ratio
  if (minCommentRatio !== undefined) {
    const totalLines = stats.pluginResults.get('TotalLines')?.summaryValue ?? 0;
    const commentLines = stats.pluginResults.get('CommentLines')?.summaryValue ?? 0;
    const ratio = totalLines > 0 ? (commentLines / totalLines) * 100 : 0;

    if (ratio < minCommentRatio) {
      failures.push(
        `Comment ratio of ${ratio.toFixed(1)}% is below the ${minCommentRatio}% minimum.`
      );
    }
  }

  return failures;
}
