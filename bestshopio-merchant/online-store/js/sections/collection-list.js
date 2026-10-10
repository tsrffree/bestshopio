/* Collection list — sub-category / collection navigation cards. Ported 1:1 from
   collection-canvas-demo (CollectionListPreview + CollectionCard, COLLECTION_LIST_SCHEMA +
   BLOCK_SCHEMA). Each block = one collection card (image + overlay + positioned heading).
   Stack OFF (default) = single horizontal-scroll row; Stack ON = wrap into rows of N. */
(function () {
  const OS = window.OS;
  OS.css('collection-list', [
    '.clstx{position:relative;box-sizing:border-box}.clstx *{box-sizing:border-box}',
    '.clstx .cls-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:18px}',
    '.clstx .cls-htext{display:flex;flex-direction:column;gap:4px;min-width:0}',
    '.clstx .cls-sub{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;opacity:.7}',
    '.clstx h2{margin:0;line-height:1.2}',
    '.clstx .cls-content{font-size:13px;opacity:.85;line-height:1.5;max-width:540px}',
    '.clstx .cls-view{flex-shrink:0;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;text-decoration:none}',
    '.clstx .cls-row{display:flex;gap:16px}',
    '.clstx .cls-row.scroll{overflow-x:auto;padding-bottom:4px;scrollbar-width:none}',
    '.clstx .cls-row.scroll::-webkit-scrollbar{display:none}',
    '.clstx .cls-row.stack{flex-wrap:wrap}',
    '.clstx .cls-card{position:relative;display:block;aspect-ratio:3/4;overflow:hidden;border-radius:12px;text-decoration:none;cursor:pointer}',
    '.clstx .cls-card .bg{position:absolute;inset:0;background-size:cover;background-position:center;transition:transform .4s}',
    '.clstx .cls-card:hover .bg{transform:scale(1.04)}',
    '.clstx .cls-card .ov{position:absolute;inset:0}',
    '.clstx .cls-card .cap{position:absolute;inset:0;display:flex;flex-direction:column;gap:6px;padding:18px}',
    '.clstx .cls-card .csub{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;opacity:.9}',
    '.clstx .cls-card .ch{font-weight:700;line-height:1.15;overflow-wrap:break-word;max-width:100%}',
    '.clstx .cls-empty{border:1px dashed rgba(0,0,0,.18);border-radius:10px;padding:28px 16px;text-align:center;font-size:12px;opacity:.5}',
  ].join(''));

  const HEADING_PX = { small: 16, medium: 20, large: 26, 'x-large': 34 };
  const POSITIONS = [
    { value: 'top-left', label: 'Top left' }, { value: 'top-center', label: 'Top center' }, { value: 'top-right', label: 'Top right' },
    { value: 'middle-left', label: 'Middle left' }, { value: 'middle-center', label: 'Middle center' }, { value: 'middle-right', label: 'Middle right' },
    { value: 'bottom-left', label: 'Bottom left' }, { value: 'bottom-center', label: 'Bottom center' }, { value: 'bottom-right', label: 'Bottom right' },
  ];
  function posStyle(pos) {
    const p = String(pos || 'middle-center').split('-'), v = p[0], hz = p[1];
    const justify = v === 'top' ? 'flex-start' : v === 'bottom' ? 'flex-end' : 'center';
    const align = hz === 'left' ? 'flex-start' : hz === 'right' ? 'flex-end' : 'center';
    const ta = hz === 'center' ? 'center' : hz;
    return 'justify-content:' + justify + ';align-items:' + align + ';text-align:' + ta;
  }

  OS.register('collection-list', {
    name: 'Collection list', group: 'collection', icon: 'grid',
    schema: [
      { sub: 'Header' },
      { key: 'heading', control: 'text', label: 'Heading', default: 'Collection list' },
      { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
      { key: 'content', control: 'textarea', label: 'Content', default: '' },
      { key: 'link_url', control: 'url', label: 'Link URL', default: '/collections' },
      { key: 'link_text', control: 'text', label: 'Link text', default: 'View all' },
      { sub: 'Layout' },
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false, info: 'On: background fills the browser width. Off: theme content width.' },
      { key: 'stack_collections', control: 'toggle', label: 'Stack collections', default: false, info: 'On: cards wrap into rows. Off: single horizontal-scroll row.' },
      { key: 'collections_per_row_mobile', control: 'segmented', label: 'Collections per row · Mobile', default: 1, options: [{ value: '1', label: '1' }, { value: '2', label: '2' }] },
      { key: 'collections_per_row_desktop', control: 'range', label: 'Collections per row · Desktop', min: 2, max: 5, step: 1, default: 3 },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'text_color', control: 'color', label: 'Text', default: '', allowTransparent: true, info: 'Blank inherits theme text color.' },
      { key: 'heading_color', control: 'color', label: 'Heading color', default: '', allowTransparent: true, info: 'Blank inherits theme heading color.' },
      { sub: 'Advanced' },
      { key: 'custom_css', control: 'custom_css', label: 'Custom CSS', default: '' },
    ],
    blocks: {
      name: 'Collection', kind: 'collection', max: 12,
      fields: [
        { key: 'collection', control: 'collection', label: 'Collection', default: 'best-sellers', info: 'The collection this card links to.' },
        { key: 'image', control: 'image', label: 'Image', default: '', info: 'Blank uses the collection’s image.' },
        { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
        { key: 'heading', control: 'text', label: 'Heading', default: '', info: 'Blank uses the collection’s title.' },
        { key: 'link', control: 'url', label: 'Link', default: '', info: 'Blank uses the collection’s URL.' },
        { key: 'heading_style', control: 'select', label: 'Heading style', default: 'large', options: [
          { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'x-large', label: 'X-Large' }] },
        { key: 'content_position', control: 'select', label: 'Content position', default: 'middle-center', options: POSITIONS },
        { sub: 'Colors' },
        { key: 'text_color', control: 'color', label: 'Text', default: '#FFFFFF' },
        { key: 'overlay_color', control: 'color', label: 'Overlay', default: '#000000' },
        { key: 'overlay_opacity', control: 'range', label: 'Overlay opacity', min: 0, max: 80, step: 1, unit: '%', default: 30 },
      ],
      defaults: () => ({ collection: 'best-sellers', heading_style: 'large', content_position: 'middle-center', text_color: '#FFFFFF', overlay_color: '#000000', overlay_opacity: 30 }),
    },
    defaultBlocks: () => ['new-arrivals', 'dresses', 'tops'].map((id) => ({ id: OS.uid('cl'), kind: 'collection', hidden: false, settings: { collection: id, heading_style: 'large', content_position: 'middle-center', text_color: '#FFFFFF', overlay_color: '#000000', overlay_opacity: 30 } })),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const themeText = (t.colors && t.colors.text_color) || '#1a1a1a';
      const themeHead = (t.colors && t.colors.heading_color) || '#1a1a1a';
      const textColor = OS.col(s.text_color, themeText);
      const headColor = OS.col(s.heading_color, themeHead);
      const bg = OS.bgOrTransparent(s.background);
      const cols = mob ? (Number(s.collections_per_row_mobile) || 1) : OS.clamp(s.collections_per_row_desktop, 2, 5, 3);
      const gutter = s.full_width ? 0 : OS.pagePad(t, mob);
      const padV = mob ? 24 : 36;
      const stacked = !!s.stack_collections;
      const cardW = mob ? 150 : 220, cardGap = mob ? 12 : 16;
      const items = (blocks || []).filter((b) => !b.hidden);

      // Stacked = real grid of `cols` columns (cards fill their cell). Scroll = fixed-width cards.
      const cardSizeStyle = stacked ? 'width:100%' : ('flex:0 0 ' + cardW + 'px;width:' + cardW + 'px;max-width:' + cardW + 'px');
      const card = (b0) => {
        const b = b0.settings;
        const c = OS.sample.collections.find((x) => x.id === b.collection) || {};
        const img = b.image || c.image || OS.sample.IMG.cat1;
        const heading = (b.heading && b.heading.trim()) || c.title || 'Collection';
        const headingPx = HEADING_PX[b.heading_style] || 26;
        return '<a class="cls-card" data-block-id="' + OS.esc(b0.id) + '" style="' + cardSizeStyle + '">' +
          '<div class="bg" style="background-image:url(' + OS.esc(img) + ')"></div>' +
          (b.overlay_opacity > 0 ? '<div class="ov" style="background:' + OS.hexAlpha(b.overlay_color || '#000', (b.overlay_opacity || 0) / 100) + '"></div>' : '') +
          '<div class="cap" style="' + posStyle(b.content_position) + ';color:' + (b.text_color || '#fff') + '">' +
          (b.subheading && b.subheading.trim() ? '<div class="csub">' + OS.esc(b.subheading) + '</div>' : '') +
          '<div class="ch" style="font-size:' + headingPx + 'px;font-family:' + OS.headingFamily(t) + '">' + OS.esc(heading) + '</div></div></a>';
      };

      const rowStyle = stacked
        ? 'display:grid;grid-template-columns:repeat(' + cols + ',minmax(0,1fr));gap:' + cardGap + 'px' + (mob ? '' : ';max-width:' + (cols * cardW + (cols - 1) * cardGap) + 'px')
        : 'gap:' + cardGap + 'px';
      const head = '<div class="cls-head"><div class="cls-htext">' +
        (s.subheading && s.subheading.trim() ? '<div class="cls-sub" style="color:' + textColor + '">' + OS.esc(s.subheading) + '</div>' : '') +
        (s.heading && s.heading.trim() ? '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 20 : 26) + 'px;color:' + headColor + '">' + OS.esc(s.heading) + '</h2>' : '') +
        (s.content && s.content.trim() ? '<div class="cls-content" style="color:' + textColor + '">' + OS.esc(s.content) + '</div>' : '') +
        '</div>' +
        (s.link_text && s.link_text.trim() ? '<a class="cls-view" style="cursor:pointer;color:' + textColor + '">' + OS.esc(s.link_text) + ' ' + OS.icon('chevR') + '</a>' : '') +
        '</div>';

      const body = items.length
        ? '<div class="cls-row ' + (stacked ? 'stack' : 'scroll') + '" style="' + rowStyle + '">' + items.map(card).join('') + '</div>'
        : '<div class="cls-empty">No collections yet — add one from the sidebar.</div>';

      return '<div class="clstx' + (mob ? ' mob' : '') + '" style="background:' + bg + ';color:' + textColor + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + gutter + 'px">' +
        '<div style="max-width:' + (s.full_width ? '100%' : OS.pageWidth(t) + 'px') + ';margin:0 auto">' + head + body + '</div></div>';
    },
  });
})();
