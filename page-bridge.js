// page-bridge.js — Runs in the MAIN world (page JS context)
// Has access to Vue/Apollo but NOT to chrome.* APIs
// Communicates with content.js via CustomEvents on document

function tryExtractCache(attemptsLeft) {
  const app = document.querySelector('#app');
  if (app && app.__vue_app__) {
    try {
      const cache = app.__vue_app__.config.globalProperties
        .$apolloProvider.defaultClient.cache.extract();
      document.dispatchEvent(new CustomEvent('exec-response-cache', {
        detail: JSON.stringify({ cache: cache })
      }));
      return;
    } catch (e) {
      document.dispatchEvent(new CustomEvent('exec-response-cache', {
        detail: JSON.stringify({ error: e.message })
      }));
      return;
    }
  }
  // Vue not ready yet — retry
  if (attemptsLeft > 0) {
    setTimeout(() => tryExtractCache(attemptsLeft - 1), 500);
  } else {
    document.dispatchEvent(new CustomEvent('exec-response-cache', {
      detail: JSON.stringify({ error: 'Vue app not found after retries' })
    }));
  }
}

document.addEventListener('exec-request-cache', () => {
  tryExtractCache(10); // retry up to 10 times (5 seconds)
});

console.log('[ExecLounge] page-bridge.js loaded in MAIN world');
