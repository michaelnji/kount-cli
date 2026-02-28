import { describe, expect, it } from 'vitest';
import { BlankLinesPlugin } from '../src/plugins/built-in/blank-lines';
import { CommentLinesPlugin } from '../src/plugins/built-in/comment-lines';
import { DebtTrackerPlugin } from '../src/plugins/built-in/debt-tracker';
import { FileSizePlugin } from '../src/plugins/built-in/file-size';
import { LanguageDistributionPlugin } from '../src/plugins/built-in/language-distribution';
import { LargestFilesPlugin } from '../src/plugins/built-in/largest-files';
import { TotalFilesPlugin } from '../src/plugins/built-in/total-files';
import { TotalLinesPlugin } from '../src/plugins/built-in/total-lines';
import type { AnalyzedFileData } from '../src/plugins/types';

// --- Helpers ---

function makeFile(
  filePath: string,
  extension: string,
  lines: string[],
  size?: number
): AnalyzedFileData {
  return {
    filePath,
    extension,
    lines,
    size: size ?? lines.join('\n').length,
  };
}

// --- Test Data ---

const tsFile = makeFile('/project/src/index.ts', '.ts', [
  '// This is a comment',
  'const x = 1;',
  '',
  '/* Block comment */',
  'export default x;',
  '',
]);

const pyFile = makeFile('/project/scripts/run.py', '.py', [
  '# Python comment',
  'import os',
  '',
  'def main():',
  '    # inline comment',
  '    pass',
]);

const htmlFile = makeFile('/project/public/index.html', '.html', [
  '<!DOCTYPE html>',
  '<!-- This is a comment -->',
  '<html>',
  '<!-- Multi',
  '     line comment -->',
  '</html>',
]);

const emptyFile = makeFile('/project/src/empty.ts', '.ts', [], 0);

const allFiles = [tsFile, pyFile, htmlFile, emptyFile];

// --- Tests ---

describe('TotalLinesPlugin', () => {
  it('should count total lines per file and overall', () => {
    const plugin = new TotalLinesPlugin();
    const result = plugin.analyze(allFiles);

    expect(result.pluginName).toBe('TotalLines');
    expect(result.perFile.get(tsFile.filePath)).toBe(6);
    expect(result.perFile.get(pyFile.filePath)).toBe(6);
    expect(result.perFile.get(htmlFile.filePath)).toBe(6);
    expect(result.perFile.get(emptyFile.filePath)).toBe(0);
    expect(result.summaryValue).toBe(18);
  });
});

describe('BlankLinesPlugin', () => {
  it('should count blank/whitespace-only lines', () => {
    const plugin = new BlankLinesPlugin();
    const result = plugin.analyze(allFiles);

    expect(result.pluginName).toBe('BlankLines');
    expect(result.perFile.get(tsFile.filePath)).toBe(2); // lines 3 and 6
    expect(result.perFile.get(pyFile.filePath)).toBe(1); // line 3
    expect(result.perFile.get(htmlFile.filePath)).toBe(0);
    expect(result.perFile.get(emptyFile.filePath)).toBe(0);
    expect(result.summaryValue).toBe(3);
  });
});

describe('CommentLinesPlugin', () => {
  it('should detect single-line // comments in TypeScript', () => {
    const plugin = new CommentLinesPlugin();
    const result = plugin.analyze([tsFile]);

    // '// This is a comment' + '/* Block comment */'
    expect(result.perFile.get(tsFile.filePath)).toBe(2);
  });

  it('should detect # comments in Python', () => {
    const plugin = new CommentLinesPlugin();
    const result = plugin.analyze([pyFile]);

    // '# Python comment' + '    # inline comment'
    expect(result.perFile.get(pyFile.filePath)).toBe(2);
  });

  it('should detect <!-- --> comments in HTML including multi-line', () => {
    const plugin = new CommentLinesPlugin();
    const result = plugin.analyze([htmlFile]);

    // '<!-- This is a comment -->' + '<!-- Multi' + '     line comment -->'
    expect(result.perFile.get(htmlFile.filePath)).toBe(3);
  });

  it('should return 0 for files with unknown extensions', () => {
    const unknownFile = makeFile('/project/data.xyz', '.xyz', [
      '// not a comment for unknown',
      '# also not',
    ]);
    const plugin = new CommentLinesPlugin();
    const result = plugin.analyze([unknownFile]);
    expect(result.perFile.get(unknownFile.filePath)).toBe(0);
  });
});

describe('FileSizePlugin', () => {
  it('should sum file sizes', () => {
    const plugin = new FileSizePlugin();
    const result = plugin.analyze(allFiles);

    expect(result.pluginName).toBe('FileSize');
    expect(result.perFile.get(emptyFile.filePath)).toBe(0);
    expect(result.summaryValue).toBe(
      allFiles.reduce((acc, f) => acc + f.size, 0)
    );
  });
});

describe('TotalFilesPlugin', () => {
  it('should count total files', () => {
    const plugin = new TotalFilesPlugin();
    const result = plugin.analyze(allFiles);

    expect(result.pluginName).toBe('TotalFiles');
    expect(result.summaryValue).toBe(4);
  });
});

describe('LanguageDistributionPlugin', () => {
  it('should group files by language', () => {
    const plugin = new LanguageDistributionPlugin();
    const result = plugin.analyze(allFiles);

    expect(result.pluginName).toBe('LanguageDistribution');

    const distribution = plugin.getDistribution(allFiles);
    expect(distribution.get('TypeScript')).toBe(2); // index.ts + empty.ts
    expect(distribution.get('Python')).toBe(1);
    expect(distribution.get('HTML')).toBe(1);
  });
});

describe('LargestFilesPlugin', () => {
  it('should return files sorted by size descending', () => {
    const plugin = new LargestFilesPlugin(2);
    const result = plugin.analyze(allFiles);

    expect(result.pluginName).toBe('LargestFiles');
    // perFile should only contain top 2
    expect(result.perFile.size).toBe(2);

    const topFiles = plugin.getTopFiles(allFiles);
    expect(topFiles.length).toBe(2);
    expect(topFiles[0].size).toBeGreaterThanOrEqual(topFiles[1].size);
  });

  it('should handle empty file list', () => {
    const plugin = new LargestFilesPlugin();
    const result = plugin.analyze([]);

    expect(result.summaryValue).toBe(0);
    expect(result.perFile.size).toBe(0);
  });
});

describe('DebtTrackerPlugin', () => {
  const debtFile1 = makeFile('/project/src/main.ts', '.ts', [
    '// TODO: refactor this function',
    'const x = 1;',
    '// FIXME: broken edge case',
    'export default x;',
    '// HACK: temporary workaround',
    '',
  ]);

  const debtFile2 = makeFile('/project/src/utils.ts', '.ts', [
    '// todo: lowercase marker',
    'function foo() {}',
    '// Todo: mixed case',
  ]);

  const cleanFile = makeFile('/project/src/clean.ts', '.ts', [
    'const y = 2;',
    'export default y;',
  ]);

  it('should detect TODO:, FIXME:, and HACK: markers (case-insensitive)', () => {
    const plugin = new DebtTrackerPlugin();
    const result = plugin.analyze([debtFile1, debtFile2, cleanFile]);

    expect(result.pluginName).toBe('DebtTracker');
    expect(result.perFile.get(debtFile1.filePath)).toBe(3);
    expect(result.perFile.get(debtFile2.filePath)).toBe(2);
    expect(result.perFile.get(cleanFile.filePath)).toBe(0);
    expect(result.summaryValue).toBe(5);
  });

  it('should return 0 for files with no debt markers', () => {
    const plugin = new DebtTrackerPlugin();
    const result = plugin.analyze([cleanFile]);

    expect(result.perFile.get(cleanFile.filePath)).toBe(0);
    expect(result.summaryValue).toBe(0);
  });

  it('should return debt hotspots sorted by count descending', () => {
    const plugin = new DebtTrackerPlugin();
    const hotspots = plugin.getDebtHotspots([debtFile1, debtFile2, cleanFile]);

    expect(hotspots.length).toBe(2); // cleanFile has 0 so it's excluded
    expect(hotspots[0].filePath).toBe(debtFile1.filePath);
    expect(hotspots[0].count).toBe(3);
    expect(hotspots[1].filePath).toBe(debtFile2.filePath);
    expect(hotspots[1].count).toBe(2);
  });

  it('should handle empty file list', () => {
    const plugin = new DebtTrackerPlugin();
    const result = plugin.analyze([]);

    expect(result.summaryValue).toBe(0);
    expect(result.perFile.size).toBe(0);
  });

  it('should not match markers without the colon', () => {
    const noColonFile = makeFile('/project/src/nocolon.ts', '.ts', [
      '// TODO refactor later',
      '// FIXME this is broken',
      '// HACK around the issue',
    ]);
    const plugin = new DebtTrackerPlugin();
    const result = plugin.analyze([noColonFile]);

    expect(result.perFile.get(noColonFile.filePath)).toBe(0);
  });
});
