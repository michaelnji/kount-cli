
# ANTIGRAVITY BUILD PROMPT: KOUNT CLI

 **Project** : KOUNT – Codebase Intelligence Terminal Tool

 **Runtime** : Node.js 20+ / Bun (Primary)

 **Language** : TypeScript (Strict Mode, ESM only)

 **Package Manager** : Bun exclusively (`bun add`, `bun run`)

You are tasked with building `kount` 90% autonomously based on this definitive specification. There are no placeholders. All instructions are production-ready. Read the entire document before generating code.

## 1. CORE ARCHITECTURE & STACK

* **CLI UI** : `ink` (React-based terminal UI)
* **Testing** : `vitest`
* **File Matching/Ignores** : `ignore` (npm package for `.gitignore` parsing, installed via Bun)
* **HTML Dashboard** : Tailwind CSS (CDN) + Alpine.js (CDN)
* **Execution Flow** : CLI initialization -> Config resolution -> Stream Scanner -> Analyzer Pipeline -> Aggregator -> Output Renderer (Terminal / Markdown / HTML).

## 2. DIRECTORY STRUCTURE

Enforce the following modular architecture:

**Plaintext**

```
kount/
├── src/
│   ├── cli/               # Ink React components, wizard, and CLI args parsing (yargs/commander)
│   ├── core/              # Orchestrator, Config resolver, Cache manager
│   ├── scanner/           # Directory walker, stream reader, gitignore parser
│   ├── plugins/           # AnalyzerPlugin interface and all built-in v1 plugins
│   ├── reporters/         # Output adapters: Terminal Reporter, Markdown Writer, HTML Server
│   └── utils/             # Language-to-comment-syntax maps, formatting helpers
├── tests/
│   ├── fixtures/          # Mock directories/files for testing
│   ├── scanner.test.ts
│   ├── plugins.test.ts
│   └── reporters.test.ts
├── package.json           # All scripts must use 'bun run'
├── tsconfig.json          # Strict mode, ESM
└── README.md
```

## 3. CONFIGURATION SPECIFICATION

Support `.kountrc.json` and `.kountrc.yaml`.

 **Precedence** : CLI flags > Config file > Defaults.

 **Schema** :

**TypeScript**

```
{
  "rootDir": "string",
  "outputMode": "terminal | markdown | html",
  "includeTests": boolean,
  "respectGitignore": boolean,
  "cache": {
    "enabled": boolean,
    "clearFirst": boolean
  }
}
```

 **Default Ignores (Always Enforced)** : `node_modules`, `dist`, `build`, `.git`.

## 4. SCANNER & STREAMING RULES (CRITICAL)

**Do NOT load files entirely into memory.** * You must use Node.js `fs.createReadStream` or `Bun.file().stream()` to read files chunk-by-chunk.

* Walk directories recursively.
* Filter binary files automatically.
* Use the npm `ignore` package to parse `.gitignore` files recursively and apply exclusion rules accurately.

## 5. ANALYZER & COMMENT DETECTION MAP

The scanner must detect languages by file extension and map them to appropriate comment syntaxes to accurately calculate metrics.

* **Metrics per file** : Total lines, blank lines, comment lines, file size (bytes).
* **Language Map Requirement** : Implement a robust dictionary mapping extensions to comment styles.
* e.g., `//` and `/* */` for `.js`, `.ts`, `.java`, `.cpp`, `.c`, `.cs`
* e.g., `#` for `.py`, `.rb`, `.sh`, `.yaml`, `.yml`
* e.g., `` for `.html`, `.xml`, `.md`, `.svg`
* e.g., `--` for `.sql`, `.lua`

## 6. PLUGIN INFRASTRUCTURE

Design the core aggregation layer to rely entirely on a Plugin Interface.

**TypeScript**

```
export interface AnalyzerPlugin {
    name: string;
    analyze(files: ScannedFile[]): PluginResult[];
}
```

* **v1 Constraint** : Build the infrastructure as if external plugins exist, but **do not** implement dynamic runtime loading for user plugins. All v1 plugins (TotalLines, BlankLines, CommentLines, TotalFiles, TotalBytes, LanguageDistribution, LargestFiles) must be built-in and implement this exact interface.

## 7. CACHING STRATEGY

Cache file location: `.kountcache.json`.

* **Invalidation Mechanism** : Optimize for large codebases. Do not hash file contents on every run. Use a combination of `mtime` (last modified time) and `size` (bytes). If both match the cache entry, skip scanning the file.
* Store aggregated metrics per file in the cache.

## 8. OUTPUT RENDERERS

### A. Terminal UI (Ink)

* Full-screen takeover on launch.
* Clean, minimal, step-based wizard if no CLI flags are provided.
* Real-time progress indicator during the streaming scan.
* **Visuals** : No emojis for boolean states. Use color-coding strictly (e.g., green for true/success, red for false/failure).
* **Splash Logo (Must be exact)** :

**Plaintext**

```
 ╭──────────────────────────────╮
  │    ██╗  ██╗ ██████╗ ██╗   ██╗███╗   ██╗████████╗
  │    ██║ ██╔╝██╔═══██╗██║   ██║████╗  ██║╚══██╔══╝
  │    █████╔╝ ██║   ██║██║   ██║██╔██╗ ██║   ██║
  │    ██╔═██╗ ██║   ██║██║   ██║██║╚██╗██║   ██║
  │    ██║  ██╗╚██████╔╝╚██████╔╝██║ ╚████║   ██║
  │    ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝   ╚═╝
  │
  │  Project Intelligence for Codebases
  ╰──────────────────────────────╯
```

### B. Markdown Output

* If `README.md` exists, append the report.
* If `--force` is passed, overwrite the target markdown file.
* Include: Summary (Files, Lines, Ratio, Size), Language distribution (descending %), Top 10 Largest Files.

### C. HTML Output (Temporary Dashboard)

* Spin up a temporary in-memory HTTP server.
* Auto-open the user's default browser.
* **UI Stack** : Inject Tailwind CSS (via CDN) for styling and Alpine.js (via CDN) for interactivity (e.g., sorting tables, toggling charts).
* Data must be injected into the HTML template before serving.

## 9. BEST PRACTICES, DO'S, AND DON'TS

### Do's:

* **Use Bun Exclusively** : Use `bun add <pkg>`, `bun add -d <pkg>`, and `bun run <script>` for all package management and execution.
* **Strict Typing** : Leverage TypeScript's strict mode fully. Define explicit return types for all functions and boundaries.
* **Graceful Error Handling** : Catch and handle file read errors (e.g., permission denied) cleanly without crashing the entire CLI. Display a formatted error in the Ink terminal.
* **Dependency Injection** : Pass dependencies (like the config object or logger) into your core classes rather than relying on global state.

### Don'ts:

* **No `any` Types** : Do not use `any` under any circumstances. Use `unknown` if the type is truly dynamic, and use type narrowing.
* **No Synchronous File Reads** : Absolutely no `fs.readFileSync` for analyzing file contents.
* **No `npm`, `yarn`, or `pnpm`** : Do not generate package.json scripts or commands relying on other package managers.
* **No Real FS Mutation in Tests** : Do not mutate the real host filesystem during Vitest runs. Use an in-memory mock (like `memfs`) or isolated temporary test directories that are cleaned up afterward.
* **No `console.log` in Core Engine** : The core engine, scanner, and plugins must remain pure. All output must be handled explicitly by the `reporters/` layer so it doesn't break the Ink UI.
