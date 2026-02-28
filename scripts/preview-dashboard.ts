import fs from 'node:fs';
import { generateHtmlDashboard } from '../src/reporters/html.js';

const stats = {
  totalFiles: 42,
  rootDir: '/Users/michaelnji/Projects/kount',
  scannedAt: new Date(),
  languageDistribution: new Map([
    ['TypeScript', 28],
    ['JavaScript', 8],
    ['JSON', 4],
    ['Markdown', 2]
  ]),
  largestFiles: [
    { filePath: '/Users/michaelnji/Projects/kount/src/reporters/html-template.ts', size: 18200 },
    { filePath: '/Users/michaelnji/Projects/kount/src/core/aggregator.ts', size: 8500 },
    { filePath: '/Users/michaelnji/Projects/kount/tests/reporters.test.ts', size: 7200 },
  ],
  debtHotspots: [
    { filePath: '/Users/michaelnji/Projects/kount/src/core/aggregator.ts', count: 5 },
    { filePath: '/Users/michaelnji/Projects/kount/src/index.tsx', count: 3 },
  ],
  gitInsights: {
    diffBranch: 'main',
    topAuthors: [{ name: 'Michael', commits: 85, percentage: 100 }],
    highChurnFiles: [{ filePath: '/Users/michaelnji/Projects/kount/src/reporters/html.ts', commits: 12 }],
  },
  techDebtScore: 42.5,
  highDebtFiles: [{ filePath: '/Users/michaelnji/Projects/kount/src/reporters/html-template.ts', score: 28.3 }],
  trends: { totalFiles: 2, totalLines: 150, codeLines: 120, commentLines: 10, blankLines: 20, codeRatio: '1.2' },
  pluginResults: new Map([
    ['TotalLines', { summaryValue: 8500, perFile: new Map([
      ['/Users/michaelnji/Projects/kount/src/reporters/html-template.ts', 554],
      ['/Users/michaelnji/Projects/kount/src/core/aggregator.ts', 280],
      ['/Users/michaelnji/Projects/kount/src/index.tsx', 120],
    ]) }],
    ['BlankLines', { summaryValue: 850, perFile: new Map([
      ['/Users/michaelnji/Projects/kount/src/reporters/html-template.ts', 40],
      ['/Users/michaelnji/Projects/kount/src/core/aggregator.ts', 25],
      ['/Users/michaelnji/Projects/kount/src/index.tsx', 10],
    ]) }],
    ['CommentLines', { summaryValue: 1200, perFile: new Map([
      ['/Users/michaelnji/Projects/kount/src/reporters/html-template.ts', 15],
      ['/Users/michaelnji/Projects/kount/src/core/aggregator.ts', 30],
      ['/Users/michaelnji/Projects/kount/src/index.tsx', 8],
    ]) }],
    ['FileSize', { summaryValue: 156000, perFile: new Map([
      ['/Users/michaelnji/Projects/kount/src/reporters/html-template.ts', 18200],
      ['/Users/michaelnji/Projects/kount/src/core/aggregator.ts', 8500],
      ['/Users/michaelnji/Projects/kount/src/index.tsx', 3200],
    ]) }],
    ['DebtTracker', { summaryValue: 8, perFile: new Map([
      ['/Users/michaelnji/Projects/kount/src/reporters/html-template.ts', 0],
      ['/Users/michaelnji/Projects/kount/src/core/aggregator.ts', 5],
      ['/Users/michaelnji/Projects/kount/src/index.tsx', 3],
    ]) }],
    ['CodeChurn', { summaryValue: 8, perFile: new Map([
      ['/Users/michaelnji/Projects/kount/src/reporters/html-template.ts', 4],
      ['/Users/michaelnji/Projects/kount/src/core/aggregator.ts', 8],
      ['/Users/michaelnji/Projects/kount/src/index.tsx', 12],
    ]) }],
    ['TechDebt', { summaryValue: 28.3, perFile: new Map([
      ['/Users/michaelnji/Projects/kount/src/reporters/html-template.ts', 12.5],
      ['/Users/michaelnji/Projects/kount/src/core/aggregator.ts', 28.3],
      ['/Users/michaelnji/Projects/kount/src/index.tsx', 8.1],
    ]) }],
  ]),
};

const html = generateHtmlDashboard(stats as any);
fs.writeFileSync('/tmp/kount-dashboard-preview.html', html);
console.log('Dashboard saved to /tmp/kount-dashboard-preview.html');
