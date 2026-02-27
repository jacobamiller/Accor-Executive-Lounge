console.log('[ExecLounge] content.js loaded on:', window.location.href);
// Accor Executive Lounge Highlighter - content.js v2.3 Global
// Highlights hotel cards with an Executive Lounge with a thick red border.
// Hotel IDs populated from monthly lounge extraction data.
// Run the "Extract All Lounge Hotels" bookmarklet to get updated IDs.

const EXECUTIVE_LOUNGE_HOTEL_IDS = new Set([
  // ===== AFRICA =====
  // Ghana (1 hotels)
  'B4P0', // Mövenpick Ambassador Hotel Accr
  // Ivory Coast (2 hotels)
  'B4X4', // Mövenpick Hotel Abidjan
  'B1I4', // Novotel Abidjan Marcory
  // Kenya (1 hotels)
  'B4Q7', // Mövenpick Nairobi Hotel & Residences
  // Morocco (1 hotels)
  'A7Z0', // Fairmont La Marina Rabat-Salé

  // ===== ASIA =====
  // Azerbaijan (1 hotels)
  'A593', // Fairmont Baku Flame Towers
  // Cambodia (3 hotels)
  '6526', // Sofitel Phnom Penh Phokeethra
  'B2E8', // Novotel Phnom Penh BKK 1
  '3123', // Sofitel Angkor Phokeethra Golf & Spa Resort
  // China (61 hotels)
  '8276', // Pullman Anshan Time Square
  'A5F9', // Fairmont Beijing
  '6684', // Grand Mercure Beijing Central
  '7025', // Pullman Beijing South
  '8968', // Pullman Changshu Leeman
  'A820', // Fairmont Chengdu
  '8900', // Novotel Daqing Haofang
  '7483', // Pullman Dongguan Changan
  '8719', // Sofitel Foshan
  'A5B2', // Swissôtel Foshan
  '9806', // Pullman Fuzhou Tahoe
  'B2W3', // Pullman Guangzhou Baiyun Airport
  '6318', // Sofitel Guangzhou Sunrich
  '8032', // Novotel Guiyang Downtown
  '8275', // Pullman Guiyang
  '8873', // Sofitel Guiyang Hunter
  '5554', // Sofitel Hangzhou Westlake
  '6824', // Sofitel Harbin
  '9871', // Pullman Hefei Sunac
  '8163', // Pullman Huizhou Kaisa Hotel
  '8509', // Pullman Kaifeng Jianye
  '8529', // Sofitel Kunming
  'A5G2', // Fairmont Yangcheng Lake
  '8102', // Sofitel Lianyungang Suning
  '7468', // Pullman Linyi Lushang
  '7870', // Novotel Nanjing Central Suning
  '7548', // Novotel Nanjing East Suning
  '8737', // Pullman Nanjing Lukou Airport
  '6179', // Sofitel Nanjing Galaxy Suning
  '8310', // Novotel Ningbo East
  '9531', // Novotel Rizhao Suning
  'B851', // Fairmont Sanya Haitang Bay
  '7126', // Pullman Oceanview Sanya Bay Resort & Spa
  '8167', // Sofitel Sanya Leeman Resort
  'A5G7', // Fairmont Peace Hotel
  'C4L4', // Grand Mercure Shanghai Century Park
  '3019', // Novotel Shanghai Atlantis
  'A3P3', // Novotel Shanghai Clover
  '9229', // Novotel Shanghai Hongqiao
  '9307', // Pullman Shanghai Qingpu Excellence
  '9933', // Sofitel Shanghai Hongqiao
  'B9G8', // Sofitel Shanghai North Bund
  'A5C9', // Swissôtel Grand Shanghai
  '8624', // Pullman Shishi Mattison
  '9442', // Novotel Suzhou SIP
  '9936', // Pullman Suzhou Zhonghui
  '8475', // Pullman Taiyuan
  '9807', // Pullman Tangshan
  '8557', // Grand Mercure Urumqi Hualing
  '9590', // Pullman Weifang
  '8837', // Pullman Wenzhou
  'A7Z9', // Fairmont Wuhan
  '7545', // Pullman Wuxi New Lake
  '9804', // The Sebel Xi Ning
  '8160', // Pullman Xiamen Powerlong
  '5949', // Sofitel Xian on Renmin Square
  '9567', // Sofitel Xining
  '7934', // Pullman Zhangjiajie
  '8258', // Novotel Zhengzhou Convention Centre
  '2197', // Sofitel Zhengzhou International
  '7598', // Pullman Shanghai Jing'an
  // Hong Kong (2 hotels)
  '6239', // Novotel Hong Kong Citygate
  '3562', // Novotel Century Hong Kong
  // India (16 hotels)
  '8173', // Novotel Ahmedabad
  'A0L1', // Novotel Vijayawada Varun
  '7535', // Novotel Visakhapatnam Varun Beach
  '6453', // Novotel Bengaluru Outer Ring Road
  '9636', // Novotel Chennai Chamiers Road
  '9581', // Novotel Guwahati GS Road
  '6687', // Novotel Hyderabad Airport
  '6182', // Novotel Hyderabad Convention Centre
  'A5G0', // Fairmont Jaipur
  '6937', // Novotel Kolkata - Hotel & Residences
  '6926', // Novotel Mumbai Juhu Beach
  '6451', // Sofitel Mumbai BKC
  '7560', // Novotel New Delhi Aerocity
  '7559', // Pullman New Delhi Aerocity
  'A0L1', // Novotel Vijayawada Varun
  '7535', // Novotel Visakhapatnam Varun Beach
  // Indonesia (21 hotels)
  '9105', // Novotel Bali Ngurah Rai Airport
  '9078', // Sofitel Bali Nusa Dua Beach Resort
  '8814', // Grand Mercure Bandung Setiabudi
  '9109', // Pullman Bandung Grand Central
  '8489', // Novotel Banjarmasin Airport
  'C2H0', // Swissôtel Nusantara
  'A5G1', // Fairmont Jakarta
  'B151', // Mercure Jakarta Gatot Subroto
  '7447', // Novotel Jakarta Gajah Mada
  '5704', // Novotel Jakarta Mangga Dua Square
  '7536', // Pullman Jakarta Central Park
  '8491', // Pullman Jakarta Indonesia Thamrin CBD
  'B590', // Swissôtel Jakarta Pik Avenue
  '9778', // Grand Mercure Lampung
  '8584', // Novotel Makassar Grand Shayla
  '9054', // Grand Mercure Maha Cipta Medan Angkasa
  '9482', // Novotel Pekanbaru
  '5506', // Novotel Semarang
  'C0I4', // Grand Mercure Solo Baru
  '0545', // Novotel Solo
  '7234', // Novotel Tangerang
  // Japan (7 hotels)
  'B2P9', // Novotel Okinawa Naha
  'C166', // Novotel Nara
  'A5C3', // Swissotel Nankai Osaka
  'C082', // Hôtel Sosei Sapporo MGallery
  'B6R8', // Fairmont Tokyo
  'C1F1', // Mercure Tokyo Hibiya
  'B137', // Pullman Tokyo Tamachi
  // Macao (1 hotels)
  '6480', // Sofitel Macau at Ponte 16
  // Malaysia (7 hotels)
  'B4P4', // Mövenpick Hotel and Convention Centre KLIA
  '6324', // Novotel Kuala Lumpur City Centre
  'A0C5', // Pullman Kuala Lumpur City Centre - Hotel & Residences
  'A0C5', // Pullman Kuala Lumpur City Centre Hotel & Residences
  'A123', // Sofitel Kuala Lumpur Damansara
  '6332', // Pullman Kuching
  '9731', // Pullman Miri Waterfront
  // Myanmar (1 hotels)
  '9045', // Novotel Yangon Max
  // Pakistan (1 hotels)
  'B4N7', // Mövenpick Karachi
  // Philippines (1 hotels)
  'A5G3', // Fairmont Makati
  // Singapore (9 hotels)
  'A5G8', // Fairmont Singapore
  '3610', // Grand Mercure Singapore Roxy
  'A0D7', // Mercure Singapore Bugis
  '9561', // Mercure Singapore On Stevens
  '9543', // Novotel Singapore On Stevens
  'B5L7', // Pullman Singapore Hill Street
  'B9H8', // Pullman Singapore Orchard
  'A152', // Sofitel Singapore City Centre
  'A5D3', // Swissotel The Stamford
  // South Korea (10 hotels)
  'B200', // Fairmont Ambassador Seoul
  '9470', // Grand Mercure Ambassador Hotel and Residences Seoul Yongsan
  'C3E4', // Grand Mercure Imperial Palace Seoul Gangnam
  'A5U6', // Novotel Ambassador Seoul Dongdaemun Hotels & Residences
  '1633', // Novotel Ambassador Seoul Gangnam
  '9472', // Novotel Ambassador Seoul Yongsan - Seoul Dragon City
  '9473', // Novotel Suites Ambassador Seoul Yongsan
  'B220', // Sofitel Ambassador Seoul Hotel & Serviced Residences
  '0966', // The Ambassador Seoul - A Pullman Hotel
  '8748', // Novotel Ambassador Suwon
  // Thailand (18 hotels)
  'C0Y8', // Grand Mercure Bangkok Atrium
  '8422', // Mercure Bangkok Makkasan
  'A247', // Mercure Bangkok Sukhumvit 11
  'B4U9', // Mövenpick BDMS Wellness Resort Bangkok
  'B4U9', // Mövenpick BDMS Wellness Resort Bangkok
  'B4K2', // Mövenpick Hotel Sukhumvit 15 Bangkok
  'B346', // Novotel Bangkok Future Park Rangsit
  '8059', // Novotel Bangkok Impact
  '7272', // Novotel Bangkok Platinum Pratunam
  '9343', // Novotel Bangkok Sukhumvit 20
  '3616', // Pullman Bangkok Hotel G
  '6323', // Pullman Bangkok King Power
  '5213', // Sofitel Bangkok Sukhumvit
  '9775', // Novotel Marina Sriracha
  '6184', // Sofitel Krabi Phokeethra Golf & Spa Resort
  '7540', // Pullman Pattaya Hotel G
  '8109', // Grand Mercure Phuket Patong
  'C1D6', // Pullman Phuket Karon Beach
  // Vietnam (13 hotels)
  '7821', // Grand Mercure Danang
  '8287', // Novotel Danang Premier Han River
  'B4G6', // Movenpick Hotel Hanoi Centre
  '9183', // Mercure Hai Phong
  '7579', // Pullman Hanoi
  'B4S6', // Pullman Hai Phong Grand Hotel
  '1555', // Sofitel Legend Metropole Hanoi
  '9231', // Hotel des Arts Saigon - MGallery Collection
  '7965', // Novotel Saigon Centre
  '7489', // Pullman Saigon Centre
  '2077', // Sofitel Saigon Plaza
  'B6Y9', // Mövenpick Resort Phan Thiet
  '7133', // Pullman Vung Tau

  // ===== EUROPE =====
  // Czech Republic (1 hotels)
  '7051', // Mercure Ostrava Center
  // Greece (1 hotels)
  '3167', // Sofitel Athens Airport
  // Hungary (1 hotels)
  '6565', // Mercure Budapest City Center
  // Netherlands (1 hotels)
  'B4I7', // Mövenpick Hotel Amsterdam City Centre
  // Turkey (3 hotels)
  'A800', // Fairmont Quasar Istanbul
  'A5D2', // Swissôtel The Bosphorus Istanbul
  'A5A6', // Swissôtel Büyük Efes
  // United Kingdom (1 hotels)
  '6214', // Sofitel London Heathrow Hotel

  // ===== MIDDLE EAST =====
  // Bahrain (1 hotels)
  '6722', // Sofitel Bahrain Zallaq Thalassa sea & spa
  // Egypt (3 hotels)
  'A5E9', // Fairmont Nile City
  'C3J2', // Sofitel Cairo Downtown Nile
  '5307', // Sofitel Cairo Nile El Gezirah
  // Jordan (2 hotels)
  'A7X8', // Fairmont Amman
  'B5J0', // Movenpick Hotel Amman
  // Qatar (3 hotels)
  'B4T9', // Banyan Tree Doha at La Cigale Musharib
  'B663', // Fairmont Doha
  '8112', // Pullman Doha West Bay
  // Saudi Arabia (6 hotels)
  '5988', // Sofitel Al Khobar The Corniche
  'B4M6', // Anwar Al Madinah Mövenpick Hotel
  'B4M6', // Anwar Al Madinah Movenpick Hotel
  'B4N1', // Mövenpick Qassim
  'A7X6', // Fairmont Riyadh
  '9029', // Sofitel Riyadh
  // United Arab Emirates (15 hotels)
  '7507', // Sofitel Abu Dhabi Corniche
  'A5F1', // Fairmont The Palm
  'B4J9', // Grand Plaza Movenpick Media City
  'B4J9', // Grand Plaza Mövenpick Media City
  'A7N4', // Mercure Dubai Deira
  'B4J0', // Mövenpick Hotel & Apartments Bur Dubai
  'B4I9', // Mövenpick Hotel Jumeirah Beach
  'B8D7', // Pullman Dubai Downtown
  'B8D7', // Pullman Dubai Downtown
  '6305', // Pullman Dubai Jumeirah Lakes Towers
  '7492', // Sofitel Dubai Downtown
  '6146', // Sofitel Dubai Jumeirah Beach
  'B197', // Sofitel Dubai The Obelisk
  'B1P8', // Swissotel Al Ghurair Dubai
  'B9F8', // Sofitel Al Hamra Beach Resort

  // ===== NORTH AMERICA =====
  // Canada (12 hotels)
  'A550', // Fairmont Banff Springs
  'A555', // Fairmont Palliser
  'A559', // Fairmont Hotel Macdonald
  'A563', // Fairmont Chateau Lake Louise
  'A567', // Fairmont The Queen Elizabeth
  'A551', // Fairmont Royal York
  'A565', // Fairmont Tremblant
  'A584', // Fairmont Hotel Vancouver
  'A585', // Fairmont Pacific Rim
  'A587', // Fairmont Waterfront
  'A591', // Fairmont Chateau Whistler
  'A592', // Fairmont Winnipeg
  // Mexico (1 hotels)
  '9615', // Sofitel Mexico City Reforma
  // United States Of America (8 hotels)
  'A7Z4', // Fairmont Austin
  'A554', // Fairmont Copley Plaza
  'A557', // Fairmont Chicago, Millennium Park
  'A558', // Fairmont Dallas
  'A561', // Fairmont Orchid Hawaii
  'A8J5', // Fairmont Century Plaza
  'A579', // Fairmont Scottsdale Princess
  'A590', // Fairmont Washington D.C. Georgetown

  // ===== OCEANIA =====
  // Australia (9 hotels)
  'B217', // Pullman Adelaide
  '5992', // Sofitel Brisbane Central
  'C074', // The Sebel Twin Towns Coolangatta
  '3028', // Pullman Melbourne City Centre
  '9875', // Pullman Melbourne On the Park
  '1902', // Sofitel Melbourne on Collins
  '9729', // Sofitel Sydney Darling Harbour
  '3665', // Sofitel Sydney Wentworth
  'A5D0', // Swissôtel Sydney
  // New Zealand (1 hotels)
  'A8U9', // Pullman Auckland

  // ===== SOUTH AMERICA =====
  // Brazil (2 hotels)
  '3575', // Mercure Belo Horizonte Lourdes
  '1988', // Fairmont Rio de Janeiro Copacabana
  // Ecuador (1 hotels)
  'A5C4', // Swissôtel Quito
  // Peru (2 hotels)
  '6339', // Novotel Lima
  'A5B8', // Swissôtel Lima

  // ===== UNMATCHED HOTELS (58 hotels) =====
  // These hotels could not be matched via the API.
  // Search manually on all.accor.com and inspect data-hotel-id attribute.
  // TODO: Resolve remaining 58 unmatched hotel IDs
]);

// Hotel IDs offering complimentary breakfast for Platinum/Diamond members.
// Populated from data/breakfast/YYYY-MM.json via Bookmarklet 2.
// TODO: Run "Extract All Breakfast Hotels" bookmarklet and populate (~7,400+ hotels)
const FREE_BREAKFAST_HOTEL_IDS = new Set([
  // Run Bookmarklet 2 on https://all.accor.com/loyalty-program/user/hotels-lounge/index.en.shtml
  // Save output as data/breakfast/YYYY-MM.json, then paste hotel IDs here.
]);

// ==================== TOGGLE STATE ====================
let loungeFilterActive = sessionStorage.getItem('execLoungeToggleActive') === 'true';

// ==================== STYLES ====================
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
    .free-breakfast-badge {
      position: absolute;
      top: 36px;
      right: 8px;
      background: #0e8a16;
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
    .free-breakfast-only {
      position: relative !important;
    }
    .free-breakfast-only .free-breakfast-badge {
      top: 8px;
    }
    .exec-lounge-hidden {
      display: none !important;
    }
    #exec-lounge-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border: 2px solid #e63946;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-left: 12px;
      vertical-align: middle;
      line-height: 1.4;
    }
    #exec-lounge-toggle-btn.active {
      background: #e63946;
      color: #ffffff;
    }
    #exec-lounge-toggle-btn:not(.active) {
      background: transparent;
      color: #e63946;
    }
    #exec-lounge-toggle-btn:hover {
      opacity: 0.85;
    }
    #exec-lounge-counter {
      font-size: 12px;
      color: #888;
      margin-left: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      vertical-align: middle;
    }
    p.offer-price.exec-tax-styled {
      font-size: 13px !important;
      font-weight: 500 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #1a1a2e !important;
      line-height: 1.5 !important;
      letter-spacing: 0.01em;
    }
    .exec-tax-total {
      color: #e63946;
      font-weight: 700;
      font-size: 1.15em;
    }
    .exec-tax-per-night {
      color: #555;
      font-size: 0.92em;
      font-weight: 400;
    }
    .exec-base-price {
      font-weight: 600;
    }
  `;
  document.head.appendChild(style);
}

// ==================== HIGHLIGHT CARDS ====================
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
  // Parse price data for this card
  const priceData = parsePriceData(card);
  if (priceData) console.log('[ExecLounge] Price data:', hotelId, priceData);
}

function addBreakfastBadge(card) {
  const hotelId = card.getAttribute('data-hotel-id');
  if (!FREE_BREAKFAST_HOTEL_IDS.has(hotelId)) return;
  if (card.getAttribute('data-breakfast-badge') === 'true') return;
  card.setAttribute('data-breakfast-badge', 'true');
  // If breakfast-only (no lounge), add position:relative and place badge at top
  if (!EXECUTIVE_LOUNGE_HOTEL_IDS.has(hotelId)) {
    card.classList.add('free-breakfast-only');
  }
  const badge = document.createElement('div');
  badge.className = 'free-breakfast-badge';
  badge.textContent = 'Free Breakfast \u2713';
  card.appendChild(badge);
}

function highlightCards(root) {
  const cards = (root || document).querySelectorAll('div.result-list-item[data-hotel-id]');
  cards.forEach(card => {
    highlightCard(card);
    addBreakfastBadge(card);
    addTaxInclusivePrice(card);
  });
}

// ==================== PRICE HELPERS ====================
/**
 * Parse a localized number string into a float.
 * Handles US (1,350.00) and European (1.350,00) formats.
 */
function parseLocalizedNumber(str) {
  str = str.replace(/\s/g, '');
  if (str.includes(',') && str.includes('.')) {
    // Both separators: last one is the decimal
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      // European: 1.350,00
      return parseFloat(str.replace(/\./g, '').replace(',', '.'));
    }
    // US: 1,350.00
    return parseFloat(str.replace(/,/g, ''));
  }
  if (str.includes(',')) {
    // Single comma: decimal if followed by exactly 2 digits at end, else thousands
    if (/,\d{2}$/.test(str) && (str.match(/,/g) || []).length === 1) {
      return parseFloat(str.replace(',', '.'));
    }
    return parseFloat(str.replace(/,/g, ''));
  }
  return parseFloat(str);
}

/**
 * Extract currency symbol and numeric amount from a price string.
 * Supports prefix ($45, A$1,350) and suffix (1.350,00 €) currencies.
 */
function parseCurrencyAmount(text) {
  // Try prefix currency: $45, A$1,350, HK$200, €67,50
  let match = text.match(/([^\d\s.,]+)\s*([\d.,]+)/);
  if (match) {
    const amount = parseLocalizedNumber(match[2]);
    if (!isNaN(amount)) return { currency: match[1].trim(), amount };
  }
  // Try suffix currency: 1.350,00 €
  match = text.match(/([\d.,]+)\s*([^\d\s.,]+)/);
  if (match) {
    const amount = parseLocalizedNumber(match[1]);
    if (!isNaN(amount)) return { currency: match[2].trim(), amount };
  }
  return null;
}

// ==================== PRICE DATA PARSING ====================
function parsePriceData(card) {
  try {
    // Extract base price and currency from span.offer-price__amount
    const priceEl = card.querySelector('span.offer-price__amount');
    if (!priceEl) return null;
    const priceText = priceEl.textContent.trim();
    const priceResult = parseCurrencyAmount(priceText);
    if (!priceResult) return null;

    // Extract tax from span.stay-details__formatted-tax-type
    const taxEl = card.querySelector('span.stay-details__formatted-tax-type');
    if (!taxEl) return null;
    const taxText = taxEl.textContent.trim();
    const taxResult = parseCurrencyAmount(taxText);
    if (!taxResult) return null;

    // Extract nights from span.pricing-type-label
    const nightsEl = card.querySelector('span.pricing-type-label');
    if (!nightsEl) return null;
    const nightsText = nightsEl.textContent.trim();
    const nightsMatch = nightsText.match(/(\d+)\s*night/i);
    if (!nightsMatch) return null;
    const nights = parseInt(nightsMatch[1], 10);
    if (isNaN(nights) || nights < 1) return null;

    return {
      basePrice: priceResult.amount,
      tax: taxResult.amount,
      nights,
      currency: priceResult.currency,
      raw: { priceText, taxText, nightsText }
    };
  } catch (e) {
    return null;
  }
}


// ==================== TAX-INCLUSIVE PRICE ====================
function formatPrice(amount) {
  return amount % 1 === 0 ? String(amount) : amount.toFixed(2);
}

function addTaxInclusivePrice(card) {
  if (card.getAttribute('data-exec-tax-processed') === 'true') return;
  const data = parsePriceData(card);
  if (!data) {
    const hotelId = card.getAttribute('data-hotel-id') || 'unknown';
    console.debug('[ExecLounge] No tax data for hotel', hotelId, ', skipping');
    return;
  }

  const total = data.basePrice + data.tax;
  const perNight = total / data.nights;
  const basePriceStr = formatPrice(data.basePrice);
  const totalStr = formatPrice(total);
  const perNightStr = formatPrice(Math.round(perNight));

  const offerPrice = card.querySelector('p.offer-price');
  if (!offerPrice) return;

  offerPrice.classList.add('exec-tax-styled');
  if (data.nights > 1) {
    offerPrice.innerHTML = `Total: <span class="exec-tax-total">${data.currency}${totalStr}</span> w/ Tax <span class="exec-tax-per-night">(${data.currency}${perNightStr}/night)</span>`;
  } else {
    offerPrice.innerHTML = `Total: <span class="exec-tax-total">${data.currency}${totalStr}</span> w/ Tax`;
  }

  // Insert "From $XX" into the stay-details line, before the tax text
  const taxEl = card.querySelector('span.stay-details__formatted-tax-type');
  if (taxEl && !card.querySelector('.exec-base-price')) {
    const baseSpan = document.createElement('span');
    baseSpan.className = 'exec-base-price';
    baseSpan.textContent = `From ${data.currency}${basePriceStr} `;
    taxEl.parentNode.insertBefore(baseSpan, taxEl);
  }

  card.setAttribute('data-exec-tax-processed', 'true');
}

// ==================== TOGGLE FEATURE ====================
function applyFilterToCard(card) {
  const hotelId = card.getAttribute('data-hotel-id');
  if (!hotelId) return;
  if (loungeFilterActive && !EXECUTIVE_LOUNGE_HOTEL_IDS.has(hotelId)) {
    card.classList.add('exec-lounge-hidden');
  } else {
    card.classList.remove('exec-lounge-hidden');
  }
}

function applyFilterToAllCards() {
  const cards = document.querySelectorAll('div.result-list-item[data-hotel-id]');
  cards.forEach(applyFilterToCard);
  updateCounter();
}

function updateCounter() {
  const counter = document.getElementById('exec-lounge-counter');
  if (!counter) return;
  const allCards = document.querySelectorAll('div.result-list-item[data-hotel-id]');
  const totalCards = allCards.length;
  let loungeCount = 0;
  allCards.forEach(card => {
    const hotelId = card.getAttribute('data-hotel-id');
    if (EXECUTIVE_LOUNGE_HOTEL_IDS.has(hotelId)) loungeCount++;
  });
  if (loungeFilterActive) {
    counter.textContent = `Showing ${loungeCount} of ${totalCards} hotels with Executive Lounge`;
  } else {
    counter.textContent = `${loungeCount} of ${totalCards} hotels have an Executive Lounge`;
  }
}

function updateToggleButton() {
  const btn = document.getElementById('exec-lounge-toggle-btn');
  if (!btn) return;
  if (loungeFilterActive) {
    btn.classList.add('active');
    btn.textContent = '\u2713 Lounge Only';
  } else {
    btn.classList.remove('active');
    btn.textContent = 'Lounge Only';
  }
}

function toggleFilter() {
  loungeFilterActive = !loungeFilterActive;
  sessionStorage.setItem('execLoungeToggleActive', loungeFilterActive.toString());
  updateToggleButton();
  applyFilterToAllCards();
}

function injectToggleButton() {
  if (document.getElementById('exec-lounge-toggle-btn')) return;

  // Try to find the results header area
  const resultsHeader = document.querySelector('.availability-status-message')
    || document.querySelector('[class*="results-header"]')
    || document.querySelector('[class*="search-results"] h1')
    || document.querySelector('[class*="hotel-count"]')
    || document.querySelector('[class*="result-count"]');

  // Create toggle button
  const btn = document.createElement('button');
  btn.id = 'exec-lounge-toggle-btn';
  btn.type = 'button';
  btn.addEventListener('click', toggleFilter);

  // Create counter
  const counter = document.createElement('span');
  counter.id = 'exec-lounge-counter';

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.id = 'exec-lounge-toggle-wrapper';
  wrapper.style.cssText = 'padding: 8px 16px; display: flex; align-items: center; flex-wrap: wrap;';
  wrapper.appendChild(btn);
  wrapper.appendChild(counter);

  if (resultsHeader) {
    resultsHeader.parentNode.insertBefore(wrapper, resultsHeader.nextSibling);
  } else {
    // Fallback: insert before the first result card
    const firstCard = document.querySelector('div.result-list-item[data-hotel-id]');
    if (firstCard && firstCard.parentNode) {
      firstCard.parentNode.insertBefore(wrapper, firstCard);
    } else {
      // Last resort: try again later via observer
      return;
    }
  }

  // Set initial state
  updateToggleButton();
  updateCounter();
}

// ==================== MUTATION OBSERVER ====================
let observer = null;
function startObserver() {
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    // Re-entrancy guard: pause observer while processing to prevent feedback loops
    observer.disconnect();
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.classList && node.classList.contains('result-list-item') && node.hasAttribute('data-hotel-id')) {
          highlightCard(node);
          addBreakfastBadge(node);
          applyFilterToCard(node);
          addTaxInclusivePrice(node);
          const nodePriceData = parsePriceData(node);
          if (nodePriceData) console.log('[ExecLounge] Price data:', node.getAttribute('data-hotel-id'), nodePriceData);
        }
        if (node.querySelectorAll) {
          node.querySelectorAll('div.result-list-item[data-hotel-id]').forEach(card => {
            highlightCard(card);
            addBreakfastBadge(card);
            applyFilterToCard(card);
            addTaxInclusivePrice(card);
            const cardPriceData = parsePriceData(card);
            if (cardPriceData) console.log('[ExecLounge] Price data:', card.getAttribute('data-hotel-id'), cardPriceData);
          });
        }
      }
    }
    // Update counter when new cards are added
    updateCounter();
    // Try to inject toggle button if it hasn't been placed yet
    if (!document.getElementById('exec-lounge-toggle-btn')) {
      injectToggleButton();
    }
    // Re-entrancy guard: resume observing after processing
    observer.observe(document.body, { subtree: true, childList: true });
  });
  observer.observe(document.body, { subtree: true, childList: true });
}

function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// ==================== INIT ====================
function init() {
  // Only run on booking pages
  if (!/\/booking\//i.test(location.pathname)) return;
  console.log('[ExecLounge] init() running - found booking page');
  loungeFilterActive = sessionStorage.getItem('execLoungeToggleActive') === 'true';
  injectStyles();
  highlightCards();
  injectToggleButton();
  applyFilterToAllCards();
  startObserver();
}

init();

// v2.2: Watch for route changes on ALL Accor booking pages
(function watchRouteChanges() {
  // Only watch for route changes if we started on a booking page
  if (!/\/booking\//i.test(location.pathname)) return;
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    // Clear tax-processed flags so prices recompute on date/currency changes
    document.querySelectorAll('[data-exec-tax-processed]').forEach(el => {
      el.removeAttribute('data-exec-tax-processed');
    });
    const isTarget = /all\.accor\.com\/booking/i.test(location.href);
    stopObserver();
    if (isTarget) init();
  }, 1000);
})();
