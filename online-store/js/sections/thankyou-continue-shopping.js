/* Thank you · Continue shopping (Thank you PRD §15) — button that returns the
   buyer to the store. Required component. Primary = filled dark button using the
   Checkout button tokens; Secondary = outline. Full-width on mobile. Rendered on
   the same row as Contact us on PC (see the Thank-you canvas). */
(function () {
  if (!window.OS) return;
  const { esc } = OS;

  OS.register('thankyou-continue-shopping', {
    name: 'Continue shopping', icon: 'layers', pinned: true,
    schema: [
      { key: 'show_button', label: 'Show button', control: 'toggle', default: true },
      { key: 'button_text', label: 'Button text', control: 'text', default: 'Continue shopping' },
      { key: 'link_url', label: 'Link URL', control: 'url', default: '', placeholder: 'Store homepage', info: 'Leave empty to link to the store homepage.' },
      { key: 'button_style', label: 'Button style', control: 'select', default: 'primary', options: [
        { value: 'primary', label: 'Primary' }, { value: 'secondary', label: 'Secondary' } ] },
    ],

    render(s) {
      if (s.show_button === false) return '<div class="cksec tycs" style="display:none"></div>';
      const secondary = s.button_style === 'secondary';
      const href = s.link_url || '#';
      const cls = 'tycs-btn' + (secondary ? ' secondary' : ' primary');
      return '<div class="cksec tycs">' +
        '<a class="' + cls + '" href="' + esc(href) + '">' + esc(s.button_text || 'Continue shopping') + '</a>' +
      '</div>';
    },
  });

  OS.css('tycs', `
  .tycs{display:flex}
  .tycs-btn{display:inline-flex;align-items:center;justify-content:center;height:var(--ck-btn-h);padding:0 26px;
    border-radius:var(--ck-btn-radius);font-size:var(--ck-base-fs);font-weight:700;letter-spacing:.02em;
    text-transform:var(--ck-btn-tt);text-decoration:none;cursor:pointer;box-sizing:border-box;font-family:inherit}
  .tycs-btn.primary{background:var(--ck-btn-bg);color:var(--ck-btn-text);border:1px solid var(--ck-btn-bg)}
  .tycs-btn.primary:hover{background:var(--ck-btn-hover)}
  .tycs-btn.secondary{background:transparent;color:var(--ck-accent);border:1px solid var(--ck-accent)}
  .ckpage.mob .tycs{display:block}
  .ckpage.mob .tycs-btn{display:flex;width:100%}
  `);
})();
