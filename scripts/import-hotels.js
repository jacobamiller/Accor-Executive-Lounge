#!/usr/bin/env node
// Import hotel data from JSON files into Supabase tables.
// Usage: node scripts/import-hotels.js

const SUPABASE_URL = 'https://nkikqvujmhiahryrdgxr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hGaIbHuTdlBiVU1kvZ-sjQ_AvtRwDUR';

async function post(table, rows) {
  const batchSize = 200;
  let total = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(batch)
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`Error inserting into ${table} (batch ${i}):`, res.status, text);
      return;
    }
    total += batch.length;
    process.stdout.write(`\r  ${table}: ${total}/${rows.length} rows`);
  }
  console.log(` ✓`);
}

async function main() {
  const fs = require('fs');
  const path = require('path');
  const baseDir = path.join(__dirname, '..');

  // Import lounge hotels
  console.log('Importing lounge hotels...');
  const lounge = JSON.parse(fs.readFileSync(path.join(baseDir, 'data/lounge/2026-02.json'), 'utf8'));
  const loungeRows = lounge.hotels.map(h => ({
    region: h[0], country: h[1], city: h[2], hotel_name: h[3], hotel_id: h[4],
    lounge_policy: h[5], min_age: h[6], policy_notes: h[7], stars: h[8],
    review_score: h[9], review_count: h[10] ? parseInt(h[10]) : null,
    max_child_age: h[11] ? parseInt(h[11]) : null,
    family_friendly: h[12] === 'yes' ? true : h[12] === '' ? null : false,
    key_amenities: h[13]
  }));
  await post('lounge_hotels', loungeRows);

  // Import breakfast hotels (deduplicate by hotel_id)
  console.log('Importing breakfast hotels...');
  const bfast = JSON.parse(fs.readFileSync(path.join(baseDir, 'data/breakfast/2026-03.json'), 'utf8'));
  const seen = new Set();
  const bfastRows = [];
  for (const h of bfast.hotels) {
    if (h[3] && !seen.has(h[3])) {
      seen.add(h[3]);
      bfastRows.push({
        region: h[0], brand: h[1], hotel_name: h[2], hotel_id: h[3],
        stars: h[4], review_score: h[5],
        review_count: h[6] ? parseInt(h[6]) : null
      });
    }
  }
  await post('breakfast_hotels', bfastRows);

  console.log('Done!');
}

main().catch(console.error);
