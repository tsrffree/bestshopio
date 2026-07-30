/* Checkout · Product upsell (Commerce PRD §7) — "Customers Also Grabbed".
   A transaction-enhancement component: recommends extra products on the checkout
   and lets the buyer add them in one tap (checkbox) with a quantity stepper.
   Addable / hideable / deletable / draggable (unlike the required components).
   In this prototype add / qty are visual toggles — the static mock Order Summary
   is not recalculated live (same limitation as the coupon / shipping interactions). */
(function () {
  if (!window.OS) return;
  const { esc, money } = OS;
  // Per-section slider scroll offset, preserved across canvas re-renders (see hydrate).
  const scrollMem = {};

  const ARROW = (d) => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
    (d === 'prev' ? '<path d="M15 18l-6-6 6-6"/>' : '<path d="M9 18l6-6-6-6"/>') + '</svg>';
  const CHECK = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

  OS.register('checkout-product-upsell', {
    name: 'Product upsell', icon: 'tag',
    defaultZone: 'cta',
    schema: [
      { info: 'Recommends extra products on the checkout. Buyers add them in one tap; the Order Summary updates.' },
      { key: 'heading', label: 'Heading', control: 'text', default: 'Customers Also Grabbed', placeholder: 'Customers Also Grabbed' },
      { key: 'product_source', label: 'Product source', control: 'select', default: 'manual', options: [
        { value: 'manual', label: 'Manual products' }, { value: 'collection', label: 'Collection' } ] },
      { key: 'products', label: 'Products', control: 'product', default: '', info: 'Up to 6 products.', visibleWhen: (v) => (v.product_source || 'manual') === 'manual' },
      { key: 'collection', label: 'Collection', control: 'collection', default: '', visibleWhen: (v) => v.product_source === 'collection' },
      { key: 'products_limit', label: 'Products limit', control: 'number', default: 4, min: 1, max: 6, info: 'Max products shown on the storefront.' },
      { key: 'default_selected', label: 'Default-checked products', control: 'product', default: '', info: 'Pre-ticked when the page loads (added to the Order Summary). Should be among the products above; buyers can still untick them.' },
      { sub: 'Layout' },
      { key: 'layout_desktop', label: 'Layout · Desktop', control: 'select', default: 'slider', options: [
        { value: 'slider', label: 'Slider' }, { value: 'grid', label: 'Grid' } ] },
      { key: 'layout_mobile', label: 'Layout · Mobile', control: 'select', default: 'slider', options: [
        { value: 'slider', label: 'Slider' }, { value: 'grid', label: 'Grid' } ] },
      { key: 'per_row_desktop', label: 'Products per row · Desktop', control: 'number', default: 2, min: 1, max: 4, visibleWhen: (v) => (v.layout_desktop || 'slider') === 'grid' },
      { key: 'per_row_mobile', label: 'Products per row · Mobile', control: 'number', default: 1, min: 1, max: 2, visibleWhen: (v) => (v.layout_mobile || 'slider') === 'grid' },
      { sub: 'Display' },
      { key: 'show_image', label: 'Show product image', control: 'toggle', default: true },
      { key: 'show_title', label: 'Show product title', control: 'toggle', default: true },
      { key: 'show_variant', label: 'Show variant title', control: 'toggle', default: true },
      { key: 'show_price', label: 'Show price', control: 'toggle', default: true },
      { key: 'show_compare', label: 'Show compare price', control: 'toggle', default: true },
      { sub: 'Add to order' },
      { key: 'cta_style', label: 'CTA style', control: 'select', default: 'plus', options: [
        { value: 'plus', label: 'Plus / stepper' }, { value: 'button', label: 'Button' } ] },
      { key: 'cta_text', label: 'CTA text', control: 'text', default: 'Add', placeholder: 'Add', visibleWhen: (v) => v.cta_style === 'button' },
      { sub: 'Colors' },
      { key: 'background_color', label: 'Background color', control: 'color', default: '', info: 'Leave empty to inherit Checkout settings.' },
      { key: 'text_color', label: 'Text color', control: 'color', default: '' },
      { key: 'border_color', label: 'Border color', control: 'color', default: '', info: 'Card border. Empty inherits the divider color.' },
      { key: 'border_radius', label: 'Border radius', control: 'number', default: 8, min: 0, max: 24 },
      { sub: 'Advanced' },
      { key: 'custom_css', label: 'Custom CSS', control: 'custom_css', default: '', info: 'Applies to this component only.' },
    ],
    defaults() { return { products: ['p3', 'p4', 'p5'] }; },

    render(s, blocks, ctx) {
      const S = ctx.sample || {};
      const all = S.products || [];
      const limit = Math.max(1, Math.min(6, +s.products_limit || 4));
      let ids = [];
      if ((s.product_source || 'manual') === 'manual') {
        ids = Array.isArray(s.products) ? s.products : (s.products ? [s.products] : []);
      } else {
        ids = all.map((p) => p.id); // prototype: a collection simply yields the sample catalog
      }
      // PRD §7.6 — exclude products already in the checkout. The mock cart lines carry
      // their own ids, so match on id OR title against the sample catalog.
      const cart = (ctx.checkout && ctx.checkout.cart) || [];
      const inCart = new Set();
      cart.forEach((l) => { if (l.id != null) inCart.add(String(l.id)); if (l.title) inCart.add(String(l.title).toLowerCase()); });
      const noSelection = !ids.length;
      let items = ids.map((id) => all.find((p) => p.id === id)).filter(Boolean)
        .filter((p) => !inCart.has(String(p.id)) && !inCart.has(String(p.title).toLowerCase()));
      if (!items.length) {
        const msg = noSelection ? 'Select products to recommend on the checkout.' : 'No products to recommend — the selected products are already in the cart.';
        return '<div class="cksec ckup"><h3 class="ck-h">' + esc(s.heading || 'Customers Also Grabbed') + '</h3>' +
          '<div class="ck-empty">' + msg + '</div></div>';
      }
      items = items.slice(0, limit);

      const isGrid = (ctx.mob ? (s.layout_mobile || 'slider') : (s.layout_desktop || 'slider')) === 'grid';
      const cols = ctx.mob ? Math.max(1, Math.min(2, +s.per_row_mobile || 1)) : Math.max(1, Math.min(4, +s.per_row_desktop || 2));
      const radius = (s.border_radius == null ? 8 : s.border_radius);
      const border = s.border_color || 'var(--ck-divider)';
      const cardBg = s.background_color || 'var(--ck-page-bg)';
      const txt = s.text_color || 'var(--ck-text)';
      const store = (OS.ckState || {})[ctx.sectionId] || {};
      const storeItems = store.items || {};
      const storeVars = store.variants || {};
      // Products pre-ticked on load. The buyer's explicit choices (storeItems, where an explicit 0
      // means "unticked") always win; products with no explicit state fall back to this default.
      const defSel = Array.isArray(s.default_selected) ? s.default_selected : (s.default_selected ? [s.default_selected] : []);
      const defSet = new Set(defSel);
      const effQty = (pid) => (Object.prototype.hasOwnProperty.call(storeItems, pid)
        ? (parseInt(storeItems[pid], 10) || 0)
        : (defSet.has(pid) ? 1 : 0));

      const cards = items.map((p) => {
        // Multi-variant products get an on-card variant selector (the buyer picks). Single-
        // /no-variant products use their own price with no selector. The chosen variant
        // drives the card price and the order-summary line.
        const variants = Array.isArray(p.variants) ? p.variants : [];
        const hasChoice = variants.length > 1;
        const chosen = variants.length ? (variants.find((v) => v.id === storeVars[p.id]) || variants[0]) : null;
        const vPrice = chosen ? chosen.price : p.price;
        const vCompare = chosen ? (chosen.compareAt || 0) : (p.compareAt || 0);
        const vLabel = chosen ? chosen.title : (p.vendor || '');
        const qty = Math.max(0, effQty(p.id));
        const checked = qty > 0;
        const dispQty = checked ? qty : 1;
        const img = s.show_image !== false ? '<div class="ckup-thumb" style="background-image:url(' + esc(p.image) + ')"></div>' : '';
        const title = s.show_title !== false ? '<div class="ckup-title">' + esc(p.title) + '</div>' : '';
        const variant = hasChoice
          ? '<div class="ckup-vwrap"><select class="ckup-vsel" data-ckup-vsel data-pid="' + esc(p.id) + '" aria-label="Choose variant">' +
              variants.map((v) => '<option value="' + esc(v.id) + '"' + (chosen && v.id === chosen.id ? ' selected' : '') + '>' + esc(v.title) + '</option>').join('') +
            '</select></div>'
          : ((s.show_variant !== false && vLabel) ? '<div class="ckup-variant">' + esc(vLabel) + '</div>' : '');
        const cmp = (s.show_compare !== false && vCompare && vCompare > vPrice) ? '<s class="ckup-cmp">' + money(vCompare) + '</s>' : '';
        const price = s.show_price !== false ? '<div class="ckup-price"><span class="ckup-now">' + money(vPrice) + '</span>' + cmp + '</div>' : '<div class="ckup-price"></div>';
        const control = (s.cta_style === 'button')
          ? '<button class="ckup-addbtn' + (checked ? ' on' : '') + '" type="button" data-ckup-add>' + esc(s.cta_text || 'Add') + '</button>'
          : '<div class="ckup-step" data-ckup-step>' +
              '<button type="button" data-step="-1" aria-label="Decrease">−</button>' +
              '<span class="ckup-qty">' + dispQty + '</span>' +
              '<button type="button" data-step="1" aria-label="Increase">+</button>' +
            '</div>';
        return '<div class="ckup-card' + (checked ? ' sel' : '') + '" data-ckup-card data-pid="' + esc(p.id) + '" style="border-color:' + border + ';border-radius:' + radius + 'px;background:' + cardBg + '">' +
          '<div class="ckup-row1">' +
            '<span class="ckup-check' + (checked ? ' on' : '') + '" data-ckup-check role="checkbox" aria-checked="' + (checked ? 'true' : 'false') + '">' + CHECK + '</span>' +
            title +
          '</div>' +
          '<div class="ckup-row2">' + img +
            '<div class="ckup-info">' + variant +
              '<div class="ckup-foot">' + price + control + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');

      const arrows = (!isGrid)
        ? '<div class="ckup-arrows"><button class="ckup-arrow" type="button" data-ckup-prev>' + ARROW('prev') + '</button>' +
          '<button class="ckup-arrow on" type="button" data-ckup-next>' + ARROW('next') + '</button></div>'
        : '';
      const trackStyle = isGrid ? '--ckup-cols:' + cols : '';
      const css = s.custom_css ? '<style>' + s.custom_css + '</style>' : '';
      return '<div class="cksec ckup" style="color:' + txt + '">' +
        '<div class="ckup-head"><h3 class="ck-h">' + esc(s.heading || 'Customers Also Grabbed') + '</h3>' + arrows + '</div>' +
        '<div class="ckup-track' + (isGrid ? ' grid' : '') + '" data-ckup-track style="' + trackStyle + '">' + cards + '</div>' +
        css + '</div>';
    },

    hydrate(el, settings, blocks, ctx) {
      const id = ctx && ctx.sectionId;
      const track = el.querySelector('[data-ckup-track]');
      if (track) {
        // Toggling a product re-renders the whole checkout canvas, which would reset the
        // slider to the first card. Remember the scroll offset per section and restore it
        // so selecting the last card no longer snaps the slider back to the start.
        if (id && scrollMem[id] != null) {
          track.scrollLeft = scrollMem[id];
          requestAnimationFrame(() => { track.scrollLeft = scrollMem[id]; });
        }
        if (id) track.addEventListener('scroll', () => { scrollMem[id] = track.scrollLeft; }, { passive: true });
        const step = () => { const c = track.querySelector('.ckup-card'); return c ? c.getBoundingClientRect().width + 14 : 260; };
        const prev = el.querySelector('[data-ckup-prev]'); const next = el.querySelector('[data-ckup-next]');
        if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
        if (next) next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
      }
      const setItem = (pid, qty) => {
        if (!id) return;
        const cur = ((OS.ckState[id] && OS.ckState[id].items) ? Object.assign({}, OS.ckState[id].items) : {});
        // Store an explicit 0 (not delete) so unticking a default-checked product sticks instead of
        // falling back to the "default_selected" pre-tick.
        cur[pid] = qty > 0 ? qty : 0;
        OS.ckSet(id, { items: cur }); OS.ckRecalc();
      };
      const setVar = (pid, vid) => {
        if (!id) return;
        const cur = ((OS.ckState[id] && OS.ckState[id].variants) ? Object.assign({}, OS.ckState[id].variants) : {});
        cur[pid] = vid;
        OS.ckSet(id, { variants: cur }); OS.ckRecalc();
      };
      el.querySelectorAll('[data-ckup-vsel]').forEach((sel) => {
        sel.addEventListener('click', (e) => e.stopPropagation());
        sel.addEventListener('change', (e) => { e.stopPropagation(); setVar(sel.getAttribute('data-pid'), sel.value); });
      });
      el.querySelectorAll('[data-ckup-card]').forEach((card) => {
        const pid = card.getAttribute('data-pid');
        const chk = card.querySelector('[data-ckup-check]');
        const qEl = card.querySelector('.ckup-qty');
        const setOn = (on) => { card.classList.toggle('sel', on); if (chk) { chk.classList.toggle('on', on); chk.setAttribute('aria-checked', on ? 'true' : 'false'); } };
        const curQty = () => Math.max(1, parseInt(qEl ? qEl.textContent : '1', 10) || 1);
        if (chk) chk.addEventListener('click', (e) => { e.stopPropagation(); const on = !chk.classList.contains('on'); setOn(on); setItem(pid, on ? curQty() : 0); });
        const add = card.querySelector('[data-ckup-add]');
        if (add) add.addEventListener('click', (e) => { e.stopPropagation(); const on = !card.classList.contains('sel'); setOn(on); add.classList.toggle('on', on); setItem(pid, on ? 1 : 0); });
        const stepper = card.querySelector('[data-ckup-step]');
        if (stepper) {
          stepper.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', (e) => {
            e.stopPropagation();
            let n = parseInt(qEl.textContent, 10) || 1; n += parseInt(b.getAttribute('data-step'), 10);
            if (n < 1) n = 1; qEl.textContent = n; setOn(true); setItem(pid, n);
          }));
        }
      });
    },
  });

  OS.css('ckup', `
  .ckup-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
  .ckup-head .ck-h{margin:0}
  .ckup-arrows{display:flex;gap:8px;flex:none}
  .ckup-arrow{width:30px;height:30px;border-radius:50%;border:0;display:inline-flex;align-items:center;justify-content:center;
    background:#e6e6e6;color:#9a9a9a;cursor:pointer;transition:background .15s,color .15s}
  .ckup-arrow.on{background:var(--ck-accent);color:#fff}
  .ckup-arrow:hover{background:var(--ck-accent);color:#fff}
  .ckup-track{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding-bottom:4px}
  .ckup-track::-webkit-scrollbar{height:6px}
  .ckup-track::-webkit-scrollbar-thumb{background:var(--ck-divider);border-radius:3px}
  .ckup-track.grid{display:grid;grid-template-columns:repeat(var(--ckup-cols,2),1fr);overflow:visible}
  .ckup-card{flex:0 0 60%;scroll-snap-align:start;border:1px solid var(--ck-divider);box-sizing:border-box;padding:14px;transition:border-color .15s,box-shadow .15s}
  .ckup-track.grid .ckup-card{flex:none}
  .ckup-card.sel{border-color:var(--ck-accent);box-shadow:0 0 0 1px var(--ck-accent) inset}
  .ckpage.mob .ckup-track:not(.grid) .ckup-card{flex:0 0 84%}
  .ckup-row1{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}
  .ckup-check{flex:none;width:20px;height:20px;border:1.5px solid var(--ck-input-border);border-radius:5px;display:inline-flex;align-items:center;justify-content:center;
    color:#fff;background:transparent;cursor:pointer;transition:background .12s,border-color .12s;margin-top:1px}
  .ckup-check svg{opacity:0;transition:opacity .12s}
  .ckup-check.on{background:var(--ck-accent);border-color:var(--ck-accent)}
  .ckup-check.on svg{opacity:1}
  .ckup-title{font-size:var(--ck-base-fs);font-weight:600;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .ckup-row2{display:flex;gap:12px;align-items:stretch}
  .ckup-thumb{flex:none;width:76px;height:76px;border-radius:8px;background-size:cover;background-position:center;background-color:#f1f1f1}
  .ckup-info{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between;gap:8px}
  .ckup-variant{font-size:var(--ck-small-fs);color:var(--ck-muted);line-height:1.4}
  .ckup-vwrap{position:relative}
  .ckup-vsel{width:100%;max-width:100%;box-sizing:border-box;appearance:none;-webkit-appearance:none;font-family:inherit;font-size:var(--ck-small-fs);color:var(--ck-text);
    background:var(--ck-input-bg,#fff);border:1px solid var(--ck-input-border);border-radius:var(--ck-input-radius,6px);padding:6px 26px 6px 10px;cursor:pointer;line-height:1.3}
  .ckup-vwrap::after{content:'';position:absolute;right:10px;top:50%;width:7px;height:7px;border-right:1.5px solid var(--ck-muted);border-bottom:1.5px solid var(--ck-muted);transform:translateY(-65%) rotate(45deg);pointer-events:none}
  .ckup-vsel:focus{outline:none;border-color:var(--ck-input-focus,var(--ck-accent))}
  .ckup-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
  .ckup-price{display:flex;align-items:baseline;gap:8px;min-height:20px}
  .ckup-now{font-size:var(--ck-base-fs);font-weight:700}
  .ckup-cmp{font-size:var(--ck-small-fs);color:var(--ck-muted)}
  .ckup-step{display:inline-flex;align-items:center;border:1px solid var(--ck-input-border);border-radius:8px;overflow:hidden}
  .ckup-step button{width:30px;height:30px;border:0;background:transparent;color:var(--ck-text);font-size:16px;cursor:pointer;line-height:1;display:inline-flex;align-items:center;justify-content:center}
  .ckup-step button:hover{background:var(--ck-divider)}
  .ckup-qty{min-width:30px;text-align:center;font-size:var(--ck-base-fs);font-weight:600}
  .ckup-addbtn{height:34px;padding:0 16px;border:1px solid var(--ck-accent);background:transparent;color:var(--ck-accent);border-radius:8px;font-family:inherit;font-size:var(--ck-small-fs);font-weight:600;cursor:pointer;transition:background .12s,color .12s}
  .ckup-addbtn.on,.ckup-addbtn:hover{background:var(--ck-accent);color:#fff}
  `);
})();
