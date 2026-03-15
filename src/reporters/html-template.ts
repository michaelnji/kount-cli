/**
 * HTML Dashboard Template — Sidebar layout with Chart.js, interactive tables,
 * light/dark mode, and micro-animations.
 *
 * This module exports the HTML string generator, keeping html.ts focused on
 * data prep and serving.
 */

export function buildHtmlTemplate(jsonData: string): string {
  const parsed = JSON.parse(jsonData);
  const historyJson = JSON.stringify(parsed.history || []);

  // Sanitize JSON for safe embedding in a <script> tag
  const safeJson = jsonData.replace(/<\//g, '<\\/');
  const safeHistoryJson = historyJson.replace(/<\//g, '<\\/');

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KOUNT Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script>
    window.__K_FONTS_LOADED__ = false;
    function onKountAssetsLoaded() {
      window.__K_FONTS_LOADED__ = true;
      document.dispatchEvent(new Event('kount-assets-ready'));
    }
  </script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css" onload="onKountAssetsLoaded()" onerror="onKountAssetsLoaded()">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <style>
    /* x-cloak prevents flash of un-initialized Alpine elements */
    [x-cloak] { display: none !important; }

    /* Screen-reader-only utility */
    .visually-hidden {
      position: absolute; width: 1px; height: 1px;
      padding: 0; margin: -1px; overflow: hidden;
      clip: rect(0,0,0,0); white-space: nowrap; border: 0;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ===== DESIGN TOKENS ===== */
    :root {
      /* Brand */
      --neon: #55C5C7;
      --neon-dim: #3EA8AB;
      --neon-glow: rgba(85, 197, 199, 0.12);
      --neon-glow-strong: rgba(85, 197, 199, 0.25);
      --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
      --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
      --logo-dark: #153961;

      /* Typography tokens */
      --font-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'Space Grotesk', 'Courier New', monospace;

      /* Semantic color tokens */
      --color-danger: #f43f5e;
      --color-danger-alpha: rgba(244, 63, 94, 0.2);
      --color-warning: #f59e0b;
      --color-success: var(--neon);

      /* Chart color palette — purposeful, theme-aware */
      --chart-1: #55C5C7;
      --chart-1-alpha: rgba(85, 197, 199, 0.35);
      --chart-2: #818cf8;
      --chart-2-alpha: rgba(129, 140, 248, 0.25);
      --chart-3: #fbbf24;
      --chart-4: #f87171;
      --chart-5: #60a5fa;
      --chart-6: #a78bfa;
      --chart-7: #f472b6;
      --chart-8: #34d399;
      --chart-9: #fb923c;
      --chart-10: #a3e635;
      --chart-point-bg: #000000;
    }

    html.dark {
      --bg-body: #080a0c;
      --bg-sidebar: #080a0c;
      --bg-card: #0f1114;
      --bg-card-hover: #171a1e;
      --bg-input: #13161a;
      --bg-table-stripe: rgba(255, 255, 255, 0.02);
      --bg-table-hover: rgba(85, 197, 199, 0.04);
      --border: #1e2126;
      --border-active: #2d333b;
      --text-primary: #e8eaed;
      --text-secondary: #9aa3af;
      --text-muted: #5c6470;
      --shadow-card: none;
      --shadow-card-hover: none;
      --chart-grid: rgba(255, 255, 255, 0.05);
      --logo-dark: #ffffff;
      --chart-point-bg: #080a0c;

      /* Slightly lighter in dark to ensure contrast on dark bg */
      --chart-1: #60cfd1;
      --chart-1-alpha: rgba(96, 207, 209, 0.2);
      --chart-2: #a5b4fc;
      --chart-2-alpha: rgba(165, 180, 252, 0.2);
    }

    html:not(.dark) {
      --neon: #1C8587;
      --neon-dim: #176B6D;
      --neon-glow: rgba(28, 133, 135, 0.1);
      --neon-glow-strong: rgba(28, 133, 135, 0.2);
      --color-danger: #e11d48;
      --color-danger-alpha: rgba(225, 29, 72, 0.15);
      --color-warning: #d97706;
      --bg-body: #f7f8fa;
      --bg-sidebar: #ffffff;
      --bg-card: #ffffff;
      --bg-card-hover: #f7f8fa;
      --bg-input: #f0f2f5;
      --bg-table-stripe: rgba(0, 0, 0, 0.018);
      --bg-table-hover: rgba(28, 133, 135, 0.05);
      --border: #e5e8ec;
      --border-active: #c8cdd5;
      --text-primary: #0d1117;
      --text-secondary: #444c56;
      --text-muted: #8b949e;
      --shadow-card: 0 1px 3px rgba(0,0,0,0.06);
      --shadow-card-hover: 0 4px 12px rgba(0,0,0,0.08);
      --chart-grid: rgba(0, 0, 0, 0.05);
      --logo-dark: #153961;
      --chart-point-bg: #f7f8fa;

      /* Adjusted palette for light mode legibility */
      --chart-1: #1C8587;
      --chart-1-alpha: rgba(28, 133, 135, 0.2);
      --chart-2: #6366f1;
      --chart-2-alpha: rgba(99, 102, 241, 0.2);
      --chart-3: #d97706;
      --chart-4: #e11d48;
      --chart-5: #3b82f6;
      --chart-6: #7c3aed;
      --chart-7: #db2777;
      --chart-8: #059669;
      --chart-9: #ea580c;
      --chart-10: #65a30d;
    }

    body {
      font-family: var(--font-sans);
      background: var(--bg-body);
      color: var(--text-primary);
      min-height: 100vh;
      overflow-x: hidden;
    }

    h1, h2, h3, h4, h5, h6, .page-header, .section-title, .card-title {
      font-family: var(--font-sans);
    }

    .card-value, .card-trend, .lang-pct, table td, table th, .header-badge, .pagination, pre, code, .font-mono, .path {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
    }

    /* ===== LAYOUT ===== */
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

    .sidebar-brand span { font-weight: 800; font-size: 20px; letter-spacing: -1px; }

    /* Navigation uses buttons for keyboard accessibility */
    .sidebar-nav { flex: 1; padding: 12px 8px; margin-top: 16px; display: flex; flex-direction: column; gap: 2px; }

    .sidebar-nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 14px; border-radius: 8px; border: none; background: none;
      color: var(--text-secondary); text-decoration: none;
      font-size: 14px; font-weight: 500; font-family: var(--font-sans);
      transition: color var(--transition), background var(--transition);
      cursor: pointer; width: 100%; text-align: left;
      position: relative; overflow: hidden;
      min-height: 44px;
    }

    .sidebar-nav-item:hover { color: var(--text-primary); background: var(--bg-card-hover); }

    .sidebar-nav-item.active {
      color: var(--neon); background: var(--neon-glow);
      font-weight: 600;
    }

    .sidebar-nav-item.active::before {
      content: ''; position: absolute; left: 0; top: 4px; bottom: 4px;
      width: 4px; border-radius: 0 4px 4px 0; background: var(--neon);
    }

    /* Focus indicators for keyboard navigation */
    .sidebar-nav-item:focus-visible {
      outline: 2px solid var(--neon);
      outline-offset: -2px;
    }

    .sidebar-nav-item svg { width: 18px; height: 18px; flex-shrink: 0; transition: transform 200ms var(--ease-out-quint); }
    .sidebar-nav-item:hover svg { transform: translateX(3px); }

    .sidebar-spacer { flex: 1; }

    .sidebar-footer {
      padding: 12px 8px; border-top: 1px solid var(--border);
      display: flex; flex-direction: column; gap: 2px;
    }

    /* Info banner — used for contextual notices (e.g. diff branch) */
    .info-banner {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 20px; margin-bottom: 16px;
    }

    .theme-toggle {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 8px; border: none; background: none;
      color: var(--text-secondary); font-size: 14px; font-weight: 500;
      font-family: var(--font-sans); cursor: pointer; width: 100%; text-align: left;
      transition: color var(--transition), background var(--transition);
      min-height: 44px;
    }
    .theme-toggle:hover { color: var(--text-primary); background: var(--bg-card-hover); }
    .theme-toggle:focus-visible { outline: 2px solid var(--neon); outline-offset: -2px; border-radius: 8px; }
    .theme-toggle svg { width: 18px; height: 18px; }

    .main-content {
      flex: 1; margin-left: 240px;
      padding: 28px 32px; min-height: 100vh;
    }

    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 8px;
    }

    .page-header h1 { font-size: 30px; font-weight: 800; letter-spacing: -1.5px; }

    .section-tip {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 28px;
      max-width: 800px;
    }

    .header-actions { display: flex; gap: 10px; align-items: center; }

    .header-badge {
      font-size: 12px; color: var(--text-muted);
      padding: 6px 12px; border-radius: 6px;
      background: var(--bg-card); border: 1px solid var(--border);
    }

    /* btn-export: removed translateY lift and toned down glow */
    .btn-export {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 16px; border-radius: 8px; border: 1px solid var(--neon);
      background: transparent; color: var(--neon); font-weight: 600;
      font-size: 13px; font-family: var(--font-sans); cursor: pointer;
      transition: background var(--transition), color var(--transition), transform 120ms var(--ease-out-quint);
    }
    .btn-export:hover { background: var(--neon-glow); transform: scale(1.02); }
    .btn-export:active { transform: scale(0.97); transition-duration: 60ms; }
    .btn-export:focus-visible { outline: 2px solid var(--neon); outline-offset: 2px; }
    .btn-export svg { width: 16px; height: 16px; }

    /* ===== CARDS ===== */
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: var(--shadow-card);
      /* No hover lift — cards are informational, not interactive */
    }

    .card-title {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px;
      color: var(--text-muted); font-weight: 600; margin-bottom: 8px;
    }

    .card-value {
      font-size: 36px; font-weight: 800; letter-spacing: -1px;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }

    .card-trend {
      font-size: 12px; font-weight: 500; margin-top: 10px;
      display: flex; align-items: center; gap: 4px;
    }
    .card-trend.up   { color: var(--color-danger); }
    .card-trend.down { color: var(--color-success); }
    .card-trend.neutral { color: var(--text-muted); }

    /* Utility classes for semantic value states — replace inline styles */
    .value--accent  { color: var(--neon); font-weight: 600; }
    .value--danger  { color: var(--color-danger); font-weight: 600; }
    .value--warning { color: var(--color-warning); font-weight: 600; }
    .value--muted   { color: var(--text-muted); }

    /* ===== GRID LAYOUTS ===== */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stats-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    /* Trends grid — proper class instead of inline style */
    .stats-grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 24px; }
    .chart-row { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 24px; }
    .chart-row-equal { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }

    /* ===== TABLE ===== */
    .table-controls {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px; gap: 12px; flex-wrap: wrap;
    }

    .search-wrap { position: relative; }
    .search-wrap svg {
      position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
      width: 16px; height: 16px; color: var(--text-muted);
      pointer-events: none;
    }

    .search-input {
      padding: 8px 14px 8px 36px; border-radius: 8px; border: 1px solid var(--border);
      background: var(--bg-input); color: var(--text-primary); font-size: 14px;
      font-family: var(--font-sans); width: 280px; outline: none;
      transition: border-color var(--transition);
    }
    .search-input:focus { border-color: var(--neon); }
    .search-input:focus-visible { outline: 2px solid var(--neon); outline-offset: -1px; }
    .search-input::placeholder { color: var(--text-muted); }

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
    table.data-table thead th[aria-sort="none"] { cursor: pointer; }

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
      font-family: var(--font-mono); font-size: 12px;
      max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    .pagination {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);
    }
    .pagination span { font-size: 13px; color: var(--text-secondary); }
    .page-btns { display: flex; gap: 6px; }
    .page-btn {
      padding: 10px 16px; border-radius: 6px; border: 1px solid var(--border);
      background: var(--bg-card); color: var(--text-primary); font-size: 13px;
      font-family: var(--font-sans); cursor: pointer; transition: border-color var(--transition), color var(--transition), transform 100ms var(--ease-out-quint);
    }
    .page-btn:hover:not(:disabled) { border-color: var(--neon); color: var(--neon); }
    .page-btn:active:not(:disabled) { transform: scale(0.95); }
    .page-btn:focus-visible { outline: 2px solid var(--neon); outline-offset: 2px; }
    .page-btn:disabled { opacity: 0.35; cursor: default; }

    /* ===== SECTION HEADING ===== */
    .section-title {
      font-size: 16px; font-weight: 700; margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
      color: var(--text-primary);
    }
    /* Icons in section titles use muted tone — they guide, not shout */
    .section-title svg { width: 18px; height: 18px; color: var(--text-muted); flex-shrink: 0; }

    /* ===== HAMBURGER ===== */
    .hamburger {
      display: none; position: fixed; top: 12px; left: 12px;
      z-index: 60; padding: 11px; border-radius: 8px; cursor: pointer;
      background: var(--bg-card); border: 1px solid var(--border);
      color: var(--text-primary); min-width: 44px; min-height: 44px;
    }
    .hamburger:focus-visible { outline: 2px solid var(--neon); outline-offset: 2px; }
    .hamburger svg { width: 22px; height: 22px; display: block; }

    .sidebar-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.45); z-index: 40;
    }

    .skeleton {
      background: var(--bg-card-hover);
      border-radius: 6px;
    }

    .section-view { display: none; }
    .section-view.active { display: block; animation: kount-fade-up 270ms var(--ease-out-quint) both; }

    /* ===== LANG BAR ===== */
    .lang-bar-track { height: 6px; background: var(--bg-input); border-radius: 99px; overflow: hidden; flex: 1; }
    .lang-bar-fill { height: 100%; border-radius: 99px; background: var(--neon); transition: width 0.6s ease-out; }
    .lang-row { display: flex; align-items: center; gap: 14px; padding: 8px 0; }
    .lang-name { width: 120px; font-size: 13px; font-weight: 500; color: var(--text-primary); }
    .lang-pct { width: 44px; text-align: right; font-size: 12px; color: var(--text-muted); font-variant-numeric: tabular-nums; }

    /* ===== DROPDOWN ===== */
    .export-dropdown { position: relative; }
    .export-menu {
      position: absolute; top: 100%; right: 0; margin-top: 6px;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 10px; padding: 6px; min-width: 160px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2); z-index: 100;
    }
    .export-menu button {
      display: flex; align-items: center; gap: 8px;
      width: 100%; padding: 8px 12px; border: none; border-radius: 6px;
      background: none; color: var(--text-primary); font-size: 13px;
      font-family: var(--font-sans); cursor: pointer; transition: background var(--transition);
    }
    .export-menu button:hover { background: var(--bg-card-hover); }
    .export-menu button:focus-visible { outline: 2px solid var(--neon); outline-offset: -2px; border-radius: 6px; }

    /* ===== INLINE CODE ===== */
    code {
      font-family: var(--font-mono);
      font-size: 0.875em;
      background: var(--bg-input);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border);
      color: var(--neon);
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 1200px) {
      .stats-grid-5 { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .stats-grid-5 { grid-template-columns: repeat(2, 1fr); }
      .chart-row, .chart-row-equal { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
      .sidebar-overlay.visible { display: block; }
      .hamburger { display: flex; align-items: center; justify-content: center; }
      .main-content { margin-left: 0; padding: 20px 16px; padding-top: 68px; }
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .stats-grid-3 { grid-template-columns: 1fr 1fr; }
      .stats-grid-5 { grid-template-columns: 1fr 1fr; }
      .search-input { width: 100%; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .table-controls { flex-direction: column; align-items: stretch; }
      .card { padding: 18px; }
    }

    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
      .stats-grid-3 { grid-template-columns: 1fr; }
      .stats-grid-5 { grid-template-columns: 1fr; }
      .card-value { font-size: 28px; }
    }

    /* ===== ANIMATIONS ===== */
    @keyframes kount-fade-up {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes kount-slide-in {
      from { opacity: 0; transform: translateX(-10px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    @keyframes kount-icon-spin {
      from { opacity: 0; transform: rotate(-30deg) scale(0.8); }
      to   { opacity: 1; transform: rotate(0deg) scale(1); }
    }

    /* Theme toggle icon spins in when DOM-swapped by x-if */
    .theme-toggle svg { animation: kount-icon-spin 200ms var(--ease-out-quint) both; }

    /* Desktop-only sidebar entrance */
    @media (min-width: 769px) {
      .sidebar { animation: kount-slide-in 380ms var(--ease-out-quint) both; }
    }

    /* Skeleton UI */
    @keyframes kount-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .skel-card { background-color: var(--border); border-radius: 12px; height: 120px; animation: kount-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    .skel-header { background-color: var(--border); border-radius: 8px; height: 36px; width: 180px; margin-bottom: 24px; animation: kount-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

    /* Respect reduced-motion preference */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
      .lang-bar-fill { transition: none !important; }
    }
  </style>
</head>
<body x-data="dashboard()" x-init="init()">

  <!-- Hamburger (mobile) -->
  <button
    class="hamburger"
    type="button"
    @click="sidebarOpen = true"
    x-show="!sidebarOpen"
    aria-label="Open navigation menu"
    :aria-expanded="sidebarOpen"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  </button>

  <!-- Overlay -->
  <div
    class="sidebar-overlay"
    :class="{ visible: sidebarOpen }"
    @click="sidebarOpen = false"
    aria-hidden="true"
  ></div>

  <!-- Sidebar -->
  <aside class="sidebar" :class="{ open: sidebarOpen }" aria-label="Main navigation">
    <div class="sidebar-brand">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="none" aria-hidden="true">
        <path d="M 127.15,49.43 L 110.85,59.4 C 97.91,67.11 92.19,79.71 92.67,94.01 V 100.69 L 137.71,73.68 C 145.06,69.33 151.79,68.61 158.45,68.15 L 127.85,49.43 H 127.15 Z" fill="var(--neon)"/>
        <path d="M 177.78,78.99 C 164.83,71.67 148.76,73.13 133.92,83.96 L 170.07,105.07 V 159.43 C 170.07,169.08 167.78,177.51 165.21,184.11 L 194.31,167.38 V 89.66 L 177.78,78.99 Z" fill="var(--neon)"/>
        <path d="M 163.66,155.21 L 116.91,183.81 C 110.99,187.32 104.81,188.44 98.22,188.19 L 127.85,205.62 L 144.52,195.71 C 157.91,187.76 164.61,174.91 163.66,158.81 V 155.21 Z" fill="var(--neon)"/>
        <path d="M 86.04,151.37 V 94.01 C 86.04,85.81 88.22,78.18 90.81,71.7 L 61.29,89.66 V 167.38 L 76.21,177.01 C 88.91,184.94 106.27,183.39 120.95,172.86 L 86.04,151.37 Z" fill="var(--neon)"/>
        <path d="M 132.72,5.63 V 39.44 L 200.82,79.28 L 230.76,62.42 L 133.32,5.63 H 132.72 Z" fill="var(--logo-dark)"/>
        <path d="M 236.39,71.53 L 206.71,88.66 V 167.91 L 236.39,184.46 V 71.53 Z" fill="var(--logo-dark)"/>
        <path d="M 132.72,215.82 V 250.37 L 230.16,193.58 V 192.98 L 200.52,176.43 L 132.72,215.82 Z" fill="var(--logo-dark)"/>
        <path d="M 24.95,193.58 L 122.54,250.37 V 215.82 L 54.59,176.43 L 24.95,192.98 V 193.58 Z" fill="var(--logo-dark)"/>
        <path d="M 19.08,71.53 V 184.46 L 48.72,167.91 V 88.66 L 19.08,71.53 Z" fill="var(--logo-dark)"/>
        <path d="M 24.95,62.42 L 54.89,79.28 L 122.39,39.44 V 5.63 H 122.1 L 24.95,61.82 V 62.42 Z" fill="var(--logo-dark)"/>
      </svg>
      <span>KOUNT</span>
    </div>
    <nav class="sidebar-nav" aria-label="Dashboard sections">
      <button type="button" class="sidebar-nav-item" :class="{ active: currentSection === 'overview' }" @click="go('overview')" :aria-current="currentSection === 'overview' ? 'page' : undefined">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        Overview
      </button>
      <button type="button" class="sidebar-nav-item" :class="{ active: currentSection === 'files' }" @click="go('files')" :aria-current="currentSection === 'files' ? 'page' : undefined">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        Files
      </button>
      <button type="button" class="sidebar-nav-item" :class="{ active: currentSection === 'languages' }" @click="go('languages')" :aria-current="currentSection === 'languages' ? 'page' : undefined">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10A15 15 0 0112 2z"/></svg>
        Languages
      </button>
      <button type="button" class="sidebar-nav-item" :class="{ active: currentSection === 'debt' }" @click="go('debt')" :aria-current="currentSection === 'debt' ? 'page' : undefined">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Code Health
      </button>
      <button type="button" class="sidebar-nav-item" :class="{ active: currentSection === 'git' }" @click="go('git')" x-show="data.gitInsights" :aria-current="currentSection === 'git' ? 'page' : undefined">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>
        Git
      </button>
      <button type="button" class="sidebar-nav-item" :class="{ active: currentSection === 'dependencies' }" @click="go('dependencies')" x-show="data.topDependencies && data.topDependencies.length > 0" :aria-current="currentSection === 'dependencies' ? 'page' : undefined">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        Dependencies
      </button>
      <button type="button" class="sidebar-nav-item" :class="{ active: currentSection === 'trends' }" @click="go('trends')" x-show="data.trends" :aria-current="currentSection === 'trends' ? 'page' : undefined">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        Trends
      </button>
    </nav>
    <div class="sidebar-spacer"></div>
    <div class="sidebar-footer">
      <button type="button" class="sidebar-nav-item" :class="{ active: currentSection === 'help' }" @click="go('help')" :aria-current="currentSection === 'help' ? 'page' : undefined">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 015.12 1.3C14.12 11.8 12 12 12 14"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        Help
      </button>
      <button class="theme-toggle" type="button" @click="toggleTheme()" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
        <template x-if="isDark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </template>
        <template x-if="!isDark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        </template>
        <span x-text="isDark ? 'Light mode' : 'Dark mode'" aria-hidden="true"></span>
      </button>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="main-content">

    <!-- Skeleton Loader -->
    <div x-show="isLoading" aria-busy="true" aria-label="Loading dashboard" style="width: 100%; padding: 20px 0;">
      <div class="skel-header"></div>
      <div class="stats-grid" style="margin-bottom: 32px;">
        <div class="skel-card"></div>
        <div class="skel-card"></div>
        <div class="skel-card"></div>
        <div class="skel-card"></div>
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;">
        <div class="skel-card" style="height: 380px;"></div>
        <div class="skel-card" style="height: 380px;"></div>
      </div>
    </div>

    <!-- Actual Content — x-cloak prevents FOUC, x-show controls visibility -->
    <div x-cloak x-show="!isLoading" x-transition.duration.350ms>

      <!-- ===== OVERVIEW ===== -->
      <div class="section-view" :class="{ active: currentSection === 'overview' }">
        <div class="page-header">
          <h1>Overview</h1>
          <div class="header-actions">
            <span class="header-badge" x-text="data.scannedAt ? ('Scanned ' + new Date(data.scannedAt).toLocaleString()) : 'Scan data unavailable'"></span>
            <!-- Export dropdown with proper ARIA -->
            <div class="export-dropdown" x-data="{ open: false }" @click.outside="open = false" @keydown.escape="open = false">
              <button
                class="btn-export"
                type="button"
                @click="open = !open"
                :aria-expanded="open"
                aria-haspopup="menu"
                aria-label="Export data"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export
              </button>
              <div class="export-menu" role="menu" x-show="open" x-transition>
                <button type="button" role="menuitem" @click="exportData('json'); open = false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
                  Download JSON
                </button>
                <button type="button" role="menuitem" @click="exportData('csv'); open = false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        <p class="section-tip">A high-level snapshot of your codebase. Use the sidebar to drill into files, languages, code health, and git history.</p>

        <div class="stats-grid-5">
          <div class="card">
            <div class="card-title">Total Files</div>
            <div class="card-value" x-text="animatedValues.files"></div>
            <template x-if="data.trends">
              <div class="card-trend" :class="data.trends.fileDelta > 0 ? 'up' : data.trends.fileDelta < 0 ? 'down' : 'neutral'">
                <span x-text="trendArrow(data.trends.fileDelta)" aria-hidden="true"></span>
                <span x-text="trendText(data.trends.fileDelta)"></span>
              </div>
            </template>
          </div>
          <div class="card">
            <div class="card-title">Lines of Code</div>
            <div class="card-value" x-text="animatedValues.codeLines"></div>
            <template x-if="data.trends">
              <div class="card-trend" :class="data.trends.linesDelta > 0 ? 'up' : data.trends.linesDelta < 0 ? 'down' : 'neutral'">
                <span x-text="trendArrow(data.trends.linesDelta)" aria-hidden="true"></span>
                <span x-text="trendText(data.trends.linesDelta, ' lines')"></span>
              </div>
            </template>
          </div>
          <div class="card">
            <div class="card-title">Total Size</div>
            <div class="card-value" x-text="data.summary.totalSize"></div>
            <template x-if="data.trends">
              <div class="card-trend" :class="data.trends.sizeDelta > 0 ? 'up' : data.trends.sizeDelta < 0 ? 'down' : 'neutral'">
                <span x-text="trendArrow(data.trends.sizeDelta)" aria-hidden="true"></span>
                <span x-text="trendText(data.trends.sizeDelta, ' B')"></span>
              </div>
            </template>
          </div>
          <div class="card">
            <div class="card-title">Cleanup Score</div>
            <div class="card-value" x-text="animatedValues.debt"></div>
            <template x-if="data.trends">
              <div class="card-trend" :class="data.trends.debtDelta > 0 ? 'up' : data.trends.debtDelta < 0 ? 'down' : 'neutral'">
                <span x-text="trendArrow(data.trends.debtDelta)" aria-hidden="true"></span>
                <span x-text="trendText(data.trends.debtDelta)"></span>
              </div>
            </template>
          </div>
          <div class="card">
            <div class="card-title">Avg Complexity</div>
            <div class="card-value" x-text="avgComplexity"></div>
          </div>
        </div>

        <div class="chart-row">
          <div class="card">
            <div class="section-title">Code Composition</div>
            <div style="position: relative; height: 220px; width: 100%;">
              <canvas id="compositionChart" aria-label="Code composition doughnut chart"></canvas>
            </div>
          </div>
          <div class="card">
            <div class="section-title">Top Languages</div>
            <div style="position: relative; height: 220px; width: 100%;">
              <canvas id="langPieChart" aria-label="Top languages doughnut chart"></canvas>
            </div>
          </div>
        </div>

        <!-- Largest Files (overview) -->
        <div class="card" style="margin-bottom:24px">
          <div class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Largest Files
          </div>
          <table class="data-table" aria-label="Largest files by size">
            <thead><tr><th scope="col">#</th><th scope="col">File</th><th scope="col">Size</th></tr></thead>
            <tbody>
              <template x-for="f in data.largestFiles" :key="f.rank">
                <tr>
                  <td x-text="f.rank"></td>
                  <td class="path" :title="f.path" x-html="renderPathWithIcon(f.path)"></td>
                  <td x-text="f.size"></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ===== FILES ===== -->
      <div class="section-view" :class="{ active: currentSection === 'files' }">
        <div class="page-header">
          <h1>Files</h1>
        </div>
        <p class="section-tip">Detailed metrics for every scanned file. Sort by <strong>Cleanup Score</strong> to find files that need the most attention. High scores mean the file is large, changes often, or has few comments.</p>
        <div class="card">
          <div class="table-controls">
            <div class="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <!-- Search input now has aria-label -->
              <input
                class="search-input"
                type="search"
                placeholder="Search files…"
                aria-label="Search files by path"
                x-model="fileSearch"
                @input="filePage = 1"
              >
            </div>
            <span style="font-size:13px;color:var(--text-secondary)" x-text="filteredFiles.length + ' files'" aria-live="polite" aria-atomic="true"></span>
          </div>
          <div style="overflow-x:auto">
            <table class="data-table" aria-label="File metrics">
              <thead>
                <tr>
                  <!-- aria-sort on all sortable columns -->
                  <th scope="col"
                    @click="sortFiles('path')"
                    :class="{ sorted: fileSort === 'path' }"
                    :aria-sort="fileSort === 'path' ? (fileSortDir === 1 ? 'ascending' : 'descending') : 'none'">Path</th>
                  <th scope="col"
                    @click="sortFiles('lines')"
                    :class="{ sorted: fileSort === 'lines' }"
                    :aria-sort="fileSort === 'lines' ? (fileSortDir === 1 ? 'ascending' : 'descending') : 'none'">Lines</th>
                  <th scope="col"
                    @click="sortFiles('comments')"
                    :class="{ sorted: fileSort === 'comments' }"
                    :aria-sort="fileSort === 'comments' ? (fileSortDir === 1 ? 'ascending' : 'descending') : 'none'">Comments</th>
                  <th scope="col"
                    @click="sortFiles('blanks')"
                    :class="{ sorted: fileSort === 'blanks' }"
                    :aria-sort="fileSort === 'blanks' ? (fileSortDir === 1 ? 'ascending' : 'descending') : 'none'">Blanks</th>
                  <th scope="col"
                    @click="sortFiles('size')"
                    :class="{ sorted: fileSort === 'size' }"
                    :aria-sort="fileSort === 'size' ? (fileSortDir === 1 ? 'ascending' : 'descending') : 'none'">Size</th>
                  <th scope="col"
                    @click="sortFiles('commits')"
                    :class="{ sorted: fileSort === 'commits' }"
                    :aria-sort="fileSort === 'commits' ? (fileSortDir === 1 ? 'ascending' : 'descending') : 'none'">Commits</th>
                  <th scope="col"
                    @click="sortFiles('debtScore')"
                    :class="{ sorted: fileSort === 'debtScore' }"
                    :aria-sort="fileSort === 'debtScore' ? (fileSortDir === 1 ? 'ascending' : 'descending') : 'none'">Cleanup Score</th>
                  <th scope="col"
                    @click="sortFiles('complexity')"
                    :class="{ sorted: fileSort === 'complexity' }"
                    :aria-sort="fileSort === 'complexity' ? (fileSortDir === 1 ? 'ascending' : 'descending') : 'none'">Complexity</th>
                  <!-- Replaced invalid JSX <> fragments with x-show on each cell -->
                  <th scope="col" x-show="data.gitInsights"
                    @click="sortFiles('topOwner')"
                    :class="{ sorted: fileSort === 'topOwner' }"
                    :aria-sort="fileSort === 'topOwner' ? (fileSortDir === 1 ? 'ascending' : 'descending') : 'none'">Owner</th>
                  <th scope="col" x-show="data.gitInsights"
                    @click="sortFiles('age')"
                    :class="{ sorted: fileSort === 'age' }"
                    :aria-sort="fileSort === 'age' ? (fileSortDir === 1 ? 'ascending' : 'descending') : 'none'">Age</th>
                  <th scope="col" x-show="data.gitInsights">Vol (I/D)</th>
                </tr>
              </thead>
              <tbody>
                <template x-for="f in paginatedFiles" :key="f.path">
                  <tr>
                    <td class="path" :title="f.path" x-html="renderPathWithIcon(f.path)"></td>
                    <td x-text="(f.lines ?? 0).toLocaleString()"></td>
                    <td x-text="(f.comments ?? 0).toLocaleString()"></td>
                    <td x-text="(f.blanks ?? 0).toLocaleString()"></td>
                    <td x-text="f.sizeFormatted || '—'"></td>
                    <td x-text="f.commits ?? '—'"></td>
                    <td class="value--accent" x-text="(f.debtScore ?? 0).toLocaleString()"></td>
                    <td :class="(f.complexity ?? 0) > 10 ? 'value--danger' : (f.complexity ?? 0) > 5 ? 'value--warning' : 'value--muted'" x-text="(f.complexity ?? 0).toLocaleString()"></td>
                    <!-- x-show on individual cells instead of <> fragments -->
                    <td x-show="data.gitInsights" x-text="f.topOwner || '—'"></td>
                    <td x-show="data.gitInsights" x-text="f.age || '—'"></td>
                    <td x-show="data.gitInsights" x-text="f.volatility ? '+' + f.volatility.insertions + ' / -' + f.volatility.deletions : '—'"></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="pagination" role="navigation" aria-label="File table pagination">
            <span x-text="'Page ' + filePage + ' of ' + totalFilePages" aria-live="polite"></span>
            <div class="page-btns">
              <button type="button" class="page-btn" :disabled="filePage <= 1" @click="filePage--" aria-label="Previous page">&larr; Prev</button>
              <button type="button" class="page-btn" :disabled="filePage >= totalFilePages" @click="filePage++" aria-label="Next page">Next &rarr;</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== LANGUAGES ===== -->
      <div class="section-view" :class="{ active: currentSection === 'languages' }">
        <div class="page-header">
          <h1>Languages</h1>
        </div>
        <p class="section-tip">Distribution of programming languages across your codebase, calculated by the number of files and lines of code.</p>
        <div class="chart-row">
          <div class="card">
            <div class="section-title">Distribution</div>
            <div style="position: relative; height: 300px; width: 100%;">
              <canvas id="langBarChart" aria-label="Language distribution bar chart"></canvas>
            </div>
          </div>
          <div class="card">
            <div class="section-title">Breakdown</div>
            <div style="display:flex;flex-direction:column;gap:4px;margin-top:8px" role="list" aria-label="Language breakdown">
              <template x-for="l in data.languages" :key="l.lang">
                <div class="lang-row" role="listitem">
                  <span class="lang-name" x-text="l.lang"></span>
                  <div class="lang-bar-track" role="progressbar" :aria-valuenow="l.pct" aria-valuemin="0" aria-valuemax="100" :aria-label="l.lang + ': ' + l.pct + '%'">
                    <div class="lang-bar-fill" :style="'width:' + l.pct + '%'"></div>
                  </div>
                  <span class="lang-pct" x-text="l.pct + '%'" aria-hidden="true"></span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== CODE HEALTH ===== -->
      <div class="section-view" :class="{ active: currentSection === 'debt' }">
        <div class="page-header">
          <h1>Code Health</h1>
        </div>
        <p class="section-tip">Shows which files need the most cleanup work. The <strong>Cleanup Score</strong> is calculated from file size, how often the file changes, and how many comments it has. <strong>Fix-It Comments</strong> are lines marked with <code>TODO</code>, <code>FIXME</code>, or <code>HACK</code> — explicit notes from developers about work that still needs to be done.</p>
        <div class="stats-grid-3">
          <div class="card">
            <div class="card-title">Cleanup Score</div>
            <div class="card-value value--accent" x-text="(data.summary.techDebtScore ?? 0).toLocaleString()"></div>
          </div>
          <div class="card">
            <div class="card-title">Fix-It Comments</div>
            <div class="card-value" x-text="(data.summary.debtMarkers ?? 0).toLocaleString()"></div>
          </div>
          <div class="card">
            <div class="card-title">Comment Ratio</div>
            <div class="card-value" x-text="(data.summary.codeRatio ?? 0) + '%'"></div>
          </div>
        </div>
        <div class="chart-row-equal">
          <div class="card">
            <div class="section-title">Files Needing Most Cleanup</div>
            <div style="position: relative; height: 260px; width: 100%;">
              <canvas id="debtBarChart" aria-label="Files needing most cleanup bar chart"></canvas>
            </div>
          </div>
          <div class="card">
            <div class="section-title">Files With Fix-It Comments (TODO / FIXME / HACK)</div>
            <table class="data-table" aria-label="Files with fix-it comments">
              <thead><tr><th scope="col">#</th><th scope="col">File</th><th scope="col">Fix-It Comments</th></tr></thead>
              <tbody>
                <template x-for="d in data.debtHotspots" :key="d.rank">
                  <tr>
                    <td x-text="d.rank"></td>
                    <td class="path" :title="d.path" x-text="d.path"></td>
                    <td class="value--danger" x-text="d.count"></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ===== GIT ===== -->
      <div class="section-view" :class="{ active: currentSection === 'git' }">
        <div class="page-header">
          <h1>Git Intelligence</h1>
        </div>
        <p class="section-tip">Insights derived from your version control history. Identifies code ownership, knowledge silos (Bus Factor = 1), stale files, and components with high churn rates.</p>
        <template x-if="data.gitInsights">
          <div>
            <template x-if="data.gitInsights.diffBranch">
              <div class="card info-banner">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--neon)" stroke-width="2" style="width:18px;height:18px;flex-shrink:0" aria-hidden="true"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 009 9"/></svg>
                <span style="font-size:14px;color:var(--text-secondary)">Diff vs <strong x-text="data.gitInsights.diffBranch" style="color:var(--neon)"></strong></span>
              </div>
            </template>

            <!-- Engineering Health -->
            <template x-if="data.gitInsights.staleFilesCount !== undefined || data.gitInsights.knowledgeSilos">
              <div class="stats-grid-3">
                <div class="card">
                  <div class="card-title">Knowledge Silos (BF=1)</div>
                  <!-- Color + text, not color alone -->
                  <div class="card-value"
                       :class="data.gitInsights.knowledgeSilos?.length > 0 ? 'value--danger' : 'value--accent'"
                       x-text="(data.gitInsights.knowledgeSilos?.length || 0) + ' files'"></div>
                  <template x-if="data.gitInsights.knowledgeSilos?.length > 0">
                    <p style="font-size:12px;color:var(--color-danger);margin-top:6px">⚠ Single points of failure</p>
                  </template>
                </div>
                <div class="card">
                  <div class="card-title">Stale Files</div>
                  <div class="card-value"
                       :class="data.gitInsights.staleFilesCount > 0 ? 'value--warning' : 'value--accent'"
                       x-text="(data.gitInsights.staleFilesCount || 0) + ' files'"></div>
                </div>
                <div class="card">
                  <div class="card-title">Suggested Reviewers</div>
                  <div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-top:8px" x-text="data.gitInsights.suggestedReviewers?.map(r => r.name).join(', ') || 'None'"></div>
                </div>
              </div>
            </template>

            <div class="chart-row-equal">
              <div class="card">
                <div class="section-title">Top Contributors</div>
                <div style="position: relative; height: 260px; width: 100%;">
                  <canvas id="authorsChart" aria-label="Top contributors bar chart"></canvas>
                </div>
              </div>
              <div class="card">
                <div class="section-title">High-Churn Files</div>
                <table class="data-table" aria-label="High-churn files">
                  <thead><tr><th scope="col">#</th><th scope="col">File</th><th scope="col">Commits</th></tr></thead>
                  <tbody>
                    <template x-for="f in data.gitInsights?.highChurnFiles ?? []" :key="f.rank">
                      <tr>
                        <td x-text="f.rank"></td>
                        <td class="path" :title="f.path" x-html="renderPathWithIcon(f.path)"></td>
                        <td class="value--accent" x-text="f.commits"></td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>

            <template x-if="data.gitInsights.knowledgeSilos && data.gitInsights.knowledgeSilos.length > 0">
              <div class="card" style="margin-top: 24px;">
                <div class="section-title">Knowledge Silos (Bus Factor = 1)</div>
                <table class="data-table" aria-label="Knowledge silos — files with a single contributor">
                  <thead><tr><th scope="col">File Path</th><th scope="col">Sole Author</th></tr></thead>
                  <tbody>
                    <template x-for="silo in data.gitInsights.knowledgeSilos" :key="silo.filePath">
                      <tr>
                        <td class="path" :title="silo.filePath" x-text="silo.filePath"></td>
                        <td class="value--danger" x-text="silo.author"></td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </template>
          </div>
        </template>
      </div>

      <!-- ===== DEPENDENCIES ===== -->
      <div class="section-view" :class="{ active: currentSection === 'dependencies' }">
        <div class="page-header">
          <h1>Dependencies</h1>
        </div>
        <p class="section-tip">Aggregated list of the most imported external packages across your codebase, helping you track third-party reliance.</p>
        <template x-if="data.topDependencies && data.topDependencies.length > 0">
          <div class="card">
            <div class="section-title">Top External Packages</div>
            <table class="data-table" aria-label="Top external package dependencies">
              <thead><tr><th scope="col">#</th><th scope="col">Package Name</th><th scope="col">Total Imports</th></tr></thead>
              <tbody>
                <template x-for="dep in data.topDependencies" :key="dep.rank">
                  <tr>
                    <td x-text="dep.rank"></td>
                    <td class="path value--accent" x-text="dep.name" style="font-size:14px;font-weight:500;"></td>
                    <td style="font-weight:600" x-text="dep.count"></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </template>
        <template x-if="data.circularDeps && data.circularDeps.length > 0">
          <div class="card" style="margin-top:24px">
            <div class="section-title" style="color:var(--color-danger)">Circular Dependencies (<span x-text="data.circularDeps.length"></span>)</div>
            <template x-for="(cycle, i) in data.circularDeps" :key="i">
              <div style="margin-bottom:12px; padding:12px; background:var(--bg-input); border-radius:8px; border-left:3px solid var(--color-danger)">
                <template x-for="(file, j) in cycle" :key="j">
                  <div style="display:flex;align-items:center;gap:6px">
                    <span class="path value--muted" x-text="file"></span>
                    <span x-show="j < cycle.length - 1" style="color:var(--color-danger)">→</span>
                  </div>
                </template>
              </div>
            </template>
          </div>
        </template>
      </div>
      <div class="section-view" :class="{ active: currentSection === 'trends' }">
        <div class="page-header">
          <h1>Trends</h1>
        </div>
        <p class="section-tip">Track your project's evolution over time. Visualizes how key metrics like total size and cleanup score are changing across different scans.</p>
        <template x-if="data.trends">
          <div>
            <div class="stats-grid-5">
              <template x-for="(t, i) in trendCards" :key="t.label">
                <div class="card">
                  <div class="card-title" x-text="t.label"></div>
                  <div class="card-value" :style="'color:' + t.color + ';font-size:22px'" x-text="t.value"></div>
                </div>
              </template>
            </div>
          </div>
        </template>

        <!-- History Chart -->
        <div class="card" x-show="window.KOUNT_HISTORY && window.KOUNT_HISTORY.length >= 2" style="margin-top: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
            <div class="section-title" style="margin-bottom: 0;">Historical Trends</div>
            <label for="chartMetricSelector" class="visually-hidden">Select metric to chart</label>
            <select id="chartMetricSelector" x-model="trendsMetric" @change="updateTrendsChart" aria-label="Select metric to display" style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border); border-radius: 6px; padding: 6px 12px; font-size: 13px; cursor: pointer; outline: none; font-family: var(--font-sans);">
              <option value="totalFiles">Total Files</option>
              <option value="totalLines">Total Lines of Code</option>
              <option value="techDebtScore">Cleanup Score</option>
              <option value="commentRatio">Comment Ratio (%)</option>
            </select>
          </div>
          <div style="height: 300px; width: 100%;">
            <canvas id="trendsChart" aria-label="Historical trends line chart"></canvas>
          </div>
        </div>

        <!-- Replaced data-lucide (unloaded library) with inline SVG -->
        <div class="card" x-show="!window.KOUNT_HISTORY || window.KOUNT_HISTORY.length < 2" style="margin-top: 24px; text-align: center; padding: 48px 24px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="width: 40px; height: 40px; margin-bottom: 16px; display: inline-block;" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <div class="section-title" style="margin-bottom: 8px; justify-content: center;">Not Enough Data</div>
          <p style="color: var(--text-muted); font-size: 14px; max-width: 400px; margin: 0 auto;">Run KOUNT multiple times to generate historical trend charts.</p>
        </div>
      </div>

      <!-- ===== HELP ===== -->
      <div class="section-view" :class="{ active: currentSection === 'help' }">
        <div class="page-header"><h1>Help</h1></div>
        <p class="section-tip">Complete reference for all KOUNT commands, CLI flags, configuration options, and features.</p>

        <!-- Commands -->
        <div class="card" style="margin-bottom:24px">
          <div class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            Commands
          </div>
          <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px">
            <div style="padding:12px 16px;background:var(--bg-input);border-radius:8px;border-left:3px solid var(--neon)">
              <code style="font-size:14px;font-weight:600">kount</code>
              <p style="font-size:13px;color:var(--text-secondary);margin-top:4px;line-height:1.5">Scan the codebase and output results. Run with no flags to launch the interactive wizard UI.</p>
            </div>
            <div style="padding:12px 16px;background:var(--bg-input);border-radius:8px;border-left:3px solid var(--neon)">
              <code style="font-size:14px;font-weight:600">kount init</code>
              <p style="font-size:13px;color:var(--text-secondary);margin-top:4px;line-height:1.5">Interactive setup wizard. Guides you through creating a <code>.kountrc.json</code> config file. Prompts for output format, test inclusion, git analytics, stale threshold, and quality gates. Safe to re-run — warns before overwriting an existing config.</p>
            </div>
          </div>
        </div>

        <!-- CLI Flags -->
        <div class="card" style="margin-bottom:24px">
          <div class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            CLI Flags
          </div>
          <div style="overflow-x:auto;margin-top:8px">
            <table class="data-table" aria-label="CLI flag reference">
              <thead><tr><th scope="col">Flag</th><th scope="col">Short</th><th scope="col">Default</th><th scope="col">Description</th></tr></thead>
              <tbody>
                <tr><td colspan="4" style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--neon);background:var(--bg-input)">Core</td></tr>
                <tr><td class="path value--accent">--root-dir &lt;path&gt;</td><td>-d</td><td style="color:var(--text-muted)">.</td><td>Root directory to scan</td></tr>
                <tr><td class="path value--accent">--output-mode &lt;mode&gt;</td><td>-o</td><td style="color:var(--text-muted)">terminal</td><td>Output format: <code>terminal</code>, <code>html</code>, <code>markdown</code>, <code>json</code>, <code>csv</code></td></tr>
                <tr><td class="path value--accent">--output &lt;path&gt;</td><td></td><td style="color:var(--text-muted)">auto</td><td>Destination file path for reports</td></tr>
                <tr><td class="path value--accent">--force</td><td>-f</td><td style="color:var(--text-muted)">false</td><td>Force overwrite of the output file</td></tr>
                <tr><td class="path value--accent">--include-tests</td><td>-t</td><td style="color:var(--text-muted)">false</td><td>Include test files and directories in the analysis</td></tr>
                <tr><td class="path value--accent">--version</td><td>-V</td><td></td><td>Print version number</td></tr>
                <tr><td class="path value--accent">--help</td><td>-h</td><td></td><td>Display help text</td></tr>
                <tr><td colspan="4" style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--neon);background:var(--bg-input)">Cache &amp; Ignore</td></tr>
                <tr><td class="path value--accent">--no-cache</td><td></td><td></td><td>Disable the incremental caching engine for this run</td></tr>
                <tr><td class="path value--accent">--clear-cache</td><td></td><td style="color:var(--text-muted)">false</td><td>Purge the existing cache before scanning</td></tr>
                <tr><td class="path value--accent">--no-gitignore</td><td></td><td></td><td>Disable parsing of <code>.gitignore</code> and <code>.kountignore</code> rules</td></tr>
                <tr><td colspan="4" style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--neon);background:var(--bg-input)">Git Intelligence</td></tr>
                <tr><td class="path value--accent">--diff &lt;branch&gt;</td><td></td><td></td><td>Only analyze files changed relative to <code>&lt;branch&gt;</code></td></tr>
                <tr><td class="path value--accent">--deep-git</td><td></td><td style="color:var(--text-muted)">false</td><td>Enable deep analytics: <code>git blame</code> + <code>git numstat</code> (slower on large repos)</td></tr>
                <tr><td class="path value--accent">--stale-threshold &lt;years&gt;</td><td></td><td style="color:var(--text-muted)">2</td><td>Age threshold (years) to classify files as stale</td></tr>
                <tr><td colspan="4" style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--color-danger);background:var(--bg-input)">Quality Gates (CI/CD)</td></tr>
                <tr><td class="path value--accent">--fail-on-size &lt;mb&gt;</td><td></td><td></td><td>Exit code 1 if codebase exceeds <code>&lt;mb&gt;</code> MB</td></tr>
                <tr><td class="path value--accent">--min-comment-ratio &lt;%&gt;</td><td></td><td></td><td>Exit code 1 if comment ratio falls below <code>&lt;%&gt;</code>%</td></tr>
                <tr><td class="path value--accent">--max-complexity &lt;n&gt;</td><td></td><td></td><td>Exit code 1 if any file's cyclomatic complexity exceeds <code>&lt;n&gt;</code></td></tr>
                <tr><td colspan="4" style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--neon);background:var(--bg-input)">Badge</td></tr>
                <tr><td class="path value--accent">--badge &lt;metric&gt;</td><td></td><td></td><td>Generate a Shields.io endpoint JSON for <code>files</code>, <code>lines</code>, <code>comment-ratio</code>, <code>debt-score</code>, or <code>complexity</code></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Output Modes -->
        <div class="card" style="margin-bottom:24px">
          <div class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
            Output Modes
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
            <div style="display:grid;grid-template-columns:100px 1fr;gap:12px;padding:10px 14px;background:var(--bg-input);border-radius:8px;align-items:start">
              <code style="font-weight:700;color:var(--neon)">terminal</code>
              <span style="font-size:13px;color:var(--text-secondary);line-height:1.5">Interactive React/Ink UI with live progress. Shows line breakdown, language distribution, code health, git insights, and trends. <strong style="color:var(--text-primary)">Default.</strong></span>
            </div>
            <div style="display:grid;grid-template-columns:100px 1fr;gap:12px;padding:10px 14px;background:var(--bg-input);border-radius:8px;align-items:start">
              <code style="font-weight:700;color:var(--neon)">html</code>
              <span style="font-size:13px;color:var(--text-secondary);line-height:1.5">Serves this interactive dashboard locally. Sortable file table, charts, dark mode, CSV/JSON export, historical trend charts.</span>
            </div>
            <div style="display:grid;grid-template-columns:100px 1fr;gap:12px;padding:10px 14px;background:var(--bg-input);border-radius:8px;align-items:start">
              <code style="font-weight:700;color:var(--neon)">markdown</code>
              <span style="font-size:13px;color:var(--text-secondary);line-height:1.5">Injects a stats block into your <code>README.md</code> between <code>&lt;!-- KOUNT:START --&gt;</code> and <code>&lt;!-- KOUNT:END --&gt;</code> markers. Subsequent runs update only that block. Use <code>--force</code> to overwrite the entire file. Default output: <code>README.md</code>.</span>
            </div>
            <div style="display:grid;grid-template-columns:100px 1fr;gap:12px;padding:10px 14px;background:var(--bg-input);border-radius:8px;align-items:start">
              <code style="font-weight:700;color:var(--neon)">json</code>
              <span style="font-size:13px;color:var(--text-secondary);line-height:1.5">Machine-readable JSON with summary, per-file metrics, language distribution, git insights, circular deps, and trends. Default output: <code>kount-report.json</code>.</span>
            </div>
            <div style="display:grid;grid-template-columns:100px 1fr;gap:12px;padding:10px 14px;background:var(--bg-input);border-radius:8px;align-items:start">
              <code style="font-weight:700;color:var(--neon)">csv</code>
              <span style="font-size:13px;color:var(--text-secondary);line-height:1.5">Per-file CSV export. Columns: Path, Lines, Blank Lines, Comment Lines, Size, Fix-It Comments, Commits, Cleanup Score, Imports, Age, Bus Factor, Top Owner, Volatility. Default output: <code>kount-report.csv</code>.</span>
            </div>
          </div>
        </div>

        <!-- Quality Gates & Badge -->
        <div class="chart-row-equal">
          <div class="card">
            <div class="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Quality Gates
            </div>
            <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px">Enforce code health in CI/CD. Any failed gate exits with code <code>1</code>.</p>
            <table class="data-table" aria-label="Quality gates reference">
              <thead><tr><th scope="col">Gate</th><th scope="col">Measures</th><th scope="col">Fails When</th></tr></thead>
              <tbody>
                <tr>
                  <td class="path value--accent">--fail-on-size &lt;mb&gt;</td>
                  <td style="font-size:12px;color:var(--text-secondary)">Total codebase size</td>
                  <td style="font-size:12px;color:var(--color-danger)">Size &gt; limit</td>
                </tr>
                <tr>
                  <td class="path value--accent">--min-comment-ratio &lt;%&gt;</td>
                  <td style="font-size:12px;color:var(--text-secondary)">(comments / lines) × 100</td>
                  <td style="font-size:12px;color:var(--color-danger)">Ratio &lt; limit</td>
                </tr>
                <tr>
                  <td class="path value--accent">--max-complexity &lt;n&gt;</td>
                  <td style="font-size:12px;color:var(--text-secondary)">Highest file complexity</td>
                  <td style="font-size:12px;color:var(--color-danger)">Max &gt; limit</td>
                </tr>
              </tbody>
            </table>
            <p style="font-size:12px;color:var(--text-muted);margin-top:12px;line-height:1.5">All gates can also be configured in <code>.kountrc.json</code> via <code>failOnSize</code>, <code>minCommentRatio</code>, and <code>maxComplexity</code>.</p>
          </div>
          <div class="card">
            <div class="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
              Badge Generation
            </div>
            <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px">
              Generate <a href="https://shields.io/endpoint" target="_blank" rel="noopener noreferrer" style="color:var(--neon)">Shields.io</a> endpoint JSON to embed live metrics in your README. Output: <code>.kount-badge.json</code> (customizable via <code>--output</code>).
            </p>
            <table class="data-table" aria-label="Badge metric reference">
              <thead><tr><th scope="col">Metric</th><th scope="col">Label</th><th scope="col">Color</th></tr></thead>
              <tbody>
                <tr>
                  <td class="path value--accent">files</td>
                  <td style="font-size:12px">files</td>
                  <td style="font-size:12px;color:#60cfd1">blue</td>
                </tr>
                <tr>
                  <td class="path value--accent">lines</td>
                  <td style="font-size:12px">lines of code</td>
                  <td style="font-size:12px;color:#60cfd1">blue</td>
                </tr>
                <tr>
                  <td class="path value--accent">comment-ratio</td>
                  <td style="font-size:12px">comment ratio</td>
                  <td style="font-size:12px;color:var(--text-secondary)">green ≥20%, yellow ≥10%, red &lt;10%</td>
                </tr>
                <tr>
                  <td class="path value--accent">debt-score</td>
                  <td style="font-size:12px">cleanup score</td>
                  <td style="font-size:12px;color:var(--text-secondary)">green ≤100, yellow ≤500, red &gt;500</td>
                </tr>
                <tr>
                  <td class="path value--accent">complexity</td>
                  <td style="font-size:12px">complexity</td>
                  <td style="font-size:12px;color:var(--text-secondary)">green ≤5, yellow ≤10, red &gt;10</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Git Intelligence -->
        <div class="card" style="margin-bottom:24px">
          <div class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>
            Git Intelligence
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:8px">
            <div style="padding:12px;background:var(--bg-input);border-radius:8px">
              <div style="font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:6px">Basic (always on)</div>
              <ul style="font-size:12px;color:var(--text-secondary);line-height:1.7;padding-left:16px">
                <li>Top contributors by commits</li>
                <li>High-churn files</li>
                <li>Per-file commit count</li>
              </ul>
            </div>
            <div style="padding:12px;background:var(--bg-input);border-radius:8px">
              <div style="font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:6px"><code>--diff &lt;branch&gt;</code></div>
              <ul style="font-size:12px;color:var(--text-secondary);line-height:1.7;padding-left:16px">
                <li>Limit scan to changed files only</li>
                <li>Ideal for PR/CI analysis</li>
              </ul>
            </div>
            <div style="padding:12px;background:var(--bg-input);border-radius:8px">
              <div style="font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:6px"><code>--deep-git</code></div>
              <ul style="font-size:12px;color:var(--text-secondary);line-height:1.7;padding-left:16px">
                <li>File age (last commit)</li>
                <li>Bus factor per file</li>
                <li>Knowledge silos (BF=1)</li>
                <li>Stale files</li>
                <li>Line volatility (±)</li>
                <li>Top owner per file</li>
                <li>Suggested reviewers</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Configuration + Ignore Files -->
        <div class="chart-row-equal">
          <div class="card">
            <div class="section-title">Configuration (.kountrc.json)</div>
            <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px">
              Create <code>.kountrc.json</code> in your project root to persist settings. CLI flags always take precedence.
            </p>
            <pre style="background:var(--bg-input);padding:14px;border-radius:8px;font-family:var(--font-mono);font-size:12px;color:var(--text-primary);border:1px solid var(--border);overflow-x:auto;line-height:1.6;">{
  "rootDir": ".",
  "outputMode": "terminal",
  "includeTests": false,
  "respectGitignore": true,
  "cache": { "enabled": true, "clearFirst": false },
  "deepGit": false,
  "staleThreshold": 2,
  "diffBranch": "main",
  "failOnSize": 50,
  "minCommentRatio": 10,
  "maxComplexity": 25
}</pre>
          </div>
          <div class="card">
            <div class="section-title">Ignore Files</div>
            <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px">
              KOUNT always ignores <code>node_modules/</code>, <code>dist/</code>, <code>build/</code>, <code>.git/</code>, <code>.next/</code>, <code>.nuxt/</code>, and <code>coverage/</code>. Binary files are automatically skipped.
            </p>
            <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px">
              Your <code>.gitignore</code> is respected by default (<code>--no-gitignore</code> to disable). For KOUNT-specific ignores, create a <code>.kountignore</code> file using standard glob syntax:
            </p>
            <pre style="background:var(--bg-input);padding:14px;border-radius:8px;font-family:var(--font-mono);font-size:12px;color:var(--text-primary);border:1px solid var(--border);overflow-x:auto;line-height:1.6;"># .kountignore
generated/**/*.d.ts
docs/drafts/*.md
vendor/</pre>
            <p style="font-size:12px;color:var(--text-muted);margin-top:12px;line-height:1.5">
              The cache file <code>.kountcache.json</code> and history directory <code>.kount/</code> are always excluded and should not be committed.
            </p>
          </div>
        </div>

        <div class="card" style="margin-top:24px">
          <div class="section-title">About KOUNT</div>
          <p style="font-size:14px;color:var(--text-secondary);line-height:1.7;max-width:800px">
            KOUNT is a zero-dependency codebase analyzer built for developers who care about their craft. It scans your project, tracks code health, measures cyclomatic complexity, detects circular dependencies, analyzes git history, and helps you make data-driven decisions about code quality.
          </p>
          <p style="font-size:13px;color:var(--text-muted);margin-top:12px">
            Built by <strong style="color:var(--text-primary)">Michael Nji</strong> &mdash; <a href="https://michaelnji.codes" target="_blank" rel="noopener noreferrer" style="color:var(--neon);text-decoration:none">michaelnji.codes</a>
          </p>
        </div>
      </div>

    </div>
  </main>

  <!-- Data embedded via JSON script tag — safe, no </script> injection risk -->
  <script type="application/json" id="kount-data">${safeJson}</script>
  <script type="application/json" id="kount-history">${safeHistoryJson}</script>

  <script>
    // Parse from JSON script tags, not raw interpolation into JS context
    window.KOUNT_HISTORY = (() => {
      try {
        return JSON.parse(document.getElementById('kount-history').textContent || '[]');
      } catch (e) {
        console.warn('[KOUNT] Failed to parse history data:', e);
        return [];
      }
    })();

    const iconMap = {
      'html': 'devicon-html5-plain colored',
      'htm': 'devicon-html5-plain colored',
      'css': 'devicon-css3-plain colored',
      'scss': 'devicon-sass-original colored',
      'sass': 'devicon-sass-original colored',
      'less': 'devicon-less-plain-wordmark colored',
      'js': 'devicon-javascript-plain colored',
      'mjs': 'devicon-javascript-plain colored',
      'cjs': 'devicon-javascript-plain colored',
      'jsx': 'devicon-react-original colored',
      'ts': 'devicon-typescript-plain colored',
      'tsx': 'devicon-react-original colored',
      'vue': 'devicon-vuejs-plain colored',
      'svelte': 'devicon-svelte-plain colored',
      'astro': 'devicon-astro-plain colored',
      'elm': 'devicon-elm-plain colored',
      'py': 'devicon-python-plain colored',
      'pyc': 'devicon-python-plain',
      'rb': 'devicon-ruby-plain colored',
      'php': 'devicon-php-plain colored',
      'java': 'devicon-java-plain colored',
      'jar': 'devicon-java-plain colored',
      'cs': 'devicon-csharp-plain colored',
      'fs': 'devicon-fsharp-plain colored',
      'go': 'devicon-go-original-wordmark colored',
      'rs': 'devicon-rust-plain',
      'c': 'devicon-c-plain colored',
      'cpp': 'devicon-cplusplus-plain colored',
      'h': 'devicon-c-plain colored',
      'hpp': 'devicon-cplusplus-plain colored',
      'zig': 'devicon-zig-plain colored',
      'nim': 'devicon-nim-plain colored',
      'swift': 'devicon-swift-plain colored',
      'kt': 'devicon-kotlin-plain colored',
      'kts': 'devicon-kotlin-plain colored',
      'dart': 'devicon-dart-plain colored',
      'm': 'devicon-objectivec-plain colored',
      'sh': 'devicon-bash-plain colored',
      'bash': 'devicon-bash-plain colored',
      'zsh': 'devicon-bash-plain colored',
      'ps1': 'devicon-powershell-plain colored',
      'bat': 'devicon-windows8-original colored',
      'json': 'devicon-json-plain colored',
      'yaml': 'devicon-yaml-plain colored',
      'yml': 'devicon-yaml-plain colored',
      'xml': 'devicon-xml-plain colored',
      'toml': 'devicon-yaml-plain colored',
      'csv': '📊',
      'sql': 'devicon-azuresqldatabase-plain colored',
      'graphql': 'devicon-graphql-plain colored',
      'gql': 'devicon-graphql-plain colored',
      'prisma': 'devicon-prisma-original colored',
      'dockerfile': 'devicon-docker-plain colored',
      'tf': 'devicon-terraform-plain colored',
      'tfvars': 'devicon-terraform-plain colored',
      'nix': 'devicon-nixos-plain colored',
      'scala': 'devicon-scala-plain colored',
      'ex': 'devicon-elixir-plain colored',
      'exs': 'devicon-elixir-plain colored',
      'erl': 'devicon-erlang-plain colored',
      'clj': 'devicon-clojure-line colored',
      'r': 'devicon-r-original colored',
      'jl': 'devicon-julia-plain colored',
      'pl': 'devicon-perl-plain colored',
      'lua': 'devicon-lua-plain colored',
      'sol': 'devicon-solidity-plain colored',
      'md': 'devicon-markdown-original colored',
      'mdx': 'devicon-markdown-original colored',
      'txt': '📄',
      'log': '📋',
      'env': '⚙️',
      'gitignore': '🚫',
      'npmignore': '🚫',
      'lock': '🔒'
    };

    function getFileIcon(filePath) {
      if (!filePath) return '📄';
      const parts = filePath.split('/');
      const fileName = parts[parts.length - 1].toLowerCase();

      if (fileName === 'dockerfile') return iconMap['dockerfile'];
      if (fileName === '.gitignore') return iconMap['gitignore'];
      if (fileName === '.npmignore') return iconMap['npmignore'];
      if (fileName === '.env' || fileName.startsWith('.env.')) return iconMap['env'];
      if (fileName.includes('lock')) return iconMap['lock'];

      const extMatch = fileName.match(/\\.([^.]+)$/);
      if (extMatch && iconMap[extMatch[1]]) return iconMap[extMatch[1]];
      return '📄';
    }

    function renderPathWithIcon(filePath) {
      if (!filePath) return '—';
      const iconClass = getFileIcon(filePath);
      const iconHtml = iconClass.startsWith('devicon-')
        ? \`<i class="\${iconClass}" style="margin-right:8px;font-size:1.1em;vertical-align:middle;" aria-hidden="true"></i>\`
        : \`<span style="margin-right:8px;font-size:1.1em;vertical-align:middle;" aria-hidden="true">\${iconClass}</span>\`;
      // Basic escaping for the path display text
      const safePath = filePath.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return iconHtml + safePath;
    }

    function dashboard() {
      // Parse from the JSON script tag, not raw interpolation
      let raw;
      try {
        raw = JSON.parse(document.getElementById('kount-data').textContent || '{}');
      } catch (e) {
        console.error('[KOUNT] Failed to parse report data:', e);
        raw = { summary: {}, files: [], languages: [], largestFiles: [], debtHotspots: [], highDebtFiles: [] };
      }

      // Check reduced-motion preference before running animations
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      return {
        isLoading: true,
        data: raw,
        currentSection: 'overview',
        sidebarOpen: false,
        isDark: true,
        fileSearch: '',
        filePage: 1,
        fileSort: 'debtScore',
        fileSortDir: -1,
        filesPerPage: 25,
        animatedValues: { files: '0', codeLines: '0', debt: '0' },
        avgComplexity: '0',
        chartsInitialized: {},
        trendsMetric: 'totalFiles',

        init() {
          if (window.__K_FONTS_LOADED__) {
            this.isLoading = false;
          } else {
            document.addEventListener('kount-assets-ready', () => {
              this.isLoading = false;
            });
            // Reduced fallback from 3000ms → 1000ms
            setTimeout(() => { this.isLoading = false; }, 1000);
          }

          const savedTheme = localStorage.getItem('kount-theme');
          if (savedTheme === 'light') {
            this.isDark = false;
            document.documentElement.classList.remove('dark');
          }

          // Skip counter animation if user prefers reduced motion
          if (prefersReducedMotion) {
            this.animatedValues.files = (raw.summary.files || 0).toLocaleString();
            this.animatedValues.codeLines = (raw.summary.codeLines || 0).toLocaleString();
            this.animatedValues.debt = (raw.summary.techDebtScore || 0).toLocaleString();
          } else {
            this.animateValue('files', this.data.summary.files, 600);
            this.animateValue('codeLines', this.data.summary.codeLines, 800);
            this.animateValue('debt', this.data.summary.techDebtScore, 700);
          }

          this.buildFilesList();
          this.avgComplexity = raw.files && raw.files.length > 0
            ? (raw.files.reduce((s, f) => s + (f.complexity || 0), 0) / raw.files.length).toFixed(1)
            : '0';
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
          Object.keys(this.chartsInitialized).forEach(k => {
            if (this.chartsInitialized[k] && typeof this.chartsInitialized[k].destroy === 'function') {
              this.chartsInitialized[k].destroy();
            }
            delete this.chartsInitialized[k];
          });
          if (window._kountTrendsChart) {
            window._kountTrendsChart.destroy();
            window._kountTrendsChart = null;
          }
          setTimeout(() => { this.renderCharts(this.currentSection); }, 50);
        },

        animateValue(key, target, duration) {
          if (typeof target !== 'number') {
            this.animatedValues[key] = String(target || 0);
            return;
          }
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
          // Use CSS variable references via style strings
          const clr = (v, invert) => {
            if (v === 0) return 'var(--text-muted)';
            return (v > 0) === !invert ? 'var(--color-danger)' : 'var(--neon)';
          };
          return [
            { label: 'Files',    value: fmt(t.fileDelta),        color: clr(t.fileDelta) },
            { label: 'Lines',    value: fmt(t.linesDelta),       color: clr(t.linesDelta) },
            { label: 'Size (B)', value: fmt(t.sizeDelta),        color: clr(t.sizeDelta) },
            { label: 'Comment %',value: fmt(t.commentRatioDelta) + '%', color: clr(t.commentRatioDelta, true) },
            { label: 'Debt',     value: fmt(t.debtDelta),        color: clr(t.debtDelta) },
          ];
        },

        /* File table */
        get filteredFiles() {
          let files = this._allFiles || [];
          if (this.fileSearch) {
            const q = this.fileSearch.toLowerCase();
            files = files.filter(f => (f.path || '').toLowerCase().includes(q));
          }
          const dir = this.fileSortDir;
          const key = this.fileSort;
          return [...files].sort((a, b) => {
            if (key === 'path') return dir * (a.path || '').localeCompare(b.path || '');
            return dir * ((a[key] ?? 0) - (b[key] ?? 0));
          });
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
            const header = 'Path,Lines,Comments,Blanks,Size,Fix-It Comments,Commits,Cleanup Score';
            const rows = files.map(f => [
              // Quote CSV fields that may contain commas
              \`"\${(f.path || '').replace(/"/g, '""')}"\`,
              f.lines, f.comments, f.blanks, f.size, f.debt, f.commits, f.debtScore
            ].join(','));
            content = [header, ...rows].join('\\n');
            mime = 'text/csv'; name = 'kount-report.csv';
          }
          const blob = new Blob([content], { type: mime });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(a.href);
        },

        /* Read all chart colors from CSS custom properties — theme-aware */
        _getChartColors() {
          const style = getComputedStyle(document.documentElement);
          const get = (v) => style.getPropertyValue(v).trim();
          return {
            grid: get('--chart-grid'),
            text: get('--text-muted'),
            c1: get('--chart-1'),
            c1a: get('--chart-1-alpha'),
            c2: get('--chart-2'),
            c2a: get('--chart-2-alpha'),
            c3: get('--chart-3'),
            c4: get('--chart-4'),
            c5: get('--chart-5'),
            c6: get('--chart-6'),
            c7: get('--chart-7'),
            c8: get('--chart-8'),
            c9: get('--chart-9'),
            c10: get('--chart-10'),
            danger: get('--color-danger'),
            dangerAlpha: get('--color-danger-alpha'),
            pointBg: get('--chart-point-bg'),
          };
        },

        updateTrendsChart() {
          if (!window._kountTrendsChart) return;
          const chart = window._kountTrendsChart;
          const selector = document.getElementById('chartMetricSelector');
          if (!selector) return;
          const metric = this.trendsMetric;
          const historyData = window.KOUNT_HISTORY || [];
          chart.data.datasets[0].data = historyData.map(entry => entry[metric]);
          chart.data.datasets[0].label = selector.options[selector.selectedIndex].text;
          chart.update();
        },

        renderCharts(section) {
          const c = this._getChartColors();
          const palette = [c.c1, c.c2, c.c3, c.c4, c.c5, c.c6, c.c7, c.c8, c.c9, c.c10];

          if (section === 'overview') {
            if (!this.chartsInitialized.composition) {
              const ctx = document.getElementById('compositionChart');
              if (ctx) {
                this.chartsInitialized.composition = new Chart(ctx, {
                  type: 'doughnut',
                  data: {
                    labels: ['Code', 'Comments', 'Blanks'],
                    datasets: [{
                      data: [
                        this.data.summary.codeLines || 0,
                        this.data.summary.commentLines || 0,
                        this.data.summary.blankLines || 0
                      ],
                      backgroundColor: [c.c1, c.c2, c.c3],
                      borderWidth: 0,
                      hoverOffset: 6
                    }]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { color: c.text, padding: 16, useBorderRadius: true, borderRadius: 4, boxWidth: 10, boxHeight: 10 }
                      }
                    },
                    animation: false
                  }
                });
              }
            }

            if (!this.chartsInitialized.langPie) {
              const ctx2 = document.getElementById('langPieChart');
              if (ctx2 && this.data.languages && this.data.languages.length) {
                this.chartsInitialized.langPie = new Chart(ctx2, {
                  type: 'doughnut',
                  data: {
                    labels: this.data.languages.map(l => l.lang),
                    datasets: [{
                      data: this.data.languages.map(l => l.count),
                      backgroundColor: palette.slice(0, this.data.languages.length),
                      borderWidth: 0,
                      hoverOffset: 6
                    }]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '55%',
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { color: c.text, padding: 12, useBorderRadius: true, borderRadius: 4, boxWidth: 10, boxHeight: 10 }
                      }
                    },
                    animation: false
                  }
                });
              }
            }
          }

          if (section === 'languages' && !this.chartsInitialized.langBar) {
            const ctx = document.getElementById('langBarChart');
            if (ctx && this.data.languages && this.data.languages.length) {
              this.chartsInitialized.langBar = new Chart(ctx, {
                type: 'bar',
                data: {
                  labels: this.data.languages.map(l => l.lang),
                  datasets: [{
                    label: 'Files',
                    data: this.data.languages.map(l => l.count),
                    backgroundColor: c.c1a,
                    borderColor: c.c1,
                    borderWidth: 1,
                    borderRadius: 4,
                    barPercentage: 0.65,
                    maxBarThickness: 28
                  }]
                },
                options: {
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { grid: { color: c.grid }, ticks: { color: c.text } },
                    y: { grid: { display: false }, ticks: { color: c.text } }
                  },
                  plugins: { legend: { display: false } },
                  animation: false
                }
              });
            }
          }

          if (section === 'debt' && !this.chartsInitialized.debtBar) {
            const ctx = document.getElementById('debtBarChart');
            if (ctx && this.data.highDebtFiles && this.data.highDebtFiles.length) {
              const labels = this.data.highDebtFiles.map(f => f.path.split('/').pop());
              this.chartsInitialized.debtBar = new Chart(ctx, {
                type: 'bar',
                data: {
                  labels,
                  datasets: [{
                    label: 'Cleanup Score',
                    data: this.data.highDebtFiles.map(f => f.score),
                    backgroundColor: c.dangerAlpha,
                    borderColor: c.danger,
                    borderWidth: 1,
                    borderRadius: 4,
                    barPercentage: 0.65,
                    maxBarThickness: 28
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { grid: { display: false }, ticks: { color: c.text } },
                    y: { grid: { color: c.grid }, ticks: { color: c.text } }
                  },
                  plugins: { legend: { display: false } },
                  animation: false
                }
              });
            }
          }

          if (section === 'git' && this.data.gitInsights && !this.chartsInitialized.authors) {
            const ctx = document.getElementById('authorsChart');
            if (ctx && this.data.gitInsights.topAuthors && this.data.gitInsights.topAuthors.length) {
              this.chartsInitialized.authors = new Chart(ctx, {
                type: 'bar',
                data: {
                  labels: this.data.gitInsights.topAuthors.map(a => a.name),
                  datasets: [{
                    label: 'Commits',
                    data: this.data.gitInsights.topAuthors.map(a => a.commits),
                    backgroundColor: c.c2a,
                    borderColor: c.c2,
                    borderWidth: 1,
                    borderRadius: 4,
                    barPercentage: 0.65,
                    maxBarThickness: 28
                  }]
                },
                options: {
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { grid: { color: c.grid }, ticks: { color: c.text, precision: 0 } },
                    y: { grid: { display: false }, ticks: { color: c.text } }
                  },
                  plugins: { legend: { display: false } },
                  animation: false
                }
              });
            }
          }

          if (
            section === 'trends' &&
            window.KOUNT_HISTORY &&
            window.KOUNT_HISTORY.length >= 2 &&
            !this.chartsInitialized.trendsLine
          ) {
            const ctx = document.getElementById('trendsChart');
            if (ctx) {
              const historyData = window.KOUNT_HISTORY;
              const labels = historyData.map(entry => {
                const d = new Date(entry.timestamp);
                return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              });
              const selector = document.getElementById('chartMetricSelector');

              window._kountTrendsChart = new Chart(ctx, {
                type: 'line',
                data: {
                  labels,
                  datasets: [{
                    label: selector ? selector.options[selector.selectedIndex].text : 'Total Files',
                    data: historyData.map(entry => entry[this.trendsMetric]),
                    borderColor: c.c1,
                    backgroundColor: c.c1a,
                    borderWidth: 2,
                    pointBackgroundColor: c.pointBg,
                    pointBorderColor: c.c1,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.3
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { grid: { color: c.grid }, ticks: { color: c.text, maxRotation: 45, minRotation: 0 } },
                    y: { grid: { color: c.grid }, ticks: { color: c.text }, beginAtZero: false }
                  },
                  plugins: {
                    legend: { display: true, labels: { color: c.text } },
                    tooltip: { mode: 'index', intersect: false }
                  },
                  animation: false
                }
              });
              this.chartsInitialized.trendsLine = true;
            }
          }
        },
      };
    }
  </script>
</body>
</html>`;
}
