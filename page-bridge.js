// page-bridge.js — Runs in the MAIN world (page JS context)
// Has access to Vue/Apollo but NOT to chrome.* APIs
// Communicates with content.js via CustomEvents on document

// ==================== LOYALTY TIER DETECTION ====================
const VALID_TIERS = ['CLASSIC', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'LIMITLESS'];

function normalizeTier(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const upper = raw.toUpperCase().trim();
  if (VALID_TIERS.includes(upper)) return upper;
  for (const tier of VALID_TIERS) {
    if (upper.includes(tier)) return tier;
  }
  return null;
}

const TIER_FIELD_NAMES = [
  'tier', 'loyaltyTier', 'status', 'memberStatus', 'loyaltyStatus',
  'level', 'tierCode', 'cardLevel', 'memberLevel', 'fidelityLevel',
  'user_tier', 'loyalty_tier', 'cardType', 'membershipLevel',
  'loyaltyLevel', 'fidelityStatus', 'card_level', 'tier_code'
];

function deepSearchForTier(obj, depth) {
  if (depth <= 0 || !obj || typeof obj !== 'object') return null;
  for (const key of TIER_FIELD_NAMES) {
    if (obj[key]) {
      const t = normalizeTier(String(obj[key]));
      if (t) return { tierCode: t, field: key };
    }
  }
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const result = deepSearchForTier(obj[key], depth - 1);
      if (result) return result;
    }
  }
  return null;
}

function searchApolloForTier() {
  try {
    const vueApp = findVueApp();
    if (!vueApp) return null;
    let cache = null;
    const gp = vueApp.config && vueApp.config.globalProperties;
    if (gp && gp.$apolloProvider) {
      cache = gp.$apolloProvider.defaultClient.cache.extract();
    }
    if (!cache && gp && gp.$apollo) {
      cache = gp.$apollo.provider.defaultClient.cache.extract();
    }
    if (!cache) return null;
    // Search cache keys related to user/member/loyalty
    const relevantKeys = Object.keys(cache).filter(k =>
      /user|member|loyalty|auth|profile|account|fidelity/i.test(k)
    );
    console.log('[ExecLounge] Loyalty search - Apollo keys with user/member/loyalty:',
      relevantKeys.slice(0, 20));
    for (const key of relevantKeys) {
      const result = deepSearchForTier(cache[key], 4);
      if (result) return { ...result, source: 'apollo', cacheKey: key };
    }
    // Broader search: all cache entries
    for (const key of Object.keys(cache)) {
      if (relevantKeys.includes(key)) continue;
      const result = deepSearchForTier(cache[key], 3);
      if (result) return { ...result, source: 'apollo', cacheKey: key };
    }
  } catch (e) {
    console.log('[ExecLounge] Apollo loyalty search error:', e.message);
  }
  return null;
}

function searchNuxtForTier() {
  try {
    const nuxt = window.__NUXT__;
    if (!nuxt) return null;
    const containers = [nuxt.state, nuxt.data, nuxt.payload, nuxt];
    for (const c of containers) {
      if (!c) continue;
      const result = deepSearchForTier(c, 4);
      if (result) return { ...result, source: 'nuxt' };
    }
  } catch (e) {
    console.log('[ExecLounge] Nuxt loyalty search error:', e.message);
  }
  return null;
}

function searchAnalyticsForTier() {
  try {
    // GTM dataLayer
    if (Array.isArray(window.dataLayer)) {
      for (let i = window.dataLayer.length - 1; i >= 0; i--) {
        const result = deepSearchForTier(window.dataLayer[i], 3);
        if (result) return { ...result, source: 'dataLayer' };
      }
    }
    // Tealium
    if (window.utag_data) {
      const result = deepSearchForTier(window.utag_data, 3);
      if (result) return { ...result, source: 'utag_data' };
    }
    // Commanders Act
    if (window.tc_vars) {
      const result = deepSearchForTier(window.tc_vars, 3);
      if (result) return { ...result, source: 'tc_vars' };
    }
    // Digital Data
    if (window.digitalData) {
      const result = deepSearchForTier(window.digitalData, 3);
      if (result) return { ...result, source: 'digitalData' };
    }
  } catch (e) {
    console.log('[ExecLounge] Analytics loyalty search error:', e.message);
  }
  return null;
}

function searchStorageForTier() {
  const keyPattern = /user|member|auth|loyalty|profile|fidelity/i;
  for (const storage of [localStorage, sessionStorage]) {
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!keyPattern.test(key)) continue;
        try {
          const val = JSON.parse(storage.getItem(key));
          if (val && typeof val === 'object') {
            const result = deepSearchForTier(val, 4);
            if (result) return { ...result, source: 'storage', storageKey: key };
          }
        } catch { /* not JSON */ }
      }
    } catch (e) {
      console.log('[ExecLounge] Storage loyalty search error:', e.message);
    }
  }
  return null;
}

function searchCookiesForTier() {
  try {
    const cookiePattern = /loyalty|tier|member|status|level|fidelity/i;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, ...rest] = cookie.trim().split('=');
      if (!cookiePattern.test(name)) continue;
      const val = decodeURIComponent(rest.join('='));
      const t = normalizeTier(val);
      if (t) return { tierCode: t, source: 'cookie', field: name.trim() };
      // Try JSON cookies
      try {
        const obj = JSON.parse(val);
        if (obj && typeof obj === 'object') {
          const result = deepSearchForTier(obj, 3);
          if (result) return { ...result, source: 'cookie', cookieName: name.trim() };
        }
      } catch { /* not JSON */ }
    }
  } catch (e) {
    console.log('[ExecLounge] Cookie loyalty search error:', e.message);
  }
  return null;
}

function detectLoyaltyTier() {
  const sources = [
    searchApolloForTier,
    searchNuxtForTier,
    searchAnalyticsForTier,
    searchStorageForTier,
    searchCookiesForTier,
  ];
  for (const searchFn of sources) {
    const result = searchFn();
    if (result) return result;
  }
  return null;
}

function tryExtractLoyalty(attemptsLeft) {
  const result = detectLoyaltyTier();
  if (result) {
    console.log('[ExecLounge] Loyalty tier detected:', result.tierCode, 'via', result.source,
      result.field ? '(field: ' + result.field + ')' : '',
      result.cacheKey ? '(key: ' + result.cacheKey + ')' : '');
    document.dispatchEvent(new CustomEvent('exec-response-loyalty', {
      detail: JSON.stringify({ tier: result.tierCode, tierCode: result.tierCode, source: result.source })
    }));
    return;
  }
  if (attemptsLeft > 0) {
    setTimeout(() => tryExtractLoyalty(attemptsLeft - 1), 500);
  } else {
    // Diagnostic dump on final failure — each section isolated
    console.log('[ExecLounge] DIAG === Starting diagnostic dump ===');

    try {
      const vueApp = findVueApp();
      console.log('[ExecLounge] DIAG - Vue app found:', !!vueApp);
      if (vueApp) {
        let cache = null;
        const gp = vueApp.config && vueApp.config.globalProperties;
        if (gp && gp.$apolloProvider) cache = gp.$apolloProvider.defaultClient.cache.extract();
        if (!cache && gp && gp.$apollo) cache = gp.$apollo.provider.defaultClient.cache.extract();
        if (cache) {
          const allKeys = Object.keys(cache);
          console.log('[ExecLounge] DIAG - Apollo cache keys (' + allKeys.length + '):', allKeys.slice(0, 50));
          allKeys.slice(0, 5).forEach(function(k) {
            try { console.log('[ExecLounge] DIAG - Cache[' + k + ']:', JSON.stringify(cache[k]).slice(0, 300)); } catch(x) {}
          });
        } else {
          console.log('[ExecLounge] DIAG - Apollo cache: not found');
        }
      }
    } catch (e) { console.log('[ExecLounge] DIAG - Apollo error:', e.message); }

    try {
      console.log('[ExecLounge] DIAG - __NUXT__:', window.__NUXT__ ? Object.keys(window.__NUXT__).slice(0, 20) : 'not found');
    } catch (e) { console.log('[ExecLounge] DIAG - Nuxt error:', e.message); }

    try {
      console.log('[ExecLounge] DIAG - dataLayer:', Array.isArray(window.dataLayer) ? window.dataLayer.length + ' entries' : 'not found');
      if (Array.isArray(window.dataLayer) && window.dataLayer.length > 0) {
        window.dataLayer.slice(-3).forEach(function(entry, i) {
          try { console.log('[ExecLounge] DIAG - dataLayer[-' + (3 - i) + ']:', JSON.stringify(entry).slice(0, 500)); } catch(x) {}
        });
      }
    } catch (e) { console.log('[ExecLounge] DIAG - dataLayer error:', e.message); }

    try {
      console.log('[ExecLounge] DIAG - tc_vars:', window.tc_vars ? JSON.stringify(window.tc_vars).slice(0, 500) : 'not found');
    } catch (e) { console.log('[ExecLounge] DIAG - tc_vars error:', e.message); }

    try {
      console.log('[ExecLounge] DIAG - utag_data:', window.utag_data ? JSON.stringify(window.utag_data).slice(0, 500) : 'not found');
    } catch (e) { console.log('[ExecLounge] DIAG - utag_data error:', e.message); }

    try {
      console.log('[ExecLounge] DIAG - digitalData:', window.digitalData ? JSON.stringify(window.digitalData).slice(0, 500) : 'not found');
    } catch (e) { console.log('[ExecLounge] DIAG - digitalData error:', e.message); }

    try {
      var lsKeys = []; for (var i = 0; i < localStorage.length; i++) lsKeys.push(localStorage.key(i));
      console.log('[ExecLounge] DIAG - localStorage keys (' + lsKeys.length + '):', lsKeys.slice(0, 40));
    } catch (e) { console.log('[ExecLounge] DIAG - localStorage error:', e.message); }

    try {
      var ssKeys = []; for (var j = 0; j < sessionStorage.length; j++) ssKeys.push(sessionStorage.key(j));
      console.log('[ExecLounge] DIAG - sessionStorage keys (' + ssKeys.length + '):', ssKeys.slice(0, 40));
    } catch (e) { console.log('[ExecLounge] DIAG - sessionStorage error:', e.message); }

    try {
      var cookieNames = document.cookie.split(';').map(function(c) { return c.trim().split('=')[0]; }).filter(Boolean);
      console.log('[ExecLounge] DIAG - Cookie names (' + cookieNames.length + '):', cookieNames.slice(0, 40));
    } catch (e) { console.log('[ExecLounge] DIAG - cookies error:', e.message); }

    try {
      var windowKeys = Object.keys(window).filter(function(k) { return /user|member|loyalty|fidelity|tier|auth/i.test(k); });
      console.log('[ExecLounge] DIAG - Window globals matching user/loyalty:', windowKeys.slice(0, 20));
    } catch (e) { console.log('[ExecLounge] DIAG - window keys error:', e.message); }

    console.log('[ExecLounge] DIAG === End diagnostic dump ===');
    console.log('[ExecLounge] Loyalty tier not found after all attempts');
    document.dispatchEvent(new CustomEvent('exec-response-loyalty', {
      detail: JSON.stringify({ tier: null, tierCode: null, source: null })
    }));
  }
}

document.addEventListener('exec-request-loyalty', () => {
  tryExtractLoyalty(15);
});

// ==================== VUE/APOLLO CACHE ====================
function findVueApp() {
  // Try #app first (most common Nuxt/Vue root)
  const candidates = ['#app', '#__nuxt', '#__layout', '[id]'];
  for (const sel of candidates) {
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      if (el.__vue_app__) return el.__vue_app__;
      // Vue 3 may attach to __vue__ or via Nuxt's __nuxt
      if (el.__vue__) return el.__vue__;
    }
  }
  // Brute force: walk top-level elements for __vue_app__
  for (const el of document.body.children) {
    if (el.__vue_app__) return el.__vue_app__;
  }
  // Check window for Nuxt/Apollo globals
  if (window.__NUXT__ && window.__NUXT__.$apolloProvider) {
    return { config: { globalProperties: { $apolloProvider: window.__NUXT__.$apolloProvider } } };
  }
  return null;
}

function tryExtractCache(attemptsLeft) {
  const vueApp = findVueApp();
  if (vueApp) {
    try {
      // Try standard Vue 3 Apollo path
      let cache = null;
      const gp = vueApp.config && vueApp.config.globalProperties;
      if (gp && gp.$apolloProvider) {
        cache = gp.$apolloProvider.defaultClient.cache.extract();
      }
      // Try alternative Apollo paths
      if (!cache && gp && gp.$apollo) {
        cache = gp.$apollo.provider.defaultClient.cache.extract();
      }
      if (cache) {
        document.dispatchEvent(new CustomEvent('exec-response-cache', {
          detail: JSON.stringify({ cache: cache })
        }));
        return;
      }
    } catch (e) {
      // If we found Vue but Apollo path failed, report the specific error
      if (attemptsLeft <= 0) {
        document.dispatchEvent(new CustomEvent('exec-response-cache', {
          detail: JSON.stringify({ error: 'Apollo extract failed: ' + e.message })
        }));
        return;
      }
    }
  }

  if (attemptsLeft > 0) {
    setTimeout(() => tryExtractCache(attemptsLeft - 1), 500);
  } else {
    // Final diagnostic: report what we found
    const appEl = document.querySelector('#app');
    const hasApp = !!appEl;
    const hasVue = hasApp && !!appEl.__vue_app__;
    const bodyChildIds = [...document.body.children].map(el => el.id || el.tagName).slice(0, 10);
    const vueEls = [...document.body.querySelectorAll('*')].filter(el => el.__vue_app__).map(el => el.id || el.tagName).slice(0, 5);
    document.dispatchEvent(new CustomEvent('exec-response-cache', {
      detail: JSON.stringify({
        error: 'Vue/Apollo not found',
        diag: { hasApp, hasVue, bodyChildIds, vueEls, hasNuxt: !!window.__NUXT__ }
      })
    }));
  }
}

document.addEventListener('exec-request-cache', () => {
  tryExtractCache(15); // retry up to 15 times (7.5 seconds)
});

console.log('[ExecLounge] page-bridge.js loaded in MAIN world');
