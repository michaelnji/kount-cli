import * as fsp from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProjectStats } from '../src/plugins/types';
import { getPreviousRun, saveRun } from '../src/state/history';

vi.mock('node:fs/promises');

let mockReadFile: unknown;
let mockWriteFile: unknown;
let mockMkdir: unknown;

/**
 * Creates a minimal ProjectStats object for testing.
 */
function makeMockStats(overrides?: Partial<ProjectStats>): ProjectStats {
  const pluginResults = new Map();
  pluginResults.set('TotalLines', { pluginName: 'TotalLines', summaryValue: 1000, perFile: new Map() });
  pluginResults.set('CommentLines', { pluginName: 'CommentLines', summaryValue: 100, perFile: new Map() });
  pluginResults.set('FileSize', { pluginName: 'FileSize', summaryValue: 50000, perFile: new Map() });

  return {
    rootDir: '/mock/project',
    totalFiles: 20,
    pluginResults,
    languageDistribution: new Map(),
    largestFiles: [],
    debtHotspots: [],
    techDebtScore: 300,
    scannedAt: new Date('2026-03-01T10:00:00Z'),
    ...overrides,
  };
}

describe('State Persistence Layer', () => {
  beforeEach(() => {
    mockReadFile = vi.mocked(fsp.readFile);
    mockWriteFile = vi.mocked(fsp.writeFile);
    mockMkdir = vi.mocked(fsp.mkdir);

    (mockMkdir as any).mockResolvedValue(undefined);
    (mockWriteFile as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('saveRun', () => {
    it('should create history dir and write entry', async () => {
      // No existing history file
      (mockReadFile as any).mockRejectedValue(new Error('ENOENT'));
      const stats = makeMockStats();

      await saveRun('/mock/project', stats);

      expect(mockMkdir).toHaveBeenCalledWith('/mock/project/.kount', { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledTimes(1);

      const writtenData = JSON.parse((mockWriteFile as any).mock.calls[0][1] as string);
      expect(writtenData).toHaveLength(1);
      expect(writtenData[0].totalFiles).toBe(20);
      expect(writtenData[0].totalLines).toBe(1000);
      expect(writtenData[0].commentRatio).toBe(10);
      expect(writtenData[0].totalSize).toBe(50000);
      expect(writtenData[0].techDebtScore).toBe(300);
    });

    it('should append to existing history', async () => {
      const existing = [
        { id: 'old', timestamp: '2026-02-01T10:00:00Z', totalFiles: 15, totalLines: 800, commentRatio: 8, totalSize: 40000, techDebtScore: 200 },
      ];
      (mockReadFile as any).mockResolvedValue(JSON.stringify(existing));

      await saveRun('/mock/project', makeMockStats());

      const writtenData = JSON.parse((mockWriteFile as any).mock.calls[0][1] as string);
      expect(writtenData).toHaveLength(2);
      expect(writtenData[0].id).toBe('old');
    });

    it('should cap history at 50 entries', async () => {
      const existing = Array.from({ length: 55 }, (_, i) => ({
        id: `run-${i}`,
        timestamp: '2026-01-01T00:00:00Z',
        totalFiles: 1,
        totalLines: 1,
        commentRatio: 0,
        totalSize: 1,
        techDebtScore: 0,
      }));
      (mockReadFile as any).mockResolvedValue(JSON.stringify(existing));

      await saveRun('/mock/project', makeMockStats());

      const writtenData = JSON.parse((mockWriteFile as any).mock.calls[0][1] as string);
      expect(writtenData).toHaveLength(50);
      // Should keep the latest entries (last 50 including the new one)
      expect(writtenData[writtenData.length - 1].totalFiles).toBe(20); // our new entry
    });

    it('should gracefully handle write failures', async () => {
      (mockReadFile as any).mockRejectedValue(new Error('ENOENT'));
      (mockMkdir as any).mockRejectedValue(new Error('EPERM'));

      // Should not throw
      await expect(saveRun('/mock/project', makeMockStats())).resolves.toBeUndefined();
    });
  });

  describe('getPreviousRun', () => {
    it('should return the second-to-last entry', async () => {
      const history = [
        { id: 'first', timestamp: '2026-01-01', totalFiles: 10, totalLines: 500, commentRatio: 5, totalSize: 20000, techDebtScore: 100 },
        { id: 'second', timestamp: '2026-02-01', totalFiles: 15, totalLines: 800, commentRatio: 8, totalSize: 40000, techDebtScore: 200 },
      ];
      (mockReadFile as any).mockResolvedValue(JSON.stringify(history));

      const prev = await getPreviousRun('/mock/project');

      expect(prev).not.toBeNull();
      expect(prev!.id).toBe('first');
      expect(prev!.totalFiles).toBe(10);
    });

    it('should return null when only one entry exists', async () => {
      (mockReadFile as any).mockResolvedValue(JSON.stringify([{ id: 'only' }]));
      const prev = await getPreviousRun('/mock/project');
      expect(prev).toBeNull();
    });

    it('should return null when no history exists', async () => {
      (mockReadFile as any).mockRejectedValue(new Error('ENOENT'));
      const prev = await getPreviousRun('/mock/project');
      expect(prev).toBeNull();
    });

    it('should return null when history is corrupt', async () => {
      (mockReadFile as any).mockResolvedValue('not valid json{{{');
      const prev = await getPreviousRun('/mock/project');
      expect(prev).toBeNull();
    });
  });
});
