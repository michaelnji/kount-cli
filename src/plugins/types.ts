
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
  /** Timestamp of when the scan completed. */
  scannedAt: Date;
}
