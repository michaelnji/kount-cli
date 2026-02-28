import fsp from 'node:fs/promises';
import path from 'node:path';

/**
 * Resolved configuration used throughout the application.
 */
export interface KountConfig {
  rootDir: string;
  outputMode: 'terminal' | 'markdown' | 'html' | 'json' | 'csv';
  includeTests: boolean;
  respectGitignore: boolean;
  cache: {
    enabled: boolean;
    clearFirst: boolean;
  };
  force: boolean;
  outputPath?: string;
  qualityGates?: {
    failOnSize?: number;
    minCommentRatio?: number;
  };
  diffBranch?: string;
}

/**
 * Shape of the .kountrc.json / .kountrc.yaml config file.
 */
interface ConfigFile {
  rootDir?: string;
  outputMode?: string;
  includeTests?: boolean;
  respectGitignore?: boolean;
  cache?: {
    enabled?: boolean;
    clearFirst?: boolean;
  };
  failOnSize?: number;
  minCommentRatio?: number;
  diffBranch?: string;
}

/**
 * CLI flags that can override the config file.
 */
export interface CliFlags {
  rootDir?: string;
  outputMode?: string;
  includeTests?: boolean;
  respectGitignore?: boolean;
  cache?: boolean;
  clearCache?: boolean;
  force?: boolean;
  output?: string;
  failOnSize?: number;
  minCommentRatio?: number;
  diff?: string;
}

const DEFAULTS: KountConfig = {
  rootDir: '.',
  outputMode: 'terminal',
  includeTests: false,
  respectGitignore: true,
  cache: {
    enabled: true,
    clearFirst: false,
  },
  force: false,
};

/**
 * Attempts to load a config file from the given directory.
 * Checks for .kountrc.json first, then .kountrc.yaml.
 */
async function loadConfigFile(dir: string): Promise<ConfigFile> {
  const jsonPath = path.join(dir, '.kountrc.json');

  try {
    const raw = await fsp.readFile(jsonPath, 'utf8');
    return JSON.parse(raw) as ConfigFile;
  } catch {
    // JSON not found or invalid — try YAML
  }

  // YAML support: we'll parse manually for the simple flat structure
  // rather than adding a heavy dependency. This handles basic key: value pairs.
  const yamlPath = path.join(dir, '.kountrc.yaml');
  try {
    const raw = await fsp.readFile(yamlPath, 'utf8');
    return parseSimpleYaml(raw);
  } catch {
    // No config file found — use defaults
  }

  return {};
}

/**
 * Minimal YAML parser for flat config files.
 * Handles: string, boolean, and nested single-level objects.
 */
function parseSimpleYaml(raw: string): ConfigFile {
  const result: Record<string, unknown> = {};
  let currentObject: Record<string, unknown> | null = null;
  let currentKey = '';

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;

    if (indent > 0 && currentObject !== null) {
      // Nested key
      const match = trimmed.match(/^(\w+)\s*:\s*(.+)$/);
      if (match) {
        currentObject[match[1]] = parseYamlValue(match[2]);
      }
    } else {
      // Top-level key
      const match = trimmed.match(/^(\w+)\s*:\s*(.*)$/);
      if (match) {
        const key = match[1];
        const value = match[2].trim();

        if (value === '') {
          // Start of nested object
          currentKey = key;
          currentObject = {};
          result[key] = currentObject;
        } else {
          currentObject = null;
          result[key] = parseYamlValue(value);
        }
      }
    }
  }

  return result as unknown as ConfigFile;
}

function parseYamlValue(val: string): string | boolean | number {
  if (val === 'true') return true;
  if (val === 'false') return false;
  const num = Number(val);
  if (!isNaN(num) && val !== '') return num;
  // Strip quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  return val;
}

/**
 * Resolves the final configuration from:
 *   CLI flags > Config file > Defaults
 *
 * @param cliFlags Parsed CLI arguments.
 * @param cwd Current working directory (for finding config files).
 */
export async function resolveConfig(cliFlags: CliFlags, cwd: string = process.cwd()): Promise<KountConfig> {
  const fileConfig = await loadConfigFile(cwd);

  const outputMode = validateOutputMode(
    cliFlags.outputMode ?? fileConfig.outputMode ?? DEFAULTS.outputMode
  );

  return {
    rootDir: path.resolve(cwd, cliFlags.rootDir ?? fileConfig.rootDir ?? DEFAULTS.rootDir),
    outputMode,
    includeTests: cliFlags.includeTests ?? fileConfig.includeTests ?? DEFAULTS.includeTests,
    respectGitignore: cliFlags.respectGitignore ?? fileConfig.respectGitignore ?? DEFAULTS.respectGitignore,
    cache: {
      enabled: cliFlags.cache ?? fileConfig.cache?.enabled ?? DEFAULTS.cache.enabled,
      clearFirst: cliFlags.clearCache ?? fileConfig.cache?.clearFirst ?? DEFAULTS.cache.clearFirst,
    },
    force: cliFlags.force ?? DEFAULTS.force,
    outputPath: cliFlags.output,
    qualityGates: buildQualityGates(cliFlags, fileConfig),
    diffBranch: cliFlags.diff ?? fileConfig.diffBranch,
  };
}

function buildQualityGates(
  cliFlags: CliFlags,
  fileConfig: ConfigFile
): KountConfig['qualityGates'] {
  const failOnSize = cliFlags.failOnSize ?? fileConfig.failOnSize;
  const minCommentRatio = cliFlags.minCommentRatio ?? fileConfig.minCommentRatio;

  if (failOnSize === undefined && minCommentRatio === undefined) {
    return undefined;
  }

  return { failOnSize, minCommentRatio };
}

function validateOutputMode(mode: string): 'terminal' | 'markdown' | 'html' | 'json' | 'csv' {
  const valid = ['terminal', 'markdown', 'html', 'json', 'csv'];
  if (valid.includes(mode)) return mode as 'terminal' | 'markdown' | 'html' | 'json' | 'csv';
  return 'terminal';
}
