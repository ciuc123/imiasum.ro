#!/usr/bin/env node

import fs from 'node:fs';

const file = process.argv[2] ?? 'imiasum.sql';

if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
}

const sql = fs.readFileSync(file, 'utf8');

function decodeMysql(value) {
    if (value == null) return null;

    if (
        value.startsWith('0x') &&
        /^[0-9a-f]+$/i.test(value.slice(2)) &&
        value.length % 2 === 0
    ) {
        try {
            return Buffer.from(value.slice(2), 'hex').toString('utf8');
        } catch {}
    }

    return value
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\0/g, '\0');
}

function parseTuple(tuple) {
    const fields = [];
    let field = '';
    let quoted = false;
    let quote = null;
    let escaped = false;

    for (let i = 0; i < tuple.length; i++) {
        const ch = tuple[i];

        if (escaped) {
            field += '\\' + ch;
            escaped = false;
            continue;
        }

        if (quoted && ch === '\\') {
            escaped = true;
            continue;
        }

        if ((ch === "'" || ch === '"') && (!quoted || ch === quote)) {
            if (!quoted) {
                quoted = true;
                quote = ch;
            } else {
                quoted = false;
                quote = null;
            }

            field += ch;
            continue;
        }

        if (ch === ',' && !quoted) {
            fields.push(field.trim());
            field = '';
            continue;
        }

        field += ch;
    }

    fields.push(field.trim());

    return fields.map(value => {
        if (value === 'NULL') return null;

        if (value.startsWith("'") && value.endsWith("'")) {
            return decodeMysql(value.slice(1, -1));
        }

        return decodeMysql(value);
    });
}

function extractTuples(statement) {
    const tuples = [];
    let depth = 0;
    let start = -1;
    let quoted = false;
    let escaped = false;

    for (let i = 0; i < statement.length; i++) {
        const ch = statement[i];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (quoted && ch === '\\') {
            escaped = true;
            continue;
        }

        if (ch === "'") {
            quoted = !quoted;
            continue;
        }

        if (quoted) continue;

        if (ch === '(') {
            if (depth === 0) start = i + 1;
            depth++;
        } else if (ch === ')') {
            depth--;

            if (depth === 0 && start >= 0) {
                tuples.push(statement.slice(start, i));
                start = -1;
            }
        }
    }

    return tuples;
}

// Find INSERT statements specifically for wp_comments.
const insertRegex =
    /INSERT INTO [`']?wp_comments[`']?\s*\([^)]*\)\s*VALUES\s*([\s\S]*?);/gi;

const comments = [];

for (const match of sql.matchAll(insertRegex)) {
    for (const tuple of extractTuples(match[1])) {
        const fields = parseTuple(tuple);

        if (fields.length !== 15) {
            continue;
        }

        comments.push({
            id: Number(fields[0]),
            postId: Number(fields[1]),
            author: fields[2],
            email: fields[3],
            authorUrl: fields[4],
            ip: fields[5],
            date: fields[6],
            dateGmt: fields[7],
            content: fields[8],
            karma: fields[9],
            approved: fields[10],
            agent: fields[11],
            type: fields[12],
            parent: fields[13],
            userId: fields[14],
        });
    }
}

console.log('');
console.log('=== COMMENT SUMMARY ===');
console.log(`Total comments: ${comments.length}`);

const byType = new Map();

for (const comment of comments) {
    const type = comment.type || '(empty)';
    byType.set(type, (byType.get(type) || 0) + 1);
}

for (const [type, count] of [...byType.entries()].sort()) {
    console.log(`${type}: ${count}`);
}

console.log('');
console.log('=== COMMENTS BY YEAR ===');

const byYear = new Map();

for (const comment of comments) {
    const year = String(comment.date).slice(0, 4);
    byYear.set(year, (byYear.get(year) || 0) + 1);
}

for (const [year, count] of [...byYear.entries()].sort()) {
    console.log(`${year}: ${count}`);
}

console.log('');
console.log('=== 2026 PINGBACKS ===');

const pingbacks2026 = comments.filter(
    c => c.type === 'pingback' && String(c.date).startsWith('2026')
);

for (const c of pingbacks2026) {
    console.log('');
    console.log(`ID:        ${c.id}`);
    console.log(`Post ID:   ${c.postId}`);
    console.log(`Date:      ${c.date}`);
    console.log(`Author:    ${c.author}`);
    console.log(`IP:        ${c.ip}`);
    console.log(`URL:       ${c.authorUrl}`);
    console.log(`Approved:  ${c.approved}`);
    console.log(`Agent:     ${c.agent}`);
    console.log(`Content:   ${c.content}`);
}

console.log('');
console.log('=== X-* URLS ===');

const xComments = comments.filter(c => {
    const url = String(c.authorUrl || '');

    return /\/x(?:-\d+)?\/?$/i.test(
        url.replace(/[)\]]+$/, '')
    );
});

for (const c of xComments) {
    console.log('');
    console.log(`ID:        ${c.id}`);
    console.log(`Post ID:   ${c.postId}`);
    console.log(`Date:      ${c.date}`);
    console.log(`Type:      ${c.type}`);
    console.log(`Author:    ${c.author}`);
    console.log(`IP:        ${c.ip}`);
    console.log(`URL:       ${c.authorUrl}`);
    console.log(`Approved:  ${c.approved}`);
    console.log(`Agent:     ${c.agent}`);
    console.log(`Content:   ${c.content}`);
}

console.log('');
console.log('=== XML-RPC COMMENTS ===');

const xmlrpc = comments.filter(c =>
    String(c.agent || '').toLowerCase().includes('xml-rpc')
);

console.log(`Count: ${xmlrpc.length}`);

const xmlrpcByYear = new Map();

for (const c of xmlrpc) {
    const year = String(c.date).slice(0, 4);
    xmlrpcByYear.set(year, (xmlrpcByYear.get(year) || 0) + 1);
}

for (const [year, count] of [...xmlrpcByYear.entries()].sort()) {
    console.log(`${year}: ${count}`);
}

console.log('');
console.log('=== 2026 ACTIVITY FROM 52.11.99.13 ===');

const ip2026 = comments.filter(
    c =>
        c.ip === '52.11.99.13' &&
        String(c.date).startsWith('2026')
);

for (const c of ip2026) {
    console.log(
        `${c.date} | id=${c.id} | type=${c.type} | post=${c.postId} | url=${c.authorUrl} | approved=${c.approved}`
    );
}

console.log('');
console.log('=== DONE ===');
console.log(`Parsed ${comments.length} wp_comments rows.`);