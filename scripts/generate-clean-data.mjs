import fs from 'node:fs';

const sqlFile = process.argv[2] || 'imiasum.sql';
const outDir = 'src/data-clean';

const AUTHOR_WHITELIST = new Set([2]);

const sql = fs.readFileSync(sqlFile, 'utf8');

function splitFields(s) {
  const fields = [];
  let start = 0;
  let inQuote = false;
  let escaped = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (inQuote && c === '\\') {
      escaped = true;
      continue;
    }

    if (c === "'") {
      inQuote = !inQuote;
      continue;
    }

    if (!inQuote && c === ',') {
      fields.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }

  fields.push(s.slice(start).trim());
  return fields;
}

function parseValue(v) {
  v = v.trim();

  if (v === 'NULL') return null;

  if (/^0x[0-9a-f]+$/i.test(v)) {
    return Buffer.from(v.slice(2), 'hex').toString('utf8');
  }

  if (v.startsWith("'") && v.endsWith("'")) {
    return v.slice(1, -1)
      .replace(/\\\\/g, '\\')
      .replace(/\\'/g, "'")
      .replace(/\\r/g, '\r')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\0/g, '\0');
  }

  return v;
}

/*
 * Find the end of a SQL statement while respecting quoted strings.
 * This is necessary because post content itself contains semicolons.
 */
function findStatementEnd(sql, start) {
  let inQuote = false;
  let escaped = false;

  for (let i = start; i < sql.length; i++) {
    const c = sql[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (inQuote && c === '\\') {
      escaped = true;
      continue;
    }

    if (c === "'") {
      inQuote = !inQuote;
      continue;
    }

    if (!inQuote && c === ';') {
      return i;
    }
  }

  return -1;
}

function extractTuples(values) {
  const tuples = [];
  let start = null;
  let depth = 0;
  let inQuote = false;
  let escaped = false;

  for (let i = 0; i < values.length; i++) {
    const c = values[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (inQuote && c === '\\') {
      escaped = true;
      continue;
    }

    if (c === "'") {
      inQuote = !inQuote;
      continue;
    }

    if (inQuote) continue;

    if (c === '(') {
      if (depth === 0) {
        start = i + 1;
      }
      depth++;
    }

    if (c === ')') {
      depth--;

      if (depth === 0 && start !== null) {
        tuples.push(values.slice(start, i));
        start = null;
      }
    }
  }

  return tuples;
}

function parsePosts(sql) {
  const posts = [];

  const marker = 'INSERT INTO `wp_posts`';
  let pos = 0;
  let statements = 0;

  while (true) {
    const insertStart = sql.indexOf(marker, pos);

    if (insertStart === -1) {
      break;
    }

    const statementEnd = findStatementEnd(sql, insertStart);

    if (statementEnd === -1) {
      break;
    }

    const statement = sql.slice(insertStart, statementEnd);
    statements++;

    const valuesIndex = statement.indexOf('VALUES');

    if (valuesIndex !== -1) {
      const values = statement.slice(valuesIndex + 'VALUES'.length);

      for (const tuple of extractTuples(values)) {
        const fields = splitFields(tuple);

        if (fields.length !== 23) {
          continue;
        }

        const id = Number(parseValue(fields[0]));
        const author = Number(parseValue(fields[1]));
        const date = parseValue(fields[2]);
        const content = parseValue(fields[4]);
        const title = parseValue(fields[5]);
        const excerpt = parseValue(fields[6]);
        const status = parseValue(fields[7]);
        const slug = parseValue(fields[11]);
        const modified = parseValue(fields[14]);
        const type = parseValue(fields[20]);

        if (
          type === 'post' &&
          status === 'publish' &&
          AUTHOR_WHITELIST.has(author)
        ) {
          posts.push({
            id,
            author,
            date,
            modified,
            slug,
            title,
            excerpt,
            content
          });
        }
      }
    }

    pos = statementEnd + 1;
  }

  console.log(`Parsed ${statements} wp_posts INSERT statements.`);

  return posts;
}

const posts = parsePosts(sql);

if (posts.length === 0) {
  throw new Error('No posts found — refusing to overwrite anything.');
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const byYear = new Map();

for (const post of posts) {
  const year = post.date.slice(0, 4);

  if (!byYear.has(year)) {
    byYear.set(year, []);
  }

  byYear.get(year).push(post);
}

for (const [year, yearPosts] of [...byYear.entries()].sort()) {
  fs.writeFileSync(
    `${outDir}/${year}.json`,
    JSON.stringify(yearPosts, null, 2) + '\n'
  );

  console.log(`${year}: ${yearPosts.length}`);
}

console.log('');
console.log(`CLEAN POSTS: ${posts.length}`);
console.log(`AUTHORS: ${[...new Set(posts.map(p => p.author))].join(', ')}`);
console.log(`OUTPUT: ${outDir}/`);
