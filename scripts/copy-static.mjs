#!/usr/bin/env node
/** Vite 빌드 후 런타임 정적 파일을 dist로 복사한다. */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
mkdirSync(dist, { recursive: true });

const dirs = ['Assets', 'pages', 'vendor', 'lib'];
const files = [
  'ads.txt',
  'sw.js',
  'site.webmanifest',
  'firebase-config.js',
  'googled4953dfc14e97aa9.html',
];

for (const name of dirs) {
  const from = join(root, name);
  if (!existsSync(from)) {
    console.warn('[copy-static] skip missing dir', name);
    continue;
  }
  cpSync(from, join(dist, name), { recursive: true });
}

for (const name of files) {
  const from = join(root, name);
  if (!existsSync(from)) {
    console.warn('[copy-static] skip missing file', name);
    continue;
  }
  cpSync(from, join(dist, name));
}

console.log('[copy-static] copied static assets into dist/');
