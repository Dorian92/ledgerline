#!/usr/bin/env node
/**
 * Ensures every ./assets/* path referenced in app.config.ts exists (prebuild ENOENT guard).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const configText = fs.readFileSync(path.join(root, 'app.config.ts'), 'utf8');
const paths = [...new Set(configText.match(/\.\/assets\/[\w.-]+/g) ?? [])];

if (paths.length === 0) {
  console.error('No ./assets paths found in app.config.ts');
  process.exit(1);
}

let ok = true;
for (const rel of paths) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`Missing build asset: ${rel} (required by app.config.ts)`);
    ok = false;
  }
}

if (!ok) {
  process.exit(1);
}
