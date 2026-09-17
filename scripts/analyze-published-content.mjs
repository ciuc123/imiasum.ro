import fs from 'node:fs';

const sqlPath = process.argv[2] || 'imiasum.sql';
const sql = fs.readFileSync(sqlPath, 'utf8');

function splitTuples(values) {
  const tuples = [];
  let start = null;
  let depth = 0;
  let quote = false;
  let escape = false;

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
        tuples.push(values.slice(start, i));
        start = null;
      }
    }
  }

  return tuples;
}

function splitFields(tuple) {
  const fields = [];
  let start = 0;
  let quote = false;
  let escape = false;
  let depth = 0;

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

function unquote(value) {
  if (!value || value === 'NULL') return null;

  if (value.startsWith("'") && value.endsWith("'")) {
    return value
      .slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  }

  return value;
}

function decodeHex(value) {
  if (!value?.startsWith('0x')) return value;

  try {
    return Buffer.from(value.slice(2), 'hex').toString('utf8');
  } catch {
    return value;
  }
}

const insertRegex =
  /INSERT\s+INTO\s+`wp_posts`\s*(?:\([^;]*?\))?\s*VALUES\s*/gi;

const inserts = [...sql.matchAll(insertRegex)];

const rows = [];

for (const insert of inserts) {
  const start = insert.index + insert[0].length;

  let quote = false;
  let escape = false;
  let end = -1;

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

    rows.push({
      id: Number(unquote(f[0])),
      date: decodeHex(unquote(f[2])),
      title: unquote(f[5]),
      slug: unquote(f[11]),
      status: unquote(f[7]),
      type: unquote(f[20]),
      mime: unquote(f[21]),
      parent: Number(unquote(f[17])) || 0,
      guid: unquote(f[18])
    });
  }
}

console.log(`Parsed ${rows.length} wp_posts rows.\n`);

const published = rows.filter(
  r => r.status === 'publish'
);

const byType = {};

for (const row of published) {
  byType[row.type] ??= [];
  byType[row.type].push(row);
}

console.log('=== PUBLISHED CONTENT BY TYPE ===');

for (const [type, items] of Object.entries(byType)) {
  console.log(`${type}: ${items.length}`);
}

console.log('\n=== PUBLISHED PAGES ===');

const pages = byType.page || [];

for (const page of pages.sort((a, b) => a.date.localeCompare(b.date))) {
  console.log(
    `${page.id}\t${page.date}\t/${page.slug}/\t${page.title}`
  );
}

console.log(`\nPublished pages: ${pages.length}`);

console.log('\n=== PUBLISHED NON-POST CONTENT ===');

for (const [type, items] of Object.entries(byType)) {
  if (type === 'post' || type === 'page') continue;

  for (const item of items) {
    console.log(
      `${type}\t${item.id}\t${item.date}\t${item.slug}\t${item.title}`
    );
  }
}

console.log('\n=== POSTS WITH SUSPICIOUS RECENT DATES ===');

const cutoff = '2026-07-01';

for (const post of byType.post || []) {
  if (post.date >= cutoff) {
    console.log(
      `${post.id}\t${post.date}\t/${post.slug}/\t${post.title}`
    );
  }
}

console.log('\nDONE');
