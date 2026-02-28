import ignore, { Ignore } from 'ignore';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_IGNORES = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.next',
  '.nuxt',
  'coverage',
  '.kountcache.json', // Our own cache file
  '.kountcache',
  '.kount', // Our history directory
  '.kountignore',
  '.kountrc.json',
  'kount-report.*',
];

interface IgnoreContext {
  ig: Ignore;
  dir: string;
}

/**
 * Parses ignore files and builds a matcher set for a given directory tree.
 * Respects default ignores automatically.
 */
export class IgnoreParser {
  // Store ignore instances keyed by directory path
  private directoryIgnores = new Map<string, Ignore>();
  private rootDir: string;
  private respectGitignore: boolean;
  
  // Track binary extensions to filter out automatically
  private static readonly BINARY_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.tiff', '.bmp',
    '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.webm', '.flv',
    '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.zip', '.tar', '.gz', '.7z', '.rar', '.bz2', '.xz',
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dat', '.db', '.sqlite',
    '.app', '.dmg', '.iso', '.class', '.jar', '.war', '.ear',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.pyc', '.pyo', '.pyd', '.o', '.a', '.lib', '.out',
    '.wasm'
  ]);

  constructor(rootDir: string, respectGitignore: boolean = true) {
    this.rootDir = path.resolve(rootDir);
    this.respectGitignore = respectGitignore;
  }

  /**
   * Initializes the base ignores (defaults + root .kountignore/.gitignore).
   * Call this before walking.
   */
  async init(): Promise<void> {
    const rootIg = ignore().add(DEFAULT_IGNORES);
    await this.loadIgnoreFiles(this.rootDir, rootIg);
    this.directoryIgnores.set(this.rootDir, rootIg);
  }

  /**
   * Loads `.gitignore` or `.kountignore` inside a specific directory.
   */
  async loadIgnoreForDir(dirPath: string): Promise<void> {
    if (this.directoryIgnores.has(dirPath)) return;

    // Inherit from parent directory (if any) or fallback to root if not loaded somehow
    const parentDir = path.dirname(dirPath);
    const parentIg = this.directoryIgnores.get(parentDir) || this.directoryIgnores.get(this.rootDir);
    
    // Create a new instance starting with parent's rules.  Wait, ignore doesn't deep clone easily.
    // Instead, we just maintain a stack of ig instances during walk, but for class-level,
    // we can create a fresh ignore and add parent's rules if we tracked them, OR just test
    // a path against all ignores from root to current dir.
    // For simplicity and speed: We will test a relative path against an array of ignores.
    
    // Actually, ignore is designed to be used by resolving paths relative to where the .gitignore is.
    // Let's store rules per directory.
    const ig = ignore();
    const hasRules = await this.loadIgnoreFiles(dirPath, ig);
    
    // If no new rules, we don't strictly need to store it, but let's store undefined or similar
    // to mark it processed.
    if (hasRules) {
        this.directoryIgnores.set(dirPath, ig);
    }
  }

  /**
   * Helper to append rules from files to an Ignore instance.
   * Returns true if rules were added.
   */
  private async loadIgnoreFiles(dirPath: string, ig: Ignore): Promise<boolean> {
    let hasRules = false;

    // Load .kountignore first (custom rules overrides everything else if needed, though ignore merges them)
    try {
      const kountIgnorePath = path.join(dirPath, '.kountignore');
      const kountRules = await fs.readFile(kountIgnorePath, 'utf8');
      ig.add(kountRules);
      hasRules = true;
    } catch (e) { /* ignores missing file */ }

    // Load .gitignore
    if (this.respectGitignore) {
      try {
        const gitIgnorePath = path.join(dirPath, '.gitignore');
        const gitRules = await fs.readFile(gitIgnorePath, 'utf8');
        ig.add(gitRules);
        hasRules = true;
      } catch (e) { /* ignores missing file */ }
    }

    return hasRules;
  }

  /**
   * Checks if an absolute path should be ignored.
   */
  isIgnored(absolutePath: string, isDirectory: boolean): boolean {
    // 1. Binary check
    if (!isDirectory) {
      const ext = path.extname(absolutePath).toLowerCase();
      if (IgnoreParser.BINARY_EXTENSIONS.has(ext)) {
        return true;
      }
    }

    // 2. Resolve relative to root to check against ignores
    const relativeToRoot = path.relative(this.rootDir, absolutePath);
    
    // Edge case: if it evaluates to empty string (which means absolutePath == rootDir), don't ignore
    if (relativeToRoot === '') return false;

    // We need to check the path formatted for `ignore` package (forward slashes)
    // and if it's a directory, adding a trailing slash helps `ignore` match dir-only rules eagerly.
    const posixPath = relativeToRoot.split(path.sep).join('/');
    const testPath = isDirectory ? `${posixPath}/` : posixPath;

    // 3. Test against root ignores first (which contains defaults)
    const rootIg = this.directoryIgnores.get(this.rootDir);
    if (rootIg && rootIg.ignores(testPath)) {
        return true;
    }

    // 4. Test against nested directory ignores (from root down to the file's dir)
    // E.g. for src/components/Button.tsx, check src/ and src/components/
    const parts = relativeToRoot.split(path.sep);
    let currentPath = this.rootDir;

    for (let i = 0; i < parts.length - 1; i++) { // -1 because we don't need to check in the file's own name as a dir
      currentPath = path.join(currentPath, parts[i]);
      const dirIg = this.directoryIgnores.get(currentPath);
      
      if (dirIg) {
          // The ignore package checks paths relative to where the .gitignore file is located.
          const relToIgnoreFile = path.relative(currentPath, absolutePath);
          const relPosixPath = relToIgnoreFile.split(path.sep).join('/');
          const nestedTestPath = isDirectory ? `${relPosixPath}/` : relPosixPath;
          
          if (dirIg.ignores(nestedTestPath)) {
              return true;
          }
      }
    }

    return false;
  }
}
