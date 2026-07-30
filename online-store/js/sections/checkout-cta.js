/* Checkout · CTA (PRD §5.7) — the final pay / submit button.
   Reuses the current order-submit logic; this section adds basic copy & style
   config. Color / radius default to "inherit" so Checkout settings → Accent and
   buttons drive the look unless the merchant overrides here (component > theme). */
(function () {
  if (!window.OS) return;
  const { esc } = OS;

  OS.register('checkout-cta', {
    name: 'CTA', icon: 'lock',
    schema: [
      { key: 'button_text', label: 'Button text', control: 'text', default: 'Pay now', placeholder: 'Pay now' },
      { key: 'button_full_width', label: 'Full width', control: 'toggle', default: true },
      { key: 'button_background', label: 'Button background', control: 'color', default: '', info: 'Leave empty to inherit Checkout settings → Button.' },
      { key: 'button_text_color', label: 'Button text color', control: 'color', default: '', info: 'Leave empty to inherit Checkout settings → Button text.' },
      { key: 'button_border_radius', label: 'Button radius', control: 'numberInherit', min: 0, max: 40, step: 1, default: null, info: 'Auto inherits Checkout settings → Button radius.' },
      { key: 'loading_text', label: 'Loading text', control: 'text', default: 'Processing...' },
    ],
    render(s) {
      const bgv = s.button_background ? s.button_background : 'var(--ck-btn-bg)';
      const txv = s.button_text_color ? s.button_text_color : 'var(--ck-btn-text)';
      const radv = (s.button_border_radius == null || s.button_border_radius === '') ? 'var(--ck-btn-radius)' : (s.button_border_radius + 'px');
      const full = s.button_full_width !== false;
      const style = '--cta-bg:' + bgv + ';--cta-text:' + txv + ';--cta-radius:' + radv + ';' + (full ? 'width:100%' : 'width:auto;padding:0 40px');
      return '<div class="cksec ck-cta">' +
        '<button class="ck-cta-btn" type="button" data-ck-cta data-label="' + esc(s.button_text || 'Pay now') + '" data-loading="' + esc(s.loading_text || 'Processing...') + '" style="' + style + '">' + esc(s.button_text || 'Pay now') + '</button>' +
      '</div>';
    },
    hydrate(el) {
      const btn = el.querySelector('[data-ck-cta]'); if (!btn) return;
      btn.addEventListener('click', () => {
        if (btn.classList.contains('loading')) return;
        btn.classList.add('loading');
        const label = btn.getAttribute('data-label'); btn.textContent = btn.getAttribute('data-loading') || 'Processing...';
        setTimeout(() => { btn.classList.remove('loading'); btn.textContent = label; }, 1400);
      });
    },
  });
})();
