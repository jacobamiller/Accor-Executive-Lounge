#!/usr/bin/env node
// Import hotel data from JSON files into Supabase tables.
// Replaces the table contents — existing rows are deleted first, so re-running
// the same month is idempotent rather than duplicating every row.
//
// Usage: node scripts/import-hotels.js [YYYY-MM]
//        (defaults to the newest month present in data/)

const SUPABASE_URL = 'https://nkikqvujmhiahryrdgxr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hGaIbHuTdlBiVU1kvZ-sjQ_AvtRwDUR';

const fs = require('fs');
const path = require('path');
const baseDir = path.join(__dirname, '..');

function headers(extra) {
  return Object.assign({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }, extra || {});
}

function latestMonth(dir) {
  const months = fs.readdirSync(path.join(baseDir, dir))
    .filter(f => /^\d{4}-\d{2}\.json$/.test(f))
    .map(f => f.replace('.json', ''))
    .sort();
  return months[months.length - 1];
}

async function count(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=hotel_id`, {
    headers: headers({ 'Prefer': 'count=exact', 'Range': '0-0' })
  });
  const cr = res.headers.get('content-range') || '';
  return parseInt(cr.split('/')[1], 10) || 0;
}

async function clear(table) {
  // PostgREST requires a filter on DELETE; id > 0 matches every row.
  // Note: under RLS, a DELETE the key isn't allowed to perform still returns
  // 200 having removed nothing — so the status alone proves nothing. Verify by
  // re-counting, and refuse to continue if rows survive. Inserting on top of a
  // failed clear is what silently doubles the table.
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=gt.0`, {
    method: 'DELETE',
    headers: headers({ 'Prefer': 'return=minimal' })
  });
  if (!res.ok) throw new Error(`DELETE ${table} failed: ${res.status} ${await res.text()}`);

  const left = await count(table);
  if (left > 0) {
    throw new Error(
      `DELETE ${table} reported success but ${left} rows remain — the key lacks ` +
      `delete permission under RLS. Aborting before insert to avoid duplicating ` +
      `the table. Clear it from the Supabase SQL editor first:\n` +
      `    TRUNCATE ${table} RESTART IDENTITY;`
    );
  }
}

async function post(table, rows) {
  const batchSize = 200;
  let total = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: headers({ 'Prefer': 'return=minimal' }),
      body: JSON.stringify(batch)
    });
    if (!res.ok) {
      throw new Error(`INSERT ${table} (batch ${i}) failed: ${res.status} ${await res.text()}`);
    }
    total += batch.length;
    process.stdout.write(`\r  ${table}: ${total}/${rows.length} rows`);
  }
  console.log(' ✓');
  return total;
}

async function replace(table, rows) {
  const before = await count(table);
  await clear(table);
  const inserted = await post(table, rows);
  const after = await count(table);
  console.log(`  ${table}: ${before} -> ${after} rows (inserted ${inserted})`);
  if (after !== rows.length) {
    throw new Error(`${table}: expected ${rows.length} rows after import, found ${after}`);
  }
}

async function main() {
  const month = process.argv[2] || latestMonth('data/lounge');
  console.log(`Importing month: ${month}\n`);

  const loungePath = path.join(baseDir, `data/lounge/${month}.json`);
  const bfastPath = path.join(baseDir, `data/breakfast/${month}.json`);
  for (const p of [loungePath, bfastPath]) {
    if (!fs.existsSync(p)) throw new Error(`Missing data file: ${p}`);
  }

  // Lounge — one row per listing, skipping entries with no resolved hotel ID.
  const lounge = JSON.parse(fs.readFileSync(loungePath, 'utf8'));
  const seenLounge = new Set();
  const loungeRows = [];
  for (const h of lounge.hotels) {
    if (!h[4] || seenLounge.has(h[4])) continue;
    seenLounge.add(h[4]);
    loungeRows.push({
      region: h[0], country: h[1], city: h[2], hotel_name: h[3], hotel_id: h[4],
      lounge_policy: h[5], min_age: h[6], policy_notes: h[7], stars: h[8],
      review_score: h[9], review_count: h[10] ? parseInt(h[10]) : null,
      max_child_age: h[11] ? parseInt(h[11]) : null,
      family_friendly: h[12] === 'yes' ? true : h[12] === '' ? null : false,
      key_amenities: h[13]
    });
  }
  console.log('Importing lounge hotels...');
  await replace('lounge_hotels', loungeRows);

  // Breakfast — deduplicated by hotel_id.
  const bfast = JSON.parse(fs.readFileSync(bfastPath, 'utf8'));
  const seen = new Set();
  const bfastRows = [];
  for (const h of bfast.hotels) {
    if (!h[3] || seen.has(h[3])) continue;
    seen.add(h[3]);
    bfastRows.push({
      region: h[0], brand: h[1], hotel_name: h[2], hotel_id: h[3],
      stars: h[4], review_score: h[5],
      review_count: h[6] ? parseInt(h[6]) : null
    });
  }
  console.log('\nImporting breakfast hotels...');
  await replace('breakfast_hotels', bfastRows);

  console.log('\nDone!');
}

main().catch(e => { console.error('\n' + e.message); process.exit(1); });
