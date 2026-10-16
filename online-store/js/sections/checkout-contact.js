/* Checkout · Contact Information (PRD §5.3) — email, sign-in, marketing opt-in.
   Reuses the current checkout contact logic; this section restyles + configures
   labels. Email is required and validated by the existing pipeline.
   Item 1: a runtime signed-in flag (OS.ckState['ck-account'].signedIn, default
   OFF) is shared with Delivery — toggling it re-renders the whole checkout. */
(function () {
  if (!window.OS) return;
  const { esc, ckFloat } = OS;

  const KEBAB = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>';
  const signedIn = () => !!((OS.ckState || {})['ck-account'] || {}).signedIn;

  OS.register('checkout-contact', {
    name: 'Contact Information', icon: 'user',
    schema: [
      { key: 'heading', label: 'Heading', control: 'text', default: 'Contact', placeholder: 'Contact' },
      { key: 'email_placeholder', label: 'Email placeholder', control: 'text', default: 'Email' },
      { key: 'show_sign_in_link', label: 'Show sign in link', control: 'toggle', default: true },
      { key: 'sign_in_text', label: 'Sign in text', control: 'text', default: 'Sign in' },
    ],
    render(s, blocks, ctx) {
      const heading = '<h3 class="ck-h">' + esc(s.heading || 'Contact') + '</h3>';
      if (signedIn()) {
        // Signed IN: account chip (avatar + email + kebab → Sign out popover).
        const acct = (ctx.checkout && ctx.checkout.account) || {};
        const email = acct.email || '';
        const initial = (email.charAt(0) || 'A').toUpperCase();
        return '<div class="cksec ck-contact">' +
          '<div class="ck-top">' + heading + '</div>' +
          '<div class="ck-acct" data-ck-acct>' +
            '<span class="ck-acct-av">' + esc(initial) + '</span>' +
            '<span class="ck-acct-email">' + esc(email) + '</span>' +
            '<button class="ck-acct-kebab" type="button" data-ck-kebab aria-label="Account options">' + KEBAB + '</button>' +
            '<div class="ck-acct-pop" data-ck-pop hidden>' +
              '<button class="ck-acct-pop-item" type="button" data-ck-signout>Sign out</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }
      // Signed OUT (default): heading + sign-in link + email input.
      const signin = s.show_sign_in_link !== false
        ? '<a class="ck-link" data-ck-signin>' + esc(s.sign_in_text || 'Sign in') + '</a>' : '';
      return '<div class="cksec ck-contact">' +
        '<div class="ck-top">' + heading + signin + '</div>' +
        '<div class="ck-field">' + ckFloat('<input class="ck-input" type="email" placeholder="' + esc(s.email_placeholder || 'Email') + '">', s.email_placeholder || 'Email') + '</div>' +
      '</div>';
    },
    hydrate(el) {
      const link = el.querySelector('[data-ck-signin]');
      if (link) link.addEventListener('click', (e) => {
        e.preventDefault();
        OS.ckSet('ck-account', { signedIn: true });
        OS.ckRecalc();
      });

      const kebab = el.querySelector('[data-ck-kebab]');
      const pop = el.querySelector('[data-ck-pop]');
      if (kebab && pop) {
        kebab.addEventListener('click', (e) => {
          e.stopPropagation();
          const open = pop.hasAttribute('hidden');
          if (open) { pop.removeAttribute('hidden'); } else { pop.setAttribute('hidden', ''); }
          if (open) {
            const close = (ev) => { if (!pop.contains(ev.target) && ev.target !== kebab) { pop.setAttribute('hidden', ''); document.removeEventListener('click', close); } };
            setTimeout(() => document.addEventListener('click', close), 0);
          }
        });
      }

      const out = el.querySelector('[data-ck-signout]');
      if (out) out.addEventListener('click', (e) => {
        e.preventDefault();
        OS.ckSet('ck-account', { signedIn: false });
        OS.ckRecalc();
      });
    },
  });
})();
