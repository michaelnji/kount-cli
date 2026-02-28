import type { AnalyzedFileData, AnalyzerPlugin, PluginResult } from '../types.js';

/**
 * Tracks code churn (number of git commits) per file.
 * Reads the `commits` field populated by the Aggregator from git data.
 * Identifies the top N highest-churn files.
 */
export class CodeChurnPlugin implements AnalyzerPlugin {
  readonly name = 'CodeChurn';

  analyze(files: AnalyzedFileData[]): PluginResult {
    const perFile = new Map<string, number>();
    let summaryValue = 0;

    for (const file of files) {
      const commits = file.commits ?? 0;
      perFile.set(file.filePath, commits);
      summaryValue += commits;
    }

    return { pluginName: this.name, summaryValue, perFile };
  }

  /**
   * Returns the top N files with the highest churn (most commits).
   */
  getHighChurnFiles(
    files: AnalyzedFileData[],
    topN: number = 5
  ): Array<{ filePath: string; commits: number }> {
    return files
      .filter((f) => (f.commits ?? 0) > 0)
      .sort((a, b) => (b.commits ?? 0) - (a.commits ?? 0))
      .slice(0, topN)
      .map((f) => ({ filePath: f.filePath, commits: f.commits ?? 0 }));
  }
}
