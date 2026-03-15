import { Command } from 'commander';
import { version } from '../../package.json';
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
    .version(version, '-V, --version', 'Print version number')
    // ── Core ──────────────────────────────────────────────────────────────────
    .option('-d, --root-dir <path>', 'Root directory to scan (default: .)')
    .option(
      '-o, --output-mode <mode>',
      'Output format: terminal | html | markdown | json | csv (default: terminal)'
    )
    .option('--output <path>', 'Destination file path for the report (default: auto)')
    .option('-f, --force', 'Force overwrite of the output file')
    .option('-t, --include-tests', 'Include test files and directories in the analysis (default: false)')
    // ── Cache & Ignore ────────────────────────────────────────────────────────
    .option('--no-cache', 'Disable the incremental caching engine for this run')
    .option('--clear-cache', 'Purge the existing cache before scanning (default: false)')
    .option('--no-gitignore', 'Disable parsing of .gitignore and .kountignore rules')
    // ── Git Intelligence ──────────────────────────────────────────────────────
    .option('--diff <branch>', 'Only analyze files changed relative to <branch> (e.g. main)')
    .option('--deep-git', 'Enable deep analytics: git blame + numstat — file age, bus factor, knowledge silos, stale files, volatility (default: false)')
    .option('--stale-threshold <years>', 'Age threshold in years to classify files as stale (default: 2)', parseFloat)
    // ── Quality Gates (CI/CD) ─────────────────────────────────────────────────
    .option('--fail-on-size <mb>', 'Exit code 1 if total codebase size exceeds <mb> MB', parseFloat)
    .option('--min-comment-ratio <percent>', 'Exit code 1 if comment ratio falls below <percent>%', parseFloat)
    .option('--max-complexity <n>', 'Exit code 1 if any file\'s cyclomatic complexity exceeds <n>', parseFloat)
    // ── Badge ─────────────────────────────────────────────────────────────────
    .option('--badge <metric>', 'Generate a Shields.io endpoint JSON for: files | lines | comment-ratio | debt-score | complexity')
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
    maxComplexity?: number;
    badge?: string;
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
    maxComplexity: opts.maxComplexity,
    badge: opts.badge,
  };
}
