/* Checkout · Payment method (PRD §5.6) — hosted credit / debit card + billing address.
   Reuses the current payment gateway; card fields are hosted by the gateway and
   never collected by the theme. Billing address stays outside the hosted card so
   Checkout can collect it independently without weakening that security boundary. */
(function () {
  if (!window.OS) return;
  const { esc, ckFloat } = OS;

  const CARD_ICON = '<svg class="ck-pay-card" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>';
  const BRANDS =
    '<span class="ckbrand visa">VISA</span>' +
    '<span class="ckbrand mc">MC</span>' +
    '<span class="ckbrand amex">AMEX</span>' +
    '<span class="ckbrand disc">DISC<span>VER</span></span>';

  OS.register('checkout-payment', {
    name: 'Payment method', icon: 'lock',
    schema: [
      { key: 'heading', label: 'Heading', control: 'text', default: 'Payment', placeholder: 'Payment' },
      { key: 'description', label: 'Description', control: 'textarea', default: '', placeholder: 'All transactions are secure and encrypted' },
    ],
    render(s, blocks, ctx) {
      const mock = (ctx && ctx.checkout) || {};
      const billing = (OS.ckState || {})['ck-billing'] || {};
      const canUseShipping = mock.requiresShipping !== false;
      const sameAsShipping = canUseShipping && billing.sameAsShipping !== false;
      const value = (key) => billing[key] ? ' value="' + esc(billing[key]) + '"' : '';
      const input = (label, key, type, optional) => ckFloat(
        '<input class="ck-input" type="' + (type || 'text') + '" name="billing_' + key +
          '" autocomplete="billing ' + (key === 'firstName' ? 'given-name' : key === 'lastName' ? 'family-name' :
            key === 'address' ? 'address-line1' : key === 'apartment' ? 'address-line2' :
            key === 'city' ? 'address-level2' : key === 'region' ? 'address-level1' :
            key === 'zip' ? 'postal-code' : key === 'phone' ? 'tel' : key) +
          '" placeholder="' + esc(label) + '" data-ck-billing-field="' + key + '"' + value(key) +
          (optional ? '' : ' required') + '>',
        label
      );
      const select = (label, key, items, current, allowEmpty) => ckFloat(
        '<select class="ck-input ck-select" name="billing_' + key + '" autocomplete="billing ' +
          (key === 'country' ? 'country' : 'address-level1') + '" data-ck-billing-field="' + key + '"' +
          (allowEmpty ? '' : ' required') + '>' +
          (allowEmpty ? '<option value=""></option>' : '') +
          (items || []).map((item) => '<option value="' + esc(item) + '"' + (item === current ? ' selected' : '') + '>' + esc(item) + '</option>').join('') +
        '</select>',
        label
      );
      const country = billing.country || mock.country || (mock.countries || [])[0] || 'United States';
      const billingForm =
        '<div class="ck-billing-form" id="ck-billing-form"' + (sameAsShipping ? ' hidden' : '') + '>' +
          '<h4>Billing address</h4>' +
          '<div class="ck-field">' + select('Country/Region', 'country', mock.countries || ['United States'], country, false) + '</div>' +
          '<div class="ck-row2">' +
            '<div class="ck-field">' + input('First name', 'firstName') + '</div>' +
            '<div class="ck-field">' + input('Last name', 'lastName') + '</div>' +
          '</div>' +
          '<div class="ck-field">' + input('Address', 'address') + '</div>' +
          '<div class="ck-field">' + input('Apartment, suite, etc. (optional)', 'apartment', 'text', true) + '</div>' +
          '<div class="ck-row3">' +
            '<div class="ck-field">' + input('City', 'city') + '</div>' +
            '<div class="ck-field">' + select('State', 'region', mock.states || [], billing.region || '', true) + '</div>' +
            '<div class="ck-field">' + input('ZIP code', 'zip') + '</div>' +
          '</div>' +
          '<div class="ck-field">' + input('Phone (optional)', 'phone', 'tel', true) + '</div>' +
        '</div>';
      const card =
        '<div class="ck-pay-opt sel">' +
          '<div class="ck-pay-head"><span class="dot"></span>' + CARD_ICON + '<span class="nm">Card</span></div>' +
          '<div class="ck-pay-body">' +
            '<div class="ck-cardnum">' + ckFloat('<input class="ck-input" placeholder="Card number">', 'Card number') + '<span class="ck-cardbrands">' + BRANDS + '</span></div>' +
            '<div class="ck-row2">' +
              ckFloat('<input class="ck-input" placeholder="MM / YY">', 'MM / YY') +
              ckFloat('<input class="ck-input" placeholder="CVC">', 'CVC') +
            '</div>' +
          '</div>' +
        '</div>';
      return '<div class="cksec ck-payment">' +
        '<h3 class="ck-h">' + esc(s.heading || 'Payment') + '</h3>' +
        (s.description ? '<div class="ck-pay-note">' + esc(s.description) + '</div>' : '') +
        '<div class="ck-pay-list">' + card + '</div>' +
        (canUseShipping ? '<label class="ck-billing-same">' +
          '<input type="checkbox" data-ck-billing-same aria-controls="ck-billing-form"' + (sameAsShipping ? ' checked' : '') + '>' +
          '<span>Use shipping address as billing address</span>' +
        '</label>' : '') +
        billingForm +
      '</div>';
    },
    hydrate(el) {
      const same = el.querySelector('[data-ck-billing-same]');
      const form = el.querySelector('.ck-billing-form');
      if (same && form) {
        const syncVisibility = () => {
          OS.ckSet('ck-billing', { sameAsShipping: same.checked });
          form.hidden = same.checked;
          form.querySelectorAll('[data-ck-billing-field]').forEach((field) => { field.disabled = same.checked; });
          same.setAttribute('aria-expanded', String(!same.checked));
          if (!same.checked && OS.wireFloatFields) OS.wireFloatFields(form);
        };
        same.addEventListener('change', syncVisibility);
        syncVisibility();
      } else if (form) {
        OS.ckSet('ck-billing', { sameAsShipping: false });
      }
      el.querySelectorAll('[data-ck-billing-field]').forEach((field) => {
        const save = () => {
          const patch = {};
          patch[field.getAttribute('data-ck-billing-field')] = field.value;
          OS.ckSet('ck-billing', patch);
        };
        field.addEventListener('input', save);
        field.addEventListener('change', save);
      });
    },
  });

  OS.css('ck-billing-address', `
    .ck-billing-same{display:flex;align-items:center;gap:9px;margin-top:14px;color:var(--ck-text);font-size:var(--ck-base-fs);cursor:pointer}
    .ck-billing-same input{width:18px;height:18px;margin:0;accent-color:var(--ck-accent);cursor:pointer}
    .ck-billing-form{margin-top:22px}
    .ck-billing-form[hidden]{display:none}
    .ck-billing-form h4{margin:0 0 12px;color:var(--ck-text);font-family:var(--ck-heading-font);font-size:var(--ck-heading-fs);font-weight:var(--ck-fw-h)}
    .ck-billing-form .ck-field{margin-bottom:12px}
    .ck-billing-form .ck-row2 .ck-field,.ck-billing-form .ck-row3 .ck-field{min-width:0}
    .ckpage.mob .ck-billing-form .ck-row2,.ckpage.mob .ck-billing-form .ck-row3{grid-template-columns:1fr}
  `);
})();
