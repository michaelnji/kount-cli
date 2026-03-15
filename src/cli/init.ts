import { spawn } from 'node:child_process';
import * as fsp from 'node:fs/promises';
import path from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return rl.question(question);
}

function yesNo(answer: string, defaultYes: boolean): boolean {
  const trimmed = answer.trim().toLowerCase();
  if (trimmed === '') return defaultYes;
  return trimmed === 'y' || trimmed === 'yes';
}

async function isGitAvailable(): Promise<boolean> {
  return new Promise(resolve => {
    const proc = spawn('git', ['rev-parse', '--is-inside-work-tree'], {
      stdio: 'ignore',
      timeout: 2000,
    });
    proc.on('close', code => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

/**
 * Interactive wizard that generates a .kountrc.json config file
 * in the current working directory.
 */
export async function runInit(): Promise<void> {
  const rcPath = path.join(process.cwd(), '.kountrc.json');

  // Check if config already exists
  let exists = false;
  try {
    await fsp.access(rcPath);
    exists = true;
  } catch {
    // file doesn't exist — proceed silently
  }

  const rl = createInterface({ input, output });

  if (exists) {
    const overwrite = await ask(rl, '\n.kountrc.json already exists. Overwrite? [y/N] ');
    if (!yesNo(overwrite, false)) {
      process.stdout.write('Aborted — existing config unchanged.\n');
      rl.close();
      return;
    }
  }

  process.stdout.write('\nKount Configuration Wizard\n');
  process.stdout.write('─'.repeat(40) + '\n\n');

  // Root directory
  const rootDirAnswer = await ask(rl, 'Root directory to scan? [.] ');
  const rootDir = rootDirAnswer.trim() || '.';

  // Output format
  const outputModeAnswer = await ask(rl, 'Output format (terminal/html/json/csv/markdown)? [terminal] ');
  const outputModeRaw = outputModeAnswer.trim().toLowerCase() || 'terminal';
  const validModes = ['terminal', 'html', 'json', 'csv', 'markdown'];
  const outputMode = validModes.includes(outputModeRaw) ? outputModeRaw : 'terminal';

  // Include tests
  const includeTestsAnswer = await ask(rl, 'Include test files in analysis? [y/N] ');
  const includeTests = yesNo(includeTestsAnswer, false);

  // Respect gitignore
  const respectGitignoreAnswer = await ask(rl, 'Respect .gitignore rules? [Y/n] ');
  const respectGitignore = yesNo(respectGitignoreAnswer, true);

  // Deep git (only if git is available)
  let deepGit = false;
  const gitAvailable = await isGitAvailable();
  if (gitAvailable) {
    const deepGitAnswer = await ask(rl, 'Enable deep git analytics (blame, numstat)? [y/N] ');
    deepGit = yesNo(deepGitAnswer, false);
  }

  // Stale threshold
  const staleAnswer = await ask(rl, 'Stale file threshold in years? [2] ');
  const staleParsed = parseFloat(staleAnswer.trim());
  const staleThreshold = isNaN(staleParsed) ? 2 : staleParsed;

  // Quality gates
  const gatesAnswer = await ask(rl, 'Set quality gates? [y/N] ');

  interface QualityGates {
    minCommentRatio?: number;
    failOnSize?: number;
    maxComplexity?: number;
  }
  let qualityGates: QualityGates | undefined;

  if (yesNo(gatesAnswer, false)) {
    const commentRatioAnswer = await ask(rl, '  Min comment ratio % (blank to skip)? ');
    const sizeAnswer = await ask(rl, '  Max codebase size in MB (blank to skip)? ');
    const complexityAnswer = await ask(rl, '  Max file complexity score (blank to skip)? ');

    const gates: QualityGates = {};

    const ratio = parseFloat(commentRatioAnswer.trim());
    if (!isNaN(ratio)) gates.minCommentRatio = ratio;

    const size = parseFloat(sizeAnswer.trim());
    if (!isNaN(size)) gates.failOnSize = size;

    const complexity = parseFloat(complexityAnswer.trim());
    if (!isNaN(complexity)) gates.maxComplexity = complexity;

    if (Object.keys(gates).length > 0) {
      qualityGates = gates;
    }
  }

  rl.close();

  // Build config object
  interface KountRcFile {
    rootDir: string;
    outputMode: string;
    includeTests: boolean;
    respectGitignore: boolean;
    deepGit: boolean;
    staleThreshold: number;
    minCommentRatio?: number;
    failOnSize?: number;
    maxComplexity?: number;
  }
  const config: KountRcFile = {
    rootDir,
    outputMode,
    includeTests,
    respectGitignore,
    deepGit,
    staleThreshold,
    ...qualityGates,
  };

  await fsp.writeFile(rcPath, JSON.stringify(config, null, 2) + '\n', 'utf8');

  process.stdout.write(`\n.kountrc.json written to ${rcPath}\n`);
  process.stdout.write('Run "kount" to start your first analysis.\n\n');
}
