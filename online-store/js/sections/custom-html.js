/* Custom HTML — sanitized HTML embed (no child blocks).
   Keeps presentational markup while removing executable/global content so editor and
   buyer-preview chrome cannot be reached from merchant HTML. No hydrate. */
(function () {
  const OS = window.OS;
  function sanitizeHtml(raw) {
    const template = document.createElement('template');
    template.innerHTML = String(raw == null ? '' : raw);
    template.content.querySelectorAll('script,style,iframe,object,embed,link,meta,base,form').forEach((el) => el.remove());
    template.content.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = String(attr.value || '').trim();
        const urlValue = value.replace(/[\u0000-\u0020]+/g, '');
        if (name.indexOf('on') === 0 || name === 'srcdoc' || name === 'formaction' || name === 'form' ||
            name === 'for' || name === 'popovertarget' || name === 'commandfor' ||
            ((name === 'href' || name === 'xlink:href') && /^(javascript:|data:)/i.test(urlValue)) ||
            (name === 'src' && /^(javascript:|data:(?!image\/(?:png|jpe?g|gif|webp|avif)(?:;base64)?,))/i.test(urlValue))) {
          el.removeAttribute(attr.name);
        }
      });
      if (el.tagName === 'A' && el.getAttribute('target') === '_blank') el.setAttribute('rel', 'noopener noreferrer');
    });
    return template.innerHTML;
  }
  OS.css('customhtml', [
    '.chx{box-sizing:border-box}',
    '.chx .ch-inner{margin:0 auto}',
    '.chx .ch-inner img{max-width:100%;height:auto}',
    '.chx .ch-empty{text-align:center;opacity:.55;font-size:13px;padding:32px 16px;border:1px dashed currentColor;border-radius:10px}',
  ].join(''));

  const DEFAULT_HTML = '<p style="text-align:center;font-size:18px;padding:40px">✦ Your custom HTML renders here ✦</p>';

  OS.register('custom-html', {
    name: 'Custom HTML', group: 'engagement', icon: 'layers',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'remove_vertical_spacing', control: 'toggle', label: 'Remove vertical spacing', default: false },
      { key: 'remove_horizontal_spacing', control: 'toggle', label: 'Remove horizontal spacing', default: false },
      { key: 'html', control: 'custom_css', label: 'HTML', default: DEFAULT_HTML, placeholder: '<div>…</div>',
        info: 'Scripts, global style tags, iframes and inline event handlers are removed for storefront safety.' },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true, info: 'Blank inherits the theme text color.' },
    ],
    defaults: () => ({}),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const bg = OS.bgOrTransparent(s.background);
      const text = OS.col(s.text, (t.colors && t.colors.text_color) || '#1a1a1a');
      const padV = s.remove_vertical_spacing ? 0 : OS.secSpace(t, mob);
      const padH = s.remove_horizontal_spacing ? 0 : OS.pagePad(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';

      const body = (s.html != null && String(s.html).trim() !== '')
        ? sanitizeHtml(s.html)
        : '<div class="ch-empty">Add HTML in the settings panel.</div>';

      return '<div class="chx" style="background:' + bg + ';color:' + text + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div class="ch-inner" style="max-width:' + maxW + '">' + body + '</div></div>';
    },
  });
})();
