import fs from 'node:fs';

const sqlFile = process.argv[2] || '/mnt/c/repo/imiasum.sql';
const outDir = 'src/data';

const AUTHOR_WHITELIST = new Set([2]);

const sql = fs.readFileSync(sqlFile, 'utf8');

function decodeMysqlString(value) {
  value = value.trim();

  if (value === 'NULL') return null;

  if (/^0x[0-9a-f]+$/i.test(value)) {
    return Buffer.from(value.slice(2), 'hex').toString('utf8');
  }

  if (!(value.startsWith("'") && value.endsWith("'"))) {
    return value;
  }

  const input = value.slice(1, -1);
  let output = '';

  for (let i = 0; i < input.length; i++) {
    const c = input[i];

    if (c !== '\\') {
      output += c;
      continue;
    }

    const next = input[++i];

    switch (next) {
      case '0':
        output += '\0';
        break;
      case 'b':
        output += '\b';
        break;
      case 't':
        output += '\t';
        break;
      case 'n':
        output += '\n';
        break;
      case 'r':
        output += '\r';
        break;
      case 'Z':
        output += '\x1a';
        break;
      case '\\':
        output += '\\';
        break;
      case "'":
        output += "'";
        break;
      case '"':
        output += '"';
        break;
      default:
        // Preserve unknown MySQL escapes.
        output += '\\' + next;
    }
  }

  return output;
}

function splitFields(tuple) {
  const fields = [];
  let start = 0;
  let inQuote = false;
  let escaped = false;

  for (let i = 0; i < tuple.length; i++) {
    const c = tuple[i];

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
      fields.push(tuple.slice(start, i).trim());
      start = i + 1;
    }
  }

  fields.push(tuple.slice(start).trim());

  return fields;
}

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

function parseTable(tableName, expectedFields) {
  const marker = `INSERT INTO \`${tableName}\``;

  const rows = [];
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

        if (fields.length !== expectedFields) {
          continue;
        }

        rows.push(fields.map(decodeMysqlString));
      }
    }

    pos = statementEnd + 1;
  }

  console.log(
    `Parsed ${statements} ${tableName} INSERT statements, ${rows.length} rows.`
  );

  return rows;
}

function normalizeContent(content) {
  if (!content) return '';

  return content
    // Old WordPress uploads -> static-site paths.
    .replace(
      /https?:\/\/(?:www\.)?imiasum\.ro\/(?:wp-content\/)?uploads\//gi,
      '/uploads/'
    )
    // Same-domain HTTP links -> HTTPS.
    .replace(
      /http:\/\/(?:www\.)?imiasum\.ro\//gi,
      'https://imiasum.ro/'
    );
}

const postRows = parseTable('wp_posts', 23);

const posts = [];

for (const row of postRows) {
  const id = Number(row[0]);
  const author = Number(row[1]);
  const date = row[2];
  const content = row[4];
  const title = row[5];
  const excerpt = row[6];
  const status = row[7];
  const slug = row[11];
  const modified = row[14];
  const type = row[20];

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
      content: normalizeContent(content),
    });
  }
}

if (posts.length === 0) {
  throw new Error('No legitimate published posts found.');
}

const postIds = new Set(posts.map(post => post.id));

/*
 * Categories
 */
const termRows = parseTable('wp_terms', 4);
const taxonomyRows = parseTable('wp_term_taxonomy', 6);
const relationshipRows = parseTable('wp_term_relationships', 3);

const termsById = new Map();

for (const row of termRows) {
  termsById.set(Number(row[0]), {
    id: Number(row[0]),
    name: row[1],
    slug: row[2],
  });
}

const categoriesByTaxonomyId = new Map();

for (const row of taxonomyRows) {
  const taxonomyId = Number(row[0]);
  const termId = Number(row[1]);
  const taxonomy = row[2];

  if (taxonomy !== 'category') {
    continue;
  }

  const term = termsById.get(termId);

  if (!term) {
    continue;
  }

  categoriesByTaxonomyId.set(taxonomyId, {
    id: term.id,
    name: term.name,
    slug: term.slug,
    description: row[3] || '',
    parent: Number(row[4]) || 0,
  });
}

const postCategories = new Map();

for (const row of relationshipRows) {
  const postId = Number(row[0]);
  const taxonomyId = Number(row[1]);

  if (!postIds.has(postId)) {
    continue;
  }

  const category = categoriesByTaxonomyId.get(taxonomyId);

  if (!category) {
    continue;
  }

  if (!postCategories.has(postId)) {
    postCategories.set(postId, []);
  }

  const existing = postCategories.get(postId);

  if (!existing.some(item => item.id === category.id)) {
    existing.push(category);
  }
}

for (const post of posts) {
  post.categories = postCategories.get(post.id) || [];
}

/*
 * Write data
 */
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
  yearPosts.sort((a, b) => b.date.localeCompare(a.date));

  fs.writeFileSync(
    `${outDir}/${year}.json`,
    JSON.stringify(yearPosts, null, 2) + '\n'
  );
}

const categories = [...categoriesByTaxonomyId.values()]
  .filter(category =>
    [...postCategories.values()].some(list =>
      list.some(item => item.id === category.id)
    )
  )
  .sort((a, b) => a.name.localeCompare(b.name, 'ro'));

fs.writeFileSync(
  `${outDir}/categories.json`,
  JSON.stringify(categories, null, 2) + '\n'
);

console.log(`\nCLEAN POSTS: ${posts.length}`);
console.log(`CATEGORIES USED BY POSTS: ${categories.length}`);
console.log(`OUTPUT: ${outDir}`);
