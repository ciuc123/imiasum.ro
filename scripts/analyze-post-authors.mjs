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

function findInserts() {
  return [...sql.matchAll(
    /INSERT\s+INTO\s+`wp_posts`\s*(?:\([^;]*?\))?\s*VALUES\s*/gi
  )];
}

const posts = [];

for (const insert of findInserts()) {
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

    if (unquote(f[7]) !== 'publish') continue;
    if (unquote(f[20]) !== 'post') continue;

    posts.push({
      id: Number(unquote(f[0])),
      author: Number(unquote(f[1])),
      date: unquote(f[2]),
      title: unquote(f[5]),
      slug: unquote(f[11])
    });
  }
}

const authorCounts = new Map();

for (const post of posts) {
  authorCounts.set(
    post.author,
    (authorCounts.get(post.author) || 0) + 1
  );
}

console.log(`Published posts: ${posts.length}\n`);

console.log('=== POSTS BY AUTHOR ID ===');

for (const [author, count] of [...authorCounts.entries()].sort((a,b) => a[0] - b[0])) {
  console.log(`author ${author}: ${count}`);
}

console.log('\n=== POSTS BY NON-LEGITIMATE AUTHOR (ID >= 27) ===');

const suspicious = posts.filter(p => p.author >= 27);

if (!suspicious.length) {
  console.log('NONE');
} else {
  for (const post of suspicious) {
    console.log(
      `${post.id}\tauthor=${post.author}\t${post.date}\t/${post.slug}/\t${post.title}`
    );
  }
}

console.log('\n=== POSTS BY LEGITIMATE AUTHORS (1, 2, 4) ===');

const legitimate = posts.filter(p =>
  [1, 2, 4].includes(p.author)
);

console.log(`Count: ${legitimate.length}`);

for (const post of legitimate) {
  console.log(
    `${post.id}\tauthor=${post.author}\t${post.date}\t/${post.slug}/\t${post.title}`
  );
}

console.log('\nDONE');
