// background.js — MV3 Service Worker
// Batches price/rate snapshots from content.js and flushes to Supabase REST API.
importScripts('config.js');

const FLUSH_INTERVAL_MS = 30000;
const MAX_BATCH_SIZE = 50;

let userId = null;
let priceBuffer = [];
let rateBuffer = [];
let calendarBuffer = [];
let flushTimer = null;

// ==================== USER ID ====================
async function ensureUserId() {
  if (userId) return userId;
  const result = await chrome.storage.local.get('accorUserId');
  if (result.accorUserId) {
    userId = result.accorUserId;
  } else {
    userId = crypto.randomUUID();
    await chrome.storage.local.set({ accorUserId: userId });
  }
  return userId;
}

// ==================== SUPABASE REST API ====================
async function postToSupabase(table, rows) {
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(rows)
    });
  } catch (e) {
    // Network failure — Supabase project paused/unreachable, or offline. Treat
    // as a recoverable flush failure (callers buffer + retry) instead of letting
    // it bubble up as an uncaught "Failed to fetch" rejection.
    console.warn(`[Supabase] ${table} flush network error (project paused?):`, e && e.message ? e.message : e);
    return false;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn(`[Supabase] ${table} flush failed (${res.status}):`, text);
    return false;
  }
  return true;
}

async function flushToSupabase() {
  const uid = await ensureUserId();

  if (priceBuffer.length > 0) {
    const batch = priceBuffer.splice(0, MAX_BATCH_SIZE);
    const rows = batch.map(row => ({ ...row, user_id: uid }));
    const ok = await postToSupabase('price_snapshots', rows).catch(() => false);
    if (!ok) priceBuffer.unshift(...batch);
  }

  if (rateBuffer.length > 0) {
    const batch = rateBuffer.splice(0, MAX_BATCH_SIZE);
    const rows = batch.map(row => ({ ...row, user_id: uid }));
    const ok = await postToSupabase('rate_snapshots', rows).catch(() => false);
    if (!ok) rateBuffer.unshift(...batch);
  }

  if (calendarBuffer.length > 0) {
    console.log('[AccorExt] bg: flushing', calendarBuffer.length, 'calendar retries to Supabase');
    const batch = calendarBuffer.splice(0, MAX_BATCH_SIZE);
    const rows = batch.map(row => ({ ...row, user_id: uid }));
    const ok = await postToSupabase('calendar_snapshots', rows).catch(() => false);
    if (!ok) calendarBuffer.unshift(...batch);
  }
}

// ==================== MESSAGE HANDLER ====================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PRICE_SNAPSHOT') {
    priceBuffer.push(msg.data);
    scheduleFlush();
    sendResponse({ ok: true });
  } else if (msg.type === 'RATE_SNAPSHOT') {
    rateBuffer.push(msg.data);
    scheduleFlush();
    sendResponse({ ok: true });
  } else if (msg.type === 'CALENDAR_SNAPSHOT') {
    console.log('[AccorExt] bg: calendar snapshot received, hotel:', msg.data.hotel_id, 'entries:', msg.data.calendar_data ? msg.data.calendar_data.length : 0);
    // Flush calendar immediately — don't risk service worker dying before the 30s timer
    ensureUserId().then(uid => {
      const row = { ...msg.data, user_id: uid };
      console.log('[AccorExt] bg: flushing calendar to Supabase now...');
      return postToSupabase('calendar_snapshots', [row]).then(ok => {
        console.log('[AccorExt] bg: calendar flush', ok ? 'OK' : 'FAILED');
        if (!ok) {
          calendarBuffer.push(msg.data);
          scheduleFlush();
        }
      });
    }).catch(e => {
      // Last-resort guard so a rejection here never surfaces as uncaught.
      console.warn('[AccorExt] bg: calendar flush error, will retry:', e);
      calendarBuffer.push(msg.data);
      scheduleFlush();
    });
    sendResponse({ ok: true });
  }
  return false;
});

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushToSupabase();
  }, FLUSH_INTERVAL_MS);
}

// Flush before service worker goes idle
chrome.runtime.onSuspend && chrome.runtime.onSuspend.addListener(() => {
  if (priceBuffer.length > 0 || rateBuffer.length > 0 || calendarBuffer.length > 0) {
    flushToSupabase();
  }
});

// ==================== HOTEL DATA SYNC ====================
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function fetchHotelIds(table, idColumn) {
  const ids = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=${idColumn}&${idColumn}=not.is.null&offset=${offset}&limit=${limit}`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    if (!res.ok) break;
    const rows = await res.json();
    if (rows.length === 0) break;
    for (const r of rows) if (r[idColumn]) ids.push(r[idColumn]);
    offset += limit;
    if (rows.length < limit) break;
  }
  return ids;
}

// Full benefit records, keyed by hotel_id. Unlike the ID lists these carry
// detail (hours, access basis, confidence) that the detail panel renders.
// Only the columns the badge and detail panel actually render. SELECT * also
// pulls hotel_name, brand, city, country, status and the research bookkeeping
// fields, which nothing on the page reads — about 23% of the payload wasted on
// every sync.
const BENEFIT_COLUMNS = [
  'hotel_id', 'city_slug', 'lounge_name', 'benefit_type', 'access_basis',
  'hours', 'alcohol', 'alcohol_detail', 'complimentary', 'confidence',
  'on_official_lounge_list', 'last_verified', 'notes'
].join(',');

async function fetchBenefits() {
  const rows = [];
  const limit = 1000;
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/hotel_benefits?select=${BENEFIT_COLUMNS}&order=hotel_id&offset=${offset}&limit=${limit}`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    if (!res.ok) throw new Error(`hotel_benefits ${res.status}`);
    const page = await res.json();
    if (page.length === 0) break;
    rows.push(...page);
    offset += limit;
    if (page.length < limit) break;
  }
  const byHotel = {};
  const cities = {};
  for (const r of rows) {
    if (r.hotel_id) byHotel[r.hotel_id] = r;
    if (r.city_slug) cities[r.city_slug] = (cities[r.city_slug] || 0) + 1;
  }
  return { byHotel, cities };
}

async function syncHotelData() {
  try {
    const loungeIds = await fetchHotelIds('lounge_hotels', 'hotel_id');
    const breakfastIds = await fetchHotelIds('breakfast_hotels', 'hotel_id');
    if (loungeIds.length > 0 || breakfastIds.length > 0) {
      await chrome.storage.local.set({
        accorLoungeIds: loungeIds,
        accorBreakfastIds: breakfastIds,
        accorHotelSyncTime: Date.now()
      });
    }
  } catch (e) {
    console.warn('[Supabase] Hotel data sync failed:', e);
  }

  // Benefits are optional — the table may not exist yet. A failure here must
  // not take down the lounge/breakfast sync above, which is the core feature.
  try {
    const { byHotel, cities } = await fetchBenefits();
    if (Object.keys(byHotel).length > 0) {
      await chrome.storage.local.set({
        accorBenefits: byHotel,
        accorBenefitCities: cities
      });
    }
  } catch (e) {
    console.warn('[Supabase] Benefit data sync failed (table may not exist yet):', e);
  }
}

async function syncIfNeeded() {
  const result = await chrome.storage.local.get('accorHotelSyncTime');
  const lastSync = result.accorHotelSyncTime || 0;
  if (Date.now() - lastSync > SYNC_INTERVAL_MS) {
    syncHotelData();
  }
}

// Respond to content.js requesting hotel data
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_HOTEL_DATA') {
    chrome.storage.local.get([
      'accorLoungeIds', 'accorBreakfastIds', 'accorBenefits', 'accorBenefitCities'
    ]).then(result => {
      sendResponse({
        loungeIds: result.accorLoungeIds || null,
        breakfastIds: result.accorBreakfastIds || null,
        benefits: result.accorBenefits || null,
        benefitCities: result.accorBenefitCities || null
      });
    });
    return true; // async response
  }
});

ensureUserId();

// Was syncHotelData() — an unconditional full pull on every service worker
// startup. Under MV3 the worker spins down after ~30s idle and restarts on the
// next event, so that fired dozens of times a day rather than once per reload,
// and syncIfNeeded()'s 24h guard was dead code. The hotel lists change monthly,
// so a day-old cache is fine and this cuts Supabase egress by roughly 20x.
// To force a refresh, clear accorHotelSyncTime from chrome.storage.local.
syncIfNeeded();
