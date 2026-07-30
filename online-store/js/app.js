/* BestShopio Admin · Online store / Theme editor — engine + admin-skinned chrome.
   Ported from reference/canvases-share 2 (theme-editor.canvas.tsx model): a 3-snapshot
   deep-equal state machine (theme / savedTheme / publishedTheme), a section/block structure
   tree, a schema-driven right panel, a live storefront preview, and Save/Discard/Publish.
   The EDITOR CHROME (top bar, left tree, right panel) follows the BestShopio admin design
   system (_shared/admin-theme.css tokens); the CENTER preview is faithful to the Cursor
   storefront renderers, which live one-per-file in js/sections/<kind>.js and register via OS.register.
   Chrome (sidebar + header) of the surrounding SPA is injected by ../assets/shell.js; this file
   renders the module body into `root`, and opens the builder as a full-screen overlay. */
(function () {
  const D = window.OS_DATA;
  const SECTIONS = (window.OS_SECTIONS = window.OS_SECTIONS || {});
  let root; // set by the SPA shell router via VIEWS['online-store'].render(el, rest)

  // module base dir (…/online-store/js/) for loading section files
  const MOD_BASE = (function () {
    const s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/app\.js.*$/, '') : 'online-store/js/';
  })();
  const OS_V = String(Date.now()); // per-load cache-bust for section files (always fresh on reload)

  // ------------------------------------------------------------------ helpers
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = String(html).trim(); return t.content.firstElementChild; };
  const clamp = (v, lo, hi, fb) => { v = Number(v); if (!isFinite(v)) return fb == null ? lo : fb; return Math.min(hi, Math.max(lo, v)); };
  const money = (n) => '$' + Number(n || 0).toFixed(2);
  const uid = (p) => (p || 'id') + '-' + Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-3);
  const bgOrTransparent = (v) => (!v || v === 'transparent') ? 'transparent' : v;
  const col = (v, fb) => (v == null || v === '' || v === 'theme') ? fb : v;

  // ------------------------------------------------------------------ icons
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    back: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>'),
    chev: svg('<path d="m6 9 6 6 6-6"/>', 14),
    chevR: svg('<path d="m9 18 6-6-6-6"/>', 14),
    layers: svg('<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
    eye: svg('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>', 15),
    eyeOff: svg('<path d="M9.9 4.24A9 9 0 0 1 12 4c6 0 10 7 10 7a13 13 0 0 1-1.67 2.18M6.6 6.6A13 13 0 0 0 2 11s4 7 10 7a9 9 0 0 0 4.5-1.2"/><path d="m2 2 20 20"/>', 15),
    trash: svg('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>', 14),
    grip: svg('<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>', 14),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 14),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 14),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>', 14),
    cart: svg('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>'),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    menu: svg('<path d="M3 12h18M3 6h18M3 18h18"/>'),
    star: svg('<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="currentColor" stroke="none"/>', 14),
    play: svg('<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>'),
    desktop: svg('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>', 15),
    mobile: svg('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>', 15),
    lock: svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', 13),
    image: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>', 14),
  };
  const ICON = (n) => I[n] || I.layers;

  // ------------------------------------------------------------------ token / style helpers
  const FONT_SERIF = ['Playfair Display', 'DM Serif Display', 'Georgia'];
  const fontStack = (name) => "'" + name + "', " + (FONT_SERIF.indexOf(name) >= 0 ? 'Georgia, serif' : 'system-ui, -apple-system, sans-serif');
  const fontScale = (t) => ((t && t.typography && t.typography.base_font_size) || 16) / 16;
  const SCALE = { small: 0.85, medium: 1.0, large: 1.2 };
  const headMult = (t) => SCALE[(t && t.typography && t.typography.heading_scale) || 'medium'] || 1;
  const fs = (t, px) => Math.max(8, Math.round(px * fontScale(t)));
  const headingSize = (t, basePx) => Math.max(10, Math.round(basePx * headMult(t) * fontScale(t)));
  const headingFamily = (t) => fontStack((t && t.typography && t.typography.heading_font) || 'Playfair Display');
  const bodyFamily = (t) => fontStack((t && t.typography && t.typography.body_font) || 'Inter');
  const hexAlpha = (hex, a) => { hex = String(hex || '').replace('#', ''); if (hex.length === 3) hex = hex.split('').map((c) => c + c).join(''); const n = parseInt(hex, 16); if (isNaN(n)) return 'rgba(0,0,0,' + a + ')'; return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  function btnStyle(t, opts) {
    opts = opts || {}; const b = (t && t.buttons) || {}; const sec = opts.variant === 'secondary';
    const bw = sec ? (b.button_border_width || 0) : (b.button_border_width || 0);
    let s = 'display:inline-flex;align-items:center;justify-content:center;cursor:pointer;border-style:solid;white-space:nowrap;';
    s += 'background:' + bgOrTransparent(sec ? b.secondary_button_background : b.primary_button_background) + ';';
    s += 'color:' + ((sec ? b.secondary_button_text : b.primary_button_text) || '#fff') + ';';
    s += 'border-width:' + bw + 'px;border-color:' + (bw > 0 ? (b.button_border_color || 'transparent') : 'transparent') + ';';
    s += 'border-radius:' + (b.button_border_radius || 0) + 'px;height:' + (b.button_height || 44) + 'px;padding:0 ' + (b.button_horizontal_padding || 24) + 'px;';
    s += 'text-transform:' + (b.button_text_transform || 'none') + ';font-weight:600;font-size:' + fs(t, 13) + 'px;letter-spacing:.02em;';
    return s;
  }
  function inputStyle(t, opts) {
    opts = opts || {}; const f = (t && t.forms) || {};
    const border = opts.focus ? (f.focus_border_color || '#103635') : (f.input_border_color || '#E5E5E5');
    let s = 'background:' + (f.input_background || '#fff') + ';color:' + (f.input_text || '#1a1a1a') + ';';
    s += 'border:1.5px solid ' + border + ';border-radius:' + (f.input_border_radius || 0) + 'px;';
    s += 'height:' + (f.input_height || 44) + 'px;padding:0 ' + (f.input_horizontal_padding || 16) + 'px;font-size:' + fs(t, 14) + 'px;outline:none;';
    if (opts.focus) s += 'box-shadow:0 0 0 3px ' + hexAlpha(f.focus_border_color || '#103635', .22) + ';';
    return s;
  }
  const layoutRadius = (t, which) => { const l = (t && t.layout) || {}; return (which === 'image' ? l.image_border_radius : l.card_border_radius) || 0; };
  const pick = (a, b) => (a == null ? b : a);
  // shared storefront product card — reads Theme settings › Product cards (with optional per-section overrides)
  function productCard(p, t, opts) {
    opts = opts || {}; const pc = (t && t.product_cards) || {}, c = (t && t.colors) || {};
    const ratio = { portrait: '3/4', square: '1/1', landscape: '4/3' }[opts.ratio || pc.product_image_ratio] || '3/4';
    const fit = pc.product_image_fit || 'cover';
    const align = opts.align || pc.product_card_text_alignment || 'center';
    const titlePx = { small: 13, medium: 14, large: 16 }[pc.product_title_size] || 14;
    const rad = layoutRadius(t, 'card');
    const sale = p.compareAt && p.compareAt > p.price, pct = sale ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
    const saleColor = c.sale_price_color || '#d92d20';
    const badge = (sale && pick(opts.showSaleBadge, pc.show_sale_badge_by_default))
      ? '<span class="oc-badge" style="' + (pc.sale_badge_style === 'outline' ? 'background:transparent;border:1px solid ' + saleColor + ';color:' + saleColor : 'background:' + saleColor + ';color:#fff') + '">-' + pct + '%</span>' : '';
    const quick = pick(opts.showQuickAdd, pc.show_quick_add_by_default) ? '<span class="oc-quick" style="' + btnStyle(t) + ';height:36px;font-size:' + fs(t, 12) + 'px">Quick add</span>' : '';
    const swatches = (pick(opts.showSwatches, pc.show_color_swatches_by_default) && p.swatches) ? '<div class="oc-sw">' + p.swatches.slice(0, 5).map((s) => '<span style="background:' + s + '"></span>').join('') + '</div>' : '';
    const vendor = (pick(opts.showVendor, pc.show_vendor_by_default) && p.vendor) ? '<div class="oc-vendor" style="color:' + (c.secondary_color || '#777') + '">' + esc(p.vendor) + '</div>' : '';
    const rating = (pick(opts.showRating, pc.show_rating_by_default) && p.rating) ? '<div class="oc-rate"><span style="color:#f5b301">' + I.star + '</span>' + p.rating + (p.reviews ? ' <i>(' + p.reviews + ')</i>' : '') + '</div>' : '';
    const price = '<div class="oc-price"><span' + (sale ? ' style="color:' + saleColor + '"' : '') + '>' + money(p.price) + '</span>' + (sale ? '<s>' + money(p.compareAt) + '</s>' : '') + '</div>';
    return '<div class="oc-card" style="text-align:' + align + ';font-family:' + bodyFamily(t) + '">' +
      '<div class="oc-img" style="aspect-ratio:' + ratio + ';border-radius:' + rad + 'px;background-image:url(' + esc(p.image) + ');background-size:' + fit + '">' + badge + quick + '</div>' +
      swatches + vendor + '<div class="oc-title" style="font-size:' + fs(t, titlePx) + 'px;color:' + (c.text_color || '#1a1a1a') + '">' + esc(p.title) + '</div>' + rating + price + '</div>';
  }
  function ckFloat(control, label, cls) {
    return '<label class="ck-float' + (cls ? ' ' + cls : '') + '">' +
      '<span class="ck-float-label">' + esc(label || '') + '</span>' + control + '</label>';
  }
  function wireFloatFields(root) {
    (root || document).querySelectorAll('.ck-float,.ck-fl').forEach((field) => {
      const control = field.querySelector('input,select,textarea');
      if (!control || control.dataset.ckFloatWired) return;
      control.dataset.ckFloatWired = '1';
      const sync = () => field.classList.toggle('has-value', String(control.value || '').length > 0);
      control.addEventListener('input', sync);
      control.addEventListener('change', sync);
      sync();
    });
  }

  // ------------------------------------------------------------------ public API for section files
  const OS = (window.OS = {
    esc, clone, clamp, money, uid, bgOrTransparent, col, h,
    icon: ICON, sample: D.SAMPLE, data: D,
    fs, headingSize, headingFamily, bodyFamily, fontStack, btnStyle, inputStyle, layoutRadius, hexAlpha, pick, productCard,
    ckFloat, wireFloatFields,
    register: function (kind, def) { def.kind = kind; SECTIONS[kind] = def; },
    // Checkout runtime store — buyer-side add-on selections (insurance/VIP tick,
    // upsell checked products + qty), keyed by section id. Held in memory so the
    // shared Order Summary can recompute live. Not a theme edit (never marks dirty).
    ckState: {},
    ckSet: function (id, patch) { OS.ckState[id] = Object.assign({}, OS.ckState[id], patch); },
    ckRecalc: function () { /* assigned by the editor to re-render the canvas */ },
    goCheckoutPage: function (page) { goCheckoutPage(page); },
    css: function (id, text) { if (document.getElementById('oscss-' + id)) return; const st = document.createElement('style'); st.id = 'oscss-' + id; st.textContent = text; document.head.appendChild(st); },
    secSpace: (t, mob) => ((t && t.layout) ? (mob ? t.layout.section_spacing_mobile : t.layout.section_spacing_desktop) : (mob ? 40 : 64)),
    pagePad: (t, mob) => ((t && t.layout) ? (mob ? t.layout.page_horizontal_padding_mobile : t.layout.page_horizontal_padding_desktop) : (mob ? 16 : 40)),
    gridGap: (t, mob) => ((t && t.layout) ? (mob ? t.layout.grid_gap_mobile : t.layout.grid_gap_desktop) : (mob ? 16 : 24)),
    pageWidth: (t) => ((t && t.layout && t.layout.page_width) || 1200),
  });

  // ------------------------------------------------------------------ section loader
  let _sectionsP = null;
  function ensureSections() {
    if (_sectionsP) return _sectionsP;
    const kinds = ['announcement-bar', 'header', 'footer', 'collection-banner', 'collection-list', 'collection-page', 'list-collections',
      'checkout-header', 'checkout-offer-header', 'checkout-offer-progress', 'checkout-offer-product',
      'checkout-express', 'checkout-contact', 'checkout-shipping-info', 'checkout-shipping-method',
      'checkout-payment', 'checkout-cta', 'checkout-order-summary', 'checkout-order-summary-bar', 'checkout-policy-links',
      'checkout-product-upsell', 'checkout-shipping-insurance', 'checkout-vip-club',
      'checkout-countdown', 'checkout-payment-icons', 'checkout-trust-badges', 'checkout-trustpilot',
      'checkout-review-card', 'checkout-testimonials', 'checkout-fb-comments', 'checkout-static-content', 'checkout-footer',
      'thankyou-order-status', 'thankyou-order-details', 'thankyou-continue-shopping', 'thankyou-contact-us'];
    D.CATALOG.forEach((g) => g.entries.forEach((e) => { if (e.kind && kinds.indexOf(e.kind) < 0) kinds.push(e.kind); }));
    _sectionsP = Promise.all(kinds.map((k) => loadScript(MOD_BASE + 'sections/' + k + '.js?v=' + OS_V).catch(() => { /* not yet ported — skip */ })));
    return _sectionsP;
  }
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load ' + src)); document.body.appendChild(s); });
  }

  // ------------------------------------------------------------------ toast
  function toast(msg, kind) {
    const t = document.createElement('div');
    t.className = 'os-toast' + (kind === 'err' ? ' err' : '');
    t.innerHTML = '<i></i>' + esc(msg);
    document.body.appendChild(t); setTimeout(() => t.remove(), 2400);
  }

  // ==========================================================================
  //  STATE  (3 snapshots + UI state, mirrors theme-editor.canvas)
  // ==========================================================================
  let ED = null;

  function buildSettingsDefaults() { return groupDefaults(D.SETTINGS_GROUPS); }
  function buildCkSettingsDefaults() { return groupDefaults(D.CHECKOUT_SETTINGS_GROUPS || []); }
  function groupDefaults(groups) {
    const out = {};
    groups.forEach((g) => { out[g.key] = {}; g.fields.forEach((f) => { if (f.key) out[g.key][f.key] = f.default; }); });
    return out;
  }
  function defForKind(kind) { return SECTIONS[kind]; }
  function schemaDefaults(schema) { const o = {}; (schema || []).forEach((f) => { if (f.key && !f.previewOnly) o[f.key] = f.default; }); return o; }
  function sectionDefaults(def) { return Object.assign({}, def ? schemaDefaults(def.schema) : {}, (def && def.defaults) ? def.defaults() : {}); }
  function blockDefaults(bd) { return Object.assign({}, bd ? schemaDefaults(bd.fields) : {}, (bd && bd.defaults) ? bd.defaults() : {}); }
  function normalizeSectionSettings(def, settings) {
    (def && def.schema || []).forEach((field) => {
      if (field.control === 'ordered_variants' && Array.isArray(settings[field.key])) {
        settings[field.key] = settings[field.key].map((ref) => {
          const info = variantRefInfo(ref); return info && info.ref;
        }).filter(Boolean);
      }
      if (field.control === 'product_mappings' && Array.isArray(settings[field.key])) {
        settings[field.key] = settings[field.key].map((mapping) => Object.assign({}, mapping, {
          recommendedProductIds: (mapping.recommendedProductIds || []).map((ref) => {
            const info = variantRefInfo(ref); return info && info.ref;
          }).filter(Boolean),
        }));
      }
    });
    return settings;
  }
  function matGlobal(kind, seed) {
    const def = defForKind(kind); seed = seed || {};
    const inst = { kind, hidden: !!seed.hidden, settings: Object.assign(sectionDefaults(def), seed.settings || {}) };
    if (def && def.blocks) inst.blocks = seed.blocks ? seed.blocks.map((b) => matBlock(def, b)) : (def.defaultBlocks ? def.defaultBlocks() : []);
    return inst;
  }
  function matBlock(def, seed) {
    const bd = blockDef(def, seed.kind);
    return { id: seed.id || uid('blk'), kind: seed.kind, hidden: !!seed.hidden, settings: Object.assign(blockDefaults(bd), seed.settings || {}) };
  }
  function blockDef(def, blockKind) {
    if (!def || !def.blocks) return null;
    if (def.blocks.kinds) return def.blocks.kinds[blockKind] || null;
    return def.blocks; // single homogeneous block type
  }
  function matSection(seed) {
    const def = defForKind(seed.kind);
    let blocks = [];
    if (def && def.blocks) blocks = seed.blocks ? seed.blocks.map((b) => matBlock(def, b)) : (def.defaultBlocks ? def.defaultBlocks() : []);
    const settings = normalizeSectionSettings(def, Object.assign(sectionDefaults(def), seed.settings || {}));
    const inst = { id: seed.id || uid('sec'), kind: seed.kind, hidden: !!seed.hidden, settings, blocks };
    if (seed.zone) inst.zone = seed.zone;
    return inst;
  }
  function materialize() {
    const T = D.DEFAULT_THEME;
    const theme = {
      name: T.name,
      announcement: matGlobal('announcement-bar', T.announcement),
      header: matGlobal('header', T.header),
      footer: matGlobal('footer', T.footer),
      settings: buildSettingsDefaults(),
      templates: {},
    };
    // Multi-template: each page type materialises a `list` of named templates; each
    // template's section seeds run through matSection (auto-assigning ids when absent).
    Object.keys(T.templates).forEach((pg) => {
      theme.templates[pg] = { list: T.templates[pg].list.map((t) => ({
        id: t.id, name: t.name, assigned: t.assigned, basedOn: t.basedOn, isDefault: t.isDefault || t.id === 'default',
        assignedResourceIds: (t.assignedResourceIds || []).slice(),
        sections: (t.sections || []).map(matSection),
      })) };
    });
    // Checkout theme is its own environment: ONE shared settings object + four multi-template
    // page types (Checkout / Upsell / Downsell / Thank you), each a `list` mirroring the
    // online-store types.
    const ckBase = {
      checkout: (D.CHECKOUT_TEMPLATE && D.CHECKOUT_TEMPLATE.sections) || [],
      thankyou: (D.THANKYOU_TEMPLATE && D.THANKYOU_TEMPLATE.sections) || [],
      upsell: (D.UPSELL_TEMPLATE && D.UPSELL_TEMPLATE.sections) || [],
      downsell: (D.DOWNSELL_TEMPLATE && D.DOWNSELL_TEMPLATE.sections) || [],
    };
    const ckTemplates = {};
    Object.keys(D.CHECKOUT_TEMPLATE_SETS || {}).forEach((pt) => {
      ckTemplates[pt] = { list: (D.CHECKOUT_TEMPLATE_SETS[pt] || []).map((s) => ({
        id: s.id, name: s.name, isDefault: !!s.isDefault, basedOn: s.basedOn,
        sections: (ckBase[pt] || []).map(matSection),
      })) };
    });
    theme.checkout = { postPurchaseEnabled: false, settings: buildCkSettingsDefaults(), templates: ckTemplates };
    return theme;
  }

  function startEditor(handle) {
    const themeMeta = D.THEMES.find((t) => t.handle === handle) || D.THEMES[0];
    const base = materialize();
    ED = {
      meta: themeMeta,
      theme: base,
      savedTheme: clone(base),
      publishedTheme: clone(base),
      surface: 'online-store',         // 'online-store' | 'checkout'
      checkoutPage: 'checkout',
      currentPage: 'home',
      tplSel: {},                      // { [pageType]: templateId } — active online-store template per type
      ckTplSel: {},                    // { checkout|upsell|downsell|thankyou: templateId } — active checkout template per type
      previewSel: {},                  // { product|collection: resourceId } — preview only; never persisted
      device: 'desktop',
      leftMode: 'sections',            // 'sections' | 'settings'
      selection: { kind: 'header' },   // announcement|header|footer | {kind:'section',sectionId} | {kind:'block',sectionId,blockId}
      expand: { header: true, template: true, footer: true },
      sectionExpand: {},
      busy: null,                      // 'saving' | 'publishing' | 'discarding' | null
      settingsExpand: settingsExpandInit(),
    };
    // Seed a default applied discount so the Checkout Order Summary shows the discount code
    // chip + Order discount + Shipping discount rows out of the box (buyer-side runtime
    // state, not a theme edit). Removable/re-appliable like any coupon.
    const seedCode = 'THANKS';
    const seed = ((D.CHECKOUT_MOCK || {}).coupons || {})[seedCode];
    if (seed) {
      const product = +seed.product || 0, order = +seed.order || 0, shipping = +seed.shipping || 0;
      OS.ckState['ck-coupons'] = [{ code: seedCode, product: product, order: order, shipping: shipping, amount: product + order + shipping }];
    }
  }
  function settingsExpandInit() { const o = {}; D.SETTINGS_GROUPS.forEach((g) => { o[g.key] = !!g.open; }); (D.CHECKOUT_SETTINGS_GROUPS || []).forEach((g) => { o['ck:' + g.key] = !!g.open; }); return o; }

  // derived
  const isCheckout = () => ED.surface === 'checkout';
  // Commerce (transaction-enhancement) components are the addable / draggable / deletable
  // exception inside the otherwise-locked Checkout skeleton (Commerce PRD §3, §14.1).
  const CK_COMMERCE = (D.CHECKOUT_COMMERCE || []).map((e) => e.kind);
  const isCheckoutCommerce = (kind) => CK_COMMERCE.indexOf(kind) >= 0;
  // Content & trust components (Content PRD §2) — the third addable group. Like commerce
  // components they can be added / hidden / deleted / dragged, but they never affect order
  // totals and most carry their own Section + Block lists.
  const CK_CONTENT = (D.CHECKOUT_CONTENT || []).map((e) => e.kind);
  const isCheckoutContent = (kind) => CK_CONTENT.indexOf(kind) >= 0;
  const isCheckoutAddable = (kind) => isCheckoutCommerce(kind) || isCheckoutContent(kind);
  const isSingletonKind = (kind) => { const d = SECTIONS[kind]; return !!(d && d.singleton); };
  // Active insertion-zone/catalog set. Offer pages reuse Checkout content/trust components
  // but intentionally exclude the three cart-mutating commerce boosters.
  const isOfferPage = () => isUpsell() || isDownsell();
  const ckZones = () => isThankyou() ? (D.THANKYOU_ZONES || [])
    : isOfferPage() ? (D.OFFER_ZONES || [])
    : (D.CHECKOUT_ZONES || []);
  const ckCatalog = () => isThankyou() ? (D.THANKYOU_CATALOG || [])
    : isOfferPage() ? (D.OFFER_CATALOG || [])
    : (D.CHECKOUT_CATALOG || []);
  const ckZone = (id) => ckZones().find((z) => z.id === id) || null;
  // Which zones a component kind may live in (PRD §9.2 matrix). Placement is enforced
  // on drag: a component row can only be dropped into a zone that allows its kind.
  const allowedZonesForKind = (kind) => ckZones().filter((z) => (z.allow || []).indexOf(kind) >= 0).map((z) => z.id);
  // Anchor (required) section → zone it opens, used to resolve the drop target's zone.
  // Either Order Summary surface (the mobile top bar or the bottom summary) maps to the
  // single 'summary' zone, so dropping onto whichever the merchant sees works.
  const ckAnchorZone = (kind) => {
    if (kind === 'checkout-order-summary' || kind === 'checkout-order-summary-bar') return 'summary';
    const z = ckZones().find((zz) => zz.after === kind); return z ? z.id : null;
  };
  // Resolve which zone a tree row represents as a drop target for a commerce component.
  // A row can be a section anchor (Contact / Shipping method / Payment / Order Summary),
  // another commerce component, OR an Order-Summary block (Cart Lines … Total / Policy
  // Links) — dropping onto any summary block lands the component in the 'summary' zone,
  // so "below Total" behaves the same as "below Order Summary".
  function ckDropZoneForRow(row) {
    if (row.hasAttribute('data-sel-sec')) {
      const o = pageSections().find((x) => x.id === row.getAttribute('data-sel-sec'));
      if (!o) return null;
      const zoneId = isCheckoutAddable(o.kind) ? o.zone : ckAnchorZone(o.kind);
      return zoneId ? { zoneId: zoneId, refCommerceId: isCheckoutAddable(o.kind) ? o.id : null } : null;
    }
    if (row.hasAttribute('data-sel-blk')) {
      const secId = row.getAttribute('data-sel-blk').split(':')[0];
      const s = pageSections().find((x) => x.id === secId);
      if (s && s.kind === 'checkout-order-summary') return { zoneId: 'summary', refCommerceId: null };
      // Dropping onto a block of an addable content component lands it in that component's zone.
      if (s && isCheckoutAddable(s.kind)) return { zoneId: s.zone, refCommerceId: s.id };
    }
    return null;
  }
  // Computed once per checkout render so every Order Summary surface shares the same
  // live add-on contributions (insurance/VIP rows + upsell line items).
  let CK_ADDONS = { rows: [], lines: [] };
  function computeCheckoutAddons(secs) {
    const store = OS.ckState || {};
    const rows = [], lines = [];
    (secs || []).forEach((s) => {
      if (s.hidden || !isCheckoutCommerce(s.kind)) return;
      const st = store[s.id] || {}; const cfg = s.settings || {};
      if (s.kind === 'checkout-shipping-insurance' || s.kind === 'checkout-vip-club') {
        const on = ('selected' in st) ? st.selected : !!cfg.default_selected;
        if (!on) return;
        // Item 1: the Order-Summary line is built from component-level config
        // (price / image / title) — no longer from a bound service product.
        const isVip = s.kind === 'checkout-vip-club';
        const def = SECTIONS[s.kind] || {};
        const title = cfg.title || def.name || (isVip ? 'VIP Club' : 'Shipping insurance');
        const price = (cfg.price == null ? (isVip ? 29.99 : 3.95) : +cfg.price) || 0;
        const img = ((D.SAMPLE || {}).IMG) || {};
        const image = cfg.image || (isVip ? img.svcVip : img.svcShip) || '';
        const key = isVip ? 'vip' : 'insurance';
        lines.push({ id: key + ':' + s.id, title: title, variant: '', qty: 1, price: price, compareAt: 0, image: image, addon: true });
      } else if (s.kind === 'checkout-product-upsell') {
        const explicit = st.items || {};
        const vmap = st.variants || {};
        // Effective selection = default-checked products, overridden by the buyer's explicit
        // choices (an explicit 0 means unticked). Keeps the Order Summary in sync with the card UI.
        const defSel = Array.isArray(cfg.default_selected) ? cfg.default_selected : (cfg.default_selected ? [cfg.default_selected] : []);
        const eff = {};
        defSel.forEach((pid) => { eff[pid] = 1; });
        Object.keys(explicit).forEach((pid) => { eff[pid] = explicit[pid]; });
        Object.keys(eff).forEach((pid) => {
          const qty = eff[pid]; if (!qty || qty < 1) return;
          const p = (D.SAMPLE.products || []).find((x) => x.id === pid); if (!p) return;
          // The buyer-selected variant (or the first, for multi-variant products) flows into
          // the order line; single-/no-variant products use the product price.
          const variants = Array.isArray(p.variants) ? p.variants : [];
          const v = variants.length ? (variants.find((x) => x.id === vmap[pid]) || variants[0]) : null;
          lines.push({ id: p.id, title: p.title, variant: v ? v.title : (p.vendor || ''), qty: qty, price: v ? v.price : p.price, compareAt: v ? (v.compareAt || 0) : (p.compareAt || 0), image: p.image, addon: true });
        });
      }
    });
    return { rows: rows, lines: lines };
  }
  // Single source of truth for "are we in the Theme/Checkout settings view" — the left tree,
  // right panel and rail toggle must all agree (otherwise the tree shows while settings is open).
  const inSettings = () => ED.leftMode === 'settings' || ED.selection.kind === 'theme-settings';
  const sGroups = () => isCheckout() ? (D.CHECKOUT_SETTINGS_GROUPS || []) : D.SETTINGS_GROUPS;
  const sExpKey = (k) => (isCheckout() ? 'ck:' : '') + k;
  // ---- multi-template accessors -------------------------------------------------
  // Which template is active is editor-session state (ED.tplSel / ED.ckTplSel), NOT theme
  // content, so navigating between templates never marks the theme dirty. Falls back to
  // the default template (isDefault, else first) when the stored selection is missing.
  const CK_TYPES = ['checkout', 'upsell', 'downsell', 'thankyou'];
  const defaultOf = (group) => (group.list.find((t) => t.isDefault) || group.list[0]);
  const tplGroup = () => ED.theme.templates[ED.currentPage];
  const curTplId = () => { const g = tplGroup(); const id = ED.tplSel[ED.currentPage]; return (id && g.list.some((t) => t.id === id)) ? id : (defaultOf(g) || {}).id; };
  const curTpl = () => { const g = tplGroup(); return g.list.find((t) => t.id === curTplId()) || g.list[0]; };
  // Checkout theme: each of the four page types has its own template list.
  const ckGroupOf = (pt) => ED.theme.checkout.templates[pt];
  const ckGroup = () => ckGroupOf(ED.checkoutPage);
  const ckTplIdOf = (pt) => { const g = ckGroupOf(pt); const id = ED.ckTplSel[pt]; return (id && g.list.some((t) => t.id === id)) ? id : (defaultOf(g) || {}).id; };
  const curCkTplId = () => ckTplIdOf(ED.checkoutPage);
  const curCkTpl = () => { const g = ckGroup(); return g.list.find((t) => t.id === curCkTplId()) || g.list[0]; };
  const settingsObj = () => isCheckout() ? ED.theme.checkout.settings : ED.theme.settings;
  const isDirty = () => !eq(ED.theme, ED.savedTheme);
  const hasDraft = () => !eq(ED.savedTheme, ED.publishedTheme);
  const status = () => isDirty() ? 'unsaved' : hasDraft() ? 'draft' : 'saved';
  // Checkout theme page types (Thank you PRD §23.1; multi-template PRD §5.2).
  const isThankyou = () => isCheckout() && ED.checkoutPage === 'thankyou';
  const isUpsell = () => isCheckout() && ED.checkoutPage === 'upsell';
  const isDownsell = () => isCheckout() && ED.checkoutPage === 'downsell';
  const postPurchaseEnabled = () => !!(ED && ED.theme && ED.theme.checkout && ED.theme.checkout.postPurchaseEnabled);
  const ckPageLabel = (pt) => (D.CHECKOUT_PAGES.find((p) => p.value === pt) || {}).label || pt;
  const pageSections = () => isCheckout() ? curCkTpl().sections : curTpl().sections;
  const pageLabel = () => isCheckout() ? ckPageLabel(ED.checkoutPage) : ((D.PAGE_OPTIONS.find((p) => p.value === ED.currentPage) || {}).label || ED.currentPage);
  const tokens = () => isCheckout() ? ED.theme.checkout.settings : ED.theme.settings;
  const isCkType = (pt) => CK_TYPES.indexOf(pt) >= 0;
  const isResourcePage = () => !isCheckout() && (ED.currentPage === 'product' || ED.currentPage === 'collection');
  const resourceList = (pt) => pt === 'product' ? (D.SAMPLE.products || []) : (pt === 'collection' ? (D.SAMPLE.collections || []) : []);
  const assignedResourceIds = (pt, tpl) => ((tpl || curTpl()).assignedResourceIds || []);
  function previewResource(pt) {
    pt = pt || ED.currentPage;
    const list = resourceList(pt); const selected = ED.previewSel[pt];
    return list.find((r) => r.id === selected) ||
      list.find((r) => assignedResourceIds(pt).indexOf(r.id) >= 0) ||
      list[0] || null;
  }
  // Assignment counts are shown only for Online Store resource templates. Checkout Theme
  // deliberately does not expose Funnel-node associations or node preview context.
  const tplCount = (pt, t) => isCkType(pt) ? null : t.assigned;
  function usageText(pt, count) {
    if (isCkType(pt)) return '';
    if (count === '—' || count == null || count === '') return '';
    let base;
    const po = D.PAGE_OPTIONS.find((p) => p.value === pt) || {}; base = (po.noun || 'items').replace(/s$/, '');
    const verb = 'Assigned to';
    const plural = (Number(count) === 1) ? base : base + 's';
    return verb + ' ' + count + ' ' + plural;
  }
  // §8.2 unsaved-changes gate for switching templates (Save / Discard / Cancel).
  function confirmSwitchTemplate(proceed) {
    if (!ED || !isDirty()) { proceed(); return; }
    const back = h('<div class="modal-backdrop" style="z-index:240"></div>');
    const m = h('<div class="modal"></div>');
    m.innerHTML = '<div class="modal-head">Unsaved changes</div>' +
      '<div class="modal-body"><div class="subtle" style="font-size:13.5px;line-height:1.6">You have unsaved changes. Save or discard your changes before switching templates.</div></div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button><button class="btn btn-default" data-discard>Discard</button><button class="btn btn-primary" data-save>Save</button></div>';
    back.appendChild(m); document.body.appendChild(back);
    const close = () => back.remove();
    m.querySelector('[data-cancel]').onclick = close;
    back.onclick = (e) => { if (e.target === back) close(); };
    m.querySelector('[data-discard]').onclick = () => { close(); ED.theme = clone(ED.savedTheme); proceed(); };
    m.querySelector('[data-save]').onclick = () => {
      const issues = validate(true);
      if (issues.length) { close(); openIssues(issues, 'saving'); return; }
      close(); ED.savedTheme = clone(ED.theme); ED.meta.updated_time = nowStr(); proceed();
    };
  }

  // ==========================================================================
  //  THEME LIST  (#/online-store)
  // ==========================================================================
  function renderList() {
    closeBuilder(); ensureStyles();
    root.innerHTML =
      '<div class="os-list">' +
        '<div class="tabs" style="margin-bottom:14px"><div class="tab active" style="font-size:18px;font-weight:600;padding:6px 2px 14px">My theme</div></div>' +
        '<div class="os-theme-cards">' + D.THEMES.map(themeCard).join('') + '</div>' +
      '</div>';
    root.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => goEdit(b.getAttribute('data-edit')));
    root.querySelectorAll('[data-edit-ck]').forEach((b) => b.onclick = () => goCheckout(b.getAttribute('data-edit-ck')));
  }
  function themeCard(t) {
    return '<section class="os-theme-card">' +
      '<div class="os-theme-prev">' +
        '<div class="os-prev-pc"><img src="' + esc(t.pc_image) + '" alt="Desktop preview" loading="lazy"></div>' +
        '<div class="os-prev-h5"><img src="' + esc(t.h5_image) + '" alt="Mobile preview" loading="lazy"></div>' +
      '</div>' +
      '<div class="os-theme-meta"><div><div class="os-theme-name">' + esc(t.title) + '</div>' +
      '<div class="os-theme-saved">Last saved: ' + esc(t.updated_time) + '</div></div>' +
      '<div class="os-theme-actions">' +
        '<button class="btn btn-default" data-edit-ck="' + esc(t.handle) + '">Edit checkout</button>' +
        '<button class="btn btn-primary" data-edit="' + esc(t.handle) + '">Customize</button>' +
      '</div></div></section>';
  }
  function goEdit(handle) { location.hash = '#/online-store/edit/' + encodeURIComponent(handle); }
  function goCheckout(handle) { location.hash = '#/checkout/' + encodeURIComponent(handle); }

  // ==========================================================================
  //  BUILDER  (#/online-store/edit/:handle)
  // ==========================================================================
  function renderBuilder(handle, surface, page) {
    if (!ED || ED.meta.handle !== handle) startEditor(handle);
    // Entered via a route that pins a surface (e.g. #/checkout) — align the editor to it.
    if (surface && ED.surface !== surface) {
      ED.surface = surface;
      if (surface === 'checkout') ED.checkoutPage = (CK_TYPES.indexOf(page) >= 0) ? page : 'checkout';
      ED.leftMode = 'sections';
      ED.selection = defaultSelection();
    } else if (surface === 'checkout' && page && ED.checkoutPage !== page) {
      // Same surface, but the route pins a specific checkout page (#/checkout/thankyou).
      ED.checkoutPage = page; ED.leftMode = 'sections'; ED.selection = defaultSelection();
    }
    closeBuilder(); ensureStyles();
    // Keep the synced Theme editor faithful to its source copy. The merchant shell's
    // runtime i18n otherwise partially translates newly added English strings.
    const b = h('<div class="os-builder i18n-skip" id="os-builder"></div>');
    b.appendChild(topBar());
    const body = h('<div class="os-body"></div>');
    body.appendChild(leftPanel());
    body.appendChild(centerPanel());
    body.appendChild(rightPanel());
    b.appendChild(body);
    document.body.appendChild(b);
    wireTop(); wireLeft(); wireCanvas();
    if (ED.leftMode === 'settings' || ED.selection.kind === 'theme-settings') wireSettings(); else wireRight();
    applyHighlight(); scrollToSelected();
  }
  function closeBuilder() { const ex = document.getElementById('os-builder'); if (ex) ex.remove(); closePops(); }

  // -------------------------------------------------------------- TOP BAR
  function topBar() {
    const st = status();
    const pill = { unsaved: ['pill-orange', 'Unsaved changes'], draft: ['pill-blue', 'Draft pending publish'], saved: ['pill-green', 'Saved'] }[st];
    const dirty = isDirty(), draft = hasDraft(), busy = ED.busy;
    const issues = busy ? [] : validate();
    const top = h('<div class="os-top"></div>');
    top.innerHTML =
      '<div class="os-top-l">' +
        '<button class="back-btn" id="t-back" title="Back to themes">' + I.back + '</button>' +
        '<div class="os-rail">' +
          '<button class="os-rail-b' + (!inSettings() ? ' on' : '') + '" data-rail="sections" title="Sections">' + I.layers + '</button>' +
          '<button class="os-rail-b' + (inSettings() ? ' on' : '') + '" data-rail="settings" title="Theme settings">' + I.gear + '</button>' +
        '</div>' +
        '<span class="os-tname">' + esc(ED.theme.name) + '</span>' +
        '<span class="pill ' + pill[0] + '"><span class="dot"></span>' + pill[1] + '</span>' +
      '</div>' +
      '<div class="os-top-c">' +
        '<button class="os-pagesel" id="t-page" aria-label="Select page to edit">' +
          '<span class="os-psb-ico">' + pageIco(isCheckout() ? '__checkout__' : ED.currentPage) + '</span>' +
          '<span class="os-psb-label">' + esc(pageMenuLabel()) + '</span>' +
          '<span class="os-psb-chev">' + I.chev + '</span>' +
        '</button>' +
        '<div class="os-dev">' +
          '<button class="' + (ED.device === 'desktop' ? 'on' : '') + '" data-dev="desktop" title="Desktop">' + I.desktop + '</button>' +
          '<button class="' + (ED.device === 'mobile' ? 'on' : '') + '" data-dev="mobile" title="Mobile">' + I.mobile + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="os-top-r">' +
        '<button class="btn btn-default" id="t-discard"' + (dirty && !busy ? '' : ' disabled') + '>Discard</button>' +
        '<button class="btn btn-default" id="t-save"' + (dirty && !busy ? '' : ' disabled') + '>' + (busy === 'saving' ? 'Saving…' : 'Save') + '</button>' +
        '<button class="btn ' + (issues.length ? 'btn-warn' : 'btn-primary') + '" id="t-pub"' + (((dirty || draft) && !busy) ? '' : ' disabled') + ' title="' + (issues.length ? issues.length + ' validation issue(s)' : 'Publish to storefront') + '">' +
          (busy === 'publishing' ? 'Publishing…' : (issues.length ? 'Publish · ' + issues.length : 'Publish')) + '</button>' +
      '</div>';
    return top;
  }
  // Trigger label: page/template on the online-store surface, page name on checkout.
  function pageMenuLabel() {
    if (isCheckout()) {
      const t = curCkTpl();
      return ckPageLabel(ED.checkoutPage) + ' · ' + ((t && t.name) || 'Default');
    }
    const po = D.PAGE_OPTIONS.find((p) => p.value === ED.currentPage) || {};
    if (po.multi) { const t = curTpl(); return po.label + ' · ' + ((t && t.name) || 'Default'); }
    return po.label || ED.currentPage;
  }
  // Small page-type glyphs for the selector (kept inline; not part of the shared I set).
  function pageIco(v) {
    const s = (p) => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
    if (v === 'home') return s('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>');
    if (v === 'product') return s('<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 3 12.2V5a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>');
    if (v === 'collection') return s('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>');
    if (v === 'collections') return s('<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>');
    if (v === 'checkout') return I.cart;
    if (v === 'upsell') return s('<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>');
    if (v === 'downsell') return s('<path d="M3 7l6 6 4-4 8 8"/><path d="M17 17h4v-4"/>');
    if (v === 'thankyou') return s('<path d="M20 6 9 17l-5-5"/>');
    if (v === '__checkout__') return I.cart;
    if (v === '__online__') return s('<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>');
    return I.layers;
  }
  function wireTop() {
    const b = document.getElementById('os-builder');
    b.querySelector('#t-back').onclick = () => attemptLeave(() => { location.hash = '#/online-store'; });
    b.querySelectorAll('[data-rail]').forEach((x) => x.onclick = () => { ED.leftMode = x.getAttribute('data-rail'); if (ED.leftMode === 'settings') ED.selection = { kind: 'theme-settings' }; else if (ED.selection.kind === 'theme-settings') ED.selection = defaultSelection(); rerender(); });
    const psel = b.querySelector('#t-page'); if (psel) psel.onclick = () => openPageSelector(psel);
    b.querySelectorAll('[data-dev]').forEach((x) => x.onclick = () => { const d = x.getAttribute('data-dev'); if (d !== ED.device) { ED.device = d; refreshTop(); refreshCanvas(); } });
    const dis = b.querySelector('#t-discard'); if (dis && !dis.disabled) dis.onclick = onDiscard;
    const sv = b.querySelector('#t-save'); if (sv && !sv.disabled) sv.onclick = onSave;
    const pb = b.querySelector('#t-pub'); if (pb && !pb.disabled) pb.onclick = onPublish;
  }

  // -------------------------------------------------------------- LEFT (tree / settings groups)
  function leftPanel() {
    const left = h('<div class="os-left"></div>');
    const ck = isCheckout();
    if (inSettings()) {
      left.innerHTML = '<div class="os-left-head">' + (ck ? 'Checkout settings' : 'Theme settings') + '</div><div class="os-left-scroll" id="os-tree">' + settingsTreeHint() + '</div>';
    } else {
      left.innerHTML = '<div class="os-left-head">' + (ck ? 'Checkout' : 'Sections') + '</div><div class="os-left-scroll" id="os-tree">' + (ck ? checkoutTreeHtml() : treeHtml()) + '</div>';
    }
    return left;
  }
  function settingsTreeHint() {
    const note = isCheckout()
      ? 'Global Checkout / Upsell / Downsell / Thank you styles. Component overrides win, then these settings, then system defaults.'
      : 'Global tokens — every Section & Block inherits from here unless overridden. Edit on the right; the preview updates live.';
    return '<div class="os-tree-note">' + esc(note) + '</div>' +
      sGroups().map((g) => '<div class="os-tree-row" data-sgrp="' + g.key + '"><span class="os-tr-ico">' + I.gear + '</span><span class="os-tr-name">' + esc(g.name) + '</span></div>').join('');
  }
  // Checkout tree — required components are locked; commerce components (PRD §14.1)
  // can be added / hidden / deleted / reordered.
  function checkoutTreeHtml() {
    let html = '<div class="os-grp-head" style="cursor:default">' + esc(ckPageLabel(ED.checkoutPage)) + ' Template</div>';
    pageSections().forEach((s) => { html += checkoutRow(s); });
    let nAdd = 0; ckCatalog().forEach((g) => nAdd += g.entries.length);
    html += '<div class="os-tree-add" data-add-ckcomp>' + I.plus + ' Add section <span class="os-add-n">(' + nAdd + ')</span></div>';
    const note = isThankyou()
      ? 'Required components confirm the order, so they can\u2019t be moved. Only content & trust components can be added, hidden, deleted and reordered within their allowed zones.'
      : isOfferPage()
        ? 'Required components keep the post-purchase offer usable, so they can\u2019t be moved. Existing Checkout content & trust components can be added; Product upsell, Shipping Insurance and VIP Club aren\u2019t available here.'
      : 'Required components keep the transaction flow intact, so they can\u2019t be moved. Commerce and content & trust components can be added, hidden, deleted and reordered within their allowed zones.';
    html += '<div class="os-tree-note" style="margin-top:10px">' + note + '</div>';
    return html;
  }
  function checkoutRow(s) {
    const sel = ED.selection; const def = SECTIONS[s.kind];
    const active = sel.kind === 'section' && sel.sectionId === s.id;
    const hasBlocks = def && def.blocks; const open = ED.sectionExpand[s.id] !== false;
    const addable = isCheckoutAddable(s.kind);
    if (addable) {
      // Addable component (commerce or content). Draggable + hide / delete, and — for
      // content components that carry blocks — expandable with its block list + Add block.
      // Footer is pinned to the page bottom (PRD §5.3): selectable/hideable but not draggable.
      const fixed = !!(def && def.fixedBottom);
      const pinnedTop = !!(def && def.pinnedTop);
      const pinned = fixed || pinnedTop || !!(def && def.pinned);
      const lockTitle = fixed ? 'Pinned to page bottom' : (pinnedTop ? 'Top area only \u2014 can\u2019t be moved' : 'Bottom area only \u2014 can\u2019t be moved');
      let h2 = '<div class="os-row sec' + (active ? ' active' : '') + (s.hidden ? ' hid' : '') + '"' + (pinned ? '' : ' draggable="true"') + ' data-sel-sec="' + s.id + '">' +
        (hasBlocks ? '<span class="os-row-caret' + (open ? ' open' : '') + '" data-tog-sec="' + s.id + '">' + I.chevR + '</span>' : '<span class="os-row-caret ghost"></span>') +
        '<span class="os-tr-ico">' + ICON(def ? def.icon : 'layers') + '</span>' +
        '<span class="os-tr-name">' + esc(sectionLabel(s)) + '</span>' +
        rowActions(s.hidden, true) + (pinned ? '<span class="os-tr-lock" title="' + lockTitle + '">' + I.lock + '</span>' : '<span class="os-tr-grip">' + I.grip + '</span>') + '</div>';
      if (hasBlocks && open) {
        // Some sections (e.g. Footer) render blocks grouped by kind into fixed regions rather than
        // in raw array order. Sort the tree display by that region order so it matches the preview.
        let blist = s.blocks || [];
        if (def.blockTreeOrder) {
          const rank = (k) => { const i = def.blockTreeOrder.indexOf(k); return i < 0 ? 999 : i; };
          blist = blist.slice().sort((a, b) => rank(a.kind) - rank(b.kind));
        }
        blist.forEach((bl) => {
          const bActive = sel.kind === 'block' && sel.sectionId === s.id && sel.blockId === bl.id;
          h2 += '<div class="os-row blk' + (bActive ? ' active' : '') + (bl.hidden ? ' hid' : '') + '" draggable="true" data-sel-blk="' + s.id + ':' + bl.id + '">' +
            '<span class="os-tr-ico sm">' + ICON('layers') + '</span><span class="os-tr-name">' + esc(blockLabel(s, bl)) + '</span>' +
            rowActions(bl.hidden, true) + '<span class="os-tr-grip">' + I.grip + '</span></div>';
        });
        const bd = blockAddInfo(s);
        if (bd) h2 += '<div class="os-tree-add sub" data-add-blk="' + s.id + '">' + I.plus + ' ' + esc(bd) + '</div>';
      }
      return h2;
    }
    // Required components are locked (no drag/delete). Some (e.g. Header) are still hideable —
    // they get the eye toggle from the tree, plus the lock to signal they can't be moved.
    const hideable = !!(def && def.hideable);
    let html = '<div class="os-row sec locked' + (active ? ' active' : '') + (s.hidden ? ' hid' : '') + '" data-sel-sec="' + s.id + '">' +
      (hasBlocks ? '<span class="os-row-caret' + (open ? ' open' : '') + '" data-tog-sec="' + s.id + '">' + I.chevR + '</span>' : '<span class="os-row-caret ghost"></span>') +
      '<span class="os-tr-ico">' + ICON(def ? def.icon : 'layers') + '</span>' +
      '<span class="os-tr-name">' + esc(sectionLabel(s)) + '</span>' +
      (hideable ? rowActions(s.hidden, false) : '') +
      '<span class="os-tr-lock" title="Required component">' + I.lock + '</span></div>';
    if (hasBlocks && open) {
      (s.blocks || []).forEach((bl) => {
        const bActive = sel.kind === 'block' && sel.blockId === bl.id;
        html += '<div class="os-row blk locked' + (bActive ? ' active' : '') + '" data-sel-blk="' + s.id + ':' + bl.id + '">' +
          '<span class="os-tr-ico sm">' + ICON('layers') + '</span><span class="os-tr-name">' + esc(blockLabel(s, bl)) + '</span>' +
          '<span class="os-tr-lock">' + I.lock + '</span></div>';
      });
    }
    return html;
  }
  function treeHtml() {
    const sel = ED.selection;
    const groupHead = (key, label) => '<div class="os-grp-head" data-grp="' + key + '"><span class="os-caret' + (ED.expand[key] ? ' open' : '') + '">' + I.chevR + '</span>' + esc(label) + '</div>';
    let html = resourcePreviewHtml();
    // Header group
    html += groupHead('header', 'Header Group');
    if (ED.expand.header) {
      html += globalRow('announcement', 'Announcement bar', ED.theme.announcement, sel.kind === 'announcement');
      html += globalRow('header', 'Header', ED.theme.header, sel.kind === 'header');
    }
    // Template group
    html += groupHead('template', pageLabel().replace(/ page$/i, '') + ' Template');
    if (ED.expand.template) {
      pageSections().forEach((s) => { html += sectionRow(s); });
      html += '<div class="os-tree-add" data-add-sec>' + I.plus + ' Add section <span class="os-add-n">(' + countAvailable() + ')</span></div>';
    }
    // Footer group
    html += groupHead('footer', 'Footer Group');
    if (ED.expand.footer) html += globalRow('footer', 'Footer', ED.theme.footer, sel.kind === 'footer');
    return html;
  }
  // Shopify-style Preview resource selector for Product / Collection templates. Selecting a
  // resource changes only the editor preview context; it never reassigns the template.
  function resourcePreviewHtml() {
    if (!isResourcePage()) return '';
    const pt = ED.currentPage; const tpl = curTpl(); const res = previewResource(pt);
    const usage = usageText(pt, tpl && tpl.assigned);
    const thumb = res && res.image
      ? '<span class="os-rp-thumb" style="background-image:url(' + esc(res.image) + ')"></span>'
      : '<span class="os-rp-thumb empty">' + I.image + '</span>';
    const status = pt === 'product' && res && res.status === 'draft'
      ? '<span class="os-resource-status">Draft</span>' : '';
    return '<div class="os-rp-context">' +
      '<div class="os-rp-template">' + esc((tpl && tpl.name) || pageLabel()) + '</div>' +
      (usage ? '<div class="os-rp-assigned">' + esc(usage) + '</div>' : '') +
      '<button class="os-rp-trigger" type="button" data-resource-preview>' +
        '<span class="os-rp-copy"><span class="os-rp-label">Preview</span><span class="os-rp-name">' + thumb +
          '<span class="os-rp-title">' + esc((res && res.title) || ('Select ' + pt)) + '</span>' + status + '</span></span>' +
        '<span class="os-rp-chev">' + I.chev + '</span>' +
      '</button>' +
    '</div>';
  }
  function countAvailable() { let n = 0; D.CATALOG.forEach((g) => g.entries.forEach((e) => { if (e.kind && SECTIONS[e.kind]) n++; })); return n; }
  function globalRow(scope, label, inst, active) {
    const def = SECTIONS[inst.kind];
    const hasBlocks = def && def.blocks;
    const open = ED.sectionExpand[scope] !== false;
    let html = '<div class="os-row global' + (active ? ' active' : '') + (inst.hidden ? ' hid' : '') + '" data-sel-global="' + scope + '">' +
      (hasBlocks ? '<span class="os-row-caret' + (open ? ' open' : '') + '" data-tog-sec="' + scope + '">' + I.chevR + '</span>' : '<span class="os-row-caret ghost"></span>') +
      '<span class="os-tr-ico">' + ICON(def ? def.icon : 'layers') + '</span>' +
      '<span class="os-tr-name">' + esc(label) + '</span>' +
      rowActions(inst.hidden, false) + '<span class="os-tr-lock" title="Global section">' + I.lock + '</span></div>';
    if (hasBlocks && open) {
      (inst.blocks || []).forEach((bl) => {
        const bActive = ED.selection.kind === 'block' && ED.selection.sectionId === scope && ED.selection.blockId === bl.id;
        html += '<div class="os-row blk' + (bActive ? ' active' : '') + (bl.hidden ? ' hid' : '') + '" draggable="true" data-sel-blk="' + scope + ':' + bl.id + '">' +
          '<span class="os-tr-ico sm">' + ICON('layers') + '</span><span class="os-tr-name">' + esc(blockLabel(inst, bl)) + '</span>' +
          rowActions(bl.hidden, true) + '<span class="os-tr-grip">' + I.grip + '</span></div>';
      });
      const bd = blockAddInfo(inst);
      if (bd) html += '<div class="os-tree-add sub" data-add-blk="' + scope + '">' + I.plus + ' ' + esc(bd) + '</div>';
    }
    return html;
  }
  function sectionRow(s) {
    const sel = ED.selection;
    const def = SECTIONS[s.kind];
    const active = sel.kind === 'section' && sel.sectionId === s.id;
    const hasBlocks = def && def.blocks;
    const open = ED.sectionExpand[s.id] !== false;
    const name = sectionLabel(s);
    let html = '<div class="os-row sec' + (active ? ' active' : '') + (s.hidden ? ' hid' : '') + '" draggable="true" data-sel-sec="' + s.id + '">' +
      (hasBlocks ? '<span class="os-row-caret' + (open ? ' open' : '') + '" data-tog-sec="' + s.id + '">' + I.chevR + '</span>' : '<span class="os-row-caret ghost"></span>') +
      '<span class="os-tr-ico">' + ICON(def ? def.icon : 'layers') + '</span>' +
      '<span class="os-tr-name">' + esc(name) + '</span>' +
      rowActions(s.hidden, true) + '<span class="os-tr-grip">' + I.grip + '</span></div>';
    if (hasBlocks && open) {
      (s.blocks || []).forEach((bl) => {
        const bActive = sel.kind === 'block' && sel.blockId === bl.id;
        html += '<div class="os-row blk' + (bActive ? ' active' : '') + (bl.hidden ? ' hid' : '') + '" draggable="true" data-sel-blk="' + s.id + ':' + bl.id + '">' +
          '<span class="os-tr-ico sm">' + ICON('layers') + '</span><span class="os-tr-name">' + esc(blockLabel(s, bl)) + '</span>' +
          rowActions(bl.hidden, true) + '<span class="os-tr-grip">' + I.grip + '</span></div>';
      });
      const bd = blockAddInfo(s);
      if (bd) html += '<div class="os-tree-add sub" data-add-blk="' + s.id + '">' + I.plus + ' ' + esc(bd) + '</div>';
    }
    return html;
  }
  function rowActions(hidden, canDelete) {
    return '<span class="os-tr-acts">' +
      '<span class="os-tr-act" data-vis title="' + (hidden ? 'Show' : 'Hide') + '">' + (hidden ? I.eyeOff : I.eye) + '</span>' +
      (canDelete ? '<span class="os-tr-act danger" data-del title="Delete">' + I.trash + '</span>' : '') + '</span>';
  }
  function blockAddInfo(s) {
    const def = SECTIONS[s.kind]; if (!def || !def.blocks) return null;
    if (def.blocks.kinds) return 'Add block';
    const max = def.blocks.max || 99; if ((s.blocks || []).length >= max) return null;
    return 'Add ' + ((def.blocks.name || 'block').toLowerCase());
  }
  function sectionLabel(s) {
    const def = SECTIONS[s.kind];
    // Top recap bar label. On Checkout the full itemized Order summary also shows on
    // mobile, so the bar keeps the "(Mobile)" qualifier to stay distinguishable. On
    // Thank you the bar is the ONLY mobile summary, so "(Mobile)" is redundant → plain
    // "Order summary". Independent of the buyer-facing heading text.
    if (s.kind === 'checkout-order-summary-bar') return isThankyou() ? 'Order summary' : 'Order summary (Mobile)';
    const head = s.settings && (s.settings.heading || s.settings.logoText || s.settings.title);
    if (head && String(head).trim()) return String(head).trim();
    return def ? def.name : s.kind;
  }
  function blockLabel(s, bl) {
    const def = SECTIONS[s.kind]; const bd = blockDef(def, bl.kind);
    const head = bl.settings && (bl.settings.heading || bl.settings.question || bl.settings.title || bl.settings.author || bl.settings.label);
    const base = bd ? bd.name : (bl.kind || 'Block');
    if (head && String(head).trim()) return base + ' · ' + String(head).trim().slice(0, 22);
    return base;
  }

  function wireLeft() {
    const b = document.getElementById('os-builder'); const tree = b.querySelector('#os-tree');
    if (inSettings()) {
      tree.querySelectorAll('[data-sgrp]').forEach((r) => r.onclick = () => { const k = r.getAttribute('data-sgrp'); ED.settingsExpand[sExpKey(k)] = true; ED.selection = { kind: 'theme-settings' }; refreshRight(); setTimeout(() => { const el = document.querySelector('#os-set-' + k); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); });
      return;
    }
    if (isCheckout()) {
      tree.querySelectorAll('[data-tog-sec]').forEach((c) => c.onclick = (e) => { e.stopPropagation(); const id = c.getAttribute('data-tog-sec'); ED.sectionExpand[id] = ED.sectionExpand[id] === false ? true : false; refreshTree(); });
      // Required rows: plain select. Commerce rows carry hide / delete actions (bindRow).
      tree.querySelectorAll('[data-sel-sec]').forEach((r) => {
        if (r.querySelector('[data-vis],[data-del]')) bindRow(r, () => select({ kind: 'section', sectionId: r.getAttribute('data-sel-sec') }));
        else r.onclick = (e) => { if (e.target.closest('[data-tog-sec]')) return; select({ kind: 'section', sectionId: r.getAttribute('data-sel-sec') }); };
      });
      // Locked Order-Summary blocks: plain select. Content-component blocks carry hide /
      // delete actions, so they go through bindRow.
      tree.querySelectorAll('[data-sel-blk]').forEach((r) => {
        const sel = () => { const p = r.getAttribute('data-sel-blk').split(':'); select({ kind: 'block', sectionId: p[0], blockId: p[1] }); };
        if (r.querySelector('[data-vis],[data-del]')) bindRow(r, sel); else r.onclick = sel;
      });
      tree.querySelectorAll('[data-add-blk]').forEach((r) => r.onclick = (e) => { e.stopPropagation(); addBlock(r.getAttribute('data-add-blk'), e.currentTarget); });
      const addC = tree.querySelector('[data-add-ckcomp]'); if (addC) addC.onclick = (e) => openAddCheckoutComponent(e.currentTarget);
      wireDrag(tree);
      return;
    }
    const rp = tree.querySelector('[data-resource-preview]');
    if (rp) rp.onclick = (e) => { e.stopPropagation(); openResourcePicker(rp); };
    tree.querySelectorAll('[data-grp]').forEach((g) => g.onclick = () => { const k = g.getAttribute('data-grp'); ED.expand[k] = !ED.expand[k]; refreshTree(); });
    tree.querySelectorAll('[data-tog-sec]').forEach((c) => c.onclick = (e) => { e.stopPropagation(); const id = c.getAttribute('data-tog-sec'); ED.sectionExpand[id] = ED.sectionExpand[id] === false ? true : false; refreshTree(); });
    tree.querySelectorAll('[data-sel-global]').forEach((r) => bindRow(r, () => select({ kind: r.getAttribute('data-sel-global') })));
    tree.querySelectorAll('[data-sel-sec]').forEach((r) => bindRow(r, () => select({ kind: 'section', sectionId: r.getAttribute('data-sel-sec') })));
    tree.querySelectorAll('[data-sel-blk]').forEach((r) => bindRow(r, () => { const p = r.getAttribute('data-sel-blk').split(':'); select({ kind: 'block', sectionId: p[0], blockId: p[1] }); }));
    const addS = tree.querySelector('[data-add-sec]'); if (addS) addS.onclick = (e) => openAddSection(e.currentTarget);
    tree.querySelectorAll('[data-add-blk]').forEach((r) => r.onclick = (e) => { e.stopPropagation(); addBlock(r.getAttribute('data-add-blk'), e.currentTarget); });
    wireDrag(tree);
  }
  function bindRow(r, onSel) {
    r.onclick = (e) => { if (e.target.closest('[data-vis]') || e.target.closest('[data-del]') || e.target.closest('[data-tog-sec]')) return; onSel(); };
    const vis = r.querySelector('[data-vis]'); if (vis) vis.onclick = (e) => { e.stopPropagation(); toggleHidden(r); };
    const del = r.querySelector('[data-del]'); if (del) del.onclick = (e) => { e.stopPropagation(); confirmDelete(r); };
  }

  // -------------------------------------------------------------- CENTER (preview canvas)
  function centerPanel() {
    const c = h('<div class="os-center"></div>');
    const hint = usageScopeHint();
    c.innerHTML = '<div class="os-canvas-bar">' + esc(previewBarText()) + '</div>' +
      (hint ? '<div class="os-scope-hint">' + I.info + '<span>' + esc(hint) + '</span></div>' : '') +
      '<div class="os-canvas-scroll" id="os-cscroll"><div class="os-frame ' + ED.device + '" id="os-frame">' + canvasHtml() + '</div></div>';
    return c;
  }
  function previewBarText() {
    const resource = isResourcePage() ? previewResource() : null;
    return (isCheckout() ? 'Preview' : 'Live preview') + ' · ' + pageLabel() +
      (resource ? ' · ' + resource.title : '') +
      ' · ' + (ED.device === 'desktop' ? 'Desktop' : 'Mobile');
  }
  // Editor-top usage-scope reminder for Online Store resource templates.
  function usageScopeHint() {
    let pt, t, count;
    if (isCheckout()) return '';
    pt = ED.currentPage; t = curTpl(); count = t && t.assigned;
    if (!t || typeof count !== 'number' || count <= 0) return '';
    const noun = (D.PAGE_OPTIONS.find((p) => p.value === pt) || {}).noun || 'items';
    return 'This template is assigned to ' + count + ' ' + noun + '. Changes will apply to all assigned ' + noun + '.';
  }
  function canvasHtml() {
    if (isCheckout()) {
      if (isThankyou()) return thankyouCanvasHtml();
      if (isOfferPage()) return offerCanvasHtml();
      return checkoutCanvasHtml();
    }
    let html = '';
    const secs = pageSections().filter((s) => !s.hidden);
    const first = secs[0];
    const transHdr = !!(first && first.kind === 'collection-banner' && first.settings && first.settings.allow_transparent_header) && !ED.theme.header.hidden;
    html += wrapGlobal('announcement', ED.theme.announcement);
    if (transHdr) {
      html += '<div class="os-transhdr">' + wrapGlobal('header', ED.theme.header, true) + wrapSection(first, true) + '</div>';
      secs.slice(1).forEach((s) => { html += wrapSection(s, false); });
    } else {
      html += wrapGlobal('header', ED.theme.header);
      secs.forEach((s, i) => { html += wrapSection(s, i === 0); });
    }
    html += wrapGlobal('footer', ED.theme.footer);
    if (!secs.length) html += '<div class="os-empty-canvas">This template has no visible sections.<br>Add one from the left, or switch page type.</div>';
    return html;
  }
  function thankyouSnapshot() {
    const snap = clone(D.THANKYOU_SNAPSHOT || {});
    const accepted = Array.isArray(OS.ckState['post-purchase-accepted-lines'])
      ? clone(OS.ckState['post-purchase-accepted-lines']) : [];
    const offerFlow = (OS.ckState || {})['post-purchase-offer-flow'] || {};
    if (!accepted.length && !offerFlow.visited) return snap;
    snap.lines = (snap.lines || []).filter((line) => !line.upsell && !line.downsell).concat(accepted);
    if (accepted[0] && accepted[0].currency) snap.currency = accepted[0].currency;
    snap.subtotal = snap.lines.reduce((total, line) => total + (+line.price || 0) * (+line.qty || 1), 0);
    snap.discount = (snap.discounts || []).reduce((total, item) =>
      total + (+item.product || 0) + (+item.order || 0) + (+item.shipping || 0), 0);
    snap.total = snap.subtotal - snap.discount + (+snap.shipping || 0) + (+snap.tax || 0);
    return snap;
  }
  function ctxFor(scope, id, selBool, selBlk, isFirst, transHdr) { return { mob: ED.device === 'mobile', tokens: tokens(), scope, sectionId: id, selected: selBool, selectedBlockId: selBlk, sample: D.SAMPLE, resource: isResourcePage() ? previewResource() : null, isFirst: !!isFirst, transparentHeader: !!transHdr, page: ED.currentPage, surface: ED.surface, checkoutPage: ED.checkoutPage, checkoutTemplateId: isCheckout() ? curCkTplId() : '', precedingUpsellTemplateId: isCheckout() ? ckTplIdOf('upsell') : '', checkout: D.CHECKOUT_MOCK, offer: isOfferPage() ? ((D.OFFER_MOCKS || {})[ED.checkoutPage] || null) : null, snapshot: isThankyou() ? thankyouSnapshot() : null, ckAddons: CK_ADDONS }; }

  // -------------------------------------------------------------- CHECKOUT canvas
  // Fixed two-column layout on PC (form + summary); single column on mobile with a
  // collapsed Order Summary on top (PRD §7). Each component is still a selectable
  // `.os-sec`, so the shared wireCanvas()/hydrate() pipeline works unchanged.
  function checkoutCanvasHtml() {
    const tk = ED.theme.checkout.settings; const mob = ED.device === 'mobile';
    const secs = pageSections();
    // Live add-on contributions, shared by every Order Summary surface this render.
    CK_ADDONS = computeCheckoutAddons(secs);
    const byKind = (k) => secs.find((s) => s.kind === k);
    const wrap = (s, first) => (s && !s.hidden) ? wrapSection(s, !!first) : '';
    const header = wrap(byKind('checkout-header'), true);
    const sumSec = byKind('checkout-order-summary');
    const summary = wrap(sumSec);
    // Mobile-only top bar: a separate, self-contained component (checkout-order-summary-bar)
    // pinned full-bleed under the header. Editing it does not touch the bottom Order Summary.
    const topBar = mob ? wrap(byKind('checkout-order-summary-bar')) : '';
    // Commerce components render only in their allowed zone (PRD §4.2). Zone 'summary'
    // sits under the Order Summary; all other zones live in the main/left column at
    // their stored position (insertion keeps array order correct).
    const SKIP = { 'checkout-header': 1, 'checkout-order-summary': 1, 'checkout-order-summary-bar': 1 };
    // Signed in: the Delivery card already integrates the shipping-method chooser (its
    // "Shipping" accordion, checkout-shipping-info), so the standalone Shipping Method
    // section is redundant and omitted. Signed out keeps it — the plain address form has
    // no integrated picker. Selection stays shared via OS.ckState['ck-shipping'].
    const acctSignedIn = !!(((OS.ckState || {})['ck-account']) || {}).signedIn;
    if (acctSignedIn) SKIP['checkout-shipping-method'] = 1;
    const inZone = (s, z) => isCheckoutAddable(s.kind) && s.zone === z;
    const isSummaryZone = (s) => inZone(s, 'summary');
    // Content-PRD zones outside the two-column body: 'announce' (full-bleed top, above the
    // header) and 'bottom' (full-bleed band at the very end — Testimonials then Footer).
    const announceZone = secs.filter((s) => inZone(s, 'announce'));
    let bottomZone = secs.filter((s) => inZone(s, 'bottom'));
    // Footer is always pinned to the very bottom regardless of array order (PRD §5.3).
    bottomZone = bottomZone.slice().sort((a, b) => (a.kind === 'checkout-footer' ? 1 : 0) - (b.kind === 'checkout-footer' ? 1 : 0));
    const mainSecs = secs.filter((s) => !SKIP[s.kind] && !isSummaryZone(s) && !inZone(s, 'announce') && !inZone(s, 'bottom'));
    const summaryZone = secs.filter((s) => isSummaryZone(s));
    const summaryZoneInner = summaryZone.map((s) => wrap(s)).join('');
    const summaryZoneHtml = summaryZoneInner ? '<div class="cksz">' + summaryZoneInner + '</div>' : '';
    const announceHtml = announceZone.map((s) => wrap(s)).join('');
    const bottomInner = bottomZone.map((s) => wrap(s)).join('');
    const bottomHtml = bottomInner ? '<div class="ckbottom">' + bottomInner + '</div>' : '';
    const leftCol = mainSecs.map((s) => wrap(s)).join(''); // desktop: single column in order
    const vars = checkoutVars(tk);
    // Component-level summary background overrides the Order Summary theme setting, so the
    // full-bleed right band (driven by --ck-sum-bg) follows it too (last inline decl wins).
    const sumBg = sumSec && sumSec.settings && sumSec.settings.background_color;
    const L = tk.layout || {};
    const pageStyle = vars + (sumBg ? ';--ck-sum-bg:' + sumBg : '') + ';--ck-mob-pad:' + (L.mobile_page_padding || 18) + 'px';
    // Mobile: full-bleed order-summary bar under header → form → bottom Order Summary →
    // its 'summary' zone components → Pay now → policies.
    const ctaIdx = mainSecs.findIndex((s) => s.kind === 'checkout-cta');
    const mobBefore = (ctaIdx < 0 ? mainSecs : mainSecs.slice(0, ctaIdx)).map((s) => wrap(s)).join('');
    const mobAfter = (ctaIdx < 0 ? [] : mainSecs.slice(ctaIdx)).map((s) => wrap(s)).join('');
    const inner = mob
      ? ('<div class="ckwrap mob" style="padding:' + (L.section_spacing || 24) + 'px ' + (L.mobile_page_padding || 18) + 'px">' +
          mobBefore + summary + summaryZoneHtml + mobAfter + '</div>')
      : '<div class="ckwrap" style="max-width:' + (L.page_max_width_pc || 980) + 'px;gap:' + (L.column_gap || 40) + 'px">' +
          '<div class="ckcol main" style="flex:0 0 calc(' + (L.main_column_width || 58) + '% - ' + ((L.column_gap || 40) / 2) + 'px)">' + leftCol + '</div>' +
          '<div class="ckcol side" style="flex:0 0 calc(' + (L.summary_column_width || 42) + '% - ' + ((L.column_gap || 40) / 2) + 'px)">' + summary + summaryZoneHtml + '</div>' +
        '</div>';
    return '<div class="ckpage ' + (mob ? 'mob' : '') + '" style="' + pageStyle + '">' + announceHtml + header + topBar + inner + bottomHtml + '</div>';
  }

  // -------------------------------------------------------------- THANK YOU canvas
  // Mirrors the checkout two-column PC / single-column mobile layout with the
  // Thank-you skeleton (Thank you PRD §20/§21). Left column: Order status → Order
  // details → (Contact us | Continue shopping) row, plus main-zone enhancement
  // components. Right column: Order summary (read-only Final Order Snapshot) + its
  // summary-zone components. Full-bleed announce band on top; Policy links + Footer
  // in the full-bleed bottom band. Reuses wrapSection / checkoutVars / hydrate.
  function thankyouCanvasHtml() {
    const tk = ED.theme.checkout.settings; const mob = ED.device === 'mobile';
    const secs = pageSections();
    CK_ADDONS = { rows: [], lines: [] }; // no commerce components on Thank you
    const byKind = (k) => secs.find((s) => s.kind === k);
    const wrap = (s, first) => (s && !s.hidden) ? wrapSection(s, !!first) : '';
    const inZone = (s, z) => isCheckoutAddable(s.kind) && s.zone === z;
    const zoneHtml = (z) => secs.filter((s) => inZone(s, z)).map((s) => wrap(s)).join('');

    const header = wrap(byKind('checkout-header'), true);
    const sumSec = byKind('checkout-order-summary');
    const summary = wrap(sumSec);
    // Thank-you uses a SINGLE Order Summary component for both viewports (no separate
    // mobile bar). On mobile it renders full-bleed at the very top (under the header),
    // collapsed — reusing the component's own mobile recap form. On desktop it stays in
    // the right column. (Checkout keeps its separate top bar; this only touches Thank you.)
    const mobTopSummary = mob ? ('<div class="ty-topsum">' + summary + '</div>') : '';
    const summaryZoneInner = zoneHtml('summary');
    const summaryZoneHtml = summaryZoneInner ? '<div class="cksz">' + summaryZoneInner + '</div>' : '';

    const L = tk.layout || {};
    // Main column building blocks. The 'header' zone (Below header) sits at the very top of
    // the main column — below the page header, above Order status (PRD §9.2). Order status
    // stays pinned right after it; nothing renders above the header zone in this column.
    const headerZoneHtml = zoneHtml('header');
    const statusB = wrap(byKind('thankyou-order-status')) + zoneHtml('status');
    const detailsB = wrap(byKind('thankyou-order-details')) + zoneHtml('details');
    const continueSec = byKind('thankyou-continue-shopping');
    const contactSec = byKind('thankyou-contact-us');
    // PC: Contact us (left) + Continue shopping (right) share one row (matches Shopify).
    const actionsPC = '<div class="ty-actions">' + wrap(contactSec) + wrap(continueSec) + '</div>';
    const continueZone = zoneHtml('continue');

    const announceHtml = zoneHtml('announce');
    // Bottom band: Policy links → Testimonials (policytop zone, i.e. below Policy links) →
    // Footer (pinned last, and only present when the merchant added it from the catalog).
    // Testimonials sit below Policy links and above the Footer, matching Checkout (PRD §9.2).
    // The Policy links are wrapped in a centered column that matches the page content width, so
    // their divider + links align with the content above and get comfortable breathing room
    // beneath them (Shopify-style). The Testimonials band and the Footer stay full-bleed.
    const polSec = byKind('checkout-policy-links');
    const policyHtml = (polSec && !polSec.hidden)
      ? '<div class="ty-policywrap" style="max-width:' + (L.page_max_width_pc || 980) + 'px">' + wrap(polSec) + '</div>' : '';
    const bottomInner = policyHtml + zoneHtml('policytop') + wrap(byKind('checkout-footer'));
    const bottomHtml = bottomInner ? '<div class="ckbottom">' + bottomInner + '</div>' : '';

    const vars = checkoutVars(tk);
    const sumBg = sumSec && sumSec.settings && sumSec.settings.background_color;
    const pageStyle = vars + (sumBg ? ';--ck-sum-bg:' + sumBg : '') + ';--ck-mob-pad:' + (L.mobile_page_padding || 18) + 'px';

    const mainCol = headerZoneHtml + statusB + detailsB + actionsPC + continueZone;
    // Mobile mirrors Shopify's Thank-you page: the sole Order Summary sits full-bleed at
    // the top (mobTopSummary, rendered above `inner`). The body carries only its zone
    // add-ons ("Below Order summary" components stay in the content flow, not up top).
    const inner = mob
      ? ('<div class="ckwrap mob" style="padding:' + (L.section_spacing || 24) + 'px ' + (L.mobile_page_padding || 18) + 'px">' +
          headerZoneHtml + statusB + detailsB + wrap(continueSec) + wrap(contactSec) + continueZone + summaryZoneHtml + '</div>')
      : '<div class="ckwrap" style="max-width:' + (L.page_max_width_pc || 980) + 'px;gap:' + (L.column_gap || 40) + 'px">' +
          '<div class="ckcol main" style="flex:0 0 calc(' + (L.main_column_width || 58) + '% - ' + ((L.column_gap || 40) / 2) + 'px)">' + mainCol + '</div>' +
          '<div class="ckcol side" style="flex:0 0 calc(' + (L.summary_column_width || 42) + '% - ' + ((L.column_gap || 40) / 2) + 'px)">' + summary + summaryZoneHtml + '</div>' +
        '</div>';
    return '<div class="ckpage ty ' + (mob ? 'mob' : '') + '" style="' + pageStyle + '">' + announceHtml + header + mobTopSummary + inner + bottomHtml + '</div>';
  }
  // -------------------------------------------------------------- UPSELL / DOWNSELL canvas
  // One shared post-purchase offer renderer. Theme owns declarative recommendation settings
  // and editor Mock preview; live eligibility, quote, payment and routing remain service-owned.
  function offerCanvasHtml() {
    const tk = ED.theme.checkout.settings; const mob = ED.device === 'mobile';
    const secs = pageSections();
    CK_ADDONS = { rows: [], lines: [] };
    const byKind = (k) => secs.find((s) => s.kind === k);
    const wrap = (s, first) => (s && !s.hidden) ? wrapSection(s, !!first) : '';
    const inZone = (s, z) => isCheckoutAddable(s.kind) && s.zone === z;
    const zoneHtml = (z) => secs.filter((s) => inZone(s, z)).map((s) => wrap(s)).join('');
    const L = tk.layout || {};
    const vars = checkoutVars(tk) + ';--ck-mob-pad:' + (L.mobile_page_padding || 18) + 'px';

    const announceHtml = zoneHtml('announce');
    const header = wrap(byKind('checkout-offer-header'), true);
    const mainInner = zoneHtml('header') +
      wrap(byKind('checkout-offer-progress')) +
      zoneHtml('progress') +
      wrap(byKind('checkout-offer-product')) +
      zoneHtml('offer');
    const main = '<div class="ckoffer-wrap" style="max-width:' + (L.page_max_width_pc || 980) + 'px;padding:' +
      (L.section_spacing || 24) + 'px ' + (mob ? (L.mobile_page_padding || 18) : 28) + 'px">' +
      '<div class="ckoffer-main" style="gap:' + (L.section_spacing || 24) + 'px">' + mainInner + '</div></div>';

    const policy = wrap(byKind('checkout-policy-links'));
    const policyHtml = policy ? '<div class="ckoffer-policy" style="max-width:' + (L.page_max_width_pc || 980) + 'px">' + policy + '</div>' : '';
    const bottomInner = policyHtml + zoneHtml('policytop') + zoneHtml('bottom');
    const bottomHtml = bottomInner ? '<div class="ckbottom">' + bottomInner + '</div>' : '';
    return '<div class="ckpage ckoffer-page ' + ED.checkoutPage + ' ' + (mob ? 'mob' : '') + '" style="' + vars + '">' +
      announceHtml + header + main + bottomHtml + '</div>';
  }
  const CK_FONT = (v) => (!v || v === 'Default') ? "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" : ("'" + v + "', system-ui, sans-serif");
  function checkoutVars(tk) {
    const m = tk.main || {}, hd = tk.header || {}, os = tk.order_summary || {}, ac = tk.accent || {}, inp = tk.input || {}, ty = tk.typography || {};
    const set = [];
    set.push('--ck-page-bg:' + (m.page_background || '#fff'));
    set.push('--ck-text:' + (m.text_color || '#1F1F1F'));
    set.push('--ck-muted:' + (m.muted_text_color || '#777'));
    set.push('--ck-divider:' + (m.divider_color || '#E5E5E5'));
    set.push('--ck-h-bg:' + (hd.header_background || '#fff'));
    set.push('--ck-h-text:' + (hd.header_text_color || '#1F1F1F'));
    set.push('--ck-h-accent:' + (hd.header_accent_color || '#121212'));
    set.push('--ck-sum-bg:' + (os.summary_background || '#F5F5F5'));
    set.push('--ck-sum-text:' + (os.summary_text || '#1F1F1F'));
    set.push('--ck-sum-muted:' + (os.summary_muted_text || '#777'));
    set.push('--ck-accent:' + (ac.accent_color || '#121212'));
    set.push('--ck-btn-bg:' + (ac.button_background || '#121212'));
    set.push('--ck-btn-text:' + (ac.button_text_color || '#fff'));
    set.push('--ck-btn-hover:' + (ac.button_hover_background || '#000'));
    set.push('--ck-btn-radius:' + (ac.button_border_radius == null ? 6 : ac.button_border_radius) + 'px');
    set.push('--ck-btn-h:' + (ac.button_height || 52) + 'px');
    set.push('--ck-btn-tt:' + (ac.button_text_transform || 'none'));
    set.push('--ck-input-bg:' + (inp.transparent_input ? 'transparent' : (inp.input_background || '#fff')));
    set.push('--ck-input-text:' + (inp.input_text_color || '#1F1F1F'));
    set.push('--ck-ph:' + (inp.placeholder_color || '#B5B5B5'));
    set.push('--ck-input-border:' + (inp.input_border_color || '#D9D9D9'));
    set.push('--ck-input-focus:' + (inp.input_focus_border_color || ac.accent_color || '#121212'));
    set.push('--ck-error:' + (inp.input_error_color || '#D72C2C'));
    set.push('--ck-input-radius:' + (inp.input_border_radius == null ? 6 : inp.input_border_radius) + 'px');
    set.push('--ck-input-h:' + (inp.input_height || 48) + 'px');
    set.push('--ck-base-fs:' + (ty.base_font_size || 14) + 'px');
    set.push('--ck-heading-fs:' + (ty.heading_font_size || 18) + 'px');
    set.push('--ck-small-fs:' + (ty.small_font_size || 12) + 'px');
    set.push('--ck-fw-h:' + (ty.font_weight_heading || '600'));
    set.push('--ck-fw-b:' + (ty.font_weight_body || '400'));
    set.push('--ck-heading-font:' + CK_FONT(ty.heading_font));
    set.push('--ck-body-font:' + CK_FONT(ty.body_font));
    set.push('--ck-section-gap:' + ((tk.layout || {}).section_spacing || 24) + 'px');
    return set.join(';');
  }
  function wrapGlobal(scope, inst, transHdr) {
    if (inst.hidden) return '';
    const def = SECTIONS[inst.kind]; const sel = ED.selection.kind === scope;
    const inner = def ? safeRender(def, inst, scope, inst.id, false, transHdr) : unknown(inst.kind);
    return '<div class="os-sec' + (sel ? ' active' : '') + (transHdr ? ' os-sec-overlay' : '') + '" data-csel-global="' + scope + '"><span class="os-sec-tag">' + esc(scope === 'announcement' ? 'Announcement' : scope[0].toUpperCase() + scope.slice(1)) + '</span>' + inner + '</div>';
  }
  function wrapSection(s, isFirst) {
    const def = SECTIONS[s.kind]; const sel = ED.selection.kind === 'section' && ED.selection.sectionId === s.id;
    const inner = def ? safeRender(def, s, 'section', s.id, isFirst) : unknown(s.kind);
    return '<div class="os-sec' + (sel ? ' active' : '') + '" data-csel="' + s.id + '" data-preview-id="section:' + s.id + '"><span class="os-sec-tag">' + esc(sectionLabel(s)) + '</span>' + inner + '</div>';
  }
  function safeRender(def, inst, scope, id, isFirst, transHdr) {
    try {
      const selBlk = (ED.selection.kind === 'block' && ED.selection.sectionId === id) ? ED.selection.blockId : null;
      const selBool = (scope === 'section' ? (ED.selection.kind === 'section' && ED.selection.sectionId === id) : ED.selection.kind === scope);
      return def.render(inst.settings, inst.blocks || [], ctxFor(scope, id, selBool, selBlk, isFirst, transHdr));
    } catch (e) { return '<div class="os-render-err">⚠ ' + esc(def.kind) + ' failed to render: ' + esc(e.message) + '</div>'; }
  }
  function unknown(kind) { return '<div class="os-render-err">Section “' + esc(kind) + '” isn’t available yet.</div>'; }

  function wireCanvas() {
    const frame = document.getElementById('os-frame'); if (!frame) return;
    wireFloatFields(frame);
    frame.querySelectorAll('[data-csel-global]').forEach((el) => el.addEventListener('click', (e) => {
      const blk = e.target.closest('[data-block-id]');
      const scope = el.getAttribute('data-csel-global');
      if (blk && el.contains(blk)) { e.stopPropagation(); /* globals expose block selection too (footer) */ select({ kind: 'block', sectionId: scope, blockId: blk.getAttribute('data-block-id') }); return; }
      select({ kind: scope });
    }));
    frame.querySelectorAll('[data-csel]').forEach((el) => el.addEventListener('click', (e) => {
      const blk = e.target.closest('[data-block-id]'); const id = el.getAttribute('data-csel');
      if (blk && el.contains(blk)) { e.stopPropagation(); select({ kind: 'block', sectionId: id, blockId: blk.getAttribute('data-block-id') }); return; }
      select({ kind: 'section', sectionId: id });
    }));
    // hydrate each section for storefront interactivity (carousels, accordions, drag sliders…)
    frame.querySelectorAll('.os-sec').forEach((secEl) => {
      const id = secEl.getAttribute('data-csel'); const gscope = secEl.getAttribute('data-csel-global');
      const inst = id ? pageSections().find((x) => x.id === id) : ED.theme[gscope];
      if (!inst) return; const def = SECTIONS[inst.kind];
      if (def && def.hydrate) { try { def.hydrate(secEl, inst.settings, inst.blocks || [], ctxFor(id ? 'section' : gscope, id || gscope, false, null)); } catch (e) { /* noop */ } }
    });
  }

  // -------------------------------------------------------------- RIGHT (config panel)
  function rightPanel() {
    const r = h('<div class="os-right"></div>');
    r.innerHTML = rightInner();
    return r;
  }
  function rightInner() {
    if (ED.leftMode === 'settings' || ED.selection.kind === 'theme-settings') return themeSettingsPanel();
    const sel = ED.selection;
    if (sel.kind === 'announcement' || sel.kind === 'header' || sel.kind === 'footer') {
      const inst = ED.theme[sel.kind]; const def = SECTIONS[inst.kind];
      const label = sel.kind === 'announcement' ? 'Announcement bar' : sel.kind[0].toUpperCase() + sel.kind.slice(1);
      return panelHead(def ? def.icon : 'layers', label, 'Global · shown on every page', inst.hidden, 'global', sel.kind) +
        '<div class="os-right-scroll" id="os-form">' + (def ? schemaForm(def.schema, inst.settings, '', schemaCtx()) : noSettings()) + '</div>';
    }
    if (sel.kind === 'section') {
      const s = pageSections().find((x) => x.id === sel.sectionId);
      if (!s) return emptyRight('Section not found.');
      const def = SECTIONS[s.kind];
      const rm = isCheckout() ? '' : '<button class="os-remove" data-remove-sec="' + s.id + '">' + I.trash + ' Remove section</button>';
      return panelHead(def ? def.icon : 'layers', sectionLabel(s), def ? def.name : s.kind, s.hidden, 'section', s.id, isCheckout()) +
        '<div class="os-right-scroll" id="os-form">' + (def ? schemaForm(def.schema, panelSettings(s), '', schemaCtx(s.id)) : noSettings()) + rm + '</div>';
    }
    if (sel.kind === 'block') {
      const s = pageSections().find((x) => x.id === sel.sectionId) || globalBySel(sel.sectionId);
      const bl = s && (s.blocks || []).find((x) => x.id === sel.blockId);
      if (!s || !bl) return emptyRight('Block not found.');
      const def = SECTIONS[s.kind]; const bd = blockDef(def, bl.kind);
      const rm = isCheckout() ? '' : '<button class="os-remove" data-remove-blk="' + sel.sectionId + ':' + bl.id + '">' + I.trash + ' Remove block</button>';
      return panelHead('layers', blockLabel(s, bl), (bd ? bd.name : 'Block') + ' · in ' + (def ? def.name : s.kind), bl.hidden, 'block', sel.blockId, isCheckout()) +
        '<div class="os-right-scroll" id="os-form">' + (bd && bd.fields && bd.fields.length ? schemaForm(bd.fields, bl.settings, '') : noSettings()) + rm + '</div>';
    }
    return emptyRight('Select a section or block to edit.');
  }
  function globalBySel(scope) { return (scope === 'footer' || scope === 'header' || scope === 'announcement') ? ED.theme[scope] : null; }
  function panelSettings(section) {
    return section ? section.settings : {};
  }
  // Page context passed to schema visibleWhen / preview summaries.
  function schemaCtx(sectionId) {
    return {
      surface: ED.surface, checkoutPage: ED.checkoutPage, isThankyou: isThankyou(), isOffer: isOfferPage(),
      checkoutTemplateId: isCheckout() ? curCkTplId() : '',
      precedingUpsellTemplateId: isCheckout() ? ckTplIdOf('upsell') : '',
      offer: isOfferPage() ? ((D.OFFER_MOCKS || {})[ED.checkoutPage] || null) : null,
      sample: D.SAMPLE,
    };
  }
  function panelHead(icon, title, sub, hidden, scope, id, locked) {
    const vis = locked
      ? '<span class="os-rh-vis" title="Required component" style="cursor:default;color:#c4cad3">' + I.lock + '</span>'
      : '<button class="os-rh-vis' + (hidden ? ' off' : '') + '" data-head-vis="' + scope + ':' + id + '" title="' + (hidden ? 'Show section' : 'Hide section') + '">' + (hidden ? I.eyeOff : I.eye) + '</button>';
    return '<div class="os-right-head"><span class="os-rh-ico">' + ICON(icon) + '</span>' +
      '<div style="min-width:0"><div class="os-rh-title">' + esc(title) + '</div><div class="os-rh-sub">' + esc(sub) + '</div></div>' + vis + '</div>';
  }
  function emptyRight(msg) { return '<div class="os-right-head"><span class="os-rh-ico">' + I.layers + '</span><div><div class="os-rh-title">Settings</div><div class="os-rh-sub">Nothing selected</div></div></div><div class="os-empty-right">' + esc(msg) + '</div>'; }
  function noSettings() { return '<div class="os-info">This section has no settings.</div>'; }

  // ==========================================================================
  //  SCHEMA FORM (15 control types) — drives section/block/settings panels
  // ==========================================================================
  function schemaForm(schema, values, prefix, ctx) {
    return (schema || []).map((f) => fieldHtml(f, values, ctx)).join('');
  }
  // `ctx` (optional) carries page context to visibleWhen so a shared component can hide a
  // field per surface/page — e.g. the Header's Cart config is hidden on the Thank you page.
  function visible(f, values, ctx) { return !f.visibleWhen || !!f.visibleWhen(values, ctx); }
  function fieldHtml(f, values, ctx) {
    if (f.sub) return visible(f, values, ctx) ? '<div class="os-sub">' + esc(f.sub) + '</div>' : '';
    if (f.info && !f.key) return visible(f, values, ctx) ? '<div class="os-info">' + esc(f.info) + '</div>' : '';
    if (!visible(f, values, ctx)) return '';
    if (!f.key && typeof f.render === 'function') return f.render(values, ctx);
    const val = values[f.key];
    const hint = f.info ? '<div class="os-fhint">' + esc(f.info) + '</div>' : '';
    if (f.control === 'toggle') {
      return '<div class="os-fld os-fld-row"><label class="os-flabel">' + esc(f.label) + req(f) + '</label>' + control(f, val, values, ctx) + '</div>' + hint;
    }
    const valTag = (f.control === 'range') ? '<span class="os-fval">' + esc(fmtRange(f, val)) + '</span>' : '';
    return '<div class="os-fld"><label class="os-flabel">' + esc(f.label) + req(f) + valTag + '</label>' + control(f, val, values, ctx) + hint + '</div>';
  }
  function req(f) { return f.required ? '<span class="os-req">*</span>' : ''; }
  function fmtRange(f, v) { v = (v == null ? f.default : v); return v + (f.unit || ''); }
  function control(f, val, values, ctx) {
    const dk = 'data-fkey="' + esc(f.key) + '" data-control="' + f.control + '"';
    const opts = typeof f.options === 'function' ? (f.options(values, ctx) || []) : (f.options || []);
    switch (f.control) {
      case 'text': case 'url':
        return '<input class="os-input" ' + dk + (f.maxlength ? ' maxlength="' + f.maxlength + '"' : '') + ' type="text" value="' + esc(val) + '" placeholder="' + esc(f.placeholder || '') + '">';
      case 'textarea': case 'custom_css': case 'richtext':
        return '<textarea class="os-input os-ta' + (f.control === 'custom_css' ? ' mono' : '') + '" ' + dk + (f.maxlength ? ' maxlength="' + f.maxlength + '"' : '') + ' rows="' + (f.control === 'custom_css' ? 4 : 3) + '" placeholder="' + esc(f.placeholder || '') + '">' + esc(val) + '</textarea>' + (f.control === 'richtext' ? '<div class="os-fhint">Rich text — basic HTML allowed.' + (f.maxlength ? ' Max ' + f.maxlength + ' characters.' : '') + '</div>' : (f.maxlength ? '<div class="os-fhint">Max ' + f.maxlength + ' characters.</div>' : ''));
      case 'select':
        return '<select class="os-select" ' + dk + '>' + opts.map((o) => '<option value="' + esc(o.value) + '"' + (String(o.value) === String(val) ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('') + '</select>';
      case 'segmented':
        return '<div class="os-seg2" ' + dk + '>' + opts.map((o) => '<button data-v="' + esc(o.value) + '" class="' + (String(o.value) === String(val) ? 'on' : '') + '">' + esc(o.label) + '</button>').join('') + '</div>';
      case 'toggle':
        return '<span class="os-tg' + (val ? ' on' : '') + '" ' + dk + '><i></i></span>';
      case 'range':
        return '<input type="range" class="os-range" ' + dk + ' min="' + f.min + '" max="' + f.max + '" step="' + (f.step || 1) + '" value="' + (val == null ? f.default : val) + '">';
      case 'number':
        return '<input type="number" class="os-input" ' + dk + ' value="' + esc(val) + '"' + (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') + (f.step ? ' step="' + f.step + '"' : '') + '>';
      case 'numberInherit': {
        const auto = val == null;
        return '<div class="os-ninh" ' + dk + '>' +
          '<input type="number" class="os-input" data-ninh-num' + (auto ? ' disabled placeholder="Theme default"' : ' value="' + esc(val) + '"') +
          (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') + (f.step ? ' step="' + f.step + '"' : '') + '>' +
          '<button type="button" class="os-tbtn' + (auto ? ' on' : '') + '" data-ninh-auto title="Inherit theme value">Auto</button></div>';
      }
      case 'color':
        return colorControl(f, val, dk);
      case 'image':
        return '<div class="os-imgf" ' + dk + '>' +
          (val
            ? '<div class="os-imgset"><div class="os-imgset-prev" style="background-image:url(' + esc(val) + ')"></div>' +
              '<div class="os-imgset-meta"><div class="os-imgset-name" title="' + esc(val) + '">' + esc(val) + '</div>' +
              '<div class="os-imgset-acts"><button type="button" class="os-imglink" data-img-pick>Replace</button><button type="button" class="os-imglink danger" data-img-remove>Remove</button></div></div></div>'
            : '<button type="button" class="os-imgdrop" data-img-pick><span class="os-imgdrop-ico">' + I.image + '</span><span class="os-imgdrop-t">Select image</span><span class="os-imgdrop-s">drag &amp; drop supported</span></button>') +
          '</div>';
      case 'collections':
        return collectionsControl(f, val, dk);
      case 'ordered_products':
        return orderedProductsControl(f, val, dk);
      case 'ordered_variants':
        return orderedVariantsControl(f, val, dk);
      case 'product_mappings':
        return productMappingsControl(f, val, dk);
      case 'product': case 'collection': case 'menu': case 'blog': case 'page':
        return pickerControl(f, val, dk);
      default:
        return '<input class="os-input" ' + dk + ' value="' + esc(val) + '">';
    }
  }
  function colorControl(f, val, dk) {
    const isT = val === 'transparent';
    const hex = (typeof val === 'string' && /^#/.test(val)) ? val : '#000000';
    return '<div class="os-color" ' + dk + '>' +
      '<label class="os-sw' + (isT ? ' tsp' : '') + '" style="' + (isT ? '' : 'background:' + esc(val)) + '"><input type="color" value="' + esc(hex) + '"></label>' +
      '<input class="os-hex" value="' + esc(val == null ? '' : val) + '">' +
      (f.allowTransparent ? '<button class="os-tbtn' + (isT ? ' on' : '') + '" data-tsp title="Transparent">T</button>' : '') + '</div>';
  }
  function pickerControl(f, val, dk) {
    const label = pickerLabel(f.control, val, f.pickFrom);
    return '<button class="os-picker" ' + dk + ' data-pick="' + f.control + '"' + (f.single ? ' data-single="1"' : '') + (f.pickFrom ? ' data-pickfrom="' + esc(f.pickFrom) + '"' : '') + '>' +
      '<span>' + esc(label) + '</span>' + I.chev + '</button>';
  }
  // Simulated "system library" pick — drops in one sample image (no real picker in the prototype).
  const PICK_IMG = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';
  const I_grip = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
  const I_coll = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>';
  function collectionsControl(f, val, dk) {
    const S = D.SAMPLE;
    const ids = Array.isArray(val) ? val : [];
    const items = ids.map((id) => S.collections.find((c) => c.id === id)).filter(Boolean);
    if (!items.length) {
      return '<div class="os-colsel" ' + dk + '><button class="os-colsel-btn" data-cols-pick>Select</button></div>';
    }
    const rows = items.map((c) => '<div class="os-colsel-row" draggable="true" data-cid="' + esc(c.id) + '">' +
      '<span class="os-colsel-ico">' + I_coll + '</span>' +
      '<span class="os-colsel-name">' + esc(c.title) + '</span>' +
      '<span class="os-colsel-grip" title="Drag to reorder">' + I_grip + '</span></div>').join('');
    return '<div class="os-colsel" ' + dk + '>' +
      '<div class="os-colsel-list" data-cols-list>' + rows + '</div>' +
      '<button class="os-colsel-change" data-cols-pick>Change</button></div>';
  }
  function productRowHtml(id, removable) {
    const p = (D.SAMPLE.products || []).find((x) => x.id === id);
    if (!p) return '';
    const unavailable = p.status === 'draft' || p.available === false;
    return '<div class="os-op-row" draggable="true" data-op-id="' + esc(p.id) + '">' +
      '<span class="os-op-thumb" style="background-image:url(' + esc(p.image || '') + ')"></span>' +
      '<span class="os-op-copy"><strong>' + esc(p.title) + '</strong>' +
        (unavailable ? '<small>Currently unavailable</small>' : '<small>' + money(p.price || 0) + '</small>') + '</span>' +
      (removable ? '<button type="button" class="os-op-remove" data-op-remove="' + esc(p.id) + '" aria-label="Remove ' + esc(p.title) + '">×</button>' : '') +
      '<span class="os-op-grip" title="Drag to reorder">' + I_grip + '</span></div>';
  }
  const VARIANT_REF_SEP = '::';
  function variantRefInfo(value) {
    const raw = value && typeof value === 'object'
      ? String(value.productId || '') + VARIANT_REF_SEP + String(value.variantId || 'default')
      : String(value || '');
    const parts = raw.split(VARIANT_REF_SEP);
    const product = (D.SAMPLE.products || []).find((item) => item.id === parts[0]);
    if (!product) return null;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const variant = variants.find((item) => item.id === parts[1]) || variants.find((item) => item.available !== false) || variants[0] || null;
    return {
      ref: product.id + VARIANT_REF_SEP + (variant ? variant.id : 'default'),
      product,
      variant,
      variantTitle: variant ? variant.title : 'Default variant',
      price: variant ? variant.price : product.price,
    };
  }
  function variantRowHtml(value, removable) {
    const info = variantRefInfo(value);
    if (!info) return '';
    const product = info.product;
    const unavailable = product.status === 'draft' || product.available === false || (info.variant && info.variant.available === false);
    return '<div class="os-op-row" draggable="true" data-op-id="' + esc(info.ref) + '">' +
      '<span class="os-op-thumb" style="background-image:url(' + esc(product.image || '') + ')"></span>' +
      '<span class="os-op-copy"><strong>' + esc(product.title) + '</strong>' +
        '<small>' + esc(info.variantTitle) + (unavailable ? ' · Currently unavailable' : ' · ' + money(info.price || 0)) + '</small></span>' +
      (removable ? '<button type="button" class="os-op-remove" data-op-remove="' + esc(info.ref) + '" aria-label="Remove ' + esc(product.title + ' · ' + info.variantTitle) + '">×</button>' : '') +
      '<span class="os-op-grip" title="Drag to reorder">' + I_grip + '</span></div>';
  }
  function orderedProductsControl(f, val, dk) {
    const ids = Array.isArray(val) ? val : [];
    const rows = ids.map((id) => productRowHtml(id, true)).join('');
    return '<div class="os-oplist" ' + dk + ' data-max="' + (f.max || 10) + '">' +
      (rows ? '<div class="os-op-rows" data-op-rows>' + rows + '</div>' : '<div class="os-op-empty">No products selected</div>') +
      '<button type="button" class="os-op-select" data-op-pick>' + (rows ? 'Change products' : 'Select products') + '</button></div>';
  }
  function orderedVariantsControl(f, val, dk) {
    const refs = Array.isArray(val) ? val : [];
    const rows = refs.map((ref) => variantRowHtml(ref, true)).join('');
    return '<div class="os-oplist" ' + dk + ' data-max="' + (f.max || 10) + '">' +
      (rows ? '<div class="os-op-rows" data-op-rows>' + rows + '</div>' : '<div class="os-op-empty">No product variants selected</div>') +
      '<button type="button" class="os-op-select" data-op-pick>' + (rows ? 'Change variants' : 'Select variants') + '</button></div>';
  }
  function productMappingsControl(f, val, dk) {
    const mappings = Array.isArray(val) ? val : [];
    const cards = mappings.map((m, index) => {
      m = m || {};
      const purchased = m && m.purchasedProductId ? productRowHtml(m.purchasedProductId, false) : '<div class="os-map-empty">Select a purchased product</div>';
      const recommended = (m && Array.isArray(m.recommendedProductIds) ? m.recommendedProductIds : []).map((ref) => variantRowHtml(ref, true)).join('');
      const duplicate = m.purchasedProductId && mappings.some((other, otherIndex) => otherIndex < index && other && other.purchasedProductId === m.purchasedProductId);
      const invalid = !m.purchasedProductId
        ? 'Select a purchased product.'
        : duplicate ? 'A mapping for this product already exists.'
        : !(m.recommendedProductIds || []).length ? 'Select at least one recommended product variant.' : '';
      return '<div class="os-map-card" draggable="true" data-map-id="' + esc(m.id || String(index)) + '" data-map-index="' + index + '">' +
        '<div class="os-map-head"><span class="os-map-grip">' + I_grip + '</span><strong>Mapping ' + (index + 1) + '</strong>' +
          '<button type="button" data-map-remove="' + index + '">Remove</button></div>' +
        '<label class="os-map-label">Purchased product</label><div class="os-map-purchased">' + purchased + '</div>' +
        '<button type="button" class="os-map-action" data-map-purchased="' + index + '">' + (m.purchasedProductId ? 'Change product' : 'Select product') + '</button>' +
        '<label class="os-map-label">Recommended variants</label>' +
        (recommended ? '<div class="os-op-rows" data-map-rec-list="' + index + '">' + recommended + '</div>' : '<div class="os-map-empty">No recommended variants</div>') +
        '<button type="button" class="os-map-action" data-map-recommended="' + index + '">' + (recommended ? 'Change variants' : 'Select variants') + '</button>' +
        (invalid ? '<div class="os-map-error">' + esc(invalid) + '</div>' : '') +
      '</div>';
    }).join('');
    return '<div class="os-mappings" ' + dk + ' data-max="' + (f.max || 50) + '">' +
      (cards || '<div class="os-op-empty">No mappings configured</div>') +
      '<button type="button" class="os-op-select" data-map-add>Add mapping</button></div>';
  }
  function pickerLabel(kind, val, pickFrom) {
    const S = D.SAMPLE;
    if (kind === 'product') {
      const pool = pickFrom === 'services' ? (S.services || []) : S.products;
      if (Array.isArray(val)) return val.length ? val.length + ' products selected' : 'Select products';
      const p = pool.find((x) => x.id === val); return p ? p.title : 'Select a product';
    }
    if (kind === 'collection') { const c = S.collections.find((x) => x.id === val); return c ? c.title : 'Select a collection'; }
    if (kind === 'collections') { const arr = Array.isArray(val) ? val : []; return arr.length ? arr.length + ' collection' + (arr.length > 1 ? 's' : '') + ' selected' : 'All active collections'; }
    if (kind === 'menu') { const m = S.menus.find((x) => x.id === val); return m ? m.name : 'Select a menu'; }
    if (kind === 'blog') { const b = S.blogs.find((x) => x.id === val); return b ? b.title : 'Select a blog'; }
    if (kind === 'page') { const p = S.pages.find((x) => x.id === val); return p ? p.title : 'Select a page'; }
    return 'Select…';
  }

  function wireRight() {
    const form = document.querySelector('#os-form'); if (!form) return;
    const target = currentSettings(); if (!target) { wireRemove(form); return; }
    const onChange = (k, v, rerenderPanel) => {
      target[k] = v; markDirty(); refreshAffectedCanvas(); if (rerenderPanel) refreshRight();
    };
    form.querySelectorAll('[data-control]').forEach((el) => {
      const k = el.getAttribute('data-fkey'); const ctl = el.getAttribute('data-control');
      const field = (currentSchema() || []).find((x) => x.key === k) || {};
      if (ctl === 'text' || ctl === 'url' || ctl === 'number') {
        el.oninput = () => onChange(k, ctl === 'number' ? clampNum(el) : el.value, false);
        if (field.refreshPanel) el.onchange = () => refreshRight();
      } else if (ctl === 'textarea' || ctl === 'custom_css' || ctl === 'richtext') {
        el.oninput = () => onChange(k, el.value, false);
      } else if (ctl === 'select') {
        el.onchange = () => onChange(k, el.value, true);
      } else if (ctl === 'range') {
        el.oninput = () => { const fv = el.parentElement.querySelector('.os-fval'); if (fv) fv.textContent = el.value + (rangeUnit(el) || ''); onChange(k, num(el.value), false); };
      } else if (ctl === 'toggle') {
        el.onclick = () => { const nv = !el.classList.contains('on'); el.classList.toggle('on', nv); onChange(k, nv, true); };
      } else if (ctl === 'segmented') {
        el.querySelectorAll('button').forEach((bn) => bn.onclick = () => { el.querySelectorAll('button').forEach((x) => x.classList.remove('on')); bn.classList.add('on'); onChange(k, coerce(bn.getAttribute('data-v')), true); });
      } else if (ctl === 'color') {
        const cp = el.querySelector('input[type=color]'); const hx = el.querySelector('.os-hex'); const sw = el.querySelector('.os-sw'); const tb = el.querySelector('[data-tsp]');
        cp.oninput = () => { hx.value = cp.value; sw.style.background = cp.value; sw.classList.remove('tsp'); if (tb) tb.classList.remove('on'); onChange(k, cp.value, false); };
        hx.onchange = () => { const v = hx.value.trim(); sw.style.background = v === 'transparent' ? '' : v; sw.classList.toggle('tsp', v === 'transparent'); onChange(k, v, false); };
        if (tb) tb.onclick = () => { const on = !tb.classList.contains('on'); tb.classList.toggle('on', on); sw.classList.toggle('tsp', on); if (on) { sw.style.background = ''; hx.value = 'transparent'; onChange(k, 'transparent', false); } else { sw.style.background = '#ffffff'; hx.value = '#FFFFFF'; onChange(k, '#FFFFFF', false); } };
      } else if (ctl === 'numberInherit') {
        const numEl = el.querySelector('[data-ninh-num]'); const autoBtn = el.querySelector('[data-ninh-auto]'); const f = fieldByEl(el) || {};
        numEl.oninput = () => onChange(k, clamp(numEl.value, f.min == null ? -1e9 : f.min, f.max == null ? 1e9 : f.max, f.min || 0), false);
        autoBtn.onclick = () => { const on = !autoBtn.classList.contains('on'); autoBtn.classList.toggle('on', on); if (on) { numEl.value = ''; numEl.disabled = true; onChange(k, null, false); } else { numEl.disabled = false; const dv = (f.min != null ? f.min : 0); numEl.value = dv; onChange(k, dv, false); numEl.focus(); } };
      } else if (ctl === 'image') {
        el.querySelectorAll('[data-img-pick]').forEach((b) => b.onclick = () => onChange(k, PICK_IMG, true));
        const rm = el.querySelector('[data-img-remove]'); if (rm) rm.onclick = () => onChange(k, '', true);
      } else if (ctl === 'collections') {
        const pick = el.querySelector('[data-cols-pick]'); if (pick) pick.onclick = () => openPickerPop(pick, ctl, target[k], (v) => onChange(k, v, true));
        const list = el.querySelector('[data-cols-list]'); if (list) wireColsReorder(list, () => (Array.isArray(target[k]) ? target[k] : []), (arr) => onChange(k, arr, true));
      } else if (ctl === 'ordered_products') {
        wireOrderedProducts(el, () => (Array.isArray(target[k]) ? target[k] : []), (arr) => onChange(k, arr, true));
      } else if (ctl === 'ordered_variants') {
        wireOrderedVariants(el, () => (Array.isArray(target[k]) ? target[k] : []), (arr) => onChange(k, arr, true));
      } else if (ctl === 'product_mappings') {
        wireProductMappings(el, () => (Array.isArray(target[k]) ? target[k] : []), (arr) => onChange(k, arr, true));
      } else if (ctl === 'product' || ctl === 'collection' || ctl === 'menu' || ctl === 'blog' || ctl === 'page') {
        el.onclick = () => openPickerPop(el, ctl, target[k], (v) => onChange(k, v, true), el.getAttribute('data-single') === '1', el.getAttribute('data-pickfrom'));
      }
    });
    wireRemove(form);
  }
  function wireColsReorder(list, getArr, setArr) {
    let dragId = null;
    list.querySelectorAll('[data-cid]').forEach((row) => {
      row.addEventListener('dragstart', (e) => { dragId = row.getAttribute('data-cid'); row.classList.add('os-colsel-dragging'); if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (_) {} } });
      row.addEventListener('dragend', () => { dragId = null; row.classList.remove('os-colsel-dragging'); list.querySelectorAll('.os-colsel-over').forEach((x) => x.classList.remove('os-colsel-over')); });
      row.addEventListener('dragover', (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; row.classList.add('os-colsel-over'); });
      row.addEventListener('dragleave', () => row.classList.remove('os-colsel-over'));
      row.addEventListener('drop', (e) => {
        e.preventDefault(); row.classList.remove('os-colsel-over');
        const targetId = row.getAttribute('data-cid'); if (!dragId || dragId === targetId) return;
        const arr = getArr().slice(); const from = arr.indexOf(dragId); if (from < 0) return;
        arr.splice(from, 1);
        let insert = arr.indexOf(targetId); if (insert < 0) insert = arr.length;
        const rect = row.getBoundingClientRect(); if (e.clientY > rect.top + rect.height / 2) insert += 1;
        arr.splice(insert, 0, dragId); setArr(arr);
      });
    });
  }
  function wireIdRows(list, rowSelector, attr, getArr, setArr) {
    if (!list) return;
    let dragId = null;
    list.querySelectorAll(rowSelector).forEach((row) => {
      row.addEventListener('dragstart', (e) => {
        if (e.target.closest('button')) { e.preventDefault(); return; }
        e.stopPropagation();
        dragId = row.getAttribute(attr); row.classList.add('dragging');
        if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (_) {} }
      });
      row.addEventListener('dragend', () => { dragId = null; row.classList.remove('dragging'); });
      row.addEventListener('dragover', (e) => { e.preventDefault(); });
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetId = row.getAttribute(attr); if (!dragId || dragId === targetId) return;
        const arr = getArr().slice(); const from = arr.indexOf(dragId); const to = arr.indexOf(targetId);
        if (from < 0 || to < 0) return;
        arr.splice(from, 1); arr.splice(to, 0, dragId); setArr(arr);
      });
    });
  }
  function wireOrderedProducts(root, getArr, setArr) {
    const max = Math.max(1, +(root.getAttribute('data-max') || 10));
    const pick = root.querySelector('[data-op-pick]');
    if (pick) pick.onclick = () => openPickerPop(pick, 'product', getArr(), (v) => setArr(v), false, null, max);
    root.querySelectorAll('[data-op-remove]').forEach((button) => {
      button.onclick = (e) => { e.stopPropagation(); setArr(getArr().filter((id) => id !== button.getAttribute('data-op-remove'))); };
    });
    wireIdRows(root.querySelector('[data-op-rows]'), '[data-op-id]', 'data-op-id', getArr, setArr);
  }
  function wireOrderedVariants(root, getArr, setArr) {
    const max = Math.max(1, +(root.getAttribute('data-max') || 10));
    const pick = root.querySelector('[data-op-pick]');
    if (pick) pick.onclick = () => openVariantPickerPop(pick, getArr(), (refs) => setArr(refs), max);
    root.querySelectorAll('[data-op-remove]').forEach((button) => {
      button.onclick = (e) => { e.stopPropagation(); setArr(getArr().filter((ref) => variantRefInfo(ref) && variantRefInfo(ref).ref !== button.getAttribute('data-op-remove'))); };
    });
    wireIdRows(root.querySelector('[data-op-rows]'), '[data-op-id]', 'data-op-id',
      () => getArr().map((ref) => (variantRefInfo(ref) || {}).ref).filter(Boolean), setArr);
  }
  function wireProductMappings(root, getArr, setArr) {
    const max = Math.max(1, +(root.getAttribute('data-max') || 50));
    const update = (index, patch) => {
      const arr = clone(getArr()); arr[index] = Object.assign({}, arr[index], patch); setArr(arr);
    };
    const add = root.querySelector('[data-map-add]');
    if (add) add.onclick = () => {
      const arr = clone(getArr());
      if (arr.length >= max) { toast('You can create up to ' + max + ' product mappings.', 'err'); return; }
      arr.push({ id: uid('map'), purchasedProductId: '', recommendedProductIds: [] }); setArr(arr);
    };
    root.querySelectorAll('[data-map-remove]').forEach((button) => {
      button.onclick = () => { const arr = clone(getArr()); arr.splice(+button.getAttribute('data-map-remove'), 1); setArr(arr); };
    });
    root.querySelectorAll('[data-map-purchased]').forEach((button) => {
      button.onclick = () => {
        const index = +button.getAttribute('data-map-purchased'); const arr = getArr(); const current = (arr[index] || {}).purchasedProductId || '';
        openPickerPop(button, 'product', current, (id) => {
          if (arr.some((m, i) => i !== index && m.purchasedProductId === id)) { toast('A mapping for this product already exists.', 'err'); return; }
          update(index, { purchasedProductId: id });
        }, true);
      };
    });
    root.querySelectorAll('[data-map-recommended]').forEach((button) => {
      button.onclick = () => {
        const index = +button.getAttribute('data-map-recommended'); const arr = getArr();
        openVariantPickerPop(button, (arr[index] || {}).recommendedProductIds || [], (refs) => update(index, { recommendedProductIds: refs }), 10);
      };
    });
    root.querySelectorAll('[data-map-rec-list]').forEach((list) => {
      const index = +list.getAttribute('data-map-rec-list');
      list.querySelectorAll('[data-op-remove]').forEach((button) => {
        button.onclick = () => update(index, { recommendedProductIds: ((getArr()[index] || {}).recommendedProductIds || []).filter((ref) => {
          const info = variantRefInfo(ref); return info && info.ref !== button.getAttribute('data-op-remove');
        }) });
      });
      wireIdRows(list, '[data-op-id]', 'data-op-id',
        () => ((getArr()[index] || {}).recommendedProductIds || []).map((ref) => (variantRefInfo(ref) || {}).ref).filter(Boolean),
        (ids) => update(index, { recommendedProductIds: ids }));
    });
    let dragMap = null;
    root.querySelectorAll('[data-map-id]').forEach((card) => {
      card.addEventListener('dragstart', (e) => {
        dragMap = card.getAttribute('data-map-id'); if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => { dragMap = null; });
      card.addEventListener('dragover', (e) => e.preventDefault());
      card.addEventListener('drop', (e) => {
        e.preventDefault(); const targetId = card.getAttribute('data-map-id'); if (!dragMap || dragMap === targetId) return;
        const arr = clone(getArr()); const from = arr.findIndex((m) => m.id === dragMap); const to = arr.findIndex((m) => m.id === targetId);
        if (from < 0 || to < 0) return; const moved = arr.splice(from, 1)[0]; arr.splice(to, 0, moved); setArr(arr);
      });
    });
  }
  function wireRemove(form) {
    const rs = form.querySelector('[data-remove-sec]'); if (rs) rs.onclick = () => removeSection(rs.getAttribute('data-remove-sec'));
    const rb = form.querySelector('[data-remove-blk]'); if (rb) rb.onclick = () => { const p = rb.getAttribute('data-remove-blk').split(':'); removeBlock(p[0], p[1]); };
    const hv = document.querySelector('[data-head-vis]'); if (hv) hv.onclick = () => { const p = hv.getAttribute('data-head-vis').split(':'); toggleHiddenBySel(p[0], p[1]); };
  }
  function clampNum(el) { const f = fieldByEl(el); let v = num(el.value); if (f) { if (f.min != null) v = Math.max(f.min, v); if (f.max != null) v = Math.min(f.max, v); } return v; }
  function rangeUnit(el) { const f = fieldByEl(el); return f ? f.unit : ''; }
  function fieldByEl(el) { const k = el.getAttribute('data-fkey'); const sc = currentSchema(); return (sc || []).find((x) => x.key === k); }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function coerce(v) { if (v === 'true') return true; if (v === 'false') return false; if (v !== '' && !isNaN(v)) return Number(v); return v; }

  function currentSettings() {
    const sel = ED.selection;
    if (sel.kind === 'announcement' || sel.kind === 'header' || sel.kind === 'footer') return ED.theme[sel.kind].settings;
    if (sel.kind === 'section') { const s = pageSections().find((x) => x.id === sel.sectionId); return s ? s.settings : null; }
    if (sel.kind === 'block') { const s = pageSections().find((x) => x.id === sel.sectionId) || globalBySel(sel.sectionId); const bl = s && (s.blocks || []).find((x) => x.id === sel.blockId); return bl ? bl.settings : null; }
    return null;
  }
  function currentSchema() {
    const sel = ED.selection;
    if (sel.kind === 'announcement' || sel.kind === 'header' || sel.kind === 'footer') { const def = SECTIONS[ED.theme[sel.kind].kind]; return def && def.schema; }
    if (sel.kind === 'section') { const s = pageSections().find((x) => x.id === sel.sectionId); return s && SECTIONS[s.kind] && SECTIONS[s.kind].schema; }
    if (sel.kind === 'block') { const s = pageSections().find((x) => x.id === sel.sectionId) || globalBySel(sel.sectionId); const bl = s && (s.blocks || []).find((x) => x.id === sel.blockId); const bd = bl && blockDef(SECTIONS[s.kind], bl.kind); return bd && bd.fields; }
    return null;
  }

  // ==========================================================================
  //  THEME SETTINGS PANEL (right side, 8 collapsible groups)
  // ==========================================================================
  function themeSettingsPanel() {
    const ck = isCheckout(); const groupsDef = sGroups(); const obj = settingsObj();
    const head = '<div class="os-right-head"><span class="os-rh-ico">' + I.gear + '</span>' +
      '<div style="min-width:0"><div class="os-rh-title">' + (ck ? 'Checkout settings' : 'Theme settings') + '</div><div class="os-rh-sub">' + (ck ? 'Checkout / Thank you global styles' : 'Global tokens — inherited everywhere') + '</div></div>' +
      '<button class="os-expall" id="os-expall">Expand all</button></div>';
    const groups = groupsDef.map((g) => {
      const open = ED.settingsExpand[sExpKey(g.key)];
      const n = g.fields.filter((f) => f.key).length;
      const body = open ? '<div class="os-set-body">' + g.fields.map((f) => fieldHtml(f, obj[g.key])).join('') + '</div>' : '';
      return '<div class="os-set-grp' + (open ? ' open' : '') + '" id="os-set-' + g.key + '">' +
        '<div class="os-set-head" data-setgrp="' + g.key + '"><span class="os-caret' + (open ? ' open' : '') + '">' + I.chevR + '</span>' +
        '<div class="os-set-h-txt"><div class="os-set-name">' + esc(g.name) + '</div><div class="os-set-desc">' + esc(g.desc) + '</div></div>' +
        '<span class="os-set-n">' + n + ' fields</span></div>' + body + '</div>';
    }).join('');
    return head + '<div class="os-right-scroll" id="os-form">' + groups + '</div>';
  }
  function wireSettings() {
    const form = document.querySelector('#os-form'); if (!form) return;
    const groupsDef = sGroups(); const obj = settingsObj();
    const exp = document.querySelector('#os-expall'); if (exp) exp.onclick = () => { const anyClosed = groupsDef.some((g) => !ED.settingsExpand[sExpKey(g.key)]); groupsDef.forEach((g) => ED.settingsExpand[sExpKey(g.key)] = anyClosed); refreshRight(); };
    form.querySelectorAll('[data-setgrp]').forEach((hd) => hd.onclick = () => { const k = hd.getAttribute('data-setgrp'); ED.settingsExpand[sExpKey(k)] = !ED.settingsExpand[sExpKey(k)]; refreshRight(); });
    groupsDef.forEach((g) => {
      if (!ED.settingsExpand[sExpKey(g.key)]) return;
      const grpEl = form.querySelector('#os-set-' + g.key); if (!grpEl) return;
      bindFields(grpEl, obj[g.key], g.fields, () => { markDirty(); refreshCanvas(); });
    });
  }
  // generic field binder used by theme settings groups (reuses control wiring without the section-panel scope)
  function bindFields(scopeEl, target, schema, after) {
    const change = (k, v, rerenderPanel) => { target[k] = v; after(); if (rerenderPanel) refreshRight(); };
    scopeEl.querySelectorAll('[data-control]').forEach((el) => {
      const k = el.getAttribute('data-fkey'); const ctl = el.getAttribute('data-control'); const f = schema.find((x) => x.key === k) || {};
      if (ctl === 'text' || ctl === 'url') el.oninput = () => change(k, el.value, false);
      else if (ctl === 'textarea' || ctl === 'custom_css' || ctl === 'richtext') el.oninput = () => change(k, el.value, false);
      else if (ctl === 'number') el.oninput = () => change(k, clamp(el.value, f.min == null ? -1e9 : f.min, f.max == null ? 1e9 : f.max, 0), false);
      else if (ctl === 'select') el.onchange = () => change(k, el.value, true);
      else if (ctl === 'range') el.oninput = () => { const fv = el.parentElement.querySelector('.os-fval'); if (fv) fv.textContent = el.value + (f.unit || ''); change(k, num(el.value), false); };
      else if (ctl === 'toggle') el.onclick = () => { const nv = !el.classList.contains('on'); el.classList.toggle('on', nv); change(k, nv, true); };
      else if (ctl === 'segmented') el.querySelectorAll('button').forEach((bn) => bn.onclick = () => { el.querySelectorAll('button').forEach((x) => x.classList.remove('on')); bn.classList.add('on'); change(k, coerce(bn.getAttribute('data-v')), true); });
      else if (ctl === 'color') {
        const cp = el.querySelector('input[type=color]'); const hx = el.querySelector('.os-hex'); const sw = el.querySelector('.os-sw'); const tb = el.querySelector('[data-tsp]');
        cp.oninput = () => { hx.value = cp.value; sw.style.background = cp.value; sw.classList.remove('tsp'); if (tb) tb.classList.remove('on'); change(k, cp.value, false); };
        hx.onchange = () => { const v = hx.value.trim(); sw.style.background = v === 'transparent' ? '' : v; sw.classList.toggle('tsp', v === 'transparent'); change(k, v, false); };
        if (tb) tb.onclick = () => { const on = !tb.classList.contains('on'); tb.classList.toggle('on', on); sw.classList.toggle('tsp', on); if (on) { sw.style.background = ''; hx.value = 'transparent'; change(k, 'transparent', false); } else { sw.style.background = '#ffffff'; hx.value = '#FFFFFF'; change(k, '#FFFFFF', false); } };
      } else if (ctl === 'image') {
        el.querySelectorAll('[data-img-pick]').forEach((b) => b.onclick = () => change(k, PICK_IMG, true));
        const rm = el.querySelector('[data-img-remove]'); if (rm) rm.onclick = () => change(k, '', true);
      } else if (ctl === 'product' || ctl === 'collection' || ctl === 'menu' || ctl === 'blog' || ctl === 'page') {
        el.onclick = () => openPickerPop(el, ctl, target[k], (v) => change(k, v, true), el.getAttribute('data-single') === '1', el.getAttribute('data-pickfrom'));
      } else if (ctl === 'collections') {
        const pick = el.querySelector('[data-cols-pick]'); if (pick) pick.onclick = () => openPickerPop(pick, ctl, target[k], (v) => change(k, v, true));
        const list = el.querySelector('[data-cols-list]'); if (list) wireColsReorder(list, () => (Array.isArray(target[k]) ? target[k] : []), (arr) => change(k, arr, true));
      }
    });
  }

  // ==========================================================================
  //  ACTIONS
  // ==========================================================================
  function select(sel) { ED.selection = sel; if (sel.kind !== 'theme-settings') ED.leftMode = 'sections'; refreshTree(); refreshRight(); applyHighlight(); scrollToSelected(); }
  function markDirty() { refreshTop(); }

  function toggleHidden(rowEl) {
    if (rowEl.hasAttribute('data-sel-global')) { const k = rowEl.getAttribute('data-sel-global'); ED.theme[k].hidden = !ED.theme[k].hidden; }
    else if (rowEl.hasAttribute('data-sel-sec')) { const s = pageSections().find((x) => x.id === rowEl.getAttribute('data-sel-sec')); if (s) s.hidden = !s.hidden; }
    else if (rowEl.hasAttribute('data-sel-blk')) { const p = rowEl.getAttribute('data-sel-blk').split(':'); const s = pageSections().find((x) => x.id === p[0]) || globalBySel(p[0]); const bl = s && s.blocks.find((x) => x.id === p[1]); if (bl) bl.hidden = !bl.hidden; }
    markDirty(); refreshTree(); refreshCanvas();
  }
  function toggleHiddenBySel(scope, id) {
    if (scope === 'global') ED.theme[id].hidden = !ED.theme[id].hidden;
    else if (scope === 'section') { const s = pageSections().find((x) => x.id === id); if (s) s.hidden = !s.hidden; }
    else if (scope === 'block') { /* id is blockId; section is current selection */ const s = pageSections().find((x) => x.id === ED.selection.sectionId) || globalBySel(ED.selection.sectionId); const bl = s && s.blocks.find((x) => x.id === id); if (bl) bl.hidden = !bl.hidden; }
    markDirty(); refreshTree(); refreshRight(); refreshCanvas();
  }
  function confirmDelete(rowEl) {
    let what = 'section', go;
    if (rowEl.hasAttribute('data-sel-sec')) { const id = rowEl.getAttribute('data-sel-sec'); go = () => removeSection(id); }
    else if (rowEl.hasAttribute('data-sel-blk')) { what = 'block'; const p = rowEl.getAttribute('data-sel-blk').split(':'); go = () => removeBlock(p[0], p[1]); }
    else return;
    openConfirm({ title: 'Delete ' + what + '?', body: 'This ' + what + ' and its settings will be removed from the page. This can be undone with Discard before you save.', okText: 'Delete', danger: true, onOk: go });
  }
  function removeSection(id) {
    const arr = pageSections(); const i = arr.findIndex((x) => x.id === id); if (i < 0) return;
    arr.splice(i, 1); if (ED.selection.kind === 'section' && ED.selection.sectionId === id) ED.selection = { kind: 'header' };
    markDirty(); refreshTree(); refreshRight(); refreshCanvas(); toast('Section removed');
  }
  function removeBlock(secId, blkId) {
    const s = pageSections().find((x) => x.id === secId) || globalBySel(secId); if (!s) return;
    const i = s.blocks.findIndex((x) => x.id === blkId); if (i < 0) return;
    s.blocks.splice(i, 1);
    ED.selection = (s === globalBySel(secId)) ? { kind: secId } : { kind: 'section', sectionId: secId };
    markDirty(); refreshTree(); refreshRight(); refreshCanvas(); toast('Block removed');
  }
  function addBlock(secId, anchor) {
    const s = pageSections().find((x) => x.id === secId) || globalBySel(secId); if (!s) return;
    const def = SECTIONS[s.kind]; if (!def || !def.blocks) return;
    if (def.blocks.kinds) { openBlockKindMenu(anchor, s, def); return; }
    const max = def.blocks.max || 99; if (s.blocks.length >= max) { toast('Max ' + max + ' blocks', 'err'); return; }
    const nb = { id: uid('blk'), kind: def.blocks.kind || 'item', hidden: false, settings: blockDefaults(def.blocks) };
    s.blocks.push(nb); ED.selection = { kind: 'block', sectionId: secId, blockId: nb.id }; ED.sectionExpand[secId] = true;
    markDirty(); refreshTree(); refreshRight(); refreshCanvas();
  }
  function openBlockKindMenu(anchor, s, def) {
    closePops(); const layer = h('<div class="pop-layer"></div>'); const pop = h('<div class="menu-pop" style="min-width:200px"></div>');
    pop.innerHTML = Object.keys(def.blocks.kinds).map((bk) => '<div class="opt" data-bk="' + bk + '">' + esc(def.blocks.kinds[bk].name) + '</div>').join('');
    layer.appendChild(pop); document.body.appendChild(layer);
    // Keep the menu on-screen: the anchor (e.g. Footer's "Add block") often sits at the very
    // bottom of a long tree, so flip the menu above the anchor when it wouldn't fit below.
    const r = anchor.getBoundingClientRect(); const w = 200;
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 12)) + 'px';
    pop.style.maxHeight = Math.max(160, window.innerHeight - 16) + 'px';
    const ph = pop.offsetHeight || 200;
    let top;
    if (r.bottom + 6 + ph <= window.innerHeight - 8) top = r.bottom + 6;      // below the anchor
    else if (r.top - 6 - ph >= 8) top = r.top - 6 - ph;                       // flip above
    else top = Math.max(8, window.innerHeight - ph - 8);                      // clamp to bottom
    pop.style.top = top + 'px';
    pop.querySelectorAll('[data-bk]').forEach((o) => o.onclick = () => {
      const bk = o.getAttribute('data-bk'); const bd = def.blocks.kinds[bk];
      const max = def.blocks.max || 99; if (s.blocks.length >= max) { toast('Max ' + max + ' blocks', 'err'); closePops(); return; }
      const nb = { id: uid('blk'), kind: bk, hidden: false, settings: blockDefaults(bd) }; s.blocks.push(nb);
      ED.selection = { kind: 'block', sectionId: s.id, blockId: nb.id }; closePops(); markDirty(); refreshTree(); refreshRight(); refreshCanvas();
    });
    closeOnOutside(pop, anchor);
  }
  function addSectionKind(kind) {
    const def = SECTIONS[kind]; if (!def) { toast('“' + kind + '” isn’t available yet', 'err'); return; }
    const inst = matSection({ kind: kind });
    pageSections().push(inst); ED.selection = { kind: 'section', sectionId: inst.id }; ED.expand.template = true;
    markDirty(); refreshTree(); refreshRight(); refreshCanvas();
    const sc = document.getElementById('os-cscroll'); if (sc) sc.scrollTop = sc.scrollHeight;
    toast('Added ' + def.name);
  }

  // Add a Checkout component. Full modal (same UX as the Online Store "Add section" modal):
  // search + MECE category list + live preview + Add button. Components are grouped by
  // function/use-case via D.CHECKOUT_CATALOG. Singletons already on the page show as "Added".
  // The chosen component lands in its first allowed zone and can be dragged elsewhere.
  function ckComponentStatus(kind) {
    if (!SECTIONS[kind]) return 'soon';
    if (isSingletonKind(kind) && pageSections().some((s) => s.kind === kind)) return 'added';
    return 'ok';
  }
  function openAddCheckoutComponent(anchor) {
    closePops();
    // z-index 250 lifts the layer above the editor chrome (.os-builder is z-index 140); the
    // modal is centered over the canvas, so without this it renders behind the preview column.
    const layer = h('<div class="pop-layer" style="z-index:250"></div>'); const pop = h('<div class="os-addpop"></div>');
    pop.innerHTML =
      '<div class="os-addpop-search"><input class="os-input" id="os-ckaddsearch" placeholder="Search sections"></div>' +
      '<div class="os-addpop-body"><div class="os-addpop-list" id="os-ckaddlist"></div>' +
      '<div class="os-addpop-prev" id="os-ckaddprev"></div></div>' +
      '<div class="os-addpop-foot"><span id="os-ckaddcount"></span><span>Esc to close</span></div>';
    layer.appendChild(pop); document.body.appendChild(layer);
    // Anchor next to the "Add section" button (same UX as the Online Store modal). positionPop
    // clamps the top so the whole modal stays on-screen even when the button sits low.
    positionPop(pop, anchor, 640, 470);
    pop.style.zIndex = '251'; // above the editor chrome (.os-builder z-index 140)
    const cat = ckCatalog();
    const showPrev = (rw) => {
      pop.querySelectorAll('.os-addrow').forEach((x) => x.classList.remove('hover')); rw.classList.add('hover');
      const kind = rw.getAttribute('data-add-kind'); const st = rw.getAttribute('data-status'); const name = rw.getAttribute('data-name');
      let cta;
      if (st === 'added') cta = '<div class="os-soon-note">Only one allowed — already added.</div>';
      else if (st === 'soon') cta = '<div class="os-soon-note">Coming in a later release.</div>';
      else cta = '<button class="btn btn-primary" data-add-go="' + esc(kind) + '">Add ' + esc(name) + '</button>';
      pop.querySelector('#os-ckaddprev').innerHTML = '<div class="os-addprev-art">' + ICON(SECTIONS[kind] ? SECTIONS[kind].icon : 'image') + '</div>' +
        '<div class="os-addprev-name">' + esc(name) + '</div>' +
        '<div class="os-addprev-desc">' + esc(rw.getAttribute('data-desc')) + '</div>' + cta;
      const go = pop.querySelector('[data-add-go]'); if (go) go.onclick = () => { addCheckoutComponent(go.getAttribute('data-add-go')); closePops(); };
    };
    const renderAdd = (q) => {
      q = (q || '').toLowerCase();
      let html = '';
      cat.forEach((g) => {
        const ents = g.entries.filter((e) => !q || (e.name + ' ' + e.desc).toLowerCase().indexOf(q) >= 0);
        if (!ents.length) return;
        html += '<div class="os-addgrp">' + esc(g.label) + '</div>';
        ents.forEach((e) => {
          const st = ckComponentStatus(e.kind); const dis = st !== 'ok';
          const badge = st === 'added' ? ' <span class="os-soon">Added</span>' : (st === 'soon' ? ' <span class="os-soon">Soon</span>' : '');
          html += '<div class="os-addrow' + (dis ? ' soon' : '') + '" data-add-kind="' + esc(e.kind) + '" data-name="' + esc(e.name) + '" data-desc="' + esc(e.desc) + '" data-status="' + st + '">' +
            '<div class="os-add-ico">' + ICON(SECTIONS[e.kind] ? SECTIONS[e.kind].icon : 'layers') + '</div>' +
            '<div style="min-width:0"><div class="os-add-name">' + esc(e.name) + badge + '</div>' +
            '<div class="os-add-desc">' + esc(e.desc) + '</div></div></div>';
        });
      });
      const list = pop.querySelector('#os-ckaddlist'); list.innerHTML = html || '<div class="os-info" style="padding:12px">No sections match.</div>';
      let total = 0, avail = 0; cat.forEach((g) => g.entries.forEach((e) => { total++; if (SECTIONS[e.kind]) avail++; }));
      pop.querySelector('#os-ckaddcount').textContent = avail + ' of ' + total + ' section types available · more coming soon';
      list.querySelectorAll('.os-addrow').forEach((rw) => {
        rw.onmouseenter = () => showPrev(rw);
        rw.onclick = () => { if (rw.classList.contains('soon')) return; addCheckoutComponent(rw.getAttribute('data-add-kind')); closePops(); };
      });
      const first = list.querySelector('.os-addrow'); if (first) showPrev(first);
    };
    renderAdd('');
    const si = pop.querySelector('#os-ckaddsearch'); si.oninput = () => renderAdd(si.value); setTimeout(() => si.focus(), 20);
    closeOnOutside(pop, anchor);
  }
  function addCheckoutComponent(kind, zoneId) {
    const def = SECTIONS[kind]; if (!def) { toast('“' + kind + '” isn’t available yet', 'err'); return; }
    if (isSingletonKind(kind) && pageSections().some((s) => s.kind === kind)) { toast('Only one ' + def.name + ' allowed', 'err'); return; }
    // Default zone (page-aware): an explicit request wins, else the CURRENT page's catalog
    // entry `defaultZone` (Thank-you defines its own per PRD §9.5), else the section's shared
    // `def.defaultZone` (Checkout's source of truth), else the first zone that allows it. The
    // merchant can always drag it elsewhere. Keeping the page-catalog default first means
    // Thank-you can override without disturbing Checkout, which has no catalog defaultZone.
    const allowed = allowedZonesForKind(kind);
    let catDefault = null;
    ckCatalog().forEach((g) => (g.entries || []).forEach((e) => { if (e.kind === kind && e.defaultZone) catDefault = e.defaultZone; }));
    const zid = (zoneId && allowed.indexOf(zoneId) >= 0) ? zoneId
      : (catDefault && allowed.indexOf(catDefault) >= 0) ? catDefault
      : (def.defaultZone && allowed.indexOf(def.defaultZone) >= 0) ? def.defaultZone
      : allowed[0];
    const zone = ckZone(zid); if (!zone) { toast('That component can’t be placed', 'err'); return; }
    const seed = { kind, zone: zid };
    // Static content is shared across transaction pages, but its initial copy must match
    // the active buyer journey. Offer pages should never inherit Thank-you shipping copy.
    if (isOfferPage() && kind === 'checkout-static-content') {
      seed.settings = ED.checkoutPage === 'downsell'
        ? { heading: 'One last offer', content: 'Your order is confirmed. Add this final special offer before continuing to your order confirmation.' }
        : { heading: 'Your order is confirmed', content: 'Add this exclusive offer without re-entering your payment or delivery details.' };
    }
    const inst = matSection(seed);
    const arr = pageSections();
    arr.splice(ckInsertIndex(arr, zone, kind), 0, inst);
    ED.selection = { kind: 'section', sectionId: inst.id };
    markDirty(); refreshTree(); refreshRight(); refreshCanvas();
    toast('Added ' + def.name + ' — drag it to place');
  }
  // Resolve where a component lands when added/moved into a zone, keeping same-zone
  // siblings stacked in order. 'announce' goes to the very top, Footer to the very end.
  function ckInsertIndex(arr, zone, kind) {
    if (zone.id === 'announce') return 0;
    if (kind === 'checkout-footer') return arr.length;
    // Thank-you bottom band: 'policytop' items sit just above Policy links, other
    // bottom-band items just below it (footer already handled above).
    if (zone.col === 'bottom') {
      const pol = arr.findIndex((x) => x.kind === 'checkout-policy-links');
      if (zone.id === 'policytop') return pol < 0 ? arr.length : pol; // before Policy links, after existing siblings
      let at = pol < 0 ? arr.length - 1 : pol;
      let insAt = at + 1;
      while (insAt < arr.length && isCheckoutAddable(arr[insAt].kind) && arr[insAt].zone === zone.id && arr[insAt].kind !== 'checkout-footer') insAt++;
      return insAt;
    }
    let at = arr.findIndex((x) => x.kind === zone.after);
    if (at < 0) { const cta = arr.findIndex((x) => x.kind === 'checkout-cta'); at = cta < 0 ? arr.length - 1 : cta - 1; }
    let insAt = at + 1;
    while (insAt < arr.length && isCheckoutAddable(arr[insAt].kind) && arr[insAt].zone === zone.id && arr[insAt].kind !== 'checkout-footer') insAt++;
    return insAt;
  }
  // Move an addable component into a (possibly different) allowed zone via drag.
  function moveCommerceToZone(dragId, zoneId, targetCommerceId, after) {
    const arr = pageSections();
    const di = arr.findIndex((x) => x.id === dragId); if (di < 0) return;
    const zone = ckZone(zoneId); if (!zone) return;
    const sec = arr.splice(di, 1)[0];
    sec.zone = zoneId;
    let insAt;
    if (targetCommerceId && targetCommerceId !== dragId) {
      const ti = arr.findIndex((x) => x.id === targetCommerceId);
      insAt = ti < 0 ? ckInsertIndex(arr, zone, sec.kind) : (after ? ti + 1 : ti);
    } else {
      insAt = ckInsertIndex(arr, zone, sec.kind);
    }
    arr.splice(insAt, 0, sec);
    markDirty(); refreshTree(); refreshCanvas();
  }

  // -------------------------------------------------------------- drag reorder
  let dragInfo = null;
  function wireDrag(tree) {
    tree.querySelectorAll('[data-sel-sec],[data-sel-blk]').forEach((row) => {
      row.addEventListener('dragstart', (e) => {
        if (row.hasAttribute('data-sel-sec')) dragInfo = { type: 'sec', id: row.getAttribute('data-sel-sec') };
        else { const p = row.getAttribute('data-sel-blk').split(':'); dragInfo = { type: 'blk', secId: p[0], id: p[1] }; }
        e.dataTransfer.effectAllowed = 'move'; row.classList.add('dragging');
      });
      row.addEventListener('dragend', () => { row.classList.remove('dragging'); clearDrop(); dragInfo = null; });
      row.addEventListener('dragover', (e) => {
        if (!dragInfo) return;
        const isSec = row.hasAttribute('data-sel-sec');
        if (dragInfo.type === 'blk') {
          if (!row.hasAttribute('data-sel-blk') || row.getAttribute('data-sel-blk').split(':')[0] !== dragInfo.secId) return;
        } else if (isCheckout()) {
          // Checkout: a commerce row may drop onto a zone anchor (Contact / Shipping method /
          // Payment / Order Summary), another commerce row, or an Order-Summary block (e.g.
          // Total) — but only where its kind is allowed. The drop then re-homes it.
          const d = pageSections().find((x) => x.id === dragInfo.id);
          if (!d || !isCheckoutAddable(d.kind)) return;
          const dz = ckDropZoneForRow(row);
          if (!dz || allowedZonesForKind(d.kind).indexOf(dz.zoneId) < 0) return;
        } else if (!isSec) return;
        e.preventDefault(); const r = row.getBoundingClientRect(); const after = e.clientY > r.top + r.height / 2;
        clearDrop(); row.classList.add(after ? 'drop-after' : 'drop-before');
      });
      row.addEventListener('drop', (e) => {
        if (!dragInfo) return; e.preventDefault();
        const after = row.classList.contains('drop-after');
        if (dragInfo.type === 'sec' && isCheckout()) {
          const d = pageSections().find((x) => x.id === dragInfo.id);
          if (d && isCheckoutAddable(d.kind)) {
            const dz = ckDropZoneForRow(row);
            if (dz && allowedZonesForKind(d.kind).indexOf(dz.zoneId) >= 0) {
              moveCommerceToZone(dragInfo.id, dz.zoneId, dz.refCommerceId, after);
            }
          }
          clearDrop(); return;
        }
        if (dragInfo.type === 'sec' && row.hasAttribute('data-sel-sec')) reorderSection(dragInfo.id, row.getAttribute('data-sel-sec'), after);
        else if (dragInfo.type === 'blk' && row.hasAttribute('data-sel-blk')) { const tp = row.getAttribute('data-sel-blk').split(':'); if (tp[0] === dragInfo.secId) reorderBlock(dragInfo.secId, dragInfo.id, tp[1], after); }
        clearDrop();
      });
    });
  }
  function clearDrop() { document.querySelectorAll('.drop-before,.drop-after').forEach((x) => x.classList.remove('drop-before', 'drop-after')); }
  function reorderArr(arr, fromId, toId, after) {
    const from = arr.findIndex((x) => x.id === fromId); const to = arr.findIndex((x) => x.id === toId); if (from < 0 || to < 0 || fromId === toId) return;
    const [m] = arr.splice(from, 1); let ins = arr.findIndex((x) => x.id === toId); ins = ins + (after ? 1 : 0); arr.splice(ins, 0, m);
  }
  function reorderSection(fromId, toId, after) { reorderArr(pageSections(), fromId, toId, after); markDirty(); refreshTree(); refreshCanvas(); }
  function reorderBlock(secId, fromId, toId, after) { const s = pageSections().find((x) => x.id === secId) || globalBySel(secId); if (!s) return; reorderArr(s.blocks, fromId, toId, after); markDirty(); refreshTree(); refreshCanvas(); }

  // -------------------------------------------------------------- add-section popover
  function openAddSection(anchor) {
    closePops();
    const layer = h('<div class="pop-layer"></div>'); const pop = h('<div class="os-addpop"></div>');
    pop.innerHTML =
      '<div class="os-addpop-search"><input class="os-input" id="os-addsearch" placeholder="Search sections"></div>' +
      '<div class="os-addpop-body"><div class="os-addpop-list" id="os-addlist"></div>' +
      '<div class="os-addpop-prev" id="os-addprev"></div></div>' +
      '<div class="os-addpop-foot"><span id="os-addcount"></span><span>Esc to close</span></div>';
    layer.appendChild(pop); document.body.appendChild(layer);
    positionPop(pop, anchor, 640, 470);
    const renderAdd = (q) => {
      q = (q || '').toLowerCase();
      let total = 0, avail = 0, html = '';
      D.CATALOG.forEach((g) => {
        const ents = g.entries.filter((e) => !q || (e.name + ' ' + e.desc).toLowerCase().indexOf(q) >= 0);
        if (!ents.length) return;
        html += '<div class="os-addgrp">' + esc(g.label) + '</div>';
        ents.forEach((e) => {
          total++; const ok = !!SECTIONS[e.kind]; if (ok) avail++;
          html += '<div class="os-addrow' + (ok ? '' : ' soon') + '" data-add-kind="' + esc(e.kind) + '" data-name="' + esc(e.name) + '" data-desc="' + esc(e.desc) + '">' +
            '<div class="os-add-ico">' + ICON(ok ? SECTIONS[e.kind].icon : 'layers') + '</div>' +
            '<div style="min-width:0"><div class="os-add-name">' + esc(e.name) + (ok ? '' : ' <span class="os-soon">Soon</span>') + '</div>' +
            '<div class="os-add-desc">' + esc(e.desc) + '</div></div></div>';
        });
      });
      const list = pop.querySelector('#os-addlist'); list.innerHTML = html || '<div class="os-info" style="padding:12px">No sections match.</div>';
      pop.querySelector('#os-addcount').textContent = countAvailable() + ' of ' + catalogTotal() + ' section types available';
      list.querySelectorAll('.os-addrow').forEach((rw) => {
        rw.onmouseenter = () => showAddPreview(rw);
        rw.onclick = () => { if (rw.classList.contains('soon')) return; addSectionKind(rw.getAttribute('data-add-kind')); closePops(); };
      });
      const first = list.querySelector('.os-addrow'); if (first) showAddPreview(first);
    };
    const showAddPreview = (rw) => {
      pop.querySelectorAll('.os-addrow').forEach((x) => x.classList.remove('hover')); rw.classList.add('hover');
      const ok = !rw.classList.contains('soon'); const kind = rw.getAttribute('data-add-kind');
      pop.querySelector('#os-addprev').innerHTML = '<div class="os-addprev-art">' + ICON(ok && SECTIONS[kind] ? SECTIONS[kind].icon : 'image') + '</div>' +
        '<div class="os-addprev-name">' + esc(rw.getAttribute('data-name')) + '</div>' +
        '<div class="os-addprev-desc">' + esc(rw.getAttribute('data-desc')) + '</div>' +
        (ok ? '<button class="btn btn-primary" data-add-go="' + esc(kind) + '">Add ' + esc(rw.getAttribute('data-name')) + '</button>' : '<div class="os-soon-note">Coming in a later release.</div>');
      const go = pop.querySelector('[data-add-go]'); if (go) go.onclick = () => { addSectionKind(go.getAttribute('data-add-go')); closePops(); };
    };
    renderAdd('');
    const si = pop.querySelector('#os-addsearch'); si.oninput = () => renderAdd(si.value); setTimeout(() => si.focus(), 20);
    closeOnOutside(pop, anchor);
  }
  function catalogTotal() { let n = 0; D.CATALOG.forEach((g) => n += g.entries.length); return n; }

  // -------------------------------------------------------------- inline resource picker (popover under the control)
  function openPickerPop(anchor, kind, current, onPick, single, pickFrom, maxItems) {
    closePops();
    const S = D.SAMPLE; const multi = (kind === 'product' || kind === 'collections') && !single;
    const items = kind === 'product' ? (pickFrom === 'services' ? (S.services || []) : S.products) : (kind === 'collection' || kind === 'collections') ? S.collections : kind === 'menu' ? S.menus : kind === 'blog' ? S.blogs : S.pages;
    const nameOf = (it) => it.title || it.name;
    const sel = new Set(multi ? (Array.isArray(current) ? current : []) : (current ? [current] : []));
    const layer = h('<div class="pop-layer" style="z-index:250"></div>');
    const pop = h('<div class="os-pkpop"></div>');
    pop.innerHTML =
      '<div class="os-pkpop-search"><span class="os-pkpop-ico">' + I.search + '</span><input type="text" id="pkp-q" placeholder="Search" autocomplete="off"></div>' +
      '<div class="os-pkpop-list" id="pkp-list"></div>' +
      (multi ? '<div class="os-pkpop-foot"><button type="button" class="btn btn-primary" data-ok>Done</button></div>' : '');
    layer.appendChild(pop); document.body.appendChild(layer);
    const list = pop.querySelector('#pkp-list');
    let query = '';
    const draw = () => {
      const q = query.trim().toLowerCase();
      const shown = q ? items.filter((it) => String(nameOf(it) || '').toLowerCase().indexOf(q) >= 0) : items;
      list.innerHTML = shown.length ? shown.map((it) => '<label class="os-pk-row' + (sel.has(it.id) ? ' on' : '') + '"><input type="' + (multi ? 'checkbox' : 'radio') + '" name="pkp" ' + (sel.has(it.id) ? 'checked' : '') + ' data-id="' + esc(it.id) + '">' +
        (it.image ? '<span class="os-pk-thumb" style="background-image:url(' + esc(it.image) + ')"></span>' : '<span class="os-pk-thumb gen">' + ICON('layers') + '</span>') +
        '<span class="os-pk-name">' + esc(nameOf(it)) + (it.price ? ' · ' + money(it.price) : it.count != null ? ' · ' + it.count + ' items' : '') + '</span></label>').join('') : '<div class="os-pk-empty">No matches for “' + esc(query) + '”</div>';
      list.querySelectorAll('input').forEach((inp) => inp.onchange = () => {
        const id = inp.getAttribute('data-id');
        if (multi) {
          if (inp.checked && maxItems && sel.size >= maxItems) {
            inp.checked = false; toast('You can select up to ' + maxItems + ' products.', 'err'); return;
          }
          inp.checked ? sel.add(id) : sel.delete(id); const r = inp.closest('.os-pk-row'); if (r) r.classList.toggle('on', inp.checked);
        }
        else { closePops(); onPick(id); }
      });
    };
    draw();
    const qEl = pop.querySelector('#pkp-q'); qEl.oninput = () => { query = qEl.value; draw(); };
    if (multi) pop.querySelector('[data-ok]').onclick = () => { closePops(); onPick(Array.from(sel)); };
    const r = anchor.getBoundingClientRect();
    const w = Math.max(Math.round(r.width), 240);
    pop.style.width = w + 'px';
    pop.style.left = Math.max(8, Math.min(Math.round(r.left), window.innerWidth - w - 12)) + 'px';
    const ph = pop.offsetHeight || 320;
    if (r.bottom + 6 + ph > window.innerHeight && r.top - 6 - ph > 8) pop.style.top = Math.round(r.top - 6 - ph) + 'px';
    else pop.style.top = Math.round(r.bottom + 6) + 'px';
    setTimeout(() => qEl.focus(), 0);
    closeOnOutside(pop, anchor);
  }
  function openVariantPickerPop(anchor, current, onPick, maxItems) {
    closePops();
    const products = (D.SAMPLE.products || []).map((product) => ({
      product,
      variants: (Array.isArray(product.variants) && product.variants.length
        ? product.variants : [{ id: 'default', title: 'Default variant', price: product.price, available: product.available }])
        .map((variant) => ({
          ref: product.id + VARIANT_REF_SEP + variant.id,
          productId: product.id,
          title: variant.title,
          price: variant.price,
          unavailable: product.status === 'draft' || product.available === false || variant.available === false,
        })),
    }));
    const sel = new Set((Array.isArray(current) ? current : []).map((ref) => {
      const info = variantRefInfo(ref); return info && info.ref;
    }).filter(Boolean));
    const expanded = new Set(Array.from(sel).map((ref) => {
      const info = variantRefInfo(ref); return info && info.product.id;
    }).filter(Boolean));
    const layer = h('<div class="pop-layer" style="z-index:250"></div>');
    const pop = h('<div class="os-pkpop os-vpkpop"></div>');
    pop.innerHTML =
      '<div class="os-pkpop-search"><span class="os-pkpop-ico">' + I.search + '</span><input type="text" id="vpk-q" placeholder="Search products or variants" autocomplete="off"></div>' +
      '<div class="os-pkpop-list" id="vpk-list"></div>' +
      '<div class="os-pkpop-foot"><button type="button" class="btn btn-primary" data-ok>Done</button></div>';
    layer.appendChild(pop); document.body.appendChild(layer);
    const list = pop.querySelector('#vpk-list');
    let query = '';
    const selectedProductIds = () => new Set(Array.from(sel).map((ref) => {
      const info = variantRefInfo(ref); return info && info.product.id;
    }).filter(Boolean));
    const draw = () => {
      const q = query.trim().toLowerCase();
      const shown = q ? products.filter(({ product, variants }) =>
        (product.title + ' ' + variants.map((variant) => variant.title).join(' ')).toLowerCase().indexOf(q) >= 0) : products;
      list.innerHTML = shown.length ? shown.map(({ product, variants }) => {
        const availableRefs = variants.filter((variant) => !variant.unavailable).map((variant) => variant.ref);
        const selectedCount = variants.filter((variant) => sel.has(variant.ref)).length;
        const selectedAvailableCount = availableRefs.filter((ref) => sel.has(ref)).length;
        const selected = selectedCount > 0;
        const open = selected && expanded.has(product.id);
        const disabled = !availableRefs.length;
        const status = product.status === 'draft' ? '<span class="os-vpk-status">Draft</span>' : '';
        const variantRows = open ? '<div class="os-vpk-variants">' + variants.map((variant) =>
          '<label class="os-vpk-variant' + (sel.has(variant.ref) ? ' on' : '') + (variant.unavailable ? ' disabled' : '') + '">' +
            '<input type="checkbox" data-variant-ref="' + esc(variant.ref) + '" data-product-id="' + esc(product.id) + '"' +
              (sel.has(variant.ref) ? ' checked' : '') + (variant.unavailable ? ' disabled' : '') + '>' +
            '<span class="os-vpk-vthumb" style="background-image:url(' + esc(product.image || '') + ')"></span>' +
            '<span class="os-vpk-vname">' + esc(variant.title) + '</span><span class="os-vpk-vprice">' + money(variant.price || 0) + '</span>' +
          '</label>').join('') + '</div>' : '';
        return '<div class="os-vpk-product' + (selected ? ' on' : '') + (disabled ? ' disabled' : '') + '">' +
          '<div class="os-vpk-product-row"><label class="os-vpk-product-main">' +
            '<input type="checkbox" data-product-toggle="' + esc(product.id) + '"' + (availableRefs.length && selectedAvailableCount === availableRefs.length ? ' checked' : '') + (disabled ? ' disabled' : '') + '>' +
            '<span class="os-pk-thumb" style="background-image:url(' + esc(product.image || '') + ')"></span>' +
            '<span class="os-vpk-product-copy"><strong>' + esc(product.title) + '</strong><small>' + variants.length + ' variant' + (variants.length === 1 ? '' : 's') + '</small></span>' +
          '</label>' + status + '<strong class="os-vpk-product-price">' + money(product.price || 0) + '</strong>' +
          (selected ? '<button type="button" class="os-vpk-expand' + (open ? ' open' : '') + '" data-product-expand="' + esc(product.id) + '" aria-label="' + (open ? 'Collapse' : 'Expand') + ' variants">' + I.chevR + '</button>' : '') +
          '</div>' + variantRows + '</div>';
      }).join('') : '<div class="os-pk-empty">No matches for “' + esc(query) + '”</div>';
      list.querySelectorAll('[data-product-toggle]').forEach((input) => {
        const productId = input.getAttribute('data-product-toggle');
        const group = products.find((item) => item.product.id === productId);
        const refs = group ? group.variants.filter((variant) => !variant.unavailable).map((variant) => variant.ref) : [];
        const count = refs.filter((ref) => sel.has(ref)).length;
        input.indeterminate = count > 0 && count < refs.length;
        input.onchange = () => {
          if (input.checked) {
            if (!selectedProductIds().has(productId) && maxItems && selectedProductIds().size >= maxItems) {
              input.checked = false; toast('You can select up to ' + maxItems + ' products.', 'err'); return;
            }
            refs.forEach((ref) => sel.add(ref)); expanded.add(productId);
          } else {
            refs.forEach((ref) => sel.delete(ref)); expanded.delete(productId);
          }
          draw();
        };
      });
      list.querySelectorAll('[data-variant-ref]').forEach((input) => {
        input.onchange = () => {
          const ref = input.getAttribute('data-variant-ref');
          const productId = input.getAttribute('data-product-id');
          if (input.checked && !selectedProductIds().has(productId) && maxItems && selectedProductIds().size >= maxItems) {
            input.checked = false; toast('You can select up to ' + maxItems + ' products.', 'err'); return;
          }
          input.checked ? sel.add(ref) : sel.delete(ref);
          if (selectedProductIds().has(productId)) expanded.add(productId); else expanded.delete(productId);
          draw();
        };
      });
      list.querySelectorAll('[data-product-expand]').forEach((button) => {
        button.onclick = () => {
          const productId = button.getAttribute('data-product-expand');
          expanded.has(productId) ? expanded.delete(productId) : expanded.add(productId);
          draw();
        };
      });
    };
    draw();
    const qEl = pop.querySelector('#vpk-q');
    qEl.oninput = () => { query = qEl.value; draw(); };
    pop.querySelector('[data-ok]').onclick = () => { closePops(); onPick(Array.from(sel)); };
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(Math.max(Math.round(rect.width), 520), window.innerWidth - 24);
    pop.style.width = width + 'px';
    pop.style.left = Math.max(8, Math.min(Math.round(rect.left), window.innerWidth - width - 12)) + 'px';
    const height = pop.offsetHeight || 380;
    pop.style.top = (rect.bottom + 6 + height > window.innerHeight && rect.top - 6 - height > 8)
      ? Math.round(rect.top - 6 - height) + 'px' : Math.round(rect.bottom + 6) + 'px';
    setTimeout(() => qEl.focus(), 0);
    closeOnOutside(pop, anchor);
  }

  // -------------------------------------------------------------- template resource preview
  // Product / Collection templates can preview any resource, and merchants can narrow the
  // picker to resources currently assigned to the active template (Shopify parity).
  function openResourcePicker(anchor) {
    if (!isResourcePage()) return;
    closePops();
    const pt = ED.currentPage; const noun = pt === 'product' ? 'product' : 'collection';
    const items = resourceList(pt); const assigned = new Set(assignedResourceIds(pt));
    const selected = previewResource(pt);
    const layer = h('<div class="pop-layer" style="z-index:250"></div>');
    const pop = h('<div class="os-pkpop os-rspop"></div>');
    pop.innerHTML =
      '<div class="os-rs-tabs"><button type="button" data-rs-tab="all">All</button><button type="button" data-rs-tab="assigned">Assigned</button></div>' +
      '<div class="os-pkpop-search os-rs-search"><span class="os-pkpop-ico">' + I.search + '</span><input type="text" id="rs-q" placeholder="Search" autocomplete="off"></div>' +
      '<div class="os-rs-list" id="rs-list"></div>' +
      '<button type="button" class="os-rs-create" data-rs-create>' + I.plus + '<span>Create ' + noun + '</span></button>';
    layer.appendChild(pop); document.body.appendChild(layer);

    let tab = 'all', query = '', limit = 5;
    const list = pop.querySelector('#rs-list');
    const draw = () => {
      pop.querySelectorAll('[data-rs-tab]').forEach((b) => b.classList.toggle('on', b.getAttribute('data-rs-tab') === tab));
      const q = query.trim().toLowerCase();
      const pool = tab === 'assigned' ? items.filter((r) => assigned.has(r.id)) : items;
      const matched = q ? pool.filter((r) => String(r.title || '').toLowerCase().indexOf(q) >= 0) : pool;
      const shown = matched.slice(0, limit);
      let html = shown.map((r) => {
        const on = selected && selected.id === r.id;
        const thumb = r.image
          ? '<span class="os-rs-thumb" style="background-image:url(' + esc(r.image) + ')"></span>'
          : '<span class="os-rs-thumb empty">' + I.image + '</span>';
        const status = pt === 'product' && r.status === 'draft'
          ? '<span class="os-resource-status">Draft</span>' : '';
        return '<button type="button" class="os-rs-row' + (on ? ' on' : '') + '" data-rs-id="' + esc(r.id) + '">' +
          thumb + '<span class="os-rs-copy"><span class="os-rs-name">' + esc(r.title) + '</span>' + status + '</span>' +
        '</button>';
      }).join('');
      if (!html) {
        html = '<div class="os-rs-empty">' + (query ? 'No results found' : ('No ' + noun + 's are assigned to this template')) + '</div>';
      } else if (matched.length > shown.length) {
        html += '<button type="button" class="os-rs-more" data-rs-more>' + I.chev + '<span>View more</span></button>';
      }
      list.innerHTML = html;
    };
    draw();

    const qEl = pop.querySelector('#rs-q');
    qEl.oninput = () => { query = qEl.value; limit = 5; draw(); };
    pop.addEventListener('click', (e) => {
      const tb = e.target.closest('[data-rs-tab]');
      if (tb) { tab = tb.getAttribute('data-rs-tab'); limit = 5; draw(); return; }
      const more = e.target.closest('[data-rs-more]');
      if (more) { limit += 10; draw(); return; }
      const row = e.target.closest('[data-rs-id]');
      if (row) {
        ED.previewSel[pt] = row.getAttribute('data-rs-id');
        closePops(); refreshTree(); refreshCanvas(); return;
      }
      if (e.target.closest('[data-rs-create]')) {
        // Reuse the existing admin create pages. Open from the direct click handler so the
        // browser treats it as a user-initiated new tab (avoids popup blocking).
        const route = pt === 'product' ? '#/products/0' : '#/collections/0';
        window.open(location.href.split('#')[0] + route, '_blank', 'noopener');
        closePops();
      }
    });

    const r = anchor.getBoundingClientRect(); const w = 304;
    const left = r.right + 8 + w <= window.innerWidth - 8 ? r.right + 8 : Math.max(8, r.left - w - 8);
    pop.style.width = w + 'px';
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.max(64, Math.min(Math.round(r.top), window.innerHeight - 540)) + 'px';
    setTimeout(() => qEl.focus(), 0);
    closeOnOutside(pop, anchor);
  }

  // -------------------------------------------------------------- page / template selector
  // Shopify-style popover: page types at root (multi types drill into a template submenu with
  // Create template); a "Checkout theme" jump; and, on the checkout
  // surface, the Checkout / Thank you pages with a back link to the online store.
  function openPageSelector(anchor, forceRoot, forceLevel) {
    closePops();
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="os-pkpop os-pgpop"></div>');
    layer.appendChild(pop); document.body.appendChild(layer);
    // env: which environment's menus the popover shows — always the current editor surface
    // ('os' online store / 'ck' checkout theme). Jump links actually enter the other editor
    // and reopen this popover on its first-level menu (forceRoot). level: 'root' | <page type>.
    const env = isCheckout() ? 'ck' : 'os';
    let level = forceLevel || (forceRoot ? 'root' : (isCheckout() ? ED.checkoutPage : ((D.PAGE_OPTIONS.find((p) => p.value === ED.currentPage && p.multi)) ? ED.currentPage : 'root')));
    let query = '';

    const rootTypes = () => (env === 'ck') ? (D.CHECKOUT_PAGES || []) : D.PAGE_OPTIONS;
    const groupOf = (pt) => (env === 'ck') ? ckGroupOf(pt) : ED.theme.templates[pt];
    const rootLabel = (pt) => { const p = rootTypes().find((x) => x.value === pt); return p ? p.label : pt; };
    const isMultiType = (pt) => { const p = rootTypes().find((x) => x.value === pt); return !!(p && p.multi); };
    const curActiveId = (pt) => {
      const g = groupOf(pt); if (!g) return null;
      const onType = (env === 'ck') ? (isCheckout() && ED.checkoutPage === pt) : (!isCheckout() && ED.currentPage === pt);
      if (onType) return (env === 'ck') ? curCkTplId() : curTplId();
      return ((env === 'ck') ? ED.ckTplSel[pt] : ED.tplSel[pt]) || (defaultOf(g) || {}).id;
    };

    // A page-type row (drills into its template list when multi).
    function rowType(p) {
      const on = (env === 'ck') ? (isCheckout() && p.value === ED.checkoutPage) : (!isCheckout() && p.value === ED.currentPage);
      const optionalOffer = env === 'ck' && (p.value === 'upsell' || p.value === 'downsell');
      const state = optionalOffer
        ? '<span class="os-pg-status ' + (postPurchaseEnabled() ? 'enabled' : 'off') + '">' + (postPurchaseEnabled() ? 'Enabled' : 'Off') + '</span>' : '';
      return '<div class="os-pg-row' + (on ? ' on' : '') + '" data-type="' + esc(p.value) + '">' +
        '<span class="os-pg-ico">' + pageIco(p.value) + '</span>' +
        '<span class="os-pg-name">' + esc(p.label) + '</span>' +
        state +
        (p.multi ? '<span class="os-pg-arrow">' + I.chevR + '</span>' : '') + '</div>';
    }
    function flowControlHtml() {
      if (env !== 'ck') return '';
      const enabled = postPurchaseEnabled();
      return '<div class="os-pg-flow">' +
        '<div class="os-pg-flow-copy"><strong>Upsell &amp; Downsell</strong><small>' +
          (enabled ? 'Both pages are active after checkout' : 'Both pages are skipped after checkout') +
        '</small></div>' +
        '<button type="button" class="os-pg-switch' + (enabled ? ' on' : '') + '" data-post-toggle aria-pressed="' + enabled + '" aria-label="' +
          (enabled ? 'Turn off Upsell and Downsell' : 'Turn on Upsell and Downsell') + '"><span></span></button>' +
      '</div><div class="os-pg-sep"></div>';
    }
    // A template row. `nested` indents it under a page-type header in search results.
    function rowTpl(pt, t, nested) {
      const onType = (env === 'ck') ? (isCheckout() && ED.checkoutPage === pt) : (!isCheckout() && ED.currentPage === pt);
      const on = onType && t.id === curActiveId(pt);
      const cntTxt = usageText(pt, tplCount(pt, t));
      return '<div class="os-pg-row tpl' + (nested ? ' nested' : '') + (on ? ' on' : '') + '" data-tpl-pt="' + esc(pt) + '" data-tpl="' + esc(t.id) + '">' +
        '<span class="os-pg-ico">' + pageIco(env === 'ck' ? pt : '') + '</span>' +
        '<span class="os-pg-tplinfo"><span class="os-pg-name">' + esc(t.name) + '</span>' + (cntTxt ? '<span class="os-pg-sub">' + esc(cntTxt) + '</span>' : '') + '</span></div>';
    }
    function jumpRow(target, ico, label) {
      return '<div class="os-pg-row" data-jump="' + target + '"><span class="os-pg-ico">' + ico + '</span><span class="os-pg-name">' + esc(label) + '</span><span class="os-pg-arrow">' + I.chevR + '</span></div>';
    }
    // Search across the current environment: page types + their template names (PRD §5.3).
    function searchHtml(q) {
      let groups = '';
      rootTypes().forEach((p) => {
        const pt = p.value;
        const typeMatch = p.label.toLowerCase().indexOf(q) >= 0;
        const g = p.multi ? groupOf(pt) : null;
        const tplMatches = g ? g.list.filter((t) => t.name.toLowerCase().indexOf(q) >= 0) : [];
        if (!typeMatch && tplMatches.length === 0) return;
        groups += rowType(p);
        tplMatches.forEach((t) => { groups += rowTpl(pt, t, true); });
      });
      if (!groups) return '<div class="os-pg-empty"><div class="os-pg-empty-t">No results found</div><div class="os-pg-empty-s">Try searching for a different keyword</div></div>';
      return '<div class="os-pkpop-list">' + groups + '</div>';
    }
    function headerHtml() {
      if (level === 'root') {
        const ph = (env === 'ck') ? 'Search checkout theme' : 'Search online store';
        return '<div class="os-pkpop-search"><span class="os-pkpop-ico">' + I.search + '</span><input type="text" id="pg-q" placeholder="' + ph + '" autocomplete="off"></div>';
      }
      return '<div class="os-pg-back" data-back="1">' + I.back + ' ' + esc(rootLabel(level)) + '</div>';
    }
    function bodyHtml() {
      const q = query.trim().toLowerCase();
      if (level === 'root') {
        if (q) return searchHtml(q);
        let html = '<div class="os-pkpop-list">';
        rootTypes().forEach((p) => { html += rowType(p); });
        html += '<div class="os-pg-sep"></div>';
        html += (env === 'ck') ? jumpRow('os', pageIco('__online__'), 'Online store theme') : jumpRow('ck', I.cart, 'Checkout theme');
        html += '</div>';
        return html;
      }
      // Template list for `level`. Shopify-style: no per-row edit menu — just switch/create.
      const g = groupOf(level); let html = '<div class="os-pkpop-list">';
      if (env === 'ck' && (level === 'upsell' || level === 'downsell')) html += flowControlHtml();
      (g ? g.list : []).forEach((t) => { html += rowTpl(level, t, false); });
      html += '<div class="os-pg-create" data-create="' + esc(level) + '">' + I.plus + ' Create template</div>';
      html += '</div>';
      return html;
    }
    function position() {
      const r = anchor.getBoundingClientRect();
      const w = Math.max(Math.round(r.width), 268);
      pop.style.width = w + 'px';
      pop.style.left = Math.max(8, Math.min(Math.round(r.left), window.innerWidth - w - 12)) + 'px';
      pop.style.top = Math.round(r.bottom + 6) + 'px';
    }
    function drawBody() { const b = pop.querySelector('#os-pg-body'); if (b) b.innerHTML = bodyHtml(); position(); }
    function draw() {
      pop.innerHTML = headerHtml() + '<div id="os-pg-body">' + bodyHtml() + '</div>';
      position();
      const qi = pop.querySelector('#pg-q');
      if (qi) { qi.value = query; setTimeout(() => { qi.focus(); const v = qi.value; try { qi.setSelectionRange(v.length, v.length); } catch (e) {} }, 0); }
    }
    // Single delegated handler keeps clicks reliable across redraws (fixes the back link
    // occasionally not responding when handlers were re-bound per element).
    pop.addEventListener('input', (e) => { if (e.target && e.target.id === 'pg-q') { query = e.target.value; drawBody(); } });
    pop.addEventListener('click', (e) => {
      if (e.target.closest('[data-back]')) { level = 'root'; query = ''; draw(); return; }
      if (e.target.closest('[data-post-toggle]')) {
        ED.theme.checkout.postPurchaseEnabled = !postPurchaseEnabled();
        const reopenLevel = level;
        markDirty(); reopenSelectorAtLevel(reopenLevel); return;
      }
      const jump = e.target.closest('[data-jump]');
      // Jump = enter the OTHER editor environment, then reopen this popover on its
      // first-level menu (§5.1/§5.2) — no drilling into a specific template list.
      if (jump) { closePops(); enterEnv(jump.getAttribute('data-jump')); return; }
      const tplRow = e.target.closest('[data-tpl]');
      if (tplRow) { const pt = tplRow.getAttribute('data-tpl-pt'); const id = tplRow.getAttribute('data-tpl'); closePops(); if (env === 'ck') switchCheckoutTemplate(pt, id); else switchPage(pt, id); return; }
      const typeRow = e.target.closest('[data-type]');
      if (typeRow) { const pt = typeRow.getAttribute('data-type'); if (isMultiType(pt)) { level = pt; query = ''; draw(); } else { closePops(); switchPage(pt, null); } return; }
      const create = e.target.closest('[data-create]');
      if (create) { closePops(); openCreateTemplate(create.getAttribute('data-create')); return; }
    });
    draw();
    closeOnOutside(pop, anchor);
  }
  // Switch page type and/or active template. Selecting a different template of the same
  // page type still re-renders (pt equals currentPage but the template changed).
  function switchPage(pt, tplId) {
    const changed = isCheckout() || (pt !== ED.currentPage) || (tplId && tplId !== curTplId());
    if (!changed) { ED.currentPage = pt; if (tplId) ED.tplSel[pt] = tplId; return; }
    confirmSwitchTemplate(() => {
      ED.surface = 'online-store';
      ED.currentPage = pt;
      if (tplId) ED.tplSel[pt] = tplId;
      if (ED.selection.kind === 'section' || ED.selection.kind === 'block') ED.selection = { kind: 'header' };
      ED.leftMode = 'sections'; syncSurfaceHash(); rerender();
    });
  }
  // The template group for a page type. Checkout page types (checkout/upsell/downsell/
  // thankyou) resolve to the checkout theme's per-type lists; everything else is online store.
  function tplGroupOf(pt) { return isCkType(pt) ? ED.theme.checkout.templates[pt] : ED.theme.templates[pt]; }
  // Deep-clone a section instance with fresh ids (section + blocks) so a cloned template's
  // sections are independent instances (selecting/editing one never affects the source).
  function cloneSectionInstance(s) {
    const c = clone(s); c.id = uid('sec');
    if (c.blocks) c.blocks = c.blocks.map((b) => { const bc = clone(b); bc.id = uid('blk'); return bc; });
    return c;
  }
  // Clone a whole template — deep-copies the section structure with fresh ids. Checkout
  // theme settings are shared at theme level (PRD §9.4 "Theme settings 引用"), so a cloned
  // template only carries its own component structure.
  function cloneTemplate(pt, src, id, name) {
    const base = { id: id, name: name, basedOn: src.id, isDefault: false, sections: (src.sections || []).map(cloneSectionInstance) };
    if (!isCkType(pt)) { base.assigned = 0; base.assignedResourceIds = []; }
    return base;
  }
  // After adding/selecting a template, focus the editor on it (checkout jumps surface).
  function focusTemplate(pt, id) {
    if (isCkType(pt)) {
      ED.surface = 'checkout'; ED.checkoutPage = pt; ED.ckTplSel[pt] = id;
      ED.selection = defaultSelection(); ED.leftMode = 'sections'; syncSurfaceHash();
    } else {
      ED.currentPage = pt; ED.tplSel[pt] = id; ED.selection = { kind: 'header' }; ED.leftMode = 'sections';
    }
  }
  // Name uniqueness within a page type: trimmed + case-insensitive (PRD §10), optionally
  // ignoring one template id (for rename). Returns true when the name is free to use.
  function tplNameFree(g, name, ignoreId) {
    const norm = String(name).trim().toLowerCase();
    return !g.list.some((t) => t.id !== ignoreId && String(t.name).trim().toLowerCase() === norm);
  }
  // Slugify a template name into a unique id within its page-type list.
  function uniqueTplId(list, name) {
    const base = (String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')) || 'template';
    let id = base, n = 2;
    while (list.some((t) => t.id === id)) { id = base + '-' + (n++); }
    return id;
  }
  // Shopify-style "Create a template": Name (≤25) + Based-on clone source. On create we
  // deep-clone the source's sections, append the new template, select it and re-render.
  // The assignment ("Assigned to N …") happens in the admin, so a new template starts at 0.
  function openCreateTemplate(pt) {
    const g = tplGroupOf(pt); if (!g) return;
    const back = h('<div class="modal-backdrop" style="z-index:240"></div>');
    const m = h('<div class="modal"></div>');
    const opts = g.list.map((t) => '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>').join('');
    m.innerHTML =
      '<div class="modal-head">Create a template</div>' +
      '<div class="modal-body">' +
        '<div class="os-ct-note">Create a template to customize how your content is displayed. After it\u2019s published, assign it in the admin.</div>' +
        '<label class="os-ct-field"><span class="os-ct-lbl">Name</span>' +
          '<span class="os-ct-inwrap"><input type="text" id="ct-name" maxlength="25" autocomplete="off" placeholder=""><span class="os-ct-count" id="ct-count">0/25</span></span>' +
        '</label>' +
        '<div class="os-ct-err" id="ct-err" hidden></div>' +
        '<label class="os-ct-field"><span class="os-ct-lbl">Based on</span>' +
          '<span class="os-ct-selwrap"><select id="ct-base">' + opts + '</select><span class="os-ct-chev">▾</span></span>' +
        '</label>' +
      '</div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button><button class="btn btn-primary" data-ok disabled>Create template</button></div>';
    back.appendChild(m); document.body.appendChild(back);
    const close = () => back.remove();
    const nameEl = m.querySelector('#ct-name'); const countEl = m.querySelector('#ct-count'); const okBtn = m.querySelector('[data-ok]'); const errEl = m.querySelector('#ct-err');
    // Live validation (PRD §9.4/§10/§17.1): required, ≤25 chars, unique per type (trim + case-insensitive).
    const validity = () => {
      const raw = nameEl.value; const name = raw.trim();
      if (!name) return { ok: false, msg: '' };
      if (raw.length > 25) return { ok: false, msg: 'Template name can\u2019t exceed 25 characters.' };
      if (!tplNameFree(g, name)) return { ok: false, msg: 'A template with this name already exists.' };
      return { ok: true, msg: '' };
    };
    const sync = () => {
      countEl.textContent = nameEl.value.length + '/25';
      const v = validity(); okBtn.disabled = !v.ok;
      if (v.msg) { errEl.hidden = false; errEl.textContent = v.msg; } else { errEl.hidden = true; errEl.textContent = ''; }
    };
    nameEl.oninput = sync; setTimeout(() => nameEl.focus(), 20);
    m.querySelector('[data-cancel]').onclick = close; back.onclick = (e) => { if (e.target === back) close(); };
    const create = () => {
      const v = validity(); if (!v.ok) { sync(); return; }
      const name = nameEl.value.trim();
      const baseId = m.querySelector('#ct-base').value;
      const base = g.list.find((t) => t.id === baseId) || g.list[0];
      const id = uniqueTplId(g.list, name);
      g.list.push(cloneTemplate(pt, base, id, name));
      focusTemplate(pt, id);
      close(); rerender(); toast('Template “' + name + '” created');
    };
    okBtn.onclick = create;
    nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !okBtn.disabled) { e.preventDefault(); create(); } });
  }
  // Note: per-template Rename / Duplicate / Delete were intentionally removed from the page
  // selector to match Shopify (template management lives elsewhere, not in this popover).
  // Select a checkout template for a given checkout page type. Prompts for unsaved changes
  // before switching (PRD §8.2), then jumps to that page type + template.
  function switchCheckoutTemplate(pt, id) {
    const same = isCheckout() && ED.checkoutPage === pt && curCkTplId() === id;
    if (same) return;
    confirmSwitchTemplate(() => {
      ED.surface = 'checkout'; ED.checkoutPage = pt; ED.ckTplSel[pt] = id;
      ED.selection = defaultSelection(); ED.leftMode = 'sections'; syncSurfaceHash(); rerender();
    });
  }
  // Enter the other editor environment from the page selector's jump link (§5.1/§5.2).
  // Switching to Checkout theme actually loads the Checkout editor (default: Checkout page,
  // last-used template), then reopens the popover on the environment's FIRST-LEVEL menu —
  // it does NOT drill into a specific template list. Same for the reverse "Online store theme".
  function enterEnv(target) {
    const toCk = target === 'ck';
    if (toCk === isCheckout()) { reopenSelectorAtRoot(); return; }
    confirmSwitchTemplate(() => {
      if (toCk) {
        ED.surface = 'checkout';
        if (!isCkType(ED.checkoutPage)) ED.checkoutPage = 'checkout';
      } else {
        ED.surface = 'online-store';
      }
      ED.selection = defaultSelection(); ED.leftMode = 'sections'; syncSurfaceHash(); rerender();
      reopenSelectorAtRoot();
    });
  }
  // Reopen the page selector on its first-level menu after an environment switch, once the
  // rebuilt toolbar (and its #t-page anchor) exists.
  function reopenSelectorAtRoot() {
    setTimeout(() => { const btn = document.getElementById('t-page'); if (btn) openPageSelector(btn, true); }, 0);
  }
  function reopenSelectorAtLevel(level) {
    setTimeout(() => { const btn = document.getElementById('t-page'); if (btn) openPageSelector(btn, false, level); }, 0);
  }
  function defaultSelection() {
    if (isCheckout()) { const s = pageSections()[0]; return s ? { kind: 'section', sectionId: s.id } : { kind: 'theme-settings' }; }
    return { kind: 'header' };
  }
  // Buyer-flow simulation inside the editor preview. Keeps the current in-memory theme
  // intact while moving between Upsell / Downsell / Thank you; no Funnel or payment rule
  // is executed and no template assignment is changed.
  function goCheckoutPage(page) {
    if (!ED || !isCheckout() || !isCkType(page)) return;
    if ((page === 'upsell' || page === 'downsell') && !postPurchaseEnabled()) page = 'thankyou';
    if (isOfferPage() && page === 'thankyou') OS.ckSet('post-purchase-offer-flow', { visited: true });
    ED.checkoutPage = page;
    ED.selection = defaultSelection();
    ED.leftMode = 'sections';
    syncSurfaceHash();
    rerender();
  }
  // Keep the URL canonical for the current surface without re-dispatching the router
  // (replaceState doesn't fire hashchange), so the Checkout editor stays bookmarkable.
  function syncSurfaceHash() {
    const handle = ED.meta.handle;
    const want = isCheckout()
      ? ('#/checkout/' + encodeURIComponent(handle) + (ED.checkoutPage !== 'checkout' ? '/' + ED.checkoutPage : ''))
      : '#/online-store/edit/' + encodeURIComponent(handle);
    if (location.hash !== want) { try { history.replaceState(null, '', want); } catch (e) {} }
  }

  // ==========================================================================
  //  SAVE / DISCARD / PUBLISH  (+ validation)
  // ==========================================================================
  function onSave() {
    if (!isDirty()) return;
    const issues = validate(true);
    if (issues.length) { openIssues(issues, 'saving'); return; }
    ED.busy = 'saving'; refreshTop();
    setTimeout(() => { ED.savedTheme = clone(ED.theme); ED.meta.updated_time = nowStr(); ED.busy = null; refreshTop(); toast('Draft saved'); }, 360);
  }
  function onDiscard() {
    openConfirm({ title: 'Discard changes?', body: 'Are you sure you want to revert to the last saved state? Your unsaved changes will be lost.', okText: 'Discard', danger: true,
      onOk: () => { ED.theme = clone(ED.savedTheme); if (!findSel()) ED.selection = { kind: 'header' }; rerender(); toast('Reverted to last saved state'); } });
  }
  function onPublish() {
    if (!isDirty() && !hasDraft()) return;
    const issues = validate();
    if (issues.length) { openIssues(issues); return; }
    ED.busy = 'publishing'; refreshTop();
    setTimeout(() => { if (isDirty()) ED.savedTheme = clone(ED.theme); ED.publishedTheme = clone(ED.savedTheme); ED.busy = null; refreshTop(); toast('Published to storefront'); }, 480);
  }
  function validate(customOnly) {
    const out = [];
    if (!customOnly && (!ED.theme.name || !ED.theme.name.trim())) out.push({ where: 'Theme', msg: 'Theme name is required' });
    const checkInst = (inst, label) => {
      if (inst.hidden) return; const def = SECTIONS[inst.kind]; if (!def) return;
      if (!customOnly) {
        (def.schema || []).forEach((f) => { if (f.key && f.required && isMissing(inst.settings[f.key])) out.push({ where: label, msg: f.label + ' is required' }); });
      }
      if (typeof def.validate === 'function') {
        (def.validate(inst.settings) || []).forEach((msg) => out.push({ where: label, msg: msg }));
      }
      if (!customOnly) {
        (inst.blocks || []).forEach((bl, i) => { if (bl.hidden) return; const bd = blockDef(def, bl.kind); (bd && bd.fields || []).forEach((f) => { if (f.key && f.required && isMissing(bl.settings[f.key])) out.push({ where: label + ' · ' + (bd.name || 'Block') + ' #' + (i + 1), msg: f.label + ' is required' }); }); });
      }
    };
    checkInst(ED.theme.announcement, 'Announcement bar'); checkInst(ED.theme.header, 'Header'); checkInst(ED.theme.footer, 'Footer');
    Object.keys(ED.theme.templates).forEach((pg) => {
      const pl = (D.PAGE_OPTIONS.find((p) => p.value === pg) || {}).label || pg;
      ED.theme.templates[pg].list.forEach((tpl) => {
        const tl = pl + (tpl.id !== 'default' ? ' · ' + tpl.name : '');
        (tpl.sections || []).forEach((s, i) => { if (s.hidden) return; const def = SECTIONS[s.kind]; checkInst(s, tl + ' · ' + (def ? def.name : s.kind) + ' #' + (i + 1)); });
      });
    });
    Object.keys((ED.theme.checkout || {}).templates || {}).forEach((pg) => {
      const pl = ckPageLabel(pg);
      ED.theme.checkout.templates[pg].list.forEach((tpl) => {
        const tl = 'Checkout theme · ' + pl + ' · ' + tpl.name;
        (tpl.sections || []).forEach((s, i) => { if (s.hidden) return; const def = SECTIONS[s.kind]; checkInst(s, tl + ' · ' + (def ? def.name : s.kind) + ' #' + (i + 1)); });
      });
    });
    return out;
  }
  function isMissing(v) { return v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length); }
  function openIssues(issues, action) {
    const back = h('<div class="modal-backdrop" style="z-index:240"></div>');
    const m = h('<div class="modal" style="width:480px"></div>');
    m.innerHTML = '<div class="modal-head">Fix ' + issues.length + ' issue' + (issues.length > 1 ? 's' : '') + ' before ' + (action || 'publishing') + '</div>' +
      '<div class="modal-body"><div class="os-issues">' + issues.slice(0, 12).map((x) => '<div class="os-issue"><span class="os-issue-w">' + esc(x.where) + '</span><span>' + esc(x.msg) + '</span></div>').join('') + (issues.length > 12 ? '<div class="os-info">…and ' + (issues.length - 12) + ' more</div>' : '') + '</div></div>' +
      '<div class="modal-foot"><button class="btn btn-primary" data-ok>Got it</button></div>';
    back.appendChild(m); document.body.appendChild(back);
    const close = () => back.remove(); m.querySelector('[data-ok]').onclick = close; back.onclick = (e) => { if (e.target === back) close(); };
  }

  // -------------------------------------------------------------- leave interception
  function attemptLeave(proceed) {
    if (!ED || !isDirty()) { proceed(); return; }
    const back = h('<div class="modal-backdrop" style="z-index:240"></div>');
    const m = h('<div class="modal"></div>');
    m.innerHTML = '<div class="modal-head">Leave with unsaved changes?</div>' +
      '<div class="modal-body"><div class="subtle" style="font-size:13.5px;line-height:1.6">You have unsaved changes. Save them before you leave, or discard and exit.</div></div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button><button class="btn btn-default" data-discard>Discard &amp; leave</button><button class="btn btn-primary" data-save>Save &amp; leave</button></div>';
    back.appendChild(m); document.body.appendChild(back);
    const close = () => back.remove();
    m.querySelector('[data-cancel]').onclick = close; back.onclick = (e) => { if (e.target === back) close(); };
    m.querySelector('[data-discard]').onclick = () => { close(); proceed(); };
    m.querySelector('[data-save]').onclick = () => {
      const issues = validate(true);
      if (issues.length) { close(); openIssues(issues, 'saving'); return; }
      close(); ED.savedTheme = clone(ED.theme); proceed();
    };
  }

  // -------------------------------------------------------------- confirm modal
  function openConfirm(o) {
    const back = h('<div class="modal-backdrop" style="z-index:240"></div>'); const m = h('<div class="modal"></div>');
    m.innerHTML = '<div class="modal-head">' + esc(o.title) + '</div>' +
      '<div class="modal-body"><div class="subtle" style="font-size:13.5px;line-height:1.6">' + esc(o.body) + '</div></div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button><button class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-ok>' + esc(o.okText || 'OK') + '</button></div>';
    back.appendChild(m); document.body.appendChild(back);
    const close = () => back.remove();
    m.querySelector('[data-cancel]').onclick = close; back.onclick = (e) => { if (e.target === back) close(); };
    m.querySelector('[data-ok]').onclick = () => { close(); o.onOk && o.onOk(); };
  }

  // ==========================================================================
  //  REFRESHERS
  // ==========================================================================
  function rerender() { renderBuilder(ED.meta.handle); }
  function refreshTop() { const b = document.getElementById('os-builder'); if (!b) return; const old = b.querySelector('.os-top'); const nw = topBar(); old.replaceWith(nw); wireTop(); }
  function refreshTree() {
    const b = document.getElementById('os-builder'); if (!b) return;
    const old = b.querySelector('.os-left');
    // Preserve the tree scroll position across the rebuild (mirrors refreshRight). Without this,
    // selecting a block near the bottom (e.g. a Footer block) snaps the tree back to the top.
    const oldSc = old.querySelector('.os-left-scroll'); const sy = oldSc ? oldSc.scrollTop : 0;
    const nw = leftPanel(); old.replaceWith(nw); wireLeft();
    const newSc = nw.querySelector('.os-left-scroll'); if (newSc) newSc.scrollTop = sy;
  }
  function rightSelKey() { const s = ED.selection; if (ED.leftMode === 'settings' || s.kind === 'theme-settings') return 'settings'; return [s.kind, s.sectionId || '', s.blockId || ''].join(':'); }
  function refreshRight() {
    const b = document.getElementById('os-builder'); if (!b) return;
    const old = b.querySelector('.os-right'); if (!old) return;
    const oldSc = old.querySelector('.os-right-scroll'); const sy = oldSc ? oldSc.scrollTop : 0;
    const sameSel = ED._rightKey === rightSelKey();
    const nw = rightPanel(); old.replaceWith(nw);
    if (ED.leftMode === 'settings' || ED.selection.kind === 'theme-settings') wireSettings(); else wireRight();
    const newSc = nw.querySelector('.os-right-scroll'); if (newSc && sameSel) newSc.scrollTop = sy;
    ED._rightKey = rightSelKey();
  }
  function refreshCanvas() { const fr = document.getElementById('os-frame'); if (!fr) return; fr.className = 'os-frame ' + ED.device; fr.innerHTML = canvasHtml(); wireCanvas(); applyHighlight(); const bar = document.querySelector('.os-canvas-bar'); if (bar) bar.textContent = previewBarText(); }
  // Buyer-side add-on toggles recompute the Order Summary by re-rendering the canvas.
  // Deferred so the triggering click finishes bubbling (selection) before teardown.
  OS.ckRecalc = function () { requestAnimationFrame(function () { if (isCheckout()) refreshCanvas(); }); };
  function refreshAffectedCanvas() {
    const sel = ED.selection;
    if (sel.kind === 'header' || sel.kind === 'footer' || sel.kind === 'announcement') return refreshCanvas();
    refreshCanvas(); // section/block edits: simplest correct path is a full canvas refresh
  }
  function applyHighlight() {
    const fr = document.getElementById('os-frame'); if (!fr) return;
    // Section/global outlines are baked in at render time; selecting from the tree doesn't
    // re-render the canvas, so we must move the .active outline here too (not just blocks).
    fr.querySelectorAll('.os-sec.active').forEach((x) => x.classList.remove('active'));
    fr.querySelectorAll('.os-block-sel').forEach((x) => x.classList.remove('os-block-sel'));
    const sel = ED.selection;
    if (sel.kind === 'block') {
      const el = fr.querySelector('[data-block-id="' + cssesc(sel.blockId) + '"]'); if (el) el.classList.add('os-block-sel');
      return;
    }
    if (sel.kind === 'section') {
      const el = fr.querySelector('[data-csel="' + cssesc(sel.sectionId) + '"]'); if (el) el.classList.add('active');
      return;
    }
    if (sel.kind === 'header' || sel.kind === 'footer' || sel.kind === 'announcement') {
      const el = fr.querySelector('[data-csel-global="' + cssesc(sel.kind) + '"]'); if (el) el.classList.add('active');
    }
  }
  function cssesc(s) { return String(s).replace(/"/g, '\\"'); }
  function scrollToSelected() {
    const sc = document.getElementById('os-cscroll'); if (!sc) return; const sel = ED.selection;
    setTimeout(() => {
      if (sel.kind === 'header' || sel.kind === 'announcement') { if (sc.scrollTop > 4) sc.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      let el = null;
      if (sel.kind === 'section') el = sc.querySelector('[data-preview-id="section:' + cssesc(sel.sectionId) + '"]');
      else if (sel.kind === 'block') { const sEl = sc.querySelector('[data-block-id="' + cssesc(sel.blockId) + '"]'); el = sEl; }
      else if (sel.kind === 'footer') el = sc.querySelector('[data-csel-global="footer"]');
      if (!el) return;
      const r = el.getBoundingClientRect(); const sr = sc.getBoundingClientRect();
      // Skip auto-scroll when the element is already comfortably in view (e.g. clicked directly
      // in the preview). Only scroll when its top is above the viewport or it sits below the fold —
      // which mainly happens when selecting from the left tree.
      const topVisible = r.top >= sr.top && r.top <= sr.bottom - 24;
      const fillsView = r.top <= sr.top && r.bottom >= sr.bottom;
      if (topVisible || fillsView) return;
      sc.scrollTo({ top: sc.scrollTop + (r.top - sr.top) - 10, behavior: 'smooth' });
    }, 30);
  }
  function findSel() {
    const sel = ED.selection;
    if (sel.kind === 'section') return pageSections().some((x) => x.id === sel.sectionId);
    if (sel.kind === 'block') { const s = pageSections().find((x) => x.id === sel.sectionId) || globalBySel(sel.sectionId); return s && s.blocks.some((x) => x.id === sel.blockId); }
    return true;
  }

  // -------------------------------------------------------------- popover utils
  // Registered teardown fns for any open popovers' document-level listeners. closePops() is the
  // single close path, so it must always run these — otherwise a dismissed popover's outside/Esc
  // handlers stay bound to document, still referencing a detached node, and later fire against a
  // freshly opened popover (treating every click as "outside") — which made the selector vanish
  // on any click after an environment switch.
  let _popCleanups = [];
  function closePops() {
    _popCleanups.forEach((fn) => { try { fn(); } catch (e) {} });
    _popCleanups = [];
    document.querySelectorAll('.pop-layer').forEach((p) => p.remove());
  }
  function closeOnOutside(pop, anchor) {
    let added = false;
    function hh(e) { if (!pop.contains(e.target) && (!anchor || !anchor.contains(e.target))) closePops(); }
    function kk(e) { if (e.key === 'Escape') closePops(); }
    // Defer binding the outside-click handler so the click that opened the popover doesn't
    // immediately close it; clearTimeout guards the case where it's closed before that fires.
    const t = setTimeout(() => { document.addEventListener('mousedown', hh); added = true; }, 0);
    document.addEventListener('keydown', kk);
    _popCleanups.push(() => { clearTimeout(t); if (added) document.removeEventListener('mousedown', hh); document.removeEventListener('keydown', kk); });
  }
  function positionPop(pop, anchor, w, hh) {
    const r = anchor.getBoundingClientRect(); pop.style.width = w + 'px';
    let left = Math.min(r.left, window.innerWidth - w - 16); let top = Math.min(Math.max(r.top, 64), window.innerHeight - hh - 16);
    pop.style.left = Math.max(8, left) + 'px'; pop.style.top = top + 'px';
  }
  function nowStr() { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); }

  // ==========================================================================
  //  ROUTER / SIDEBAR
  // ==========================================================================
  function route(rest) {
    closePops();
    // Dedicated Checkout editor route: #/checkout or #/checkout/:handle (bookmarkable —
    // opens the builder straight on the Checkout surface, no Online-store detour).
    const first = (location.hash || '').replace(/^#\/?/, '').split('/')[0];
    if (first === 'checkout') {
      // #/checkout/:handle[/<checkout|upsell|downsell|thankyou>]
      const routeParts = (rest || '').split('?');
      const parts = routeParts[0].split('/').filter(Boolean);
      let page = 'checkout';
      ['thankyou', 'upsell', 'downsell', 'checkout'].forEach((pg) => { const i = parts.indexOf(pg); if (i >= 0) { page = pg; parts.splice(i, 1); } });
      const handle = parts[0] || (D.THEMES[0] && D.THEMES[0].handle) || 'aura';
      ensureSections().then(() => renderBuilder(decodeURIComponent(handle), 'checkout', page));
      return;
    }
    const m = (rest || '').match(/^edit\/(.+)$/);
    if (m) { ensureSections().then(() => renderBuilder(decodeURIComponent(m[1]), 'online-store')); }
    else renderList();
  }
  window.VIEWS = window.VIEWS || {};
  window.VIEWS['online-store'] = { render: function (el, rest) { root = el; route(rest || ''); }, unmount: function () { closeBuilder(); } };

  // upgrade the sidebar entry to active (mirrors the prior prototype's helper)
  function activateSidebar() {
    const aside = document.querySelector('aside.app-sidebar'); if (!aside) return false;
    const node = [...aside.querySelectorAll('.nav-item')].find((n) => { const s = n.querySelector('span:not(.nav-soon)'); return s && s.textContent.trim() === 'Online store'; });
    if (!node || (node.tagName === 'A' && node.classList.contains('active'))) return !!node;
    return true;
  }
  if (!activateSidebar()) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', activateSidebar); else setTimeout(activateSidebar, 0); }

  // ==========================================================================
  //  STYLES
  // ==========================================================================
  const STYLE_ID = 'os-style';
  function ensureStyles() { if (document.getElementById(STYLE_ID)) return; const st = document.createElement('style'); st.id = STYLE_ID; st.textContent = CSS; document.head.appendChild(st); }
  var CSS = `
  /* theme list */
  .os-list{max-width:1100px;margin:0 auto;padding:16px 30px 40px}
  .os-theme-cards{display:flex;flex-direction:column;gap:24px}
  .os-theme-card{border:1px solid var(--hair);border-radius:12px;overflow:hidden;background:#fff}
  .os-theme-prev{display:flex;gap:18px;background:var(--panel);padding:20px;overflow:hidden}
  .os-prev-pc{flex:1 1 auto;min-width:0;aspect-ratio:16/9;border-radius:4px;overflow:hidden;background:#fff}
  .os-prev-pc img,.os-prev-h5 img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
  .os-prev-h5{width:30%;min-width:220px;aspect-ratio:16/9;border-radius:4px;overflow:hidden;background:#fff}
  @media (max-width:1023px){.os-prev-h5{display:none}}
  .os-theme-meta{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px}
  .os-theme-name{font-size:16px;font-weight:600;color:var(--ink)}
  .os-theme-saved{font-size:13px;color:var(--ink-muted);margin-top:6px}
  .os-theme-actions{display:flex;align-items:center;gap:10px;flex:none}

  /* builder shell */
  .os-builder{position:fixed;inset:0;z-index:140;background:var(--page);display:flex;flex-direction:column;font-size:14px;color:var(--ink)}
  /* Popovers (block-kind menu, resource pickers, add-section, page menu) must sit above the
     full-screen editor chrome (.os-builder is z-index 140); the shared .pop-layer defaults to
     80, which hid menus behind the tree / preview canvas. Keep below modal backdrops (240). */
  .pop-layer{z-index:200}
  .os-top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--hair);background:#fff;flex-shrink:0}
  .os-top-l{display:flex;align-items:center;gap:12px;min-width:0}
  .os-top-c{display:flex;align-items:center;gap:10px;justify-content:center}
  .os-top-r{display:flex;align-items:center;gap:8px;justify-self:end}
  .os-rail{display:inline-flex;background:var(--panel);border-radius:8px;padding:3px;gap:2px}
  .os-rail-b{width:32px;height:28px;border:0;background:none;color:var(--ink-muted);border-radius:6px;display:grid;place-items:center;cursor:pointer}
  .os-rail-b.on{background:#fff;color:var(--brand);box-shadow:0 1px 2px rgba(0,0,0,.12)}
  .os-tname{font-size:13.5px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}
  .os-pagesel{display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 10px;border:1px solid var(--ctl);border-radius:8px;background:#fff;font-size:13px;font-family:inherit;color:var(--ink);min-width:180px;max-width:280px;cursor:pointer}
  .os-pagesel:hover{border-color:var(--brand)}
  .os-pagesel:focus{outline:none;border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-50)}
  .os-psb-ico{display:inline-flex;color:var(--ink-muted);flex:none}
  .os-psb-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}
  .os-psb-chev{display:inline-flex;color:var(--ink-muted);flex:none}
  /* Page / template selector popover */
  .os-pgpop{min-width:260px}
  /* Let the body take the popover's remaining height so its inner list scrolls (long
     template lists — e.g. Products — otherwise overflow the fixed max-height and clip
     "Create template"). */
  .os-pgpop > #os-pg-body{flex:1;min-height:0;display:flex;flex-direction:column}
  .os-pgpop .os-pkpop-list{padding:6px}
  .os-pg-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;cursor:pointer;font-size:13px;color:var(--ink)}
  .os-pg-row:hover{background:var(--panel)}
  .os-pg-row.on{background:var(--brand-50)}
  .os-pg-row.on .os-pg-name{color:var(--brand);font-weight:600}
  .os-pg-ico{display:inline-flex;color:var(--ink-muted);flex:none}
  .os-pg-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .os-pg-arrow{display:inline-flex;color:var(--ink-muted);flex:none}
  .os-pg-status{flex:none;padding:2px 7px;border-radius:999px;font-size:10.5px;font-weight:600;line-height:1.4}
  .os-pg-status.enabled{background:#e8f7ee;color:#18713d}.os-pg-status.off{background:#eef0f3;color:#6b7280}
  .os-pg-flow{display:flex;align-items:center;gap:12px;padding:9px 10px}
  .os-pg-flow-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:2px}.os-pg-flow-copy strong{font-size:12.5px;color:var(--ink)}.os-pg-flow-copy small{font-size:10.5px;color:var(--ink-muted);line-height:1.35}
  .os-pg-switch{position:relative;width:36px;height:20px;padding:0;border:0;border-radius:999px;background:#c8cdd5;cursor:pointer;transition:background .15s;flex:none}
  .os-pg-switch span{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}.os-pg-switch.on{background:var(--brand)}.os-pg-switch.on span{transform:translateX(16px)}
  .os-pg-tplinfo{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
  .os-pg-tplinfo .os-pg-name{flex:none}
  .os-pg-sub{font-size:12px;color:var(--ink-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .os-pg-sep{height:1px;background:var(--hair);margin:6px 4px}
  .os-pg-grouplbl{padding:6px 10px 4px;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-muted)}
  .os-pg-row.tpl.nested{margin-left:18px}
  .os-pg-empty{padding:22px 14px;text-align:center}
  .os-pg-empty-t{font-size:13px;font-weight:600;color:var(--ink)}
  .os-pg-empty-s{margin-top:3px;font-size:12px;color:var(--ink-muted)}
  .os-pg-back{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--hair);font-size:13px;font-weight:600;color:var(--ink);cursor:pointer}
  .os-pg-back:hover{color:var(--brand)}
  .os-pg-back svg{width:16px;height:16px}
  .os-pg-create{display:flex;align-items:center;gap:8px;padding:9px 10px;margin-top:2px;border-top:1px solid var(--hair);color:var(--brand);font-size:13px;font-weight:500;cursor:pointer}
  .os-pg-create:hover{background:var(--brand-50)}
  .os-pg-row.tpl{position:relative}
  .os-pg-kebab{flex:none;display:none;align-items:center;justify-content:center;width:26px;height:26px;border:0;border-radius:6px;background:transparent;color:var(--ink-muted);cursor:pointer}
  .os-pg-row.tpl:hover .os-pg-kebab{display:inline-flex}
  .os-pg-kebab:hover{background:var(--hair);color:var(--ink)}
  .os-pg-menu{position:absolute;top:calc(100% - 4px);right:8px;z-index:5;min-width:150px;background:#fff;border:1px solid var(--hair);border-radius:8px;box-shadow:var(--float-shadow);padding:4px;display:flex;flex-direction:column}
  .os-pg-menu button{display:block;width:100%;text-align:left;padding:7px 10px;border:0;background:transparent;font-size:13px;font-family:inherit;color:var(--ink);border-radius:6px;cursor:pointer}
  .os-pg-menu button:hover{background:var(--panel)}
  .os-pg-menu button.danger{color:#d92d20}
  .os-pg-menu button.danger:hover{background:#fef3f2}
  /* Create-a-template modal fields */
  .os-ct-note{font-size:13px;line-height:1.55;color:var(--ink-muted);margin-bottom:16px}
  .os-ct-field{display:block;margin-bottom:14px}
  .os-ct-field:last-child{margin-bottom:0}
  .os-ct-lbl{display:block;font-size:13px;font-weight:500;color:var(--ink);margin-bottom:6px}
  .os-ct-inwrap,.os-ct-selwrap{position:relative;display:block}
  .os-ct-inwrap input,.os-ct-selwrap select{width:100%;height:36px;border:1px solid var(--ctl);border-radius:8px;font-size:13px;font-family:inherit;color:var(--ink);background:#fff;box-sizing:border-box}
  .os-ct-inwrap input{padding:0 46px 0 12px}
  .os-ct-selwrap select{padding:0 30px 0 12px;-webkit-appearance:none;-moz-appearance:none;appearance:none;cursor:pointer}
  .os-ct-inwrap input:focus,.os-ct-selwrap select:focus{outline:none;border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-50)}
  .os-ct-count{position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:12px;color:var(--ink-muted)}
  .os-ct-chev{position:absolute;right:11px;top:50%;transform:translateY(-50%);color:var(--ink-muted);pointer-events:none;font-size:11px}
  .os-ct-err{margin:-6px 0 14px;font-size:12.5px;line-height:1.5;color:#d92d20}
  /* Editor-top usage-scope hint (PRD §13) */
  .os-scope-hint{display:flex;align-items:center;gap:8px;padding:8px 16px;background:#fffaeb;border-bottom:1px solid #fde28a;color:#7a5b00;font-size:12.5px;line-height:1.45}
  .os-scope-hint svg{flex:none;width:15px;height:15px;color:#dc9b00}
  /* Upsell / Downsell shared post-purchase offer canvas */
  .ckoffer-wrap{width:100%;margin:0 auto;box-sizing:border-box}
  .ckoffer-main{display:flex;flex-direction:column}
  .ckoffer-policy{width:100%;margin:0 auto;padding:24px 28px 32px;box-sizing:border-box}
  .ckoffer-page.mob .ckoffer-policy{padding:20px var(--ck-mob-pad,18px) 28px}
  .btn[disabled]{opacity:.5;cursor:not-allowed}
  .os-dev{display:inline-flex;background:var(--panel);border-radius:8px;padding:3px;gap:2px}
  .os-dev button{width:32px;height:28px;border:0;background:none;color:var(--ink-muted);border-radius:6px;display:grid;place-items:center;cursor:pointer}
  .os-dev button.on{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}
  .btn-warn{background:#f59e0b;color:#fff}.btn-warn:hover{background:#e08c08}
  .btn-danger{background:var(--err);color:#fff}.btn-danger:hover{background:#b3401f}
  .os-top .btn[disabled]{opacity:.45;cursor:not-allowed}
  .os-body{flex:1;min-height:0;display:grid;grid-template-columns:300px 1fr 340px;overflow:hidden}

  /* left tree */
  .os-left{border-right:1px solid var(--hair);display:flex;flex-direction:column;min-height:0;background:#fff}
  .os-left-head{padding:12px 16px;font-size:13px;font-weight:600;color:var(--ink);border-bottom:1px solid var(--hair);flex-shrink:0}
  .os-left-scroll{flex:1;overflow:auto;padding:8px}
  /* Product / Collection template context + Shopify-style preview resource selector. */
  .os-rp-context{padding:4px 4px 12px;margin-bottom:4px;border-bottom:1px solid var(--hair)}
  .os-rp-template{font-size:14px;font-weight:650;color:var(--ink);padding:2px 4px}
  .os-rp-assigned{font-size:12px;color:var(--ink-muted);padding:3px 4px 8px}
  .os-rp-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 9px;background:var(--panel);border:1px solid transparent;border-radius:8px;color:var(--ink);font-family:inherit;cursor:pointer;text-align:left}
  .os-rp-trigger:hover{border-color:var(--ctl)}
  .os-rp-copy{display:flex;flex-direction:column;min-width:0;gap:2px}
  .os-rp-label{font-size:11px;color:var(--ink-muted)}
  .os-rp-name{display:flex;align-items:center;gap:7px;min-width:0;font-size:12.5px;font-weight:550}
  .os-rp-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .os-rp-thumb{width:22px;height:22px;flex:none;border-radius:5px;background-size:cover;background-position:center;border:1px solid var(--hair);display:inline-flex;align-items:center;justify-content:center;color:var(--ink-muted)}
  .os-rp-thumb svg{width:14px;height:14px}
  .os-rp-chev{display:inline-flex;flex:none;color:var(--ink-muted)}
  .os-tree-note{font-size:12px;color:var(--ink-muted);line-height:1.55;background:var(--panel);border-radius:8px;padding:9px 11px;margin:4px 4px 10px}
  .os-tree-row{display:flex;align-items:center;gap:9px;padding:8px 8px;border-radius:8px;cursor:pointer;color:var(--ink-body);font-size:13.5px}
  .os-tree-row:hover{background:var(--panel)}
  .os-grp-head{display:flex;align-items:center;gap:6px;padding:9px 8px 6px;font-size:11px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--ink-muted);cursor:pointer}
  .os-caret{display:inline-flex;color:var(--ink-muted);transition:transform .15s}.os-caret.open{transform:rotate(90deg)}
  .os-row{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:var(--ink-body);position:relative}
  .os-row:hover{background:var(--panel)}
  .os-row.active{background:#e6f0ff;color:var(--brand);font-weight:600}
  .os-row.active .os-tr-ico{color:var(--brand)}
  .os-row.hid .os-tr-name{text-decoration:line-through;opacity:.7}
  .os-row.blk{padding-left:40px}
  .os-tr-ico{width:18px;height:18px;flex:none;color:var(--ink-muted);display:inline-flex}.os-tr-ico.sm{width:15px;height:15px}
  .os-tr-name{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .os-row-caret{width:16px;display:inline-flex;color:var(--ink-muted);transition:transform .15s;flex:none}.os-row-caret.open{transform:rotate(90deg)}.os-row-caret.ghost{visibility:hidden}
  .os-tr-acts{display:flex;gap:1px;opacity:0;flex:none}
  .os-row:hover .os-tr-acts,.os-row.hid .os-tr-acts{opacity:1}
  .os-tr-act{width:22px;height:22px;display:grid;place-items:center;color:var(--ink-muted);border-radius:6px;cursor:pointer}
  .os-tr-act:hover{background:#fff;color:var(--ink)}.os-tr-act.danger:hover{color:var(--err)}
  .os-tr-grip{color:#c4cad3;cursor:grab;display:inline-flex;flex:none;opacity:0}
  .os-row:hover .os-tr-grip{opacity:1}
  .os-tr-lock{color:#c4cad3;display:inline-flex;flex:none;margin-left:2px}
  .os-tree-add{display:flex;align-items:center;gap:6px;padding:8px;margin:4px 0 2px;border:1px dashed var(--ctl);border-radius:8px;color:var(--brand);font-size:13px;cursor:pointer}
  .os-tree-add:hover{background:var(--brand-50)}.os-tree-add.sub{margin-left:20px;font-size:12.5px;padding:6px 8px}
  .os-add-n{color:var(--ink-muted);font-size:12px}
  .os-row.dragging{opacity:.4}
  .os-row.drop-before::before,.os-row.drop-after::before{content:'';position:absolute;left:8px;right:8px;height:2px;background:var(--brand);border-radius:2px}
  .os-row.drop-before::before{top:-1px}.os-row.drop-after::before{bottom:-1px}

  /* center canvas */
  .os-center{display:flex;flex-direction:column;min-height:0;background:#eef0f3}
  .os-canvas-bar{flex-shrink:0;padding:7px 14px;font-size:12px;color:var(--ink-muted);background:#f7f8fa;border-bottom:1px solid var(--hair)}
  .os-canvas-scroll{flex:1;overflow:auto;padding:20px;display:flex;justify-content:center;align-items:flex-start}
  .os-frame{width:100%;max-width:1080px;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.08);border-radius:4px;overflow:hidden;transition:max-width .2s}
  .os-frame.mobile{max-width:390px}
  .os-sec{position:relative;outline:2px solid transparent;outline-offset:-2px;cursor:pointer;transition:outline-color .12s}
  .os-sec:hover{outline-color:#b9d2ff}.os-sec.active{outline-color:var(--brand)}
  .os-sec-tag{position:absolute;top:0;left:0;z-index:4;background:var(--brand);color:#fff;font-size:10px;font-weight:600;padding:2px 7px;border-bottom-right-radius:6px;opacity:0;pointer-events:none;transition:opacity .12s;letter-spacing:.02em}
  .os-sec:hover .os-sec-tag,.os-sec.active .os-sec-tag{opacity:1}
  .os-transhdr{position:relative}
  .os-transhdr>.os-sec-overlay{position:absolute;top:0;left:0;right:0;z-index:6}
  .os-block-sel{outline:2px solid var(--brand);outline-offset:-2px}
  .os-empty-canvas{padding:64px 20px;text-align:center;color:#9aa3b0;font-size:13px;line-height:1.7}
  .os-render-err{margin:8px;padding:14px;background:#fff4f2;color:#b3401f;font-size:12.5px;border:1px solid #f3c9c0;border-radius:8px}

  /* right panel */
  .os-right{border-left:1px solid var(--hair);display:flex;flex-direction:column;min-height:0;background:#fff}
  .os-right-head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--hair);flex-shrink:0}
  .os-rh-ico{width:32px;height:32px;flex:none;border-radius:8px;background:var(--panel);display:grid;place-items:center;color:var(--ink-muted)}
  .os-rh-title{font-size:14px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .os-rh-sub{font-size:12px;color:var(--ink-muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .os-rh-vis{margin-left:auto;width:30px;height:30px;display:grid;place-items:center;border:0;background:none;color:var(--ink-muted);border-radius:6px;cursor:pointer;flex:none}
  .os-rh-vis:hover{background:var(--panel)}.os-rh-vis.off{color:#c4cad3}
  .os-expall{margin-left:auto;font-size:12.5px;color:var(--brand);border:0;background:none;cursor:pointer}
  .os-right-scroll{flex:1;overflow:auto;padding:12px 14px}
  .os-empty-right{padding:28px 22px;text-align:center;color:#9aa3b0;font-size:13px;line-height:1.7}
  .os-remove{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;height:36px;margin-top:14px;border:1px solid #f3c9c0;border-radius:8px;background:#fff;color:var(--err);font-size:13px;font-weight:500;cursor:pointer}
  .os-remove:hover{background:#fef4f2}

  /* fields */
  .os-fld{margin-bottom:12px}
  .os-fld-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .os-flabel{display:flex;align-items:center;font-size:12px;font-weight:600;color:var(--ink-body);margin-bottom:6px}
  .os-fld-row .os-flabel{margin-bottom:0}
  .os-req{color:var(--err);margin-left:2px}
  .os-fval{margin-left:auto;font-size:12px;color:var(--ink-muted);font-variant-numeric:tabular-nums}
  .os-fhint{font-size:11.5px;color:#8a93a1;margin-top:4px;line-height:1.5}
  .os-sub{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#9aa3b0;margin:16px 0 8px;padding-top:12px;border-top:1px solid #f0f2f5}
  .os-info{font-size:12px;color:#8a93a1;line-height:1.55;background:var(--panel);border-radius:8px;padding:9px 11px;margin-bottom:10px}
  .os-input{width:100%;height:34px;padding:0 10px;border:1px solid var(--ctl);border-radius:8px;font-size:13px;color:var(--ink);background:#fff;font-family:inherit}
  .os-input:focus{outline:none;border-color:var(--brand)}
  .os-ta{height:auto;min-height:72px;padding:8px 10px;line-height:1.5;resize:vertical}.os-ta.mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px}
  .os-select{width:100%;height:34px;padding:0 8px;border:1px solid var(--ctl);border-radius:8px;font-size:13px;color:var(--ink);background:#fff;font-family:inherit;cursor:pointer}
  .os-select:focus{outline:none;border-color:var(--brand)}
  .os-seg2{display:flex;background:var(--panel);border-radius:8px;padding:3px;gap:2px}
  .os-seg2 button{flex:1;border:0;background:none;font-size:12px;font-weight:500;color:var(--ink-body);padding:6px 6px;border-radius:6px;cursor:pointer;font-family:inherit;white-space:nowrap}
  .os-seg2 button.on{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}
  .os-tg{width:38px;height:22px;border-radius:999px;background:#cfd5de;cursor:pointer;flex:none;position:relative;transition:background .15s}
  .os-tg.on{background:var(--brand)}
  .os-tg i{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .15s;box-shadow:0 1px 2px rgba(0,0,0,.2)}.os-tg.on i{left:18px}
  .os-range{width:100%;accent-color:var(--brand);cursor:pointer}
  .os-color{display:flex;align-items:center;gap:8px}
  .os-sw{width:32px;height:32px;border-radius:8px;border:1px solid var(--ctl);cursor:pointer;flex:none;position:relative;overflow:hidden}
  .os-sw input[type=color]{position:absolute;inset:0;opacity:0;cursor:pointer;border:0;padding:0}
  .os-sw.tsp{background:conic-gradient(#ccc 25%,#fff 0 50%,#ccc 0 75%,#fff 0)50%/12px 12px}
  .os-hex{flex:1;height:32px;border:1px solid var(--ctl);border-radius:8px;padding:0 10px;font-size:12.5px;font-family:ui-monospace,Menlo,Consolas,monospace;color:var(--ink)}
  .os-hex:focus{outline:none;border-color:var(--brand)}
  .os-tbtn{width:32px;height:32px;border:1px solid var(--ctl);border-radius:8px;background:#fff;color:var(--ink-muted);font-size:12px;font-weight:700;cursor:pointer;flex:none}
  .os-tbtn.on{border-color:var(--brand);color:var(--brand);background:var(--brand-50)}
  .os-ninh{display:flex;align-items:center;gap:8px}.os-ninh .os-input{flex:1}.os-ninh .os-tbtn{width:auto;padding:0 10px;font-size:12px;font-weight:600}
  .os-imgdrop{width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:18px 12px;border:1.5px dashed var(--ctl);border-radius:10px;background:var(--panel);cursor:pointer;font-family:inherit;transition:border-color .12s,background .12s}
  .os-imgdrop:hover{border-color:var(--brand);background:var(--brand-50)}
  .os-imgdrop-ico{color:var(--ink-muted);display:inline-flex;margin-bottom:2px}
  .os-imgdrop:hover .os-imgdrop-ico{color:var(--brand)}
  .os-imgdrop-t{font-size:13px;font-weight:600;color:var(--ink)}
  .os-imgdrop-s{font-size:11.5px;color:var(--ink-muted)}
  .os-imgset{display:flex;align-items:center;gap:10px;padding:8px;border:1px solid var(--ctl);border-radius:10px;background:#fff}
  .os-imgset-prev{width:48px;height:48px;flex:none;border-radius:8px;background-size:cover;background-position:center;background-color:var(--panel);border:1px solid var(--hair)}
  .os-imgset-meta{flex:1;min-width:0}
  .os-imgset-name{font-size:12px;color:var(--ink-body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .os-imgset-acts{display:flex;gap:12px;margin-top:4px}
  .os-imglink{border:0;background:none;padding:0;font-size:12px;font-weight:600;color:var(--brand);cursor:pointer;font-family:inherit}
  .os-imglink.danger{color:var(--ink-muted)}.os-imglink.danger:hover{color:#b3261e}
  /* inline resource picker popover */
  .pop-layer .os-pkpop{pointer-events:auto}
  .os-pkpop{position:fixed;z-index:81;display:flex;flex-direction:column;background:#fff;border:1px solid var(--hair);border-radius:10px;box-shadow:var(--float-shadow);overflow:hidden;max-height:340px}
  .os-pkpop-search{display:flex;align-items:center;gap:8px;margin:10px;padding:0 10px;height:34px;border:1px solid var(--ctl);border-radius:8px;background:#fff;flex:none}
  .os-pkpop-ico{color:var(--ink-muted);display:inline-flex;flex:none}
  .os-pkpop-search input{flex:1;border:0;outline:0;background:transparent;font-size:13px;color:var(--ink);font-family:inherit}
  .os-pkpop-list{flex:1;min-height:0;overflow:auto;padding:2px 10px 6px}
  .os-pkpop-list .os-pk-row{padding:8px 6px;border-radius:8px;border-bottom:0}
  .os-pkpop-list .os-pk-row:hover{background:var(--panel)}
  .os-pkpop-list .os-pk-row.on{background:var(--brand-50)}
  .os-pkpop-list .os-pk-row.disabled{opacity:.55;cursor:not-allowed}
  .os-vpkpop{max-height:min(520px,calc(100vh - 80px))}
  .os-vpkpop .os-pkpop-list{padding:0}
  .os-vpk-product{border-bottom:1px solid var(--hair);background:#fff}.os-vpk-product.on{background:#f7f7f8}.os-vpk-product.disabled{opacity:.6}
  .os-vpk-product-row{display:flex;align-items:center;gap:9px;min-height:56px;padding:4px 12px}
  .os-vpk-product-main{display:flex;align-items:center;gap:10px;min-width:0;flex:1;cursor:pointer}.os-vpk-product-main>input,.os-vpk-variant>input{width:16px;height:16px;accent-color:var(--brand);flex:none}
  .os-vpk-product-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:2px}.os-vpk-product-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink);font-size:12.5px}.os-vpk-product-copy small{color:var(--ink-muted);font-size:10.5px}
  .os-vpk-product-price{font-size:12px;color:var(--ink);flex:none}.os-vpk-status{padding:3px 8px;border-radius:999px;background:#fde1b5;color:#77511c;font-size:10px;font-weight:700;text-transform:uppercase}
  .os-vpk-expand{display:grid;place-items:center;width:24px;height:24px;padding:0;border:0;background:transparent;color:var(--ink-muted);cursor:pointer;transition:transform .15s}.os-vpk-expand.open{transform:rotate(90deg)}
  .os-vpk-variants{margin:0 12px 0 44px;border-top:1px solid var(--hair)}
  .os-vpk-variant{display:flex;align-items:center;gap:9px;min-height:54px;padding:4px 0;border-bottom:1px solid var(--hair);cursor:pointer}.os-vpk-variant:last-child{border-bottom:0}.os-vpk-variant.disabled{opacity:.55;cursor:not-allowed}
  .os-vpk-vthumb{width:38px;height:38px;border-radius:6px;background:var(--panel) center/cover no-repeat;flex:none}.os-vpk-vname{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink);font-size:12.5px;font-weight:600}.os-vpk-vprice{color:var(--ink);font-size:12px;flex:none}
  .os-pkpop-foot{flex:none;display:flex;justify-content:flex-end;padding:8px 10px;border-top:1px solid var(--hair)}
  .os-pkpop-foot .btn{height:32px;padding:0 16px}
  /* Template preview resource picker: All / Assigned + search + paged resource list. */
  .os-rspop{max-height:min(560px,calc(100vh - 80px))}
  .os-rs-tabs{display:flex;gap:2px;margin:10px 10px 0;padding:3px;background:var(--panel);border-radius:8px;flex:none}
  .os-rs-tabs button{flex:1;height:29px;border:0;border-radius:6px;background:transparent;color:var(--ink-body);font-family:inherit;font-size:12px;font-weight:500;cursor:pointer}
  .os-rs-tabs button.on{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}
  .os-rs-search{margin-top:8px}
  .os-rs-list{flex:1;min-height:0;overflow:auto;padding:0 10px 8px}
  .os-rs-row{width:100%;display:flex;align-items:center;gap:9px;padding:6px;border:0;border-radius:8px;background:#fff;color:var(--ink);font-family:inherit;text-align:left;cursor:pointer}
  .os-rs-row:hover{background:var(--panel)}
  .os-rs-row.on{background:#eceef2}
  .os-rs-thumb{width:34px;height:34px;flex:none;border-radius:7px;background-size:cover;background-position:center;border:1px solid var(--hair);display:inline-flex;align-items:center;justify-content:center;color:var(--ink-muted)}
  .os-rs-thumb svg{width:17px;height:17px}
  .os-rs-copy{display:flex;align-items:center;gap:8px;min-width:0;flex:1}
  .os-rs-name{min-width:0;font-size:13px;line-height:1.35;overflow:hidden;text-overflow:ellipsis}
  .os-resource-status{display:inline-flex;align-items:center;flex:none;padding:2px 7px;border-radius:999px;background:#e3e3e3;color:#303030;font-size:10.5px;font-weight:650;line-height:1.35}
  .os-rs-more,.os-rs-create{width:100%;display:flex;align-items:center;gap:9px;border:0;background:#fff;color:var(--brand);font-family:inherit;font-size:13px;cursor:pointer;text-align:left}
  .os-rs-more{padding:10px 8px}.os-rs-more svg{transform:rotate(0deg)}
  .os-rs-create{flex:none;padding:12px 14px;border-top:1px solid var(--hair)}
  .os-rs-empty{padding:28px 12px;text-align:center;color:var(--ink-muted);font-size:12.5px;line-height:1.45}
  .os-picker{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;height:34px;padding:0 10px;border:1px solid var(--ctl);border-radius:8px;background:#fff;font-size:13px;color:var(--ink);cursor:pointer;font-family:inherit}
  .os-picker:hover{border-color:var(--brand)}.os-picker span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .os-oplist,.os-mappings{display:flex;flex-direction:column;gap:8px}
  .os-op-rows{display:flex;flex-direction:column;border:1px solid var(--hair);border-radius:8px;overflow:hidden;background:#fff}
  .os-op-row{display:flex;align-items:center;gap:9px;min-height:48px;padding:6px 8px;border-bottom:1px solid var(--hair);background:#fff}
  .os-op-row:last-child{border-bottom:0}.os-op-row.dragging{opacity:.45}
  .os-op-thumb{width:34px;height:34px;flex:none;border:1px solid var(--hair);border-radius:6px;background:var(--panel) center/cover no-repeat}
  .os-op-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:1px}
  .os-op-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;font-weight:600}
  .os-op-copy small{color:var(--ink-muted);font-size:10.5px}.os-op-copy small:first-letter{text-transform:uppercase}
  .os-op-remove{width:24px;height:24px;border:0;border-radius:5px;background:transparent;color:var(--ink-muted);font-size:18px;line-height:1;cursor:pointer}
  .os-op-remove:hover{background:#f7e9e7;color:#b3261e}
  .os-op-grip,.os-map-grip{display:inline-flex;flex:none;color:var(--ink-muted);cursor:grab}
  .os-op-empty,.os-map-empty{padding:10px;border:1px dashed var(--ctl);border-radius:8px;color:var(--ink-muted);font-size:11.5px;line-height:1.4}
  .os-op-select,.os-map-action{align-self:flex-start;height:32px;padding:0 12px;border:1px solid var(--ctl);border-radius:7px;background:#fff;color:var(--ink);font-family:inherit;font-size:12px;font-weight:600;cursor:pointer}
  .os-op-select:hover,.os-map-action:hover{border-color:var(--brand);color:var(--brand)}
  .os-map-card{display:flex;flex-direction:column;gap:7px;padding:10px;border:1px solid var(--hair);border-radius:9px;background:#fff}
  .os-map-head{display:flex;align-items:center;gap:7px;padding-bottom:7px;border-bottom:1px solid var(--hair);cursor:grab}
  .os-map-head strong{flex:1;font-size:12.5px}.os-map-head button{border:0;background:none;color:#b3261e;font-family:inherit;font-size:11px;cursor:pointer}
  .os-map-label{margin-top:3px;color:var(--ink-muted);font-size:10.5px;font-weight:650;text-transform:uppercase;letter-spacing:.03em}
  .os-map-purchased .os-op-row{border:1px solid var(--hair);border-radius:8px}.os-map-action{height:29px}
  .os-map-error{padding:6px 8px;border-radius:6px;background:#fff2f0;color:#9d241d;font-size:10.5px;line-height:1.35}
  .os-colsel{display:flex;flex-direction:column}
  .os-colsel-btn{align-self:flex-start;height:32px;padding:0 16px;border:1px solid var(--ctl);border-radius:8px;background:var(--panel);color:var(--ink);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
  .os-colsel-btn:hover{background:#eceef2}
  .os-colsel-list{border:1px solid var(--ctl);border-radius:8px;overflow:hidden}
  .os-colsel-row{display:flex;align-items:center;gap:9px;padding:8px 10px;background:#fff;border-bottom:1px solid var(--hair);font-size:13px;color:var(--ink)}
  .os-colsel-row:last-child{border-bottom:0}
  .os-colsel-row.os-colsel-dragging{opacity:.45}
  .os-colsel-row.os-colsel-over{box-shadow:inset 0 2px 0 var(--brand)}
  .os-colsel-ico{color:var(--ink-muted);display:inline-flex;flex:none}
  .os-colsel-name{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-decoration:underline;text-underline-offset:2px;text-decoration-color:#cbd2db}
  .os-colsel-grip{color:#c4cad3;display:inline-flex;flex:none;cursor:grab}
  .os-colsel-change{align-self:stretch;margin-top:-1px;height:34px;border:1px solid var(--ctl);border-top:0;border-radius:0 0 8px 8px;background:var(--panel);color:var(--ink);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
  .os-colsel-change:hover{background:#eceef2}
  .os-pk-search{display:flex;align-items:center;gap:8px;margin:10px 14px 0;padding:0 10px;height:36px;border:1px solid var(--ctl);border-radius:8px;background:#fff}
  .os-pk-search-ico{color:var(--ink-muted);display:inline-flex;flex:none}
  .os-pk-search input{flex:1;border:0;outline:0;background:transparent;font-size:13px;color:var(--ink);font-family:inherit}
  .os-pk-empty{padding:24px 8px;text-align:center;font-size:13px;color:var(--ink-muted)}

  /* settings groups */
  .os-set-grp{border:1px solid var(--hair);border-radius:8px;margin-bottom:8px;overflow:hidden}
  .os-set-head{display:flex;align-items:center;gap:8px;padding:10px;cursor:pointer}
  .os-set-grp.open .os-set-head{background:var(--panel)}
  .os-set-h-txt{flex:1;min-width:0}
  .os-set-name{font-size:13px;font-weight:600;color:var(--ink)}
  .os-set-desc{font-size:11.5px;color:var(--ink-muted);margin-top:1px}
  .os-set-n{font-size:11px;color:var(--ink-muted);flex:none}
  .os-set-body{padding:8px 10px 10px}

  /* add-section popover */
  .os-addpop{position:fixed;z-index:61;background:#fff;border:1px solid var(--hair);border-radius:12px;box-shadow:var(--float-shadow);display:flex;flex-direction:column;overflow:hidden;pointer-events:auto;max-height:470px}
  .os-addpop-search{padding:12px;border-bottom:1px solid var(--hair)}
  .os-addpop-body{flex:1;min-height:0;display:grid;grid-template-columns:1fr 240px;overflow:hidden}
  .os-addpop-list{overflow:auto;padding:8px;border-right:1px solid var(--hair)}
  .os-addpop-prev{padding:16px;display:flex;flex-direction:column;gap:8px;overflow:auto}
  .os-addgrp{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#9aa3b0;padding:10px 6px 4px}
  .os-addrow{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer}
  .os-addrow:hover,.os-addrow.hover{background:var(--panel)}.os-addrow.soon{opacity:.55;cursor:default}
  .os-add-ico{width:30px;height:30px;flex:none;border-radius:7px;background:var(--panel);display:grid;place-items:center;color:var(--ink-muted)}
  .os-add-name{font-size:13px;font-weight:600;color:var(--ink)}
  .os-add-desc{font-size:11.5px;color:var(--ink-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .os-add-zone{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-muted);padding:10px 8px 4px}
  .os-add-zone:first-child{padding-top:4px}
  .os-soon{font-size:10px;color:#9aa3b0;border:1px solid var(--hair);border-radius:4px;padding:0 4px;margin-left:4px;font-weight:500}
  .os-addprev-art{height:120px;border-radius:8px;background:var(--panel);display:grid;place-items:center;color:#c4cad3}
  .os-addprev-art svg{width:34px;height:34px}
  .os-addprev-name{font-size:15px;font-weight:600;color:var(--ink)}
  .os-addprev-desc{font-size:12.5px;color:var(--ink-body);line-height:1.5}
  .os-soon-note{font-size:12px;color:var(--ink-muted)}
  .os-addprev-hint{margin-top:auto;font-size:11px;color:var(--ink-muted);line-height:1.5;border-top:1px dashed var(--hair);padding-top:10px}
  .os-addpop-foot{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-top:1px solid var(--hair);font-size:11.5px;color:var(--ink-muted)}

  /* resource picker rows */
  .os-pk-row{display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid var(--hair);cursor:pointer;font-size:13.5px;color:var(--ink-body)}
  .os-pk-row input{accent-color:var(--brand);width:16px;height:16px;flex:none}
  .os-pk-thumb{width:40px;height:40px;border-radius:6px;background-size:cover;background-position:center;background-color:var(--panel);flex:none}
  .os-pk-thumb.gen{display:grid;place-items:center;color:var(--ink-muted)}
  .os-pk-name{flex:1;min-width:0}

  /* publish issues */
  .os-issues{display:flex;flex-direction:column;gap:8px;max-height:340px;overflow:auto}
  .os-issue{display:flex;gap:8px;font-size:13px;color:var(--ink-body);line-height:1.5}
  .os-issue-w{font-weight:600;color:var(--ink);flex:none}

  /* toast */
  .os-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 16px;border-radius:8px;font-size:13px;z-index:300;box-shadow:var(--float-shadow);display:flex;align-items:center;gap:8px}
  .os-toast i{width:8px;height:8px;border-radius:50%;background:var(--ok)}
  .os-toast.err{background:#b3261e}.os-toast.err i{background:#fff}

  /* shared storefront product card */
  .oc-card{min-width:0}
  .oc-img{position:relative;background-position:center;background-repeat:no-repeat;background-color:#f1f2f4;margin-bottom:10px;overflow:hidden}
  .oc-badge{position:absolute;top:8px;left:8px;font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;z-index:2}
  .oc-quick{position:absolute;left:10px;right:10px;bottom:10px;display:flex;align-items:center;justify-content:center;border-radius:6px;opacity:0;transition:opacity .15s}
  .oc-card:hover .oc-quick{opacity:1}
  .oc-sw{display:flex;gap:5px;margin-bottom:6px;justify-content:inherit}
  .oc-sw span{width:12px;height:12px;border-radius:50%;border:1px solid rgba(0,0,0,.12)}
  .oc-vendor{font-size:11px;letter-spacing:.04em;text-transform:uppercase;margin-bottom:3px}
  .oc-title{font-weight:500;line-height:1.35;margin-bottom:4px}
  .oc-rate{display:flex;align-items:center;gap:4px;font-size:12px;color:#444;margin-bottom:4px;justify-content:inherit}
  .oc-rate svg{width:13px;height:13px}.oc-rate i{color:#999;font-style:normal}
  .oc-price{font-size:14px;font-weight:600;display:flex;gap:8px;align-items:baseline;justify-content:inherit}
  .oc-price s{color:#9aa3b0;font-weight:400;font-size:13px}

  /* ============================ CHECKOUT preview ============================ */
  .os-row.locked .os-tr-lock{opacity:1}
  .ckpage{min-height:560px;background:var(--ck-page-bg);color:var(--ck-text);font-family:var(--ck-body-font);font-size:var(--ck-base-fs);font-weight:var(--ck-fw-b)}
  .ckwrap{margin:0 auto;display:flex;align-items:flex-start;padding:32px 20px 80px}
  .ckwrap.mob{display:block}
  .ckcol{min-width:0}
  /* the left form column is transparent: the whole left area shows Page background (.ckpage bg),
     and form components sit on top with no surface of their own */
  .ckcol.main{display:flex;flex-direction:column;gap:var(--ck-section-gap);padding:28px}
  .ckpage.mob .ckwrap.mob>.os-sec{margin-bottom:var(--ck-section-gap)}
  .ckpage.mob .ckwrap.mob>.os-sec:last-child{margin-bottom:0}
  .cksec{font-size:var(--ck-base-fs)}
  .ck-h{font-family:var(--ck-heading-font);font-size:var(--ck-heading-fs);font-weight:var(--ck-fw-h);color:var(--ck-text);margin:0 0 14px}
  /* fields */
  .ck-field{margin-bottom:12px}
  .ck-field:last-child{margin-bottom:0}
  .ck-input{height:var(--ck-input-h);border:1px solid var(--ck-input-border);border-radius:var(--ck-input-radius);background:var(--ck-input-bg);color:var(--ck-input-text);padding:0 14px;font-size:var(--ck-base-fs);font-family:inherit;width:100%;outline:none;box-sizing:border-box}
  .ck-input::placeholder{color:var(--ck-ph)}
  .ck-input:focus{border-color:var(--ck-input-focus)}
  .ck-float{position:relative;display:block;min-width:0}
  .ck-float-label{position:absolute;z-index:1;top:50%;left:14px;max-width:calc(100% - 28px);color:var(--ck-ph);font-size:var(--ck-base-fs);line-height:1;transform:translateY(-50%);transform-origin:left top;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;transition:top .12s ease,transform .12s ease,font-size .12s ease}
  .ck-float .ck-input{padding:14px 14px 0}
  .ck-float .ck-input::placeholder{color:transparent}
  .ck-float:focus-within .ck-float-label,.ck-float.has-value .ck-float-label,.ck-float:has(.ck-input:not(:placeholder-shown)) .ck-float-label{top:7px;font-size:10.5px;transform:none}
  .ck-phone .ck-float,.ck-coupon .ck-float{flex:1}
  .ck-select{-webkit-appearance:none;appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center}
  .ck-field-phone{margin-top:14px}
  .ck-phone{display:flex;gap:8px}
  .ck-phone-cc{flex:0 0 auto;min-width:58px;display:inline-flex;align-items:center;justify-content:center;height:var(--ck-input-h);padding:0 12px;border:1px solid var(--ck-input-border);border-radius:var(--ck-input-radius);background:#f6f6f7;color:var(--ck-input-text);font-size:var(--ck-base-fs);white-space:nowrap;box-sizing:border-box}
  .ck-phone-num{flex:1}
  .ck-row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .ck-row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
  .ckpage.mob .ck-row3{grid-template-columns:1fr 1fr}
  .ck-link{color:var(--ck-accent);font-size:var(--ck-small-fs);cursor:pointer;text-decoration:none}
  .ck-link:hover{text-decoration:underline}
  .ck-contact .ck-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
  .ck-check{display:flex;gap:8px;align-items:center;font-size:var(--ck-small-fs);color:var(--ck-muted);cursor:pointer}
  .ck-check input{accent-color:var(--ck-accent);width:16px;height:16px}
  /* header */
  .ck-header{width:100%}
  .ck-header.divline{border-bottom:1px solid var(--ck-divider)}
  .ck-header-in{margin:0 auto;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;padding:0 20px;box-sizing:border-box}
  /* desktop: align the logo with the left form content (wrap 20 + main 28) and the cart with
     the summary content right edge (wrap 20 + summary 8) */
  .ckpage:not(.mob) .ck-header-in{padding:0 28px 0 48px}
  .ck-h-slot{display:flex;align-items:center;min-width:0}
  .ck-h-slot.start{justify-content:flex-start;gap:16px}
  .ck-h-slot.center{justify-content:center;flex-direction:column;text-align:center;gap:3px}
  .ck-h-slot.end{justify-content:flex-end;gap:16px}
  .ck-logo{font-weight:700;font-size:22px;letter-spacing:.18em}
  .ck-trust{font-size:var(--ck-small-fs);letter-spacing:.14em;text-transform:uppercase}
  .ck-h-contact{display:flex;flex-direction:column;align-items:flex-end;gap:2px;font-size:var(--ck-small-fs);line-height:1.45}
  .ck-h-cc-links{display:flex;align-items:center;gap:10px}
  .ck-h-contact a{text-decoration:none}
  .ck-h-ct{font-size:11px;text-transform:uppercase;letter-spacing:.08em;opacity:.85}
  .ck-h-secure{display:inline-flex;align-items:center;gap:6px;font-size:var(--ck-small-fs);letter-spacing:.04em}
  .ck-h-secure svg{flex:none}
  .ck-h-cart{display:inline-flex;align-items:center;cursor:pointer}
  .ck-header.off{background:var(--ck-page-bg)!important;border-bottom:1px dashed var(--ck-divider)}
  /* express */
  .ck-exp-h{font-size:var(--ck-small-fs);color:var(--ck-muted);text-align:center;margin-bottom:10px}
  .ck-exp-btns{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
  .ck-exp-btn{height:46px;border-radius:var(--ck-btn-radius);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:13px;border:0;cursor:pointer}
  .ck-exp-btn.shoppay{background:#5a31f4}.ck-exp-btn.paypal{background:#ffc439;color:#003087}.ck-exp-btn.gpay{background:#000}
  .ck-or{display:flex;align-items:center;gap:14px;color:var(--ck-muted);font-size:var(--ck-small-fs);margin-top:16px;text-transform:uppercase;letter-spacing:.1em}
  .ck-or::before,.ck-or::after{content:'';flex:1;height:1px;background:var(--ck-divider)}
  /* shipping method */
  .ck-radio-list{border:1px solid var(--ck-input-border);border-radius:var(--ck-input-radius);overflow:hidden}
  .ck-radio{display:flex;align-items:center;gap:12px;padding:14px;border-bottom:1px solid var(--ck-input-border);cursor:pointer;color:var(--ck-text)}
  .ck-radio:last-child{border-bottom:0}
  .ck-radio.sel{box-shadow:inset 0 0 0 2px var(--ck-sel-border,var(--ck-accent))}
  .ck-radio .dot{width:18px;height:18px;border-radius:50%;border:2px solid var(--ck-input-border);flex:none;position:relative}
  .ck-radio.sel .dot{border-color:var(--ck-sel-border,var(--ck-accent))}
  .ck-radio.sel .dot::after{content:'';position:absolute;inset:3px;border-radius:50%;background:var(--ck-sel-border,var(--ck-accent))}
  .ck-radio .nm{flex:1;display:flex;flex-direction:column}
  .ck-radio .eta{font-size:var(--ck-small-fs);color:var(--ck-muted)}
  .ck-radio .pr{font-weight:600}
  .ck-empty{padding:18px;border:1px dashed var(--ck-input-border);border-radius:var(--ck-input-radius);color:var(--ck-muted);font-size:var(--ck-small-fs);text-align:center;line-height:1.5}
  /* payment */
  .ck-pay-note{font-size:var(--ck-small-fs);color:var(--ck-muted);margin-bottom:10px}
  .ck-pay-list{border:1px solid var(--ck-input-border);border-radius:var(--ck-input-radius);overflow:hidden}
  .ck-pay-opt{border-bottom:1px solid var(--ck-input-border)}
  .ck-pay-opt:last-child{border-bottom:0}
  .ck-pay-head{display:flex;align-items:center;gap:12px;padding:14px;cursor:pointer}
  .ck-pay-head .dot{width:18px;height:18px;border-radius:50%;border:2px solid var(--ck-input-border);flex:none;position:relative}
  .ck-pay-opt.sel .ck-pay-head .dot{border-color:var(--ck-accent)}
  .ck-pay-opt.sel .ck-pay-head .dot::after{content:'';position:absolute;inset:3px;border-radius:50%;background:var(--ck-accent)}
  .ck-pay-head .nm{font-weight:500}
  .ck-pay-card{color:var(--ck-muted);flex:none}
  .ck-pay-body{padding:0 14px 14px;display:none;flex-direction:column;gap:12px}
  .ck-pay-opt.sel .ck-pay-body{display:flex}
  .ck-cardnum{position:relative}
  .ck-cardnum .ck-input{padding-right:150px}
  .ck-cardnum .ck-cardbrands{position:absolute;right:12px;top:50%;transform:translateY(-50%)}
  .ck-cardbrands{display:flex;gap:5px;margin-left:auto}
  .ckbrand{height:20px;padding:0 5px;border-radius:3px;font-size:9px;line-height:20px;font-weight:800;letter-spacing:.02em;color:#fff;display:inline-block}
  .ckbrand.visa{background:#1a1f71}.ckbrand.mc{background:#eb001b}.ckbrand.amex{background:#1d7fd6}.ckbrand.disc{background:#f37021}
  .ckbrand.disc span{color:#fff}
  /* cta — color/radius come from per-component CSS vars (which fall back to theme) */
  .ck-cta-btn{height:var(--ck-btn-h);border:0;text-transform:var(--ck-btn-tt);font-weight:700;font-size:15px;letter-spacing:.02em;cursor:pointer;font-family:inherit;background:var(--cta-bg,var(--ck-btn-bg));color:var(--cta-text,var(--ck-btn-text));border-radius:var(--cta-radius,var(--ck-btn-radius))}
  .ck-cta-btn:hover{background:var(--ck-btn-hover)}
  .ck-cta-btn.loading{opacity:.7;cursor:default}
  /* policy */
  .ck-policy{display:flex;flex-wrap:wrap;gap:8px 18px;padding-top:16px;border-top:1px solid var(--ck-divider)}
  .ck-policy a{color:var(--ck-accent);font-size:var(--ck-small-fs);text-decoration:none;cursor:pointer}
  .ck-policy.med a{font-size:var(--ck-base-fs)}
  .ck-policy a:hover{text-decoration:underline}
  .ck-policy-empty{font-size:var(--ck-small-fs);color:var(--ck-muted);padding-top:16px;border-top:1px dashed var(--ck-divider)}
  /* order summary — Shopify-style full-bleed gray right column */
  .ck-summary{background:var(--ck-sum-bg);color:var(--ck-sum-text);border-radius:10px;padding:22px}
  /* desktop: surface is the bleed band behind .ckcol.side; the panel is transparent */
  .ckpage:not(.mob){overflow:hidden}
  .ckpage:not(.mob) .ckwrap{position:relative;align-items:stretch}
  .ckpage:not(.mob) .ckcol.side{position:relative;display:flex;flex-direction:column}
  .ckpage:not(.mob) .ckcol.side::before{content:'';position:absolute;top:-32px;bottom:-80px;left:0;right:-9999px;background:var(--ck-sum-bg);border-left:1px solid var(--ck-divider);z-index:0;pointer-events:none}
  .ckpage:not(.mob) .ckcol.side>*{position:relative;z-index:1}
  /* the summary section fills the whole right column; the select/hover frame is drawn on the
     full-bleed band (not the inner column) so it covers the entire right region to the page edge */
  .ckpage:not(.mob) .ckcol.side>.os-sec{flex:none;outline:none!important}
  .ckpage:not(.mob) .ckcol.side:has(>.os-sec:hover)::before{outline:2px solid #b9d2ff;outline-offset:-2px}
  .ckpage:not(.mob) .ckcol.side:has(>.os-sec.active)::before{outline:2px solid var(--brand);outline-offset:-2px}
  .ckpage:not(.mob) .ck-summary{background:transparent;border-radius:0;padding:38px 8px 40px 32px;position:sticky;top:24px}
  /* commerce components dropped into the Order Summary zone — keep them aligned with the
     summary content and sized for the narrower gray right column (instead of inheriting the
     wide left-column layout). */
  .cksz{display:flex;flex-direction:column;gap:var(--ck-section-gap)}
  .ckpage:not(.mob) .cksz{padding:4px 8px 8px 32px}
  .ckpage:not(.mob) .cksz .ckup-track:not(.grid) .ckup-card{flex:0 0 86%}
  .ckpage:not(.mob) .cksz .ckup-card{padding:12px}
  .ckpage.mob .cksz{margin-top:var(--ck-section-gap)}
  /* full-bleed bottom band (Content PRD §5.1): Testimonials then Footer at the very end */
  .ckbottom{display:flex;flex-direction:column;width:100%}
  .ckbottom>.os-sec{width:100%}
  .ckbottom .cktm{padding:32px 24px}
  .ckpage.mob .ckbottom .cktm{padding:24px 18px}
  .ck-sum-h{font-family:var(--ck-heading-font);font-size:var(--ck-heading-fs);font-weight:var(--ck-fw-h);margin:0 0 16px}
  .ck-blk{position:relative}
  .ck-lines{margin-bottom:4px}
  .ck-line{display:flex;gap:14px;align-items:center;margin-bottom:18px}
  .ck-line:last-child{margin-bottom:2px}
  .ck-line-img{width:64px;height:64px;border-radius:8px;background-size:cover;background-position:center;position:relative;flex:none;border:1px solid var(--ck-divider)}
  .ck-line-qty{position:absolute;top:-9px;right:-9px;min-width:20px;height:20px;border-radius:50%;background:#5c5f62;color:#fff;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;padding:0 5px;box-shadow:0 0 0 2px var(--ck-sum-bg)}
  .ck-line-info{flex:1;min-width:0}
  .ck-line-t{font-size:var(--ck-base-fs);font-weight:500;line-height:1.35}
  .ck-line-v{font-size:var(--ck-small-fs);color:var(--ck-sum-muted);margin-top:2px}
  .ck-line-pr{font-weight:500;white-space:nowrap;display:flex;flex-direction:column;align-items:flex-end;gap:1px}
  .ck-line-cmp{color:var(--ck-sum-muted);text-decoration:line-through;font-size:var(--ck-small-fs);font-weight:400}
  .ck-line-deal{display:flex;align-items:center;gap:5px;margin-top:4px;font-size:var(--ck-small-fs);color:var(--ck-sum-muted)}
  .ck-line-deal .ck-tag-i{flex:none}
  /* Item 3 — subscription cadence tag (muted, tag icon + "Delivery every … (−$x)") */
  .ck-line-sub{display:flex;align-items:center;gap:5px;margin-top:4px;font-size:var(--ck-small-fs);color:var(--ck-sum-muted)}
  .ck-line-sub .ck-tag-i{flex:none}
  /* Item 3 — bundle parent (black "Bundle" badge in place of the thumb) + children */
  .ck-line--bundle{align-items:flex-start;margin-bottom:14px}
  .ck-line-bundle-badge{flex:none;width:64px;min-height:34px;display:inline-flex;align-items:center;justify-content:center;background:#111;color:#fff;font-size:12px;font-weight:700;border-radius:8px;padding:6px 10px;box-sizing:border-box}
  .ck-bundle-child{display:flex;gap:12px;align-items:center;margin:0 0 14px 24px}
  .ck-bundle-child:last-child{margin-bottom:2px}
  .ck-line-img.sm{width:44px;height:44px;border-radius:8px}
  .ck-line-img.sm .ck-line-qty{top:-8px;right:-8px;min-width:18px;height:18px;font-size:10px}
  .ck-line-included{display:inline-block;margin-right:8px;padding:2px 8px;border-radius:6px;background:#fff2e3;color:#d9822b;font-size:11px;font-weight:700;vertical-align:middle;line-height:1.5}
  .ck-itemc{color:var(--ck-sum-muted);font-weight:400}
  .ck-savings{display:flex;align-items:center;gap:6px;margin-top:12px;font-size:var(--ck-small-fs);color:#2e7d32}
  .ck-coupon{display:flex;gap:8px;margin:0;padding:20px 0;border-top:1px solid var(--ck-divider)}
  .ck-coupon .ck-input{flex:1}
  .ck-coupon-btn{height:var(--ck-input-h);padding:0 17px;border:0;border-radius:var(--ck-input-radius);background:#e3e3e3;color:#8a8a8a;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;transition:background .12s,color .12s}
  .ck-coupon-btn:hover{background:#d8d8d8;color:#5b5b5b}
  .ck-totals{border-top:1px solid var(--ck-divider);padding-top:18px}
  .ck-trow{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;font-size:var(--ck-base-fs)}
  .ck-trow .lbl{color:var(--ck-sum-text);display:inline-flex;align-items:center;gap:6px}
  .ck-trow .amt{color:var(--ck-sum-text)}
  .ck-trow.ck-disc .amt{color:var(--ck-sum-text)}
  /* Read-only applied discount code chip (Thank you — coupon input is hidden there). */
  .ck-trow.ck-disc-code{margin-bottom:8px}
  .ck-code-chip{display:inline-flex;align-items:center;gap:6px;background:var(--ck-divider);color:var(--ck-sum-text);border-radius:999px;padding:4px 10px;font-size:var(--ck-small-fs);font-weight:600}
  .ck-code-chip .ck-tag-i{flex:none}
  .ck-code-chip .code{letter-spacing:.02em;text-transform:uppercase}
  .ck-info{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;border:1px solid var(--ck-sum-muted);color:var(--ck-sum-muted);font-size:10px;line-height:1;cursor:help}
  .ck-trow.grand{font-size:15px;font-weight:600;margin-top:4px;padding-top:18px;border-top:1px solid var(--ck-divider);margin-bottom:0;align-items:baseline}
  .ck-trow.grand .amt{font-size:22px;font-weight:700}
  .ck-trow.grand .cur{font-size:12px;font-weight:600;color:var(--ck-sum-muted);margin-right:5px;text-transform:uppercase;letter-spacing:.02em}
  /* mobile order recap — collapsed = Shopify "Add discount" pill + total bar; expanded = full summary */
  .ck-summary.mob{border-radius:12px;padding:16px;border:1px solid var(--ck-divider)}
  /* Thank-you mobile: the single Order Summary sits full-bleed at the very top (under the
     header), edge-to-edge with a bottom divider instead of the card border/radius. */
  .ckpage.ty.mob .ty-topsum .os-sec{margin:0}
  .ckpage.ty.mob .ty-topsum .ck-summary.mob{border:0;border-bottom:1px solid var(--ck-divider);border-radius:0;padding:14px var(--ck-mob-pad,18px)}
  .ck-msum-adddisc{display:inline-flex;align-items:center;gap:7px;background:none;border:1px solid var(--ck-divider);border-radius:9px;padding:9px 13px;margin-bottom:14px;font-size:var(--ck-small-fs);font-weight:500;color:var(--ck-text);cursor:pointer;font-family:inherit;line-height:1}
  .ck-msum-adddisc .ck-tag-i{color:var(--ck-sum-muted)}
  .ck-summary.mob:not(.collapsed) .ck-msum-adddisc{display:none}
  .ck-msum-bar{display:flex;align-items:center;gap:12px;cursor:pointer}
  .ck-msum-thumb{width:50px;height:50px;border-radius:8px;background-size:cover;background-position:center;border:1px solid var(--ck-divider);flex:none}
  .ck-summary.mob:not(.collapsed) .ck-msum-thumb{display:none}
  .ck-msum-meta{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
  .ck-msum-lbl{font-size:var(--ck-base-fs);font-weight:600;color:var(--ck-text)}
  .ck-summary.mob:not(.collapsed) .ck-msum-lbl{font-size:16px}
  .ck-msum-items{font-size:var(--ck-small-fs);color:var(--ck-muted)}
  .ck-msum-amt{display:flex;flex-direction:column;align-items:flex-end;gap:3px;text-align:right}
  .ck-summary.mob:not(.collapsed) .ck-msum-amt{display:none}
  .ck-msum-amt .amt{font-weight:700;font-size:18px;display:inline-flex;align-items:baseline;gap:6px}
  .ck-msum-amt .cur{font-size:12px;font-weight:600;color:var(--ck-sum-muted);text-transform:uppercase}
  .ck-msum-amt .ck-chev{font-size:12px;font-weight:400;color:var(--ck-sum-muted);display:inline-block}
  .ck-msum-sav{display:flex;align-items:center;gap:5px;font-size:var(--ck-small-fs);color:#2e7d32}
  .ck-chev-exp{font-size:13px;color:var(--ck-sum-muted);flex:none;display:inline-block;transform:rotate(180deg)}
  .ck-when-collapsed{display:none}
  .ck-summary.mob.collapsed .ck-when-collapsed{display:inline}
  .ck-summary.mob.collapsed .ck-when-expanded{display:none}
  .ck-summary.mob .ck-summary-body{margin-top:16px}
  .ck-summary.mob.collapsed .ck-summary-body{display:none}
  /* Thank-you Shopify-style collapsed header: "Order summary ⌄" left, total right (no
     thumbnail / item count). Only emitted on the Thank-you page (snapshot). */
  .ck-tymsum-head{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;background:none;border:0;cursor:pointer;font-family:inherit;text-align:left;padding:0}
  .ck-tymsum-title{display:inline-flex;align-items:center;gap:8px;font-size:var(--ck-base-fs);font-weight:500;color:var(--ck-text)}
  .ck-tymsum-chev{font-size:12px;color:var(--ck-sum-muted);transition:transform .15s}
  .ck-summary.mob.tymob:not(.collapsed) .ck-tymsum-chev{transform:rotate(180deg)}
  .ck-tymsum-total{font-size:18px;font-weight:700;display:inline-flex;align-items:baseline;gap:6px}
  .ck-tymsum-total .cur{font-size:12px;font-weight:600;color:var(--ck-sum-muted);text-transform:uppercase}
  .ck-summary.mob .ck-savings{text-transform:uppercase;font-weight:600;letter-spacing:.02em}
  .ck-line-flag{display:inline-block;margin-left:8px;padding:1px 7px;border-radius:999px;background:var(--ck-divider);color:var(--ck-sum-muted);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.03em;vertical-align:middle}
  /* Item 1 — signed-in Contact account chip + kebab popover */
  .ck-acct{position:relative;display:flex;align-items:center;gap:12px;border:1px solid var(--ck-input-border);border-radius:var(--ck-input-radius);background:var(--ck-input-bg);padding:10px 12px;box-sizing:border-box}
  .ck-acct-av{flex:none;width:34px;height:34px;border-radius:50%;background:var(--ck-accent);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;text-transform:uppercase}
  .ck-acct-email{flex:1;min-width:0;font-size:var(--ck-base-fs);color:var(--ck-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ck-acct-kebab{flex:none;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border:0;background:none;color:var(--ck-muted);border-radius:6px;cursor:pointer}
  .ck-acct-kebab:hover{background:rgba(0,0,0,.05);color:var(--ck-text)}
  .ck-acct-pop{position:absolute;top:calc(100% + 6px);right:8px;z-index:5;min-width:140px;background:#fff;border:1px solid var(--ck-input-border);border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.12);padding:5px}
  .ck-acct-pop[hidden]{display:none}
  .ck-acct-pop-item{display:block;width:100%;text-align:left;background:none;border:0;padding:9px 12px;border-radius:6px;font-family:inherit;font-size:var(--ck-base-fs);color:var(--ck-text);cursor:pointer}
  .ck-acct-pop-item:hover{background:rgba(0,0,0,.05)}
  /* Item 1 — signed-in Delivery: bordered account card (Ship to + Shipping accordions) */
  .ck-addr-card{border:1px solid var(--ck-input-border);border-radius:var(--ck-input-radius);overflow:hidden}
  .ck-accord+.ck-accord{border-top:1px solid var(--ck-input-border)}
  .ck-accord-head{display:flex;align-items:flex-start;gap:16px;width:100%;padding:16px;background:none;border:0;cursor:pointer;font-family:inherit;text-align:left}
  .ck-accord-lbl{flex:0 0 auto;min-width:72px;color:var(--ck-muted);font-size:var(--ck-base-fs);padding-top:1px}
  .ck-accord-val{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
  .ck-accord-val .nm{font-weight:600;color:var(--ck-text);line-height:1.4}
  .ck-accord-val .ad{color:var(--ck-text);line-height:1.4}
  .ck-accord-chev{flex:none;color:var(--ck-muted);font-size:13px;line-height:1;padding-top:2px;transition:transform .15s}
  .ck-accord.open .ck-accord-chev{transform:rotate(180deg)}
  .ck-accord.open .ck-accord-val{display:none}
  .ck-accord-body{display:none;padding:0 16px 14px}
  .ck-accord.open .ck-accord-body{display:block}
  .ck-addr-list{display:flex;flex-direction:column;gap:2px}
  .ck-addr-row{position:relative;display:flex;align-items:flex-start;gap:12px;padding:12px;border-radius:10px;cursor:pointer}
  .ck-addr-row.sel{background:#eef4ff}
  .ck-addr-dot{flex:none;display:inline-flex;align-items:center;padding-top:1px}
  .ck-addr-dot input{width:18px;height:18px;margin:0;accent-color:#2b74ff;cursor:pointer}
  .ck-addr-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;padding-right:28px}
  .ck-addr-name{font-weight:600;color:var(--ck-text);line-height:1.35}
  .ck-addr-sub{color:var(--ck-text);font-size:var(--ck-base-fs);line-height:1.35}
  .ck-addr-pill{align-self:flex-start;display:inline-block;background:#4a4d52;color:#fff;font-size:11px;font-weight:600;border-radius:6px;padding:3px 9px;margin-top:2px}
  .ck-addr-kebab{position:absolute;top:8px;right:6px;flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:0;background:none;color:var(--ck-muted);border-radius:6px;cursor:pointer}
  .ck-addr-kebab:hover{background:rgba(0,0,0,.06);color:var(--ck-text)}
  .ck-mini-pop{position:absolute;top:36px;right:6px;z-index:10;min-width:96px;background:#fff;border:1px solid var(--ck-input-border);border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.14);padding:5px;display:flex;flex-direction:column}
  .ck-mini-pop button{display:block;width:100%;text-align:left;background:none;border:0;padding:8px 12px;border-radius:6px;font-family:inherit;font-size:var(--ck-base-fs);cursor:pointer}
  .ck-mini-edit{color:#2b74ff}
  .ck-mini-del{color:#e11900}
  .ck-mini-pop button:hover{background:rgba(0,0,0,.05)}
  .ck-addr-add{display:inline-flex;align-items:center;gap:8px;margin:6px 0 2px;padding:10px 12px;color:#2b74ff;font-size:var(--ck-base-fs);font-weight:500;cursor:pointer}
  .ck-addr-add .plus{font-size:17px;line-height:1;font-weight:400}
  /* Item 1 — Add / Edit address modal (centered overlay on top of the whole preview) */
  .pop-layer.ck-modal-layer{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);pointer-events:auto;padding:20px;box-sizing:border-box}
  .ck-modal{pointer-events:auto;width:100%;max-width:620px;max-height:92vh;overflow:auto;background:#fff;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.32);font-family:var(--ck-body-font);font-size:var(--ck-base-fs);color:var(--ck-text)}
  .ck-modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 4px}
  .ck-modal-head h4{margin:0;font-family:var(--ck-heading-font);font-size:20px;font-weight:700;color:var(--ck-text)}
  .ck-modal-x{border:0;background:none;color:var(--ck-muted);cursor:pointer;display:inline-flex;padding:4px}
  .ck-modal-x:hover{color:var(--ck-text)}
  .ck-modal-body{display:flex;flex-direction:column;gap:12px;padding:16px 20px}
  .ck-fl{position:relative;display:flex;flex-direction:column;min-height:48px;border:1px solid var(--ck-input-border);border-radius:9px;padding:0 12px;box-sizing:border-box;background:#fff}
  .ck-fl-lbl{position:absolute;z-index:1;top:50%;left:12px;max-width:calc(100% - 24px);font-size:14px;color:var(--ck-muted);line-height:1;transform:translateY(-50%);transform-origin:left top;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;transition:top .12s ease,transform .12s ease,font-size .12s ease}
  .ck-fl:focus-within .ck-fl-lbl,.ck-fl.has-value .ck-fl-lbl{top:7px;font-size:11px;transform:none}
  .ck-fl-in{height:46px;border:0;outline:none;background:none;font-family:inherit;font-size:14px;color:var(--ck-text);padding:14px 0 0;width:100%;box-sizing:border-box}
  .ck-fl-wrap{position:relative;display:flex;align-items:center;height:46px}
  .ck-fl-wrap .ck-fl-in{-webkit-appearance:none;appearance:none;padding-right:22px}
  .ck-fl-chev{position:absolute;right:0;top:2px;color:var(--ck-muted);font-size:12px;pointer-events:none}
  .ck-fl-ricon{position:absolute;right:0;top:50%;transform:translateY(-50%);color:var(--ck-muted);display:inline-flex}
  .ck-fl-row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .ck-fl-row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
  .ck-modal-check{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--ck-text);cursor:pointer;margin-top:2px}
  .ck-modal-check input{width:18px;height:18px;accent-color:#2b74ff;cursor:pointer}
  .ck-modal-foot{display:flex;gap:12px;padding:4px 20px 20px}
  .ck-modal-cancel{flex:0 0 40%;height:48px;border:1px solid var(--ck-input-border);border-radius:9px;background:#fff;color:#2b74ff;font-weight:600;font-size:15px;font-family:inherit;cursor:pointer}
  .ck-modal-cancel:hover{background:#f6f8ff}
  .ck-modal-save{flex:1;height:48px;border:0;border-radius:9px;background:#2b74ff;color:#fff;font-weight:700;font-size:15px;font-family:inherit;cursor:pointer}
  .ck-modal-save:hover{background:#1f5fe0}
  @media(max-width:600px){.ck-fl-row3,.ck-fl-row2{grid-template-columns:1fr}.ck-modal-foot{flex-direction:column-reverse}.ck-modal-cancel{flex:1}}
  /* Item 3 — shipping method description line */
  .ck-radio .nm-t{color:var(--ck-text)}
  .ck-radio .desc{font-size:var(--ck-small-fs);color:var(--ck-muted);margin-top:2px}
  /* Item 2 — applied coupon chip + inline error */
  .ck-coupon-applied{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0;padding:20px 0;border-top:1px solid var(--ck-divider)}
  /* Fix 0 — chip rendered as a row BELOW the always-visible discount input */
  .ck-coupon-applied.below{border-top:0;padding:0 0 20px;margin-top:-8px}
  .ck-coupon-chip{display:inline-flex;align-items:center;gap:7px;background:var(--ck-divider);color:var(--ck-sum-text);border-radius:999px;padding:6px 8px 6px 12px;font-size:var(--ck-small-fs);font-weight:600}
  .ck-coupon-chip .ck-tag-i{flex:none}
  .ck-coupon-chip .code{letter-spacing:.02em;text-transform:uppercase}
  .ck-coupon-x{flex:none;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border:0;border-radius:50%;background:rgba(0,0,0,.12);color:var(--ck-sum-text);font-size:14px;line-height:1;cursor:pointer;font-family:inherit}
  .ck-coupon-x:hover{background:rgba(0,0,0,.22)}
  .ck-coupon-off{font-size:var(--ck-base-fs);color:var(--ck-sum-text);white-space:nowrap}
  .ck-coupon-err{margin:-8px 0 20px;font-size:var(--ck-small-fs);color:var(--ck-error)}
  .ck-coupon-err[hidden]{display:none}
  /* Thank-you page — the Continue shopping + Contact us action row (PC: Contact us
     left, Continue shopping right; mobile: button full-width then contact below). */
  .ty-actions{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
  .ty-actions>.os-sec{margin:0}
  .ckpage.mob .ty-actions{display:flex;flex-direction:column-reverse;align-items:stretch;gap:14px}
  /* Thank-you page — Policy links sit in a centered column aligned with the page content
     (max-width set inline to match .ckwrap; padding matches the .ckcol.main inset), so the
     divider + links line up with the content above. Padding beneath gives comfortable
     breathing room below the links before the page edge / Footer, matching Shopify. Scoped
     to .ty so the Checkout layout is unchanged; the policytop band + Footer stay full-bleed. */
  .ckpage.ty .ty-policywrap{margin:0 auto;width:100%;box-sizing:border-box;padding:0 48px 56px}
  .ckpage.ty .ty-policywrap>.os-sec{width:100%}
  .ckpage.ty.mob .ty-policywrap{padding:0 var(--ck-mob-pad,18px) 40px}
  `;
})();
