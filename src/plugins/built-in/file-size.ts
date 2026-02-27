import type { AnalyzedFileData, AnalyzerPlugin, PluginResult } from '../types.js';

/**
 * Computes total file size (bytes) across all scanned files.
 */
export class FileSizePlugin implements AnalyzerPlugin {
  readonly name = 'FileSize';

  analyze(files: AnalyzedFileData[]): PluginResult {
    const perFile = new Map<string, number>();
    let summaryValue = 0;

    for (const file of files) {
      perFile.set(file.filePath, file.size);
      summaryValue += file.size;
    }

    return { pluginName: this.name, summaryValue, perFile };
  }
}
