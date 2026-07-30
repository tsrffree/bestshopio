/* Checkout · Shipping Information (PRD §5.4) — delivery address.
   Signed OUT: the classic empty address form (country/state linkage, validation,
   shipping & tax refresh). Signed IN (Item 1): a bordered account card with two
   accordion rows — "Ship to" (a radio list of the account's saved addresses, each
   with an Edit/Delete kebab + an "Add address" modal) and "Shipping" (the shipping
   method options). Address + shipping selections live in shared runtime state
   (OS.ckState['ck-account'] / OS.ckState['ck-shipping']) so Contact, Delivery and the
   standalone Shipping Method section all react to a single Sign in/out + selection. */
(function () {
  if (!window.OS) return;
  const { esc, money, ckFloat, wireFloatFields } = OS;

  // Dial code auto-derived from the selected country (signed-out form only).
  const DIAL = { 'United States': '+1', 'Canada': '+1', 'United Kingdom': '+44', 'Australia': '+61', 'Germany': '+49', 'Japan': '+81' };
  const KEBAB = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>';
  const SEARCH = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>';
  const HELP = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>';
  const CLOSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  const acctState = () => (OS.ckState || {})['ck-account'] || {};
  const signedIn = () => !!acctState().signedIn;

  // Selected saved-address id, falling back to the default (or first) address.
  function selectedAddrId(mock) {
    const addrs = ((mock.account || {}).addresses) || [];
    const st = acctState();
    if (st.selectedAddressId && addrs.some((a) => a.id === st.selectedAddressId)) return st.selectedAddressId;
    return (addrs.find((a) => a.default) || addrs[0] || {}).id;
  }
  // Selected shipping method (shared with the standalone Shipping Method section).
  function selectedShip(mock) {
    const methods = mock.shippingMethods || [];
    const id = ((OS.ckState || {})['ck-shipping'] || {}).id || mock.selectedShipping;
    return methods.find((m) => m.id === id) || methods[0] || { price: 0 };
  }
  const shipLabel = (m) => 'Estimated Delivery Time: 4-8 Business Days · ' + (m && m.price ? money(m.price) : 'FREE');

  // ---- Add / Edit address modal (reuses the .pop-layer overlay + z-index used by
  //      the editor's Add-component modal so it sits above the whole preview) -------
  function openAddrModal(mock, addr) {
    document.querySelectorAll('.ck-modal-layer').forEach((n) => n.remove());
    const editing = !!addr;
    const nameParts = (addr && addr.name ? addr.name : '').split(' ');
    const first = editing ? (nameParts[0] || '') : '';
    const last = editing ? nameParts.slice(1).join(' ') : '';
    const countries = mock.countries || ['United States'];
    const states = mock.states || [];
    const cOpts = countries.map((c) => '<option' + (c === 'United States' ? ' selected' : '') + '>' + esc(c) + '</option>').join('');
    const sOpts = '<option value="" selected></option>' + states.map((c) => '<option>' + esc(c) + '</option>').join('');
    const val = (v) => v ? ' value="' + esc(v) + '"' : '';

    const layer = document.createElement('div');
    layer.className = 'pop-layer ck-modal-layer';
    layer.style.zIndex = '260';
    layer.innerHTML =
      '<div class="ck-modal" role="dialog" aria-modal="true">' +
        '<div class="ck-modal-head"><h4>' + (editing ? 'Edit address' : 'Add address') + '</h4>' +
          '<button class="ck-modal-x" type="button" data-x aria-label="Close">' + CLOSE + '</button></div>' +
        '<div class="ck-modal-body">' +
          '<label class="ck-fl"><span class="ck-fl-lbl">Country/Region</span>' +
            '<span class="ck-fl-wrap"><select class="ck-fl-in">' + cOpts + '</select><span class="ck-fl-chev">▾</span></span></label>' +
          '<div class="ck-fl-row2">' +
            '<label class="ck-fl"><span class="ck-fl-lbl">First name</span><input class="ck-fl-in" type="text"' + val(first) + '></label>' +
            '<label class="ck-fl"><span class="ck-fl-lbl">Last name</span><input class="ck-fl-in" type="text"' + val(last) + '></label>' +
          '</div>' +
          '<label class="ck-fl ck-fl-ico"><span class="ck-fl-lbl">Address</span>' +
            '<span class="ck-fl-wrap"><input class="ck-fl-in" type="text"' + val(addr && addr.line1) + '><span class="ck-fl-ricon">' + SEARCH + '</span></span></label>' +
          '<label class="ck-fl"><span class="ck-fl-lbl">Apartment, suite, etc. (optional)</span><input class="ck-fl-in" type="text"></label>' +
          '<div class="ck-fl-row3">' +
            '<label class="ck-fl"><span class="ck-fl-lbl">City</span><input class="ck-fl-in" type="text"></label>' +
            '<label class="ck-fl"><span class="ck-fl-lbl">State</span><span class="ck-fl-wrap"><select class="ck-fl-in">' + sOpts + '</select><span class="ck-fl-chev">▾</span></span></label>' +
            '<label class="ck-fl"><span class="ck-fl-lbl">ZIP code</span><input class="ck-fl-in" type="text"></label>' +
          '</div>' +
          '<label class="ck-fl ck-fl-ico"><span class="ck-fl-lbl">Phone</span>' +
            '<span class="ck-fl-wrap"><input class="ck-fl-in" type="tel"' + val(addr && addr.phone) + '><span class="ck-fl-ricon">' + HELP + '</span></span></label>' +
          '<label class="ck-modal-check"><input type="checkbox" data-default' + (editing && addr.default ? ' checked' : '') + '><span>This is my default address</span></label>' +
        '</div>' +
        '<div class="ck-modal-foot">' +
          '<button class="ck-modal-cancel" type="button" data-x>Cancel</button>' +
          '<button class="ck-modal-save" type="button" data-save>Save address</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(layer);
    wireFloatFields(layer);

    const close = () => layer.remove();
    layer.addEventListener('mousedown', (e) => { if (e.target === layer) close(); });
    layer.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', close));
    const onKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);

    layer.querySelector('[data-save]').addEventListener('click', () => {
      // Save persists to the in-memory list so the change survives re-render: edit
      // updates the address in place, add pushes a new one and selects it.
      const ins = layer.querySelectorAll('.ck-fl-in');
      const country = ins[0].value, fn = (ins[1].value || '').trim(), ln = (ins[2].value || '').trim();
      const line1 = (ins[3].value || '').trim(), city = (ins[5].value || '').trim(), st = ins[6].value, zip = (ins[7].value || '').trim(), phone = (ins[8].value || '').trim();
      const isDefault = !!layer.querySelector('[data-default]').checked;
      const addrs = ((mock.account || {}).addresses) || [];
      const name = [fn, ln].filter(Boolean).join(' ') || (addr && addr.name) || 'New address';
      const line2 = [[city, st, zip].filter(Boolean).join(' '), country === 'United States' ? 'US' : country].filter(Boolean).join(', ');
      if (isDefault) addrs.forEach((a) => { a.default = false; });
      if (editing) {
        addr.name = name; if (line1) addr.line1 = line1; if (phone) addr.phone = phone; if (isDefault) addr.default = true;
      } else {
        const na = { id: 'a' + Date.now(), name, line1, line2, phone, default: isDefault };
        addrs.push(na);
        OS.ckSet('ck-account', { selectedAddressId: na.id });
      }
      close();
      OS.ckRecalc();
    });
  }

  OS.register('checkout-shipping-info', {
    name: 'Shipping Information', icon: 'layers',
    schema: [
      { key: 'heading', label: 'Heading', control: 'text', default: 'Delivery', placeholder: 'Delivery' },
      { key: 'first_name_placeholder', label: 'First name placeholder', control: 'text', default: 'First name' },
      { key: 'last_name_placeholder', label: 'Last name placeholder', control: 'text', default: 'Last name' },
      { key: 'address_placeholder', label: 'Address placeholder', control: 'text', default: 'Address' },
      { key: 'apartment_placeholder', label: 'Apartment placeholder', control: 'text', default: 'Apt, suite, unit, etc (optional)' },
      { key: 'state_placeholder', label: 'State placeholder', control: 'text', default: 'State/province' },
      { key: 'city_placeholder', label: 'City placeholder', control: 'text', default: 'City' },
      { key: 'zip_placeholder', label: 'ZIP placeholder', control: 'text', default: 'ZIP code' },
      { key: 'phone_placeholder', label: 'Phone placeholder', control: 'text', default: 'Phone number' },
    ],
    render(s, blocks, ctx) {
      const mock = ctx.checkout || {};
      const heading = '<h3 class="ck-h">' + esc(s.heading || 'Delivery') + '</h3>';

      // ---- Signed IN: bordered account card (NOT the editable form) ----
      if (signedIn()) {
        const addrs = ((mock.account || {}).addresses) || [];
        const selId = selectedAddrId(mock);
        const selAddr = addrs.find((a) => a.id === selId) || addrs[0] || {};
        const selLine = [selAddr.line1, selAddr.line2].filter(Boolean).join(', ');

        const addrRows = addrs.map((a) => {
          const on = a.id === selId;
          const nameLine = a.name + (a.line1 ? ', ' + a.line1 : '');
          const subLine = [a.line2, a.phone].filter(Boolean).join(', ');
          const pill = a.default ? '<span class="ck-addr-pill">Default</span>' : '';
          const kebab = on ? '<button class="ck-addr-kebab" type="button" data-ck-addr-kebab="' + esc(a.id) + '" aria-label="Address options">' + KEBAB + '</button>' : '';
          return '<label class="ck-addr-row' + (on ? ' sel' : '') + '" data-ck-addr="' + esc(a.id) + '">' +
            '<span class="ck-addr-dot"><input type="radio" name="ck-addr"' + (on ? ' checked' : '') + '></span>' +
            '<span class="ck-addr-info">' +
              '<span class="ck-addr-name">' + esc(nameLine) + '</span>' +
              (subLine ? '<span class="ck-addr-sub">' + esc(subLine) + '</span>' : '') +
              pill +
            '</span>' + kebab +
          '</label>';
        }).join('');

        const methods = mock.shippingMethods || [];
        const selShipId = selectedShip(mock).id;
        const shipRows = methods.map((m) => {
          const on = m.id === selShipId;
          const desc = m.desc ? '<span class="desc">' + esc(m.desc) + '</span>' : '';
          return '<label class="ck-radio' + (on ? ' sel' : '') + '" data-ck-ship="' + esc(m.id) + '">' +
            '<span class="dot"></span>' +
            '<span class="nm">' + esc(m.name) + desc + '</span>' +
            '<span class="pr">' + (m.price ? money(m.price) : 'Free') + '</span>' +
          '</label>';
        }).join('');

        return '<div class="cksec ck-shipinfo">' + heading +
          '<div class="ck-addr-card">' +
            // Ship to accordion
            '<div class="ck-accord" data-ck-accord>' +
              '<button class="ck-accord-head" type="button" data-ck-accord-toggle>' +
                '<span class="ck-accord-lbl">Ship to</span>' +
                '<span class="ck-accord-val"><span class="nm">' + esc(selAddr.name || '') + '</span>' +
                  (selLine ? '<span class="ad">' + esc(selLine) + '</span>' : '') + '</span>' +
                '<span class="ck-accord-chev">▾</span>' +
              '</button>' +
              '<div class="ck-accord-body">' +
                '<div class="ck-addr-list">' + addrRows + '</div>' +
                '<a class="ck-link ck-addr-add" data-ck-addr-add><span class="plus">+</span> Use a different address</a>' +
              '</div>' +
            '</div>' +
            // Shipping accordion
            '<div class="ck-accord" data-ck-accord>' +
              '<button class="ck-accord-head" type="button" data-ck-accord-toggle>' +
                '<span class="ck-accord-lbl">Shipping</span>' +
                '<span class="ck-accord-val"><span class="nm">' + esc(shipLabel(selectedShip(mock))) + '</span></span>' +
                '<span class="ck-accord-chev">▾</span>' +
              '</button>' +
              '<div class="ck-accord-body">' +
                '<div class="ck-radio-list" data-ck-ship-list>' + shipRows + '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }

      // ---- Signed OUT (default): the empty editable address form ----
      const countries = (mock.countries || ['United States']);
      const opts = countries.map((c) => '<option' + (c === mock.country ? ' selected' : '') + '>' + esc(c) + '</option>').join('');
      const inp = (ph, type) => ckFloat('<input class="ck-input" type="' + (type || 'text') + '" placeholder="' + esc(ph) + '">', ph);
      const sel = (ph, items) => '<div class="ck-selwrap">' + ckFloat('<select class="ck-input ck-select">' +
        '<option value="" selected></option>' +
        (items || []).map((o) => '<option>' + esc(o) + '</option>').join('') +
        '</select>', ph) + '</div>';
      const dial = DIAL[mock.country] || '+1';
      const phone = '<div class="ck-phone">' +
        '<span class="ck-phone-cc" data-ck-dial>' + esc(dial) + '</span>' +
        ckFloat('<input class="ck-input ck-phone-num" type="tel" placeholder="' + esc(s.phone_placeholder || 'Phone number') + '">', s.phone_placeholder || 'Phone number') +
      '</div>';
      return '<div class="cksec ck-shipinfo">' + heading +
        '<div class="ck-field"><div class="ck-selwrap">' + ckFloat('<select class="ck-input ck-select" data-ck-country>' + opts + '</select>', 'Country/Region') + '</div></div>' +
        '<div class="ck-row2">' +
          '<div class="ck-field">' + inp(s.first_name_placeholder || 'First name') + '</div>' +
          '<div class="ck-field">' + inp(s.last_name_placeholder || 'Last name') + '</div>' +
        '</div>' +
        '<div class="ck-field">' + inp(s.address_placeholder || 'Address') + '</div>' +
        '<div class="ck-field">' + inp(s.apartment_placeholder || 'Apartment') + '</div>' +
        '<div class="ck-row3">' +
          '<div class="ck-field">' + sel(s.city_placeholder || 'City', mock.cities) + '</div>' +
          '<div class="ck-field">' + sel(s.state_placeholder || 'State/province', mock.states) + '</div>' +
          '<div class="ck-field">' + inp(s.zip_placeholder || 'ZIP code') + '</div>' +
        '</div>' +
        '<div class="ck-field ck-field-phone">' + phone + '</div>' +
      '</div>';
    },
    hydrate(el, settings, blocks, ctx) {
      const mock = (ctx && ctx.checkout) || {};

      // --- Signed-out form: country → dial-code link ---
      const country = el.querySelector('[data-ck-country]');
      const dialEl = el.querySelector('[data-ck-dial]');
      if (country && dialEl) country.addEventListener('change', () => {
        dialEl.textContent = DIAL[country.value] || '+1';
      });

      // --- Signed-in card ---
      el.querySelectorAll('[data-ck-accord-toggle]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          // Ignore toggles that originate from the kebab / its popover.
          if (e.target.closest('[data-ck-addr-kebab]') || e.target.closest('.ck-mini-pop')) return;
          btn.closest('[data-ck-accord]').classList.toggle('open');
        });
      });

      el.querySelectorAll('[data-ck-addr]').forEach((row) => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('[data-ck-addr-kebab]') || e.target.closest('.ck-mini-pop')) return;
          const id = row.getAttribute('data-ck-addr');
          if (id === selectedAddrId(mock)) return;
          OS.ckSet('ck-account', { selectedAddressId: id });
          OS.ckRecalc();
        });
      });

      const addLink = el.querySelector('[data-ck-addr-add]');
      if (addLink) addLink.addEventListener('click', (e) => { e.preventDefault(); openAddrModal(mock, null); });

      el.querySelectorAll('[data-ck-addr-kebab]').forEach((kb) => {
        kb.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          const row = kb.closest('[data-ck-addr]');
          let pop = row.querySelector('.ck-mini-pop');
          if (pop) { pop.remove(); return; }
          const id = row.getAttribute('data-ck-addr');
          const addr = (((mock.account || {}).addresses) || []).find((a) => a.id === id);
          pop = document.createElement('div');
          pop.className = 'ck-mini-pop';
          pop.innerHTML = '<button type="button" class="ck-mini-edit" data-edit>Edit</button>' +
            '<button type="button" class="ck-mini-del" data-del>Delete</button>';
          row.appendChild(pop);
          const closePop = (ev) => { if (!pop.contains(ev.target) && ev.target !== kb) { pop.remove(); document.removeEventListener('click', closePop); } };
          setTimeout(() => document.addEventListener('click', closePop), 0);
          pop.querySelector('[data-edit]').addEventListener('click', (ev) => { ev.stopPropagation(); pop.remove(); openAddrModal(mock, addr); });
          pop.querySelector('[data-del]').addEventListener('click', (ev) => {
            ev.stopPropagation();
            const addrs = ((mock.account || {}).addresses) || [];
            const i = addrs.findIndex((a) => a.id === id);
            if (i >= 0) addrs.splice(i, 1);
            // Re-point the selection to the default / first remaining address.
            if (selectedAddrId(mock) === id || !addrs.length) {
              OS.ckSet('ck-account', { selectedAddressId: (addrs.find((a) => a.default) || addrs[0] || {}).id });
            }
            pop.remove();
            OS.ckRecalc();
          });
        });
      });

      const shipList = el.querySelector('[data-ck-ship-list]');
      if (shipList) shipList.querySelectorAll('[data-ck-ship]').forEach((row) => row.addEventListener('click', (e) => {
        e.preventDefault();
        OS.ckSet('ck-shipping', { id: row.getAttribute('data-ck-ship') });
        OS.ckRecalc();
      }));
    },
  });
})();
