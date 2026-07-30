/* Checkout · Trust badges (Content PRD §9) — Section + Badge blocks, or a single full image.
   Structured mode: icon + title + description. Static trust signal only. */
(function () {
  if (!window.OS) return;
  const { esc } = OS;

  const ICONS = {
    shield: '<path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    truck: '<rect x="1" y="4" width="14" height="12"/><path d="M15 8h4l3 3v5h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5 5.5-6"/>',
    refund: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    support: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4 2c0 1.5-2 2-2 3"/><path d="M12 17h.01"/>',
  };
  const BADGES = [
    { value: 'shield', label: 'Shield' }, { value: 'lock', label: 'Lock (secure)' }, { value: 'truck', label: 'Truck (shipping)' },
    { value: 'calendar', label: 'Calendar' }, { value: 'check', label: 'Check' }, { value: 'refund', label: 'Refund' }, { value: 'support', label: 'Support' },
  ];
  const svg = (name, size) => '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || ICONS.shield) + '</svg>';

  OS.register('checkout-trust-badges', {
    name: 'Trust badges', icon: 'layers',
    defaultZone: 'summary',
    schema: [
      { info: 'Only use badges or certifications your store is authorized to display.' },
      { key: 'content_mode', label: 'Content mode', control: 'select', default: 'structured', options: [
        { value: 'structured', label: 'Structured badges' }, { value: 'image', label: 'Full image' } ] },
      { key: 'heading', label: 'Heading', control: 'text', default: 'What To Expect' },
      { key: 'full_image', label: 'Full image', control: 'image', default: '', visibleWhen: (s) => s.content_mode === 'image' },
      { sub: 'Layout', visibleWhen: (s) => s.content_mode !== 'image' },
      { key: 'layout', label: 'Layout', control: 'select', default: 'vertical', options: [
        { value: 'vertical', label: 'Vertical list' }, { value: 'horizontal', label: 'Horizontal' }, { value: 'grid', label: 'Grid' } ], visibleWhen: (s) => s.content_mode !== 'image' },
      { key: 'per_row_desktop', label: 'Badges per row (desktop)', control: 'number', default: 3, min: 1, max: 4, visibleWhen: (s) => s.content_mode !== 'image' && s.layout === 'grid' },
      { key: 'per_row_mobile', label: 'Badges per row (mobile)', control: 'number', default: 1, min: 1, max: 2, visibleWhen: (s) => s.content_mode !== 'image' && s.layout === 'grid' },
      { key: 'icon_size', label: 'Icon size', control: 'number', default: 48, min: 24, max: 120, visibleWhen: (s) => s.content_mode !== 'image' },
      { sub: 'Style' },
      { key: 'background_color', label: 'Background color', control: 'color', default: 'transparent', allowTransparent: true },
      { key: 'text_color', label: 'Text color', control: 'color', default: '', allowTransparent: true, info: 'Empty inherits Checkout settings.' },
      { key: 'border_color', label: 'Border color', control: 'color', default: 'transparent', allowTransparent: true },
      { key: 'border_radius', label: 'Border radius', control: 'number', default: 0, min: 0, max: 24 },
      { sub: 'Advanced' },
      { key: 'custom_css', label: 'Custom CSS', control: 'custom_css', default: '' },
    ],
    defaults() { return {}; },
    blocks: {
      name: 'Badge', kind: 'badge', max: 12,
      fields: [
        { key: 'icon_source', label: 'Icon source', control: 'select', default: 'builtin', options: [
          { value: 'builtin', label: 'Built-in icon' }, { value: 'image', label: 'Custom image' } ] },
        { key: 'built_in', label: 'Built-in icon', control: 'select', default: 'shield', options: BADGES, visibleWhen: (s) => s.icon_source !== 'image' },
        { key: 'custom_image', label: 'Custom image', control: 'image', default: '', visibleWhen: (s) => s.icon_source === 'image' },
        { key: 'title', label: 'Title', control: 'text', default: '100% Satisfaction Guarantee' },
        { key: 'description', label: 'Description', control: 'textarea', default: '' },
      ],
      defaults: () => ({ icon_source: 'builtin', built_in: 'shield', title: '100% Satisfaction Guarantee' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('tb'), kind: 'badge', hidden: false, settings: { icon_source: 'builtin', built_in: 'lock', title: 'Secure SSL Checkout', description: 'Your payment information is encrypted and protected.' } },
      { id: OS.uid('tb'), kind: 'badge', hidden: false, settings: { icon_source: 'builtin', built_in: 'truck', title: 'Fast & Tracked Shipping', description: 'Every order ships with end-to-end tracking.' } },
      { id: OS.uid('tb'), kind: 'badge', hidden: false, settings: { icon_source: 'builtin', built_in: 'refund', title: '30-Day Money Back', description: 'Not happy? Return it within 30 days for a refund.' } },
    ]),

    render(s, blocks) {
      const txt = s.text_color || 'var(--ck-text)';
      const boxStyle = 'background:' + (OS.bgOrTransparent(s.background_color) || 'transparent') +
        ';border:1px solid ' + (OS.bgOrTransparent(s.border_color) || 'transparent') +
        ';border-radius:' + (s.border_radius == null ? 0 : s.border_radius) + 'px' +
        (s.border_color && s.border_color !== 'transparent' || (s.background_color && s.background_color !== 'transparent') ? ';padding:18px 20px' : '');
      let inner;
      if (s.content_mode === 'image') {
        if (!s.full_image) return '<div class="cksec" style="display:none"></div>';
        inner = '<img class="cktb-full" src="' + esc(s.full_image) + '" alt="' + esc(s.heading || 'Trust badges') + '">';
      } else {
        const size = OS.clamp(Number(s.icon_size) || 48, 24, 120, 48);
        const vis = (blocks || []).filter((b) => !b.hidden && (b.settings.title || b.settings.description));
        if (!vis.length) return '<div class="cksec" style="display:none"></div>';
        const cards = vis.map((b0) => {
          const b = b0.settings;
          const ic = (b.icon_source === 'image' && b.custom_image)
            ? '<img src="' + esc(b.custom_image) + '" style="width:' + size + 'px;height:' + size + 'px;object-fit:contain">'
            : '<span class="cktb-ico" style="width:' + size + 'px;height:' + size + 'px">' + svg(b.built_in || 'shield', Math.round(size * 0.6)) + '</span>';
          const descStyle = s.text_color ? ' style="color:' + s.text_color + '"' : '';
          return '<div class="cktb-badge" data-block-id="' + esc(b0.id) + '">' + ic +
            '<div class="cktb-meta">' + (b.title ? '<div class="cktb-title">' + esc(b.title) + '</div>' : '') +
            (b.description ? '<div class="cktb-desc"' + descStyle + '>' + esc(b.description) + '</div>' : '') + '</div></div>';
        }).join('');
        const layout = s.layout || 'vertical';
        // Vertical = 1 col; Horizontal = all badges in a single auto row; Grid = configurable.
        const cols = layout === 'vertical' ? 1 : layout === 'horizontal' ? (vis.length || 1) : OS.clamp(Number(s.per_row_desktop) || 3, 1, 4, 3);
        const colsM = layout === 'horizontal' ? (vis.length || 1) : OS.clamp(Number(s.per_row_mobile) || 1, 1, 2, 1);
        inner = '<div class="cktb-grid cktb-' + layout + '" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr));--cktb-cols-mob:' + colsM + '">' + cards + '</div>';
      }
      return '<div class="cksec cktb" style="color:' + txt + '">' +
        (s.heading ? '<div class="cksec-h">' + esc(s.heading) + '</div>' : '') +
        '<div class="cktb-box" style="' + boxStyle + '">' + inner + '</div>' +
        (s.custom_css ? '<style>' + s.custom_css + '</style>' : '') +
      '</div>';
    },
  });

  OS.css('cktb', `
  .cktb-full{display:block;max-width:100%;height:auto;margin:0 auto}
  .cktb-grid{display:grid;gap:16px}
  .cktb-vertical .cktb-badge{flex-direction:row;text-align:left}
  .cktb-badge{display:flex;gap:14px;align-items:center}
  .cktb-horizontal .cktb-badge,.cktb-grid:not(.cktb-vertical) .cktb-badge{flex-direction:column;text-align:center;align-items:center}
  .cktb-ico{flex:none;display:inline-flex;align-items:center;justify-content:center;color:var(--ck-accent)}
  .cktb-meta{min-width:0}
  .cktb-title{font-weight:700;font-size:var(--ck-base-fs);line-height:1.35;overflow-wrap:anywhere;word-break:break-word}
  .cktb-desc{font-size:var(--ck-small-fs);color:var(--ck-muted);line-height:1.5;margin-top:3px;overflow-wrap:anywhere;word-break:break-word}
  .ckpage.mob .cktb-grid{grid-template-columns:repeat(var(--cktb-cols-mob,1),minmax(0,1fr))!important}
  `);
})();
