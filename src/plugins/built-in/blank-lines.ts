import type { AnalyzedFileData, AnalyzerPlugin, PluginResult } from '../types.js';

/**
 * Counts blank (empty or whitespace-only) lines across all scanned files.
 */
export class BlankLinesPlugin implements AnalyzerPlugin {
  readonly name = 'BlankLines';

  analyze(files: AnalyzedFileData[]): PluginResult {
    const perFile = new Map<string, number>();
    let summaryValue = 0;

    for (const file of files) {
      let blankCount = 0;
      for (const line of file.lines) {
        if (line.trim() === '') {
          blankCount++;
        }
      }
      perFile.set(file.filePath, blankCount);
      summaryValue += blankCount;
    }

    return { pluginName: this.name, summaryValue, perFile };
  }
}
