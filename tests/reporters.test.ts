import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PluginResult, ProjectStats } from '../src/plugins/types';
import { generateCsvReport } from '../src/reporters/csv';
import { generateHtmlDashboard } from '../src/reporters/html';
import { generateJsonReport } from '../src/reporters/json';
import { generateMarkdownReport, writeMarkdownReport } from '../src/reporters/markdown';

// --- Test Helpers ---

function makePluginResult(name: string, value: number): PluginResult {
  return {
    pluginName: name,
    summaryValue: value,
    perFile: new Map(),
  };
}

function makeMockStats(overrides?: Partial<ProjectStats>): ProjectStats {
  const pluginResults = new Map<string, PluginResult>();
  pluginResults.set('TotalLines', makePluginResult('TotalLines', 500));
  pluginResults.set('BlankLines', makePluginResult('BlankLines', 50));
  pluginResults.set('CommentLines', makePluginResult('CommentLines', 80));
  pluginResults.set('FileSize', makePluginResult('FileSize', 25000));
  pluginResults.set('TotalFiles', makePluginResult('TotalFiles', 10));
  pluginResults.set('DebtTracker', makePluginResult('DebtTracker', 5));

  const languageDistribution = new Map<string, number>();
  languageDistribution.set('TypeScript', 6);
  languageDistribution.set('Python', 3);
  languageDistribution.set('HTML', 1);

  return {
    rootDir: '/project',
    totalFiles: 10,
    pluginResults,
    languageDistribution,
    largestFiles: [
      { filePath: '/project/src/big.ts', size: 10000 },
      { filePath: '/project/src/medium.ts', size: 5000 },
    ],
    debtHotspots: [
      { filePath: '/project/src/main.ts', count: 3 },
      { filePath: '/project/src/utils.ts', count: 2 },
    ],
    scannedAt: new Date('2026-01-15T10:00:00Z'),
    ...overrides,
  };
}

// --- Tests ---

describe('Markdown Reporter', () => {
  it('should generate a valid markdown report with all sections', () => {
    const stats = makeMockStats();
    const md = generateMarkdownReport(stats);

    expect(md).toContain('<!-- KOUNT:START -->');
    expect(md).toContain('<!-- KOUNT:END -->');
    expect(md).toContain('## Codebase Statistics');
    expect(md).toContain('| Files | 10 |');
    expect(md).toContain('| Total Lines | 500 |');
    expect(md).toContain('| Code Lines | 370 |'); // 500 - 50 - 80
    expect(md).toContain('| Code Ratio | 74.0% |');
    expect(md).toContain('### Language Distribution');
    expect(md).toContain('TypeScript');
    expect(md).toContain('### Top 10 Largest Files');
    expect(md).toContain('`src/big.ts`');
  });

  describe('writeMarkdownReport', () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'kount-md-test-'));
    });

    afterEach(async () => {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    });

    it('should create a new file when none exists', async () => {
      const stats = makeMockStats({ rootDir: tmpDir });
      const outputPath = path.join(tmpDir, 'REPORT.md');

      const result = await writeMarkdownReport(stats, outputPath, false);
      expect(result).toBe(outputPath);

      const content = await fsp.readFile(outputPath, 'utf8');
      expect(content).toContain('<!-- KOUNT:START -->');
    });

    it('should append to an existing file without KOUNT markers', async () => {
      const stats = makeMockStats({ rootDir: tmpDir });
      const outputPath = path.join(tmpDir, 'README.md');
      await fsp.writeFile(outputPath, '# My Project\n\nSome existing content.\n', 'utf8');

      await writeMarkdownReport(stats, outputPath, false);

      const content = await fsp.readFile(outputPath, 'utf8');
      expect(content).toContain('# My Project');
      expect(content).toContain('Some existing content.');
      expect(content).toContain('<!-- KOUNT:START -->');
    });

    it('should replace existing KOUNT section on re-run', async () => {
      const stats = makeMockStats({ rootDir: tmpDir });
      const outputPath = path.join(tmpDir, 'README.md');

      // First write
      await fsp.writeFile(
        outputPath,
        '# My Project\n\n<!-- KOUNT:START -->\nOLD DATA\n<!-- KOUNT:END -->\n\n## Footer\n',
        'utf8'
      );

      await writeMarkdownReport(stats, outputPath, false);

      const content = await fsp.readFile(outputPath, 'utf8');
      expect(content).toContain('# My Project');
      expect(content).toContain('## Footer');
      expect(content).not.toContain('OLD DATA');
      expect(content).toContain('| Files | 10 |');
    });

    it('should overwrite the entire file with --force', async () => {
      const stats = makeMockStats({ rootDir: tmpDir });
      const outputPath = path.join(tmpDir, 'README.md');
      await fsp.writeFile(outputPath, '# My Project\n\nShould be gone.\n', 'utf8');

      await writeMarkdownReport(stats, outputPath, true);

      const content = await fsp.readFile(outputPath, 'utf8');
      expect(content).not.toContain('# My Project');
      expect(content).not.toContain('Should be gone.');
      expect(content).toContain('<!-- KOUNT:START -->');
    });
  });
});

describe('HTML Reporter', () => {
  it('should generate valid HTML with Tailwind CDN', () => {
    const stats = makeMockStats();
    const html = generateHtmlDashboard(stats);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('cdn.tailwindcss.com');
    expect(html).toContain('alpinejs');
    expect(html).toContain('KOUNT');
  });

  it('should inject stats data as JSON into the page', () => {
    const stats = makeMockStats();
    const html = generateHtmlDashboard(stats);

    // The JSON data should be present in the script
    expect(html).toContain('"totalLines":500');
    expect(html).toContain('"codeLines":370');
    expect(html).toContain('"TypeScript"');
  });

  it('should handle empty language distribution', () => {
    const stats = makeMockStats({ languageDistribution: new Map() });
    const html = generateHtmlDashboard(stats);

    // Should still render without errors
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('"languages":[]');
  });
});

describe('JSON Reporter', () => {
  it('should generate valid JSON with summary, files, and languages keys', () => {
    const stats = makeMockStats();
    const json = generateJsonReport(stats);
    const parsed = JSON.parse(json);

    expect(parsed).toHaveProperty('summary');
    expect(parsed).toHaveProperty('files');
    expect(parsed).toHaveProperty('languages');
    expect(parsed).toHaveProperty('largestFiles');
    expect(parsed).toHaveProperty('debtHotspots');
    expect(parsed).toHaveProperty('scannedAt');
  });

  it('should include correct summary values', () => {
    const stats = makeMockStats();
    const parsed = JSON.parse(generateJsonReport(stats));

    expect(parsed.summary.totalFiles).toBe(10);
    expect(parsed.summary.totalLines).toBe(500);
    expect(parsed.summary.codeLines).toBe(370); // 500 - 50 - 80
    expect(parsed.summary.commentLines).toBe(80);
    expect(parsed.summary.blankLines).toBe(50);
    expect(parsed.summary.debtMarkers).toBe(5);
  });

  it('should include language distribution as an object', () => {
    const stats = makeMockStats();
    const parsed = JSON.parse(generateJsonReport(stats));

    expect(parsed.languages['TypeScript']).toBe(6);
    expect(parsed.languages['Python']).toBe(3);
    expect(parsed.languages['HTML']).toBe(1);
  });

  it('should include debt hotspots with relative paths', () => {
    const stats = makeMockStats();
    const parsed = JSON.parse(generateJsonReport(stats));

    expect(parsed.debtHotspots.length).toBe(2);
    expect(parsed.debtHotspots[0].path).toBe('src/main.ts');
    expect(parsed.debtHotspots[0].count).toBe(3);
  });

  it('should be pretty-printed with 2-space indentation', () => {
    const stats = makeMockStats();
    const json = generateJsonReport(stats);

    // Should have newlines and indentation (not compact)
    expect(json).toContain('\n');
    expect(json).toContain('  ');
  });
});

describe('CSV Reporter', () => {
  it('should have the correct header row', () => {
    const stats = makeMockStats();
    const csv = generateCsvReport(stats);
    const lines = csv.trim().split('\n');

    expect(lines[0]).toBe('Path,Lines,Blank Lines,Comment Lines,Size,Debt Markers');
  });

  it('should have correct number of columns per row', () => {
    // Add per-file data to the mock
    const pluginResults = new Map<string, PluginResult>();
    const perFile = new Map<string, number>();
    perFile.set('/project/src/index.ts', 100);
    perFile.set('/project/src/utils.ts', 50);
    pluginResults.set('TotalLines', { pluginName: 'TotalLines', summaryValue: 150, perFile });
    pluginResults.set('BlankLines', { pluginName: 'BlankLines', summaryValue: 10, perFile: new Map([["/project/src/index.ts", 5], ["/project/src/utils.ts", 5]]) });
    pluginResults.set('CommentLines', { pluginName: 'CommentLines', summaryValue: 20, perFile: new Map([["/project/src/index.ts", 15], ["/project/src/utils.ts", 5]]) });
    pluginResults.set('FileSize', { pluginName: 'FileSize', summaryValue: 5000, perFile: new Map([["/project/src/index.ts", 3000], ["/project/src/utils.ts", 2000]]) });
    pluginResults.set('DebtTracker', { pluginName: 'DebtTracker', summaryValue: 3, perFile: new Map([["/project/src/index.ts", 2], ["/project/src/utils.ts", 1]]) });

    const stats = makeMockStats({ pluginResults });
    const csv = generateCsvReport(stats);
    const lines = csv.trim().split('\n');

    // Header + 2 data rows
    expect(lines.length).toBe(3);

    // Each data row should have 6 columns
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i].split(',').length).toBe(6);
    }
  });

  it('should output per-file data with correct values', () => {
    const perFile = new Map<string, number>();
    perFile.set('/project/src/app.ts', 200);

    const pluginResults = new Map<string, PluginResult>();
    pluginResults.set('TotalLines', { pluginName: 'TotalLines', summaryValue: 200, perFile });
    pluginResults.set('BlankLines', { pluginName: 'BlankLines', summaryValue: 20, perFile: new Map([["/project/src/app.ts", 20]]) });
    pluginResults.set('CommentLines', { pluginName: 'CommentLines', summaryValue: 30, perFile: new Map([["/project/src/app.ts", 30]]) });
    pluginResults.set('FileSize', { pluginName: 'FileSize', summaryValue: 4000, perFile: new Map([["/project/src/app.ts", 4000]]) });
    pluginResults.set('DebtTracker', { pluginName: 'DebtTracker', summaryValue: 2, perFile: new Map([["/project/src/app.ts", 2]]) });

    const stats = makeMockStats({ pluginResults });
    const csv = generateCsvReport(stats);
    const lines = csv.trim().split('\n');

    expect(lines[1]).toBe('src/app.ts,200,20,30,4000,2');
  });

  it('should not include a summary row', () => {
    const stats = makeMockStats();
    const csv = generateCsvReport(stats);
    const lines = csv.trim().split('\n');

    // First line is the header; remaining lines should only be file data
    // No line should start with a summary label
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i]).not.toMatch(/^(Total|Summary|TOTAL)/i);
    }
  });
});
