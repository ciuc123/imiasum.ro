import fs from 'node:fs';

const sql = fs.readFileSync(process.argv[2] || 'imiasum.sql', 'utf8');

function splitTuples(values) {
  const out = [];
  let start = null, depth = 0, quote = false, escape = false;

  for (let i = 0; i < values.length; i++) {
    const c = values[i];

    if (quote) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === "'") quote = false;
      continue;
    }

    if (c === "'") quote = true;
    else if (c === '(') {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (c === ')') {
      depth--;
      if (depth === 0 && start !== null) {
        out.push(values.slice(start, i));
        start = null;
      }
    }
  }

  return out;
}

function splitFields(tuple) {
  const fields = [];
  let start = 0, quote = false, escape = false, depth = 0;

  for (let i = 0; i < tuple.length; i++) {
    const c = tuple[i];

    if (quote) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === "'") quote = false;
      continue;
    }

    if (c === "'") quote = true;
    else if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && depth === 0) {
      fields.push(tuple.slice(start, i).trim());
      start = i + 1;
    }
  }

  fields.push(tuple.slice(start).trim());
  return fields;
}

function unquote(v) {
  if (!v || v === 'NULL') return null;

  if (v.startsWith("'") && v.endsWith("'")) {
    return v.slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  }

  return v;
}

function findPostsInsert() {
  const re = /INSERT\s+INTO\s+`wp_posts`\s*(?:\([^;]*?\))?\s*VALUES\s*/gi;
  return [...sql.matchAll(re)];
}

const posts = [];

for (const insert of findPostsInsert()) {
  const start = insert.index + insert[0].length;

  let quote = false, escape = false, end = -1;

  for (let i = start; i < sql.length; i++) {
    const c = sql[i];

    if (quote) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === "'") quote = false;
    } else {
      if (c === "'") quote = true;
      else if (c === ';') {
        end = i;
        break;
      }
    }
  }

  if (end === -1) continue;

  for (const tuple of splitTuples(sql.slice(start, end))) {
    const f = splitFields(tuple);

    if (f.length !== 23) continue;

    const status = unquote(f[7]);
    const type = unquote(f[20]);

    if (status !== 'publish' || type !== 'post') continue;

    posts.push({
      id: unquote(f[0]),
      date: unquote(f[2]),
      title: unquote(f[5]),
      slug: unquote(f[11]),
      content: unquote(f[4]) || ''
    });
  }
}

console.log(`Published posts: ${posts.length}\n`);

const checks = [
  ['SCRIPT TAG', /<\s*script\b/i],
  ['JAVASCRIPT URL', /javascript\s*:/i],
  ['EVENT HANDLER', /\bon(?:error|load|click|mouseover|focus|submit)\s*=/i],
  ['IFRAME', /<\s*iframe\b/i],
  ['OBJECT/EMBED', /<\s*(?:object|embed)\b/i],
  ['FORM', /<\s*form\b/i],
  ['PHP TAG', /<\?(?:php|=)?/i],
  ['EVAL', /\beval\s*\(/i],
  ['BASE64', /\bbase64_decode\s*\(/i],
  ['DATA JAVASCRIPT', /data\s*:\s*text\/html/i],
  ['META REDIRECT', /<\s*meta[^>]+http-equiv\s*=\s*["']?\s*refresh/i]
];

const findings = [];

for (const post of posts) {
  for (const [name, regex] of checks) {
    const match = post.content.match(regex);

    if (match) {
      const index = match.index;

      findings.push({
        ...post,
        check: name,
        context: post.content
          .slice(Math.max(0, index - 180), index + 300)
          .replace(/\s+/g, ' ')
      });
    }
  }
}

console.log(`Potential findings: ${findings.length}\n`);

if (!findings.length) {
  console.log('NO SUSPICIOUS HTML/PHP PATTERNS FOUND IN PUBLISHED POSTS.');
} else {
  for (const f of findings) {
    console.log('='.repeat(80));
    console.log(`ID:      ${f.id}`);
    console.log(`Date:    ${f.date}`);
    console.log(`Slug:    /${f.slug}/`);
    console.log(`Title:   ${f.title}`);
    console.log(`Finding: ${f.check}`);
    console.log(`Context: ${f.context}`);
  }
}

console.log('\n=== POSTS WITH EXTERNAL IFRAMES ===');

for (const post of posts) {
  if (!/<\s*iframe\b/i.test(post.content)) continue;

  const urls = [...post.content.matchAll(
    /<iframe[^>]+src=["']([^"']+)["']/gi
  )].map(m => m[1]);

  console.log(`/${post.slug}/`);
  console.log(`  ${urls.join('\n  ')}`);
}

console.log('\nDONE');
