import type { AnalyzedFileData, AnalyzerPlugin, PluginResult } from '../types.js';

/**
 * Counts total number of files scanned.
 */
export class TotalFilesPlugin implements AnalyzerPlugin {
  readonly name = 'TotalFiles';

  analyze(files: AnalyzedFileData[]): PluginResult {
    const perFile = new Map<string, number>();

    for (const file of files) {
      perFile.set(file.filePath, 1);
    }

    return { pluginName: this.name, summaryValue: files.length, perFile };
  }
}
