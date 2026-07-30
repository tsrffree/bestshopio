/* Thank you · Order details (Thank you PRD §13) — contact info, shipping address,
   shipping method, payment method, billing address. Required component. Rendered
   inside a bordered card (background / border / radius are component settings).
   Two columns on PC (contact + shipping on the left, payment + billing on the
   right), single column on mobile. All data comes from the Final Order Snapshot;
   empty fields and toggled-off sections are hidden (PRD §13.5). */
(function () {
  if (!window.OS) return;
  const { esc } = OS;

  OS.register('thankyou-order-details', {
    name: 'Order details', icon: 'layers', pinned: true,
    schema: [
      { key: 'heading', label: 'Heading', control: 'text', default: 'Order details' },
      { sub: 'Fields' },
      { key: 'show_contact_information', label: 'Show contact information', control: 'toggle', default: true },
      { key: 'show_shipping_address', label: 'Show shipping address', control: 'toggle', default: true },
      { key: 'show_shipping_method', label: 'Show shipping method', control: 'toggle', default: true },
      { key: 'show_payment_method', label: 'Show payment method', control: 'toggle', default: true },
      { key: 'show_billing_address', label: 'Show billing address', control: 'toggle', default: true },
      { sub: 'Card' },
      { key: 'card_background', label: 'Card background', control: 'color', default: '#FFFFFF', allowTransparent: true },
      { key: 'card_border_color', label: 'Card border color', control: 'color', default: '#E5E5E5', allowTransparent: true },
      { key: 'card_radius', label: 'Card radius', control: 'number', default: 8, min: 0, max: 24 },
    ],

    render(s, blocks, ctx) {
      const snap = ctx.snapshot || {};
      const cust = snap.customer || {};
      const addr = snap.shippingAddress || {};
      const pay = snap.payment || {};

      const field = (label, valueHtml) => valueHtml
        ? '<div class="tyod-f"><div class="tyod-l">' + esc(label) + '</div><div class="tyod-v">' + valueHtml + '</div></div>' : '';

      const addrHtml = (a) => {
        if (!a || (!a.line1 && !a.name)) return '';
        const cityLine = [a.city, a.state, a.zip].filter(Boolean).join(', ');
        return [a.name, a.line1, cityLine, a.country, a.phone].filter(Boolean).map(esc).join('<br>');
      };

      // Contact = email (fallback phone). Payment = brand + last4, else label.
      const contactVal = cust.email || cust.phone || '';
      const payVal = pay.brand
        ? esc(pay.brand) + (pay.last4 && pay.last4 !== '—' ? ' ending in ' + esc(pay.last4) : '') + (pay.label ? ' · ' + esc(pay.label) : '')
        : (pay.label ? esc(pay.label) : '');
      const billVal = snap.billingSameAsShipping ? 'Same as shipping address' : addrHtml(snap.billingAddress || {});

      const left =
        (s.show_contact_information !== false ? field('Contact information', contactVal ? esc(contactVal) : '') : '') +
        (s.show_shipping_address !== false ? field('Shipping address', addrHtml(addr)) : '') +
        (s.show_shipping_method !== false ? field('Shipping method', snap.shippingMethod ? esc(snap.shippingMethod) : '') : '');
      const right =
        (s.show_payment_method !== false ? field('Payment method', payVal) : '') +
        (s.show_billing_address !== false ? field('Billing address', billVal) : '');

      const grid = (left || right)
        ? '<div class="tyod-grid"><div class="tyod-col">' + left + '</div><div class="tyod-col">' + right + '</div></div>'
        : '<div class="tyod-empty">No order details to display.</div>';

      const cardStyle = 'background:' + (OS.bgOrTransparent(s.card_background) || '#FFFFFF') +
        ';border:1px solid ' + (OS.bgOrTransparent(s.card_border_color) || '#E5E5E5') +
        ';border-radius:' + (s.card_radius == null ? 8 : s.card_radius) + 'px';

      return '<div class="cksec tyod">' +
        '<div class="tyod-card" style="' + cardStyle + '">' +
          (s.heading ? '<h3 class="tyod-head">' + esc(s.heading) + '</h3>' : '') +
          grid +
        '</div>' +
      '</div>';
    },
  });

  OS.css('tyod', `
  .tyod-card{padding:20px}
  .tyod-head{font-family:var(--ck-heading-font);font-size:var(--ck-heading-fs);font-weight:var(--ck-fw-h);color:var(--ck-text);margin:0 0 16px}
  .tyod-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}
  .tyod-col{display:flex;flex-direction:column;gap:16px;min-width:0}
  .tyod-f{min-width:0}
  .tyod-l{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--ck-muted);margin-bottom:4px}
  .tyod-v{font-size:var(--ck-small-fs);color:var(--ck-text);line-height:1.55;word-break:break-word}
  .tyod-empty{font-size:var(--ck-small-fs);color:var(--ck-muted)}
  .ckpage.mob .tyod-grid{grid-template-columns:1fr;gap:16px}
  .ckpage.mob .tyod-col{gap:16px}
  `);
})();
