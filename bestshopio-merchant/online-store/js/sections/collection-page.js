/* Collection page — product feed for the current collection. Ported 1:1 from
   collection-canvas-demo (CollectionPagePreview + filter/sort/pagination/quick-add stack,
   PANEL_SCHEMA, 24-product faceted dataset). Cross-group AND, same-group OR, price range,
   faceted counts, selected chips + clear all, system sort, grid/list, 3 pagination modes,
   product-card overrides, badge priority (custom > collection > auto discount), promotion
   text, quick-add modal, and loading / empty / normal demo states.

   Ephemeral storefront state (active filters, sort, view, page, demo state) lives in a
   module map keyed by section id: render() paints from it; hydrate() mutates it and
   repaints the section body in place, mirroring the React component's local state. */
(function () {
  const OS = window.OS;
  OS.css('collection-page', [
    '.cpgx{position:relative;box-sizing:border-box}.cpgx *{box-sizing:border-box}',
    '.cpgx .cpg-bc{display:flex;flex-wrap:wrap;gap:6px;font-size:12px;color:#94a3b8}',
    '.cpgx .cpg-bc b{font-weight:600;color:#0f172a}',
    '.cpgx .cpg-title{font-weight:700;letter-spacing:-.2px}',
    '.cpgx .cpg-desc{color:#475569;line-height:1.55;max-width:640px}',
    '.cpgx .cpg-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:10px 0;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569}',
    '.cpgx .cpg-barl,.cpgx .cpg-barr{display:flex;align-items:center;gap:12px}',
    '.cpgx .cpg-fbtn,.cpgx .cpg-sort,.cpgx .cpg-vtoggle{font-family:inherit}',
    '.cpgx .cpg-fbtn{display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 12px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;color:var(--cpg-text,#0f172a);font-size:13px;font-weight:600;cursor:pointer}',
    '.cpgx .cpg-sortwrap{display:inline-flex;align-items:center;gap:8px;white-space:nowrap;color:var(--cpg-text,#475569)}',
    '.cpgx .cpg-sort{height:32px;border:1px solid #cbd5e1;border-radius:6px;padding:0 8px;font-size:12px;background:#fff;color:var(--cpg-text,#0f172a);font-weight:600;cursor:pointer}',
    '.cpgx .cpg-vtoggle{display:inline-flex;border:1px solid #cbd5e1;border-radius:6px;overflow:hidden}',
    '.cpgx .cpg-vtoggle button{width:32px;height:32px;border:0;background:#fff;color:#475569;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}',
    '.cpgx .cpg-vtoggle button.on{background:#eff6ff;color:#2563eb}',
    '.cpgx .cpg-body{display:flex;gap:28px;align-items:flex-start}',
    '.cpgx .cpg-feed{flex:1;min-width:0;display:flex;flex-direction:column;gap:14px}',
    '.cpgx .cpg-side{width:230px;flex-shrink:0;display:flex;flex-direction:column;gap:2px}',
    '.cpgx .cpg-side-h{font-size:14px;font-weight:700;color:var(--cpg-text,#0f172a);padding:2px 0 8px}',
    '.cpgx .cpg-fg{border-bottom:1px solid #e2e8f0}',
    '.cpgx .cpg-fg-h{width:100%;display:flex;align-items:center;justify-content:space-between;padding:11px 0;border:0;background:none;cursor:pointer;color:var(--cpg-text,#0f172a);font-size:13px;font-weight:600;font-family:inherit}',
    '.cpgx .cpg-fg-h .cv{display:inline-flex;color:#94a3b8;transition:transform .15s}.cpgx .cpg-fg.open .cpg-fg-h .cv{transform:rotate(180deg)}',
    '.cpgx .cpg-fg-b{padding-bottom:12px;display:none}.cpgx .cpg-fg.open .cpg-fg-b{display:block}',
    '.cpgx .cpg-opt{display:flex;align-items:center;gap:10px;border:0;background:none;cursor:pointer;padding:3px 0;color:var(--cpg-text,#0f172a);width:100%;text-align:left;font-family:inherit}',
    '.cpgx .cpg-opt.dis{color:#94a3b8;cursor:default}',
    '.cpgx .cpg-opt .lb{flex:1;font-size:13px}.cpgx .cpg-opt .cn{font-size:12px;color:#94a3b8}',
    '.cpgx .cpg-ck{width:16px;height:16px;border-radius:4px;border:1px solid #cbd5e1;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}.cpgx .cpg-opt.on .cpg-ck{background:#2563eb;border-color:#2563eb}',
    '.cpgx .cpg-sw{width:20px;height:20px;border-radius:50%;border:1px solid #cbd5e1;flex-shrink:0}.cpgx .cpg-opt.on .cpg-sw{box-shadow:0 0 0 2px #fff,0 0 0 3px #2563eb}',
    '.cpgx .cpg-price{display:flex;flex-direction:column;gap:8px}.cpgx .cpg-prow{display:flex;align-items:center;gap:8px}',
    '.cpgx .cpg-pin{display:flex;align-items:center;flex:1;height:32px;border:1px solid #cbd5e1;border-radius:6px;padding:0 8px;gap:4px;background:#fff}',
    '.cpgx .cpg-pin input{width:100%;border:0;outline:0;font-size:13px;color:var(--cpg-text,#0f172a);background:transparent;font-family:inherit}',
    '.cpgx .cpg-chips{display:flex;flex-wrap:wrap;align-items:center;gap:8px}',
    '.cpgx .cpg-chip{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 6px 0 10px;border:1px solid #cbd5e1;border-radius:999px;background:#f1f5f9;color:#0f172a;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit}',
    '.cpgx .cpg-clear{height:28px;padding:0 8px;border:0;background:none;color:#2563eb;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}',
    '.cpgx .cpg-topbar{display:flex;flex-wrap:wrap;gap:10px;position:relative;z-index:5}',
    '.cpgx .cpg-tb{display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 12px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:var(--cpg-text,#0f172a);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}.cpgx .cpg-tb.on{border-color:#2563eb;background:#eff6ff}',
    '.cpgx .cpg-tbpop{position:absolute;top:calc(100% + 6px);left:0;min-width:230px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;z-index:6;box-shadow:0 14px 36px rgba(15,23,42,.14)}',
    '.cpgx .cpg-grid{display:grid;gap:16px}',
    '.cpgx .cpg-pc{display:flex;flex-direction:column;gap:8px;font-size:13px}',
    '.cpgx .cpg-media{position:relative;width:100%;aspect-ratio:3/4;border-radius:6px;overflow:hidden;background:#eef0f3}',
    '.cpgx .cpg-media .im{position:absolute;inset:0;background-size:cover;background-position:center}',
    '.cpgx .cpg-media .im.alt{opacity:0;transition:opacity .28s}',
    '.cpgx .cpg-media.hov:hover .im.alt{opacity:1}',
    '.cpgx .cpg-badge{position:absolute;top:8px;left:8px;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.4px;z-index:2;color:#fff}',
    '.cpgx .cpg-qa{position:absolute;left:0;right:0;bottom:12px;display:flex;justify-content:center;opacity:0;transform:translateY(8px);transition:opacity .18s,transform .18s;pointer-events:none}',
    '.cpgx .cpg-media.hov:hover .cpg-qa{opacity:1;transform:none;pointer-events:auto}',
    '.cpgx .cpg-qa button{display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 20px;border:0;border-radius:999px;background:#0f172a;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}',
    '.cpgx .cpg-qa-fab{position:absolute;right:10px;bottom:10px;width:40px;height:40px;border-radius:999px;border:0;background:#0f172a;color:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;z-index:3}',
    '.cpgx .cpg-vendor{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px}',
    '.cpgx .cpg-pt{font-size:13px;color:#0f172a;font-weight:500;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.cpgx .cpg-rate{display:flex;align-items:center;gap:5px;font-size:12px;color:#475569}.cpgx .cpg-rate .stars{display:inline-flex;gap:1px;color:#f5b301}.cpgx .cpg-rate .stars .o{color:#cbd5e1}',
    '.cpgx .cpg-pr{display:flex;align-items:baseline;gap:6px;font-weight:700;color:#0f172a}.cpgx .cpg-pr .sale{color:#dc2626}.cpgx .cpg-pr s{color:#94a3b8;font-weight:400;font-size:12px}',
    '.cpgx .cpg-promo{font-size:11px;color:#2563eb;font-weight:600}',
    '.cpgx .cpg-swatches{display:flex;align-items:center;gap:6px}.cpgx .cpg-swatches button{width:22px;height:22px;padding:0;border-radius:999px;border:1px solid #cbd5e1;cursor:pointer}.cpgx .cpg-swatches button.sq{border-radius:5px}.cpgx .cpg-swatches button.on{outline:2px solid #0f172a;outline-offset:1px}',
    '.cpgx .cpg-list{display:flex;flex-direction:column;gap:14px}',
    '.cpgx .cpg-lrow{display:flex;gap:16px;padding:14px;border:1px solid #e2e8f0;border-radius:10px}',
    '.cpgx .cpg-lrow .cpg-media{width:132px;flex-shrink:0;aspect-ratio:3/4}',
    '.cpgx .cpg-lrow .info{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}',
    '.cpgx .cpg-pager{display:flex;align-items:center;justify-content:center;gap:6px;padding-top:6px}',
    '.cpgx .cpg-pg{min-width:32px;height:32px;padding:0 8px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;color:#0f172a;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}.cpgx .cpg-pg.on{border-color:#2563eb;background:#2563eb;color:#fff}.cpgx .cpg-pg[disabled]{opacity:.5;cursor:not-allowed}',
    '.cpgx .cpg-more{display:flex;justify-content:center;padding-top:6px}.cpgx .cpg-more button{height:40px;padding:0 24px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#0f172a;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}',
    '.cpgx .cpg-empty{padding:48px 20px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}.cpgx .cpg-empty .t{font-size:15px;font-weight:700;color:#0f172a}.cpgx .cpg-empty .d{font-size:13px;color:#475569;max-width:320px;line-height:1.55}',
    '.cpgx .cpg-empty .b{height:40px;padding:0 18px;border:0;border-radius:8px;background:#0f172a;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}',
    '.cpgx .cpg-skb{background:#f1f5f9;border-radius:6px}',
    '.cpgx .cpg-url{border-top:1px solid #e2e8f0;padding:8px 16px;background:#f1f5f9;display:flex;align-items:center;gap:8px;font-size:11px}.cpgx .cpg-url .k{color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.6px;flex-shrink:0}.cpgx .cpg-url .v{color:#475569;font-family:ui-monospace,Menlo,monospace;overflow-x:auto;white-space:nowrap}',
    '.cpgx .cpg-states{position:absolute;top:10px;right:10px;z-index:7;display:inline-flex;background:#fff;border:1px solid #cbd5e1;border-radius:999px;padding:2px;gap:2px}',
    '.cpgx .cpg-states button{padding:3px 10px;border:0;border-radius:999px;background:none;color:#475569;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit}.cpgx .cpg-states button.on{background:#2563eb;color:#fff}',
    '.cpgx .cpg-drawer{position:absolute;inset:0;z-index:30;display:flex;justify-content:flex-end}',
    '.cpgx .cpg-drawer .scrim{position:absolute;inset:0;background:rgba(15,23,42,.45)}',
    '.cpgx .cpg-drawer .panel{position:relative;width:320px;max-width:88%;background:#fff;height:100%;display:flex;flex-direction:column;border-left:1px solid #e2e8f0}',
    '.cpgx .cpg-drawer .dh{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:700;color:var(--cpg-text,#0f172a)}',
    '.cpgx .cpg-drawer .db{flex:1;overflow-y:auto;padding:4px 16px 16px}',
    '.cpgx .cpg-drawer .df{display:flex;gap:10px;padding:12px 16px;border-top:1px solid #e2e8f0}',
    '.cpgx .cpg-drawer .df button{flex:1;height:40px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}',
    '.cpgx .cpg-drawer .df .c{border:1px solid #cbd5e1;background:#fff;color:#0f172a}.cpgx .cpg-drawer .df .a{border:0;background:#2563eb;color:#fff}',
    '.cpgx .cpg-iconbtn{width:28px;height:28px;border:0;background:none;color:#475569;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;border-radius:4px}',
    '.cpgx .cpg-modal{position:absolute;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:20px}',
    '.cpgx .cpg-modal .scrim{position:absolute;inset:0;background:rgba(15,23,42,.45)}',
    '.cpgx .cpg-modal .box{position:relative;width:440px;max-width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,.28)}',
    '.cpgx .cpg-modal .mh{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#0f172a}',
    '.cpgx .cpg-modal .sizes{display:flex;gap:8px;flex-wrap:wrap}.cpgx .cpg-modal .sizes button{min-width:44px;height:38px;padding:0 12px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#0f172a;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}.cpgx .cpg-modal .sizes button.on{border-color:#2563eb;background:#eff6ff;color:#2563eb}',
    '.cpgx .cpg-modal .atc{width:100%;height:44px;border:0;border-radius:8px;background:#0f172a;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}',
    '.cpgx .cpg-toast{position:absolute;bottom:60px;left:50%;transform:translateX(-50%);padding:10px 16px;background:#0f172a;color:#fff;border-radius:6px;font-size:13px;font-weight:500;z-index:45;display:flex;align-items:center;gap:8px;max-width:82%}.cpgx .cpg-toast i{width:7px;height:7px;border-radius:999px;background:#34d399;flex-shrink:0}.cpgx .cpg-toast span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.cpgx.mob .cpg-body{flex-direction:column}.cpgx.mob .cpg-side{display:none}.cpgx.mob .cpg-lrow .cpg-media{width:110px}',
  ].join(''));

  // ---- collection + filter model (self-contained, from the demo dataset) ----
  const COLLECTION = { title: 'Maternity Jeans', handle: 'maternity-jeans', breadcrumb: ['Home', 'Collections', 'Maternity Jeans'],
    description: 'Side-panel skinnies, belly-support cuts, and wide-leg silhouettes — built for every trimester and beyond.' };
  const FILTER_GROUPS = [
    { id: 'categories', label: 'Maternity Categories', kind: 'list' },
    { id: 'styling', label: 'Styling Details', kind: 'list' },
    { id: 'color', label: 'Color', kind: 'swatch' },
    { id: 'price', label: 'Price Range', kind: 'price' },
    { id: 'size', label: 'Size', kind: 'list' },
  ];
  const GROUP_VALUE_ORDER = {
    categories: ['Maternity Jeans', 'Maternity Pants', 'Maternity Shorts', 'Active', 'Postpartum'],
    styling: ['Skinny fit', 'Wide leg', 'Boyfriend', 'Tapered', 'Legging', 'Slim straight', 'Flare', 'Cargo', 'Jogger', 'Pleated'],
    color: ['Black', 'White', 'Navy', 'Light Blue'],
    size: ['S', 'M', 'L'],
  };
  const COLOR_SWATCHES = { Black: '#1F2937', White: '#E5E7EB', Navy: '#1E3A5F', 'Light Blue': '#93C5FD' };
  const PRICE_BOUNDS = { min: 0, max: 140 };
  const SORTS = [
    { value: 'featured', label: 'Featured' }, { value: 'best-selling', label: 'Best selling' },
    { value: 'price-asc', label: 'Price, low to high' }, { value: 'price-desc', label: 'Price, high to low' },
    { value: 'date-desc', label: 'Date, new to old' }, { value: 'date-asc', label: 'Date, old to new' },
  ];
  const SWATCH_PALETTE = [
    { label: 'Blush', color: '#F9A8D4' }, { label: 'Petal', color: '#FBCFE8' }, { label: 'Cobalt', color: '#2563EB' },
    { label: 'Crimson', color: '#EF4444' }, { label: 'Ink', color: '#1F2937' }, { label: 'Sand', color: '#D6C7A1' }, { label: 'Sage', color: '#A7C4A0' },
  ];
  const P = (id, title, vendor, price, cmp, rating, rev, cIdx, sIdx, color, size, category, styling, badge) =>
    ({ id, title, vendor, price, comparePrice: cmp, rating, reviewCount: rev, createdIdx: cIdx, salesIdx: sIdx, color, size, category, styling, badge });
  const PRODUCTS = [
    P('p-01', 'Side-Panel Maternity Skinny Jeans', 'Northwind Mama', 68, 98, 4.7, 184, 24, 22, 'Black', 'M', 'Maternity Jeans', 'Skinny fit'),
    P('p-02', 'High-Rise Wide-Leg Maternity Jean', 'Northwind Mama', 78, null, 4.5, 92, 23, 17, 'Light Blue', 'L', 'Maternity Jeans', 'Wide leg'),
    P('p-03', 'Cropped Soft-Touch Boyfriend Jean', 'Linen Loft', 56, 84, 4.3, 47, 22, 13, 'Navy', 'S', 'Maternity Jeans', 'Boyfriend'),
    P('p-04', 'Over-Bump Stretch Skinny Jean', 'Northwind Mama', 88, null, 4.8, 412, 21, 24, 'Black', 'M', 'Maternity Jeans', 'Skinny fit', 'Best seller'),
    P('p-05', 'Mid-Rise Tapered Maternity Pant', 'Atlas Goods', 64, 96, 4.1, 31, 20, 9, 'White', 'L', 'Maternity Pants', 'Tapered'),
    P('p-06', 'Side-Ruched Maternity Legging', 'Linen Loft', 42, null, 4.6, 220, 19, 19, 'Black', 'S', 'Maternity Pants', 'Legging'),
    P('p-07', 'Belly-Support Activewear Pant', 'Atlas Goods', 58, 72, 4.4, 76, 18, 15, 'Navy', 'M', 'Active', 'Legging'),
    P('p-08', 'Soft-Stretch Maternity Sweatpant', 'Linen Loft', 48, null, 4.2, 58, 17, 11, 'Light Blue', 'L', 'Active', 'Tapered'),
    P('p-09', 'Maternity Linen Wide-Leg Trouser', 'Linen Loft', 96, null, 4.9, 311, 16, 21, 'White', 'M', 'Maternity Pants', 'Wide leg', 'New'),
    P('p-10', 'Postpartum Recovery Lounge Pant', 'Northwind Mama', 52, 68, 4.4, 102, 15, 14, 'Black', 'S', 'Postpartum', 'Tapered'),
    P('p-11', 'Belly-Cradle Skinny Denim Short', 'Atlas Goods', 38, 58, 4.0, 41, 14, 8, 'Navy', 'L', 'Maternity Shorts', 'Skinny fit'),
    P('p-12', 'Pleated Wide-Leg Crepe Trouser', 'Atelier Nine', 118, null, 4.6, 67, 13, 12, 'Light Blue', 'M', 'Maternity Pants', 'Wide leg'),
    P('p-13', 'Soft Bermuda Maternity Short', 'Linen Loft', 44, null, 4.2, 54, 12, 10, 'White', 'S', 'Maternity Shorts', 'Boyfriend'),
    P('p-14', 'Cinched-Waist Maternity Cargo', 'Atlas Goods', 82, 110, 4.3, 88, 11, 16, 'Black', 'L', 'Maternity Pants', 'Cargo'),
    P('p-15', 'Postnatal Compression Legging', 'Northwind Mama', 62, null, 4.7, 198, 10, 18, 'Navy', 'M', 'Postpartum', 'Legging'),
    P('p-16', 'Studio Pleat-Front Wide Trouser', 'Atelier Nine', 132, 168, 4.8, 122, 9, 20, 'Light Blue', 'S', 'Maternity Pants', 'Wide leg'),
    P('p-17', 'Everyday Knit Maternity Jogger', 'Linen Loft', 46, null, 4.5, 178, 8, 23, 'White', 'L', 'Active', 'Jogger'),
    P('p-18', 'Maternity Slim-Straight Raw Denim', 'Northwind Mama', 92, null, 4.4, 64, 7, 6, 'Black', 'M', 'Maternity Jeans', 'Slim straight'),
    P('p-19', 'Cropped Flare Maternity Jean', 'Atelier Nine', 108, 136, 4.6, 142, 6, 7, 'Navy', 'S', 'Maternity Jeans', 'Flare'),
    P('p-20', 'Side-Pocket Maternity Lounge Short', 'Atlas Goods', 36, null, 4.0, 28, 5, 5, 'Light Blue', 'L', 'Maternity Shorts', 'Boyfriend'),
    P('p-21', 'Wide-Hem Linen Maternity Pant', 'Linen Loft', 86, null, 4.7, 96, 4, 4, 'White', 'M', 'Maternity Pants', 'Wide leg'),
    P('p-22', 'Eco-Knit Side-Panel Maternity Pant', 'Northwind Mama', 74, 92, 4.5, 134, 3, 3, 'Black', 'S', 'Active', 'Legging'),
    P('p-23', 'Belly-Band Crop Workout Legging', 'Atlas Goods', 54, null, 4.3, 71, 2, 2, 'Navy', 'L', 'Active', 'Legging'),
    P('p-24', 'Pleated Soft Crepe Maternity Pant', 'Atelier Nine', 124, null, 4.8, 89, 1, 1, 'Light Blue', 'M', 'Maternity Pants', 'Pleated'),
  ];
  function imgFor(i) { const a = OS.sample.products; return a[i % a.length].image; }
  function altImgFor(i) { const a = OS.sample.products; return a[(i + 3) % a.length].image; }
  function groupVal(p, g) { return g === 'categories' ? p.category : g === 'styling' ? p.styling : g === 'color' ? p.color : g === 'size' ? p.size : ''; }
  function matches(p, fs, exclude) {
    for (const g of FILTER_GROUPS) {
      if (g.id === exclude) continue;
      if (g.kind === 'price') { if (fs.priceMin != null && p.price < fs.priceMin) return false; if (fs.priceMax != null && p.price > fs.priceMax) return false; }
      else { const sel = fs.selections[g.id] || []; if (sel.length && sel.indexOf(groupVal(p, g.id)) < 0) return false; }
    }
    return true;
  }
  function facet(g, v, fs) { return PRODUCTS.filter((p) => groupVal(p, g) === v && matches(p, fs, g)).length; }
  function activeCount(fs) { let n = 0; for (const k in fs.selections) n += (fs.selections[k] || []).length; if (fs.priceMin != null || fs.priceMax != null) n += 1; return n; }
  function sortP(list, s) {
    const a = list.slice();
    if (s === 'best-selling') return a.sort((x, y) => y.salesIdx - x.salesIdx);
    if (s === 'price-asc') return a.sort((x, y) => x.price - y.price);
    if (s === 'price-desc') return a.sort((x, y) => y.price - x.price);
    if (s === 'date-desc') return a.sort((x, y) => y.createdIdx - x.createdIdx);
    if (s === 'date-asc') return a.sort((x, y) => x.createdIdx - y.createdIdx);
    return a;
  }
  function sortParam(s) { return ({ featured: 'manual', 'best-selling': 'best-selling', 'price-asc': 'price-ascending', 'price-desc': 'price-descending', 'date-desc': 'created-descending', 'date-asc': 'created-ascending' })[s] || 'manual'; }
  function slug(v) { return String(v).toLowerCase().replace(/\s+/g, '-'); }
  function buildUrl(fs, sort, page, view) {
    const q = [];
    for (const g of FILTER_GROUPS) { if (g.kind === 'price') continue; for (const v of fs.selections[g.id] || []) q.push('filter.' + g.id + '=' + slug(v)); }
    if (fs.priceMin != null) q.push('filter.price.min=' + fs.priceMin);
    if (fs.priceMax != null) q.push('filter.price.max=' + fs.priceMax);
    q.push('sort_by=' + sortParam(sort)); if (page > 1) q.push('page=' + page); q.push('view=' + view);
    return '/collections/' + COLLECTION.handle + (q.length ? '?' + q.join('&') : '');
  }
  function swatchesFor(p) { const off = (Number(p.id.replace(/\D/g, '')) || 0) % SWATCH_PALETTE.length; return SWATCH_PALETTE.map((_, i) => SWATCH_PALETTE[(i + off) % SWATCH_PALETTE.length]); }

  // small icons
  const sicon = {
    filter: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 5h18M6 12h12M10 19h4"/></svg>',
    chev: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    grid: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    list: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    check: '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    bag: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>',
  };
  const stars = (r) => { const f = Math.round(r); let h = ''; for (let i = 0; i < 5; i++) h += '<span' + (i < f ? '' : ' class="o"') + '>' + OS.icon('star') + '</span>'; return '<span class="stars">' + h + '</span>'; };

  // ---- ephemeral state per section id ----
  const STATE = {};
  function freshState(s) { return { filters: { selections: {}, priceMin: null, priceMax: null }, sort: s.default_sort, view: s.layout_type, page: 1, loaded: 1, demo: 'normal', drawer: false, quickAdd: null, toast: null, topbar: null, open: {}, swatch: {}, _ds: s.default_sort, _lt: s.layout_type }; }
  function getState(id, s) { if (!STATE[id]) STATE[id] = freshState(s); return STATE[id]; }
  function syncState(st, s) {
    if (st._ds !== s.default_sort) { st.sort = s.default_sort; st._ds = s.default_sort; }
    if (st._lt !== s.layout_type) { st.view = s.layout_type; st._lt = s.layout_type; }
  }

  function resolveBadge(p, s) {
    if (s.show_collection_badge) return { text: p.category, bg: '#2563eb' };
    if (s.show_badge && p.comparePrice != null && p.comparePrice > p.price) return { text: Math.round((p.comparePrice - p.price) / p.comparePrice * 100) + '% OFF', bg: '#dc2626' };
    return null;
  }
  function resolvePromo(p, s) {
    if (!s.show_promotion_text) return null;
    if (s.promotion_text_source === 'custom') return (s.custom_promotion_text || '').trim() || null;
    if (p.comparePrice != null && p.comparePrice > p.price) return 'Limited-time deal';
    if (p.salesIdx >= 20) return 'Trending now';
    return null;
  }

  // ---- inner render (paints from settings + ephemeral state) ----
  function inner(s, ctx, st) {
    const mob = ctx.mob;
    const current = ctx.resource || COLLECTION;
    const breadcrumb = ['Home', 'Collections', current.title || COLLECTION.title];
    const filtered = PRODUCTS.filter((p) => matches(p, st.filters));
    const sorted = sortP(filtered, st.sort);
    const total = PRODUCTS.length, match = filtered.length, af = activeCount(st.filters);
    const perPage = OS.clamp(s.products_per_page, 12, 100, 50);
    const totalPages = Math.max(1, Math.ceil(match / perPage));
    const isPaged = s.pagination_type === 'pagination';
    const safePage = Math.min(st.page, totalPages);
    const shown = Math.min(perPage * st.loaded, match);
    const visible = isPaged ? sorted.slice((safePage - 1) * perPage, safePage * perPage) : sorted.slice(0, shown);
    const hasMore = !isPaged && shown < match;
    const curPage = isPaged ? safePage : st.loaded;
    const isListDesktop = st.view === 'list' && !mob;
    const cols = mob ? (st.view === 'list' ? 1 : (Number(s.products_per_row_mobile) || 2)) : (isListDesktop ? 1 : OS.clamp(s.products_per_row_desktop, 2, 6, 4));

    const showFilters = s.show_filters;
    const useSidebar = showFilters && !mob && s.desktop_layout === 'sidebar';
    const useTopbar = showFilters && !mob && s.desktop_layout === 'topbar';
    const useDrawerBtn = showFilters && (mob || s.desktop_layout === 'drawer');

    // header
    let h = '';
    if (s.show_breadcrumb) h += '<div class="cpg-bc">' + breadcrumb.map((seg, i) => (i === breadcrumb.length - 1 ? '<b>' + OS.esc(seg) + '</b>' : OS.esc(seg) + ' <span>/</span>')).join(' ') + '</div>';
    if (s.show_collection_title || s.show_collection_description) {
      h += '<div>' +
        (s.show_collection_title ? '<div class="cpg-title" style="font-family:' + OS.headingFamily(ctx.tokens) + ';font-size:' + OS.headingSize(ctx.tokens, mob ? 22 : 28) + 'px;color:' + ((ctx.tokens.colors && ctx.tokens.colors.heading_color) || '#0f172a') + '">' + OS.esc(current.title || COLLECTION.title) + '</div>' : '') +
        (s.show_collection_description ? '<div class="cpg-desc" style="font-size:' + (mob ? 13 : 14) + 'px;margin-top:6px">' + OS.esc(current.description || COLLECTION.description) + '</div>' : '') + '</div>';
    }

    // toolbar
    const sortSel = s.show_sort_by ? '<label class="cpg-sortwrap"><span>Sort by</span><select class="cpg-sort" data-cpg-sort>' + SORTS.map((o) => '<option value="' + o.value + '"' + (o.value === st.sort ? ' selected' : '') + '>' + o.label + '</option>').join('') + '</select></label>' : '';
    const vToggle = !mob ? '<div class="cpg-vtoggle">' + ['grid', 'list'].map((v) => '<button data-cpg-view="' + v + '"' + (v === st.view ? ' class="on"' : '') + '>' + (v === 'grid' ? sicon.grid : sicon.list) + '</button>').join('') + '</div>' : '';
    const fbtn = useDrawerBtn ? '<button class="cpg-fbtn" data-cpg-drawer>' + sicon.filter + ' Filters' + (af ? ' (' + af + ')' : '') + '</button>' : '';
    const count = s.show_product_count ? '<span><b style="color:#0f172a;font-weight:600">' + match + '</b> ' + (match === 1 ? 'result' : 'results') + (match !== total ? ' of ' + total : '') + '</span>' : '';
    const bar = '<div class="cpg-bar"><div class="cpg-barl">' + fbtn + count + '</div><div class="cpg-barr">' + vToggle + sortSel + '</div></div>';

    // chips
    let chips = '';
    const chipArr = [];
    for (const g of FILTER_GROUPS) { if (g.kind === 'price') continue; for (const v of st.filters.selections[g.id] || []) chipArr.push({ g: g.id, v, label: v }); }
    if (st.filters.priceMin != null || st.filters.priceMax != null) chipArr.push({ price: true, label: (st.filters.priceMin != null ? '$' + st.filters.priceMin : 'Min') + ' – ' + (st.filters.priceMax != null ? '$' + st.filters.priceMax : 'Max') });
    if (chipArr.length) chips = '<div class="cpg-chips">' + chipArr.map((c) => '<button class="cpg-chip" ' + (c.price ? 'data-cpg-rmprice' : 'data-cpg-rm="' + c.g + ':' + OS.esc(c.v) + '"') + '>' + OS.esc(c.label) + ' <span style="color:#94a3b8">' + sicon.x + '</span></button>').join('') + '<button class="cpg-clear" data-cpg-clear>Clear all</button></div>';

    // feed body
    let feedBody;
    if (st.demo === 'loading') feedBody = skeleton(cols, isListDesktop);
    else if (st.demo === 'empty' || visible.length === 0) feedBody = emptyState(s);
    else if (isListDesktop) feedBody = '<div class="cpg-list">' + visible.map((p) => card(p, s, st, true)).join('') + '</div>';
    else feedBody = '<div class="cpg-grid" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))">' + visible.map((p) => card(p, s, st, false)).join('') + '</div>';

    let pager = '';
    if (st.demo === 'normal' && visible.length > 0) {
      if (isPaged && totalPages > 1) {
        let pg = '<button class="cpg-pg" data-cpg-page="' + (safePage - 1) + '"' + (safePage <= 1 ? ' disabled' : '') + '>Prev</button>';
        for (let i = 1; i <= totalPages; i++) pg += '<button class="cpg-pg' + (i === safePage ? ' on' : '') + '" data-cpg-page="' + i + '">' + i + '</button>';
        pg += '<button class="cpg-pg" data-cpg-page="' + (safePage + 1) + '"' + (safePage >= totalPages ? ' disabled' : '') + '>Next</button>';
        pager = '<div class="cpg-pager">' + pg + '</div>';
      } else if (!isPaged && hasMore) {
        pager = '<div class="cpg-more"><button data-cpg-more>Load more' + (s.pagination_type === 'infinite-scroll' ? ' (' + (match - shown) + ' more)' : '') + '</button></div>';
      }
    }

    const feed = '<div class="cpg-feed">' + (useTopbar ? topbar(st) : '') + chips + feedBody + pager + '</div>';
    const bodyZone = useSidebar ? '<div class="cpg-body">' + sidebar(s, st) + feed + '</div>' : feed;

    // section style
    const effPadTop = s.padding_top != null ? s.padding_top : 32;
    const effPadBot = s.padding_bottom != null ? s.padding_bottom : 56;
    const effMaxW = s.container_max_width != null ? s.container_max_width : OS.pageWidth(ctx.tokens);
    const bg = OS.bgOrTransparent(s.background);

    const states = '<div class="cpg-states">' + ['normal', 'loading', 'empty'].map((v) => '<button data-cpg-demo="' + v + '"' + (v === st.demo ? ' class="on"' : '') + '>' + v.charAt(0).toUpperCase() + v.slice(1) + '</button>').join('') + '</div>';
    const url = '<div class="cpg-url"><span class="k">URL</span><span class="v">' + OS.esc(buildUrl(st.filters, st.sort, curPage, st.view)) + '</span></div>';

    const overlays = (st.drawer && showFilters ? drawer(s, st, match) : '') + (st.quickAdd ? quickAddModal(st) : '') + (st.toast ? '<div class="cpg-toast"><i></i><span>' + OS.esc(st.toast) + '</span></div>' : '');

    return states +
      '<div style="padding:' + effPadTop + 'px ' + (mob ? 20 : 48) + 'px ' + effPadBot + 'px">' +
      '<div style="max-width:' + effMaxW + 'px;margin:0 auto;display:flex;flex-direction:column;gap:16px">' + h + bar + bodyZone + '</div></div>' +
      url + overlays;
  }

  function topbar(st) {
    return '<div class="cpg-topbar">' + FILTER_GROUPS.map((g) => {
      const cnt = g.kind === 'price' ? ((st.filters.priceMin != null || st.filters.priceMax != null) ? 1 : 0) : (st.filters.selections[g.id] || []).length;
      const open = st.topbar === g.id;
      return '<div style="position:relative"><button class="cpg-tb' + (open ? ' on' : '') + '" data-cpg-tb="' + g.id + '">' + OS.esc(g.label) + (cnt ? ' (' + cnt + ')' : '') + ' <span style="color:#94a3b8' + (open ? ';transform:rotate(180deg)' : '') + '">' + sicon.chev + '</span></button>' +
        (open ? '<div class="cpg-tbpop">' + groupBody(g, st) + '</div>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function sidebar(s, st) {
    return '<div class="cpg-side"><div class="cpg-side-h">Filters</div>' + FILTER_GROUPS.map((g, i) => accordion(g, st, s.open_first_group && i === 0, s)).join('') + '</div>';
  }
  function accordion(g, st, defOpen, s) {
    if (!s.show_group_name) return '<div class="cpg-fg open" style="border:0"><div class="cpg-fg-b" style="display:block;padding:10px 0">' + groupBody(g, st) + '</div></div>';
    const open = (g.id in st.open) ? st.open[g.id] : defOpen;
    return '<div class="cpg-fg' + (open ? ' open' : '') + '"><button class="cpg-fg-h" data-cpg-acc="' + g.id + '">' + OS.esc(g.label) + '<span class="cv">' + sicon.chev + '</span></button><div class="cpg-fg-b">' + groupBody(g, st) + '</div></div>';
  }
  function groupBody(g, st) {
    if (g.kind === 'price') {
      return '<div class="cpg-price"><div class="cpg-prow">' +
        '<div class="cpg-pin"><span style="color:#94a3b8;font-size:13px">$</span><input type="number" data-cpg-pmin placeholder="Min" value="' + (st.filters.priceMin != null ? st.filters.priceMin : '') + '"></div>' +
        '<span style="color:#94a3b8">–</span>' +
        '<div class="cpg-pin"><span style="color:#94a3b8;font-size:13px">$</span><input type="number" data-cpg-pmax placeholder="Max" value="' + (st.filters.priceMax != null ? st.filters.priceMax : '') + '"></div>' +
        '</div><span style="font-size:11px;color:#94a3b8">Prices $' + PRICE_BOUNDS.min + '–$' + PRICE_BOUNDS.max + '</span></div>';
    }
    const vals = GROUP_VALUE_ORDER[g.id] || [], sel = st.filters.selections[g.id] || [];
    return vals.map((v) => {
      const c = facet(g.id, v, st.filters), on = sel.indexOf(v) >= 0, dis = c === 0 && !on;
      const ico = g.kind === 'swatch'
        ? '<span class="cpg-sw" style="background:' + (COLOR_SWATCHES[v] || '#eee') + '"></span>'
        : '<span class="cpg-ck">' + (on ? sicon.check : '') + '</span>';
      return '<button class="cpg-opt' + (on ? ' on' : '') + (dis ? ' dis' : '') + '"' + (dis ? ' disabled' : ' data-cpg-opt="' + g.id + ':' + OS.esc(v) + '"') + '>' + ico + '<span class="lb">' + OS.esc(v) + '</span>' + (st._showCount ? '<span class="cn">' + c + '</span>' : '') + '</button>';
    }).join('');
  }
  function media(p, i, s, st, listRow) {
    const badge = resolveBadge(p, s);
    const hov = (s.enable_image_hover && !listRow) ? ' hov' : (listRow ? ' hov' : '');
    const qa = s.show_quick_add;
    const selSw = st.swatch[p.id] || 0;
    const baseImg = imgFor(i + selSw), altImg = altImgFor(i + selSw);
    return '<div class="cpg-media' + hov + '" data-cpg-media>' +
      '<div class="im" style="background-image:url(' + OS.esc(baseImg) + ')"></div>' +
      (s.enable_image_hover ? '<div class="im alt" style="background-image:url(' + OS.esc(altImg) + ')"></div>' : '') +
      (badge ? '<span class="cpg-badge" style="background:' + badge.bg + '">' + OS.esc(badge.text) + '</span>' : '') +
      (qa ? '<div class="cpg-qa"><button data-cpg-qa="' + p.id + '">' + sicon.plus + ' Quick add</button></div>' : '') +
      '</div>';
  }
  function card(p, s, st, listRow) {
    const i = PRODUCTS.indexOf(p);
    const sale = p.comparePrice != null && p.comparePrice > p.price;
    const promo = resolvePromo(p, s);
    const sw = swatchesFor(p), selSw = st.swatch[p.id] || 0;
    const swHtml = s.show_color_swatches ? '<div class="cpg-swatches">' + sw.slice(0, 4).map((x, k) => '<button class="' + (s.swatch_type === 'variant-image' ? 'sq' : '') + (k === selSw ? ' on' : '') + '" title="' + x.label + '" data-cpg-sw="' + p.id + ':' + k + '" style="background:' + x.color + '"></button>').join('') + (sw.length > 4 ? '<span style="font-size:10px;color:#475569;min-width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border:1px solid #cbd5e1;border-radius:999px">+' + (sw.length - 4) + '</span>' : '') + '</div>' : '';
    const vendor = s.show_vendor ? '<div class="cpg-vendor">' + OS.esc(p.vendor) + '</div>' : '';
    const rate = s.show_rating ? '<div class="cpg-rate">' + stars(p.rating) + '<span style="color:#94a3b8">' + p.rating.toFixed(1) + ' (' + p.reviewCount + ')</span></div>' : '';
    const price = '<div class="cpg-pr"><span' + (sale ? ' class="sale"' : '') + '>$' + p.price.toFixed(0) + '</span>' + (sale ? '<s>$' + p.comparePrice.toFixed(0) + '</s>' : '') + '</div>';
    const title = '<div class="cpg-pt">' + OS.esc(p.title) + '</div>';
    const promoHtml = promo ? '<div class="cpg-promo">' + OS.esc(promo) + '</div>' : '';
    if (listRow) {
      return '<div class="cpg-lrow">' + media(p, i, s, st, true) + '<div class="info">' + vendor + '<div style="font-size:15px;font-weight:600;color:#0f172a">' + OS.esc(p.title) + '</div>' + rate + price + promoHtml + '<div style="flex:1"></div>' + swHtml + '</div></div>';
    }
    return '<div class="cpg-pc">' + media(p, i, s, st, false) + vendor + title + rate + price + promoHtml + swHtml + '</div>';
  }
  function skeleton(cols, list) {
    if (list) { let h = ''; for (let i = 0; i < 4; i++) h += '<div class="cpg-lrow"><div class="cpg-skb" style="width:132px;height:132px;flex-shrink:0"></div><div style="flex:1;display:flex;flex-direction:column;gap:8px;justify-content:center"><div class="cpg-skb" style="width:40%;height:10px"></div><div class="cpg-skb" style="width:70%;height:14px"></div><div class="cpg-skb" style="width:30%;height:14px"></div></div></div>'; return '<div class="cpg-list">' + h + '</div>'; }
    let h = ''; const n = cols * 2; for (let i = 0; i < n; i++) h += '<div style="display:flex;flex-direction:column;gap:8px"><div class="cpg-skb" style="width:100%;aspect-ratio:3/4"></div><div class="cpg-skb" style="width:50%;height:9px"></div><div class="cpg-skb" style="width:90%;height:12px"></div><div class="cpg-skb" style="width:30%;height:12px"></div></div>';
    return '<div class="cpg-grid" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))">' + h + '</div>';
  }
  function emptyState(s) {
    const txt = (s.empty_collection_text || 'No products found');
    return '<div class="cpg-empty"><div class="t">' + OS.esc(txt) + '</div><div class="d">Try removing a filter or widening your price range.</div><button class="b" data-cpg-clear>Clear all filters</button></div>';
  }
  function drawer(s, st, match) {
    return '<div class="cpg-drawer"><div class="scrim" data-cpg-dclose></div><div class="panel">' +
      '<div class="dh">Filters<button class="cpg-iconbtn" data-cpg-dclose>' + sicon.x + '</button></div>' +
      '<div class="db">' + FILTER_GROUPS.map((g, i) => accordion(g, st, s.open_first_group && i === 0, s)).join('') + '</div>' +
      '<div class="df"><button class="c" data-cpg-clear>Clear all</button><button class="a" data-cpg-dclose>Apply (' + match + ')</button></div>' +
      '</div></div>';
  }
  function quickAddModal(st) {
    const p = st.quickAdd; const sizes = GROUP_VALUE_ORDER.size; const sel = st._qaSize || p.size;
    const sale = p.comparePrice != null && p.comparePrice > p.price;
    return '<div class="cpg-modal"><div class="scrim" data-cpg-qaclose></div><div class="box">' +
      '<div class="mh">Quick add<button class="cpg-iconbtn" data-cpg-qaclose>' + sicon.x + '</button></div>' +
      '<div style="display:flex;gap:16px;padding:18px"><div style="width:120px;aspect-ratio:3/4;border-radius:8px;background-size:cover;background-position:center;flex-shrink:0;background-image:url(' + OS.esc(imgFor(PRODUCTS.indexOf(p))) + ')"></div>' +
      '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px"><div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px">' + OS.esc(p.vendor) + '</div>' +
      '<div style="font-size:15px;font-weight:600;color:#0f172a">' + OS.esc(p.title) + '</div>' +
      '<div class="cpg-pr"><span' + (sale ? ' class="sale"' : '') + ' style="font-size:15px">$' + p.price.toFixed(0) + '</span>' + (sale ? '<s>$' + p.comparePrice.toFixed(0) + '</s>' : '') + '</div>' +
      '<div class="cpg-rate">' + stars(p.rating) + '<span style="color:#94a3b8">' + p.rating.toFixed(1) + ' (' + p.reviewCount + ')</span></div></div></div>' +
      '<div style="padding:0 18px 6px"><div style="font-size:12px;font-weight:600;color:#0f172a;margin-bottom:8px">Size</div><div class="sizes">' + sizes.map((z) => '<button data-cpg-size="' + z + '"' + (z === sel ? ' class="on"' : '') + '>' + z + '</button>').join('') + '</div></div>' +
      '<div style="padding:18px"><button class="atc" data-cpg-atc>Add to cart · $' + p.price.toFixed(0) + '</button></div>' +
      '</div></div>';
  }

  OS.register('collection-page', {
    name: 'Collection page', group: 'collection', icon: 'grid',
    schema: [
      { sub: 'Layout' },
      { key: 'products_per_page', control: 'number', label: 'Products per page', default: 12, min: 12, max: 100, step: 1, info: 'Default 50.' },
      { key: 'products_per_row_mobile', control: 'segmented', label: 'Products per row · Mobile', default: 2, options: [{ value: '1', label: '1' }, { value: '2', label: '2' }] },
      { key: 'products_per_row_desktop', control: 'range', label: 'Products per row · Desktop', min: 2, max: 6, step: 1, default: 4 },
      { key: 'layout_type', control: 'select', label: 'Layout type', default: 'grid', options: [{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }] },
      { sub: 'Page header' },
      { key: 'show_breadcrumb', control: 'toggle', label: 'Show breadcrumb', default: true },
      { key: 'show_collection_title', control: 'toggle', label: 'Show collection title', default: true },
      { key: 'show_collection_description', control: 'toggle', label: 'Show collection description', default: true },
      { key: 'show_product_count', control: 'toggle', label: 'Show product count', default: true },
      { sub: 'Product card' },
      { key: 'show_badge', control: 'toggle', label: 'Show badge', default: true, info: 'Auto discount label, e.g. 30% OFF.' },
      { key: 'show_collection_badge', control: 'toggle', label: 'Show collection badge', default: false },
      { key: 'show_vendor', control: 'toggle', label: 'Show vendor', default: false },
      { key: 'show_rating', control: 'toggle', label: 'Show rating', default: true },
      { key: 'show_color_swatches', control: 'toggle', label: 'Show color swatches', default: true },
      { key: 'swatch_type', control: 'select', label: 'Swatch type', default: 'color', options: [{ value: 'color', label: 'Color' }, { value: 'variant-image', label: 'Variant image' }], visibleWhen: (s) => s.show_color_swatches },
      { key: 'show_quick_add', control: 'toggle', label: 'Show quick add', default: true },
      { key: 'enable_image_hover', control: 'toggle', label: 'Enable image hover switch', default: true, info: 'Desktop: swap to 2nd image on hover.' },
      { sub: 'Promotion text' },
      { key: 'show_promotion_text', control: 'toggle', label: 'Show promotion text', default: true },
      { key: 'promotion_text_source', control: 'select', label: 'Promotion text source', default: 'metafield', options: [{ value: 'metafield', label: 'Product metafield' }, { value: 'custom', label: 'Custom text' }], visibleWhen: (s) => s.show_promotion_text },
      { key: 'custom_promotion_text', control: 'text', label: 'Custom promotion text', default: '', placeholder: 'e.g. Buy 2 Save 10%', visibleWhen: (s) => s.show_promotion_text && s.promotion_text_source === 'custom' },
      { sub: 'Filters' },
      { key: 'show_filters', control: 'toggle', label: 'Show filters', default: true },
      { key: 'desktop_layout', control: 'select', label: 'Desktop layout', default: 'sidebar', options: [{ value: 'sidebar', label: 'Sidebar (left)' }, { value: 'drawer', label: 'Drawer (slide-in)' }, { value: 'topbar', label: 'Topbar (above grid)' }], visibleWhen: (s) => s.show_filters },
      { key: 'open_first_group', control: 'toggle', label: 'Open first group by default', default: false, visibleWhen: (s) => s.show_filters },
      { key: 'show_filter_count', control: 'toggle', label: 'Show filter count', default: true, visibleWhen: (s) => s.show_filters },
      { key: 'show_group_name', control: 'toggle', label: 'Show group name', default: true, visibleWhen: (s) => s.show_filters },
      { sub: 'Sort' },
      { key: 'show_sort_by', control: 'toggle', label: 'Show sort by', default: true },
      { key: 'default_sort', control: 'select', label: 'Default sort', default: 'featured', options: SORTS, visibleWhen: (s) => s.show_sort_by },
      { sub: 'Pagination' },
      { key: 'pagination_type', control: 'select', label: 'Pagination type', default: 'pagination', options: [{ value: 'pagination', label: 'Pagination' }, { value: 'load-more', label: 'Load more' }, { value: 'infinite-scroll', label: 'Infinite scroll' }] },
      { key: 'empty_collection_text', control: 'text', label: 'Empty collection text', default: 'No products found', placeholder: 'No products found' },
      { sub: 'Section style' },
      { key: 'container_max_width', control: 'numberInherit', label: 'Container max width', min: 600, max: 1600, step: 10, unit: 'px', default: null },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true },
      { key: 'padding_top', control: 'numberInherit', label: 'Padding top', min: 0, max: 160, step: 4, unit: 'px', default: null },
      { key: 'padding_bottom', control: 'numberInherit', label: 'Padding bottom', min: 0, max: 160, step: 4, unit: 'px', default: null },
      { key: 'custom_css', control: 'custom_css', label: 'Custom CSS', default: '' },
    ],
    defaults: () => ({ container_max_width: null, padding_top: null, padding_bottom: null }),
    render: function (s, blocks, ctx) {
      const st = getState(ctx.sectionId, s); syncState(st, s); st._showCount = s.show_filter_count;
      const bg = OS.bgOrTransparent(s.background);
      const txt = (s.text && s.text !== 'transparent') ? s.text : '';
      return '<div class="cpgx' + (ctx.mob ? ' mob' : '') + '" style="background:' + bg + ';font-family:' + OS.bodyFamily(ctx.tokens) + (txt ? ';--cpg-text:' + txt : '') + '"><div data-cpg-host>' + inner(s, ctx, st) + '</div></div>';
    },
    hydrate: function (root, s, blocks, ctx) {
      const st = getState(ctx.sectionId, s); st._showCount = s.show_filter_count;
      const host = root.querySelector('[data-cpg-host]'); if (!host) return;
      const repaint = () => { st._showCount = s.show_filter_count; host.innerHTML = inner(s, ctx, st); wire(); };
      const stop = (e) => { e.stopPropagation(); };
      function wire() {
        host.querySelectorAll('[data-cpg-demo]').forEach((b) => b.onclick = (e) => { stop(e); st.demo = b.getAttribute('data-cpg-demo'); repaint(); });
        const sortEl = host.querySelector('[data-cpg-sort]'); if (sortEl) { sortEl.onclick = stop; sortEl.onchange = (e) => { stop(e); st.sort = sortEl.value; st.page = 1; st.loaded = 1; repaint(); }; }
        host.querySelectorAll('[data-cpg-view]').forEach((b) => b.onclick = (e) => { stop(e); st.view = b.getAttribute('data-cpg-view'); st.page = 1; st.loaded = 1; repaint(); });
        const drawerBtn = host.querySelector('[data-cpg-drawer]'); if (drawerBtn) drawerBtn.onclick = (e) => { stop(e); st.drawer = true; repaint(); };
        host.querySelectorAll('[data-cpg-dclose]').forEach((b) => b.onclick = (e) => { stop(e); st.drawer = false; repaint(); });
        host.querySelectorAll('[data-cpg-opt]').forEach((b) => b.onclick = (e) => { stop(e); const p = b.getAttribute('data-cpg-opt').split(':'); toggleVal(p[0], p.slice(1).join(':')); st.page = 1; st.loaded = 1; repaint(); });
        host.querySelectorAll('[data-cpg-acc]').forEach((b) => b.onclick = (e) => { stop(e); const id = b.getAttribute('data-cpg-acc'); const cur = (id in st.open) ? st.open[id] : (s.open_first_group && FILTER_GROUPS[0].id === id); st.open[id] = !cur; repaint(); });
        host.querySelectorAll('[data-cpg-tb]').forEach((b) => b.onclick = (e) => { stop(e); const id = b.getAttribute('data-cpg-tb'); st.topbar = st.topbar === id ? null : id; repaint(); });
        const pmin = host.querySelector('[data-cpg-pmin]'); if (pmin) { pmin.onclick = stop; pmin.onchange = (e) => { stop(e); setPrice(pmin.value, null); }; }
        const pmax = host.querySelector('[data-cpg-pmax]'); if (pmax) { pmax.onclick = stop; pmax.onchange = (e) => { stop(e); setPrice(null, pmax.value); }; }
        host.querySelectorAll('[data-cpg-rm]').forEach((b) => b.onclick = (e) => { stop(e); const p = b.getAttribute('data-cpg-rm').split(':'); toggleVal(p[0], p.slice(1).join(':')); repaint(); });
        const rmp = host.querySelector('[data-cpg-rmprice]'); if (rmp) rmp.onclick = (e) => { stop(e); st.filters.priceMin = null; st.filters.priceMax = null; repaint(); };
        host.querySelectorAll('[data-cpg-clear]').forEach((b) => b.onclick = (e) => { stop(e); st.filters = { selections: {}, priceMin: null, priceMax: null }; st.page = 1; st.loaded = 1; repaint(); });
        host.querySelectorAll('[data-cpg-page]').forEach((b) => b.onclick = (e) => { stop(e); if (b.disabled) return; st.page = Number(b.getAttribute('data-cpg-page')); repaint(); });
        const more = host.querySelector('[data-cpg-more]'); if (more) more.onclick = (e) => { stop(e); st.loaded += 1; repaint(); };
        host.querySelectorAll('[data-cpg-sw]').forEach((b) => b.onclick = (e) => { stop(e); const p = b.getAttribute('data-cpg-sw').split(':'); st.swatch[p[0]] = Number(p[1]); repaint(); });
        host.querySelectorAll('[data-cpg-qa]').forEach((b) => b.onclick = (e) => { stop(e); const id = b.getAttribute('data-cpg-qa'); st.quickAdd = PRODUCTS.find((x) => x.id === id); st._qaSize = null; repaint(); });
        host.querySelectorAll('[data-cpg-qaclose]').forEach((b) => b.onclick = (e) => { stop(e); st.quickAdd = null; repaint(); });
        host.querySelectorAll('[data-cpg-size]').forEach((b) => b.onclick = (e) => { stop(e); st._qaSize = b.getAttribute('data-cpg-size'); repaint(); });
        const atc = host.querySelector('[data-cpg-atc]'); if (atc) atc.onclick = (e) => { stop(e); const p = st.quickAdd; st.quickAdd = null; st.toast = 'Added ' + p.title + ' · Size ' + (st._qaSize || p.size); repaint(); clearToast(); };
      }
      function toggleVal(g, v) { const cur = st.filters.selections[g] || []; st.filters.selections[g] = cur.indexOf(v) >= 0 ? cur.filter((x) => x !== v) : cur.concat([v]); }
      function setPrice(min, max) {
        const c = (t) => t === '' || t == null ? null : Math.max(PRICE_BOUNDS.min, Math.min(PRICE_BOUNDS.max, Number(t)));
        if (min !== null) st.filters.priceMin = c(min); if (max !== null) st.filters.priceMax = c(max);
        st.page = 1; st.loaded = 1; repaint();
      }
      let toastTimer = null;
      function clearToast() { if (toastTimer) clearTimeout(toastTimer); toastTimer = setTimeout(() => { st.toast = null; const el = host.querySelector('.cpg-toast'); if (el) el.remove(); }, 1800); }
      wire();
    },
  });
})();
