<p align="center">
  <img src="src/kount-full.svg" alt="Kount Logo" width="500">
</p>

<p align="center">
  <strong>Project Intelligence for Codebases</strong>
</p>

<p align="center">
  <em>An advanced codebase intelligence tool for the terminal. Analyze your code with precision.</em>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#cli-reference">CLI Reference</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## What is Kount?

**Kount** is a blazing-fast, stream-based codebase intelligence CLI tool. It deeply scans your project to deliver precise code metrics — total lines, comment ratios, file sizes, tech debt, and Git intelligence. It features multiple ways to explore your data: an interactive Ink-powered Terminal UI, a beautiful responsive HTML Dashboard, and CI/CD-friendly structured exports (JSON, CSV, Markdown).

---

## Powerful Features

| Feature | Description |
|---------|-------------|
| **Interactive Explorer** | Jump straight into an interactive wizard UI (`--interactive`/no flags) to pick your codebase scan parameters. |
| **CI/CD Quality Gates** | Enforce maintainability out-of-the-box. Fail your builds if limits are exceeded using `--fail-on-size <mb>` and `--min-comment-ratio <percent>`. |
| **Git Intelligence (`--diff`, `--deep-git`)** | Rapidly analyze files changed in a PR (`--diff main`), or run deep analytics for Code Volatility, Knowledge Silos (Bus Factor), and Code Age via `git blame` (`--deep-git`). |
| **Tech Debt Tracking** | Correlates code churn and comment ratios to identify your project's highest "Tech Debt" hotspots. |
| **Structured Exports** | Get pure data endpoints. Output results instantly to JSON or CSV via `--output-mode json` or `--output-mode csv`. |
| **Stream-Based Caching** | Capable of scaling to monolithic codebases. Incremental `mtime` cache ensures repeat scans take fractions of a second. |

---

## Installation

Kount can be run instantly without installation via `npx` or `bunx`, or installed globally for dedicated usage.

### Run instantly
```bash
npx @cod3vil/kount-cli
# or
bunx @cod3vil/kount-cli
```

### Install globally (Recommended)
```bash
# npm
npm install -g @cod3vil/kount-cli

# bun
bun add -g @cod3vil/kount-cli
```

*(Once installed, the `kount` terminal command is available globally).*

---

## Quick Start

### 1. Interactive Terminal UI
Run `kount` with no flags to launch the setup wizard:
```bash
kount
```

### 2. View the HTML Dashboard
Scan the current directory and instantly open a dynamic visual dashboard:
```bash
kount --output-mode html
```

### 3. CI/CD Pipeline
Enforce quality gates and break the build on PRs if comment ratio falls below 15%:
```bash
kount --min-comment-ratio 15 --fail-on-size 50
```

### 4. Git Branch Diff
See only the metrics for files modified in your current PR (relative to `main`):
```bash
kount --diff main
```

---

## CLI Reference

```
Usage: kount [options]

Project Intelligence for Codebases — analyze your code with precision.

Options:
  -V, --version                  output the version number
  -d, --root-dir <path>          Specify the root directory to scan (default: current directory)
  -o, --output-mode <mode>       Choose output format: "terminal" (interactive UI), "markdown", "html" (dashboard), "json", or "csv" (default: "terminal")
  -t, --include-tests            Include test files and directories in the analysis
  --no-gitignore                 Disable parsing of .gitignore and .kountignore rules
  --no-cache                     Disable the incremental high-performance caching engine
  --clear-cache                  Purge the existing cache before running the scan
  -f, --force                    Force overwrite of the output file (Markdown/JSON/CSV modes)
  --output <path>                Specify the destination file path for reports
  --fail-on-size <mb>            CI/CD Gate: Fail with exit code 1 if codebase exceeds <mb> MB
  --min-comment-ratio <percent>  CI/CD Gate: Fail with exit code 1 if comment ratio is below <percent>%
  --diff <branch>                Git Intelligence: Only analyze files changed relative to the specified <branch>
  --deep-git                     Git Intelligence: Enable deep analytics (blame, numstat) which can be slow on large repos
  --stale-threshold <years>      Git Intelligence: Define stale file threshold in years (default: 2)
  -h, --help                     display help for command
```

---

## Configuration (`.kountrc.json`)

Tired of passing the same flags? Standardize your project's `kount` metrics by adding a `.kountrc.json` to your project root. `kount` will automatically pick these up in CI and local setups.

```json
{
  "rootDir": ".",
  "outputMode": "terminal",
  "includeTests": false,
  "respectGitignore": true,
  "failOnSize": 50,
  "minCommentRatio": 10,
  "deepGit": true,
  "staleThreshold": 2,
  "cache": {
    "enabled": true,
    "clearFirst": false
  }
}
```

> **Note**: CLI flags take precedence over `.kountrc.json` settings configuration.

### Custom Ignores (`.kountignore`)

Works exactly like `.gitignore`. Add glob patterns for any internal directories or massive binary assets that `kount` should skip entirely:

```text
# Ignore generated compiled assets
dist/
build/
*.min.js
```

---

## Output Modes Explained

Kount provides versatile output engines to integrate into any developer workflow:

1. **Terminal (Default)**
   - Uses React/Ink to render a rich, dynamic terminal summary and scan progress visualizer.
2. **HTML Dashboard (`-o html`)**
   - Automatically spins up an HTTP server and opens your native web browser to a responsive, fully interactive dashboard with Chart.js visualizations, tech debt tracking, file distributions, and sorting tables.
3. **Markdown (`-o markdown`)**
   - Injects a summary snippet directly into your `README.md` file using `<!-- KOUNT:START -->` boundaries. It safely updates only the injected block on subsequent runs, making it perfect for repo documentation.
4. **JSON / CSV (`-o json` \| `-o csv`)**
   - Structured flat data exports perfect for piping into external visualization services (like Datadog), databases, or custom scripts.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write/update tests via `bun test`
4. Commit your changes (`git commit -m 'feat: added amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License
MIT © [Michael Nji](https://michaelnji.codes)
