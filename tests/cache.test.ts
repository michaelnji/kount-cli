import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CacheManager } from '../src/core/cache';

describe('CacheManager', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'kount-cache-test-'));
  });

  afterEach(async () => {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  });

  it('should start with empty cache when no file exists', async () => {
    const cache = new CacheManager(tmpDir);
    await cache.load();

    expect(cache.size).toBe(0);
  });

  it('should save and load cache entries', async () => {
    const cache = new CacheManager(tmpDir);
    await cache.load();

    cache.set('/project/file.ts', 1234567890, 100, { TotalLines: 50 });
    cache.set('/project/file2.ts', 9876543210, 200, { TotalLines: 120 });
    await cache.save();

    // Load into a new instance
    const cache2 = new CacheManager(tmpDir);
    await cache2.load();

    expect(cache2.size).toBe(2);
  });

  it('should return cached metrics on cache hit (mtime+size match)', async () => {
    const cache = new CacheManager(tmpDir);
    await cache.load();

    cache.set('/project/file.ts', 1000, 500, { TotalLines: 42, BlankLines: 5 });
    await cache.save();

    const cache2 = new CacheManager(tmpDir);
    await cache2.load();

    const result = cache2.lookup('/project/file.ts', 1000, 500);
    expect(result).not.toBeNull();
    expect(result?.TotalLines).toBe(42);
    expect(result?.BlankLines).toBe(5);
  });

  it('should return null on cache miss (mtime changed)', async () => {
    const cache = new CacheManager(tmpDir);
    await cache.load();

    cache.set('/project/file.ts', 1000, 500, { TotalLines: 42 });
    await cache.save();

    const cache2 = new CacheManager(tmpDir);
    await cache2.load();

    // Different mtime
    const result = cache2.lookup('/project/file.ts', 2000, 500);
    expect(result).toBeNull();
  });

  it('should return null on cache miss (size changed)', async () => {
    const cache = new CacheManager(tmpDir);
    await cache.load();

    cache.set('/project/file.ts', 1000, 500, { TotalLines: 42 });
    await cache.save();

    const cache2 = new CacheManager(tmpDir);
    await cache2.load();

    // Different size
    const result = cache2.lookup('/project/file.ts', 1000, 600);
    expect(result).toBeNull();
  });

  it('should clear the cache file from disk', async () => {
    const cache = new CacheManager(tmpDir);
    await cache.load();

    cache.set('/project/file.ts', 1000, 500, { TotalLines: 42 });
    await cache.save();

    // Verify file exists
    const cachePath = path.join(tmpDir, '.kountcache.json');
    const exists = await fsp.access(cachePath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    // Clear
    await cache.clear();
    expect(cache.size).toBe(0);

    const existsAfter = await fsp.access(cachePath).then(() => true).catch(() => false);
    expect(existsAfter).toBe(false);
  });

  it('should be a no-op when disabled', async () => {
    const cache = new CacheManager(tmpDir, false);
    await cache.load();

    cache.set('/project/file.ts', 1000, 500, { TotalLines: 42 });
    expect(cache.size).toBe(0);

    const result = cache.lookup('/project/file.ts', 1000, 500);
    expect(result).toBeNull();
  });
});
