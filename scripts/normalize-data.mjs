#!/usr/bin/env node

/**
 * Normalize generated WordPress data before an Astro build.
 *
 * WordPress can store a slug as a percent-encoded URL component. Astro's
 * getStaticPaths() expects the decoded route value and encodes it when
 * generating the URL. Keeping the JSON canonical also makes the migration
 * reproducible instead of requiring hand-edits to individual year files.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/data/', import.meta.url));
const files = (await readdir(root))
  .filter((name) => /^\d{4}\.json$/.test(name))
  .sort();

const seen = new Map();
let changed = 0;

for (const file of files) {
  const path = join(root, file);
  const data = JSON.parse(await readFile(path, 'utf8'));
  let fileChanged = false;

  for (const item of data) {
    if (typeof item.slug !== 'string') continue;

    let normalized = item.slug;
    try {
      normalized = decodeURIComponent(item.slug);
    } catch {
      // Leave malformed slugs untouched; report them below rather than
      // silently changing a URL that we cannot decode safely.
      console.warn(`WARN: could not decode slug in ${file}: ${item.slug}`);
    }

    if (normalized !== item.slug) {
      item.slug = normalized;
      fileChanged = true;
      changed++;
    }

    const previous = seen.get(item.slug);
    if (previous) {
      throw new Error(
        `Slug collision after normalization: "${item.slug}" in ${file} ` +
        `conflicts with ${previous}`
      );
    }
    seen.set(item.slug, `${file} (id ${item.id})`);
  }

  if (fileChanged) {
    await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    console.log(`Updated ${file}`);
  }
}

console.log(`Normalized ${changed} slug(s) across ${files.length} year file(s).`);
