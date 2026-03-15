import { describe, expect, it } from 'vitest';
import { AuthorMetricsPlugin } from '../src/plugins/built-in/author-metrics';
import { BlankLinesPlugin } from '../src/plugins/built-in/blank-lines';
import { CircularDepsPlugin } from '../src/plugins/built-in/circular-deps';
import { CodeChurnPlugin } from '../src/plugins/built-in/code-churn';
import { CommentLinesPlugin } from '../src/plugins/built-in/comment-lines';
import { ComplexityPlugin } from '../src/plugins/built-in/complexity';
import { DebtTrackerPlugin } from '../src/plugins/built-in/debt-tracker';
import { DependencyTrackerPlugin } from '../src/plugins/built-in/dependency-tracker';
import { FileSizePlugin } from '../src/plugins/built-in/file-size';
import { LanguageDistributionPlugin } from '../src/plugins/built-in/language-distribution';
import { LargestFilesPlugin } from '../src/plugins/built-in/largest-files';
import { TechDebtPlugin } from '../src/plugins/built-in/tech-debt';
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

describe('CodeChurnPlugin', () => {
  const fileWith5Commits = makeFile('/project/src/hot.ts', '.ts', ['code']);
  fileWith5Commits.commits = 5;

  const fileWith2Commits = makeFile('/project/src/warm.ts', '.ts', ['code']);
  fileWith2Commits.commits = 2;

  const fileWithNoCommits = makeFile('/project/src/cold.ts', '.ts', ['code']);

  it('should read commits from AnalyzedFileData', () => {
    const plugin = new CodeChurnPlugin();
    const result = plugin.analyze([fileWith5Commits, fileWith2Commits, fileWithNoCommits]);

    expect(result.pluginName).toBe('CodeChurn');
    expect(result.perFile.get(fileWith5Commits.filePath)).toBe(5);
    expect(result.perFile.get(fileWith2Commits.filePath)).toBe(2);
    expect(result.perFile.get(fileWithNoCommits.filePath)).toBe(0);
    expect(result.summaryValue).toBe(7);
  });

  it('should return high-churn files sorted by commits descending', () => {
    const plugin = new CodeChurnPlugin();
    const highChurn = plugin.getHighChurnFiles([fileWith5Commits, fileWith2Commits, fileWithNoCommits]);

    expect(highChurn.length).toBe(2); // cold.ts excluded (0 commits)
    expect(highChurn[0].filePath).toBe(fileWith5Commits.filePath);
    expect(highChurn[0].commits).toBe(5);
    expect(highChurn[1].filePath).toBe(fileWith2Commits.filePath);
  });

  it('should handle files with no commits field', () => {
    const plugin = new CodeChurnPlugin();
    const result = plugin.analyze([fileWithNoCommits]);

    expect(result.perFile.get(fileWithNoCommits.filePath)).toBe(0);
    expect(result.summaryValue).toBe(0);
  });
});

describe('AuthorMetricsPlugin', () => {
  it('should store and return injected author data', () => {
    const plugin = new AuthorMetricsPlugin();
    const authors = [
      { name: 'Alice', commits: 100 },
      { name: 'Bob', commits: 50 },
    ];
    plugin.setAuthors(authors);

    const result = plugin.analyze([]);
    expect(result.pluginName).toBe('AuthorMetrics');
    expect(result.summaryValue).toBe(150);
    expect(result.perFile.size).toBe(0); // repo-level metric
  });

  it('should return top authors via accessor', () => {
    const plugin = new AuthorMetricsPlugin();
    const authors = [
      { name: 'Alice', commits: 100 },
      { name: 'Bob', commits: 50 },
    ];
    plugin.setAuthors(authors);
    plugin.analyze([]);

    const topAuthors = plugin.getTopAuthors();
    expect(topAuthors).toEqual(authors);
  });

  it('should return 0 summaryValue with no authors', () => {
    const plugin = new AuthorMetricsPlugin();
    const result = plugin.analyze([]);

    expect(result.summaryValue).toBe(0);
    expect(plugin.getTopAuthors()).toEqual([]);
  });
});

describe('TechDebtPlugin', () => {
  it('should calculate debt score using formula (lines + churn*10) / max(commentRatio, 1)', () => {
    const plugin = new TechDebtPlugin();
    const file = makeFile('/project/src/main.ts', '.ts', Array(100).fill('code'));
    file.commits = 5;

    // Inject comment data: 10 comment lines out of 100 = 10% ratio
    plugin.setCommentData(new Map([['/project/src/main.ts', 10]]));
    const result = plugin.analyze([file]);

    // Score = (100 + 5*10) / max(10, 1) = 150 / 10 = 15
    expect(result.perFile.get('/project/src/main.ts')).toBe(15);
    expect(result.summaryValue).toBe(15);
  });

  it('should treat missing churn as 0', () => {
    const plugin = new TechDebtPlugin();
    const file = makeFile('/project/src/utils.ts', '.ts', Array(50).fill('code'));
    // No commits field

    plugin.setCommentData(new Map([['/project/src/utils.ts', 5]]));
    const result = plugin.analyze([file]);

    // Score = (50 + 0*10) / max(10, 1) = 50 / 10 = 5
    expect(result.perFile.get('/project/src/utils.ts')).toBe(5);
  });

  it('should use max(commentRatio, 1) to avoid division by zero', () => {
    const plugin = new TechDebtPlugin();
    const file = makeFile('/project/src/hot.ts', '.ts', Array(200).fill('code'));
    file.commits = 10;

    // No comment data = 0% comment ratio
    const result = plugin.analyze([file]);

    // Score = (200 + 100) / max(0, 1) = 300 / 1 = 300
    expect(result.perFile.get('/project/src/hot.ts')).toBe(300);
  });

  it('should return highest debt files via accessor', () => {
    const plugin = new TechDebtPlugin();
    const file1 = makeFile('/project/a.ts', '.ts', Array(200).fill('code'));
    file1.commits = 10;
    const file2 = makeFile('/project/b.ts', '.ts', Array(10).fill('code'));

    const top = plugin.getHighestDebtFiles([file1, file2], 1);
    expect(top).toHaveLength(1);
    expect(top[0].filePath).toBe('/project/a.ts');
    expect(top[0].score).toBeGreaterThan(0);
  });
});

describe('DependencyTrackerPlugin', () => {
  const importFile = makeFile('/project/src/app.ts', '.ts', [
    "import React from 'react';",
    "import { Box, Text } from 'ink';",
    "import path from 'node:path';",
    "import { foo } from './utils/foo';",        // relative — should be ignored
    "import bar from '../bar';",                  // relative — should be ignored
    "import type { X } from '@mui/material/Button';",
    "const lodash = require('lodash/merge');",
    "const fs = require('node:fs');",
    "const local = require('./local');",          // relative — should be ignored
    "const abs = require('/absolute/path');",     // absolute — should be ignored
  ]);

  const cjsFile = makeFile('/project/src/server.js', '.js', [
    "const express = require('express');",
    "const cors = require('cors');",
    "const app = require('./app');",              // relative — should be ignored
  ]);

  const pyFile = makeFile('/project/scripts/run.py', '.py', [
    'import os',
    'from pathlib import Path',
  ]);

  it('should detect ES6 and CJS imports from external packages', () => {
    const plugin = new DependencyTrackerPlugin();
    const result = plugin.analyze([importFile]);

    // Expected: react, ink, node:path, @mui/material, lodash, node:fs = 6
    expect(result.perFile.get(importFile.filePath)).toBe(6);
    expect(result.summaryValue).toBe(6);
  });

  it('should ignore relative imports starting with . or /', () => {
    const plugin = new DependencyTrackerPlugin();
    plugin.analyze([importFile]);

    const deps = plugin.getTopDependencies(20);
    const depNames = deps.map(d => d.name);

    // These should NOT appear
    expect(depNames).not.toContain('./utils/foo');
    expect(depNames).not.toContain('../bar');
    expect(depNames).not.toContain('./local');
    expect(depNames).not.toContain('/absolute/path');
  });

  it('should normalize scoped packages correctly', () => {
    const plugin = new DependencyTrackerPlugin();
    plugin.analyze([importFile]);

    const deps = plugin.getTopDependencies(20);
    const depNames = deps.map(d => d.name);

    // @mui/material/Button → @mui/material
    expect(depNames).toContain('@mui/material');
    // lodash/merge → lodash
    expect(depNames).toContain('lodash');
  });

  it('should return 0 for non-JS/TS files', () => {
    const plugin = new DependencyTrackerPlugin();
    const result = plugin.analyze([pyFile]);

    expect(result.perFile.get(pyFile.filePath)).toBe(0);
    expect(result.summaryValue).toBe(0);
  });

  it('should aggregate across multiple files', () => {
    const plugin = new DependencyTrackerPlugin();
    const result = plugin.analyze([importFile, cjsFile]);

    // importFile: 6, cjsFile: 2 (express, cors)
    expect(result.perFile.get(importFile.filePath)).toBe(6);
    expect(result.perFile.get(cjsFile.filePath)).toBe(2);
    expect(result.summaryValue).toBe(8);
  });

  it('should return top dependencies sorted by frequency', () => {
    // Create a file that imports 'react' twice
    const multiImport = makeFile('/project/src/multi.tsx', '.tsx', [
      "import React from 'react';",
      "import { useState } from 'react';",
      "import { Box } from 'ink';",
    ]);

    const plugin = new DependencyTrackerPlugin();
    plugin.analyze([multiImport]);

    const top = plugin.getTopDependencies(5);
    expect(top[0].name).toBe('react');
    expect(top[0].count).toBe(2);
    expect(top[1].name).toBe('ink');
    expect(top[1].count).toBe(1);
  });

  it('should handle empty file list', () => {
    const plugin = new DependencyTrackerPlugin();
    const result = plugin.analyze([]);

    expect(result.summaryValue).toBe(0);
    expect(result.perFile.size).toBe(0);
    expect(plugin.getTopDependencies()).toEqual([]);
  });
});

describe('ComplexityPlugin', () => {
  it('should assign base complexity of 1 to a file with no branches', () => {
    const plugin = new ComplexityPlugin();
    const simple = makeFile('/project/src/simple.ts', '.ts', [
      'const x = 1;',
      'export default x;',
    ]);
    const result = plugin.analyze([simple]);

    expect(result.pluginName).toBe('Complexity');
    expect(result.perFile.get(simple.filePath)).toBe(1);
    expect(result.summaryValue).toBe(1);
  });

  it('should count if/for/while/catch branches in C-style files', () => {
    const plugin = new ComplexityPlugin();
    const branchy = makeFile('/project/src/branchy.ts', '.ts', [
      'if (a) {',          // +1
      '  for (let i = 0; i < 10; i++) {', // +1
      '    while (true) {', // +1
      '      break;',
      '    }',
      '  }',
      '}',
      'try {} catch (e) {}', // +1
    ]);
    const result = plugin.analyze([branchy]);

    // base(1) + if(1) + for(1) + while(1) + catch(1) = 5
    expect(result.perFile.get(branchy.filePath)).toBe(5);
  });

  it('should count logical operators as branches', () => {
    const plugin = new ComplexityPlugin();
    const logical = makeFile('/project/src/logical.ts', '.ts', [
      'const a = x && y || z ?? w;', // && +1, || +1, ?? +1
    ]);
    const result = plugin.analyze([logical]);

    // base(1) + &&(1) + ||(1) + ??(1) = 4
    expect(result.perFile.get(logical.filePath)).toBe(4);
  });

  it('should not double-count ?? as a ternary ?', () => {
    const plugin = new ComplexityPlugin();
    const nullish = makeFile('/project/src/nullish.ts', '.ts', [
      'const a = b ?? c;', // one ?? only
    ]);
    const result = plugin.analyze([nullish]);

    // base(1) + ??(1) = 2; ternary pattern must NOT match here
    expect(result.perFile.get(nullish.filePath)).toBe(2);
  });

  it('should use Python patterns for .py files', () => {
    const plugin = new ComplexityPlugin();
    const pyScript = makeFile('/project/scripts/algo.py', '.py', [
      'if x:',         // +1
      '    pass',
      'elif y:',       // +1
      '    pass',
      'for i in lst:', // +1
      '    pass',
    ]);
    const result = plugin.analyze([pyScript]);

    // base(1) + if(1) + elif(1) + for(1) = 4
    expect(result.perFile.get(pyScript.filePath)).toBe(4);
  });

  it('should sum complexity across all files', () => {
    const plugin = new ComplexityPlugin();
    const f1 = makeFile('/project/a.ts', '.ts', ['if (x) {}']); // 1+1=2
    const f2 = makeFile('/project/b.ts', '.ts', ['const y = 1;']); // 1
    const result = plugin.analyze([f1, f2]);

    expect(result.summaryValue).toBe(3);
  });

  it('should return highest complexity files via getHighComplexityFiles', () => {
    const plugin = new ComplexityPlugin();
    const complex = makeFile('/project/c.ts', '.ts', [
      'if (a) { for (;;) { while (b) {} } }', // +if +for +while = base+3=4
    ]);
    const simple = makeFile('/project/s.ts', '.ts', ['const x = 1;']); // 1

    const top = plugin.getHighComplexityFiles([simple, complex], 1);
    expect(top).toHaveLength(1);
    expect(top[0].filePath).toBe(complex.filePath);
    expect(top[0].score).toBeGreaterThan(top.length > 0 ? 1 : 0);
  });

  it('should handle empty file list', () => {
    const plugin = new ComplexityPlugin();
    const result = plugin.analyze([]);

    expect(result.summaryValue).toBe(0);
    expect(result.perFile.size).toBe(0);
  });
});

describe('CircularDepsPlugin', () => {
  it('should have name "CircularDeps"', () => {
    const plugin = new CircularDepsPlugin();
    expect(plugin.name).toBe('CircularDeps');
  });

  it('should return empty cycles for an empty file list', () => {
    const plugin = new CircularDepsPlugin();
    plugin.setRootDir('/project');
    const result = plugin.analyze([]);

    expect(result.pluginName).toBe('CircularDeps');
    expect(result.summaryValue).toBe(0);
    expect(plugin.getCycles()).toEqual([]);
  });

  it('should skip non-JS/TS files and return empty perFile for them', () => {
    const plugin = new CircularDepsPlugin();
    plugin.setRootDir('/project');
    const pyFile = makeFile('/project/script.py', '.py', [
      "import os",
      "from pathlib import Path",
    ]);
    const result = plugin.analyze([pyFile]);

    expect(result.perFile.size).toBe(0);
    expect(result.summaryValue).toBe(0);
    expect(plugin.getCycles()).toEqual([]);
  });

  it('should detect no cycles when all imports are external packages', () => {
    const plugin = new CircularDepsPlugin();
    plugin.setRootDir('/project');
    const file = makeFile('/project/src/app.ts', '.ts', [
      "import React from 'react';",
      "import { Box } from 'ink';",
    ]);
    const result = plugin.analyze([file]);

    // No relative imports → no edges → no cycles
    expect(result.summaryValue).toBe(0);
    expect(plugin.getCycles()).toEqual([]);
  });

  it('should detect no cycles for unresolvable relative imports', () => {
    // Files reference each other but the paths don't exist on disk,
    // so resolveImport returns null and no edges are added.
    const plugin = new CircularDepsPlugin();
    plugin.setRootDir('/nonexistent');
    const a = makeFile('/nonexistent/src/a.ts', '.ts', [
      "import { b } from './b';",
    ]);
    const b = makeFile('/nonexistent/src/b.ts', '.ts', [
      "import { a } from './a';",
    ]);
    const result = plugin.analyze([a, b]);

    // Files don't exist on disk → resolveImport returns null → no graph edges
    expect(result.summaryValue).toBe(0);
    expect(plugin.getCycles()).toEqual([]);
  });

  it('should include JS/TS files in perFile map', () => {
    const plugin = new CircularDepsPlugin();
    plugin.setRootDir('/project');
    const file = makeFile('/project/src/utils.ts', '.ts', ['const x = 1;']);
    const result = plugin.analyze([file]);

    expect(result.perFile.has(file.filePath)).toBe(true);
  });

  it('should reset cycles on each analyze() call', () => {
    const plugin = new CircularDepsPlugin();
    plugin.setRootDir('/project');
    const files = [makeFile('/project/src/a.ts', '.ts', ['export const a = 1;'])];

    plugin.analyze(files);
    plugin.analyze(files); // second run

    // Should not accumulate cycles across runs
    expect(plugin.getCycles()).toEqual([]);
  });
});
