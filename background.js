// background.js — MV3 Service Worker
// Batches price/rate snapshots from content.js and flushes to Supabase REST API.
importScripts('config.js');

const FLUSH_INTERVAL_MS = 30000;
const MAX_BATCH_SIZE = 50;

let userId = null;
let priceBuffer = [];
let rateBuffer = [];
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
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(rows)
  });
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
}

// ==================== MESSAGE HANDLER ====================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PRICE_SNAPSHOT') {
    priceBuffer.push(msg.data);
    scheduleFlush();
    sendResponse({ ok: true });
  } else if (msg.type === 'RATE_SNAPSHOT_BATCH') {
    rateBuffer.push(...msg.data);
    scheduleFlush();
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
  if (priceBuffer.length > 0 || rateBuffer.length > 0) {
    flushToSupabase();
  }
});

ensureUserId();
