import fsp from 'node:fs/promises';
import path from 'node:path';

/**
 * Per-file cached entry storing metrics and invalidation keys.
 */
export interface CacheEntry {
  /** Last modified time in ms (from stat.mtimeMs). */
  mtimeMs: number;
  /** File size in bytes (from stat.size). */
  size: number;
  /** Cached plugin results keyed by plugin name. */
  metrics: Record<string, number>;
}

/**
 * Shape of the .kountcache.json file on disk.
 */
interface CacheFile {
  version: number;
  entries: Record<string, CacheEntry>;
}

const CACHE_VERSION = 1;
const CACHE_FILENAME = '.kountcache.json';

/**
 * Manages the .kountcache.json file for incremental scanning.
 * Uses mtime + size to determine if a file needs re-scanning.
 */
export class CacheManager {
  private cachePath: string;
  private entries: Map<string, CacheEntry> = new Map();
  private enabled: boolean;
  private dirty = false;

  constructor(rootDir: string, enabled: boolean = true) {
    this.cachePath = path.join(path.resolve(rootDir), CACHE_FILENAME);
    this.enabled = enabled;
  }

  /**
   * Loads the cache from disk. If it doesn't exist or is corrupt, starts fresh.
   */
  async load(): Promise<void> {
    if (!this.enabled) return;

    try {
      const raw = await fsp.readFile(this.cachePath, 'utf8');
      const parsed: CacheFile = JSON.parse(raw);

      if (parsed.version !== CACHE_VERSION) {
        // Version mismatch — discard and start fresh
        this.entries = new Map();
        return;
      }

      this.entries = new Map(Object.entries(parsed.entries));
    } catch {
      // File doesn't exist or is corrupt — start with empty cache
      this.entries = new Map();
    }
  }

  /**
   * Checks whether a file's cached entry is still valid by comparing
   * mtime and size from the current stat against the stored values.
   *
   * @returns The cached metrics if valid, or null if the file needs re-scanning.
   */
  lookup(filePath: string, currentMtimeMs: number, currentSize: number): Record<string, number> | null {
    if (!this.enabled) return null;

    const entry = this.entries.get(filePath);
    if (!entry) return null;

    if (entry.mtimeMs === currentMtimeMs && entry.size === currentSize) {
      return entry.metrics;
    }

    // Invalidated — mtime or size changed
    return null;
  }

  /**
   * Stores or updates a file's cache entry after scanning.
   */
  set(filePath: string, mtimeMs: number, size: number, metrics: Record<string, number>): void {
    if (!this.enabled) return;

    this.entries.set(filePath, { mtimeMs, size, metrics });
    this.dirty = true;
  }

  /**
   * Persists the cache to disk if any entries were updated.
   */
  async save(): Promise<void> {
    if (!this.enabled || !this.dirty) return;

    const cacheFile: CacheFile = {
      version: CACHE_VERSION,
      entries: Object.fromEntries(this.entries),
    };

    await fsp.writeFile(this.cachePath, JSON.stringify(cacheFile, null, 2), 'utf8');
    this.dirty = false;
  }

  /**
   * Removes the cache file from disk.
   */
  async clear(): Promise<void> {
    this.entries = new Map();
    this.dirty = false;

    try {
      await fsp.unlink(this.cachePath);
    } catch {
      // File didn't exist — that's fine
    }
  }

  /**
   * Returns the number of cached entries (for diagnostics).
   */
  get size(): number {
    return this.entries.size;
  }
}
