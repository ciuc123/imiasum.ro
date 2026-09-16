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
      if (escape) {
        escape = false;
      } else if (c === '\\') {
        escape = true;
      } else if (c === "'") {
        quote = false;
      }
      continue;
    }

    if (c === "'") {
      quote = true;
    } else if (c === '(') {
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
      if (escape) {
        escape = false;
      } else if (c === '\\') {
        escape = true;
      } else if (c === "'") {
        quote = false;
      }
      continue;
    }

    if (c === "'") {
      quote = true;
    } else if (c === '(') {
      depth++;
    } else if (c === ')') {
      depth--;
    } else if (c === ',' && depth === 0) {
      fields.push(tuple.slice(start, i).trim());
      start = i + 1;
    }
  }

  fields.push(tuple.slice(start).trim());
  return fields;
}

function unquote(value) {
  if (value === 'NULL') return null;

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

const match = sql.match(
  /INSERT\s+INTO\s+`wp_users`\s*(?:\([^)]*\))?\s*VALUES\s*(.*?);/is
);

if (!match) {
  console.error('Could not find wp_users INSERT.');
  process.exit(1);
}

const tuples = splitTuples(match[1]);

console.log(`Found ${tuples.length} wp_users rows.\n`);

for (const tuple of tuples) {
  const f = splitFields(tuple);

  console.log('='.repeat(70));
  console.log(`ID:          ${unquote(f[0])}`);
  console.log(`Username:    ${unquote(f[1])}`);
  console.log(`Email:       ${unquote(f[4])}`);
  console.log(`Registered:  ${unquote(f[6])}`);
  console.log(`Display:     ${unquote(f[9])}`);
}

console.log('\n=== USER ROLES / CAPABILITIES ===\n');

const optionMatch = sql.match(
  /INSERT\s+INTO\s+`wp_usermeta`\s*(?:\([^)]*\))?\s*VALUES\s*(.*?);/is
);

if (!optionMatch) {
  console.log('Could not find wp_usermeta.');
  process.exit(0);
}

const metaRows = splitTuples(optionMatch[1]);

for (const tuple of metaRows) {
  const f = splitFields(tuple);

  const userId = unquote(f[1]);
  const key = unquote(f[2]);
  const value = unquote(f[3]);

  if (
    key?.includes('capabilities') ||
    key?.includes('user_level') ||
    ['28', '29', '30'].includes(userId)
  ) {
    console.log(
      `user=${userId} | ${key} | ${value}`
    );
  }
}

console.log('\nDONE');
