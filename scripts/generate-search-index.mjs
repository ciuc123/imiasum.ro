#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Generate a compact search index JSON from src/data/posts.js
const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(root, '..');
const outPath = path.join(repoRoot, 'public', 'search-index.json');

// Import posts via the project's posts.js
const postsModulePath = path.join(repoRoot, 'src', 'data', 'posts.js');
const { posts } = await import('file://' + postsModulePath);

// Create compact entries
const index = posts.map(p => ({
  slug: p.slug,
  title: p.title || '',
  excerpt: p.excerpt || '',
  date: p.date || '',
  // include a small searchable text field (title + excerpt + plain text content)
  content: (p.title || '') + '\n' + (p.excerpt || '') + '\n' + (p.content || '').replace(/<[^>]+>/g, ' ')
}));

await writeFile(outPath, JSON.stringify(index, null, 2) + '\n', 'utf8');
console.log(`Wrote ${index.length} entries to ${outPath}`);

