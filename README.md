<p align="center">
<pre>
 ██╗  ██╗ ██████╗ ██╗   ██╗███╗   ██╗████████╗
 ██║ ██╔╝██╔═══██╗██║   ██║████╗  ██║╚══██╔══╝
 █████╔╝ ██║   ██║██║   ██║██╔██╗ ██║   ██║
 ██╔═██╗ ██║   ██║██║   ██║██║╚██╗██║   ██║
 ██║  ██╗╚██████╔╝╚██████╔╝██║ ╚████║   ██║
 ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝   ╚═╝
</pre>
</p>

<p align="center">
  <strong>Project Intelligence for Codebases</strong>
</p>

<p align="center">
  <em>Analyze your code with precision. Stream-based. Cached. Beautiful.</em>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#cli-reference">CLI Reference</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## What is Kount?

**Kount** is a codebase intelligence CLI tool that scans your project and delivers precise metrics — total lines, code lines, blank lines, comments, file sizes, language distribution, and more. It outputs results as a stunning **terminal UI**, a clean **Markdown report**, or an interactive **HTML dashboard**.

Built with [Bun](https://bun.sh), [TypeScript](https://www.typescriptlang.org/), and [Ink](https://github.com/vadimdemedes/ink) (React for CLIs).

---

## Features

| Feature | Description |
|---------|-------------|
| **Stream-Based Scanning** | Files are read chunk-by-chunk via `fs.createReadStream`. No file is ever fully loaded into memory. |
| **Incremental Cache** | Uses `mtime` + `size` invalidation to skip unchanged files on subsequent runs. |
| **Plugin Architecture** | 7 built-in analyzers, each implementing a clean `AnalyzerPlugin` interface. |
| **Three Output Modes** | Terminal (Ink), Markdown (with idempotent `KOUNT:START/END` markers), and HTML (Tailwind + Alpine.js dashboard). |
| **Interactive Wizard** | When run without flags, a step-by-step TUI wizard guides configuration. |
| **Respects Ignore Rules** | Automatically reads `.gitignore` and `.kountignore` files recursively. |
| **Config File Support** | Configure defaults via `.kountrc.json` or `.kountrc.yaml`. |

---

## Installation

Install globally from npm using your preferred package manager:

```bash
# npm
npm install -g kount-cli

# pnpm
pnpm add -g kount-cli

# bun
bun add -g kount-cli
```

Once installed, the `kount` command is available globally.

### Install from source

Alternatively, clone and run directly:

```bash
git clone https://github.com/michaelnji/kount.git
cd kount
bun install
bun run dev
```

---

## Quick Start

### Interactive mode (Wizard)

Simply run kount without any flags to launch the interactive wizard:

```bash
kount
```

The wizard will guide you through:
1. **Root directory** — which directory to scan
2. **Output mode** — terminal, markdown, or html
3. **Include tests** — whether to include test files

### Scan and display in terminal

```bash
kount -d ./my-project
```

### Generate a Markdown report

```bash
kount --output-mode markdown --output ./REPORT.md
```

### Launch the HTML dashboard

```bash
kount --output-mode html
```

This auto-opens your browser with a sortable, interactive dashboard including a **Help page** with full CLI reference and developer info.

---

## CLI Reference

```
Usage: kount [options]

Project Intelligence for Codebases — analyze your code with precision.

Options:
  -V, --version              Display version number
  -d, --root-dir <path>      Root directory to scan (default: current directory)
  -o, --output-mode <mode>   Output mode: terminal, markdown, or html
  -t, --include-tests        Include test files in the analysis
  -f, --force                Force overwrite output files (for markdown mode)
  --output <path>            Output file path (for markdown mode)
  --no-gitignore             Ignore .gitignore rules
  --no-cache                 Disable caching
  --clear-cache              Clear the cache before scanning
  -h, --help                 Display help for command
```

### Examples

```bash
# Scan current directory, display in terminal
kount

# Scan a specific project
kount -d ~/projects/my-app

# Generate markdown report, overwriting any existing KOUNT section
kount -o markdown -f

# Launch HTML dashboard
kount -o html

# Scan including test files, no cache
kount -t --no-cache

# Clear stale cache, then scan
kount --clear-cache
```

---

## Output Modes

### Terminal (default)

An Ink-powered React TUI with:
- **Splash screen** — ASCII logo on launch
- **Progress bar** — color-coded (red → yellow → green) with current file display
- **Summary panel** — files, lines, code ratio, language distribution, largest files

### Markdown

Generates a report with `<!-- KOUNT:START -->` / `<!-- KOUNT:END -->` markers. Running kount again will **replace** the existing section in-place, making it safe to commit to your README.

| Behavior | When |
|----------|------|
| Creates new file | File doesn't exist |
| Appends section | File exists but has no KOUNT markers |
| Replaces section | File has existing KOUNT markers |
| Overwrites file | `--force` flag is used |

### HTML Dashboard

Serves a Tailwind CSS + Alpine.js dashboard on a local server with:
- **Summary cards** — files, lines, code ratio, size
- **Language distribution** — sortable bar chart
- **Top largest files** — ranked table
- **Help page** — about, CLI reference, developer info

---

## Built-in Plugins

| Plugin | Metric | Description |
|--------|--------|-------------|
| `TotalLinesPlugin` | Total Lines | Counts all lines across all files |
| `BlankLinesPlugin` | Blank Lines | Counts empty or whitespace-only lines |
| `CommentLinesPlugin` | Comment Lines | Detects single-line and block comments using language-aware syntax mapping |
| `FileSizePlugin` | File Size | Sums total file sizes in bytes |
| `TotalFilesPlugin` | Total Files | Counts all scanned files |
| `LanguageDistributionPlugin` | Languages | Groups files by detected programming language |
| `LargestFilesPlugin` | Largest Files | Identifies and ranks the top 10 largest files |

---

## Architecture

```
src/
├── cli/
│   ├── config-resolver.ts    # Merges CLI flags > config file > defaults
│   └── parser.ts             # Commander-based CLI argument parsing
├── core/
│   ├── aggregator.ts         # Orchestrator: Scanner → Plugins → Stats
│   └── cache.ts              # mtime+size invalidation cache (.kountcache.json)
├── plugins/
│   ├── types.ts              # AnalyzerPlugin interface & ProjectStats type
│   ├── index.ts              # Barrel export
│   └── built-in/             # 7 built-in analyzer plugins
├── reporters/
│   ├── markdown.ts           # Markdown report generator with KOUNT markers
│   ├── html.ts               # HTML dashboard with Tailwind + Alpine.js
│   └── terminal/             # Ink components: Splash, Progress, Summary, Wizard
├── scanner/
│   ├── ignore-parser.ts      # .gitignore / .kountignore integration
│   └── stream-reader.ts      # Recursive directory walker + chunk streamer
├── utils/
│   └── language-map.ts       # File extension → comment syntax mapping
└── index.tsx                 # Main entry point
```

### Data Flow

```
CLI Flags + Config File
        │
        ▼
  Config Resolver    ──→   Resolved KountConfig
        │
        ▼
    Aggregator
        │
        ├──→ Scanner (discovers files, streams chunks)
        ├──→ Plugins (analyze each file's data)
        ├──→ Cache (load/save per-file metrics)
        │
        ▼
   ProjectStats
        │
        ├──→ Terminal Reporter (Ink)
        ├──→ Markdown Reporter
        └──→ HTML Reporter
```

---

## Configuration

### `.kountrc.json`

Place a `.kountrc.json` in your project root to set defaults:

```json
{
  "rootDir": ".",
  "outputMode": "terminal",
  "includeTests": false,
  "respectGitignore": true,
  "cache": {
    "enabled": true,
    "clearFirst": false
  }
}
```

### `.kountrc.yaml`

Alternatively, use YAML:

```yaml
rootDir: .
outputMode: terminal
includeTests: false
respectGitignore: true
cache:
  enabled: true
  clearFirst: false
```

### `.kountignore`

Works like `.gitignore` — add glob patterns for files/directories kount should skip:

```
# Ignore generated files
dist/
coverage/
*.min.js
```

### Priority

Configuration is resolved with this precedence:

```
CLI Flags  >  Config File (.kountrc.json/.yaml)  >  Defaults
```

---

## Testing

Kount has comprehensive tests covering all layers:

```bash
# Run all tests
bun test

# Watch mode
bun run test:watch
```

**Test suite: 28 tests, 0 failures**

| Test File | Coverage |
|-----------|----------|
| `tests/scanner.test.ts` | File discovery, ignore rules, chunk streaming |
| `tests/plugins.test.ts` | All 7 plugins + edge cases |
| `tests/cache.test.ts` | Load, save, hit, miss (mtime/size), clear, disabled mode |
| `tests/reporters.test.ts` | Markdown generation, file write modes, HTML generation |

---

## Tech Stack

| Technology | Role |
|------------|------|
| [Bun](https://bun.sh) | Runtime, package manager, bundler |
| [TypeScript](https://www.typescriptlang.org/) | Strict mode, ESM |
| [Ink](https://github.com/vadimdemedes/ink) | React-based terminal UI |
| [Commander](https://github.com/tj/commander.js) | CLI argument parsing |
| [Vitest](https://vitest.dev/) | Testing framework |
| [Tailwind CSS](https://tailwindcss.com/) | HTML dashboard styling (CDN) |
| [Alpine.js](https://alpinejs.dev/) | HTML dashboard interactivity (CDN) |

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/my-feature`
3. Write tests for your changes
4. Run `bun test` to ensure all tests pass
5. Commit your changes: `git commit -m "feat: add my feature"`
6. Push to the branch: `git push origin feat/my-feature`
7. Open a Pull Request

---

## Author

**Michael Nji** — Full stack web developer with a passion for building beautiful and robust web projects.

- 🌐 [Portfolio](https://michaelnji.codes)
- 🐙 [GitHub](https://github.com/michaelnji)
- ✍️ [Blog](https://michaelnji.codes/blog)

---

## License

MIT © [Michael Nji](https://michaelnji.codes)
