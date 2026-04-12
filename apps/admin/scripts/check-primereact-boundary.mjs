#!/usr/bin/env node
/**
 * Boundary check: ensure no feature or shared code imports directly from primereact/*.
 *
 * Allowed importers (they wrap PrimeReact behind the abstraction boundary):
 *   src/ui/atoms/
 *   src/ui/molecules/
 *   src/ui/commands/
 *   src/app/UiContext.tsx
 *   src/main.tsx
 *
 * Run: node scripts/check-primereact-boundary.mjs
 * Exit 0 = clean, exit 1 = violations found
 */

import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('../src', import.meta.url));

const ALLOWED_PREFIXES = [
  'ui/atoms/',
  'ui/molecules/',
  'ui/commands/',
  'app/UiContext.tsx',
  'main.tsx'
];

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (/\.tsx?$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const allFiles = walk(ROOT);
const violations = [];

for (const file of allFiles) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  if (ALLOWED_PREFIXES.some((prefix) => rel.startsWith(prefix) || rel === prefix)) {
    continue;
  }

  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/from ['"]primereact\//.test(line)) {
      violations.push({ file: rel, line: i + 1, text: line.trim() });
    }
  }
}

if (violations.length === 0) {
  console.log('✓ PrimeReact boundary check passed — no violations found.');
  process.exit(0);
} else {
  console.error(`✗ PrimeReact boundary violations (${violations.length}):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.text}`);
  }
  console.error('\nOnly ui/atoms/, ui/molecules/, ui/commands/, app/UiContext.tsx and main.tsx may import from primereact/*.');
  process.exit(1);
}
