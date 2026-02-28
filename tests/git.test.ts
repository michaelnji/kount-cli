import * as cp from 'node:child_process';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// We test the git utilities by mocking child_process.spawn
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

// Import after mock setup
import {
    batchGetFileChurn,
    getChangedFiles,
    getFileChurn,
    getTopAuthors,
    isGitRepo,
} from '../src/git/index';

/**
 * Helper to create a mock child process that emits data and closes.
 */
function mockSpawn(stdout: string, exitCode: number = 0): void {
  const proc = new EventEmitter() as any;
  const stdoutStream = new Readable({
    read() {
      this.push(stdout);
      this.push(null);
    },
  });
  proc.stdout = stdoutStream;
  proc.stderr = new Readable({ read() { this.push(null); } });

  (cp.spawn as any).mockReturnValue(proc);

  // Emit close event asynchronously
  setTimeout(() => proc.emit('close', exitCode), 10);
}

/**
 * Helper to mock a spawn that emits an 'error' event (e.g., git not installed).
 */
function mockSpawnError(): void {
  const proc = new EventEmitter() as any;
  const stdoutStream = new Readable({ read() { this.push(null); } });
  proc.stdout = stdoutStream;
  proc.stderr = new Readable({ read() { this.push(null); } });

  (cp.spawn as any).mockReturnValue(proc);

  setTimeout(() => proc.emit('error', new Error('spawn ENOENT')), 10);
}

describe('Git Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isGitRepo', () => {
    it('should return true for a valid git repo', async () => {
      mockSpawn('.git\n');
      const result = await isGitRepo('/project');
      expect(result).toBe(true);
    });

    it('should return false when git command fails', async () => {
      mockSpawn('', 128);
      const result = await isGitRepo('/not-a-repo');
      expect(result).toBe(false);
    });

    it('should return false when git is not installed', async () => {
      mockSpawnError();
      const result = await isGitRepo('/project');
      expect(result).toBe(false);
    });
  });

  describe('getChangedFiles', () => {
    it('should parse diff output into file paths', async () => {
      mockSpawn('src/index.ts\nsrc/utils.ts\nREADME.md\n');
      const files = await getChangedFiles('/project', 'main');
      expect(files).toEqual(['src/index.ts', 'src/utils.ts', 'README.md']);
    });

    it('should return empty array when no files changed', async () => {
      mockSpawn('');
      const files = await getChangedFiles('/project', 'main');
      expect(files).toEqual([]);
    });

    it('should return empty array on git failure', async () => {
      mockSpawnError();
      const files = await getChangedFiles('/project', 'main');
      expect(files).toEqual([]);
    });
  });

  describe('getFileChurn', () => {
    it('should count commit lines correctly', async () => {
      mockSpawn('abc1234 Initial commit\ndef5678 Update file\nghi9012 Fix bug\n');
      const count = await getFileChurn('/project', 'src/index.ts');
      expect(count).toBe(3);
    });

    it('should return 0 for a file with no commits', async () => {
      mockSpawn('');
      const count = await getFileChurn('/project', 'new-file.ts');
      expect(count).toBe(0);
    });

    it('should return 0 on git failure', async () => {
      mockSpawnError();
      const count = await getFileChurn('/project', 'src/index.ts');
      expect(count).toBe(0);
    });
  });

  describe('getTopAuthors', () => {
    it('should parse shortlog output correctly', async () => {
      mockSpawn('   150\tAlice\n    80\tBob\n    30\tCharlie\n    10\tDave\n');
      const authors = await getTopAuthors('/project', 3);

      expect(authors.length).toBe(3);
      expect(authors[0]).toEqual({ name: 'Alice', commits: 150 });
      expect(authors[1]).toEqual({ name: 'Bob', commits: 80 });
      expect(authors[2]).toEqual({ name: 'Charlie', commits: 30 });
    });

    it('should return empty array on git failure', async () => {
      mockSpawnError();
      const authors = await getTopAuthors('/project');
      expect(authors).toEqual([]);
    });

    it('should return empty array for repos with no commits', async () => {
      mockSpawn('');
      const authors = await getTopAuthors('/project');
      expect(authors).toEqual([]);
    });
  });

  describe('batchGetFileChurn', () => {
    it('should batch-fetch churn for multiple files', async () => {
      // Mock spawn to return different values for sequential calls
      let callCount = 0;
      (cp.spawn as any).mockImplementation(() => {
        callCount++;
        const commitCount = callCount;
        const proc = new EventEmitter() as any;
        const lines = Array.from({ length: commitCount }, (_, i) => `abc${i} commit`).join('\n');
        proc.stdout = new Readable({
          read() {
            this.push(lines + '\n');
            this.push(null);
          },
        });
        proc.stderr = new Readable({ read() { this.push(null); } });
        setTimeout(() => proc.emit('close', 0), 5);
        return proc;
      });

      const result = await batchGetFileChurn('/project', ['a.ts', 'b.ts', 'c.ts'], 2);

      expect(result.size).toBe(3);
      expect(result.get('a.ts')).toBeGreaterThan(0);
      expect(result.get('b.ts')).toBeGreaterThan(0);
      expect(result.get('c.ts')).toBeGreaterThan(0);
    });
  });
});
