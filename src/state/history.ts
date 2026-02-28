import * as fsp from 'node:fs/promises';
import path from 'node:path';
import type { ProjectStats } from '../plugins/types.js';

const HISTORY_DIR = '.kount';
const HISTORY_FILE = 'history.json';
const MAX_HISTORY_ENTRIES = 50;

/**
 * A single historical run snapshot.
 */
export interface HistoryEntry {
  id: string;
  timestamp: string;
  totalFiles: number;
  totalLines: number;
  commentRatio: number;
  totalSize: number;
  techDebtScore: number;
}

/**
 * Resolves the full path to the history JSON file.
 */
function getHistoryPath(rootDir: string): string {
  return path.join(rootDir, HISTORY_DIR, HISTORY_FILE);
}

/**
 * Reads the history array from disk.
 * Returns an empty array if the file doesn't exist or is corrupt.
 */
async function readHistory(rootDir: string): Promise<HistoryEntry[]> {
  try {
    const raw = await fsp.readFile(getHistoryPath(rootDir), 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

/**
 * Writes the history array to disk, creating the .kount/ directory if needed.
 * Silently swallows errors — state persistence is best-effort.
 */
async function writeHistory(rootDir: string, entries: HistoryEntry[]): Promise<void> {
  try {
    const dirPath = path.join(rootDir, HISTORY_DIR);
    await fsp.mkdir(dirPath, { recursive: true });
    await fsp.writeFile(
      getHistoryPath(rootDir),
      JSON.stringify(entries, null, 2),
      'utf8'
    );
  } catch {
    // Graceful degradation: if we can't write, we skip silently.
    // A future enhancement could log a soft warning via stderr.
  }
}

/**
 * Saves the current run's stats to the history file.
 * Caps the history at MAX_HISTORY_ENTRIES (50) to prevent file bloat.
 */
export async function saveRun(rootDir: string, stats: ProjectStats): Promise<void> {
  const totalLines = stats.pluginResults.get('TotalLines')?.summaryValue ?? 0;
  const commentLines = stats.pluginResults.get('CommentLines')?.summaryValue ?? 0;
  const totalBytes = stats.pluginResults.get('FileSize')?.summaryValue ?? 0;
  const commentRatio = totalLines > 0
    ? Number(((commentLines / totalLines) * 100).toFixed(1))
    : 0;

  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: stats.scannedAt.toISOString(),
    totalFiles: stats.totalFiles,
    totalLines,
    commentRatio,
    totalSize: totalBytes,
    techDebtScore: stats.techDebtScore ?? 0,
  };

  const history = await readHistory(rootDir);
  history.push(entry);

  // Cap at last N entries
  const trimmed = history.slice(-MAX_HISTORY_ENTRIES);

  await writeHistory(rootDir, trimmed);
}

/**
 * Returns the previous (second-to-last) run from history.
 * Returns null if there is no previous run.
 */
export async function getPreviousRun(rootDir: string): Promise<HistoryEntry | null> {
  const history = await readHistory(rootDir);

  if (history.length < 2) return null;

  return history[history.length - 2];
}
