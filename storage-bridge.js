/* Adapts the desktop planner's chrome.storage API to browser localStorage. */
window.chrome = window.chrome || {};
chrome.storage = chrome.storage || {};
chrome.storage.local = {
  async get(key) {
    const result = {};
    if (Array.isArray(key)) key.forEach(name => { try { result[name] = JSON.parse(localStorage.getItem(name)); } catch { result[name] = null; } });
    else {
      try { result[key] = JSON.parse(localStorage.getItem(key)); } catch { result[key] = null; }
      // Preserve the state written by the earlier mobile card implementation.
      if (key === 'camp-assistant-state-v1' && !result[key]) {
        try { result[key] = JSON.parse(localStorage.getItem('camp-mobile-state.v2')); } catch { result[key] = null; }
      }
    }
    return result;
  },
  async set(values) {
    Object.entries(values).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
  }
};
