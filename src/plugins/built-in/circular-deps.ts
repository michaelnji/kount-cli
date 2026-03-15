import * as fs from 'node:fs';
import path from 'node:path';
import type { AnalyzedFileData, AnalyzerPlugin, PluginResult } from '../types.js';

const JS_TS_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts',
]);

/**
 * Matches both:
 *   import ... from './relative'
 *   import './relative'
 *   require('./relative')
 * Captures only relative paths (start with .)
 */
const RELATIVE_IMPORT_RE =
  /(?:import\s+(?:[\s\S]*?\s+from\s+)?|require\s*\(\s*)['"](\.[^'"]+)['"]/g;

/** Extensions to try when resolving an import with no extension. */
const RESOLVE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs', '.cts', '.cjs'];

/**
 * Attempts to resolve a relative import specifier to an absolute file path.
 * Returns null if the file cannot be found on disk.
 */
function resolveImport(fromDir: string, specifier: string): string | null {
  const base = path.resolve(fromDir, specifier);

  // 1. Exact path (already has extension)
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;

  // 2. Try appending known extensions
  for (const ext of RESOLVE_EXTS) {
    const candidate = base + ext;
    if (fs.existsSync(candidate)) return candidate;
  }

  // 3. Try index files inside a directory
  for (const ext of RESOLVE_EXTS) {
    const candidate = path.join(base, `index${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

/**
 * Detects circular import cycles in JS/TS files using DFS.
 *
 * Only relative imports are considered (external packages cannot form
 * project-internal cycles). Operates on already-parsed line data so no
 * additional file I/O is needed beyond what the aggregator already did.
 */
export class CircularDepsPlugin implements AnalyzerPlugin {
  readonly name = 'CircularDeps';

  private rootDir: string = '';
  private cycles: Array<string[]> = [];

  /**
   * Called by the Aggregator before analyze() so path resolution works.
   */
  setRootDir(dir: string): void {
    this.rootDir = dir;
  }

  analyze(files: AnalyzedFileData[]): PluginResult {
    this.cycles = [];

    // Only process JS/TS files
    const jsFiles = files.filter(f => JS_TS_EXTS.has(f.extension.toLowerCase()));

    // Build a Set of known file paths for fast membership checks
    const knownPaths = new Set(jsFiles.map(f => f.filePath));

    // Build adjacency list: filePath → [imported absolute paths]
    const graph = new Map<string, string[]>();

    for (const file of jsFiles) {
      const imports: string[] = [];
      const dir = path.dirname(file.filePath);

      for (const line of file.lines) {
        RELATIVE_IMPORT_RE.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = RELATIVE_IMPORT_RE.exec(line)) !== null) {
          const resolved = resolveImport(dir, match[1]);
          if (resolved && knownPaths.has(resolved)) {
            imports.push(resolved);
          }
        }
      }

      graph.set(file.filePath, imports);
    }

    // DFS cycle detection
    const visited = new Set<string>();
    const stack: string[] = [];
    const onStack = new Set<string>();

    const dfs = (node: string): void => {
      if (onStack.has(node)) {
        // Found a cycle — extract the cycle portion of the stack
        const cycleStart = stack.indexOf(node);
        if (cycleStart !== -1) {
          this.cycles.push([...stack.slice(cycleStart), node]);
        }
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      onStack.add(node);
      stack.push(node);

      for (const neighbor of graph.get(node) ?? []) {
        dfs(neighbor);
      }

      stack.pop();
      onStack.delete(node);
    };

    for (const filePath of graph.keys()) {
      if (!visited.has(filePath)) {
        dfs(filePath);
      }
    }

    const perFile = new Map<string, number>();
    for (const [filePath] of graph) {
      perFile.set(filePath, 0);
    }

    return {
      pluginName: this.name,
      summaryValue: this.cycles.length,
      perFile,
    };
  }

  /**
   * Returns all detected circular import cycles.
   * Each cycle is an array of absolute file paths forming the loop.
   * Call after analyze().
   */
  getCycles(): Array<string[]> {
    return this.cycles;
  }
}
