import type { AnalyzedFileData, AnalyzerPlugin, PluginResult } from '../types.js';

const DEBT_REGEX = /(TODO|FIXME|HACK):/i;

/**
 * Tracks technical debt markers (TODO:, FIXME:, HACK:) across all scanned files.
 * Operates on already-parsed lines — no scanner modifications needed.
 */
export class DebtTrackerPlugin implements AnalyzerPlugin {
  readonly name = 'DebtTracker';

  analyze(files: AnalyzedFileData[]): PluginResult {
    const perFile = new Map<string, number>();
    let summaryValue = 0;

    for (const file of files) {
      let count = 0;
      for (const line of file.lines) {
        if (DEBT_REGEX.test(line)) {
          count++;
        }
      }
      perFile.set(file.filePath, count);
      summaryValue += count;
    }

    return { pluginName: this.name, summaryValue, perFile };
  }

  /**
   * Returns the top N files with the highest debt marker count.
   */
  getDebtHotspots(
    files: AnalyzedFileData[],
    topN: number = 5
  ): Array<{ filePath: string; count: number }> {
    const result = this.analyze(files);

    return [...result.perFile.entries()]
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([filePath, count]) => ({ filePath, count }));
  }
}
