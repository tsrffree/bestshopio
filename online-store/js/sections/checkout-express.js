/* Checkout · Express checkout (PRD §5.2) — accelerated wallets.
   Reuses the existing payment-gateway capability; this section only restyles the
   buttons and lets the merchant edit the heading. Buttons are mock visuals. */
(function () {
  if (!window.OS) return;
  const { esc } = OS;

  OS.register('checkout-express', {
    name: 'Express checkout', icon: 'lock',
    schema: [
      { key: 'heading', label: 'Heading', control: 'text', default: 'Express checkout', placeholder: 'Express checkout' },
    ],
    render(s) {
      const heading = s.heading ? '<div class="ck-exp-h">' + esc(s.heading) + '</div>' : '';
      return '<div class="cksec ck-express">' + heading +
        '<div class="ck-exp-btns">' +
          '<button class="ck-exp-btn shoppay" type="button">Shop Pay</button>' +
          '<button class="ck-exp-btn paypal" type="button">PayPal</button>' +
          '<button class="ck-exp-btn gpay" type="button">G Pay</button>' +
        '</div>' +
        '<div class="ck-or">OR</div>' +
      '</div>';
    },
  });
})();
