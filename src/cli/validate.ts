import * as fsp from 'node:fs/promises';
import path from 'node:path';
import type { KountConfig } from './config-resolver.js';

const VALID_OUTPUT_MODES = ['terminal', 'markdown', 'html', 'json', 'csv'] as const;
const VALID_BADGE_METRICS = ['files', 'lines', 'comment-ratio', 'debt-score', 'complexity'] as const;

/**
 * Validates a resolved KountConfig and returns an array of human-readable
 * error messages. Returns an empty array if the config is valid.
 *
 * Covers both CLI flags and values sourced from .kountrc.json/.kountrc.yaml.
 */
export async function validateConfig(config: KountConfig): Promise<string[]> {
  const errors: string[] = [];

  // ── rootDir ──────────────────────────────────────────────────────────────
  try {
    const stat = await fsp.stat(config.rootDir);
    if (!stat.isDirectory()) {
      errors.push(`--root-dir "${config.rootDir}" is not a directory.`);
    }
  } catch {
    errors.push(
      `--root-dir "${config.rootDir}" does not exist or is not accessible.`
    );
  }

  // ── outputPath parent directory ───────────────────────────────────────────
  if (config.outputPath !== undefined) {
    const parentDir = path.dirname(path.resolve(config.outputPath));
    try {
      await fsp.access(parentDir);
    } catch {
      errors.push(
        `--output parent directory "${parentDir}" does not exist.`
      );
    }
  }

  // ── outputMode ────────────────────────────────────────────────────────────
  if (!VALID_OUTPUT_MODES.includes(config.outputMode as typeof VALID_OUTPUT_MODES[number])) {
    errors.push(
      `--output-mode "${config.outputMode}" is invalid. Valid modes: ${VALID_OUTPUT_MODES.join(', ')}.`
    );
  }

  // ── staleThreshold ────────────────────────────────────────────────────────
  if (!Number.isFinite(config.staleThreshold) || config.staleThreshold <= 0) {
    errors.push(
      `--stale-threshold must be a positive number greater than 0 (got: ${config.staleThreshold}).`
    );
  }

  // ── Quality gates ─────────────────────────────────────────────────────────
  const gates = config.qualityGates;
  if (gates) {
    if (gates.failOnSize !== undefined) {
      if (!Number.isFinite(gates.failOnSize) || gates.failOnSize <= 0) {
        errors.push(
          `--fail-on-size must be a positive number in MB (got: ${gates.failOnSize}).`
        );
      }
    }

    if (gates.minCommentRatio !== undefined) {
      if (
        !Number.isFinite(gates.minCommentRatio) ||
        gates.minCommentRatio < 0 ||
        gates.minCommentRatio > 100
      ) {
        errors.push(
          `--min-comment-ratio must be between 0 and 100 (got: ${gates.minCommentRatio}).`
        );
      }
    }

    if (gates.maxComplexity !== undefined) {
      if (!Number.isFinite(gates.maxComplexity) || gates.maxComplexity < 1) {
        errors.push(
          `--max-complexity must be a positive number >= 1 (got: ${gates.maxComplexity}).`
        );
      }
    }
  }

  // ── badge ─────────────────────────────────────────────────────────────────
  if (
    config.badge !== undefined &&
    !VALID_BADGE_METRICS.includes(config.badge as typeof VALID_BADGE_METRICS[number])
  ) {
    errors.push(
      `--badge metric "${config.badge}" is invalid. Valid metrics: ${VALID_BADGE_METRICS.join(', ')}.`
    );
  }

  return errors;
}
