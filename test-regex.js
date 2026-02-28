const ES6_IMPORT_RE = /import\s+(?:.*?\s+from\s+)?['"]([^.'"/][^'"]*)['"]/g;
const lines = [
  "import { exec } from 'node:child_process';",
  "import http from 'node:http';",
  "import path from 'node:path';",
  "import type { ProjectStats } from '../plugins/types.js';",
  "import { getHistory } from '../state/history.js';",
  "import { buildHtmlTemplate } from './html-template.js';"
];
for (const line of lines) {
  ES6_IMPORT_RE.lastIndex = 0;
  let match;
  while ((match = ES6_IMPORT_RE.exec(line)) !== null) {
    console.log(match[1]);
  }
}
