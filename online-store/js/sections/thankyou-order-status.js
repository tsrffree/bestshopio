/* Thank you · Order status (Thank you PRD §12) — the core confirmation block.
   Success icon + confirmation number + thank-you text + a bordered "order
   confirmed" card + email-confirmation hint. Required, pinned to the very top of
   the main column (nothing inserts above it, PRD §9.3/§9.4). Reads the Final
   Order Snapshot for the confirmation number / customer name. */
(function () {
  if (!window.OS) return;
  const { esc } = OS;

  const CHECK = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m8 12.5 2.6 2.6L16 9.5"/></svg>';

  OS.register('thankyou-order-status', {
    name: 'Order status', icon: 'layers', pinnedTop: true,
    schema: [
      { info: 'Required component — always sits at the top of the confirmation. Reads the confirmation number and customer name from the final order.' },
      { key: 'thankyou_text', label: 'Thank you text', control: 'text', default: 'Thank you, {{customer_name}}', info: 'Use {{customer_name}} to insert the buyer name. If the name is empty it falls back to “Thank you”.' },
      { key: 'show_confirmation_number', label: 'Show confirmation number', control: 'toggle', default: true },
      { key: 'success_message', label: 'Success message', control: 'text', default: 'Your order is confirmed' },
      { key: 'email_message', label: 'Email message', control: 'text', default: "You'll receive a confirmation email soon", info: 'Leave empty to hide the email hint.' },
      { sub: 'Style' },
      { key: 'success_icon_color', label: 'Success icon color', control: 'color', default: '', info: 'Leave empty to inherit the Accent color.' },
    ],

    render(s, blocks, ctx) {
      const snap = ctx.snapshot || {};
      const cust = snap.customer || {};
      const name = (cust.name || cust.fullName || '').trim();
      // {{customer_name}} → the buyer name; when empty the whole text collapses to "Thank you".
      let text = s.thankyou_text || 'Thank you, {{customer_name}}';
      if (/\{\{\s*customer_name\s*\}\}/.test(text)) {
        text = name ? text.replace(/\{\{\s*customer_name\s*\}\}/g, name) : 'Thank you';
      }
      const iconColor = s.success_icon_color || 'var(--ck-accent)';
      const conf = (s.show_confirmation_number !== false && snap.confirmationNumber)
        ? '<div class="tyos-conf">Confirmation #' + esc(snap.confirmationNumber) + '</div>' : '';
      const card = s.success_message
        ? '<div class="tyos-card">' +
            '<div class="tyos-card-txt"><div class="tyos-success">' + esc(s.success_message) + '</div>' +
            (s.email_message ? '<div class="tyos-email">' + esc(s.email_message) + '</div>' : '') + '</div></div>'
        : (s.email_message ? '<div class="tyos-email solo">' + esc(s.email_message) + '</div>' : '');

      return '<div class="cksec tyos">' +
        '<div class="tyos-top">' +
          '<span class="tyos-check" style="color:' + iconColor + '" role="img" aria-label="Order confirmed">' + CHECK + '</span>' +
          '<div class="tyos-head">' + conf + '<h2 class="tyos-thanks">' + esc(text) + '</h2></div>' +
        '</div>' + card +
      '</div>';
    },
  });

  OS.css('tyos', `
  .tyos-top{display:flex;align-items:flex-start;gap:14px}
  .tyos-check{flex:none;display:inline-flex;margin-top:2px}
  .tyos-head{min-width:0}
  .tyos-conf{font-size:var(--ck-small-fs);color:var(--ck-muted);letter-spacing:.02em;margin-bottom:4px;text-transform:uppercase}
  .tyos-thanks{font-family:var(--ck-heading-font);font-size:calc(var(--ck-heading-fs) + 8px);font-weight:var(--ck-fw-h);line-height:1.2;color:var(--ck-text);margin:0}
  .tyos-card{margin-top:16px;padding:16px;border:1px solid var(--ck-divider);border-radius:8px;background:transparent}
  .tyos-card-txt{min-width:0}
  .tyos-success{font-size:var(--ck-base-fs);font-weight:var(--ck-fw-h);color:var(--ck-text);line-height:1.4}
  .tyos-email{font-size:var(--ck-small-fs);color:var(--ck-muted);line-height:1.5;margin-top:3px}
  .tyos-email.solo{margin-top:12px}
  `);
})();
