/* BestShopio Admin · Microsoft Clarity — prototype connection state.
   The UI is available by default. This local state only models a store having
   connected its Clarity project; a production implementation uses a server-side,
   per-store integration record and never stores provider credentials here. */
(function () {
  const KEY = 'bsio_clarity_connection_v1';
  const FALLBACK_DOMAIN = 'lovocross.com';

  function storefrontDomain() {
    return String((window.SITE && window.SITE.storefrontDomain) || FALLBACK_DOMAIN);
  }

  function defaults() {
    return { connected: false, projectId: '', domain: storefrontDomain(), connectedAt: '' };
  }

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!value || typeof value !== 'object') return defaults();
      return {
        connected: value.connected === true,
        projectId: String(value.projectId || ''),
        // The domain belongs to the store configuration, not to a merchant-entered
        // Clarity record. Always use the current canonical storefront domain.
        domain: storefrontDomain(),
        connectedAt: String(value.connectedAt || ''),
      };
    } catch (e) { return defaults(); }
  }

  function save(next) {
    const state = {
      connected: true,
      projectId: String(next.projectId || '').trim(),
      domain: storefrontDomain(),
      connectedAt: new Date().toISOString(),
    };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    return state;
  }

  function disconnect() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    return defaults();
  }

  window.DATA_CLARITY = { storageKey: KEY, defaultDomain: storefrontDomain() };
  window.ClarityConnection = { read: read, save: save, disconnect: disconnect };
})();
