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
  <a href="#commands">Commands</a> •
  <a href="#cli-reference">CLI Reference</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#output-modes">Output Modes</a> •
  <a href="#quality-gates">Quality Gates</a> •
  <a href="#git-intelligence">Git Intelligence</a> •
  <a href="#badge-generation">Badge Generation</a> •
  <a href="#ignoring-files">Ignoring Files</a> •
  <a href="#caching">Caching</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## What is Kount?

**Kount** is a blazing-fast, stream-based codebase intelligence CLI tool. It deeply scans your project to deliver precise code metrics — total lines, comment ratios, file sizes, cyclomatic complexity, circular dependency detection, code health scoring, and Git intelligence. It features multiple ways to explore your data: an interactive Ink-powered Terminal UI, a beautiful responsive HTML Dashboard, and CI/CD-friendly structured exports (JSON, CSV, Markdown).

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

Once installed, the `kount` command is available globally.

---

## Quick Start

```bash
# Interactive terminal UI (default)
kount

# Set up a config file interactively
kount init

# HTML dashboard (opens in browser)
kount --output-mode html

# Scan a specific directory
kount --root-dir ./my-project

# CI/CD quality check
kount --min-comment-ratio 15 --fail-on-size 50 --max-complexity 25

# PR diff analysis (only changed files)
kount --diff main

# Generate a Shields.io badge
kount --badge comment-ratio
```

---

## Commands

### `kount` — Main scan command

Analyzes the codebase and outputs results in the configured format.

```bash
kount [options]
```

### `kount init` — Interactive configuration wizard

Guides you through creating a `.kountrc.json` config file for your project. Asks about output format, quality gates, git analytics, and more.

```bash
kount init
```

The wizard prompts you for:

1. Root directory to scan (default: `.`)
2. Output format: `terminal` / `html` / `json` / `csv` / `markdown` (default: `terminal`)
3. Include test files? (default: No)
4. Respect `.gitignore` rules? (default: Yes)
5. Enable deep git analytics? (default: No) — *only asked if git is detected*
6. Stale file threshold in years (default: `2`)
7. Set quality gates? — if Yes:
   - Minimum comment ratio %
   - Maximum codebase size in MB
   - Maximum file complexity score

Writes `.kountrc.json` to the current directory. Safe to re-run — warns before overwriting.

---

## CLI Reference

```
Usage: kount [options]
       kount init
```

### Core Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--root-dir <path>` | `-d` | `.` | Root directory to scan |
| `--output-mode <mode>` | `-o` | `terminal` | Output format: `terminal`, `html`, `markdown`, `json`, `csv` |
| `--output <path>` | | auto | Destination file path for reports |
| `--force` | `-f` | false | Force overwrite of the output file |
| `--include-tests` | `-t` | false | Include test files and directories |
| `--version` | `-V` | | Print version number |
| `--help` | `-h` | | Display help |

### Cache Options

| Flag | Default | Description |
|------|---------|-------------|
| `--no-cache` | — | Disable the incremental caching engine for this run |
| `--clear-cache` | false | Purge the existing cache before scanning |

### Ignore Options

| Flag | Default | Description |
|------|---------|-------------|
| `--no-gitignore` | — | Disable parsing of `.gitignore` and `.kountignore` rules |

### Git Intelligence Options

| Flag | Default | Description |
|------|---------|-------------|
| `--diff <branch>` | — | Only analyze files changed relative to `<branch>` |
| `--deep-git` | false | Enable deep analytics: `git blame` + `git numstat` |
| `--stale-threshold <years>` | `2` | Age threshold (years) to classify files as stale |

### Quality Gate Options

| Flag | Default | Description |
|------|---------|-------------|
| `--fail-on-size <mb>` | — | Exit code 1 if codebase exceeds `<mb>` MB |
| `--min-comment-ratio <percent>` | — | Exit code 1 if comment ratio falls below `<percent>`% |
| `--max-complexity <n>` | — | Exit code 1 if any file's cyclomatic complexity exceeds `<n>` |

### Badge Option

| Flag | Default | Description |
|------|---------|-------------|
| `--badge <metric>` | — | Generate a Shields.io JSON badge for `files`, `lines`, `comment-ratio`, `debt-score`, or `complexity` |

---

## Configuration

Create a `.kountrc.json` in your project root to persist settings. CLI flags always take precedence over the config file.

```json
{
  "rootDir": ".",
  "outputMode": "terminal",
  "includeTests": false,
  "respectGitignore": true,
  "cache": {
    "enabled": true,
    "clearFirst": false
  },
  "deepGit": false,
  "staleThreshold": 2,
  "diffBranch": "main",
  "failOnSize": 50,
  "minCommentRatio": 10,
  "maxComplexity": 25
}
```

### Config Field Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `rootDir` | string | `.` | Directory to scan |
| `outputMode` | string | `terminal` | One of: `terminal`, `html`, `markdown`, `json`, `csv` |
| `includeTests` | boolean | `false` | Include test files and directories |
| `respectGitignore` | boolean | `true` | Honor `.gitignore` and `.kountignore` rules |
| `cache.enabled` | boolean | `true` | Enable incremental caching |
| `cache.clearFirst` | boolean | `false` | Purge cache before each scan |
| `deepGit` | boolean | `false` | Enable `git blame` / `numstat` deep analytics |
| `staleThreshold` | number | `2` | Years before a file is considered stale |
| `diffBranch` | string | — | Limit scan to files changed vs this branch |
| `failOnSize` | number | — | Max codebase size in MB (quality gate) |
| `minCommentRatio` | number | — | Minimum comment ratio in % (quality gate) |
| `maxComplexity` | number | — | Max cyclomatic complexity per file (quality gate) |

> **Precedence:** CLI flags > `.kountrc.json` > built-in defaults.

---

## Output Modes

### Terminal (default)

Interactive React/Ink UI with live progress and a detailed summary.

```bash
kount
kount -o terminal
```

Shows: file count, line breakdown (code / comments / blanks), code ratio, total size, language distribution, largest files, fix-it comments (TODO/FIXME/HACK), code health scores, git insights, dependency summary, and trends vs the previous scan.

---

### HTML Dashboard

```bash
kount -o html
kount -o html --output ./reports/dashboard.html
```

Spins up a local HTTP server and opens a fully interactive dashboard in your browser. Features:

- Sortable and searchable file table with all metrics
- Doughnut and bar charts (Chart.js) for composition and language distribution
- Code Health section with cleanup scores and fix-it comment hotspots
- Cyclomatic complexity column and average complexity card
- Git Intelligence: top contributors, high-churn files, knowledge silos, stale files, suggested reviewers
- Dependencies: top imported packages and circular dependency detection
- Trends: historical line charts over your last 30 scans
- Dark / light mode toggle
- CSV and JSON data export
- Fully responsive (mobile-friendly)

---

### Markdown

```bash
kount -o markdown
kount -o markdown --output ./docs/stats.md
kount -o markdown --force   # overwrite the entire file
```

Injects a stats block into your `README.md` (or the specified file) between these markers:

```text
<!-- KOUNT:START -->
...generated content...
<!-- KOUNT:END -->
```

On subsequent runs, only the block between the markers is updated. If no markers exist the block is appended. Use `--force` to overwrite the entire file.

**Includes:** summary table, language distribution, top 10 largest files, git insights, code health, top dependencies, trends.

---

### JSON

```bash
kount -o json
kount -o json --output ./artifacts/kount.json
```

Outputs a machine-readable JSON file. Default output: `kount-report.json`.

**Top-level keys:**

| Key | Description |
|-----|-------------|
| `summary` | Aggregated counts: `totalFiles`, `totalLines`, `codeLines`, `commentLines`, `blankLines`, `commentRatio`, `totalBytes`, `debtMarkers`, `techDebtScore` |
| `files` | Per-file array with `path`, `lines`, `blanks`, `comments`, `size`, `debt`, `commits`, `debtScore`, `complexity`, `imports`, `age`, `busFactor`, `topOwner`, `volatility` |
| `languages` | Array of `{ lang, count, pct }` |
| `largestFiles` | Ranked array of `{ rank, path, size }` |
| `debtHotspots` | Files with the most TODO/FIXME/HACK markers |
| `highDebtFiles` | Files with the highest cleanup scores |
| `gitInsights` | *(optional)* Authors, high-churn files, knowledge silos, stale count, suggested reviewers |
| `topDependencies` | Most imported external packages |
| `circularDeps` | *(optional)* Arrays of file paths forming import cycles |
| `trends` | *(optional)* Deltas vs previous scan |
| `history` | Last 30 scan snapshots for trend charting |
| `scannedAt` | ISO 8601 timestamp |

---

### CSV

```bash
kount -o csv
kount -o csv --output ./artifacts/kount.csv
```

Outputs a per-file CSV. Default output: `kount-report.csv`.

**Columns:** `Path`, `Lines`, `Blank Lines`, `Comment Lines`, `Size`, `Fix-It Comments`, `Commits`, `Cleanup Score`, `Imports`, `Age`, `Bus Factor`, `Top Owner`, `Volatility (Insertions)`, `Volatility (Deletions)`

---

## Quality Gates

Quality gates let you enforce code health in CI/CD pipelines. Any gate failure exits with code `1`.

```bash
# Fail if codebase exceeds 100 MB
kount --fail-on-size 100

# Fail if comment ratio drops below 15%
kount --min-comment-ratio 15

# Fail if any single file has cyclomatic complexity above 25
kount --max-complexity 25

# Combine all gates
kount --fail-on-size 100 --min-comment-ratio 15 --max-complexity 25
```

All three gates can also be set in `.kountrc.json` (see [Configuration](#configuration)).

### Gate Reference

| Gate | Measures | Failure Condition |
|------|----------|-------------------|
| `--fail-on-size <mb>` | Total codebase bytes / 1,048,576 | Size > limit |
| `--min-comment-ratio <percent>` | `(commentLines / totalLines) × 100` | Ratio < limit |
| `--max-complexity <n>` | Highest cyclomatic complexity across all files | Max > limit |

### Example GitHub Actions usage

```yaml
- name: Kount quality gates
  run: npx @cod3vil/kount-cli --min-comment-ratio 10 --max-complexity 30 --fail-on-size 200
```

---

## Git Intelligence

Kount can enrich its analysis with data from your git history.

### Basic git (automatic when git is available)

- Top contributors ranked by commit count
- High-churn files (files changed most often)
- Per-file commit count in the files table

### Differential scan (`--diff`)

```bash
kount --diff main
kount --diff origin/develop
```

Limits the scan to only files that have changed relative to the target branch — ideal for PR-level analysis in CI/CD.

### Deep git analytics (`--deep-git`)

```bash
kount --deep-git
kount --deep-git --stale-threshold 3
```

Runs additional `git blame` and `git log --numstat` passes to produce:

| Field | Description |
|-------|-------------|
| **Age** | Relative time since last commit (e.g. `2 years ago`) |
| **Bus Factor** | Number of unique authors who have touched the file |
| **Knowledge Silos** | Files where one person owns the majority of lines (bus factor = 1) |
| **Stale Files** | Files not modified in more than `--stale-threshold` years |
| **Volatility** | Per-file line insertions and deletions count |
| **Top Owner** | Author with the most surviving lines (`git blame`) |
| **Suggested Reviewers** | Authors recommended for review based on line ownership |

> **Performance note:** `--deep-git` runs `git blame` on every file and can be slow on large repositories. Combine with `--diff <branch>` to scope it to changed files only.

---

## Badge Generation

Generate [Shields.io](https://shields.io/endpoint) compatible JSON badges to embed live metrics in your README.

```bash
# Generate a comment ratio badge (saved to .kount-badge.json)
kount --badge comment-ratio

# Save to a custom path
kount --badge debt-score --output ./badges/debt.json
```

Then embed in your README:

```markdown
![Comment Ratio](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/you/repo/main/.kount-badge.json)
```

### Supported Badge Metrics

| Metric | Badge Label | Message | Color Logic |
|--------|-------------|---------|-------------|
| `files` | files | total file count | blue |
| `lines` | lines of code | total lines | blue |
| `comment-ratio` | comment ratio | `18.5%` | green ≥ 20%, yellow ≥ 10%, red < 10% |
| `debt-score` | cleanup score | score number | green ≤ 100, yellow ≤ 500, red > 500 |
| `complexity` | complexity | `7.2 avg` | green ≤ 5, yellow ≤ 10, red > 10 |

Default output: `.kount-badge.json` in the current directory.

---

## Ignoring Files

### Automatic ignores (always applied)

```
node_modules/   dist/       build/      .git/
.next/          .nuxt/      coverage/   .kount/
```

Binary files (images, videos, audio, fonts, compiled artifacts, archives) are automatically skipped.

### `.gitignore` support

Kount respects your project's `.gitignore` by default. Disable with:

```bash
kount --no-gitignore
```

### `.kountignore`

Create a `.kountignore` file in your project root using standard glob syntax:

```text
# Ignore generated type declarations
generated/**/*.d.ts

# Ignore documentation drafts
docs/drafts/*.md

# Ignore an entire vendor directory
vendor/
```

---

## Caching

Kount uses an incremental file cache (`.kountcache.json`) to make repeat scans near-instant. Only files whose `mtime` or size has changed are re-analyzed.

```bash
# Disable cache for this run only
kount --no-cache

# Clear the existing cache, then scan fresh
kount --clear-cache
```

In `.kountrc.json`:
```json
{
  "cache": {
    "enabled": true,
    "clearFirst": false
  }
}
```

The cache file is local to each project and should not be committed.

---

## What Kount Tracks

### Line Metrics

| Metric | Description |
|--------|-------------|
| Total Lines | Every line in the file |
| Code Lines | Lines that are neither blank nor comments |
| Comment Lines | Lines using the language's comment syntax |
| Blank Lines | Empty or whitespace-only lines |
| Code Ratio | `(codeLines / totalLines) × 100` |

### File Metrics

| Metric | Description |
|--------|-------------|
| File Size | Size in bytes |
| Fix-It Comments | Count of `TODO`, `FIXME`, `HACK` markers |
| Cyclomatic Complexity | Branching construct count (base = 1 per file) |
| Import Count | Number of unique external packages imported |

### Cyclomatic Complexity Counting

| Language Group | Counted Constructs |
|---|---|
| JS, TS, Java, Go, Swift, Kotlin, Rust, C, C++, C# | `if`, `else if`, `for`, `while`, `do`, `case`, `catch`, `&&`, `\|\|`, `??`, ternary `?` |
| Python, Ruby | `if`, `elif`, `for`, `while`, `except`, `and`, `or` |
| All others | `if`, `for`, `while` |

### Code Health Score (Cleanup Score)

```
score = (lines + (commits × 10) + couplingPenalty) / max(commentRatio, 1)
```

`couplingPenalty` is +20 if the file imports more than 15 external packages. A higher score means the file needs more cleanup attention.

### Circular Dependencies

For JS/TS files, Kount runs depth-first search across relative imports to find circular dependency cycles. Results appear in the Dependencies section of the HTML dashboard and in the JSON output under `circularDeps`.

---

## Trends

Kount records key metrics after each scan in `.kount/history.json` (retains the last 30 scans). Subsequent scans compute and display deltas:

- Files added / removed
- Lines added / removed
- Size change in bytes
- Comment ratio change
- Cleanup score change

Trends are shown as line charts in the HTML dashboard, delta rows in the terminal summary, and a Trends table in the Markdown report.

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Write / update tests: `bun test`
4. Commit your changes: `git commit -m 'feat: add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## License

MIT © [Michael Nji](https://michaelnji.codes)
