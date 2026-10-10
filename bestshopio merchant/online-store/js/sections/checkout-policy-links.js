/* Checkout · Policy Links (PRD §5.11) — store policy links in the checkout.
   New configuration capability. Each link targets a page chosen from the Online
   Store Pages. Links with no page selected are hidden; if all are empty the whole
   region is hidden. The link label is the SELECTED page's real title, and clicking
   opens a modal showing that page's content (layered above the preview, reusing the
   editor's .ck-modal-layer overlay pattern). This component is used on BOTH Checkout
   and Thank you, and its settings are a single fully-shared config across both pages
   (the editor mirrors setting writes between the two instances). */
(function () {
  if (!window.OS) return;
  const { esc } = OS;

  const CLOSE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  // The slot → key map. Order here is the rendered link order.
  const SLOTS = ['refund_policy_page', 'privacy_policy_page', 'terms_of_service_page', 'shipping_policy_page', 'contact_page'];

  function openPageModal(page) {
    document.querySelectorAll('.ck-modal-layer').forEach((n) => n.remove());
    const layer = document.createElement('div');
    layer.className = 'pop-layer ck-modal-layer';
    layer.style.zIndex = '260';
    const content = page.content || '<p>No content has been added to this page yet.</p>';
    layer.innerHTML =
      '<div class="ck-modal ck-policy-modal" role="dialog" aria-modal="true" aria-label="' + esc(page.title || 'Page') + '">' +
        '<div class="ck-modal-head"><h4>' + esc(page.title || 'Page') + '</h4>' +
          '<button class="ck-modal-x" type="button" data-x aria-label="Close">' + CLOSE + '</button></div>' +
        '<div class="ck-modal-body"><div class="ck-policy-doc">' + content + '</div></div>' +
      '</div>';
    document.body.appendChild(layer);

    const close = () => { layer.remove(); document.removeEventListener('keydown', onKey); };
    layer.addEventListener('mousedown', (e) => { if (e.target === layer) close(); });
    layer.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', close));
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
  }

  OS.register('checkout-policy-links', {
    name: 'Policy Links', icon: 'layers',
    // Required (locked) component, but can be hidden from the tree's eye toggle — merchants
    // who don't want policy links on a transaction template can switch the region off.
    hideable: true,
    schema: [
      { info: 'Choose the store policy pages shown on this transaction template.' },
      { key: 'refund_policy_page', label: 'Refund policy page', control: 'page', default: '' },
      { key: 'privacy_policy_page', label: 'Privacy policy page', control: 'page', default: '' },
      { key: 'terms_of_service_page', label: 'Terms of service page', control: 'page', default: '' },
      { key: 'shipping_policy_page', label: 'Shipping policy page', control: 'page', default: '' },
      { key: 'contact_page', label: 'Contact page', control: 'page', default: '' },
      { sub: 'Style' },
      { key: 'link_color', label: 'Link color', control: 'color', default: '', info: 'Leave empty to inherit the Accent color.' },
      { key: 'text_size', label: 'Text size', control: 'select', default: 'small', options: [
        { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' } ] },
    ],
    render(s, blocks, ctx) {
      const pages = (ctx.sample && ctx.sample.pages) || [];
      // Each configured slot resolves to its selected page; render the page's real
      // title (not a fixed slot label). Slots with no / unknown page are hidden.
      const links = SLOTS
        .map((k) => pages.find((p) => p.id === s[k]))
        .filter(Boolean);
      if (!links.length) {
        return '<div class="cksec ck-policy-empty">No policy pages selected — this region is hidden on the live checkout.</div>';
      }
      const color = s.link_color || 'var(--ck-accent)';
      const cls = 'ck-policy' + (s.text_size === 'medium' ? ' med' : '');
      return '<div class="cksec"><div class="' + cls + '">' +
        links.map((p) => '<a href="#" style="color:' + color + '" data-ck-policy-page="' + esc(p.id) + '">' + esc(p.title) + '</a>').join('') +
      '</div></div>';
    },
    hydrate(el, settings, blocks, ctx) {
      const pages = (ctx && ctx.sample && ctx.sample.pages) || [];
      el.querySelectorAll('[data-ck-policy-page]').forEach((a) => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const page = pages.find((p) => p.id === a.getAttribute('data-ck-policy-page'));
          if (page) openPageModal(page);
        });
      });
    },
  });

  OS.css('ck-policy-modal', `
  .ck-policy-modal{max-width:560px}
  .ck-policy-doc{font-size:var(--ck-base-fs);line-height:1.6;color:var(--ck-text)}
  .ck-policy-doc p{margin:0 0 12px}
  .ck-policy-doc p:last-child{margin-bottom:0}
  .ck-policy-doc strong{font-weight:var(--ck-fw-h)}
  `);
})();
