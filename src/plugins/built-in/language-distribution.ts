import type { AnalyzedFileData, AnalyzerPlugin, PluginResult } from '../types.js';

/**
 * Known extension-to-language name mappings.
 */
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  '.js': 'JavaScript',
  '.jsx': 'JavaScript (JSX)',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript (TSX)',
  '.py': 'Python',
  '.rb': 'Ruby',
  '.java': 'Java',
  '.c': 'C',
  '.cpp': 'C++',
  '.cs': 'C#',
  '.go': 'Go',
  '.rs': 'Rust',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
  '.dart': 'Dart',
  '.scala': 'Scala',
  '.php': 'PHP',
  '.html': 'HTML',
  '.htm': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.less': 'LESS',
  '.xml': 'XML',
  '.svg': 'SVG',
  '.json': 'JSON',
  '.jsonc': 'JSONC',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.md': 'Markdown',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',
  '.sql': 'SQL',
  '.lua': 'Lua',
  '.r': 'R',
  '.m': 'Objective-C',
  '.mm': 'Objective-C++',
  '.pl': 'Perl',
  '.pm': 'Perl',
  '.hs': 'Haskell',
  '.lisp': 'Lisp',
  '.clj': 'Clojure',
  '.scm': 'Scheme',
  '.vue': 'Vue',
  '.toml': 'TOML',
  '.ini': 'INI',
  '.cfg': 'Config',
  '.ps1': 'PowerShell',
  '.ada': 'Ada',
  '.vhdl': 'VHDL',
};

/**
 * Computes language distribution across all scanned files.
 * The perFile map stores a value of 1 for each file (used for counting),
 * while summaryValue is the number of distinct languages found.
 */
export class LanguageDistributionPlugin implements AnalyzerPlugin {
  readonly name = 'LanguageDistribution';

  analyze(files: AnalyzedFileData[]): PluginResult {
    const langCounts = new Map<string, number>();
    const perFile = new Map<string, number>();

    for (const file of files) {
      const ext = file.extension.toLowerCase();
      const language = EXTENSION_TO_LANGUAGE[ext] || 'Other';
      langCounts.set(language, (langCounts.get(language) || 0) + 1);
      perFile.set(file.filePath, 1);
    }

    // summaryValue = number of distinct languages
    return { pluginName: this.name, summaryValue: langCounts.size, perFile };
  }

  /**
   * Helper to retrieve the full language distribution map.
   * Called by the aggregator after analyze().
   */
  getDistribution(files: AnalyzedFileData[]): Map<string, number> {
    const langCounts = new Map<string, number>();
    for (const file of files) {
      const ext = file.extension.toLowerCase();
      const language = EXTENSION_TO_LANGUAGE[ext] || 'Other';
      langCounts.set(language, (langCounts.get(language) || 0) + 1);
    }
    return langCounts;
  }
}
