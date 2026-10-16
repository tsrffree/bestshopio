/* Collection banner — Collection-template hero. Ported 1:1 from collection-canvas-demo
   (CollectionBannerPreview / BANNER_SCHEMA). Reads the current collection (mocked) for
   title/description/image; image priority desktop = Image > Collection image, mobile =
   Mobile image > Image > Collection image; 9-grid content position; optional featured
   product card (desktop only); transparent-header overlay when it is the first section. */
(function () {
  const OS = window.OS;
  OS.css('collection-banner', [
    '.cbnx{position:relative;box-sizing:border-box}.cbnx *{box-sizing:border-box}',
    '.cbnx .cbn-frame{position:relative;width:100%;overflow:hidden}',
    '.cbnx .cbn-bg{position:absolute;inset:0;background-size:cover;background-position:center}',
    '.cbnx .cbn-ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12px}',
    '.cbnx .cbn-ov{position:absolute;inset:0}',
    '.cbnx .cbn-inner{position:absolute;inset:0;display:flex;gap:24px;align-items:stretch}',
    '.cbnx .cbn-copywrap{flex:1;min-width:0;display:flex;flex-direction:column;gap:12px}',
    '.cbnx .cbn-copy{display:flex;flex-direction:column;gap:12px}',
    '.cbnx h1{margin:0;line-height:1.1;letter-spacing:-.5px;overflow-wrap:break-word}',
    '.cbnx .cbn-desc{line-height:1.6;opacity:.92;overflow-wrap:break-word}',
    '.cbnx .cbn-fpwrap{display:flex;align-items:center;flex-shrink:0}',
    '.cbnx .cbn-fp{width:168px;background:#fff;color:#0f172a;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:7px;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(0,0,0,.16)}',
    '.cbnx .cbn-fp .lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8}',
    '.cbnx .cbn-fp .ph{width:100%;aspect-ratio:4/5;background-size:cover;background-position:center;border-radius:6px;background-color:#eef0f3}',
    '.cbnx .cbn-fp .nm{font-size:12px;font-weight:600;line-height:1.35}',
    '.cbnx .cbn-fp .pr{display:flex;align-items:baseline;gap:5px;font-size:13px;font-weight:700}.cbnx .cbn-fp .pr s{color:#94a3b8;font-weight:400;font-size:11px}',
  ].join(''));

  // Current collection (mocked — a real storefront reads it from the route).
  const COLLECTION = {
    title: 'Maternity Jeans',
    description: 'Side-panel skinnies, belly-support cuts, and wide-leg silhouettes — built for every trimester and beyond.',
  };
  const TITLE_PX = { small: 22, medium: 30, large: 38, 'x-large': 48, 'xx-large': 60 };
  const HEIGHT_PX = { original: 420, small: 260, medium: 360, large: 500, adapt: 620 };
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
  const productOptions = () => [{ value: '', label: 'None' }].concat((OS.sample.products || []).map((p) => ({ value: p.id, label: p.title })));

  OS.register('collection-banner', {
    name: 'Collection banner', group: 'collection', icon: 'image',
    schema: [
      { sub: 'Basics' },
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false, info: 'On: banner fills the browser width. Off: theme content width.' },
      { key: 'allow_transparent_header', control: 'toggle', label: 'Allow transparent header', default: false, info: 'Only when this is the page’s first section — the header overlays the banner.' },
      { key: 'show_collection_title', control: 'toggle', label: 'Show collection title', default: true },
      { key: 'show_collection_description', control: 'toggle', label: 'Show collection description', default: true },
      { key: 'show_collection_image', control: 'toggle', label: 'Show collection image', default: true, info: 'Master toggle for the banner background image.' },
      { key: 'collection_title_size', control: 'select', label: 'Collection title size', default: 'xx-large', options: [
        { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'x-large', label: 'X-Large' }, { value: 'xx-large', label: 'XX-Large' }] },
      { key: 'image_size', control: 'select', label: 'Image size', default: 'original', options: [
        { value: 'original', label: 'Original image ratio' }, { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'adapt', label: 'Adapt to screen' }] },
      { key: 'image', control: 'image', label: 'Image', default: '', info: 'Recommended 3200 × 1600px. Blank uses the collection’s own image.' },
      { key: 'mobile_image', control: 'image', label: 'Mobile image', default: '', info: 'Recommended 1300 × 1500px.' },
      { key: 'desktop_content_position', control: 'select', label: 'Desktop content position', default: 'middle-center', options: POSITIONS },
      { key: 'mobile_content_position', control: 'select', label: 'Mobile content position', default: 'middle-center', options: POSITIONS },
      { sub: 'Featured product' },
      { key: 'featured_product_id', control: 'select', label: 'Product', default: '', options: productOptions(), info: 'Shown as a card on the right (desktop only).' },
      { key: 'featured_heading', control: 'text', label: 'Heading', default: 'Featured product', visibleWhen: (s) => !!s.featured_product_id },
      { sub: 'Colors' },
      { key: 'text_color', control: 'color', label: 'Text', default: '#FFFFFF' },
      { key: 'overlay_color', control: 'color', label: 'Overlay', default: '#000000' },
      { key: 'overlay_opacity', control: 'range', label: 'Overlay opacity', min: 0, max: 80, step: 1, unit: '%', default: 30 },
    ],
    defaults: () => ({}),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const current = ctx.resource || COLLECTION;
      const collImg = current.image || OS.sample.IMG.cat3;
      const img = !s.show_collection_image ? '' : (mob ? (s.mobile_image || s.image || collImg) : (s.image || collImg));
      const hasImage = !!img;
      const height = mob ? Math.round((HEIGHT_PX[s.image_size] || 420) * 0.78) : (HEIGHT_PX[s.image_size] || 420);
      const titlePx = OS.headingSize(t, (mob ? 0.62 : 1) * (TITLE_PX[s.collection_title_size] || 60));
      const pos = mob ? s.mobile_content_position : s.desktop_content_position;
      const transparentHeader = s.allow_transparent_header && ctx.isFirst;

      const fp = (!mob && s.featured_product_id) ? (OS.sample.products.find((p) => p.id === s.featured_product_id) || null) : null;
      const sale = fp && fp.compareAt && fp.compareAt > fp.price;
      const fpCard = fp ? '<div class="cbn-fpwrap"><div class="cbn-fp">' +
        '<div class="lbl">' + OS.esc(s.featured_heading || 'Featured product') + '</div>' +
        '<div class="ph" style="background-image:url(' + OS.esc(fp.image) + ')"></div>' +
        '<div class="nm">' + OS.esc(fp.title) + '</div>' +
        '<div class="pr"><span' + (sale ? ' style="color:#dc2626"' : '') + '>' + OS.money(fp.price) + '</span>' + (sale ? '<s>' + OS.money(fp.compareAt) + '</s>' : '') + '</div>' +
        '</div></div>' : '';

      const copy = '<div class="cbn-copywrap" style="' + posStyle(pos) + '"><div class="cbn-copy" style="max-width:' + (mob ? '100%' : '560px') + ';color:' + (s.text_color || '#fff') + ';text-align:inherit">' +
        (s.show_collection_title ? '<h1 style="font-family:' + OS.headingFamily(t) + ';font-size:' + titlePx + 'px;font-weight:700">' + OS.esc(current.title || COLLECTION.title) + '</h1>' : '') +
        (s.show_collection_description ? '<div class="cbn-desc" style="font-size:' + (mob ? 13 : 15) + 'px">' + OS.esc(current.description || ((current.count != null ? current.count + ' products · ' : '') + COLLECTION.description)) + '</div>' : '') +
        '</div></div>';

      const sideGutter = s.full_width ? 0 : (mob ? 16 : 28);
      const topGutter = transparentHeader ? 0 : sideGutter;
      const radius = transparentHeader ? 0 : (sideGutter ? 12 : 0);
      const innerPadTop = transparentHeader ? (mob ? 60 : 76) : (mob ? 24 : 44);
      const innerPad = mob ? (innerPadTop + 'px 20px 24px') : (innerPadTop + 'px 56px 44px');

      const bg = hasImage
        ? '<div class="cbn-bg" style="background-image:url(' + OS.esc(img) + ')"></div>' +
          (s.overlay_opacity > 0 ? '<div class="cbn-ov" style="background:' + OS.hexAlpha(s.overlay_color || '#000', (s.overlay_opacity || 0) / 100) + '"></div>' : '')
        : '<div class="cbn-ph" style="color:#94a3b8">Show collection image is off — no background.</div>';

      return '<div class="cbnx' + (mob ? ' mob' : '') + '" style="font-family:' + OS.bodyFamily(t) + ';padding:' + topGutter + 'px ' + sideGutter + 'px 0">' +
        '<div class="cbn-frame" style="height:' + height + 'px;border-radius:' + radius + 'px;background:' + (hasImage ? '#e5e7eb' : '#f1f5f9') + '">' +
        bg +
        '<div class="cbn-inner" style="padding:' + innerPad + '">' + copy + fpCard + '</div>' +
        '</div></div>';
    },
  });
})();
