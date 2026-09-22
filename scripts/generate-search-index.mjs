#!/usr/bin/env node
import { writeFile, readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Generate a compact search index JSON by reading src/data/*.json directly
const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(root, '..');
const dataDir = path.join(repoRoot, 'src', 'data');
const outPath = path.join(repoRoot, 'public', 'search-index.json');

// If you maintain a set of removed post IDs in src/data/posts.js, mirror them here.
// Keeping this list in sync is required to exclude unpublished/corrupted posts.
const removedPostIds = new Set([4589, 4601, 4618, 4650, 4668, 4682]);

async function loadPostsFromDataDir() {
  const files = await readdir(dataDir);
  const jsonFiles = files.filter(f => /^\d{4}\.json$/.test(f));
  let posts = [];
  for (const fname of jsonFiles) {
    const full = path.join(dataDir, fname);
    try {
      const txt = await readFile(full, 'utf8');
      const arr = JSON.parse(txt);
      if (Array.isArray(arr)) posts = posts.concat(arr);
    } catch (err) {
      console.warn(`Warning: failed to read/parse ${full}: ${err && err.message ? err.message : err}`);
    }
  }
  // filter removed and sort by date desc
  posts = posts.filter(p => !removedPostIds.has(p.id));
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

const posts = await loadPostsFromDataDir();

const index = posts.map(p => ({
  slug: p.slug,
  title: p.title || '',
  excerpt: p.excerpt || '',
  date: p.date || '',
  // include a small searchable text field (title + excerpt + plain text content)
  content: ((p.title || '') + '\n' + (p.excerpt || '') + '\n' + (p.content || '')).replace(/<[^>]+>/g, ' ')
}));

await writeFile(outPath, JSON.stringify(index, null, 2) + '\n', 'utf8');
console.log(`Wrote ${index.length} entries to ${outPath}`);

