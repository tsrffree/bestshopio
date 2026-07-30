/* Thank you · Contact us (Thank you PRD §16) — post-purchase help entry point.
   Required component. Renders "Need help? <a>Contact us</a>". Sits next to the
   Continue shopping button on PC, stacked above/below on mobile. */
(function () {
  if (!window.OS) return;
  const { esc } = OS;

  OS.register('thankyou-contact-us', {
    name: 'Contact us', icon: 'layers', pinned: true,
    schema: [
      { key: 'show_contact_us', label: 'Show contact us', control: 'toggle', default: true },
      { key: 'help_text', label: 'Help text', control: 'text', default: 'Need help?' },
      { key: 'link_text', label: 'Link text', control: 'text', default: 'Contact us' },
      { key: 'contact_link', label: 'Contact link', control: 'url', default: '', placeholder: 'Store contact page', info: 'Leave empty to link to the store contact page.' },
    ],

    render(s) {
      if (s.show_contact_us === false) return '<div class="cksec tycu" style="display:none"></div>';
      const href = s.contact_link || '#';
      return '<div class="cksec tycu">' +
        (s.help_text ? '<span class="tycu-help">' + esc(s.help_text) + '</span> ' : '') +
        '<a class="tycu-link" href="' + esc(href) + '">' + esc(s.link_text || 'Contact us') + '</a>' +
      '</div>';
    },
  });

  OS.css('tycu', `
  .tycu{display:flex;align-items:center;gap:6px;font-size:var(--ck-base-fs);color:var(--ck-muted)}
  .tycu-help{color:var(--ck-muted)}
  .tycu-link{color:var(--ck-accent);font-weight:600;text-decoration:none}
  .tycu-link:hover{text-decoration:underline}
  `);
})();
