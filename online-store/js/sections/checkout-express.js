/* Checkout · Express checkout (PRD §5.2) — accelerated wallets.
   Payment methods come from the active processor runtime. The theme can only style
   this protected region; it must not turn wallets on, off, or add unavailable brands. */
(function () {
  if (!window.OS) return;
  const { esc } = OS;

  function enabled(value) { return value === true || value === 'enabled'; }
  function methodsFor(ctx) {
    const caps = ((ctx && ctx.checkout) || {}).paymentCapabilities || {};
    return [
      enabled(caps.wallet) && { id: 'paypal', label: 'PayPal' },
      enabled(caps.applePay) && { id: 'applepay', label: 'Apple Pay' },
      enabled(caps.googlePay) && { id: 'gpay', label: 'Google Pay' },
    ].filter(Boolean);
  }

  OS.register('checkout-express', {
    name: 'Express checkout', icon: 'lock',
    schema: [
      { key: 'heading', label: 'Heading', control: 'text', default: 'Express checkout', placeholder: 'Express checkout' },
      { info: 'Payment methods are synchronized from Settings > Payments. They appear to buyers only when the connected provider and buyer environment are eligible.' },
    ],
    render(s, blocks, ctx) {
      const heading = s.heading ? '<div class="ck-exp-h">' + esc(s.heading) + '</div>' : '';
      const methods = methodsFor(ctx);
      const buttons = methods.map((method) =>
        '<button class="ck-exp-btn ' + method.id + '" type="button" aria-label="' + esc(method.label) + '">' + esc(method.label) + '</button>'
      ).join('');
      const body = buttons
        ? '<div class="ck-exp-btns ck-exp-btns-' + methods.length + '">' + buttons + '</div><div class="ck-or">OR</div>'
        : '<div class="ck-exp-empty">Express payment methods will appear when a connected provider is eligible for this buyer.</div>';
      return '<div class="cksec ck-express">' + heading +
        body +
      '</div>';
    },
  });

  OS.css('checkout-express-runtime', `
    .ck-exp-btns{grid-template-columns:repeat(2,minmax(0,1fr))}
    .ck-exp-btns-1{grid-template-columns:1fr}
    .ck-exp-btns-3 .ck-exp-btn.paypal{grid-column:1 / -1}
    .ck-exp-btn.applepay{background:#000;color:#fff}
    .ck-exp-btn.gpay{background:#fff;color:#3c4043;border:1px solid #dadce0}
    .ck-exp-empty{padding:13px;border:1px dashed var(--ck-input-border);border-radius:var(--ck-input-radius);color:var(--ck-muted);font-size:var(--ck-small-fs);line-height:1.45;text-align:center}
  `);
})();
