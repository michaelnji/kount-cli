import type { AnalyzedFileData, AnalyzerPlugin, PluginResult } from '../types.js';

/**
 * Counts total lines across all scanned files.
 */
export class TotalLinesPlugin implements AnalyzerPlugin {
  readonly name = 'TotalLines';

  analyze(files: AnalyzedFileData[]): PluginResult {
    const perFile = new Map<string, number>();
    let summaryValue = 0;

    for (const file of files) {
      const lineCount = file.lines.length;
      perFile.set(file.filePath, lineCount);
      summaryValue += lineCount;
    }

    return { pluginName: this.name, summaryValue, perFile };
  }
}
