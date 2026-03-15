import { describe, expect, it } from 'vitest';
import type { KountConfig } from '../src/cli/config-resolver';
import { checkQualityGates } from '../src/core/quality-gates';
import type { PluginResult, ProjectStats } from '../src/plugins/types';

// --- Helpers ---

function makePluginResult(name: string, value: number): PluginResult {
  return {
    pluginName: name,
    summaryValue: value,
    perFile: new Map(),
  };
}

function makeMockConfig(gates?: KountConfig['qualityGates']): KountConfig {
  return {
    rootDir: '/project',
    outputMode: 'terminal',
    includeTests: false,
    respectGitignore: true,
    cache: { enabled: true, clearFirst: false },
    force: false,
    deepGit: false,
    staleThreshold: 2,
    qualityGates: gates,
  };
}

function makeMockStats(overrides?: {
  totalLines?: number;
  commentLines?: number;
  totalBytes?: number;
  complexityPerFile?: Map<string, number>;
}): ProjectStats {
  const pluginResults = new Map<string, PluginResult>();
  pluginResults.set('TotalLines', makePluginResult('TotalLines', overrides?.totalLines ?? 1000));
  pluginResults.set('CommentLines', makePluginResult('CommentLines', overrides?.commentLines ?? 100));
  pluginResults.set('FileSize', makePluginResult('FileSize', overrides?.totalBytes ?? 5 * 1024 * 1024));
  pluginResults.set('BlankLines', makePluginResult('BlankLines', 50));

  if (overrides?.complexityPerFile) {
    const maxScore = [...overrides.complexityPerFile.values()].reduce((a, b) => Math.max(a, b), 0);
    pluginResults.set('Complexity', {
      pluginName: 'Complexity',
      summaryValue: maxScore,
      perFile: overrides.complexityPerFile,
    });
  }

  return {
    rootDir: '/project',
    totalFiles: 10,
    pluginResults,
    languageDistribution: new Map(),
    largestFiles: [],
    debtHotspots: [],
    scannedAt: new Date(),
  };
}

// --- Tests ---

describe('Quality Gates', () => {
  it('should return empty array when no quality gates are configured', () => {
    const config = makeMockConfig(undefined);
    const stats = makeMockStats();
    const failures = checkQualityGates(config, stats);

    expect(failures).toEqual([]);
  });

  it('should pass when codebase size is within limit', () => {
    const config = makeMockConfig({ failOnSize: 10 }); // 10 MB limit
    const stats = makeMockStats({ totalBytes: 5 * 1024 * 1024 }); // 5 MB
    const failures = checkQualityGates(config, stats);

    expect(failures).toEqual([]);
  });

  it('should fail when codebase size exceeds limit', () => {
    const config = makeMockConfig({ failOnSize: 3 }); // 3 MB limit
    const stats = makeMockStats({ totalBytes: 5 * 1024 * 1024 }); // 5 MB
    const failures = checkQualityGates(config, stats);

    expect(failures.length).toBe(1);
    expect(failures[0]).toContain('exceeds the 3MB limit');
  });

  it('should pass when comment ratio meets minimum', () => {
    const config = makeMockConfig({ minCommentRatio: 5 }); // 5% minimum
    const stats = makeMockStats({ totalLines: 1000, commentLines: 100 }); // 10%
    const failures = checkQualityGates(config, stats);

    expect(failures).toEqual([]);
  });

  it('should fail when comment ratio is below minimum', () => {
    const config = makeMockConfig({ minCommentRatio: 20 }); // 20% minimum
    const stats = makeMockStats({ totalLines: 1000, commentLines: 100 }); // 10%
    const failures = checkQualityGates(config, stats);

    expect(failures.length).toBe(1);
    expect(failures[0]).toContain('below the 20% minimum');
  });

  it('should return multiple failures when both gates breach', () => {
    const config = makeMockConfig({ failOnSize: 1, minCommentRatio: 50 });
    const stats = makeMockStats({
      totalBytes: 5 * 1024 * 1024,
      totalLines: 1000,
      commentLines: 50,
    });
    const failures = checkQualityGates(config, stats);

    expect(failures.length).toBe(2);
    expect(failures[0]).toContain('exceeds the 1MB limit');
    expect(failures[1]).toContain('below the 50% minimum');
  });

  it('should handle zero total lines without dividing by zero', () => {
    const config = makeMockConfig({ minCommentRatio: 10 });
    const stats = makeMockStats({ totalLines: 0, commentLines: 0 });
    const failures = checkQualityGates(config, stats);

    // 0% < 10% so it should fail
    expect(failures.length).toBe(1);
    expect(failures[0]).toContain('below the 10% minimum');
  });

  it('should pass when max complexity is within limit', () => {
    const complexityMap = new Map([
      ['/project/a.ts', 5],
      ['/project/b.ts', 3],
    ]);
    const config = makeMockConfig({ maxComplexity: 10 });
    const stats = makeMockStats({ complexityPerFile: complexityMap });
    const failures = checkQualityGates(config, stats);

    expect(failures).toEqual([]);
  });

  it('should fail when max complexity exceeds limit', () => {
    const complexityMap = new Map([
      ['/project/a.ts', 15],
      ['/project/b.ts', 3],
    ]);
    const config = makeMockConfig({ maxComplexity: 10 });
    const stats = makeMockStats({ complexityPerFile: complexityMap });
    const failures = checkQualityGates(config, stats);

    expect(failures.length).toBe(1);
    expect(failures[0]).toContain('15');
    expect(failures[0]).toContain('10');
  });

  it('should pass maxComplexity check when no Complexity plugin result is present', () => {
    // No complexity data → max score = 0, should not fail
    const config = makeMockConfig({ maxComplexity: 5 });
    const stats = makeMockStats();
    const failures = checkQualityGates(config, stats);

    expect(failures).toEqual([]);
  });
});
