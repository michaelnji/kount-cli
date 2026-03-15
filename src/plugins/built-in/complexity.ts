import type { AnalyzedFileData, AnalyzerPlugin, PluginResult } from '../types.js';

/**
 * C-style / JS / TS / Java / Go / Swift / Kotlin branching constructs.
 * Counts: if, else if, for, while, do, case (switch), catch, &&, ||, ??, ternary ?
 * Each match increments complexity by 1. Base is 1 per file.
 */
const C_STYLE_PATTERNS: RegExp[] = [
  /\bif\s*\(/g,
  /\belse\s+if\s*\(/g,
  /\bfor\s*\(/g,
  /\bwhile\s*\(/g,
  /\bdo\s*\{/g,
  /\bcase\s+[^:]+:/g,
  /\bcatch\s*\(/g,
  /&&/g,
  /\|\|/g,
  /\?\?/g,
  // Ternary: match standalone ? not preceded by ? (avoid ??)
  /(?<!\?)\?(?!\?)/g,
];

/** Python / Ruby branching constructs. */
const PYTHON_PATTERNS: RegExp[] = [
  /\bif\b/g,
  /\belif\b/g,
  /\bfor\b/g,
  /\bwhile\b/g,
  /\bexcept\b/g,
  /\band\b/g,
  /\bor\b/g,
];

/** Fallback for all other languages. */
const BASIC_PATTERNS: RegExp[] = [
  /\bif\b/g,
  /\bfor\b/g,
  /\bwhile\b/g,
];

const C_STYLE_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts',
  '.java', '.go', '.swift', '.kt', '.kts', '.c', '.cpp', '.cs', '.rs',
]);

const PYTHON_EXTS = new Set(['.py', '.rb']);

function getPatternsForExtension(ext: string): RegExp[] {
  if (C_STYLE_EXTS.has(ext)) return C_STYLE_PATTERNS;
  if (PYTHON_EXTS.has(ext)) return PYTHON_PATTERNS;
  return BASIC_PATTERNS;
}

/**
 * Counts cyclomatic complexity per file by counting branching constructs
 * on a line-by-line basis using language-aware regex patterns.
 * Base complexity = 1 per file.
 */
export class ComplexityPlugin implements AnalyzerPlugin {
  readonly name = 'Complexity';

  analyze(files: AnalyzedFileData[]): PluginResult {
    const perFile = new Map<string, number>();
    let summaryValue = 0;

    for (const file of files) {
      const patterns = getPatternsForExtension(file.extension.toLowerCase());
      let score = 1; // base complexity

      for (const line of file.lines) {
        for (const pattern of patterns) {
          pattern.lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = pattern.exec(line)) !== null) {
            score++;
          }
        }
      }

      perFile.set(file.filePath, score);
      summaryValue += score;
    }

    return { pluginName: this.name, summaryValue, perFile };
  }

  /**
   * Returns the top N files with the highest complexity scores.
   */
  getHighComplexityFiles(
    files: AnalyzedFileData[],
    topN: number = 5
  ): Array<{ filePath: string; score: number }> {
    const result = this.analyze(files);

    return [...result.perFile.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([filePath, score]) => ({ filePath, score }));
  }
}
