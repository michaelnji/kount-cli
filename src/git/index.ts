import { spawn } from 'node:child_process';

/**
 * Runs a git command and returns stdout as a string.
 * Returns null if the command fails (e.g., not a git repo, git not installed).
 */
function runGit(args: string[], cwd: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const proc = spawn('git', args, {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      proc.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8');
      });

      proc.on('error', () => {
        // Git not installed or spawn failed
        resolve(null);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          resolve(null);
        }
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Checks if the given directory is inside a valid Git repository.
 */
export async function isGitRepo(dir: string): Promise<boolean> {
  const result = await runGit(['rev-parse', '--git-dir'], dir);
  return result !== null;
}

/**
 * Returns the list of files changed relative to a target branch.
 * Uses `git diff --name-only <targetBranch>` to get changed paths.
 */
export async function getChangedFiles(dir: string, targetBranch: string): Promise<string[]> {
  const result = await runGit(['diff', '--name-only', targetBranch], dir);
  if (result === null) return [];

  return result
    .trim()
    .split('\n')
    .filter((line) => line.length > 0);
}

/**
 * Returns the number of commits that modified a specific file.
 * Uses `git log --oneline -- <filePath>` and counts the output lines.
 */
export async function getFileChurn(dir: string, filePath: string): Promise<number> {
  const result = await runGit(['log', '--oneline', '--', filePath], dir);
  if (result === null) return 0;

  const trimmed = result.trim();
  if (trimmed.length === 0) return 0;

  return trimmed.split('\n').length;
}

/**
 * Returns the top N authors by commit count using `git shortlog -sn HEAD`.
 */
export async function getTopAuthors(
  dir: string,
  limit: number = 3
): Promise<Array<{ name: string; commits: number }>> {
  const result = await runGit(['shortlog', '-sn', 'HEAD'], dir);
  if (result === null) return [];

  return result
    .trim()
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => {
      // Format: "   123\tAuthor Name"
      const match = line.match(/^\s*(\d+)\s+(.+)$/);
      if (!match) return null;
      return { name: match[2].trim(), commits: parseInt(match[1], 10) };
    })
    .filter((entry): entry is { name: string; commits: number } => entry !== null)
    .slice(0, limit);
}

/**
 * Batch-fetches churn (commit count) for multiple files with a concurrency limit.
 * Returns a Map of filePath → commit count.
 */
export async function batchGetFileChurn(
  dir: string,
  filePaths: string[],
  concurrency: number = 20
): Promise<Map<string, number>> {
  const results = new Map<string, number>();

  // Process in chunks of `concurrency`
  for (let i = 0; i < filePaths.length; i += concurrency) {
    const batch = filePaths.slice(i, i + concurrency);
    const churnResults = await Promise.all(
      batch.map(async (fp) => {
        const commits = await getFileChurn(dir, fp);
        return { filePath: fp, commits };
      })
    );

    for (const { filePath, commits } of churnResults) {
      results.set(filePath, commits);
    }
  }

  return results;
}

/**
 * Returns the relative age of the last commit for a file (e.g., "2 years ago").
 */
export async function getFileAge(dir: string, filePath: string): Promise<string | null> {
  const result = await runGit(['log', '-1', '--format=%ar', '--', filePath], dir);
  if (result === null) return null;
  const trimmed = result.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Returns the bus factor (count of unique authors) for a file.
 */
export async function getBusFactor(dir: string, filePath: string): Promise<{ count: number; primaryAuthor?: string }> {
  const result = await runGit(['log', '--format=%an', '--', filePath], dir);
  if (result === null) return { count: 0 };

  const authors = result
    .trim()
    .split('\n')
    .filter((line) => line.trim().length > 0);

  const uniqueAuthors = new Set(authors);
  return {
    count: uniqueAuthors.size,
    primaryAuthor: uniqueAuthors.size === 1 ? Array.from(uniqueAuthors)[0] : undefined
  };
}

/**
 * Returns the total number of lines inserted and deleted for a file over its history.
 */
export async function getFileVolatility(dir: string, filePath: string): Promise<{ insertions: number; deletions: number }> {
  const result = await runGit(['log', '--numstat', '--oneline', '--', filePath], dir);
  if (result === null) return { insertions: 0, deletions: 0 };

  let insertions = 0;
  let deletions = 0;

  const lines = result.trim().split('\n');
  for (const line of lines) {
    // Format is "10\t5\tpath/to/file" or "10    5    path/to/file"
    // Binary files show "-"
    const match = line.match(/^(\d+|-)\s+(\d+|-)\s+(.+)$/);
    if (match) {
      if (match[1] !== '-') insertions += parseInt(match[1], 10);
      if (match[2] !== '-') deletions += parseInt(match[2], 10);
    }
  }

  return { insertions, deletions };
}

/**
 * Runs git blame to calculate the true ownership of a file's surviving lines.
 */
export async function getSurvivingOwnership(dir: string, filePath: string): Promise<Array<{ author: string; lines: number }>> {
  const result = await runGit(['blame', '--line-porcelain', '--', filePath], dir);
  if (result === null) return [];

  const lines = result.trim().split('\n');
  const ownership = new Map<string, number>();

  for (const line of lines) {
    if (line.startsWith('author ')) {
      const author = line.substring(7); // Strip "author " length
      if (author !== 'Not Committed Yet') {
        ownership.set(author, (ownership.get(author) || 0) + 1);
      }
    }
  }

  return Array.from(ownership.entries())
    .map(([author, count]) => ({ author, lines: count }))
    .sort((a, b) => b.lines - a.lines);
}
