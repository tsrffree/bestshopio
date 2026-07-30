/* List collections — Collections Template page body (the /collections index). Ported 1:1
   from collection-canvas-demo (ListCollectionsPreview + ListCollectionCard,
   LIST_COLLECTIONS_SCHEMA). Section-level data selection (no blocks): empty selection =
   all active collections; selected = chosen order. */
(function () {
  const OS = window.OS;
  OS.css('list-collections', [
    '.lcx{position:relative;box-sizing:border-box}.lcx *{box-sizing:border-box}',
    '.lcx h1{margin:0 0 34px;text-align:center;line-height:1.15}',
    '.lcx .lc-grid{display:grid}',
    '.lcx .lc-card{position:relative;aspect-ratio:3/4;overflow:hidden;cursor:pointer;display:block;text-decoration:none}',
    '.lcx .lc-card .bg{position:absolute;inset:0;background-size:cover;background-position:center;transition:transform .4s}',
    '.lcx .lc-card:hover .bg{transform:scale(1.04)}',
    '.lcx .lc-card .ov{position:absolute;inset:0}',
    '.lcx .lc-card .cap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:18px;text-align:center}',
    '.lcx .lc-card .ct{font-weight:700;line-height:1.2;overflow-wrap:break-word;max-width:100%}',
    '.lcx .lc-card .arrow{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.92);color:#1a1a1a;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .18s;pointer-events:none}',
    '.lcx .lc-card:hover .arrow{opacity:1}',
    '.lcx.mob .lc-card .arrow{display:none}',
    '.lcx .lc-empty{border:1px dashed rgba(0,0,0,.18);border-radius:10px;padding:48px 16px;text-align:center;font-size:14px;opacity:.5}',
  ].join(''));

  OS.register('list-collections', {
    name: 'List collections', group: 'collection', icon: 'grid',
    schema: [
      { sub: 'Collections' },
      { key: 'selected_collections', control: 'collections', label: 'Selected collections', default: [], info: 'Leave empty to show all active collections. Selected collections display in the chosen order.' },
      { sub: 'Layout' },
      { key: 'collections_per_row_mobile', control: 'segmented', label: 'Collections per row · Mobile', default: 1, options: [{ value: '1', label: '1' }, { value: '2', label: '2' }] },
      { key: 'collections_per_row_desktop', control: 'range', label: 'Collections per row · Desktop', min: 2, max: 6, step: 1, default: 3 },
      { sub: 'Colors' },
      { key: 'text_color', control: 'color', label: 'Text', default: '#FFFFFF' },
      { key: 'overlay_color', control: 'color', label: 'Overlay', default: '#000000' },
      { key: 'overlay_opacity', control: 'range', label: 'Overlay opacity', min: 0, max: 80, step: 1, unit: '%', default: 30 },
      { sub: 'Advanced' },
      { info: 'Theme settings are inherited globally; this section only exposes its own overrides.' },
      { key: 'custom_css', control: 'custom_css', label: 'Custom CSS', default: '' },
    ],
    defaults: () => ({ selected_collections: [] }),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const all = OS.sample.collections || [];
      const sel = Array.isArray(s.selected_collections) ? s.selected_collections : [];
      const list = sel.length ? sel.map((id) => all.find((c) => c.id === id)).filter(Boolean) : all;
      const cols = mob ? (Number(s.collections_per_row_mobile) || 1) : OS.clamp(s.collections_per_row_desktop, 2, 6, 3);
      const gutter = OS.pagePad(t, mob);
      const padV = mob ? 28 : 48;
      const gap = mob ? 12 : 16;

      const card = (c) => '<a class="lc-card">' +
        '<div class="bg" style="background-image:url(' + OS.esc(c.image || OS.sample.IMG.cat1) + ')"></div>' +
        (s.overlay_opacity > 0 ? '<div class="ov" style="background:' + OS.hexAlpha(s.overlay_color || '#000', (s.overlay_opacity || 0) / 100) + '"></div>' : '') +
        '<div class="cap"><div class="ct" style="font-family:' + OS.headingFamily(t) + ';font-size:22px;color:' + (s.text_color || '#fff') + '">' + OS.esc(c.title) + '</div></div>' +
        '<div class="arrow">' + OS.icon('chevR') + '</div></a>';

      const body = list.length
        ? '<div class="lc-grid" style="grid-template-columns:repeat(' + cols + ',1fr);gap:' + gap + 'px">' + list.map(card).join('') + '</div>'
        : '<div class="lc-empty">No collections found</div>';

      return '<div class="lcx' + (mob ? ' mob' : '') + '" style="font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + gutter + 'px">' +
        '<div style="max-width:' + OS.pageWidth(t) + 'px;margin:0 auto">' +
        '<h1 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 26 : 40) + 'px;color:' + ((t.colors && t.colors.heading_color) || '#1a1a1a') + '">All collections</h1>' +
        body + '</div></div>';
    },
  });
})();
