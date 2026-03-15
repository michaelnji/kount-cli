import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { KountConfig } from '../src/cli/config-resolver';
import { validateConfig } from '../src/cli/validate';

// --- Helpers ---

/** Builds a fully valid KountConfig using os.tmpdir() as rootDir. */
function makeValidConfig(overrides: Partial<KountConfig> = {}): KountConfig {
  return {
    rootDir: os.tmpdir(),
    outputMode: 'terminal',
    includeTests: false,
    respectGitignore: true,
    cache: { enabled: true, clearFirst: false },
    force: false,
    deepGit: false,
    staleThreshold: 2,
    ...overrides,
  };
}

// Temp file used to test "rootDir is a file, not a directory"
let tempFile: string;

beforeAll(() => {
  tempFile = path.join(os.tmpdir(), `kount-test-file-${Date.now()}.txt`);
  fs.writeFileSync(tempFile, 'test');
});

afterAll(() => {
  try { fs.unlinkSync(tempFile); } catch { /* ignore */ }
});

// ---------------------------------------------------------------------------
// rootDir
// ---------------------------------------------------------------------------

describe('validateConfig — rootDir', () => {
  it('passes for an existing directory', async () => {
    const errors = await validateConfig(makeValidConfig());
    expect(errors).toEqual([]);
  });

  it('errors when rootDir does not exist', async () => {
    const errors = await validateConfig(makeValidConfig({
      rootDir: '/absolutely/nonexistent/path/kount-test-99999',
    }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/does not exist|not accessible/i);
  });

  it('errors when rootDir is a file, not a directory', async () => {
    const errors = await validateConfig(makeValidConfig({ rootDir: tempFile }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/not a directory/i);
  });
});

// ---------------------------------------------------------------------------
// outputMode
// ---------------------------------------------------------------------------

describe('validateConfig — outputMode', () => {
  it('passes for all valid output modes', async () => {
    for (const mode of ['terminal', 'html', 'markdown', 'json', 'csv'] as const) {
      const errors = await validateConfig(makeValidConfig({ outputMode: mode }));
      expect(errors).toEqual([]);
    }
  });

  it('errors for an unknown output mode', async () => {
    const errors = await validateConfig(
      makeValidConfig({ outputMode: 'xml' as KountConfig['outputMode'] })
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/output-mode.*invalid|invalid.*output-mode/i);
  });
});

// ---------------------------------------------------------------------------
// outputPath
// ---------------------------------------------------------------------------

describe('validateConfig — outputPath', () => {
  it('passes when no outputPath is set', async () => {
    const errors = await validateConfig(makeValidConfig({ outputPath: undefined }));
    expect(errors).toEqual([]);
  });

  it('passes when outputPath parent directory exists', async () => {
    const errors = await validateConfig(makeValidConfig({
      outputPath: path.join(os.tmpdir(), 'kount-test-report.json'),
    }));
    expect(errors).toEqual([]);
  });

  it('errors when outputPath parent directory does not exist', async () => {
    const errors = await validateConfig(makeValidConfig({
      outputPath: '/absolutely/nonexistent/dir/kount-report.json',
    }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/output.*parent|parent.*directory|does not exist/i);
  });
});

// ---------------------------------------------------------------------------
// staleThreshold
// ---------------------------------------------------------------------------

describe('validateConfig — staleThreshold', () => {
  it('passes for a positive staleThreshold', async () => {
    const errors = await validateConfig(makeValidConfig({ staleThreshold: 2 }));
    expect(errors).toEqual([]);
  });

  it('errors for staleThreshold = 0', async () => {
    const errors = await validateConfig(makeValidConfig({ staleThreshold: 0 }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/stale-threshold/i);
  });

  it('errors for a negative staleThreshold', async () => {
    const errors = await validateConfig(makeValidConfig({ staleThreshold: -1 }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/stale-threshold/i);
  });

  it('errors for NaN staleThreshold', async () => {
    const errors = await validateConfig(makeValidConfig({ staleThreshold: NaN }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/stale-threshold/i);
  });
});

// ---------------------------------------------------------------------------
// qualityGates
// ---------------------------------------------------------------------------

describe('validateConfig — qualityGates (failOnSize)', () => {
  it('passes when no qualityGates are set', async () => {
    const errors = await validateConfig(makeValidConfig({ qualityGates: undefined }));
    expect(errors).toEqual([]);
  });

  it('passes for a valid failOnSize', async () => {
    const errors = await validateConfig(makeValidConfig({
      qualityGates: { failOnSize: 100 },
    }));
    expect(errors).toEqual([]);
  });

  it('errors for failOnSize = 0', async () => {
    const errors = await validateConfig(makeValidConfig({
      qualityGates: { failOnSize: 0 },
    }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/fail-on-size/i);
  });

  it('errors for a negative failOnSize', async () => {
    const errors = await validateConfig(makeValidConfig({
      qualityGates: { failOnSize: -10 },
    }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/fail-on-size/i);
  });

  it('errors for NaN failOnSize', async () => {
    const errors = await validateConfig(makeValidConfig({
      qualityGates: { failOnSize: NaN },
    }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/fail-on-size/i);
  });
});

describe('validateConfig — qualityGates (minCommentRatio)', () => {
  it('passes for valid minCommentRatio values', async () => {
    for (const ratio of [0, 10, 50, 100]) {
      const errors = await validateConfig(makeValidConfig({
        qualityGates: { minCommentRatio: ratio },
      }));
      expect(errors).toEqual([]);
    }
  });

  it('errors for minCommentRatio below 0', async () => {
    const errors = await validateConfig(makeValidConfig({
      qualityGates: { minCommentRatio: -1 },
    }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/min-comment-ratio/i);
  });

  it('errors for minCommentRatio above 100', async () => {
    const errors = await validateConfig(makeValidConfig({
      qualityGates: { minCommentRatio: 101 },
    }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/min-comment-ratio/i);
  });

  it('errors for NaN minCommentRatio', async () => {
    const errors = await validateConfig(makeValidConfig({
      qualityGates: { minCommentRatio: NaN },
    }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/min-comment-ratio/i);
  });
});

describe('validateConfig — qualityGates (maxComplexity)', () => {
  it('passes for valid maxComplexity values', async () => {
    for (const n of [1, 5, 25]) {
      const errors = await validateConfig(makeValidConfig({
        qualityGates: { maxComplexity: n },
      }));
      expect(errors).toEqual([]);
    }
  });

  it('errors for maxComplexity = 0', async () => {
    const errors = await validateConfig(makeValidConfig({
      qualityGates: { maxComplexity: 0 },
    }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/max-complexity/i);
  });

  it('errors for negative maxComplexity', async () => {
    const errors = await validateConfig(makeValidConfig({
      qualityGates: { maxComplexity: -5 },
    }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/max-complexity/i);
  });

  it('errors for NaN maxComplexity', async () => {
    const errors = await validateConfig(makeValidConfig({
      qualityGates: { maxComplexity: NaN },
    }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/max-complexity/i);
  });
});

// ---------------------------------------------------------------------------
// badge metric
// ---------------------------------------------------------------------------

describe('validateConfig — badge', () => {
  it('passes when no badge is set', async () => {
    const errors = await validateConfig(makeValidConfig({ badge: undefined }));
    expect(errors).toEqual([]);
  });

  it('passes for all valid badge metrics', async () => {
    for (const metric of ['files', 'lines', 'comment-ratio', 'debt-score', 'complexity']) {
      const errors = await validateConfig(makeValidConfig({ badge: metric }));
      expect(errors).toEqual([]);
    }
  });

  it('errors for an unknown badge metric', async () => {
    const errors = await validateConfig(makeValidConfig({ badge: 'not-a-metric' }));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/badge.*invalid|invalid.*badge/i);
  });
});

// ---------------------------------------------------------------------------
// Multiple errors accumulate
// ---------------------------------------------------------------------------

describe('validateConfig — multiple errors', () => {
  it('reports all errors at once, not just the first', async () => {
    const errors = await validateConfig(makeValidConfig({
      rootDir: '/nonexistent/path/xyz',
      staleThreshold: -1,
      qualityGates: { failOnSize: -1, minCommentRatio: 200 },
      badge: 'bad-metric',
    }));
    // Should have errors for rootDir, staleThreshold, failOnSize, minCommentRatio, badge
    expect(errors.length).toBeGreaterThanOrEqual(4);
  });
});
