// page-bridge.js — Runs in the MAIN world (page JS context)
// Has access to Vue/Apollo but NOT to chrome.* APIs
// Communicates with content.js via CustomEvents on document

document.addEventListener('exec-request-cache', () => {
  try {
    const app = document.querySelector('#app');
    if (!app || !app.__vue_app__) {
      document.dispatchEvent(new CustomEvent('exec-response-cache', {
        detail: JSON.stringify({ error: 'No Vue app found' })
      }));
      return;
    }
    const cache = app.__vue_app__.config.globalProperties
      .$apolloProvider.defaultClient.cache.extract();
    document.dispatchEvent(new CustomEvent('exec-response-cache', {
      detail: JSON.stringify({ cache: cache })
    }));
  } catch (e) {
    document.dispatchEvent(new CustomEvent('exec-response-cache', {
      detail: JSON.stringify({ error: e.message })
    }));
  }
});

console.log('[ExecLounge] page-bridge.js loaded in MAIN world');
