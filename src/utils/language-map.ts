/**
 * Maps file extensions to their corresponding comment syntaxes.
 * This is used by the comment-lines plugin to accurately count comments.
 */
export const LANGUAGE_COMMENT_MAP: Record<string, string[]> = {
  // C-style (JS, TS, Java, C, C++, C#, Go, Swift, Rust, Kotlin, Dart, Scala, Objective-C)
  '.js': ['//', '/* */'],
  '.ts': ['//', '/* */'],
  '.jsx': ['//', '/* */'],
  '.tsx': ['//', '/* */'],
  '.java': ['//', '/* */'],
  '.c': ['//', '/* */'],
  '.cpp': ['//', '/* */'],
  '.cs': ['//', '/* */'],
  '.go': ['//', '/* */'],
  '.swift': ['//', '/* */'],
  '.rs': ['//', '/* */'],
  '.kt': ['//', '/* */'],
  '.dart': ['//', '/* */'],
  '.scala': ['//', '/* */'],
  '.m': ['//', '/* */'],
  '.mm': ['//', '/* */'],
  '.css': ['/* */'],
  '.scss': ['//', '/* */'],
  '.less': ['//', '/* */'],

  // Hash-style (Python, Ruby, Shell, YAML, Perl, PHP (also uses //), R, PowerShell, Makefile)
  '.py': ['#'],
  '.rb': ['#'],
  '.sh': ['#'],
  '.bash': ['#'],
  '.zsh': ['#'],
  '.yaml': ['#'],
  '.yml': ['#'],
  '.pl': ['#'],
  '.pm': ['#'],
  '.r': ['#'],
  '.ps1': ['#'],
  'makefile': ['#'], // Note: Makefile might not have an extension, handle separately if needed

  // HTML/XML-style (HTML, XML, SVG, Markdown, Vue)
  '.html': ['<!-- -->'],
  '.htm': ['<!-- -->'],
  '.xml': ['<!-- -->'],
  '.svg': ['<!-- -->'],
  '.md': ['<!-- -->'],
  '.vue': ['<!-- -->', '//', '/* */'], // Vue can have JS/TS inside <script> and CSS inside <style>

  // Dash-style (SQL, Lua, Haskell, Ada, VHDL)
  '.sql': ['--'],
  '.lua': ['--'],
  '.hs': ['--'],
  '.ada': ['--'],
  '.vhdl': ['--'],

  // Lisp-style (Lisp, Clojure, Scheme)
  '.lisp': [';'],
  '.clj': [';'],
  '.scm': [';'],

  // PHP
  '.php': ['//', '#', '/* */'],

  // JSON (Standard JSON has no comments, but JSONC allowing comments is common in tools)
  '.jsonc': ['//', '/* */'],
};

/**
 * Returns the expected comment syntax array for a given file extension.
 * If the extension is not mapped, returns an empty array.
 * 
 * @param extension The file extension including the dot (e.g., '.ts')
 * @returns Array of comment syntaxes (e.g., ['//', '/* *\/']) or empty array if not found.
 */
export function getCommentSyntax(extension: string): string[] {
  // Ensure the extension starts with a dot if it's not a known full filename like Makefile
  const normalizedExt = extension.toLowerCase();
  return LANGUAGE_COMMENT_MAP[normalizedExt] || [];
}
