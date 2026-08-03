#!/usr/bin/env node
// Import per-city lounge-benefit research from data/benefits/<city>.json into
// the hotel_benefits Supabase table. Replaces table contents.
//
// Usage: node scripts/import-benefits.js            # all researched cities
//        node scripts/import-benefits.js phnom-penh # one city
//
// Table (create once in the Supabase SQL editor):
//
//   CREATE TABLE hotel_benefits (
//     id SERIAL PRIMARY KEY,
//     hotel_id TEXT NOT NULL,
//     hotel_name TEXT,
//     brand TEXT,
//     city TEXT,
//     city_slug TEXT,
//     country TEXT,
//     status TEXT,
//     on_official_lounge_list BOOLEAN,
//     sells_club_room_category BOOLEAN,
//     has_physical_lounge TEXT,
//     lounge_name TEXT,
//     benefit_type TEXT[],
//     access_basis TEXT,
//     hours JSONB,
//     alcohol TEXT,
//     alcohol_detail TEXT,
//     complimentary TEXT,
//     confidence TEXT,
//     last_verified DATE,
//     notes TEXT,
//     updated_at TIMESTAMPTZ DEFAULT now()
//   );
//   ALTER TABLE hotel_benefits ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "anon_read_benefits" ON hotel_benefits FOR SELECT USING (true);
//   CREATE POLICY "anon_insert_benefits" ON hotel_benefits FOR INSERT WITH CHECK (true);
//
// As with import-hotels.js, the publishable key has no DELETE under RLS. Clear
// with `TRUNCATE hotel_benefits RESTART IDENTITY;` before re-importing.

const SUPABASE_URL = 'https://nkikqvujmhiahryrdgxr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hGaIbHuTdlBiVU1kvZ-sjQ_AvtRwDUR';

const fs = require('fs');
const path = require('path');
const baseDir = path.join(__dirname, '..');
const benefitsDir = path.join(baseDir, 'data/benefits');

const headers = extra => Object.assign({
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`
}, extra || {});

async function count() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/hotel_benefits?select=hotel_id`, {
    headers: headers({ 'Prefer': 'count=exact', 'Range': '0-0' })
  });
  return parseInt((res.headers.get('content-range') || '').split('/')[1], 10) || 0;
}

// Booleans in this schema are tri-state: true, false, or the string "unknown".
// Postgres BOOLEAN cannot hold "unknown", so those columns are TEXT and every
// value is stringified for consistency.
const tri = v => (v === null || v === undefined) ? null : String(v);

function loadCity(slug) {
  const p = path.join(benefitsDir, `${slug}.json`);
  if (!fs.existsSync(p)) throw new Error(`No such city file: ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf8')).map(r => ({
    hotel_id: r.accor_hotel_code,
    hotel_name: r.hotel_name,
    brand: r.brand,
    city: r.city,
    city_slug: slug,
    country: r.country,
    status: r.status,
    on_official_lounge_list: r.on_official_lounge_list === true ? true
      : r.on_official_lounge_list === false ? false : null,
    sells_club_room_category: r.sells_club_room_category === true ? true
      : r.sells_club_room_category === false ? false : null,
    has_physical_lounge: tri(r.has_physical_lounge),
    lounge_name: r.lounge_name,
    benefit_type: Array.isArray(r.benefit_type) ? r.benefit_type
      : (r.benefit_type ? [r.benefit_type] : null),
    access_basis: r.access_basis,
    hours: (r.hours && typeof r.hours === 'object') ? r.hours : { note: tri(r.hours) },
    alcohol: tri(r.alcohol),
    alcohol_detail: r.alcohol_detail || null,
    complimentary: tri(r.complimentary),
    confidence: r.confidence,
    last_verified: r.last_verified,
    notes: r.notes || null
  }));
}

function citySlugs() {
  return fs.readdirSync(benefitsDir)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .map(f => f.replace('.json', ''));
}

async function main() {
  const only = process.argv[2];
  const slugs = only ? [only] : citySlugs();
  if (!slugs.length) throw new Error('No researched cities found in data/benefits/');

  const rows = slugs.flatMap(loadCity);
  console.log(`Cities: ${slugs.join(', ')}`);
  console.log(`Records: ${rows.length}\n`);

  const before = await count();

  // Same RLS trap as import-hotels.js: a forbidden DELETE returns 200 having
  // removed nothing, so verify rather than trusting the status.
  const del = await fetch(`${SUPABASE_URL}/rest/v1/hotel_benefits?id=gt.0`, {
    method: 'DELETE', headers: headers({ 'Prefer': 'return=minimal' })
  });
  if (!del.ok) throw new Error(`DELETE failed: ${del.status} ${await del.text()}`);

  const left = await count();
  if (left > 0) {
    throw new Error(
      `DELETE reported success but ${left} rows remain — the key lacks delete ` +
      `permission under RLS. Aborting before insert to avoid duplicating the ` +
      `table. Run this in the Supabase SQL editor first:\n` +
      `    TRUNCATE hotel_benefits RESTART IDENTITY;`
    );
  }

  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/hotel_benefits`, {
      method: 'POST', headers: headers({ 'Prefer': 'return=minimal' }),
      body: JSON.stringify(batch)
    });
    if (!res.ok) throw new Error(`INSERT failed at ${i}: ${res.status} ${await res.text()}`);
  }

  const after = await count();
  console.log(`hotel_benefits: ${before} -> ${after} rows`);
  if (after !== rows.length) {
    throw new Error(`Expected ${rows.length} rows, found ${after}`);
  }
  console.log('\nDone!');
}

main().catch(e => { console.error('\n' + e.message); process.exit(1); });
