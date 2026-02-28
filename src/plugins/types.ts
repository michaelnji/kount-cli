/**
 * Execution stages for the progress checklist UI.
 */
export type ExecutionStage =
  | 'DISCOVERING'
  | 'ANALYZING'
  | 'GIT_METRICS'
  | 'CALCULATING_DEBT'
  | 'RENDERING';

/**
 * All stages in execution order (used by the checklist component).
 */
export const EXECUTION_STAGES: ExecutionStage[] = [
  'DISCOVERING',
  'ANALYZING',
  'GIT_METRICS',
  'CALCULATING_DEBT',
  'RENDERING',
];

/**
 * Human-readable labels for each stage.
 */
export const STAGE_LABELS: Record<ExecutionStage, string> = {
  DISCOVERING: 'Discovering files',
  ANALYZING: 'Analyzing files',
  GIT_METRICS: 'Fetching Git metrics',
  CALCULATING_DEBT: 'Calculating Tech Debt',
  RENDERING: 'Preparing results',
};

/**
 * Callback fired by the engine to report stage transitions and active file.
 */
export type StageCallback = (stage: ExecutionStage, activeFile?: string) => void;

/**
 * @deprecated Use StageCallback instead. Kept for backwards compat.
 */
export type ProgressCallback = (status: string, details?: string) => void;

/**
 * Represents the result of a single plugin's analysis on the entire project.
 */
export interface PluginResult {
  /** The name of the plugin that produced this result. */
  pluginName: string;
  /** Summary-level metric value (e.g. total lines across all files). */
  summaryValue: number;
  /** Per-file breakdown of the metric, keyed by file path. */
  perFile: Map<string, number>;
}

/**
 * The contract every analyzer plugin must implement.
 * Plugins receive the full list of scanned files and their line data,
 * then return aggregated results.
 */
export interface AnalyzerPlugin {
  /** Unique name of this plugin (e.g. 'TotalLines'). */
  name: string;
  /** Analyze scanned files and return aggregated results. */
  analyze(files: AnalyzedFileData[]): PluginResult;
}

/**
 * Enriched file data created by the aggregator after streaming each file.
 * Contains raw line data so plugins don't need to re-read files.
 */
export interface AnalyzedFileData {
  /** Absolute path to the scanned file. */
  filePath: string;
  /** File size in bytes (from stat). */
  size: number;
  /** File extension including the dot, e.g. '.ts'. */
  extension: string;
  /** All lines of the file as strings. */
  lines: string[];
  /** Number of git commits that modified this file (populated by aggregator if git available). */
  commits?: number;
  /** Relative age of the last commit (e.g. "2 years ago"). */
  age?: string | null;
  /** Count of unique authors who have contributed to the file. */
  busFactor?: number;
  /** Number of lines inserted and deleted over time. */
  volatility?: { insertions: number; deletions: number };
  /** Name of the author who owns the most surviving lines. */
  topOwner?: string;
}

/**
 * The final aggregated stats payload produced by the Orchestrator.
 * Consumed by reporters to render output.
 */
export interface ProjectStats {
  /** Root directory that was scanned. */
  rootDir: string;
  /** Total number of files scanned. */
  totalFiles: number;
  /** Results from each plugin, keyed by plugin name. */
  pluginResults: Map<string, PluginResult>;
  /** Language distribution: language name -> file count. */
  languageDistribution: Map<string, number>;
  /** Top N largest files by size. */
  largestFiles: Array<{ filePath: string; size: number }>;
  /** Top files with the most technical debt markers (TODO/FIXME/HACK). */
  debtHotspots: Array<{ filePath: string; count: number }>;
  /** Git intelligence data (undefined when not a git repo or git unavailable). */
  gitInsights?: {
    diffBranch?: string;
    topAuthors: Array<{ name: string; commits: number }>;
    highChurnFiles: Array<{ filePath: string; commits: number }>;
    staleFilesCount?: number;
    knowledgeSilos?: Array<{ filePath: string; author: string }>;
    suggestedReviewers?: Array<{ name: string; ownedLines: number }>;
    fileGitMetrics?: Map<string, {
      age?: string | null;
      busFactor?: number;
      volatility?: { insertions: number; deletions: number };
      topOwner?: string;
    }>;
  };
  /** Composite tech debt score for the entire project. */
  techDebtScore?: number;
  /** Top files with highest tech debt scores. */
  highDebtFiles?: Array<{ filePath: string; score: number }>;
  /** Trend deltas vs. previous run (undefined if no previous run exists). */
  trends?: {
    linesDelta: number;
    fileDelta: number;
    sizeDelta: number;
    commentRatioDelta: number;
    debtDelta: number;
  };
  /** Top external dependencies by import frequency (undefined if no JS/TS files). */
  topDependencies?: Array<{ name: string; count: number }>;
  /** Timestamp of when the scan completed. */
  scannedAt: Date;
}
