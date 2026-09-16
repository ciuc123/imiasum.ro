import fs from 'node:fs';

const sqlPath = process.argv[2] || 'imiasum.sql';
const sql = fs.readFileSync(sqlPath, 'utf8');

function findInsert(table) {
  const re = new RegExp(
    `INSERT\\s+INTO\\s+\`${table}\`\\s*(?:\\([^;]*?\\))?\\s*VALUES\\s*`,
    'ig'
  );

  const matches = [...sql.matchAll(re)];

  if (!matches.length) return null;

  const start = matches[0].index + matches[0][0].length;

  // Find the terminating semicolon, respecting quoted strings.
  let quote = false;
  let escape = false;

  for (let i = start; i < sql.length; i++) {
    const c = sql[i];

    if (quote) {
      if (escape) {
        escape = false;
      } else if (c === '\\') {
        escape = true;
      } else if (c === "'") {
        quote = false;
      }
    } else {
      if (c === "'") {
        quote = true;
      } else if (c === ';') {
        return sql.slice(start, i);
      }
    }
  }

  return null;
}

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

const suspiciousUsers = new Map();

const usersSql = findInsert('wp_users');
if (!usersSql) {
  console.error('wp_users INSERT not found');
  process.exit(1);
}

for (const tuple of splitTuples(usersSql)) {
  const f = splitFields(tuple);
  const id = unquote(f[0]);
  const username = unquote(f[1]);

  if (Number(id) >= 27) {
    suspiciousUsers.set(String(id), username);
  }
}

console.log(`Found ${suspiciousUsers.size} users with ID >= 27.\n`);

const metaSql = findInsert('wp_usermeta');

if (!metaSql) {
  console.error('wp_usermeta INSERT not found');
  process.exit(1);
}

const interesting = new Map();

for (const tuple of splitTuples(metaSql)) {
  const f = splitFields(tuple);

  const userId = unquote(f[1]);
  const metaKey = unquote(f[2]);
  const metaValue = decodeHex(unquote(f[3]));

  if (!suspiciousUsers.has(String(userId))) continue;

  if (
    metaKey?.includes('capabilities') ||
    metaKey?.includes('user_level') ||
    metaKey === 'wp_user_level'
  ) {
    if (!interesting.has(userId)) interesting.set(userId, []);
    interesting.get(userId).push({
      key: metaKey,
      value: metaValue
    });
  }
}

for (const [id, username] of suspiciousUsers) {
  console.log('='.repeat(80));
  console.log(`USER ${id}: ${username}`);

  const rows = interesting.get(id) || [];

  if (!rows.length) {
    console.log('  No capability/user-level metadata found');
    continue;
  }

  for (const row of rows) {
    console.log(`  ${row.key}: ${row.value}`);
  }
}

console.log('\n=== CAPABILITY SUMMARY ===');

const counts = new Map();

for (const rows of interesting.values()) {
  for (const row of rows) {
    const match = row.value?.match(/s:\d+:"([^"]+)";[ib]:[01]/);

    if (match) {
      const role = match[1];
      counts.set(role, (counts.get(role) || 0) + 1);
    }
  }
}

for (const [role, count] of counts) {
  console.log(`${role}: ${count}`);
}

console.log('\nDONE');
