import { Command } from 'commander';
import type { CliFlags } from './config-resolver.js';

/**
 * Creates and configures the Commander CLI program.
 * Returns parsed CLI flags for the config resolver.
 *
 * Follows tuicfg-sensible-defaults, tuicfg-flags-over-args,
 * and tuicfg-help-system guidelines from terminal-ui skill.
 */
export function createCli(argv: string[]): CliFlags {
  const program = new Command();

  program
    .name('kount')
    .description('Project Intelligence for Codebases — analyze your code with precision.')
    .version('1.0.3')
    .option('-d, --root-dir <path>', 'Specify the root directory to scan (default: current directory)')
    .option(
      '-o, --output-mode <mode>',
      'Choose output format: "terminal" (interactive UI), "markdown", "html" (dashboard), "json", or "csv"'
    )
    .option('-t, --include-tests', 'Include test files and directories in the analysis')
    .option('--no-gitignore', 'Disable parsing of .gitignore and .kountignore rules')
    .option('--no-cache', 'Disable the incremental high-performance caching engine')
    .option('--clear-cache', 'Purge the existing cache before running the scan')
    .option('-f, --force', 'Force overwrite of the output file (Markdown/JSON/CSV modes)')
    .option('--output <path>', 'Specify the destination file path for reports')
    .option('--fail-on-size <mb>', 'CI/CD Gate: Fail with exit code 1 if codebase exceeds <mb> MB', parseFloat)
    .option('--min-comment-ratio <percent>', 'CI/CD Gate: Fail with exit code 1 if comment ratio is below <percent>%', parseFloat)
    .option('--diff <branch>', 'Git Intelligence: Only analyze files changed relative to the specified <branch>')
    .option('--deep-git', 'Git Intelligence: Enable deep analytics (blame, numstat) which can be slow on large repos')
    .option('--stale-threshold <years>', 'Git Intelligence: Define stale file threshold in years (default: 2)', parseFloat)
    .parse(argv);

  const opts = program.opts<{
    rootDir?: string;
    outputMode?: string;
    includeTests?: boolean;
    gitignore?: boolean;
    cache?: boolean;
    clearCache?: boolean;
    force?: boolean;
    output?: string;
    failOnSize?: number;
    minCommentRatio?: number;
    diff?: string;
    deepGit?: boolean;
    staleThreshold?: number;
  }>();

  return {
    rootDir: opts.rootDir,
    outputMode: opts.outputMode,
    includeTests: opts.includeTests,
    respectGitignore: opts.gitignore, // Commander converts --no-gitignore to gitignore: false
    cache: opts.cache, // Commander converts --no-cache to cache: false
    clearCache: opts.clearCache,
    force: opts.force,
    output: opts.output,
    failOnSize: opts.failOnSize,
    minCommentRatio: opts.minCommentRatio,
    diff: opts.diff,
    deepGit: opts.deepGit,
    staleThreshold: opts.staleThreshold,
  };
}
