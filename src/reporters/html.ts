import { exec } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import type { ProjectStats } from '../plugins/types.js';

/**
 * Generates the full HTML dashboard page with injected data.
 * Uses Tailwind CSS (CDN) and Alpine.js (CDN) for styling and interactivity.
 */
function generateHtmlDashboard(stats: ProjectStats): string {
  const totalLines = stats.pluginResults.get('TotalLines')?.summaryValue ?? 0;
  const blankLines = stats.pluginResults.get('BlankLines')?.summaryValue ?? 0;
  const commentLines = stats.pluginResults.get('CommentLines')?.summaryValue ?? 0;
  const totalBytes = stats.pluginResults.get('FileSize')?.summaryValue ?? 0;
  const codeLines = totalLines - blankLines - commentLines;
  const codeRatio = totalLines > 0 ? ((codeLines / totalLines) * 100).toFixed(1) : '0.0';

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Prepare language data for Alpine.js
  const langData = [...stats.languageDistribution.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([lang, count]) => ({
      lang,
      count,
      pct: ((count / stats.totalFiles) * 100).toFixed(1),
    }));

  // Prepare largest files data
  const largestData = stats.largestFiles.map((f, i) => ({
    rank: i + 1,
    path: path.relative(stats.rootDir, f.filePath),
    size: formatSize(f.size),
    rawSize: f.size,
  }));

  const jsonData = JSON.stringify({
    summary: {
      files: stats.totalFiles,
      totalLines,
      codeLines,
      commentLines,
      blankLines,
      codeRatio,
      totalSize: formatSize(totalBytes),
    },
    languages: langData,
    largestFiles: largestData,
    scannedAt: stats.scannedAt.toISOString(),
    rootDir: stats.rootDir,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KOUNT Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; }
    [x-cloak] { display: none !important; }
  </style>
</head>
<body class="bg-gray-950 text-white min-h-screen">
  <div x-data="dashboard()" x-cloak class="max-w-6xl mx-auto px-6 py-8">
    
    <!-- Header with Tab Navigation -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-cyan-400 tracking-tight">KOUNT</h1>
          <p class="text-gray-400 mt-1">Project Intelligence for <span class="text-white font-mono" x-text="data.rootDir"></span></p>
        </div>
        <nav class="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
          <button
            @click="currentTab = 'dashboard'"
            :class="currentTab === 'dashboard' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'"
            class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
          >Dashboard</button>
          <button
            @click="currentTab = 'help'"
            :class="currentTab === 'help' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'"
            class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
          >Help</button>
        </nav>
      </div>
      <p class="text-gray-600 text-sm mt-1" x-show="currentTab === 'dashboard'">Scanned <span x-text="new Date(data.scannedAt).toLocaleString()"></span></p>
    </div>

    <!-- ==================== DASHBOARD TAB ==================== -->
    <div x-show="currentTab === 'dashboard'" x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 translate-y-1" x-transition:enter-end="opacity-100 translate-y-0">

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <template x-for="card in summaryCards" :key="card.label">
          <div class="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p class="text-gray-400 text-sm" x-text="card.label"></p>
            <p class="text-2xl font-bold mt-1" :class="card.color" x-text="card.value"></p>
          </div>
        </template>
      </div>

      <!-- Language Distribution -->
      <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8" x-show="data.languages.length > 0">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-blue-400">Language Distribution</h2>
          <button
            @click="langSort = langSort === 'count' ? 'name' : 'count'"
            class="text-sm text-gray-500 hover:text-white transition-colors px-3 py-1 rounded bg-gray-800"
            x-text="'Sort by ' + (langSort === 'count' ? 'Name' : 'Count')"
          ></button>
        </div>
        <div class="space-y-2">
          <template x-for="lang in sortedLanguages" :key="lang.lang">
            <div class="flex items-center gap-3">
              <span class="w-28 text-sm text-gray-300 truncate" x-text="lang.lang"></span>
              <div class="flex-1 bg-gray-800 rounded-full h-5 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-cyan-600 to-blue-500 rounded-full transition-all duration-300"
                     :style="'width:' + lang.pct + '%'"></div>
              </div>
              <span class="text-sm text-gray-400 w-20 text-right" x-text="lang.count + ' (' + lang.pct + '%)'"></span>
            </div>
          </template>
        </div>
      </div>

      <!-- Largest Files Table -->
      <div class="bg-gray-900 rounded-xl p-6 border border-gray-800" x-show="data.largestFiles.length > 0">
        <h2 class="text-lg font-semibold text-purple-400 mb-4">Top Largest Files</h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-gray-500 border-b border-gray-800">
              <th class="text-left py-2 w-12">#</th>
              <th class="text-left py-2">File</th>
              <th class="text-right py-2 w-24">Size</th>
            </tr>
          </thead>
          <tbody>
            <template x-for="file in data.largestFiles" :key="file.rank">
              <tr class="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td class="py-2 text-gray-500" x-text="file.rank"></td>
                <td class="py-2 font-mono text-gray-300 truncate max-w-md" x-text="file.path"></td>
                <td class="py-2 text-right text-yellow-400" x-text="file.size"></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

    </div>

    <!-- ==================== HELP TAB ==================== -->
    <div x-show="currentTab === 'help'" x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 translate-y-1" x-transition:enter-end="opacity-100 translate-y-0">

      <!-- About Kount -->
      <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
        <h2 class="text-lg font-semibold text-cyan-400 mb-3">About KOUNT</h2>
        <p class="text-gray-300 leading-relaxed mb-4">
          KOUNT is a codebase intelligence terminal tool that analyzes your projects with precision.
          It streams files efficiently, respects <code class="text-cyan-300 bg-gray-800 px-1.5 py-0.5 rounded text-xs">.gitignore</code> rules,
          caches results for speed, and outputs beautiful reports in your terminal, as Markdown, or as an interactive HTML dashboard.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
            <p class="text-cyan-400 font-semibold text-sm">Stream-Based</p>
            <p class="text-gray-400 text-xs mt-1">Files are read chunk-by-chunk, never fully loaded into memory.</p>
          </div>
          <div class="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
            <p class="text-green-400 font-semibold text-sm">Incremental Cache</p>
            <p class="text-gray-400 text-xs mt-1">Uses mtime + size invalidation to skip unchanged files on re-runs.</p>
          </div>
          <div class="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
            <p class="text-purple-400 font-semibold text-sm">Plugin Architecture</p>
            <p class="text-gray-400 text-xs mt-1">7 built-in analyzers: lines, blanks, comments, size, files, languages, largest.</p>
          </div>
        </div>
      </div>

      <!-- CLI Commands & Flags -->
      <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
        <h2 class="text-lg font-semibold text-blue-400 mb-4">CLI Commands &amp; Flags</h2>
        <div class="bg-gray-800/50 rounded-lg p-4 mb-4 font-mono text-sm">
          <p class="text-gray-400 mb-1"># Basic usage</p>
          <p class="text-green-400">$ kount</p>
          <p class="text-gray-400 mt-3 mb-1"># Scan a specific directory and output Markdown</p>
          <p class="text-green-400">$ kount --root-dir ./my-project --output-mode markdown</p>
          <p class="text-gray-400 mt-3 mb-1"># Open an HTML dashboard</p>
          <p class="text-green-400">$ kount -o html</p>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-gray-500 border-b border-gray-800">
              <th class="text-left py-2">Flag</th>
              <th class="text-left py-2">Alias</th>
              <th class="text-left py-2">Description</th>
            </tr>
          </thead>
          <tbody class="text-gray-300">
            <tr class="border-b border-gray-800/50">
              <td class="py-2 font-mono text-cyan-300">--root-dir &lt;path&gt;</td>
              <td class="py-2 font-mono text-gray-500">-d</td>
              <td class="py-2">Root directory to scan (default: current directory)</td>
            </tr>
            <tr class="border-b border-gray-800/50">
              <td class="py-2 font-mono text-cyan-300">--output-mode &lt;mode&gt;</td>
              <td class="py-2 font-mono text-gray-500">-o</td>
              <td class="py-2">Output mode: <span class="text-white">terminal</span>, <span class="text-white">markdown</span>, or <span class="text-white">html</span></td>
            </tr>
            <tr class="border-b border-gray-800/50">
              <td class="py-2 font-mono text-cyan-300">--include-tests</td>
              <td class="py-2 font-mono text-gray-500">-t</td>
              <td class="py-2">Include test files in the analysis</td>
            </tr>
            <tr class="border-b border-gray-800/50">
              <td class="py-2 font-mono text-cyan-300">--force</td>
              <td class="py-2 font-mono text-gray-500">-f</td>
              <td class="py-2">Force overwrite output files (markdown mode)</td>
            </tr>
            <tr class="border-b border-gray-800/50">
              <td class="py-2 font-mono text-cyan-300">--output &lt;path&gt;</td>
              <td class="py-2 font-mono text-gray-500"></td>
              <td class="py-2">Specify output file path (markdown mode)</td>
            </tr>
            <tr class="border-b border-gray-800/50">
              <td class="py-2 font-mono text-cyan-300">--no-gitignore</td>
              <td class="py-2 font-mono text-gray-500"></td>
              <td class="py-2">Ignore .gitignore rules during scanning</td>
            </tr>
            <tr class="border-b border-gray-800/50">
              <td class="py-2 font-mono text-cyan-300">--no-cache</td>
              <td class="py-2 font-mono text-gray-500"></td>
              <td class="py-2">Disable caching for this run</td>
            </tr>
            <tr class="border-b border-gray-800/50">
              <td class="py-2 font-mono text-cyan-300">--clear-cache</td>
              <td class="py-2 font-mono text-gray-500"></td>
              <td class="py-2">Clear the cache before scanning</td>
            </tr>
            <tr>
              <td class="py-2 font-mono text-cyan-300">--version</td>
              <td class="py-2 font-mono text-gray-500">-V</td>
              <td class="py-2">Display version number</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Developer Info -->
      <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 class="text-lg font-semibold text-purple-400 mb-4">Developer</h2>
        <div class="flex flex-col md:flex-row gap-6">
          <div class="flex-1">
            <h3 class="text-xl font-bold text-white mb-2">Michael Nji</h3>
            <p class="text-gray-400 text-sm leading-relaxed mb-4">
              Full stack web developer with a passion for building beautiful and robust web projects.
              Coding since 2022, with 3+ years of experience building with modern web technologies.
              Active open source contributor &mdash; including contributions to
              <a href="https://github.com/biomejs/biome" target="_blank" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Biome</a> and
              <a href="https://github.com/stepci/stepci" target="_blank" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">StepCI</a>.
            </p>
            <div class="flex flex-wrap gap-3">
              <a href="https://michaelnji.codes" target="_blank"
                 class="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm hover:bg-cyan-500/20 transition-all duration-200">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                Portfolio
              </a>
              <a href="https://github.com/michaelnji" target="_blank"
                 class="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm hover:bg-gray-700 transition-all duration-200">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
              <a href="https://michaelnji.codes/blog" target="_blank"
                 class="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm hover:bg-gray-700 transition-all duration-200">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
                Blog
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div class="mt-8 text-center text-gray-700 text-sm">
      Generated by KOUNT &mdash; Project Intelligence for Codebases
    </div>

  </div>

  <script>
    function dashboard() {
      const data = ${jsonData};
      return {
        data,
        currentTab: 'dashboard',
        langSort: 'count',
        get summaryCards() {
          const s = this.data.summary;
          return [
            { label: 'Files', value: s.files.toLocaleString(), color: 'text-cyan-400' },
            { label: 'Total Lines', value: s.totalLines.toLocaleString(), color: 'text-white' },
            { label: 'Code Lines', value: s.codeLines.toLocaleString(), color: 'text-green-400' },
            { label: 'Code Ratio', value: s.codeRatio + '%', color: 'text-green-400' },
            { label: 'Comment Lines', value: s.commentLines.toLocaleString(), color: 'text-yellow-400' },
            { label: 'Blank Lines', value: s.blankLines.toLocaleString(), color: 'text-gray-400' },
            { label: 'Total Size', value: s.totalSize, color: 'text-cyan-400' },
          ];
        },
        get sortedLanguages() {
          const langs = [...this.data.languages];
          if (this.langSort === 'name') {
            langs.sort((a, b) => a.lang.localeCompare(b.lang));
          } else {
            langs.sort((a, b) => b.count - a.count);
          }
          return langs;
        }
      };
    }
  </script>
</body>
</html>`;
}

/**
 * Spins up a temporary HTTP server, serves the HTML dashboard,
 * and auto-opens the user's default browser.
 *
 * @param stats The aggregated project statistics.
 * @param port The port to serve on (defaults to 0 for auto-assign).
 * @returns A cleanup function to shut down the server.
 */
export async function serveHtmlDashboard(
  stats: ProjectStats,
  port: number = 0
): Promise<{ url: string; close: () => void }> {
  const html = generateHtmlDashboard(stats);

  return new Promise((resolve, reject) => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(html);
    });

    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to get server address'));
        return;
      }

      const url = `http://127.0.0.1:${address.port}`;

      // Auto-open the default browser (platform-independent)
      const openCmd = process.platform === 'darwin'
        ? `open "${url}"`
        : process.platform === 'win32'
          ? `start "${url}"`
          : `xdg-open "${url}"`;

      exec(openCmd);

      resolve({
        url,
        close: () => server.close(),
      });
    });

    server.on('error', reject);
  });
}

export { generateHtmlDashboard };
