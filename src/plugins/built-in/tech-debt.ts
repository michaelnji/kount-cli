import type { AnalyzedFileData, AnalyzerPlugin, PluginResult } from '../types.js';

/**
 * Calculates a composite Tech Debt Score per file.
 * Formula: (lines + (churn * 10)) / Math.max(commentRatio, 1)
 *
 * Where:
 * - lines = total lines in the file
 * - churn = number of git commits (0 if git unavailable)
 * - commentRatio = (commentLines / totalLines) * 100 for that file
 *
 * Higher score = more likely to be a maintenance burden.
 */
export class TechDebtPlugin implements AnalyzerPlugin {
  readonly name = 'TechDebt';

  /** Per-file comment line counts — injected before analyze() */
  private commentPerFile: Map<string, number> = new Map();

  /** Per-file external import counts — injected before analyze() */
  private depPerFile: Map<string, number> = new Map();

  /**
   * Called by the Aggregator to inject per-file comment data
   * (from the CommentLines plugin) before analyze() runs.
   */
  setCommentData(commentPerFile: Map<string, number>): void {
    this.commentPerFile = commentPerFile;
  }

  /**
   * Called by the Aggregator to inject per-file dependency import counts
   * (from the DependencyTracker plugin) before analyze() runs.
   * Files with > 15 external imports receive a coupling penalty.
   */
  setDependencyData(depPerFile: Map<string, number>): void {
    this.depPerFile = depPerFile;
  }

  analyze(files: AnalyzedFileData[]): PluginResult {
    const perFile = new Map<string, number>();
    let summaryValue = 0;

    for (const file of files) {
      const lines = file.lines.length;
      const churn = file.commits ?? 0;
      const commentLines = this.commentPerFile.get(file.filePath) ?? 0;
      const commentRatio = lines > 0 ? (commentLines / lines) * 100 : 0;

      // Coupling penalty: files with > 15 external imports get +20 debt
      const imports = this.depPerFile.get(file.filePath) ?? 0;
      const couplingPenalty = imports > 15 ? 20 : 0;

      const score = Math.round(
        (lines + churn * 10 + couplingPenalty) / Math.max(commentRatio, 1)
      );

      perFile.set(file.filePath, score);
      summaryValue += score;
    }

    return { pluginName: this.name, summaryValue, perFile };
  }

  /**
   * Returns the top N files with the highest tech debt scores.
   */
  getHighestDebtFiles(
    files: AnalyzedFileData[],
    topN: number = 5
  ): Array<{ filePath: string; score: number }> {
    const result = this.analyze(files);

    return [...result.perFile.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([filePath, score]) => ({ filePath, score }));
  }
}
