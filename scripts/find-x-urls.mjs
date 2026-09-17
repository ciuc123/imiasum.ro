import fs from 'node:fs';

const sqlPath = process.argv[2] || 'imiasum.sql';
const sql = fs.readFileSync(sqlPath, 'utf8');

const regex = /https?:\/\/(?:www\.)?imiasum\.ro\/x(?:-\d+)?\/?|(?:^|[^a-zA-Z0-9])\/x(?:-\d+)?\/?/gi;

const matches = [];
const seen = new Set();

let match;

while ((match = regex.exec(sql)) !== null) {
  let index = match.index;

  // For relative URLs, skip the preceding character captured by the regex.
  if (match[0].startsWith('/') === false && !/^https?:/i.test(match[0])) {
    index += match[0].search(/\/x/i);
  }

  const url = match[0].match(
    /https?:\/\/(?:www\.)?imiasum\.ro\/x(?:-\d+)?\/?|\/x(?:-\d+)?\/?/i
  )?.[0];

  if (!url || seen.has(index)) continue;
  seen.add(index);

  const before = sql.slice(0, index);

  const insertMatches = [...before.matchAll(
    /INSERT\s+INTO\s+[`']?([a-zA-Z0-9_]+)[`']?/gi
  )];

  const table = insertMatches.length
    ? insertMatches[insertMatches.length - 1][1]
    : 'unknown';

  const line = before.split('\n').length;

  const start = Math.max(0, index - 300);
  const end = Math.min(sql.length, index + url.length + 300);

  const context = sql
    .slice(start, end)
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  matches.push({
    index,
    line,
    table,
    url,
    context
  });
}

matches.sort((a, b) => a.index - b.index);

console.log(`Found ${matches.length} /x* URL occurrence(s).\n`);

if (!matches.length) {
  console.log('No /x/, /x-1/, /x-2/, etc. URLs found anywhere in SQL.');
  process.exit(0);
}

for (const [i, item] of matches.entries()) {
  console.log(`=== MATCH ${i + 1} ===`);
  console.log(`URL:    ${item.url}`);
  console.log(`Table:  ${item.table}`);
  console.log(`Line:   ${item.line}`);
  console.log(`Offset: ${item.index}`);
  console.log(`Context:\n${item.context}`);
  console.log();
}

console.log('=== UNIQUE URLS ===');

const uniqueUrls = [...new Set(matches.map(m => m.url))];

for (const url of uniqueUrls) {
  console.log(url);
}

console.log(`\nUnique URLs: ${uniqueUrls.length}`);
console.log('DONE');
