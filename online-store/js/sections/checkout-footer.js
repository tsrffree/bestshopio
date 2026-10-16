/* Checkout · Footer (Content PRD §15) — Checkout-specific footer. Section + Block kinds
   (policy link / payment icon / text line / social link / contact item). Fixed to the
   very bottom of the page; only one Footer allowed (enforced by the editor). */
(function () {
  if (!window.OS) return;
  const { esc } = OS;

  const PAY = {
    visa: { label: 'VISA', bg: '#1A1F71', fg: '#fff' }, mastercard: { label: 'MC', bg: '#fff', fg: '#222' },
    amex: { label: 'AMEX', bg: '#2E77BC', fg: '#fff' }, discover: { label: 'DISC', bg: '#fff', fg: '#222' },
    paypal: { label: 'PayPal', bg: '#fff', fg: '#003087' }, applepay: { label: 'Pay', bg: '#000', fg: '#fff' },
    googlepay: { label: 'GPay', bg: '#fff', fg: '#5F6368' }, shoppay: { label: 'shop', bg: '#5A31F4', fg: '#fff' },
  };
  const BRANDS = Object.keys(PAY).map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));
  const SOC = {
    facebook: 'f', instagram: '◎', twitter: '𝕏', youtube: '▶', tiktok: '♪',
  };
  const pageOpts = () => ((OS.sample && OS.sample.pages) || []).map((p) => p.title);

  OS.register('checkout-footer', {
    name: 'Footer', icon: 'footer',
    fixedBottom: true, singleton: true,
    // Footer renders blocks grouped into fixed regions (see render() `parts` order), not raw array
    // order. The tree lists blocks in this same region order so it matches the preview.
    blockTreeOrder: ['policy', 'social', 'text', 'payment'],
    schema: [
      { key: 'logo_image', label: 'Logo image', control: 'image', default: '' },
      { key: 'brand_name', label: 'Brand name', control: 'text', default: 'Store name' },
      { key: 'disclaimer', label: 'Disclaimer', control: 'richtext', default: '' },
      { key: 'show_policy_links', label: 'Show policy links', control: 'toggle', default: true },
      { key: 'show_contact_info', label: 'Show contact info', control: 'toggle', default: true },
      { key: 'contact_email', label: 'Contact email', control: 'text', default: 'support@store.com' },
      { key: 'contact_phone', label: 'Contact phone', control: 'text', default: '' },
      { key: 'copyright_text', label: 'Copyright text', control: 'text', default: 'Copyright {{ year }}' },
      { key: 'show_payment_icons', label: 'Show payment icons', control: 'toggle', default: true },
      { sub: 'Style' },
      { key: 'background_color', label: 'Background color', control: 'color', default: '#083B1F' },
      { key: 'text_color', label: 'Text color', control: 'color', default: '#FFFFFF' },
      { key: 'link_color', label: 'Link color', control: 'color', default: '#FFFFFF' },
      { key: 'text_alignment', label: 'Text alignment', control: 'segmented', default: 'center', options: [
        { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' } ] },
      { key: 'padding_top', label: 'Padding top', control: 'number', default: 40, min: 16, max: 100 },
      { key: 'padding_bottom', label: 'Padding bottom', control: 'number', default: 40, min: 16, max: 100 },
      { sub: 'Advanced' },
      { key: 'custom_css', label: 'Custom CSS', control: 'custom_css', default: '' },
    ],
    defaults() { return {}; },
    blocks: {
      max: 24,
      kinds: {
        policy: { name: 'Policy link', fields: [
          { key: 'link_text', label: 'Link text', control: 'text', default: 'Privacy Policy' },
          { key: 'page', label: 'Page', control: 'page', default: '' },
          { key: 'custom_url', label: 'Custom URL', control: 'url', default: '' },
          { key: 'open_new_tab', label: 'Open in new tab', control: 'toggle', default: true },
        ], defaults: () => ({ link_text: 'Privacy Policy', open_new_tab: true }) },
        payment: { name: 'Payment icon', fields: [
          { key: 'icon_source', label: 'Icon source', control: 'select', default: 'builtin', options: [
            { value: 'builtin', label: 'Built-in icon' }, { value: 'image', label: 'Custom image' } ] },
          { key: 'built_in', label: 'Built-in payment icon', control: 'select', default: 'visa', options: BRANDS, visibleWhen: (s) => s.icon_source !== 'image' },
          { key: 'custom_image', label: 'Custom image', control: 'image', default: '', visibleWhen: (s) => s.icon_source === 'image' },
          { key: 'alt_text', label: 'Alt text', control: 'text', default: '' },
        ], defaults: () => ({ icon_source: 'builtin', built_in: 'visa' }) },
        text: { name: 'Text line', fields: [
          { key: 'text_content', label: 'Text content', control: 'richtext', default: '', maxlength: 300 },
        ], defaults: () => ({}) },
        social: { name: 'Social link', fields: [
          { key: 'platform', label: 'Platform', control: 'select', default: 'facebook', options: [
            { value: 'facebook', label: 'Facebook' }, { value: 'instagram', label: 'Instagram' }, { value: 'twitter', label: 'Twitter' }, { value: 'youtube', label: 'YouTube' }, { value: 'tiktok', label: 'TikTok' } ] },
          { key: 'profile_url', label: 'Profile URL', control: 'url', default: '' },
          { key: 'open_new_tab', label: 'Open in new tab', control: 'toggle', default: true },
        ], defaults: () => ({ platform: 'facebook', open_new_tab: true }) },
      },
    },
    defaultBlocks: () => ([
      { id: OS.uid('ckf'), kind: 'policy', hidden: false, settings: { link_text: 'Privacy Policy', open_new_tab: true } },
      { id: OS.uid('ckf'), kind: 'policy', hidden: false, settings: { link_text: 'Refund Policy', open_new_tab: true } },
      { id: OS.uid('ckf'), kind: 'policy', hidden: false, settings: { link_text: 'Terms of Service', open_new_tab: true } },
      { id: OS.uid('ckf'), kind: 'payment', hidden: false, settings: { icon_source: 'builtin', built_in: 'visa' } },
      { id: OS.uid('ckf'), kind: 'payment', hidden: false, settings: { icon_source: 'builtin', built_in: 'mastercard' } },
      { id: OS.uid('ckf'), kind: 'payment', hidden: false, settings: { icon_source: 'builtin', built_in: 'amex' } },
      { id: OS.uid('ckf'), kind: 'payment', hidden: false, settings: { icon_source: 'builtin', built_in: 'paypal' } },
    ]),

    render(s, blocks) {
      const fg = s.text_color || '#fff';
      const link = s.link_color || fg;
      const align = s.text_alignment === 'left' ? 'left' : 'center';
      const list = (blocks || []).filter((b) => !b.hidden);
      const byKind = (k) => list.filter((b) => b.kind === k);
      const wrap = (id, html) => '<span data-block-id="' + esc(id) + '">' + html + '</span>';

      const logo = s.logo_image
        ? '<img class="ckft-logo-img" src="' + esc(s.logo_image) + '" alt="' + esc(s.brand_name || '') + '">'
        : (s.brand_name ? '<div class="ckft-brand">' + esc(s.brand_name) + '</div>' : '');

      const policy = s.show_policy_links ? byKind('policy').filter((b) => b.settings.link_text).map((b) => {
        const href = b.settings.custom_url || '#';
        return wrap(b.id, '<a class="ckft-link" href="' + esc(href) + '"' + (b.settings.open_new_tab ? ' target="_blank" rel="noopener"' : '') + ' style="color:' + link + '">' + esc(b.settings.link_text) + '</a>');
      }).join('<span class="ckft-sep">·</span>') : '';

      const contact = s.show_contact_info ? [
        s.contact_email ? '<span class="ckft-contact">' + esc(s.contact_email) + '</span>' : '',
        s.contact_phone ? '<span class="ckft-contact">' + esc(s.contact_phone) + '</span>' : '',
      ].filter(Boolean).join('') : '';

      const social = byKind('social').filter((b) => b.settings.profile_url).map((b) =>
        wrap(b.id, '<a class="ckft-soc" href="' + esc(b.settings.profile_url) + '"' + (b.settings.open_new_tab ? ' target="_blank" rel="noopener"' : '') + ' style="color:' + link + '">' + (SOC[b.settings.platform] || '•') + '</a>')).join('');

      const texts = byKind('text').filter((b) => b.settings.text_content).map((b) =>
        wrap(b.id, '<div class="ckft-textline" style="text-align:' + align + '">' + b.settings.text_content + '</div>')).join('');

      const pay = s.show_payment_icons ? byKind('payment').filter((b) => b.settings.icon_source !== 'image' || b.settings.custom_image).map((b) => {
        const node = (b.settings.icon_source === 'image' && b.settings.custom_image)
          ? '<img class="ckft-pay-img" src="' + esc(b.settings.custom_image) + '" alt="' + esc(b.settings.alt_text || '') + '">'
          : (function () { const p = PAY[b.settings.built_in] || PAY.visa; return '<span class="ckft-pay" style="background:' + p.bg + ';color:' + p.fg + '">' + esc(p.label) + '</span>'; })();
        return wrap(b.id, node);
      }).join('') : '';

      const copyright = s.copyright_text ? '<div class="ckft-copy">' + esc(s.copyright_text.replace(/\{\{\s*year\s*\}\}/g, '2026').replace(/\{\{\s*shop_name\s*\}\}/g, s.brand_name || 'Store')) + '</div>' : '';

      const parts = [
        logo ? '<div class="ckft-row ckft-logo">' + logo + '</div>' : '',
        s.disclaimer ? '<div class="ckft-disclaimer">' + s.disclaimer + '</div>' : '',
        policy ? '<div class="ckft-row ckft-policies">' + policy + '</div>' : '',
        contact ? '<div class="ckft-row ckft-contacts">' + contact + '</div>' : '',
        social ? '<div class="ckft-row ckft-socials">' + social + '</div>' : '',
        texts,
        pay ? '<div class="ckft-row ckft-pays">' + pay + '</div>' : '',
        copyright,
      ].filter(Boolean).join('');

      return '<div class="cksec ckft" style="background:' + (s.background_color || '#083B1F') + ';color:' + fg + ';text-align:' + align +
        ';padding:' + (s.padding_top == null ? 40 : s.padding_top) + 'px 24px ' + (s.padding_bottom == null ? 40 : s.padding_bottom) + 'px">' +
        '<div class="ckft-inner">' + parts + '</div>' +
        (s.custom_css ? '<style>' + s.custom_css + '</style>' : '') +
      '</div>';
    },
  });

  OS.css('ckft', `
  .ckft{font-size:var(--ck-small-fs)}
  .ckft-inner{max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:14px;align-items:center}
  .ckft[style*="left"] .ckft-inner{align-items:flex-start}
  .ckft-row{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;justify-content:center}
  .ckft[style*="left"] .ckft-row{justify-content:flex-start}
  .ckft-brand{font-weight:800;font-size:20px;letter-spacing:-.01em}
  .ckft-logo-img{max-height:36px;width:auto}
  .ckft-disclaimer{font-size:var(--ck-small-fs);line-height:1.6;opacity:.85}
  .ckft-disclaimer p{margin:0 0 6px}
  .ckft-link{text-decoration:none;opacity:.9}.ckft-link:hover{opacity:1;text-decoration:underline}
  .ckft-sep{opacity:.45}
  .ckft-contact{opacity:.9}
  .ckft-soc{display:inline-flex;width:30px;height:30px;border-radius:50%;align-items:center;justify-content:center;border:1px solid currentColor;text-decoration:none;font-size:13px;opacity:.85}
  .ckft-soc:hover{opacity:1}
  .ckft-textline{width:100%;opacity:.85;line-height:1.6}
  .ckft-pay{display:inline-flex;align-items:center;justify-content:center;min-width:40px;height:26px;padding:0 7px;border-radius:4px;font-weight:800;font-size:10px;box-shadow:0 0 0 1px rgba(0,0,0,.08)}
  .ckft-pay-img{height:26px;width:auto;border-radius:4px}
  .ckft-copy{opacity:.7;font-size:11px;margin-top:2px}
  `);
})();
