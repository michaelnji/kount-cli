import type { AnalyzedFileData, AnalyzerPlugin, PluginResult } from '../types.js';

const DEFAULT_TOP_N = 10;

/**
 * Identifies the largest files by byte size.
 * summaryValue = the size of the single largest file.
 * perFile = the size of each file (same as FileSize, but sorted/limited).
 */
export class LargestFilesPlugin implements AnalyzerPlugin {
  readonly name = 'LargestFiles';
  private topN: number;

  constructor(topN: number = DEFAULT_TOP_N) {
    this.topN = topN;
  }

  analyze(files: AnalyzedFileData[]): PluginResult {
    const sorted = [...files].sort((a, b) => b.size - a.size);
    const top = sorted.slice(0, this.topN);

    const perFile = new Map<string, number>();
    for (const file of top) {
      perFile.set(file.filePath, file.size);
    }

    const summaryValue = top.length > 0 ? top[0].size : 0;

    return { pluginName: this.name, summaryValue, perFile };
  }

  /**
   * Helper to get the ranked list, consumed by reporters.
   */
  getTopFiles(files: AnalyzedFileData[]): Array<{ filePath: string; size: number }> {
    return [...files]
      .sort((a, b) => b.size - a.size)
      .slice(0, this.topN)
      .map(f => ({ filePath: f.filePath, size: f.size }));
  }
}
