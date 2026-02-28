import type { AnalyzedFileData, AnalyzerPlugin, PluginResult } from '../types.js';

/**
 * Tracks repo-level author metrics from git shortlog.
 * Receives author data via setAuthors() from the Aggregator,
 * then analyze() stores the summary. getTopAuthors() provides the accessor.
 */
export class AuthorMetricsPlugin implements AnalyzerPlugin {
  readonly name = 'AuthorMetrics';

  private authors: Array<{ name: string; commits: number }> = [];

  /**
   * Called by the Aggregator to inject async-fetched author data
   * before the synchronous analyze() runs.
   */
  setAuthors(authors: Array<{ name: string; commits: number }>): void {
    this.authors = authors;
  }

  analyze(_files: AnalyzedFileData[]): PluginResult {
    const summaryValue = this.authors.reduce((acc, a) => acc + a.commits, 0);

    return {
      pluginName: this.name,
      summaryValue,
      perFile: new Map(), // Repo-level metric — no per-file breakdown
    };
  }

  /**
   * Returns the cached top authors data.
   */
  getTopAuthors(): Array<{ name: string; commits: number }> {
    return this.authors;
  }
}
