# Resilience and Failure Modes

How the extension breaks when Accor changes their site, and what design choices make it less fragile. Started after the 2026-05 outage. Update this doc whenever a new failure mode is found.

---

## The 2026-05 incident — what broke and why

Three independent issues compounded into a confusing "nothing works" state. Untangling them took ~6 hours of debugging.

### 1. Detail-page room selector matched 137 unrelated elements

**Symptom:** "Show All Rates" panels disappeared from hotel detail pages. The `injectAllRatePanels()` log fired but produced zero panels.

**Cause:** Accor renamed the room container class from `hotel-accommodation` (singular) to `hotel-accommodations-offers__item` (plural). The `ROOM_SELECTORS` fallback list had `[class*="accommodation"]` listed *before* `[class*="hotel-offer"]`. The broader selector now matched 137 unrelated wrappers/children, `findRoomsSelector()` cached that result, and the real 11 room elements (still carrying the `hotel-offer-XXXX` class) were never iterated.

**Fix (commit `463a705`):** Reorder `ROOM_SELECTORS` to put the narrow, offer-identifying selector first. Also removed the cache in `findRoomsSelector` so an early call (before offer elements render) can't lock in a wrong fallback.

### 2. Apollo's normalized cache was emptied

**Symptom:** Even after the selector fix, every `BestOfferInfo:<id>` lookup returned undefined. `gp.$apolloProvider.defaultClient.cache.extract()` returned `{}` while the page rendered 11 rooms with prices.

**Cause:** Accor stopped storing offer entities in Apollo's normalized cache. Probable mechanism: `fetchPolicy: 'no-cache'` on the offer query, or migration to a different state container that bypasses Apollo entirely. The same data still flowed through `HotelPageHot` and `HotelPageCold` GraphQL responses — it just wasn't being normalized.

**Fix (commit `4d7de33`):** Intercept the `HotelPageHot` (live pricing) and `HotelPageCold` (room metadata) responses in `page-bridge.js` and build a *synthetic cache* keyed by `BestOfferInfo:<id>`. `tryExtractCache` now merges this synthetic data into whatever Apollo returns (typically empty) before dispatching. The rest of the rendering pipeline (`getOffersForRoom`, `buildRatePanel`) stays unchanged because the synthetic entries match the same shape Apollo used to store.

### 3. Supabase project auto-paused

**Symptom:** Popup showed "No data found" for price history. New captures silently disappeared.

**Cause:** Supabase free-tier projects pause after **7 days of inactivity**. Once paused, all REST requests fail with `ERR_CONNECTION_CLOSED`. The "Failed to fetch" suppression in `page-bridge.js` (commit `1aedc65`) made this even quieter — those errors were the symptom of writes being rejected.

**Fix:** User-driven — restore via Supabase dashboard. Follow-ups tracked: weekly ping cron, popup unreachable warning (see "Planned health checks" below).

---

## What survived vs. what broke

| Layer | Stability |
|-------|-----------|
| GraphQL operation names (`HotelPageCold`, `HotelPageHot`, `Calendar`) | Survived — same names for >6 months |
| GraphQL response shapes (`BestOfferInfo` field structure, `data.hotel.accommodations[]`) | Survived — same fields/types after the cache layer change |
| Search-page DOM (`div.result-list-item[data-hotel-id]`, `.offer-price__amount`, `.stay-details__formatted-tax-type`, `.pricing-type-label`) | Survived |
| Detail-page DOM classes | **Broke** — `.hotel-accommodation` → `.hotel-accommodations-offers__item` |
| Apollo `$apolloProvider` resolution path | Survived |
| Apollo cache *contents* for offers | **Broke** — same path resolves but the cache no longer holds offer entities |

**Pattern:** the network contract (GraphQL operation names + response shapes) is the most stable interface Accor exposes. DOM classnames and internal state stores are the most fragile.

---

## Design principles for resilience

1. **Prefer network contracts over DOM contracts.** GraphQL operation names and JSON response shapes change less often than CSS class names or internal state stores. When a feature can be powered by intercepting `window.fetch`, do that instead of scraping DOM or reading Vue/Apollo internals.

2. **Fail loudly, not silently.** A selector returning zero matches is a bug, not a quiet skip. A `sendMessage` that throws "Extension context invalidated" is data loss, not noise. Surface these as visible warnings, not muted `dbg()` calls. The `safeSendMessage` helper (`content.js`) and the "site changed" popup banner (task #14) both follow this principle.

3. **Multiple fallback selectors, ordered narrowest-first.** When DOM scraping is unavoidable, list selectors from most-specific to most-permissive. Re-evaluate each call — don't cache the first match, because it may have been a too-broad fallback that matched before the real elements rendered.

4. **`document_start` for any script that intercepts page fetches.** `document_idle` is too late — the page's early requests already completed before the wrapper installed. (Manifest config for `page-bridge.js`.)

5. **Don't trust internal state stores when network responses contain the same data.** Apollo's normalized cache is convenient but Accor's choice. The raw GraphQL response is more durable: it's the contract between their frontend and backend, and they can't easily move it without breaking themselves.

6. **Surface silent feature health.** Visible features (badges, panels) self-report when broken because the user sees the missing UI. Background features (snapshot capture, Supabase writes) need explicit health probes — see task #14.

---

## Planned health checks (task #14)

Health probe runs once per Accor page load, checks the assumptions below, and writes any failure to `chrome.storage.local` under a known key. The popup reads that key on open and renders a yellow banner: *"⚠️ Detected possible Accor change in `<failedCheck>` on `<date>`. Some features may be broken until the extension is updated."*

Initial checks to wire up:

| Check | Condition | Page |
|-------|-----------|------|
| Room markers present | `[class*="hotel-offer-"]` matches > 0 elements | Detail (`/hotel/<id>`) |
| Synthetic cache populated | `window.__accorExtSyntheticCache` has ≥1 `BestOfferInfo:` key within 5 seconds of page load | Detail |
| Search-card parse succeeds | `parsePriceData()` returns non-null for ≥1 of the visible cards | Search (`/hotels/<city>`) |
| Supabase reachable | Popup's first fetch returns HTTP 2xx (not connection-closed, not 4xx/5xx) | Popup load |
| GraphQL ops still named the same | At least one of `HotelPageHot`, `BestOffers`, `Calendar` fires within 10s of page load | Any |

Implementation notes:
- Single failure ≠ broken: many checks have flaky baselines (e.g., user navigates away before HotelPageHot fires). Require N consecutive failures or a `total_failures / total_attempts` ratio over a threshold before showing the banner.
- Banner should have a "Dismiss for this session" button and a "Snooze 24h" button to avoid annoying the user during known-broken windows.

---

## Quick-reference: where to look when X breaks

| Symptom | Most likely cause | First place to check |
|---------|-------------------|----------------------|
| Popup shows "No data found" but you've been browsing | Supabase paused; or userId mismatch | Supabase dashboard for pause status; then `chrome.storage.local.get('accorUserId')` |
| Rate panels missing on detail page | Synthetic-cache ingestion isn't firing | Console for `[AccorExt] ingested N offers from HotelPageHot` |
| Tax-inclusive prices missing on search cards | `parsePriceData()` sub-selectors broken | Re-enable `DEBUG=true` and look for `dbg('No tax data ...')` |
| Calendar tab empty | Calendar response interception not firing, or rows missing in `calendar_snapshots` table | Console for `[AccorExt] Calendar response keys:` |
| Everything broken on already-open tabs after extension reload | Content scripts orphaned ("Extension context invalidated") | Close tab and reopen; `safeSendMessage` warns once when this happens |
| GraphQL ops still firing but synth cache empty | Response shape changed (`data.hotelOffers.offersSelection.offers` moved) | Add a one-shot `console.log(json)` to `ingestHotelPageHot` and inspect |
