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
    .version('1.0.0')
    .option('-d, --root-dir <path>', 'Root directory to scan (default: current directory)')
    .option(
      '-o, --output-mode <mode>',
      'Output mode: terminal, markdown, or html (default: terminal)'
    )
    .option('-t, --include-tests', 'Include test files in the analysis')
    .option('--no-gitignore', 'Ignore .gitignore rules')
    .option('--no-cache', 'Disable caching')
    .option('--clear-cache', 'Clear the cache before scanning')
    .option('-f, --force', 'Force overwrite output files (for markdown mode)')
    .option('--output <path>', 'Output file path (for markdown mode)')
    .option('--fail-on-size <mb>', 'Maximum allowed codebase size in MB (CI mode)', parseFloat)
    .option('--min-comment-ratio <percent>', 'Minimum required comment ratio as % (CI mode)', parseFloat)
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
  };
}
