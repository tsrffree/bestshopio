/* Checkout · Order Summary (top bar) — Shopify-style collapsible recap shown at the very
   top of the mobile checkout, right under the header. Mobile-only: on desktop the order
   summary lives in the right-hand column (see checkout-order-summary). This is a SEPARATE
   component from the bottom Order Summary so the two can be styled independently. */
(function () {
  if (!window.OS) return;
  const { esc, money, ckFloat } = OS;
  const TAG = '<svg class="ck-tag-i" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';

  OS.register('checkout-order-summary-bar', {
    name: 'Order Summary (top bar)', icon: 'cart',
    schema: [
      { info: 'Shown only on mobile, pinned under the header. Desktop uses the right-column Order Summary.' },
      { key: 'heading', label: 'Heading', control: 'text', default: 'Order summary' },
      { key: 'mobile_default', label: 'Default state', control: 'select', default: 'collapsed', options: [
        { value: 'collapsed', label: 'Collapsed' }, { value: 'expanded', label: 'Expanded' } ] },
      { sub: 'Colors' },
      { key: 'background_color', label: 'Background color', control: 'color', default: '', info: 'Leave empty to inherit Checkout settings.' },
      { key: 'text_color', label: 'Text color', control: 'color', default: '' },
      { key: 'total_color', label: 'Total color', control: 'color', default: '' },
    ],

    render(s, blocks, ctx) {
      if (!ctx.mob) return ''; // top bar is mobile-only

      const mock = ctx.checkout || {};
      // On Thank you this bar is the ONLY mobile summary (the desktop full Order Summary
      // is desktop-only there). So when a Final Order Snapshot is present, read it — the
      // same source the desktop full summary uses — so the total reflects the real order,
      // not the live checkout cart. On Checkout (no snapshot) it keeps reading the cart.
      const snap = ctx.snapshot;
      const add = snap ? { rows: [], lines: [] } : (ctx.ckAddons || { rows: [], lines: [] });
      const cart = snap ? (snap.lines || []) : (mock.cart || []).concat(add.lines || []);
      const subtotal = snap ? (snap.subtotal != null ? snap.subtotal : cart.reduce((t, l) => t + l.price * l.qty, 0)) : cart.reduce((t, l) => t + l.price * l.qty, 0);
      const shipId = ((OS.ckState || {})['ck-shipping'] || {}).id || mock.selectedShipping;
      const ship = (mock.shippingMethods || []).find((m) => m.id === shipId) || (mock.shippingMethods || [])[0] || { price: 0 };
      const shipPrice = snap ? (snap.shipping || 0) : (ship.price || 0);
      // Reflect the applied coupons (shared runtime key) so this bar matches the
      // bottom Order Summary. Multiple coupons stack. Default: none → no discount.
      // The snapshot carries a single lump discount instead of live coupon rows.
      const appliedList = snap ? [] : ((OS.ckState || {})['ck-coupons'] || []);
      const dOrder = snap ? 0 : appliedList.reduce((t, c) => t + (+c.order || 0), 0);
      const dShip = snap ? 0 : appliedList.reduce((t, c) => t + (+c.shipping || 0), 0);
      const dProduct = snap ? (snap.discount || 0) : appliedList.reduce((t, c) => t + (+c.product || 0), 0);
      const discount = dProduct + dOrder + dShip;
      const tax = snap ? (snap.tax || 0) : (mock.tax || 0);
      const addonTotal = (add.rows || []).reduce((t, r) => t + (+r.amount || 0), 0);
      const total = snap ? (snap.total != null ? snap.total : subtotal - discount + shipPrice + tax) : subtotal - discount + shipPrice + tax + addonTotal;
      const compareTotal = cart.reduce((t, l) => t + ((l.compareAt && l.compareAt > l.price ? l.compareAt : l.price) * l.qty), 0) + addonTotal;

      const collapsed = (s.mobile_default || 'collapsed') === 'collapsed';
      const bg = s.background_color || 'var(--ck-sum-bg)';
      const txt = s.text_color || 'var(--ck-sum-text)';
      const totalColor = s.total_color || 'var(--ck-text)';
      const head = s.heading || 'Order summary';

      const lines = cart.map((l) => {
        const cmp = l.compareAt && l.compareAt > l.price ? '<span class="ck-line-cmp">' + money(l.compareAt) + '</span>' : '';
        return '<div class="ck-line">' +
          '<div class="ck-line-img" style="background-image:url(' + esc(l.image) + ')"><span class="ck-line-qty">' + l.qty + '</span></div>' +
          '<div class="ck-line-info"><div class="ck-line-t">' + esc(l.title) + '</div><div class="ck-line-v">' + esc(l.variant || '') + '</div></div>' +
          '<div class="ck-line-pr">' + cmp + money(l.price * l.qty) + '</div>' +
        '</div>';
      }).join('');
      // Match the full mobile Order Summary: the top component has the same discount-code
      // input, validation and removable applied-code chips. Both read/write ck-coupons, so
      // applying or removing a code in either summary updates both surfaces.
      let couponHtml = '';
      if (!snap) {
        couponHtml = '<div class="ck-coupon">' + ckFloat('<input class="ck-input" data-ck-coupon-input placeholder="Discount code">', 'Discount code') + '<button class="ck-coupon-btn" type="button" data-ck-apply>Apply</button></div>' +
          '<div class="ck-coupon-err" data-ck-coupon-err hidden></div>' +
          appliedList.map((c) => {
            const off = (+c.product || 0) + (+c.order || 0) + (+c.shipping || 0);
            return '<div class="ck-coupon-applied below" data-ck-coupon-applied>' +
              '<span class="ck-coupon-chip">' + TAG + '<span class="code">' + esc(c.code) + '</span>' +
              '<button class="ck-coupon-x" type="button" data-ck-coupon-remove="' + esc(c.code) + '" aria-label="Remove discount">×</button></span>' +
              '<span class="ck-coupon-off">−' + money(off) + '</span>' +
            '</div>';
          }).join('');
      }
      const trow = (lbl, val) => '<div class="ck-trow"><span class="lbl">' + esc(lbl) + '</span><span class="amt">' + val + '</span></div>';
      const addonRows = (add.rows || []).map((r) => trow(r.label, money(r.amount))).join('');
      const discRows = snap
        ? (discount > 0 ? trow('Discount', '−' + money(discount)) : '')
        : ((dProduct > 0 ? trow('Product discount', '−' + money(dProduct)) : '') +
          (dOrder > 0 ? trow('Order discount', '−' + money(dOrder)) : '') +
          (dShip > 0 ? trow('Shipping discount', '−' + money(dShip)) : ''));
      const totals = '<div class="ck-totals">' +
        trow('Subtotal', money(subtotal)) +
        discRows +
        trow('Shipping', shipPrice ? money(shipPrice) : 'Free') +
        trow('Taxes', money(tax)) +
        addonRows +
        '<div class="ck-trow grand" style="color:' + totalColor + '"><span class="lbl">Total</span><span class="amt">' + money(total) + '</span></div>' +
      '</div>';

      const cmpTop = compareTotal > total ? '<s class="ck-sumbar-cmp">' + money(compareTotal) + '</s>' : '';
      return '<div class="ck-sumbar' + (collapsed ? ' collapsed' : '') + '" data-ck-summary style="background:' + bg + ';color:' + txt + '">' +
        '<button class="ck-sumbar-head" type="button" data-ck-sum-toggle>' +
          '<span class="ck-sumbar-title">' + esc(head) + '<span class="ck-sumbar-chev">▾</span></span>' +
          '<span class="ck-sumbar-amt">' + cmpTop +
            '<span class="ck-sumbar-total" style="color:' + totalColor + '">' + money(total) + '</span>' +
          '</span>' +
        '</button>' +
        '<div class="ck-sumbar-body"><div class="ck-lines">' + lines + '</div>' + couponHtml + totals + '</div>' +
      '</div>';
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
            const norm = (typeof entry === 'number') ? { product: entry } : (entry || {});
            const product = +norm.product || 0, order = +norm.order || 0, shipping = +norm.shipping || 0;
            list.push({ code: key, product: product, order: order, shipping: shipping, amount: product + order + shipping });
            OS.ckState['ck-coupons'] = list;
            OS.ckRecalc();
          }, 600);
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); apply.click(); }
        });
      }
      el.querySelectorAll('[data-ck-coupon-remove]').forEach((remove) => remove.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const code = remove.getAttribute('data-ck-coupon-remove');
        OS.ckState['ck-coupons'] = ((OS.ckState || {})['ck-coupons'] || []).filter((c) => c.code !== code);
        OS.ckRecalc();
      }));
    },
  });

  OS.css('ck-sumbar', `
  .ck-sumbar{width:100%;border-bottom:1px solid var(--ck-divider);box-sizing:border-box}
  .ck-sumbar-head{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;
    background:none;border:0;cursor:pointer;font-family:inherit;text-align:left;
    padding:14px var(--ck-mob-pad,18px)}
  .ck-sumbar-title{display:inline-flex;align-items:center;gap:8px;font-size:var(--ck-base-fs);font-weight:500;color:var(--ck-sum-text)}
  .ck-sumbar-chev{display:inline-block;font-size:12px;transition:transform .15s}
  .ck-sumbar:not(.collapsed) .ck-sumbar-chev{transform:rotate(180deg)}
  .ck-sumbar-amt{display:flex;flex-direction:column;align-items:flex-end;line-height:1.25}
  .ck-sumbar-cmp{font-size:12px;color:var(--ck-sum-muted);text-decoration:line-through}
  .ck-sumbar-total{font-size:17px;font-weight:700}
  .ck-sumbar-body{padding:0 var(--ck-mob-pad,18px) 16px}
  .ck-sumbar.collapsed .ck-sumbar-body{display:none}
  `);
})();
