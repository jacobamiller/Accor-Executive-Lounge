// Accor Executive Lounge Highlighter - content.js v2.0 Global
// Highlights hotel cards with an Executive Lounge with a thick red border.
// Hotel IDs populated from monthly lounge extraction data.
// Run the "Extract All Lounge Hotels" bookmarklet to get updated IDs.

const EXECUTIVE_LOUNGE_HOTEL_IDS = new Set([
  // ===== ASIA — Vietnam (13 hotels — verified) =====
  '7821',  // Grand Mercure Danang
  '8287',  // Novotel Danang Premier Han River
  'B4G6',  // Movenpick Hotel Hanoi Centre
  '9183',  // Mercure Hai Phong
  'B4S6',  // Pullman Hai Phong Grand Hotel
  '7579',  // Pullman Hanoi
  '1555',  // Sofitel Legend Metropole Hanoi
  '9231',  // Hotel des Arts Saigon - MGallery Collection
  '7965',  // Novotel Saigon Centre
  '7489',  // Pullman Saigon Centre
  '2077',  // Sofitel Saigon Plaza
  'B6Y9',  // Movenpick Resort Phan Thiet
  '7133',  // Pullman Vung Tau

  // ===== REMAINING GLOBAL IDS =====
  // TODO: Run "Extract All Lounge Hotels" bookmarklet on the Accor page
  // to resolve hotel IDs for all 309 lounge hotels globally.
  // Then paste the IDs here organized by region/country.
  //
  // Instructions:
  // 1. Open https://all.accor.com/loyalty-program/user/hotels-lounge/index.en.shtml
  // 2. Run the "Extract All Lounge Hotels" bookmarklet
  // 3. Save output as data/lounge/YYYY-MM.json
  // 4. Extract all non-null hotel_id values (5th element in each array)
  // 5. Add them to this Set organized by country
  //
  // Quick extraction command (from saved JSON):
  //   data.hotels.filter(h => h[4]).map(h => "  '" + h[4] + "',  // " + h[3]).join('\n')
  //
  // ===== ASIA — Other countries =====
  // (IDs to be added after first global extraction)
  //
  // ===== EUROPE =====
  // (IDs to be added after first global extraction)
  //
  // ===== MIDDLE EAST =====
  // (IDs to be added after first global extraction)
  //
  // ===== AFRICA =====
  // (IDs to be added after first global extraction)
  //
  // ===== NORTH AMERICA =====
  // (IDs to be added after first global extraction)
  //
  // ===== SOUTH AMERICA =====
  // (IDs to be added after first global extraction)
  //
  // ===== OCEANIA =====
  // (IDs to be added after first global extraction)
]);

function injectStyles() {
  if (document.getElementById('exec-lounge-styles')) return;
  const style = document.createElement('style');
  style.id = 'exec-lounge-styles';
  style.textContent = \`
    .exec-lounge-highlighted {
      border: 4px solid #e63946 !important;
      border-radius: 6px !important;
      position: relative !important;
    }
    .exec-lounge-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #e63946;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      z-index: 10;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      white-space: nowrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
  \`;
  document.head.appendChild(style);
}

function highlightCard(card) {
  const hotelId = card.getAttribute('data-hotel-id');
  if (!EXECUTIVE_LOUNGE_HOTEL_IDS.has(hotelId)) return;
  if (card.getAttribute('data-exec-lounge-highlighted') === 'true') return;
  card.setAttribute('data-exec-lounge-highlighted', 'true');
  card.classList.add('exec-lounge-highlighted');
  const badge = document.createElement('div');
  badge.className = 'exec-lounge-badge';
  badge.textContent = 'Executive Lounge \u2713';
  card.appendChild(badge);
}

function highlightCards(root) {
  const cards = (root || document).querySelectorAll('div.result-list-item[data-hotel-id]');
  cards.forEach(highlightCard);
}

let observer = null;

function startObserver() {
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.classList && node.classList.contains('result-list-item') && node.hasAttribute('data-hotel-id')) {
          highlightCard(node);
        }
        if (node.querySelectorAll) {
          node.querySelectorAll('div.result-list-item[data-hotel-id]').forEach(highlightCard);
        }
      }
    }
  });
  observer.observe(document.body, { subtree: true, childList: true });
}

function stopObserver() {
  if (observer) { observer.disconnect(); observer = null; }
}

function init() {
  injectStyles();
  highlightCards();
  startObserver();
}

init();

// v2.0: Watch for route changes on ALL Accor booking pages (not just Vietnam)
(function watchRouteChanges() {
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    const isTarget = /all\.accor\.com\/booking/i.test(location.href);
    stopObserver();
    if (isTarget) init();
  }, 1000);
})();
