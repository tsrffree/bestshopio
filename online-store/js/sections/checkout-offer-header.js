/* Checkout Theme · Post-purchase offer header.
   Decoration only: confirmation/order data comes from the Funnel preview payload. */
(function () {
  if (!window.OS) return;
  const { esc } = OS;
  const CHECK = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>';

  OS.register('checkout-offer-header', {
    name: 'Order confirmation', icon: 'check',
    schema: [
      { info: 'The original order is already paid. Order identifiers are supplied by Funnel and can\u2019t be edited in Theme.' },
      { key: 'logo_image', label: 'Logo image', control: 'image', default: '' },
      { key: 'logo_text', label: 'Logo text', control: 'text', default: '', placeholder: 'Uses store name when empty' },
      { key: 'confirmation_label', label: 'Confirmation label', control: 'text', default: 'Confirmation' },
      { key: 'paid_message', label: 'Paid message', control: 'text', default: 'You\u2019ve paid for your order.' },
      { key: 'show_order_link', label: 'Show order confirmation link', control: 'toggle', default: true },
      { key: 'order_link_text', label: 'Order link text', control: 'text', default: 'View order confirmation', visibleWhen: (s) => s.show_order_link !== false },
      { sub: 'Style' },
      { key: 'background_color', label: 'Background color', control: 'color', default: '', allowTransparent: true },
      { key: 'text_color', label: 'Text color', control: 'color', default: '' },
      { key: 'accent_color', label: 'Accent color', control: 'color', default: '' },
      { key: 'show_divider', label: 'Bottom divider', control: 'toggle', default: true },
    ],
    render(s, blocks, ctx) {
      const offer = ctx.offer || {};
      const store = s.logo_text || offer.storeName || 'Store';
      const logo = s.logo_image
        ? '<img class="ckoh-logoimg" src="' + esc(s.logo_image) + '" alt="' + esc(store) + '">'
        : '<span class="ckoh-logotxt">' + esc(store) + '</span>';
      const confirmation = [s.confirmation_label || 'Confirmation', offer.confirmationNumber ? '#' + offer.confirmationNumber : '']
        .filter(Boolean).join(' ');
      const link = s.show_order_link === false ? '' :
        '<a class="ckoh-link" href="#" data-offer-order-link>' + esc(s.order_link_text || 'View order confirmation') + ' \u203a</a>';
      const style = 'background:' + (OS.bgOrTransparent(s.background_color) || 'var(--ck-h-bg)') +
        ';color:' + (s.text_color || 'var(--ck-h-text)') +
        ';--ckoh-accent:' + (s.accent_color || 'var(--ck-h-accent)');
      const maxWidth = (((ctx.tokens || {}).layout || {}).page_max_width_pc) || 980;
      return '<header class="cksec ckoh' + (s.show_divider === false ? '' : ' divline') + '" style="' + style + '">' +
        '<div class="ckoh-in" style="max-width:' + maxWidth + 'px">' +
          '<div class="ckoh-brand">' + logo + '</div>' +
          '<div class="ckoh-confirm">' +
            '<span class="ckoh-check">' + CHECK + '</span>' +
            '<div class="ckoh-copy"><span class="ckoh-number">' + esc(confirmation) + '</span>' +
              '<strong>' + esc(s.paid_message || 'You\u2019ve paid for your order.') + '</strong>' + link + '</div>' +
          '</div>' +
        '</div>' +
      '</header>';
    },
    hydrate(el) {
      const link = el.querySelector('[data-offer-order-link]');
      if (link) link.addEventListener('click', (e) => {
        e.preventDefault();
        OS.goCheckoutPage('thankyou');
      });
    },
  });

  OS.css('ck-offer-header', `
  .ckoh{width:100%;box-sizing:border-box}
  .ckoh.divline{border-bottom:1px solid var(--ck-divider)}
  .ckoh-in{width:100%;max-width:980px;margin:0 auto;padding:16px 28px;box-sizing:border-box}
  .ckoh-brand{margin-bottom:8px}
  .ckoh-logoimg{display:block;max-width:150px;max-height:38px;object-fit:contain}
  .ckoh-logotxt{font-size:18px;font-weight:800;letter-spacing:.12em}
  .ckoh-confirm{display:flex;align-items:flex-start;gap:10px}
  .ckoh-check{display:inline-flex;flex:none;color:var(--ckoh-accent);margin-top:1px}
  .ckoh-copy{display:flex;flex-direction:column;gap:2px;line-height:1.35}
  .ckoh-number{font-size:var(--ck-small-fs)}
  .ckoh-copy strong{font-size:var(--ck-base-fs);font-weight:700}
  .ckoh-link{align-self:flex-start;color:var(--ckoh-accent);font-size:var(--ck-small-fs);text-decoration:underline}
  .ckpage.mob .ckoh-in{padding:12px var(--ck-mob-pad,18px)}
  .ckpage.mob .ckoh-logoimg{max-width:120px;max-height:30px}
  `);
})();
