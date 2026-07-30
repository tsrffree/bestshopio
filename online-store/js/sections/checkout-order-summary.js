/* Checkout · Order Summary (PRD §5.10) — the order confirmation surface.
   Reuses the order calculation service; amounts here are mock and illustrative.
   Children (Cart Lines / Coupon / Subtotal / Discount / Shipping / Tax / Total)
   are locked blocks — selectable & configurable but not addable / removable. */
(function () {
  if (!window.OS) return;
  const { esc, money, ckFloat } = OS;

  const blk = (id, html, sel) => '<div class="ck-blk' + (sel ? ' os-block-sel' : '') + '" data-block-id="' + esc(id) + '">' + html + '</div>';
  const TAG = '<svg class="ck-tag-i" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';

  OS.register('checkout-order-summary', {
    name: 'Order Summary', icon: 'cart',
    schema: [
      { key: 'heading', label: 'Heading', control: 'text', default: 'Order summary' },
      { key: 'show_heading_pc', label: 'Show heading · PC', control: 'toggle', default: false },
      { key: 'show_heading_mobile', label: 'Show heading · Mobile', control: 'toggle', default: true },
      { key: 'mobile_default', label: 'Mobile default state', control: 'select', default: 'collapsed', options: [
        { value: 'collapsed', label: 'Collapsed' }, { value: 'expanded', label: 'Expanded' } ] },
      { sub: 'Colors' },
      { key: 'background_color', label: 'Background color', control: 'color', default: '', info: 'Leave empty to inherit Checkout settings.' },
      { key: 'text_color', label: 'Text color', control: 'color', default: '' },
      { key: 'total_color', label: 'Total color', control: 'color', default: '' },
    ],
    blocks: { kinds: {
      'cart-lines': { name: 'Cart Lines', fields: [] },
      'coupon': { name: 'Coupon', fields: [
        { key: 'show_coupon', label: 'Show coupon', control: 'toggle', default: true },
        { key: 'placeholder', label: 'Placeholder', control: 'text', default: 'Discount code' },
      ] },
      'subtotal': { name: 'Subtotal', fields: [ { key: 'row_label', label: 'Label', control: 'text', default: 'Subtotal' } ] },
      'discount': { name: 'Discount', fields: [ { key: 'row_label', label: 'Label', control: 'text', default: 'Discount' } ] },
      'shipping': { name: 'Shipping', fields: [ { key: 'row_label', label: 'Label', control: 'text', default: 'Shipping' } ] },
      'tax': { name: 'Tax', fields: [ { key: 'row_label', label: 'Label', control: 'text', default: 'Taxes' } ] },
      'total': { name: 'Total', fields: [ { key: 'row_label', label: 'Label', control: 'text', default: 'Total' } ] },
    } },

    render(s, blocks, ctx) {
      // Thank-you page reads the Final Order Snapshot (read-only final order,
      // Checkout items + accepted upsell/downsell) instead of the live cart, and
      // hides every interactive bit — no coupon input, no editable qty (PRD §5.3/§14).
      const snap = ctx.snapshot;
      const mock = ctx.checkout || {};
      // Live add-ons: upsell picks become extra cart lines; insurance / VIP become
      // their own summary rows (computed centrally in app.js, shared by every surface).
      const add = snap ? { rows: [], lines: [] } : (ctx.ckAddons || { rows: [], lines: [] });
      const cart = snap ? (snap.lines || []) : (mock.cart || []).concat(add.lines || []);
      const cur = (snap ? snap.currency : mock.currency) || 'USD';
      const find = (k) => (blocks || []).find((b) => b.kind === k) || { id: '', settings: {} };
      const sel = ctx.selectedBlockId;

      const subtotal = snap ? (snap.subtotal != null ? snap.subtotal : cart.reduce((t, l) => t + l.price * l.qty, 0)) : cart.reduce((t, l) => t + l.price * l.qty, 0);
      // Shipping selection is shared runtime state (Item 1/3) so the summary follows
      // whichever method is chosen in the Delivery card / Shipping Method section.
      const shipId = ((OS.ckState || {})['ck-shipping'] || {}).id || mock.selectedShipping;
      const ship = (mock.shippingMethods || []).find((m) => m.id === shipId) || (mock.shippingMethods || [])[0] || { price: 0 };
      const shipPrice = snap ? (snap.shipping || 0) : (ship.price || 0);
      // Applied coupons live in a shared runtime key so every summary surface (PC,
      // mobile, top bar) reflects the same discounts. Multiple coupons can stack —
      // each carries its own {product, order, shipping} breakdown. Default: none.
      // Applied discounts. Checkout reads the live coupon runtime; Thank you reads the
      // read-only snapshot breakdown (same {code, product, order, shipping} shape) so both
      // surfaces itemise identically.
      const appliedList = snap ? (snap.discounts || []) : (((OS.ckState || {})['ck-coupons']) || []);
      // Item 2 — Shopify itemises discounts into three types: product (line-item),
      // order, and shipping. Each type sums across every applied coupon; each non-zero
      // type renders its own row and all of them deduct from the Total.
      const dProduct = appliedList.reduce((t, c) => t + (+c.product || 0), 0);
      const dOrder = appliedList.reduce((t, c) => t + (+c.order || 0), 0);
      const dShip = appliedList.reduce((t, c) => t + (+c.shipping || 0), 0);
      const discount = dProduct + dOrder + dShip;
      const tax = snap ? (snap.tax || 0) : (mock.tax || 0);
      const addonTotal = (add.rows || []).reduce((t, r) => t + (+r.amount || 0), 0);
      const total = snap ? (snap.total != null ? snap.total : subtotal - discount + shipPrice + tax) : subtotal - discount + shipPrice + tax + addonTotal;
      const itemCount = cart.reduce((t, l) => t + l.qty, 0);
      const lineSavings = cart.reduce((t, l) => t + (l.compareAt && l.compareAt > l.price ? (l.compareAt - l.price) * l.qty : 0), 0);
      const savings = lineSavings + discount;

      const bg = s.background_color || 'var(--ck-sum-bg)';
      const txt = s.text_color || 'var(--ck-sum-text)';
      const totalColor = s.total_color || txt;

      // ---- cart lines block ----
      const lb = find('cart-lines');
      const imgHtml = (src, qty, extra) => '<div class="ck-line-img' + (extra || '') + '" style="background-image:url(' + esc(src) + ')"><span class="ck-line-qty">' + (qty == null ? 1 : qty) + '</span></div>';
      const lines = cart.map((l) => {
        const cmp = l.compareAt && l.compareAt > l.price ? '<span class="ck-line-cmp">' + money(l.compareAt) + '</span>' : '';
        const deal = (l.deal && l.compareAt && l.compareAt > l.price)
          ? '<div class="ck-line-deal">' + TAG + '<span>' + esc(l.deal) + ' (−' + money((l.compareAt - l.price) * l.qty) + ')</span></div>' : '';
        // Final-order lines may carry an accepted upsell/downsell flag (PRD §14.4).
        const flag = l.upsell ? '<span class="ck-line-flag">Added offer</span>' : (l.downsell ? '<span class="ck-line-flag">Special offer</span>' : '');
        const variantHtml = l.variant ? '<div class="ck-line-v">' + esc(l.variant) + '</div>' : '';
        // Item 3 — subscription cadence tag (the (−$x) is the subscription saving).
        const subTag = l.subscription
          ? '<div class="ck-line-sub">' + TAG + '<span>' + esc(l.subscription.label) +
            (l.subscription.save ? ' (−' + money(l.subscription.save) + ')' : '') + '</span></div>' : '';
        // Item 3 — bundle parent: black "Bundle" badge instead of the thumb, then
        // indented "Included" children (small thumb + orange pill, no own price).
        if (l.bundle) {
          const kids = (l.bundleItems || []).map((c) =>
            '<div class="ck-bundle-child">' +
              imgHtml(c.image, c.qty, ' sm') +
              '<div class="ck-line-info"><div class="ck-line-t"><span class="ck-line-included">Included</span>' + esc(c.title) + '</div>' +
              (c.variant ? '<div class="ck-line-v">' + esc(c.variant) + '</div>' : '') + '</div>' +
            '</div>').join('');
          return '<div class="ck-line ck-line--bundle">' +
              '<div class="ck-line-bundle-badge">Bundle</div>' +
              '<div class="ck-line-info"><div class="ck-line-t">' + esc(l.title) + flag + '</div>' + variantHtml + deal + '</div>' +
              '<div class="ck-line-pr">' + cmp + money(l.price * l.qty) + '</div>' +
            '</div>' + kids;
        }
        return '<div class="ck-line">' +
          imgHtml(l.image, l.qty) +
          '<div class="ck-line-info"><div class="ck-line-t">' + esc(l.title) + flag + '</div>' + variantHtml + subTag + deal + '</div>' +
          '<div class="ck-line-pr">' + cmp + money(l.price * l.qty) + '</div>' +
        '</div>';
      }).join('');
      const linesBlk = blk(lb.id, '<div class="ck-lines">' + lines + '</div>', sel === lb.id);

      // ---- coupon block ---- (read-only on Thank you: no coupon entry, PRD §5.3)
      // The discount-code input + Apply ALWAYS stay visible. Each applied coupon
      // renders as its own chip row below the input (multiple coupons can stack);
      // removing one via "×" drops just that coupon and re-applying still works.
      const cb = find('coupon'); const cs = cb.settings || {};
      let couponInner = '<div class="ck-coupon">' + ckFloat('<input class="ck-input" data-ck-coupon-input placeholder="' + esc(cs.placeholder || 'Discount code') + '">', cs.placeholder || 'Discount code') + '<button class="ck-coupon-btn" type="button" data-ck-apply>Apply</button></div>' +
        '<div class="ck-coupon-err" data-ck-coupon-err hidden></div>';
      couponInner += appliedList.map((c) => {
        const off = (+c.product || 0) + (+c.order || 0) + (+c.shipping || 0);
        return '<div class="ck-coupon-applied below" data-ck-coupon-applied>' +
          '<span class="ck-coupon-chip">' + TAG + '<span class="code">' + esc(c.code) + '</span>' +
          '<button class="ck-coupon-x" type="button" data-ck-coupon-remove="' + esc(c.code) + '" aria-label="Remove discount">×</button></span>' +
          '<span class="ck-coupon-off">−' + money(off) + '</span>' +
        '</div>';
      }).join('');
      const couponBlk = (snap || cs.show_coupon === false) ? '' : blk(cb.id, couponInner, sel === cb.id);

      // ---- totals ----
      const row = (b, val, opts) => {
        opts = opts || {};
        const bs = (b.settings || {});
        const lbl = esc(bs.row_label || b.kind) + (opts.suffix || '') + (opts.info ? '<span class="ck-info" title="Calculated at the next step">?</span>' : '');
        return blk(b.id, '<div class="ck-trow"><span class="lbl">' + lbl + '</span><span class="amt">' + val + '</span></div>', sel === b.id);
      };
      const sub = find('subtotal'), dis = find('discount'), shp = find('shipping'), tx = find('tax'), tot = find('total');
      const savingsLine = savings > 0 ? '<div class="ck-savings">' + TAG + '<span>Total savings ' + money(savings) + '</span></div>' : '';
      const addonRows = (add.rows || []).map((r) => '<div class="ck-trow ck-addon"><span class="lbl">' + esc(r.label) + '</span><span class="amt">' + money(r.amount) + '</span></div>').join('');
      // Item 2 — a separate discount row per non-zero type (Shopify-style labels), on both
      // Checkout and Thank you. On Thank you the coupon input is hidden, so the applied
      // discount code(s) render as read-only chip rows above the itemised amounts.
      const discRows = [];
      if (dProduct > 0) discRows.push(['Product discount', dProduct]);
      if (dOrder > 0) discRows.push(['Order discount', dOrder]);
      if (dShip > 0) discRows.push(['Shipping discount', dShip]);
      const codeRows = snap
        ? appliedList.filter((c) => c.code).map((c) =>
            '<div class="ck-trow ck-disc-code"><span class="lbl"><span class="ck-code-chip">' + TAG + '<span class="code">' + esc(c.code) + '</span></span></span><span class="amt"></span></div>').join('')
        : '';
      const discInner = codeRows + discRows.map((d) => '<div class="ck-trow ck-disc"><span class="lbl">' + esc(d[0]) + '</span><span class="amt">−' + money(d[1]) + '</span></div>').join('');
      const discountHtml = discInner
        ? blk(dis.id, discInner, sel === dis.id)
        : '';
      const totals = '<div class="ck-totals">' +
        row(sub, money(subtotal), { suffix: ' <span class="ck-itemc">· ' + itemCount + ' items</span>' }) +
        discountHtml +
        row(shp, shipPrice ? money(shipPrice) : 'Free') +
        row(tx, money(tax)) +
        addonRows +
        blk(tot.id, '<div class="ck-trow grand" style="color:' + totalColor + '"><span class="lbl">' + esc((tot.settings || {}).row_label || 'Total') + '</span><span class="amt"><span class="cur">' + esc(cur) + '</span>' + money(total) + '</span></div>', sel === tot.id) +
        savingsLine +
      '</div>';

      // ---- mobile (Shopify-style): collapsed = "Add discount" pill + recap bar;
      //      expanded = "Order summary" header + line items + discount code + totals ----
      if (ctx.mob) {
        const collapsed = (s.mobile_default || 'collapsed') === 'collapsed';
        const head = s.heading || 'Order summary';
        // Thank-you (snapshot present) uses a clean Shopify-style collapsed header:
        // "Order summary ⌄" on the left, grand total on the right — no thumbnail or item
        // count. Gated on `snap` so the Checkout mobile recap card below is untouched.
        if (snap) {
          return '<div class="ck-summary mob tymob' + (collapsed ? ' collapsed' : '') + '" data-ck-summary style="background:' + bg + ';color:' + txt + '">' +
            '<button class="ck-tymsum-head" type="button" data-ck-sum-toggle>' +
              '<span class="ck-tymsum-title">' + esc(head) + '<span class="ck-tymsum-chev">▾</span></span>' +
              '<span class="ck-tymsum-total" style="color:' + totalColor + '"><span class="cur">' + esc(cur) + '</span>' + money(total) + '</span>' +
            '</button>' +
            '<div class="ck-summary-body">' + linesBlk + totals + '</div>' +
          '</div>';
        }
        const thumb = cart[0] ? '<div class="ck-msum-thumb" style="background-image:url(' + esc(cart[0].image) + ')"></div>' : '';
        const savLine = savings > 0 ? '<div class="ck-msum-sav">' + TAG + '<span>Total savings ' + money(savings) + '</span></div>' : '';
        return '<div class="ck-summary mob' + (collapsed ? ' collapsed' : '') + '" data-ck-summary style="background:' + bg + ';color:' + txt + '">' +
          (snap ? '' : '<button class="ck-msum-adddisc" type="button" data-ck-sum-toggle>' + TAG + '<span>Add discount</span></button>') +
          '<div class="ck-msum-bar" data-ck-sum-toggle>' +
            thumb +
            '<div class="ck-msum-meta">' +
              '<span class="ck-msum-lbl ck-when-collapsed">Total</span>' +
              (s.show_heading_mobile === false ? '' : '<span class="ck-msum-lbl ck-when-expanded">' + esc(head) + '</span>') +
              '<span class="ck-msum-items ck-when-collapsed">' + itemCount + ' items</span>' +
            '</div>' +
            '<div class="ck-msum-amt">' +
              '<span class="amt" style="color:' + totalColor + '"><span class="cur">' + esc(cur) + '</span>' + money(total) + ' <span class="ck-chev">▾</span></span>' +
              savLine +
            '</div>' +
            '<span class="ck-chev-exp ck-when-expanded">▾</span>' +
          '</div>' +
          '<div class="ck-summary-body">' + linesBlk + couponBlk + totals + '</div>' +
        '</div>';
      }

      // Desktop: the surface colour is painted as a full-bleed band behind the side column
      // (see app.js .ckcol.side::before, driven by --ck-sum-bg), so the panel itself stays
      // transparent here — only carry the text colour when overridden.
      const heading = s.show_heading_pc ? '<h3 class="ck-sum-h">' + esc(s.heading || 'Order summary') + '</h3>' : '';
      return '<div class="ck-summary" style="color:' + txt + '">' + heading + linesBlk + couponBlk + totals + '</div>';
    },

    hydrate(el) {
      const wrap = el.querySelector('[data-ck-summary]');
      if (wrap) el.querySelectorAll('[data-ck-sum-toggle]').forEach((t) => {
        t.addEventListener('click', (e) => { e.stopPropagation(); wrap.classList.toggle('collapsed'); });
      });
      const apply = el.querySelector('[data-ck-apply]');
      if (apply) {
        const input = el.querySelector('[data-ck-coupon-input]');
        const err = el.querySelector('[data-ck-coupon-err]');
        const showErr = (msg) => { if (err) { err.textContent = msg; err.removeAttribute('hidden'); } };
        apply.addEventListener('click', () => {
          const code = (input && input.value || '').trim();
          if (err) err.setAttribute('hidden', '');
          if (!code) { if (input) input.focus(); return; }
          apply.textContent = 'Applying…'; apply.disabled = true;
          setTimeout(() => {
            const codes = (OS.data && OS.data.CHECKOUT_MOCK && OS.data.CHECKOUT_MOCK.coupons) || {};
            const key = code.toUpperCase();
            const entry = codes[key];
            if (entry == null) {
              apply.textContent = 'Apply'; apply.disabled = false;
              showErr('Enter a valid discount code');
              return;
            }
            const list = ((OS.ckState || {})['ck-coupons'] || []).slice();
            if (list.some((c) => c.code === key)) {
              apply.textContent = 'Apply'; apply.disabled = false;
              showErr('This code is already applied');
              return;
            }
            // Item 2 — normalise to a {product, order, shipping} breakdown. A plain
            // number is treated as a product discount (backward-compat). Multiple
            // coupons stack, so push onto the shared list (dedupe by code above).
            const norm = (typeof entry === 'number') ? { product: entry } : (entry || {});
            const product = +norm.product || 0, order = +norm.order || 0, shipping = +norm.shipping || 0;
            list.push({ code: key, product: product, order: order, shipping: shipping, amount: product + order + shipping });
            OS.ckState['ck-coupons'] = list;
            OS.ckRecalc();
          }, 600);
        });
      }
      el.querySelectorAll('[data-ck-coupon-remove]').forEach((remove) => remove.addEventListener('click', (e) => {
        e.preventDefault();
        const code = remove.getAttribute('data-ck-coupon-remove');
        OS.ckState['ck-coupons'] = ((OS.ckState || {})['ck-coupons'] || []).filter((c) => c.code !== code);
        OS.ckRecalc();
      }));
    },
  });
})();
