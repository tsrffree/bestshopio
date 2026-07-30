/* Checkout · Static content (Content PRD §14) — universal notice / card / plain text.
   Section only. Does not affect order data. */
(function () {
  if (!window.OS) return;
  const { esc } = OS;

  const ICONS = {
    check: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    truck: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    shield: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z"/></svg>',
    gift: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M12 8S10.5 3 8 3 5 6 7 8M12 8s1.5-5 4-5 3 3 1 5"/></svg>',
  };

  OS.register('checkout-static-content', {
    name: 'Static content', icon: 'layers',
    schema: [
      { key: 'content_style', label: 'Content style', control: 'select', default: 'notice', options: [
        { value: 'notice', label: 'Notice bar' }, { value: 'plain', label: 'Plain text' } ] },
      { key: 'icon', label: 'Icon', control: 'select', default: 'check', options: [
        { value: 'none', label: 'No icon' }, { value: 'check', label: 'Check' }, { value: 'info', label: 'Info' }, { value: 'truck', label: 'Truck' }, { value: 'shield', label: 'Shield' }, { value: 'gift', label: 'Gift' }, { value: 'custom', label: 'Custom icon' } ] },
      { key: 'icon_image', label: 'Custom icon image', control: 'image', default: '', visibleWhen: (s) => s.icon === 'custom' },
      { key: 'heading', label: 'Heading', control: 'text', default: '', placeholder: 'Optional heading' },
      { key: 'content', label: 'Content', control: 'richtext', default: '' },
      { key: 'text_alignment', label: 'Text alignment', control: 'segmented', default: 'left', options: [
        { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' } ] },
      { sub: 'Link (optional)' },
      { key: 'link_text', label: 'Link text', control: 'text', default: '' },
      { key: 'link_url', label: 'Link URL', control: 'url', default: '' },
      { key: 'open_new_tab', label: 'Open in new tab', control: 'toggle', default: true, visibleWhen: (s) => !!s.link_url },
      { sub: 'Style' },
      { key: 'background_color', label: 'Background color', control: 'color', default: '#F0F9EB', allowTransparent: true },
      { key: 'text_color', label: 'Text color', control: 'color', default: '#1F1F1F' },
      { key: 'border_color', label: 'Border color', control: 'color', default: '#CDEBC8', allowTransparent: true },
      { key: 'border_radius', label: 'Border radius', control: 'number', default: 8, min: 0, max: 24 },
      { sub: 'Advanced' },
      { key: 'custom_css', label: 'Custom CSS', control: 'custom_css', default: '' },
    ],
    defaults() { return { content: 'Thanks for your order! We\u2019re getting it ready to ship and will email you tracking details as soon as it\u2019s on the way. Need help? Our support team replies within 24 hours.' }; },

    render(s) {
      // Back-compat: 'card' style was removed — fall back to 'notice' for saved data.
      let style = s.content_style || 'notice';
      if (style === 'card') style = 'notice';
      if (!s.heading && !s.content) return '<div class="cksec" style="display:none"></div>';
      let ico = '';
      if (s.icon === 'custom') {
        if (s.icon_image) ico = '<span class="cksc-ico cksc-ico-img"><img src="' + esc(s.icon_image) + '" alt=""></span>';
      } else if (s.icon && s.icon !== 'none') {
        ico = '<span class="cksc-ico">' + (ICONS[s.icon] || ICONS.check) + '</span>';
      }
      const link = (s.link_text && s.link_url)
        ? '<a class="cksc-link" href="' + esc(s.link_url) + '"' + (s.open_new_tab ? ' target="_blank" rel="noopener"' : '') + '>' + esc(s.link_text) + ' ›</a>'
        : '';
      const body = '<div class="cksc-body">' +
        (s.heading ? '<div class="cksc-head">' + esc(s.heading) + '</div>' : '') +
        (s.content ? '<div class="cksc-text">' + s.content + '</div>' : '') + link + '</div>';
      const boxed = style !== 'plain';
      const boxStyle = boxed
        ? 'background:' + (OS.bgOrTransparent(s.background_color) || '#F0F9EB') + ';border:1px solid ' + (OS.bgOrTransparent(s.border_color) || '#CDEBC8') + ';border-radius:' + (s.border_radius == null ? 8 : s.border_radius) + 'px;padding:14px 16px;'
        : '';
      return '<div class="cksec cksc cksc-' + style + '" style="color:' + (s.text_color || '#1F1F1F') + ';text-align:' + (s.text_alignment === 'center' ? 'center' : 'left') + '">' +
        '<div class="cksc-box" style="' + boxStyle + '">' + ico + body + '</div>' +
        (s.custom_css ? '<style>' + s.custom_css + '</style>' : '') +
      '</div>';
    },
  });

  OS.css('cksc', `
  .cksc-box{display:flex;gap:12px;align-items:flex-start}
  .cksc-ico{flex:none;display:inline-flex;margin-top:1px}
  .cksc-ico-img img{width:22px;height:22px;object-fit:cover;border-radius:6px;display:block}
  .cksc-body{min-width:0;flex:1}
  .cksc-head{font-weight:700;font-size:var(--ck-base-fs);line-height:1.4;margin-bottom:3px}
  .cksc-text{font-size:var(--ck-small-fs);line-height:1.6;opacity:.92}
  .cksc-text p{margin:0 0 6px}.cksc-text p:last-child{margin-bottom:0}
  .cksc-link{display:inline-block;margin-top:8px;font-size:var(--ck-small-fs);font-weight:600;color:var(--ck-accent);text-decoration:none}
  .cksc-card .cksc-text{font-size:var(--ck-base-fs)}
  `);
})();
