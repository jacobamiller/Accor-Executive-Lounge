// Accor Executive Lounge Highlighter - content.js v1.0 Vietnam
// Highlights hotel cards with an Executive Lounge with a thick red border.

const EXECUTIVE_LOUNGE_HOTEL_IDS = new Set([
  '7821',   // Grand Mercure Danang
  '8287',   // Novotel Danang Premier Han River
  'B4G6',   // Movenpick Hotel Hanoi Centre
  '9183',   // Mercure Hai Phong
  'B4S6',   // Pullman Hai Phong Grand Hotel
  '7579',   // Pullman Hanoi
  '1555',   // Sofitel Legend Metropole Hanoi
  '9231',   // Hotel des Arts Saigon - MGallery Collection
  '7965',   // Novotel Saigon Centre
  '7489',   // Pullman Saigon Centre
  '2077',   // Sofitel Saigon Plaza
  'B6Y9',   // Movenpick Resort Phan Thiet
  '7133',   // Pullman Vung Tau
]);

function injectStyles() {
  if (document.getElementById('exec-lounge-styles')) return;
  const style = document.createElement('style');
  style.id = 'exec-lounge-styles';
  style.textContent = `
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
  `;
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

(function watchRouteChanges() {
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    const isTarget = /all\.accor\.com\/booking\/en\/accor\/hotels\/vietnam/i.test(location.href);
    stopObserver();
    if (isTarget) init();
  }, 1000);
})();
