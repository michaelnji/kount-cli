import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PluginResult, ProjectStats } from '../src/plugins/types';
import { generateHtmlDashboard } from '../src/reporters/html';
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
