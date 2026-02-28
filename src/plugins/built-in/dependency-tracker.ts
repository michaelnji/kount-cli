import type { AnalyzedFileData, AnalyzerPlugin, PluginResult } from '../types.js';

/**
 * Pre-compiled regexes for maximum performance.
 *
 * ES6:  import ... from 'package'  OR  import 'package'
 * CJS:  require('package')
 *
 * Both patterns explicitly reject relative imports starting with . or /
 * using [^.'"/] as the first character of the captured package name.
 */
const ES6_IMPORT_RE = /import\s+(?:.*?\s+from\s+)?['"]([^.'"/][^'"]*)['"]/g;
const CJS_REQUIRE_RE = /require\s*\(\s*['"]([^.'"/][^'"]*)['"]\s*\)/g;

/**
 * Normalizes a raw import specifier to a canonical package name.
 *
 * - Scoped: `@org/pkg/lib/util` → `@org/pkg`
 * - Standard: `lodash/merge` → `lodash`
 * - Bare: `react` → `react`
 * - Node builtins: `node:fs` → `node:fs` (preserved as-is)
 */
function normalizePackageName(raw: string): string {
  // Scoped packages: @org/pkg/...
  if (raw.startsWith('@')) {
    const parts = raw.split('/');
    // @org/pkg → take first two segments
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : raw;
  }

  // Standard packages: pkg/subpath → pkg
  const slashIdx = raw.indexOf('/');
  if (slashIdx > 0) {
    return raw.substring(0, slashIdx);
  }

  return raw;
}

/**
 * Tracks external dependency imports across the codebase.
 *
 * Per-file: counts how many unique external packages are imported.
 * Global: builds a frequency map of package → import count.
 */
export class DependencyTrackerPlugin implements AnalyzerPlugin {
  readonly name = 'DependencyTracker';

  /** Global frequency map: package name → total import count across all files. */
  private globalDeps: Map<string, number> = new Map();

  analyze(files: AnalyzedFileData[]): PluginResult {
    const perFile = new Map<string, number>();
    this.globalDeps = new Map();

    for (const file of files) {
      const ext = file.extension.toLowerCase();

      // Only scan JS/TS/JSX/TSX files for import statements
      if (!['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'].includes(ext)) {
        perFile.set(file.filePath, 0);
        continue;
      }

      let fileImportCount = 0;

      for (const line of file.lines) {
        // ES6 imports
        ES6_IMPORT_RE.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = ES6_IMPORT_RE.exec(line)) !== null) {
          const pkg = normalizePackageName(match[1]);
          fileImportCount++;
          this.globalDeps.set(pkg, (this.globalDeps.get(pkg) ?? 0) + 1);
        }

        // CommonJS requires
        CJS_REQUIRE_RE.lastIndex = 0;
        while ((match = CJS_REQUIRE_RE.exec(line)) !== null) {
          const pkg = normalizePackageName(match[1]);
          fileImportCount++;
          this.globalDeps.set(pkg, (this.globalDeps.get(pkg) ?? 0) + 1);
        }
      }

      perFile.set(file.filePath, fileImportCount);
    }

    // summaryValue = total number of external imports across entire codebase
    let summaryValue = 0;
    for (const count of perFile.values()) {
      summaryValue += count;
    }

    return { pluginName: this.name, summaryValue, perFile };
  }

  /**
   * Returns the top N most-imported packages, sorted descending by count.
   */
  getTopDependencies(topN: number = 10): Array<{ name: string; count: number }> {
    return [...this.globalDeps.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([name, count]) => ({ name, count }));
  }
}
