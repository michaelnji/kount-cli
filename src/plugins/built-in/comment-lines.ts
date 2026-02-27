import { getCommentSyntax } from '../../utils/language-map.js';
import type { AnalyzedFileData, AnalyzerPlugin, PluginResult } from '../types.js';

/**
 * Counts comment lines across all scanned files.
 * Handles single-line comments (//, #, --, ;) and block comments (/* *​/, <!-- -->).
 */
export class CommentLinesPlugin implements AnalyzerPlugin {
  readonly name = 'CommentLines';

  analyze(files: AnalyzedFileData[]): PluginResult {
    const perFile = new Map<string, number>();
    let summaryValue = 0;

    for (const file of files) {
      const commentCount = this.countComments(file);
      perFile.set(file.filePath, commentCount);
      summaryValue += commentCount;
    }

    return { pluginName: this.name, summaryValue, perFile };
  }

  private countComments(file: AnalyzedFileData): number {
    const syntaxes = getCommentSyntax(file.extension);
    if (syntaxes.length === 0) return 0;

    // Separate single-line and block comment markers
    const singleLineMarkers: string[] = [];
    const blockMarkers: Array<{ open: string; close: string }> = [];

    for (const syntax of syntaxes) {
      if (syntax.includes(' ')) {
        // Block comment syntax like '/* */' or '<!-- -->'
        const parts = syntax.split(' ');
        if (parts.length === 2) {
          blockMarkers.push({ open: parts[0], close: parts[1] });
        }
      } else {
        // Single-line comment syntax like '//' or '#'
        singleLineMarkers.push(syntax);
      }
    }

    let commentCount = 0;
    let inBlockComment = false;
    let currentBlockClose = '';

    for (const line of file.lines) {
      const trimmed = line.trim();

      if (inBlockComment) {
        commentCount++;
        if (trimmed.includes(currentBlockClose)) {
          inBlockComment = false;
          currentBlockClose = '';
        }
        continue;
      }

      // Check for block comment opening
      let isBlockStart = false;
      for (const block of blockMarkers) {
        if (trimmed.includes(block.open)) {
          commentCount++;
          isBlockStart = true;
          // Check if block closes on the same line
          const afterOpen = trimmed.substring(trimmed.indexOf(block.open) + block.open.length);
          if (!afterOpen.includes(block.close)) {
            inBlockComment = true;
            currentBlockClose = block.close;
          }
          break;
        }
      }

      if (isBlockStart) continue;

      // Check for single-line comments
      for (const marker of singleLineMarkers) {
        if (trimmed.startsWith(marker)) {
          commentCount++;
          break;
        }
      }
    }

    return commentCount;
  }
}
