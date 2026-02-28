/**
 * HTML Dashboard Template — Sidebar layout with Chart.js, interactive tables,
 * light/dark mode, and micro-animations.
 *
 * This module exports the HTML string generator, keeping html.ts focused on
 * data prep and serving.
 */

export function buildHtmlTemplate(jsonData: string): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KOUNT Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --neon: #00ff88;
      --neon-dim: #00cc6a;
      --neon-glow: rgba(0, 255, 136, 0.15);
      --neon-glow-strong: rgba(0, 255, 136, 0.3);
      --white: #ffffff;
      --transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    html.dark {
      --bg-body: #0a0a0f;
      --bg-sidebar: #0e0e16;
      --bg-card: #12121a;
      --bg-card-hover: #1a1a2e;
      --bg-input: #1a1a2e;
      --bg-table-stripe: rgba(255, 255, 255, 0.02);
      --bg-table-hover: rgba(0, 255, 136, 0.05);
      --border: #1e1e30;
      --border-active: #2a2a44;
      --text-primary: #f0f0f5;
      --text-secondary: #8888a0;
      --text-muted: #55556a;
      --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.4);
      --shadow-card-hover: 0 8px 30px rgba(0, 0, 0, 0.6);
      --chart-grid: rgba(255, 255, 255, 0.06);
    }

    html:not(.dark) {
      --bg-body: #f4f5f7;
      --bg-sidebar: #ffffff;
      --bg-card: #ffffff;
      --bg-card-hover: #f8f9fb;
      --bg-input: #f0f1f3;
      --bg-table-stripe: rgba(0, 0, 0, 0.02);
      --bg-table-hover: rgba(0, 255, 136, 0.06);
      --border: #e2e4e8;
      --border-active: #d0d2d6;
      --text-primary: #111218;
      --text-secondary: #5a5d6a;
      --text-muted: #9a9daa;
      --shadow-card: 0 1px 4px rgba(0, 0, 0, 0.06);
      --shadow-card-hover: 0 6px 20px rgba(0, 0, 0, 0.1);
      --chart-grid: rgba(0, 0, 0, 0.06);
    }

    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg-body);
      color: var(--text-primary);
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* ===== LAYOUT ===== */
    .app { display: flex; min-height: 100vh; }

    .sidebar {
      width: 240px;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0; left: 0; bottom: 0;
      z-index: 50;
      transition: transform var(--transition);
    }

    .sidebar-brand {
      padding: 24px 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid var(--border);
    }

    .sidebar-brand svg { color: var(--neon); }
    .sidebar-brand span { font-weight: 700; font-size: 18px; letter-spacing: -0.5px; }

    .sidebar-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }

    .sidebar-nav a {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 8px;
      color: var(--text-secondary); text-decoration: none;
      font-size: 14px; font-weight: 500;
      transition: all var(--transition); cursor: pointer;
      position: relative; overflow: hidden;
    }

    .sidebar-nav a:hover { color: var(--text-primary); background: var(--bg-card-hover); }

    .sidebar-nav a.active {
      color: var(--neon); background: var(--neon-glow);
      font-weight: 600;
    }

    .sidebar-nav a.active::before {
      content: ''; position: absolute; left: 0; top: 4px; bottom: 4px;
      width: 3px; border-radius: 0 3px 3px 0; background: var(--neon);
    }

    .sidebar-nav a svg { width: 18px; height: 18px; flex-shrink: 0; }

    .sidebar-spacer { flex: 1; }

    .sidebar-footer {
      padding: 12px 8px; border-top: 1px solid var(--border);
      display: flex; flex-direction: column; gap: 2px;
    }

    .sidebar-footer a {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 8px;
      color: var(--text-secondary); text-decoration: none;
      font-size: 14px; font-weight: 500;
      transition: all var(--transition); cursor: pointer;
    }
    .sidebar-footer a:hover { color: var(--text-primary); background: var(--bg-card-hover); }
    .sidebar-footer a.active { color: var(--neon); background: var(--neon-glow); font-weight: 600; }
    .sidebar-footer a svg { width: 18px; height: 18px; flex-shrink: 0; }

    .theme-toggle {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 8px; border: none; background: none;
      color: var(--text-secondary); font-size: 14px; font-weight: 500;
      font-family: inherit; cursor: pointer; width: 100%; text-align: left;
      transition: all var(--transition);
    }
    .theme-toggle:hover { color: var(--text-primary); background: var(--bg-card-hover); }
    .theme-toggle svg { width: 18px; height: 18px; }

    .main-content {
      flex: 1; margin-left: 240px;
      padding: 28px 32px; min-height: 100vh;
    }

    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 28px;
    }

    .page-header h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }

    .header-actions { display: flex; gap: 10px; align-items: center; }

    .header-badge {
      font-size: 12px; color: var(--text-muted);
      padding: 6px 12px; border-radius: 6px;
      background: var(--bg-card); border: 1px solid var(--border);
    }

    .btn-export {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 8px; border: none;
      background: var(--neon); color: #000; font-weight: 600;
      font-size: 13px; font-family: inherit; cursor: pointer;
      transition: all var(--transition);
    }
    .btn-export:hover { background: var(--neon-dim); transform: translateY(-1px); box-shadow: 0 4px 15px var(--neon-glow-strong); }
    .btn-export svg { width: 16px; height: 16px; }

    /* ===== CARDS ===== */
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: var(--shadow-card);
      transition: all var(--transition);
    }
    .card:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-2px); }

    .card-title {
      font-size: 12px; text-transform: uppercase; letter-spacing: 1px;
      color: var(--text-muted); font-weight: 600; margin-bottom: 8px;
    }

    .card-value {
      font-size: 32px; font-weight: 800; letter-spacing: -1px;
      font-variant-numeric: tabular-nums;
    }

    .card-trend {
      font-size: 12px; font-weight: 600; margin-top: 6px;
      display: flex; align-items: center; gap: 4px;
    }
    .card-trend.up { color: #ff4466; }
    .card-trend.down { color: var(--neon); }
    .card-trend.neutral { color: var(--text-muted); }

    /* ===== GRID LAYOUTS ===== */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .chart-row { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 24px; }
    .chart-row-equal { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }

    /* ===== TABLE ===== */
    .table-controls {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px; gap: 12px; flex-wrap: wrap;
    }

    .search-input {
      padding: 8px 14px 8px 36px; border-radius: 8px; border: 1px solid var(--border);
      background: var(--bg-input); color: var(--text-primary); font-size: 14px;
      font-family: inherit; width: 280px; outline: none;
      transition: border-color var(--transition);
    }
    .search-input:focus { border-color: var(--neon); }
    .search-input::placeholder { color: var(--text-muted); }

    .search-wrap { position: relative; }
    .search-wrap svg {
      position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
      width: 16px; height: 16px; color: var(--text-muted);
    }

    table.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    table.data-table thead th {
      text-align: left; padding: 10px 12px; font-weight: 600;
      color: var(--text-muted); font-size: 11px; text-transform: uppercase;
      letter-spacing: 0.5px; border-bottom: 1px solid var(--border);
      cursor: pointer; user-select: none; white-space: nowrap;
      transition: color var(--transition);
    }
    table.data-table thead th:hover { color: var(--neon); }
    table.data-table thead th.sorted { color: var(--neon); }

    table.data-table tbody tr {
      border-bottom: 1px solid var(--border);
      transition: background var(--transition);
    }
    table.data-table tbody tr:nth-child(even) { background: var(--bg-table-stripe); }
    table.data-table tbody tr:hover { background: var(--bg-table-hover); }

    table.data-table td {
      padding: 10px 12px; font-variant-numeric: tabular-nums;
    }
    table.data-table td.path {
      font-family: 'JetBrains Mono', monospace; font-size: 12px;
      max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    .pagination {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);
    }
    .pagination span { font-size: 13px; color: var(--text-secondary); }
    .page-btns { display: flex; gap: 6px; }
    .page-btn {
      padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border);
      background: var(--bg-card); color: var(--text-primary); font-size: 13px;
      font-family: inherit; cursor: pointer; transition: all var(--transition);
    }
    .page-btn:hover:not(:disabled) { border-color: var(--neon); color: var(--neon); }
    .page-btn:disabled { opacity: 0.3; cursor: default; }

    /* ===== SECTION HEADING ===== */
    .section-title {
      font-size: 16px; font-weight: 700; margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
    }
    .section-title svg { width: 20px; height: 20px; color: var(--neon); }

    /* ===== HAMBURGER ===== */
    .hamburger {
      display: none; position: fixed; top: 16px; left: 16px;
      z-index: 60; padding: 8px; border-radius: 8px; cursor: pointer;
      background: var(--bg-card); border: 1px solid var(--border);
      color: var(--text-primary);
    }
    .hamburger svg { width: 22px; height: 22px; }

    .sidebar-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.5); z-index: 40;
    }

    /* ===== REMOVED ANIMATIONS ===== */

    .skeleton {
      background: var(--bg-card-hover);
      border-radius: 6px;
    }

    .section-view { display: none; }
    .section-view.active { display: block; }

    /* ===== LANG BAR ===== */
    .lang-bar-track { height: 8px; background: var(--bg-input); border-radius: 99px; overflow: hidden; flex: 1; }
    .lang-bar-fill { height: 100%; border-radius: 99px; background: var(--neon); transition: width 0.8s ease-out; }
    .lang-row { display: flex; align-items: center; gap: 14px; padding: 8px 0; }
    .lang-name { width: 120px; font-size: 13px; font-weight: 500; }
    .lang-pct { width: 48px; text-align: right; font-size: 13px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }

    /* ===== DROPDOWN ===== */
    .export-dropdown { position: relative; }
    .export-menu {
      position: absolute; top: 100%; right: 0; margin-top: 6px;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 10px; padding: 6px; min-width: 160px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.3); z-index: 100;
    }
    .export-menu button {
      display: flex; align-items: center; gap: 8px;
      width: 100%; padding: 8px 12px; border: none; border-radius: 6px;
      background: none; color: var(--text-primary); font-size: 13px;
      font-family: inherit; cursor: pointer; transition: background var(--transition);
    }
    .export-menu button:hover { background: var(--bg-card-hover); }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .chart-row, .chart-row-equal { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
      .sidebar-overlay.visible { display: block; }
      .hamburger { display: block; }
      .main-content { margin-left: 0; padding: 20px 16px; padding-top: 60px; }
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .search-input { width: 100%; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .table-controls { flex-direction: column; align-items: stretch; }
    }

    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body x-data="dashboard()" x-init="init()">

  <!-- Hamburger (mobile) -->
  <button class="hamburger" @click="sidebarOpen = true" x-show="!sidebarOpen">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  </button>

  <!-- Overlay -->
  <div class="sidebar-overlay" :class="{ visible: sidebarOpen }" @click="sidebarOpen = false"></div>

  <!-- Sidebar -->
  <aside class="sidebar" :class="{ open: sidebarOpen }">
    <div class="sidebar-brand">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      <span>KOUNT</span>
    </div>
    <nav class="sidebar-nav">
      <a :class="{ active: currentSection === 'overview' }" @click="go('overview')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        Overview
      </a>
      <a :class="{ active: currentSection === 'files' }" @click="go('files')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        Files
      </a>
      <a :class="{ active: currentSection === 'languages' }" @click="go('languages')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10A15 15 0 0112 2z"/></svg>
        Languages
      </a>
      <a :class="{ active: currentSection === 'debt' }" @click="go('debt')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Tech Debt
      </a>
      <a :class="{ active: currentSection === 'git' }" @click="go('git')" x-show="data.gitInsights">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>
        Git
      </a>
      <a :class="{ active: currentSection === 'trends' }" @click="go('trends')" x-show="data.trends">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        Trends
      </a>
    </nav>
    <div class="sidebar-spacer"></div>
    <div class="sidebar-footer">
      <a :class="{ active: currentSection === 'help' }" @click="go('help')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 015.12 1.3C14.12 11.8 12 12 12 14"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        Help
      </a>
      <button class="theme-toggle" @click="toggleTheme()">
        <template x-if="isDark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </template>
        <template x-if="!isDark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        </template>
        <span x-text="isDark ? 'Light mode' : 'Dark mode'"></span>
      </button>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="main-content">

    <!-- ===== OVERVIEW ===== -->
    <div class="section-view" :class="{ active: currentSection === 'overview' }">
      <div class="page-header">
        <h1>Overview</h1>
        <div class="header-actions">
          <span class="header-badge" x-text="'Scanned ' + new Date(data.scannedAt).toLocaleString()"></span>
          <div class="export-dropdown" x-data="{ open: false }" @click.outside="open = false">
            <button class="btn-export" @click="open = !open">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
            <div class="export-menu" x-show="open" x-transition>
              <button @click="exportData('json'); open = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
                Download JSON
              </button>
              <button @click="exportData('csv'); open = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                Download CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="card anim-fade-up delay-1">
          <div class="card-title">Total Files</div>
          <div class="card-value" x-text="animatedValues.files"></div>
          <template x-if="data.trends">
            <div class="card-trend" :class="data.trends.fileDelta > 0 ? 'up' : data.trends.fileDelta < 0 ? 'down' : 'neutral'">
              <span x-text="trendArrow(data.trends.fileDelta)"></span>
              <span x-text="trendText(data.trends.fileDelta)"></span>
            </div>
          </template>
        </div>
        <div class="card anim-fade-up delay-2">
          <div class="card-title">Lines of Code</div>
          <div class="card-value" x-text="animatedValues.codeLines"></div>
          <template x-if="data.trends">
            <div class="card-trend" :class="data.trends.linesDelta > 0 ? 'up' : data.trends.linesDelta < 0 ? 'down' : 'neutral'">
              <span x-text="trendArrow(data.trends.linesDelta)"></span>
              <span x-text="trendText(data.trends.linesDelta, ' lines')"></span>
            </div>
          </template>
        </div>
        <div class="card anim-fade-up delay-3">
          <div class="card-title">Total Size</div>
          <div class="card-value" x-text="data.summary.totalSize"></div>
          <template x-if="data.trends">
            <div class="card-trend" :class="data.trends.sizeDelta > 0 ? 'up' : data.trends.sizeDelta < 0 ? 'down' : 'neutral'">
              <span x-text="trendArrow(data.trends.sizeDelta)"></span>
              <span x-text="trendText(data.trends.sizeDelta, ' B')"></span>
            </div>
          </template>
        </div>
        <div class="card anim-fade-up delay-4">
          <div class="card-title">Tech Debt Score</div>
          <div class="card-value" x-text="animatedValues.debt"></div>
          <template x-if="data.trends">
            <div class="card-trend" :class="data.trends.debtDelta > 0 ? 'up' : data.trends.debtDelta < 0 ? 'down' : 'neutral'">
              <span x-text="trendArrow(data.trends.debtDelta)"></span>
              <span x-text="trendText(data.trends.debtDelta)"></span>
            </div>
          </template>
        </div>
      </div>

      <div class="chart-row">
        <div class="card anim-scale-in delay-3">
          <div class="section-title">Code Composition</div>
          <div style="position: relative; height: 220px; width: 100%;">
            <canvas id="compositionChart"></canvas>
          </div>
        </div>
        <div class="card anim-scale-in delay-4">
          <div class="section-title">Top Languages</div>
          <div style="position: relative; height: 220px; width: 100%;">
            <canvas id="langPieChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Largest Files (overview) -->
      <div class="card anim-fade-up delay-5" style="margin-bottom:24px">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;color:var(--neon)"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Largest Files
        </div>
        <table class="data-table">
          <thead><tr><th>#</th><th>File</th><th>Size</th></tr></thead>
          <tbody>
            <template x-for="f in data.largestFiles" :key="f.rank">
              <tr><td x-text="f.rank"></td><td class="path" x-text="f.path"></td><td x-text="f.size"></td></tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===== FILES ===== -->
    <div class="section-view" :class="{ active: currentSection === 'files' }">
      <div class="page-header"><h1>Files</h1></div>
      <div class="card">
        <div class="table-controls">
          <div class="search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input class="search-input" type="text" placeholder="Search files..." x-model="fileSearch" @input="filePage = 1">
          </div>
          <span style="font-size:13px;color:var(--text-secondary)" x-text="filteredFiles.length + ' files'"></span>
        </div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th @click="sortFiles('path')" :class="{ sorted: fileSort === 'path' }">Path</th>
                <th @click="sortFiles('lines')" :class="{ sorted: fileSort === 'lines' }">Lines</th>
                <th @click="sortFiles('comments')" :class="{ sorted: fileSort === 'comments' }">Comments</th>
                <th @click="sortFiles('blanks')" :class="{ sorted: fileSort === 'blanks' }">Blanks</th>
                <th @click="sortFiles('size')" :class="{ sorted: fileSort === 'size' }">Size</th>
                <th @click="sortFiles('debt')" :class="{ sorted: fileSort === 'debt' }">Debt</th>
                <th @click="sortFiles('commits')" :class="{ sorted: fileSort === 'commits' }">Commits</th>
                <th @click="sortFiles('debtScore')" :class="{ sorted: fileSort === 'debtScore' }">Score</th>
              </tr>
            </thead>
            <tbody>
              <template x-for="f in paginatedFiles" :key="f.path">
                <tr>
                  <td class="path" x-text="f.path"></td>
                  <td x-text="f.lines.toLocaleString()"></td>
                  <td x-text="f.comments.toLocaleString()"></td>
                  <td x-text="f.blanks.toLocaleString()"></td>
                  <td x-text="f.sizeFormatted"></td>
                  <td x-text="f.debt"></td>
                  <td x-text="f.commits"></td>
                  <td style="color:var(--neon);font-weight:600" x-text="f.debtScore.toLocaleString()"></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span x-text="'Page ' + filePage + ' of ' + totalFilePages"></span>
          <div class="page-btns">
            <button class="page-btn" :disabled="filePage <= 1" @click="filePage--">&larr; Prev</button>
            <button class="page-btn" :disabled="filePage >= totalFilePages" @click="filePage++">Next &rarr;</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== LANGUAGES ===== -->
    <div class="section-view" :class="{ active: currentSection === 'languages' }">
      <div class="page-header"><h1>Languages</h1></div>
      <div class="chart-row">
        <div class="card anim-scale-in">
          <div class="section-title">Distribution</div>
          <div style="position: relative; height: 300px; width: 100%;">
            <canvas id="langBarChart"></canvas>
          </div>
        </div>
        <div class="card anim-scale-in delay-2">
          <div class="section-title">Breakdown</div>
          <div style="display:flex;flex-direction:column;gap:4px;margin-top:8px">
            <template x-for="l in data.languages" :key="l.lang">
              <div class="lang-row">
                <span class="lang-name" x-text="l.lang"></span>
                <div class="lang-bar-track">
                  <div class="lang-bar-fill anim-bar-fill" :style="'width:' + l.pct + '%'"></div>
                </div>
                <span class="lang-pct" x-text="l.pct + '%'"></span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== TECH DEBT ===== -->
    <div class="section-view" :class="{ active: currentSection === 'debt' }">
      <div class="page-header"><h1>Tech Debt</h1></div>
      <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr)">
        <div class="card anim-fade-up delay-1">
          <div class="card-title">Debt Score</div>
          <div class="card-value" style="color:var(--neon)" x-text="data.summary.techDebtScore.toLocaleString()"></div>
        </div>
        <div class="card anim-fade-up delay-2">
          <div class="card-title">Debt Markers</div>
          <div class="card-value" x-text="data.summary.debtMarkers.toLocaleString()"></div>
        </div>
        <div class="card anim-fade-up delay-3">
          <div class="card-title">Comment Ratio</div>
          <div class="card-value" x-text="data.summary.codeRatio + '%'"></div>
        </div>
      </div>
      <div class="chart-row-equal">
        <div class="card anim-scale-in delay-3">
          <div class="section-title">Highest Debt Files</div>
          <div style="position: relative; height: 260px; width: 100%;">
            <canvas id="debtBarChart"></canvas>
          </div>
        </div>
        <div class="card anim-scale-in delay-4">
          <div class="section-title">Debt Hotspots (TODO/FIXME/HACK)</div>
          <table class="data-table">
            <thead><tr><th>#</th><th>File</th><th>Markers</th></tr></thead>
            <tbody>
              <template x-for="d in data.debtHotspots" :key="d.rank">
                <tr><td x-text="d.rank"></td><td class="path" x-text="d.path"></td><td style="color:#ff4466;font-weight:600" x-text="d.count"></td></tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ===== GIT ===== -->
    <div class="section-view" :class="{ active: currentSection === 'git' }">
      <div class="page-header"><h1>Git Intelligence</h1></div>
      <template x-if="data.gitInsights">
        <div>
          <template x-if="data.gitInsights.diffBranch">
            <div class="card anim-fade-up" style="margin-bottom:16px;padding:14px 20px;display:flex;align-items:center;gap:8px">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--neon)" stroke-width="2" style="width:18px;height:18px"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 009 9"/></svg>
              <span style="font-size:14px;color:var(--text-secondary)">Diff vs <strong x-text="data.gitInsights.diffBranch" style="color:var(--neon)"></strong></span>
            </div>
          </template>
          <div class="chart-row-equal">
            <div class="card anim-scale-in delay-2">
              <div class="section-title">Top Contributors</div>
              <div style="position: relative; height: 260px; width: 100%;">
                <canvas id="authorsChart"></canvas>
              </div>
            </div>
            <div class="card anim-scale-in delay-3">
              <div class="section-title">High-Churn Files</div>
              <table class="data-table">
                <thead><tr><th>#</th><th>File</th><th>Commits</th></tr></thead>
                <tbody>
                  <template x-for="f in data.gitInsights?.highChurnFiles ?? []" :key="f.rank">
                    <tr><td x-text="f.rank"></td><td class="path" x-text="f.path"></td><td style="color:var(--neon);font-weight:600" x-text="f.commits"></td></tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ===== TRENDS ===== -->
    <div class="section-view" :class="{ active: currentSection === 'trends' }">
      <div class="page-header"><h1>Trends</h1></div>
      <template x-if="data.trends">
        <div>
          <div class="stats-grid" style="grid-template-columns: repeat(5, 1fr)">
            <template x-for="(t, i) in trendCards" :key="t.label">
              <div class="card anim-fade-up" :class="'delay-' + (i+1)">
                <div class="card-title" x-text="t.label"></div>
                <div class="card-value" :style="'color:' + t.color + ';font-size:24px'" x-text="t.value"></div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>

    <!-- ===== HELP ===== -->
    <div class="section-view" :class="{ active: currentSection === 'help' }">
      <div class="page-header"><h1>Help</h1></div>
      <div class="card" style="margin-bottom:20px">
        <div class="section-title">CLI Commands</div>
        <table class="data-table" style="margin-top:8px">
          <thead><tr><th>Command</th><th>Short</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td style="font-family:'JetBrains Mono',monospace;color:var(--neon)">-d, --dir</td><td>-d</td><td>Target directory to scan</td></tr>
            <tr><td style="font-family:'JetBrains Mono',monospace;color:var(--neon)">--output-mode</td><td></td><td>terminal | markdown | html | json | csv</td></tr>
            <tr><td style="font-family:'JetBrains Mono',monospace;color:var(--neon)">--output &lt;path&gt;</td><td>-o</td><td>Output file path</td></tr>
            <tr><td style="font-family:'JetBrains Mono',monospace;color:var(--neon)">--no-gitignore</td><td></td><td>Don't respect .gitignore rules</td></tr>
            <tr><td style="font-family:'JetBrains Mono',monospace;color:var(--neon)">--diff &lt;branch&gt;</td><td></td><td>Only analyze files changed vs branch</td></tr>
            <tr><td style="font-family:'JetBrains Mono',monospace;color:var(--neon)">--fail-on-size &lt;mb&gt;</td><td></td><td>Max codebase size in MB (CI)</td></tr>
            <tr><td style="font-family:'JetBrains Mono',monospace;color:var(--neon)">--min-comment-ratio &lt;%&gt;</td><td></td><td>Min required comment ratio (CI)</td></tr>
            <tr><td style="font-family:'JetBrains Mono',monospace;color:var(--neon)">--force</td><td>-f</td><td>Overwrite existing files</td></tr>
            <tr><td style="font-family:'JetBrains Mono',monospace;color:var(--neon)">--version</td><td>-V</td><td>Display version number</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <div class="section-title">About</div>
        <p style="font-size:14px;color:var(--text-secondary);line-height:1.7;max-width:600px">
          KOUNT is a zero-dependency codebase analyzer built for developers who care about their craft. It scans your project, tracks technical debt, analyzes git history, and helps you make data-driven decisions about code quality.
        </p>
        <p style="font-size:13px;color:var(--text-muted);margin-top:12px">
          Built by <strong style="color:var(--text-primary)">Michael Nji</strong> &mdash; <a href="https://michaelnji.codes" target="_blank" style="color:var(--neon);text-decoration:none">michaelnji.codes</a>
        </p>
      </div>
    </div>

  </main>

  <script>
    function dashboard() {
      const raw = ${jsonData};
      return {
        data: raw,
        currentSection: 'overview',
        sidebarOpen: false,
        isDark: true,
        fileSearch: '',
        filePage: 1,
        fileSort: 'debtScore',
        fileSortDir: -1,
        filesPerPage: 25,
        animatedValues: { files: 0, codeLines: 0, debt: 0 },
        chartsInitialized: {},

        init() {
          const savedTheme = localStorage.getItem('kount-theme');
          if (savedTheme === 'light') { this.isDark = false; document.documentElement.classList.remove('dark'); }

          // Animate counters
          this.animateValue('files', this.data.summary.files, 600);
          this.animateValue('codeLines', this.data.summary.codeLines, 800);
          this.animateValue('debt', this.data.summary.techDebtScore, 700);

          // Build allFiles from plugin data
          this.buildFilesList();

          // Render charts after layout
          setTimeout(() => { this.renderCharts('overview'); }, 100);
        },

        buildFilesList() {
          if (!this._allFiles) {
            this._allFiles = raw.files || [];
          }
        },

        go(section) {
          this.currentSection = section;
          this.sidebarOpen = false;
          setTimeout(() => { this.renderCharts(section); }, 50);
        },

        toggleTheme() {
          this.isDark = !this.isDark;
          document.documentElement.classList.toggle('dark', this.isDark);
          localStorage.setItem('kount-theme', this.isDark ? 'dark' : 'light');
          // Re-render visible charts with new colors
          Object.keys(this.chartsInitialized).forEach(k => { this.chartsInitialized[k].destroy(); delete this.chartsInitialized[k]; });
          setTimeout(() => { this.renderCharts(this.currentSection); }, 50);
        },

        animateValue(key, target, duration) {
          const start = performance.now();
          const tick = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            this.animatedValues[key] = Math.round(target * eased).toLocaleString();
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        },

        trendArrow(v) { return v > 0 ? '↑' : v < 0 ? '↓' : '—'; },
        trendText(v, suffix = '') {
          if (v === 0) return 'No change';
          return (v > 0 ? '+' : '') + v.toLocaleString() + suffix + ' vs last scan';
        },

        get trendCards() {
          const t = this.data.trends;
          if (!t) return [];
          const fmt = (v) => (v > 0 ? '+' + v.toLocaleString() : v.toLocaleString());
          const clr = (v, invert) => {
            if (v === 0) return 'var(--text-muted)';
            return (v > 0) === !invert ? '#ff4466' : 'var(--neon)';
          };
          return [
            { label: 'Files', value: fmt(t.fileDelta), color: clr(t.fileDelta) },
            { label: 'Lines', value: fmt(t.linesDelta), color: clr(t.linesDelta) },
            { label: 'Size (B)', value: fmt(t.sizeDelta), color: clr(t.sizeDelta) },
            { label: 'Comment %', value: fmt(t.commentRatioDelta) + '%', color: clr(t.commentRatioDelta, true) },
            { label: 'Debt', value: fmt(t.debtDelta), color: clr(t.debtDelta) },
          ];
        },

        /* File table */
        get filteredFiles() {
          let files = this._allFiles || [];
          if (this.fileSearch) {
            const q = this.fileSearch.toLowerCase();
            files = files.filter(f => f.path.toLowerCase().includes(q));
          }
          const dir = this.fileSortDir;
          const key = this.fileSort;
          files = [...files].sort((a, b) => {
            if (key === 'path') return dir * a.path.localeCompare(b.path);
            return dir * ((a[key] ?? 0) - (b[key] ?? 0));
          });
          return files;
        },
        get totalFilePages() { return Math.max(1, Math.ceil(this.filteredFiles.length / this.filesPerPage)); },
        get paginatedFiles() {
          const start = (this.filePage - 1) * this.filesPerPage;
          return this.filteredFiles.slice(start, start + this.filesPerPage);
        },
        sortFiles(key) {
          if (this.fileSort === key) { this.fileSortDir *= -1; }
          else { this.fileSort = key; this.fileSortDir = key === 'path' ? 1 : -1; }
          this.filePage = 1;
        },

        /* Export */
        exportData(fmt) {
          let content, mime, name;
          if (fmt === 'json') {
            content = JSON.stringify(this.data, null, 2);
            mime = 'application/json'; name = 'kount-report.json';
          } else {
            const files = this._allFiles || [];
            const header = 'Path,Lines,Comments,Blanks,Size,Debt Markers,Commits,Debt Score';
            const rows = files.map(f => [f.path, f.lines, f.comments, f.blanks, f.size, f.debt, f.commits, f.debtScore].join(','));
            content = [header, ...rows].join('\\n');
            mime = 'text/csv'; name = 'kount-report.csv';
          }
          const blob = new Blob([content], { type: mime });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = name;
          a.click(); URL.revokeObjectURL(a.href);
        },

        /* Charts */
        renderCharts(section) {
          const gridClr = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid').trim();
          const txtClr = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim();

          if (section === 'overview') {
            if (!this.chartsInitialized.composition) {
              const ctx = document.getElementById('compositionChart');
              if (ctx) {
                this.chartsInitialized.composition = new Chart(ctx, {
                  type: 'doughnut',
                  data: {
                    labels: ['Code', 'Comments', 'Blanks'],
                    datasets: [{ data: [this.data.summary.codeLines, this.data.summary.commentLines, this.data.summary.blankLines],
                      backgroundColor: ['#00ff88', '#6366f1', '#334155'], borderWidth: 0, hoverOffset: 8 }]
                  },
                  options: { responsive: true, maintainAspectRatio: false, cutout: '65%',
                    plugins: { legend: { position: 'bottom', labels: { color: txtClr, padding: 16, usePointStyle: true, pointStyleWidth: 10 } } },
                    animation: false
                  }
                });
              }
            }
            if (!this.chartsInitialized.langPie) {
              const ctx2 = document.getElementById('langPieChart');
              if (ctx2 && this.data.languages.length) {
                const colors = ['#00ff88','#6366f1','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16'];
                this.chartsInitialized.langPie = new Chart(ctx2, {
                  type: 'doughnut',
                  data: {
                    labels: this.data.languages.map(l => l.lang),
                    datasets: [{ data: this.data.languages.map(l => l.count),
                      backgroundColor: colors.slice(0, this.data.languages.length), borderWidth: 0, hoverOffset: 6 }]
                  },
                  options: { responsive: true, maintainAspectRatio: false, cutout: '55%',
                    plugins: { legend: { position: 'bottom', labels: { color: txtClr, padding: 12, usePointStyle: true, pointStyleWidth: 10 } } },
                    animation: false
                  }
                });
              }
            }
          }

          if (section === 'languages' && !this.chartsInitialized.langBar) {
            const ctx = document.getElementById('langBarChart');
            if (ctx && this.data.languages.length) {
              this.chartsInitialized.langBar = new Chart(ctx, {
                type: 'bar',
                data: {
                  labels: this.data.languages.map(l => l.lang),
                  datasets: [{ label: 'Files', data: this.data.languages.map(l => l.count),
                    backgroundColor: '#00ff8866', borderColor: '#00ff88', borderWidth: 1, borderRadius: 6, barPercentage: 0.6, maxBarThickness: 32 }]
                },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                  scales: { x: { grid: { color: gridClr }, ticks: { color: txtClr } }, y: { grid: { display: false }, ticks: { color: txtClr } } },
                  plugins: { legend: { display: false } }, animation: false
                }
              });
            }
          }

          if (section === 'debt' && !this.chartsInitialized.debtBar) {
            const ctx = document.getElementById('debtBarChart');
            if (ctx && this.data.highDebtFiles.length) {
              const labels = this.data.highDebtFiles.map(f => f.path.split('/').pop());
              this.chartsInitialized.debtBar = new Chart(ctx, {
                type: 'bar',
                data: {
                  labels,
                  datasets: [{ label: 'Debt Score', data: this.data.highDebtFiles.map(f => f.score),
                    backgroundColor: '#f59e0b55', borderColor: '#f59e0b', borderWidth: 1, borderRadius: 6, barPercentage: 0.6, maxBarThickness: 32 }]
                },
                options: { responsive: true, maintainAspectRatio: false,
                  scales: { x: { grid: { display: false }, ticks: { color: txtClr } }, y: { grid: { color: gridClr }, ticks: { color: txtClr } } },
                  plugins: { legend: { display: false } }, animation: false
                }
              });
            }
          }

          if (section === 'git' && this.data.gitInsights && !this.chartsInitialized.authors) {
            const ctx = document.getElementById('authorsChart');
            if (ctx && this.data.gitInsights.topAuthors.length) {
              this.chartsInitialized.authors = new Chart(ctx, {
                type: 'bar',
                data: {
                  labels: this.data.gitInsights.topAuthors.map(a => a.name),
                  datasets: [{ label: 'Commits', data: this.data.gitInsights.topAuthors.map(a => a.commits),
                    backgroundColor: '#6366f155', borderColor: '#6366f1', borderWidth: 1, borderRadius: 6, barPercentage: 0.6, maxBarThickness: 32 }]
                },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                  scales: { x: { grid: { color: gridClr }, ticks: { color: txtClr, precision: 0 } }, y: { grid: { display: false }, ticks: { color: txtClr } } },
                  plugins: { legend: { display: false } }, animation: false
                }
              });
            }
          }
        },
      };
    }
  </script>
</body>
</html>`;
}
