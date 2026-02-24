// Accor Executive Lounge Highlighter - content.js v2.0 Global
// Highlights hotel cards with an Executive Lounge with a thick red border.
// Hotel IDs populated from monthly lounge extraction data.
// Run the "Extract All Lounge Hotels" bookmarklet to get updated IDs.

const EXECUTIVE_LOUNGE_HOTEL_IDS = new Set([
  // ===== AFRICA =====
  // Ghana (1 hotels)
  'B4P0', // Mövenpick Ambassador Hotel Accra
  // Ivory Coast (2 hotels)
  'B4X4', // Mövenpick Hotel Abidjan
  'B1I4', // Novotel Abidjan Marcory

  // ===== ASIA =====
  // Azerbaijan (1 hotels)
  'A593', // Fairmont Baku Flame Towers
  // Cambodia (2 hotels)
  '6526', // Sofitel Phnom Penh Phokeethra
  '3123', // Sofitel Angkor Phokeethra Golf & Spa Resort
  // China (60 hotels)
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
  // Hong Kong (1 hotels)
  '6239', // Novotel Hong Kong Citygate
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
  // Vietnam (12 hotels)
  '7821', // Grand Mercure Danang
  '8287', // Novotel Danang Premier Han River
  'B4G6', // Movenpick Hotel Hanoi Centre
  '9183', // Mercure Hai Phong
  '7579', // Pullman Hanoi
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

  // ===== UNMATCHED HOTELS (64 hotels) =====
  // These hotels could not be matched via the API.
  // Search manually on all.accor.com and inspect data-hotel-id attribute.
  // TODO: Resolve remaining 64 unmatched hotel IDs
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
  badge.textContent = 'Executive Lounge ✓';
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
  if (observer) {
    observer.disconnect();
    observer = null;
  }
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
