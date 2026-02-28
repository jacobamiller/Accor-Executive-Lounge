// page-bridge.js — Runs in the MAIN world (page JS context)
// Has access to Vue/Apollo but NOT to chrome.* APIs
// Communicates with content.js via CustomEvents on document

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
