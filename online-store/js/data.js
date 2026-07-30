/* BestShopio Admin · Online store / Theme editor — data layer.
   Ported from the Cursor canvas package (reference/canvases-share 2):
     - theme-editor.canvas.tsx   -> editor model (3-snapshot state, section/block tree, catalog)
     - theme-settings.canvas.tsx -> the 8 global setting groups (keys/defaults/options verbatim)
     - <section>.canvas.tsx       -> per-section schema + renderer (live in js/sections/<kind>.js)
   This file holds only DECLARATIVE data; the engine lives in app.js, section defs in sections/*.js.
   Page seeds are "thin" ({id,kind[,settings overrides][,blocks]}) — app.js materialises full
   settings from each section's defaults() at editor start, so defaults have a single source. */
(function () {
  // ---------- storefront imagery (Unsplash, same style as the rest of the prototype) ----------
  const IMG = {
    hero1: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80',
    hero2: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80',
    iwt:   'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1100&q=80',
    cat1:  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=700&q=80',
    cat2:  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80',
    cat3:  'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&w=700&q=80',
    cat4:  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=80',
    p1: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
    p2: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80',
    p3: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
    p4: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80',
    p5: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=600&q=80',
    p6: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80',
    av1: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    av2: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    av3: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    blog1: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
    blog2: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    svcShip: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=300&q=80',
    svcVip: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=300&q=80',
  };

  // ---------- theme list ("My theme" tab) ----------
  const THEMES = [
    {
      id: 1, handle: 'aura', title: 'Aura',
      pc_image: IMG.hero1, h5_image: IMG.hero2,
      created_time: '2026-05-06 04:13:15', updated_time: '2026-06-12 17:42:08',
    },
  ];

  // ---------- page-type templates (theme-editor PAGE_OPTIONS) ----------
  // `multi:true` => this page type can hold several named templates (Shopify shows a
  // submenu + "Assigned to N …" + Create template). Single types keep exactly one
  // template and are picked directly (no submenu). `noun` labels the assignment count.
  const PAGE_OPTIONS = [
    { value: 'home',        label: 'Home page' },
    { value: 'product',     label: 'Products',        multi: true, noun: 'products' },
    { value: 'collection',  label: 'Collections',     multi: true, noun: 'collections' },
    { value: 'collections', label: 'Collections list' },
  ];

  // ---------- Add-Section catalog (Shopify-style popover; 5 groups) ----------
  // kind === null  => "coming soon" stub (kept so coverage count reads true to the PRD).
  const CATALOG = [
    { id: 'collection', label: 'Collection', entries: [
      { kind: 'collection-banner', name: 'Collection banner', desc: 'Hero image + copy at the top of a collection' },
      { kind: 'collection-list', name: 'Collection list', desc: 'Sub-category cards / collection navigation strip' },
      { kind: 'collection-page', name: 'Collection page', desc: 'Product feed — filters, sort, grid or list' },
      { kind: 'list-collections', name: 'List collections', desc: 'All-collections grid for the /collections page' },
    ] },
    { id: 'hero', label: 'Hero & banners', entries: [
      { kind: 'slideshow', name: 'Slideshow', desc: 'Full-width rotating banners with CTAs' },
    ] },
    { id: 'products', label: 'Products & collections', entries: [
      { kind: 'image-link-blocks', name: 'Image link blocks', desc: 'Tappable collection / category tiles' },
      { kind: 'featured-collection', name: 'Featured collection', desc: 'Tabbed product grid from a collection' },
      { kind: 'featured-product', name: 'Featured product', desc: 'In-page buy box for one product' },
    ] },
    { id: 'content', label: 'Content & media', entries: [
      { kind: 'media-with-text', name: 'Media with text', desc: 'Image / video beside copy, alternating' },
      { kind: 'text-with-icon', name: 'Text with icon', desc: 'Row of icon + text trust badges' },
      { kind: 'video-feed', name: 'Video feed', desc: 'Shoppable short-video carousel' },
      { kind: 'before-after-image', name: 'Before / after image', desc: 'Draggable comparison slider' },
      { kind: 'blog-posts', name: 'Blog posts', desc: 'Latest articles from a blog' },
      { kind: 'media-grid', name: 'Media grid', desc: 'Image / video cards with captions' },
      { kind: 'feature-cards', name: 'Feature cards', desc: 'Icon + title + text benefit cards' },
    ] },
    { id: 'social', label: 'Social proof', entries: [
      { kind: 'testimonial', name: 'Testimonial', desc: 'Customer review cards' },
      { kind: 'ugc-gallery', name: 'UGC gallery', desc: 'User photo wall' },
      { kind: 'as-seen-in', name: 'As seen in', desc: 'Press / media logo strip' },
    ] },
    { id: 'engagement', label: 'Engagement & utility', entries: [
      { kind: 'faq', name: 'FAQ', desc: 'Accordion questions + support panel' },
      { kind: 'newsletter', name: 'Newsletter', desc: 'Email capture block' },
      { kind: 'custom-html', name: 'Custom HTML', desc: 'Raw HTML embed' },
    ] },
  ];

  // ---------- Theme settings · 8 groups (verbatim from theme-settings.canvas.tsx) ----------
  // Row kinds: {sub} = subheading, {info} = helper line, otherwise a field descriptor.
  const FONT_HEAD = ['Playfair Display', 'DM Serif Display', 'Manrope', 'Inter', 'Georgia'].map((v) => ({ value: v, label: v }));
  const FONT_BODY = ['Inter', 'Manrope', 'Lato', 'Source Sans 3', 'system-ui'].map((v) => ({ value: v, label: v }));
  const SETTINGS_GROUPS = [
    { key: 'colors', name: 'Colors', desc: 'Brand, surface and status colors', open: true, fields: [
      { sub: 'Brand' },
      { key: 'primary_color', label: 'Primary color', control: 'color', default: '#103635', info: 'Brand color. Drives the announcement bar background in the preview.' },
      { key: 'secondary_color', label: 'Secondary color', control: 'color', default: '#666666', info: 'Used by secondary nav links and product vendor labels.' },
      { sub: 'Surface' },
      { key: 'page_background', label: 'Page background', control: 'color', default: '#FFFFFF' },
      { key: 'text_color', label: 'Body text', control: 'color', default: '#1A1A1A' },
      { key: 'heading_color', label: 'Heading text', control: 'color', default: '#103635' },
      { key: 'link_color', label: 'Link text', control: 'color', default: '#103635' },
      { key: 'border_color', label: 'Border', control: 'color', default: '#E5E5E5' },
      { key: 'footer_background', label: 'Footer background', control: 'color', default: '#103635', info: 'Background of the footer block. Pick a dark brand color for best contrast with white text.' },
      { sub: 'Status' },
      { key: 'sale_price_color', label: 'Sale price', control: 'color', default: '#D92D20', info: 'Used on sale badges and crossed-out prices.' },
      { key: 'error_color', label: 'Error / destructive', control: 'color', default: '#D92D20' },
      { key: 'success_color', label: 'Success', control: 'color', default: '#12B76A' },
    ] },
    { key: 'typography', name: 'Typography', desc: 'Font families, sizing and rhythm', open: true, fields: [
      { sub: 'Font families' },
      { key: 'heading_font', label: 'Heading font', control: 'select', options: FONT_HEAD, default: 'Playfair Display' },
      { key: 'body_font', label: 'Body font', control: 'select', options: FONT_BODY, default: 'Inter' },
      { sub: 'Sizing' },
      { key: 'base_font_size', label: 'Base font size', control: 'range', min: 12, max: 20, step: 1, unit: 'px', default: 16, info: 'Scales every body & heading size proportionally.' },
      { key: 'heading_scale', label: 'Heading scale', control: 'select', default: 'large', info: 'Multiplies every heading size — applies to H1 / H2 / H3 alike.', options: [
        { value: 'small', label: 'Small (×0.85)' }, { value: 'medium', label: 'Medium (×1.00)' }, { value: 'large', label: 'Large (×1.20)' } ] },
      { sub: 'Weight & rhythm' },
      { key: 'heading_font_weight', label: 'Heading weight', control: 'range', min: 300, max: 900, step: 100, default: 700 },
      { key: 'body_font_weight', label: 'Body weight', control: 'range', min: 300, max: 700, step: 100, default: 400 },
      { key: 'line_height', label: 'Line height', control: 'range', min: 1.2, max: 2.0, step: 0.05, default: 1.5 },
      { key: 'letter_spacing', label: 'Letter spacing', control: 'range', min: -1, max: 3, step: 0.1, unit: 'px', default: 0 },
    ] },
    { key: 'buttons', name: 'Buttons', desc: 'Primary, secondary and shape', fields: [
      { sub: 'Primary button' },
      { key: 'primary_button_background', label: 'Background', control: 'color', default: '#103635' },
      { key: 'primary_button_text', label: 'Text', control: 'color', default: '#FFFFFF' },
      { sub: 'Secondary button' },
      { key: 'secondary_button_background', label: 'Background', control: 'color', default: 'transparent', allowTransparent: true },
      { key: 'secondary_button_text', label: 'Text', control: 'color', default: '#103635' },
      { sub: 'Shape' },
      { key: 'button_border_color', label: 'Border color', control: 'color', default: '#103635' },
      { key: 'button_border_width', label: 'Border width', control: 'range', min: 0, max: 4, step: 1, unit: 'px', default: 1 },
      { key: 'button_border_radius', label: 'Corner radius', control: 'range', min: 0, max: 40, step: 1, unit: 'px', default: 40, info: 'Capped at 40px — once radius ≥ height ÷ 2 the corners are fully pilled.' },
      { key: 'button_height', label: 'Height', control: 'range', min: 32, max: 64, step: 1, unit: 'px', default: 44 },
      { key: 'button_horizontal_padding', label: 'Horizontal padding', control: 'range', min: 8, max: 48, step: 1, unit: 'px', default: 24 },
      { key: 'button_text_transform', label: 'Label case', control: 'select', default: 'uppercase', options: [
        { value: 'none', label: 'None' }, { value: 'uppercase', label: 'UPPERCASE' }, { value: 'lowercase', label: 'lowercase' } ] },
    ] },
    { key: 'layout', name: 'Layout', desc: 'Page width, spacing and radius', fields: [
      { sub: 'Container' },
      { key: 'page_width', label: 'Max page width', control: 'range', min: 960, max: 1600, step: 10, unit: 'px', default: 1200 },
      { sub: 'Section spacing' },
      { key: 'section_spacing_desktop', label: 'Vertical gap · Desktop', control: 'range', min: 16, max: 160, step: 4, unit: 'px', default: 64 },
      { key: 'section_spacing_mobile', label: 'Vertical gap · Mobile', control: 'range', min: 8, max: 100, step: 2, unit: 'px', default: 40 },
      { sub: 'Grid gap' },
      { key: 'grid_gap_desktop', label: 'Column gap · Desktop', control: 'range', min: 8, max: 64, step: 2, unit: 'px', default: 24 },
      { key: 'grid_gap_mobile', label: 'Column gap · Mobile', control: 'range', min: 4, max: 40, step: 2, unit: 'px', default: 16 },
      { sub: 'Page padding' },
      { key: 'page_horizontal_padding_desktop', label: 'Horizontal padding · Desktop', control: 'range', min: 8, max: 80, step: 2, unit: 'px', default: 40 },
      { key: 'page_horizontal_padding_mobile', label: 'Horizontal padding · Mobile', control: 'range', min: 4, max: 40, step: 2, unit: 'px', default: 16 },
      { sub: 'Radius' },
      { key: 'image_border_radius', label: 'Image radius', control: 'range', min: 0, max: 40, step: 1, unit: 'px', default: 12 },
      { key: 'card_border_radius', label: 'Card radius', control: 'range', min: 0, max: 40, step: 1, unit: 'px', default: 12 },
    ] },
    { key: 'product_cards', name: 'Product cards', desc: 'Default product card visuals', fields: [
      { sub: 'Image' },
      { key: 'product_image_ratio', label: 'Image ratio', control: 'select', default: 'portrait', options: [
        { value: 'portrait', label: 'Portrait (3:4)' }, { value: 'square', label: 'Square (1:1)' }, { value: 'landscape', label: 'Landscape (4:3)' } ] },
      { key: 'product_image_fit', label: 'Image fit', control: 'select', default: 'cover', options: [
        { value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' } ] },
      { sub: 'Text' },
      { key: 'product_card_text_alignment', label: 'Text alignment', control: 'select', default: 'center', options: [
        { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' } ] },
      { key: 'product_title_size', label: 'Title size', control: 'select', default: 'medium', options: [
        { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' } ] },
      { sub: 'Defaults' },
      { info: 'These defaults apply to every Featured collection or product grid. Individual sections can override each toggle.' },
      { key: 'show_vendor_by_default', label: 'Show vendor', control: 'toggle', default: false },
      { key: 'show_rating_by_default', label: 'Show rating', control: 'toggle', default: true },
      { key: 'show_sale_badge_by_default', label: 'Show sale badge', control: 'toggle', default: true },
      { key: 'sale_badge_style', label: 'Sale badge style', control: 'select', default: 'solid', options: [
        { value: 'solid', label: 'Solid' }, { value: 'outline', label: 'Outline' } ] },
      { key: 'show_color_swatches_by_default', label: 'Show color swatches', control: 'toggle', default: true },
      { key: 'show_quick_add_by_default', label: 'Show quick-add button', control: 'toggle', default: false },
    ] },
    { key: 'forms', name: 'Forms', desc: 'Inputs across the storefront', fields: [
      { info: 'Click into either preview input to type — input_text, placeholder_color and the focus border react live.' },
      { sub: 'Color' },
      { key: 'input_background', label: 'Background', control: 'color', default: '#FFFFFF' },
      { key: 'input_text', label: 'Text', control: 'color', default: '#1A1A1A' },
      { key: 'placeholder_color', label: 'Placeholder', control: 'color', default: '#999999' },
      { key: 'input_border_color', label: 'Border (default)', control: 'color', default: '#E5E5E5' },
      { key: 'focus_border_color', label: 'Border (focused)', control: 'color', default: '#103635' },
      { sub: 'Shape' },
      { key: 'input_border_radius', label: 'Corner radius', control: 'range', min: 0, max: 40, step: 1, unit: 'px', default: 40 },
      { key: 'input_height', label: 'Height', control: 'range', min: 32, max: 64, step: 1, unit: 'px', default: 44 },
      { key: 'input_horizontal_padding', label: 'Horizontal padding', control: 'range', min: 8, max: 32, step: 1, unit: 'px', default: 16 },
    ] },
    { key: 'social_media', name: 'Social media', desc: 'URLs surfaced in Footer / Header', fields: [
      { info: 'Leave a field blank to hide that channel everywhere.' },
      { key: 'facebook_url', label: 'Facebook URL', control: 'url', default: '', placeholder: 'https://facebook.com/your-shop' },
      { key: 'instagram_url', label: 'Instagram URL', control: 'url', default: 'https://instagram.com/example', placeholder: 'https://instagram.com/your-shop' },
      { key: 'tiktok_url', label: 'TikTok URL', control: 'url', default: 'https://tiktok.com/@example', placeholder: 'https://tiktok.com/@your-shop' },
      { key: 'youtube_url', label: 'YouTube URL', control: 'url', default: '', placeholder: 'https://youtube.com/@your-shop' },
      { key: 'pinterest_url', label: 'Pinterest URL', control: 'url', default: '', placeholder: 'https://pinterest.com/your-shop' },
      { key: 'twitter_url', label: 'X / Twitter URL', control: 'url', default: 'https://twitter.com/example', placeholder: 'https://twitter.com/your-shop' },
    ] },
    { key: 'favicon', name: 'Favicon', desc: 'Browser tab icon', fields: [
      { key: 'favicon_image', label: 'Favicon image', control: 'image', default: '', info: 'Recommended 32×32 PNG. The storefront falls back to a generic dot if unset.' },
    ] },
  ];

  // ---------- sample platform resources (drive product/collection/menu/blog/page pickers) ----------
  const SAMPLE = {
    products: [
      { id: 'p1', title: 'Linen-feel wide pants', vendor: 'Aura Studio', price: 32.99, compareAt: 45.0, rating: 4.8, reviews: 214, image: IMG.p1, swatches: ['#2b2f36', '#c8b6a6', '#d9d2c5'] },
      { id: 'p2', title: 'Soft rib tee', status: 'draft', vendor: 'Aura Studio', price: 18.99, compareAt: 26.0, rating: 4.6, reviews: 98, image: IMG.p2, swatches: ['#1b3a2b', '#eae3d6'] },
      { id: 'p3', title: 'Editorial shell dress', vendor: 'Aura Studio', price: 41.5, compareAt: 58.0, rating: 4.9, reviews: 176, image: IMG.p3, swatches: ['#3a3f4a', '#9fb0a0', '#d8c3a5'],
        variants: [
          { id: 'p3-blk-m', title: 'Black / M', price: 41.5, compareAt: 58.0 },
          { id: 'p3-blk-s', title: 'Black / S', price: 41.5, compareAt: 58.0 },
          { id: 'p3-snd-m', title: 'Sand / M', price: 44.0, compareAt: 60.0 },
          { id: 'p3-grn-l', title: 'Sage / L', price: 44.0, compareAt: 60.0 },
        ] },
      { id: 'p4', title: 'Street denim jacket', status: 'draft', vendor: 'Aura Studio', price: 54.0, compareAt: 72.0, rating: 4.7, reviews: 132, image: IMG.p4, swatches: ['#33415c', '#1b1f24'],
        variants: [
          { id: 'p4-ind-m', title: 'Indigo / M', price: 54.0, compareAt: 72.0 },
          { id: 'p4-ind-l', title: 'Indigo / L', price: 56.0, compareAt: 74.0 },
          { id: 'p4-blk-m', title: 'Black / M', price: 58.0, compareAt: 76.0 },
        ] },
      { id: 'p5', title: 'Crewneck sweater', vendor: 'Aura Studio', price: 44.0, compareAt: 0, rating: 4.5, reviews: 64, image: IMG.p5, swatches: ['#6b705c', '#cb997e'] },
      { id: 'p6', title: 'Pleated midi skirt', vendor: 'Aura Studio', price: 38.0, compareAt: 49.0, rating: 4.4, reviews: 51, image: IMG.p6, swatches: ['#1b1f24', '#b08968'] },
      { id: 'p7', title: 'Canvas weekender tote', vendor: 'Aura Studio', price: 29.0, compareAt: 39.0, rating: 4.7, reviews: 83, image: IMG.cat1, swatches: ['#b08968', '#2b2f36'] },
      { id: 'p8', title: 'Everyday rib socks · 3 pack', vendor: 'Aura Studio', price: 16.0, compareAt: 24.0, rating: 4.6, reviews: 119, image: IMG.cat2, swatches: ['#eae3d6', '#1b1f24'] },
      { id: 'p9', title: 'Mini canvas pouch', vendor: 'Aura Studio', price: 14.0, compareAt: 19.0, rating: 4.5, reviews: 72, image: IMG.p1, swatches: ['#c8b6a6', '#2b2f36'] },
      { id: 'p10', title: 'Travel care kit', vendor: 'Aura Studio', price: 12.0, compareAt: 18.0, rating: 4.6, reviews: 91, image: IMG.p2, swatches: ['#d9d2c5'] },
      { id: 'p11', title: 'Essential hair scarf', vendor: 'Aura Studio', price: 18.0, compareAt: 25.0, rating: 4.4, reviews: 54, image: IMG.p3, swatches: ['#1b1f24', '#d8c3a5'] },
      { id: 'p12', title: 'Cotton sleep mask', vendor: 'Aura Studio', price: 9.5, compareAt: 14.0, rating: 4.7, reviews: 108, image: IMG.p4, swatches: ['#33415c', '#eae3d6'] },
      { id: 'p13', title: 'Everyday claw clip set', vendor: 'Aura Studio', price: 15.0, compareAt: 21.0, rating: 4.6, reviews: 137, image: IMG.p5, swatches: ['#6b705c', '#cb997e'] },
      { id: 'p14', title: 'Compact jewelry case', vendor: 'Aura Studio', price: 20.0, compareAt: 28.0, rating: 4.8, reviews: 66, image: IMG.p6, swatches: ['#b08968', '#1b1f24'] },
      { id: 'p15', title: 'Soft-touch headband', vendor: 'Aura Studio', price: 11.0, compareAt: 16.0, rating: 4.5, reviews: 84, image: IMG.cat1, swatches: ['#d8c3a5', '#1b1f24'] },
      { id: 'p16', title: 'Linen scrunchie set', vendor: 'Aura Studio', price: 13.0, compareAt: 18.0, rating: 4.6, reviews: 102, image: IMG.cat2, swatches: ['#c8b6a6', '#9fb0a0'] },
      { id: 'p17', title: 'Pocket mirror', vendor: 'Aura Studio', price: 8.0, compareAt: 12.0, rating: 4.4, reviews: 47, image: IMG.p1, swatches: ['#2b2f36'] },
      { id: 'p18', title: 'Mini travel comb', vendor: 'Aura Studio', price: 7.5, compareAt: 11.0, rating: 4.5, reviews: 59, image: IMG.p2, swatches: ['#eae3d6'] },
      { id: 'p19', title: 'Reusable garment bag', vendor: 'Aura Studio', price: 17.0, compareAt: 24.0, rating: 4.7, reviews: 73, image: IMG.p3, swatches: ['#3a3f4a'] },
      { id: 'p20', title: 'Delicate wash bag set', vendor: 'Aura Studio', price: 10.0, compareAt: 15.0, rating: 4.6, reviews: 96, image: IMG.p4, swatches: ['#eae3d6', '#33415c'] },
    ],
    // Service / membership products bound by the Shipping Insurance & VIP Club components.
    // They carry their own price and show up in the Order Summary like a normal line item.
    services: [
      { id: 'svc-ship', title: 'Shipping Protection', vendor: 'Service', price: 3.95, compareAt: 0, image: IMG.svcShip },
      { id: 'svc-vip', title: 'VIP Club Membership', vendor: 'Membership', price: 29.99, compareAt: 0, image: IMG.svcVip },
    ],
    collections: [
      { id: 'best-sellers', title: 'Best sellers', image: IMG.cat1, count: 48 },
      { id: 'new-arrivals', title: 'New arrivals', image: IMG.cat2, count: 32 },
      { id: 'dresses', title: 'Dresses', image: IMG.cat3, count: 27 },
      { id: 'tops', title: 'Tops', image: IMG.cat4, count: 41 },
      { id: 'bottoms', title: 'Bottoms', image: IMG.p1, count: 36 },
      { id: 'sale', title: 'Sale', image: IMG.p4, count: 19 },
    ],
    menus: [
      { id: 'menu-main', name: 'Main menu', items: [
        { id: 'm-home', title: 'Home', url: '/' },
        { id: 'm-shop', title: 'Shop Now', url: '/collections/all', children: [
          { id: 'm-shop-best', title: 'Best sellers', url: '/collections/best-sellers' },
          { id: 'm-shop-new', title: 'New arrivals', url: '/collections/new-arrivals' },
          { id: 'm-shop-sale', title: 'Sale', url: '/collections/sale' },
        ] },
        { id: 'm-women', title: 'Women', url: '/collections/women', children: [
          { id: 'm-w-dress', title: 'Dresses', url: '/collections/dresses' },
          { id: 'm-w-top', title: 'Tops', url: '/collections/tops' },
          { id: 'm-w-bottom', title: 'Bottoms', url: '/collections/bottoms' },
        ] },
        { id: 'm-blog', title: 'Journal', url: '/blogs/journal' },
      ] },
      { id: 'menu-footer-shop', name: 'Footer · Shop', items: [
        { id: 'f-best', title: 'Best sellers', url: '/collections/best-sellers' },
        { id: 'f-new', title: 'New arrivals', url: '/collections/new-arrivals' },
        { id: 'f-sale', title: 'Sale', url: '/collections/sale' },
      ] },
      { id: 'menu-footer-help', name: 'Footer · Help', items: [
        { id: 'h-track', title: 'Track order', url: '/account/orders' },
        { id: 'h-ship', title: 'Shipping', url: '/pages/shipping' },
        { id: 'h-returns', title: 'Returns', url: '/pages/returns' },
        { id: 'h-contact', title: 'Contact us', url: '/pages/contact' },
      ] },
    ],
    pages: [
      { id: 'pg-privacy', title: 'Privacy Policy', url: '/pages/privacy', content:
        '<p>This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from our store.</p>' +
        '<p><strong>Information we collect.</strong> When you place an order we collect your name, billing and shipping address, payment details, email address, and phone number so we can fulfil your order and keep you updated.</p>' +
        '<p><strong>How we use it.</strong> We use the information to process payments, arrange shipping, and provide order confirmations. We may also use it to communicate with you and to screen for potential risk or fraud.</p>' +
        '<p>You can contact us at any time to review, update, or delete the personal information we hold about you.</p>' },
      { id: 'pg-refund', title: 'Refund Policy', url: '/pages/refund', content:
        '<p>We have a 30-day return policy, which means you have 30 days after receiving your item to request a return.</p>' +
        '<p><strong>Eligibility.</strong> To be eligible for a return, your item must be in the same condition that you received it — unworn or unused, with tags, and in its original packaging. You will also need the receipt or proof of purchase.</p>' +
        '<p><strong>Refunds.</strong> Once we have received and inspected your return, we will notify you of the approval. If approved, you will be automatically refunded to your original payment method within 10 business days.</p>' },
      { id: 'pg-terms', title: 'Terms of Service', url: '/pages/terms', content:
        '<p>By accessing this site and placing an order you agree to the following terms and conditions.</p>' +
        '<p><strong>Products & pricing.</strong> We reserve the right to modify prices and product availability at any time. All prices are shown in the store currency and include applicable taxes where required.</p>' +
        '<p><strong>Orders.</strong> We reserve the right to refuse or cancel any order. If we cancel an order after payment, you will receive a full refund.</p>' +
        '<p>These terms are governed by the laws of the jurisdiction in which the store operates.</p>' },
      { id: 'pg-shipping', title: 'Shipping Policy', url: '/pages/shipping', content:
        '<p>We aim to process and dispatch all orders within 1–2 business days.</p>' +
        '<p><strong>Delivery times.</strong> Standard shipping typically arrives within 3–7 business days. Express options are available at checkout for faster delivery.</p>' +
        '<p><strong>Tracking.</strong> Once your order ships you will receive a confirmation email with a tracking number so you can follow its progress.</p>' +
        '<p>Shipping fees are calculated at checkout based on destination and the options you select.</p>' },
      { id: 'pg-about', title: 'About Us', url: '/pages/about', content:
        '<p>We are a small team passionate about creating thoughtful, high-quality products that last.</p>' +
        '<p>Every item in our collection is designed with care and made to be worn and loved for years. We believe in fair pricing, transparent sourcing, and treating our customers the way we would want to be treated.</p>' +
        '<p>Thank you for supporting our store — we are glad you are here.</p>' },
      { id: 'pg-contact', title: 'Contact Us', url: '/pages/contact', content:
        '<p>Have a question about your order or one of our products? We would love to hear from you.</p>' +
        '<p><strong>Email.</strong> support@example.com — we reply to every message within one business day.</p>' +
        '<p><strong>Hours.</strong> Monday to Friday, 9am–5pm. Messages sent over the weekend are answered the next business day.</p>' },
    ],
    blogs: [
      { id: 'blog-journal', title: 'Journal', posts: [
        { id: 'a1', title: 'Five ways to style linen this spring', excerpt: 'Lightweight layers for warmer days, from desk to dinner.', author: 'Mia Carter', date: 'Mar 3, 2026', category: 'Outfit Ideas', image: IMG.blog1 },
        { id: 'a2', title: 'The fabric guide: what to know before you buy', excerpt: 'A quick primer on the materials we love and why they last.', author: 'Jules N.', date: 'Mar 4, 2026', category: 'Guides', image: IMG.blog2 },
        { id: 'a3', title: 'Behind the seams: our spring capsule', excerpt: 'How the new collection came together, piece by piece.', author: 'Mia Carter', date: 'Mar 6, 2026', category: 'Studio', image: IMG.iwt },
      ] },
    ],
    currencies: ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD'],
    languages: ['English', '中文', '日本語', 'Français', 'Español', 'Deutsch'],
    IMG,
  };

  // ---------- DEFAULT THEME (thin seeds; settings filled from section defaults at start) ----------
  // Globals (announcement/header/footer) and template sections reference a section `kind`; the
  // engine materialises each instance's settings from OS_SECTIONS[kind].defaults(), applying any
  // `settings` override here. Blocks likewise: {kind} -> blockDef.defaults().
  const DEFAULT_THEME = {
    name: 'Aura · Draft',
    announcement: { hidden: false, kind: 'announcement-bar', settings: {} },
    header: { hidden: false, kind: 'header', settings: {} },
    footer: { hidden: false, kind: 'footer', settings: {} },
    // Multi-template shape: each page type holds a `list` of named templates. `id:'default'`
    // is the built-in fallback (can't be deleted). `assigned` is a mock count shown in the
    // selector submenu ("Assigned to N products"). Single types (home / collections) simply
    // keep a one-item list. Extra product/collection templates seed the multi-template UX.
    templates: {
      home: { list: [
        { id: 'default', name: 'Home page', assigned: '—', sections: [
          { id: 'sec-home-slideshow', kind: 'slideshow' },
          { id: 'sec-home-iwt', kind: 'media-with-text' },
          { id: 'sec-home-fc', kind: 'featured-collection' },
          { id: 'sec-home-testi', kind: 'testimonial' },
          { id: 'sec-home-faq', kind: 'faq' },
          { id: 'sec-home-news', kind: 'newsletter' },
        ] },
      ] },
      product: { list: [
        { id: 'default', name: 'Default product', assigned: '100+', assignedResourceIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], sections: [
          { kind: 'media-with-text' },
        ] },
        { id: 'buy-2-for-69', name: 'buy-2-for-69', basedOn: 'default', assigned: 1, assignedResourceIds: ['p1'], sections: [
          { kind: 'media-with-text' }, { kind: 'faq' },
        ] },
        { id: 'dress-size-image', name: 'dress-size-image', basedOn: 'default', assigned: 24, assignedResourceIds: ['p2', 'p3', 'p4'], sections: [
          { kind: 'media-with-text' }, { kind: 'media-grid' },
        ] },
        { id: 'explainer-template', name: 'explainer-template', basedOn: 'default', assigned: 0, assignedResourceIds: [], sections: [
          { kind: 'media-with-text' }, { kind: 'feature-cards' },
        ] },
        { id: 'pre-order', name: 'pre-order', basedOn: 'default', assigned: 0, assignedResourceIds: [], sections: [
          { kind: 'media-with-text' }, { kind: 'newsletter' },
        ] },
      ] },
      collection: { list: [
        { id: 'default', name: 'Default collection', assigned: '100+', assignedResourceIds: ['best-sellers', 'new-arrivals', 'dresses', 'tops', 'bottoms', 'sale'], sections: [
          { id: 'sec-col-banner', kind: 'collection-banner' },
          { id: 'sec-col-list', kind: 'collection-list' },
          { id: 'sec-col-page', kind: 'collection-page' },
        ] },
        { id: 'sale-2026', name: 'sale-2026', basedOn: 'default', assigned: 3, assignedResourceIds: ['sale', 'best-sellers', 'new-arrivals'], sections: [
          { kind: 'collection-banner' }, { kind: 'collection-page' },
        ] },
      ] },
      collections: { list: [
        { id: 'default', name: 'Collections list', assigned: '—', sections: [
          { id: 'sec-cols-list', kind: 'list-collections' },
        ] },
      ] },
    },
  };

  // ==========================================================================
  //  CHECKOUT THEME (V Theme-Checkout PRD) — separate editor surface
  //  Fixed transaction skeleton + configurable styles. Distinct from the
  //  Home/Collection/PDP theme settings above. (PRD §3, §5, §6)
  // ==========================================================================

  // Checkout editor page selector — both transaction pages share one theme (Thank you PRD §23.1).
  // Checkout theme is its own editing environment with FOUR multi-template page types
  // (PRD §3.2/§5.2).
  const CHECKOUT_PAGES = [
    { value: 'checkout', label: 'Checkout',  multi: true },
    { value: 'upsell',   label: 'Upsell',    multi: true },
    { value: 'downsell', label: 'Downsell',  multi: true },
    { value: 'thankyou', label: 'Thank you', multi: true },
  ];

  // Seed template lists per checkout page type (PRD §6.3/§6.4). `isDefault` marks the
  // built-in fallback.
  // Upsell/Downsell share one post-purchase offer builder; Funnel/Offer services provide
  // products, prices, routing and payment capability while Theme owns presentation only.
  const CHECKOUT_TEMPLATE_SETS = {
    checkout: [
      { id: 'standard', name: 'Standard', isDefault: true },
      { id: 'conversion', name: 'Conversion' },
    ],
    upsell: [
      { id: 'one-click-upsell', name: 'One-click upsell', isDefault: true },
      { id: 'subscription-upsell', name: 'Subscription upsell' },
    ],
    downsell: [
      { id: 'standard-downsell', name: 'Standard', isDefault: true },
      { id: 'save-offer', name: 'Save offer' },
    ],
    thankyou: [
      { id: 'standard', name: 'Standard', isDefault: true },
      { id: 'survey-thankyou', name: 'Survey thank-you' },
    ],
  };

  const FONT_CK = ['Default', 'Inter', 'Manrope', 'Playfair Display', 'Georgia', 'system-ui'].map((v) => ({ value: v, label: v }));

  // Checkout Theme settings — 7 groups (PRD §6). Keys/defaults/ranges verbatim.
  const CHECKOUT_SETTINGS_GROUPS = [
    { key: 'main', name: 'Main', desc: 'Page, content & summary surfaces', open: true, fields: [
      { key: 'page_background', label: 'Page background', control: 'color', default: '#FFFFFF', info: 'Background of the whole left-hand form area. Form components sit transparently on top.' },
      { key: 'text_color', label: 'Text color', control: 'color', default: '#1F1F1F' },
      { key: 'muted_text_color', label: 'Muted text', control: 'color', default: '#777777' },
      { key: 'divider_color', label: 'Divider', control: 'color', default: '#E5E5E5' },
    ] },
    { key: 'header', name: 'Header', desc: 'Brand bar at the top', fields: [
      { key: 'header_background', label: 'Header background', control: 'color', default: '#FFFFFF' },
      { key: 'header_text_color', label: 'Header text', control: 'color', default: '#1F1F1F' },
      { key: 'header_accent_color', label: 'Header accent', control: 'color', default: '#121212', info: 'Links and the cart icon.' },
      { key: 'header_height_pc', label: 'Header height · PC', control: 'range', min: 48, max: 120, step: 1, unit: 'px', default: 64 },
      { key: 'header_height_mobile', label: 'Header height · Mobile', control: 'range', min: 44, max: 100, step: 1, unit: 'px', default: 56 },
      { key: 'header_divider', label: 'Bottom divider', control: 'toggle', default: true },
    ] },
    { key: 'order_summary', name: 'Order Summary', desc: 'Right-hand summary surface', fields: [
      { key: 'summary_background', label: 'Background', control: 'color', default: '#F5F5F5' },
      { key: 'summary_text', label: 'Text', control: 'color', default: '#1F1F1F' },
      { key: 'summary_muted_text', label: 'Muted text', control: 'color', default: '#777777', info: 'Variants, descriptions, secondary lines.' },
    ] },
    { key: 'accent', name: 'Accent and buttons', desc: 'Primary action & accent color', fields: [
      { key: 'accent_color', label: 'Accent color', control: 'color', default: '#121212', info: 'Links, selected state, radio, checkbox.' },
      { key: 'button_background', label: 'Button background', control: 'color', default: '#121212' },
      { key: 'button_text_color', label: 'Button text', control: 'color', default: '#FFFFFF' },
      { key: 'button_hover_background', label: 'Button hover', control: 'color', default: '#000000' },
      { key: 'button_border_radius', label: 'Button radius', control: 'range', min: 0, max: 40, step: 1, unit: 'px', default: 6 },
      { key: 'button_height', label: 'Button height', control: 'range', min: 40, max: 64, step: 1, unit: 'px', default: 52 },
    ] },
    { key: 'input', name: 'Input fields', desc: 'Form inputs across checkout', fields: [
      { key: 'input_background', label: 'Background', control: 'color', default: '#FFFFFF' },
      { key: 'input_text_color', label: 'Text', control: 'color', default: '#1F1F1F' },
      { key: 'placeholder_color', label: 'Placeholder', control: 'color', default: '#B5B5B5' },
      { key: 'input_border_color', label: 'Border (default)', control: 'color', default: '#D9D9D9' },
      { key: 'input_focus_border_color', label: 'Border (focused)', control: 'color', default: '#121212', info: 'Defaults to the Accent color.' },
      { key: 'input_error_color', label: 'Error', control: 'color', default: '#D72C2C' },
      { key: 'input_border_radius', label: 'Corner radius', control: 'range', min: 0, max: 24, step: 1, unit: 'px', default: 6 },
      { key: 'input_height', label: 'Height', control: 'range', min: 40, max: 64, step: 1, unit: 'px', default: 48 },
      { key: 'transparent_input', label: 'Transparent input', control: 'toggle', default: false },
    ] },
    { key: 'typography', name: 'Typography', desc: 'Fonts and sizes', fields: [
      { key: 'heading_font', label: 'Heading font', control: 'select', options: FONT_CK, default: 'Default' },
      { key: 'body_font', label: 'Body font', control: 'select', options: FONT_CK, default: 'Default' },
      { key: 'base_font_size', label: 'Base font size', control: 'range', min: 12, max: 18, step: 1, unit: 'px', default: 14 },
      { key: 'heading_font_size', label: 'Heading font size', control: 'range', min: 14, max: 28, step: 1, unit: 'px', default: 18 },
      { key: 'small_font_size', label: 'Small font size', control: 'range', min: 10, max: 14, step: 1, unit: 'px', default: 12 },
      { key: 'font_weight_heading', label: 'Heading weight', control: 'select', default: '600', options: [
        { value: '400', label: '400' }, { value: '500', label: '500' }, { value: '600', label: '600' }, { value: '700', label: '700' } ] },
      { key: 'font_weight_body', label: 'Body weight', control: 'select', default: '400', options: [
        { value: '400', label: '400' }, { value: '500', label: '500' }, { value: '600', label: '600' } ] },
    ] },
    { key: 'layout', name: 'Layout', desc: 'Width, columns and spacing', fields: [
      { key: 'page_max_width_pc', label: 'Max width · PC', control: 'range', min: 900, max: 1280, step: 10, unit: 'px', default: 980 },
      { key: 'column_gap', label: 'Column gap', control: 'range', min: 16, max: 80, step: 1, unit: 'px', default: 40 },
      { key: 'section_spacing', label: 'Section spacing', control: 'range', min: 12, max: 48, step: 1, unit: 'px', default: 24 },
      { key: 'mobile_page_padding', label: 'Mobile page padding', control: 'range', min: 12, max: 24, step: 1, unit: 'px', default: 18 },
    ] },
  ];

  // Checkout commerce components (Commerce PRD §14.1) — the addable "transaction
  // enhancement" group. Unlike the required skeleton, these can be added / hidden /
  // deleted / reordered in the editor.
  const CHECKOUT_COMMERCE = [
    { kind: 'checkout-product-upsell', name: 'Product upsell', desc: 'Recommend extra products with one-tap add' },
    { kind: 'checkout-shipping-insurance', name: 'Shipping Insurance', desc: 'Tickable delivery-protection service' },
    { kind: 'checkout-vip-club', name: 'VIP Club', desc: 'Tickable membership add-on' },
  ];

  // Allowed insertion zones for commerce components. Each zone sits right after an anchor
  // (required) component. To keep merchant configuration simple, every commerce component
  // may live in any of the five zones (no per-component matrix). `col` decides the render
  // column: 'main' = left form column, 'summary' = under the Order Summary (right column on
  // PC, after the bottom Order Summary on mobile).
  const CK_COMMERCE_KINDS = ['checkout-product-upsell', 'checkout-shipping-insurance', 'checkout-vip-club'];

  // Checkout content & trust components (Content PRD §2) — the third, "content & trust
  // enhancement" group. Static-only: never touches order / amount / shipping / tax /
  // payment data. Addable / hideable / deletable / draggable like the commerce group,
  // but most are Section + Block components with their own block lists.
  const CHECKOUT_CONTENT = [
    { kind: 'announcement-bar', name: 'Announcement Bar', desc: 'Top promo / free-shipping bar (reused from Online Store)' },
    { kind: 'checkout-countdown', name: 'Countdown', desc: 'Static urgency / reservation timer' },
    { kind: 'checkout-payment-icons', name: 'Payment Icons', desc: 'Accepted-payment brand badges' },
    { kind: 'checkout-trust-badges', name: 'Trust badges', desc: 'Guarantee / security / shipping badges' },
    { kind: 'checkout-trustpilot', name: 'Trustpilot Review', desc: 'Trustpilot-style rating & reviews (static)' },
    { kind: 'checkout-review-card', name: 'Review card', desc: 'Expert / media endorsement cards' },
    { kind: 'checkout-testimonials', name: 'Testimonials', desc: 'Customer reviews (bottom area only)' },
    { kind: 'checkout-fb-comments', name: 'Facebook-style Comments', desc: 'Social-proof comment thread' },
    { kind: 'checkout-static-content', name: 'Static content', desc: 'Notice / card / rich-text block' },
    { kind: 'checkout-footer', name: 'Footer', desc: 'Checkout footer (bottom of page only)' },
  ];
  // The 7 content components that may live in any of the standard insertion zones
  // (Header / Contact / Shipping / Payment / CTA / Order Summary), per PRD §5.1.
  const CK_CONTENT_FLEX = ['checkout-countdown', 'checkout-trust-badges', 'checkout-static-content',
    'checkout-payment-icons', 'checkout-trustpilot', 'checkout-review-card', 'checkout-fb-comments'];
  const CK_FLEX = CK_COMMERCE_KINDS.concat(CK_CONTENT_FLEX);

  // Insertion zones. `col` decides the render region: 'announce' = full-bleed top (above
  // header), 'main' = left form column, 'summary' = under the Order Summary, 'bottom' =
  // full-bleed bottom band (Testimonials → Footer). Announcement Bar is locked to the
  // top; Testimonials/Footer to the bottom (PRD §5.3).
  const CHECKOUT_ZONES = [
    { id: 'announce', label: 'Above header', after: null, col: 'announce', allow: ['announcement-bar'] },
    { id: 'header', label: 'Below header', after: 'checkout-header', col: 'main', allow: CK_CONTENT_FLEX.slice() },
    { id: 'contact', label: 'Below Contact information', after: 'checkout-contact', col: 'main', allow: CK_FLEX.slice() },
    { id: 'shipping', label: 'Below Shipping method', after: 'checkout-shipping-method', col: 'main', allow: CK_FLEX.slice() },
    { id: 'payment', label: 'Below Payment method', after: 'checkout-payment', col: 'main', allow: CK_FLEX.slice() },
    { id: 'cta', label: 'Below CTA', after: 'checkout-cta', col: 'main', allow: CK_FLEX.slice() },
    { id: 'summary', label: 'Below Order Summary', after: 'checkout-order-summary', col: 'summary', allow: CK_FLEX.slice() },
    { id: 'bottom', label: 'Page bottom', after: 'checkout-policy-links', col: 'bottom', allow: ['checkout-testimonials', 'checkout-footer'] },
  ];

  // Checkout skeleton. Required components are fixed; the commerce components seeded
  // here (PRD §4.2 positions) can be added / hidden / deleted / reordered.
  const CHECKOUT_TEMPLATE = {
    sections: [
      { id: 'ck-header', kind: 'checkout-header' },
      { id: 'ck-summary-bar', kind: 'checkout-order-summary-bar' },
      { id: 'ck-express', kind: 'checkout-express' },
      { id: 'ck-contact', kind: 'checkout-contact' },
      { id: 'ck-upsell', kind: 'checkout-product-upsell', zone: 'contact' },
      { id: 'ck-shipinfo', kind: 'checkout-shipping-info' },
      { id: 'ck-shipmethod', kind: 'checkout-shipping-method' },
      { id: 'ck-insurance', kind: 'checkout-shipping-insurance', zone: 'shipping' },
      { id: 'ck-payment', kind: 'checkout-payment' },
      { id: 'ck-vip', kind: 'checkout-vip-club', zone: 'payment' },
      { id: 'ck-cta', kind: 'checkout-cta' },
      { id: 'ck-summary', kind: 'checkout-order-summary', blocks: [
        { id: 'ck-blk-lines', kind: 'cart-lines' },
        { id: 'ck-blk-coupon', kind: 'coupon' },
        { id: 'ck-blk-subtotal', kind: 'subtotal' },
        { id: 'ck-blk-discount', kind: 'discount' },
        { id: 'ck-blk-shipping', kind: 'shipping' },
        { id: 'ck-blk-tax', kind: 'tax' },
        { id: 'ck-blk-total', kind: 'total' },
      ] },
      { id: 'ck-policy', kind: 'checkout-policy-links', settings: {
        refund_policy_page: 'pg-refund', privacy_policy_page: 'pg-privacy', terms_of_service_page: 'pg-terms',
      } },
    ],
  };

  // Mock order used for the checkout preview (PRD §14.2). Amounts are illustrative;
  // in production the order calculation service is the source of truth.
  const CHECKOUT_MOCK = {
    storeName: 'AURA',
    country: 'United States',
    currency: 'USD',
    countries: ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'Japan'],
    states: ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington', 'Massachusetts', 'Georgia'],
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Seattle', 'Boston', 'Atlanta', 'Miami'],
    phoneCodes: ['+1', '+44', '+61', '+49', '+81', '+86', '+33'],
    cart: [
      { id: 'l1', title: 'Linen-feel wide pants', variant: 'Sand / M', qty: 1, price: 32.99, compareAt: 45.0, deal: 'EXTRA SALE', image: IMG.p1 },
      { id: 'l2', title: 'Soft rib tee', variant: 'Forest / S', qty: 2, price: 18.99, compareAt: 26.0, deal: 'BUY 2 SAVE 30%', image: IMG.p2 },
      { id: 'l3', title: 'Pleated midi skirt', variant: 'Black / M', qty: 1, price: 38.0, compareAt: 49.0, deal: 'CLEARANCE', image: IMG.p6 },
      // Subscription lines — the line price already reflects the subscription saving
      // (compareAt − save = price); the cadence tag is informational (Item 3).
      { id: 'l4', title: '04 Normal product - single variant', variant: '', qty: 1, price: 10.39, compareAt: 12.99, image: IMG.p4,
        subscription: { label: 'Delivery every 1 month', save: 2.6 } },
      { id: 'l5', title: '05 Normal product - multiple variants', variant: 'Citrus, 24 Pack', qty: 1, price: 15.19, compareAt: 18.99, image: IMG.p5,
        subscription: { label: 'Delivery every 2 months', save: 3.8 } },
      // Bundle parent — black "Bundle" badge instead of a thumb, BUNDLE-discount deal
      // tag (compareAt − price), followed by indented "Included" children (no own price).
      { id: 'l6', title: '03 Bundle product - one-time purchase', variant: '', qty: 1, price: 42.0, compareAt: 49.98, deal: 'BUNDLE discount', image: IMG.p3,
        bundle: true, bundleItems: [
          { title: 'Bundle item A - Focus Gum', variant: '12 Pack', qty: 1, image: IMG.p1 },
          { title: 'Bundle item B - Refill Pack', variant: 'Mint, 24 Pack', qty: 1, image: IMG.p2 },
        ] },
    ],
    shippingMethods: [
      { id: 'free', name: 'Free Shipping', eta: '', desc: '4–7 business days', price: 0 },
      { id: 'vip', name: 'VIP Shipping', eta: '', desc: '1–2 business days · priority handling', price: 12.99 },
    ],
    selectedShipping: 'free',
    coupon: { code: 'WELCOME10', amount: 10.99 },
    // Valid demo discount codes (case-insensitive). Shopify itemises discounts into
    // three types (Item 2): product / order / shipping. Each entry is an object with
    // any of {product, order, shipping}; a plain number is treated as a product
    // discount (backward-compat). The applied coupon carries this breakdown so the
    // Order Summary can render a separate row per non-zero discount type.
    coupons: {
      WELCOME10: { product: 10.99 },       // product (line-item) discount
      SAVE10: { order: 10.0 },             // order discount (matches reference)
      SHIP5: { shipping: 5.0 },            // shipping discount (negative shipping line)
      BUNDLE15: { product: 5.0, order: 7.0, shipping: 3.0 }, // demos all three at once
      THANKS: { order: 7.0, shipping: 3.99 }, // seeded by default — demos Order + Shipping discount rows
    },
    tax: 7.34,
    // Signed-in demo account (Item 1). The signed-in flag itself is a runtime toggle
    // shared by Contact + Delivery (OS.ckState['ck-account']), default signed OUT.
    // Multiple saved addresses power the Delivery "Ship to" radio list; the one with
    // default:true is pre-selected. line1 = street, line2 = "city/region zip, country".
    account: {
      email: 'cxc8697@gmail.com',
      addresses: [
        { id: 'a1', name: 'Xican Chen', line1: '31972 NW Pacific Coast Hwy', line2: 'Waldport OR 97394, US', phone: '4153334567', default: true },
        { id: 'a2', name: 'Xican Chen', line1: '10th arrondissement of Paris', line2: '75010 Paris, FR', phone: '100000000' },
        { id: 'a3', name: 'Xican Chen', line1: 'dfdfdf Benar Road Shankar Vihar Extension Rani Bagh', line2: '302012 Jaipur RJ, IN', phone: '4153334567' },
        { id: 'a4', name: 'Xican Chen', line1: '670 North Commercial St', line2: 'Manchester NH 03101, US', phone: '4153334567' },
        { id: 'a5', name: 'HK', line1: '', line2: '' },
      ],
      shippingSummary: 'Estimated Delivery Time: 4-8 Business Days · FREE',
    },
  };

  // Add-component catalog for the Checkout editor, grouped into MECE categories by
  // function / use-case. Powers the "Add component" modal (same UX as the Online Store
  // "Add section" modal). Every addable checkout component belongs to exactly one group,
  // and together the groups cover all addable components (mutually exclusive + exhaustive).
  const CHECKOUT_CATALOG = [
    { label: 'Commerce boosters', entries: [
      { kind: 'checkout-product-upsell', name: 'Product upsell', desc: 'Recommend extra products with one-tap add' },
      { kind: 'checkout-shipping-insurance', name: 'Shipping Insurance', desc: 'Tickable delivery-protection service' },
      { kind: 'checkout-vip-club', name: 'VIP Club', desc: 'Tickable membership add-on' },
    ] },
    { label: 'Reviews & social proof', entries: [
      { kind: 'checkout-trustpilot', name: 'Trustpilot Review', desc: 'Trustpilot-style rating & reviews (static)' },
      { kind: 'checkout-review-card', name: 'Review card', desc: 'Expert / media endorsement cards' },
      { kind: 'checkout-testimonials', name: 'Testimonials', desc: 'Customer reviews (bottom area only)' },
      { kind: 'checkout-fb-comments', name: 'Facebook-style Comments', desc: 'Social-proof comment thread' },
    ] },
    { label: 'Trust & security', entries: [
      { kind: 'checkout-trust-badges', name: 'Trust badges', desc: 'Guarantee / security / shipping badges' },
      { kind: 'checkout-payment-icons', name: 'Payment Icons', desc: 'Accepted-payment brand badges' },
    ] },
    { label: 'Promotion & urgency', entries: [
      { kind: 'announcement-bar', name: 'Announcement Bar', desc: 'Top promo / free-shipping bar' },
      { kind: 'checkout-countdown', name: 'Countdown', desc: 'Static urgency / reservation timer' },
    ] },
    { label: 'Content & structure', entries: [
      { kind: 'checkout-static-content', name: 'Static content', desc: 'Notice / rich-text content block' },
      { kind: 'checkout-footer', name: 'Footer', desc: 'Checkout footer (bottom of page only)' },
    ] },
  ];

  // ==========================================================================
  //  POST-PURCHASE OFFER PAGES — Upsell + Downsell
  //  Both pages reuse one locked transaction-safe skeleton. Existing Checkout
  //  content/trust components remain addable; cart-mutating commerce boosters are
  //  intentionally excluded because the original Checkout has already completed.
  // ==========================================================================
  const OFFER_FLEX = ['checkout-countdown', 'checkout-trust-badges', 'checkout-static-content',
    'checkout-payment-icons', 'checkout-trustpilot', 'checkout-review-card', 'checkout-fb-comments'];
  const OFFER_ZONES = [
    { id: 'announce', label: 'Above header', after: null, col: 'announce', allow: ['announcement-bar'] },
    { id: 'header', label: 'Below order confirmation', after: 'checkout-offer-header', col: 'main', allow: OFFER_FLEX.slice() },
    { id: 'progress', label: 'Below progress', after: 'checkout-offer-progress', col: 'main', allow: OFFER_FLEX.slice() },
    { id: 'offer', label: 'Below offer', after: 'checkout-offer-product', col: 'main', allow: OFFER_FLEX.slice() },
    { id: 'policytop', label: 'Below Policy Links', after: 'checkout-policy-links', col: 'bottom', allow: ['checkout-testimonials'] },
    { id: 'bottom', label: 'Page bottom', after: 'checkout-policy-links', col: 'bottom', allow: ['checkout-footer'] },
  ];
  const OFFER_CATALOG = CHECKOUT_CATALOG
    .filter((g) => g.label !== 'Commerce boosters')
    .map((g) => ({ label: g.label, entries: g.entries.map((e) => Object.assign({}, e, {
      defaultZone: e.kind === 'announcement-bar' ? 'announce'
        : e.kind === 'checkout-testimonials' ? 'policytop'
        : e.kind === 'checkout-footer' ? 'bottom'
        : e.kind === 'checkout-countdown' || e.kind === 'checkout-static-content' ? 'progress'
        : 'offer',
    })) }));

  // The recommendation preview resolves product + variant references from this catalog. It intentionally
  // carries product availability alongside Offer quote fields so the editor can demonstrate
  // filtering without pretending to own the production inventory/Market checks.
  const offerCatalog = () => SAMPLE.products.map((product, index) => {
    const price = +product.price;
    const compareAt = +(product.compareAt || product.price).toFixed(2);
    const variants = (product.variants || []).map((variant) => {
      const variantPrice = +variant.price;
      const variantCompare = +(variant.compareAt || variant.price).toFixed(2);
      return {
        id: variant.id, title: variant.title, price: variantPrice, compareAt: variantCompare,
        total: variantPrice, savings: 'Save ' + Math.max(0, Math.round((1 - variantPrice / variantCompare) * 100)) + '%',
        available: variant.available !== false,
      };
    });
    return {
      id: product.id, title: product.title, image: product.image, status: product.status, bestSellerRank: index + 1,
      published: product.published !== false, marketSupported: product.marketSupported !== false,
      available: product.available !== false, inventory: product.inventory == null ? 20 : product.inventory,
      price, compareAt, total: price,
      savings: 'Save ' + Math.max(0, Math.round((1 - price / compareAt) * 100)) + '%',
      rating: product.rating, reviewCount: product.reviews,
      description: 'Add ' + product.title.toLowerCase() + ' to the order you just completed at an exclusive post-purchase price.',
      variantLabel: variants.length ? 'Color / size' : '', variants,
      selectedVariantId: variants.length ? variants[0].id : '',
      quantity: 1, quantityOptions: [1, 2, 3], shippingLabel: 'Free',
    };
  });
  const OFFER_MOCKS = {
    upsell: {
      storeName: 'AURA', confirmationNumber: 'NWRGFFKTF', orderNumber: '#1001', currency: 'USD',
      catalog: offerCatalog(),
      mockOrderProducts: [
        { productId: 'p1', variantId: '', quantity: 1, paidAmount: 32.99 },
        { productId: 'p2', variantId: '', quantity: 2, paidAmount: 37.98 },
        { productId: 'p5', variantId: '', quantity: 1, paidAmount: 44.00 },
      ],
      previouslyDisplayedProductIds: [],
      acceptedProductIds: [],
      products: [
        {
          id: 'creatine-3', title: 'Creatine (3 Extra)', image: IMG.p3, compareAt: 49.99, price: 35.00, total: 104.98,
          savings: 'Save 30%', rating: 4.9, reviewCount: 125,
          description: 'Don\u2019t miss out on this offer. It expires after you leave this page.',
          variantLabel: 'Flavor / pack', selectedVariantId: 'berry-3',
          variants: [
            { id: 'berry-3', title: 'Berry · 3 tubs', price: 35, compareAt: 49.99, total: 104.98, savings: 'Save 30%' },
            { id: 'lemon-3', title: 'Lemon · 3 tubs', price: 36, compareAt: 49.99, total: 107.98, savings: 'Save 28%' },
            { id: 'unflavored-3', title: 'Unflavored · 3 tubs', price: 32, compareAt: 47.99, total: 95.98, savings: 'Save 33%' },
          ],
          quantity: 3, quantityOptions: [1, 2, 3], shippingLabel: 'Free',
        },
        {
          id: 'hydration-pack', title: 'Daily Hydration Pack', image: IMG.p4, compareAt: 42.00, price: 28.00, total: 28.00,
          savings: 'Save 33%', rating: 4.8, reviewCount: 88,
          description: 'Add an easy daily hydration boost to the order you just completed.',
          variantLabel: 'Flavor', selectedVariantId: 'citrus',
          variants: [
            { id: 'citrus', title: 'Citrus', price: 28, compareAt: 42, total: 28, savings: 'Save 33%' },
            { id: 'berry', title: 'Mixed berry', price: 28, compareAt: 42, total: 28, savings: 'Save 33%' },
          ],
          quantity: 1, quantityOptions: [1, 2], shippingLabel: 'Free',
        },
        {
          id: 'recovery-bundle', title: 'Recovery Essentials Bundle', image: IMG.p5, compareAt: 74.00, price: 49.00, total: 49.00,
          savings: 'Save 34%', rating: 4.7, reviewCount: 64,
          description: 'Complete your routine with a one-time recovery bundle at a post-purchase price.',
          variantLabel: 'Bundle', selectedVariantId: 'standard',
          variants: [
            { id: 'standard', title: 'Standard bundle', price: 49, compareAt: 74, total: 49, savings: 'Save 34%' },
            { id: 'plus', title: 'Plus bundle', price: 62, compareAt: 89, total: 62, savings: 'Save 30%' },
          ],
          quantity: 1, quantityOptions: [1], shippingLabel: 'Free',
        },
        {
          id: 'travel-shaker', title: 'Travel Shaker Set', image: IMG.p6, compareAt: 24.00, price: 16.00, total: 16.00,
          savings: 'Save 33%', rating: 4.6, reviewCount: 51,
          description: 'A compact shaker set ready for training days and travel.',
          quantity: 1, quantityOptions: [1, 2, 3], shippingLabel: 'Free',
        },
      ],
    },
    downsell: {
      storeName: 'AURA', confirmationNumber: 'NWRGFFKTF', orderNumber: '#1001', currency: 'USD',
      catalog: offerCatalog(),
      mockOrderProducts: [
        { productId: 'p1', variantId: '', quantity: 1, paidAmount: 32.99 },
        { productId: 'p2', variantId: '', quantity: 2, paidAmount: 37.98 },
        { productId: 'p5', variantId: '', quantity: 1, paidAmount: 44.00 },
      ],
      precedingUpsellOfferProducts: [
        { productId: 'p3', effectivePrice: 37.35 },
        { productId: 'p6', effectivePrice: 34.20 },
        { productId: 'p7', effectivePrice: 26.10 },
        { productId: 'p8', effectivePrice: 14.40 },
      ],
      previouslyDisplayedProductIds: ['p3', 'p6', 'p7', 'p8'],
      acceptedProductIds: [],
      products: [
        {
          id: 'creatine-1', title: 'Creatine (1 Extra)', image: IMG.p3, compareAt: 29.99, price: 19.99, total: 19.99,
          savings: 'Save 33%', rating: 4.9, reviewCount: 125,
          description: 'Try one extra tub at our lowest one-time price. This offer disappears when you leave.',
          variantLabel: 'Flavor', selectedVariantId: 'berry-1',
          variants: [
            { id: 'berry-1', title: 'Berry', price: 19.99, compareAt: 29.99, total: 19.99, savings: 'Save 33%' },
            { id: 'lemon-1', title: 'Lemon', price: 20.99, compareAt: 29.99, total: 20.99, savings: 'Save 30%' },
            { id: 'unflavored-1', title: 'Unflavored', price: 18.99, compareAt: 28.99, total: 18.99, savings: 'Save 34%' },
          ],
          quantity: 1, quantityOptions: [1], shippingLabel: 'Free',
        },
        {
          id: 'hydration-sample', title: 'Hydration Sample Pack', image: IMG.p4, compareAt: 18.00, price: 12.00, total: 12.00,
          savings: 'Save 33%', rating: 4.8, reviewCount: 88,
          description: 'Try a smaller hydration pack without re-entering your payment details.',
          quantity: 1, quantityOptions: [1, 2], shippingLabel: 'Free',
        },
        {
          id: 'recovery-mini', title: 'Mini Recovery Kit', image: IMG.p5, compareAt: 32.00, price: 22.00, total: 22.00,
          savings: 'Save 31%', rating: 4.7, reviewCount: 64,
          description: 'A compact recovery kit at a final one-time price.',
          quantity: 1, quantityOptions: [1], shippingLabel: 'Free',
        },
        {
          id: 'single-shaker', title: 'Classic Shaker', image: IMG.p6, compareAt: 16.00, price: 10.00, total: 10.00,
          savings: 'Save 38%', rating: 4.6, reviewCount: 51,
          description: 'Add one classic shaker before completing your order.',
          quantity: 1, quantityOptions: [1, 2], shippingLabel: 'Free',
        },
      ],
    },
  };

  const offerPolicy = () => ({
    refund_policy_page: 'pg-refund', privacy_policy_page: 'pg-privacy',
    terms_of_service_page: 'pg-terms', contact_page: 'pg-contact',
  });
  const offerSections = (prefix, downsell) => [
    { id: prefix + '-header', kind: 'checkout-offer-header' },
    { id: prefix + '-progress', kind: 'checkout-offer-progress' },
    { id: prefix + '-intro', kind: 'checkout-static-content', zone: 'progress', settings: {
      content_style: 'plain', icon: 'none', text_alignment: 'center', background_color: 'transparent', border_color: 'transparent',
      heading: downsell ? 'Before you go\u2026' : 'Please Note:',
      content: downsell
        ? '<p>We don\u2019t want you to miss out, so here\u2019s a smaller offer at our best one-time price.</p><p><strong>Add it now without re-entering your payment details.</strong></p>'
        : '<p>Due to extremely high demand, this product can sometimes go out of stock.</p><p>Your current order is already confirmed and being prepared for shipment.</p><p><strong>Add an extra supply now with this exclusive post-purchase discount.</strong></p>',
    } },
    { id: prefix + '-countdown', kind: 'checkout-countdown', zone: 'progress', settings: {
      style: 'alert', icon: 'none', prefix_text: downsell ? 'Last chance \u2014 this offer ends in' : 'But hurry, this offer ends in',
      duration: 5, text_alignment: 'center', background_color: '#FFF0F2', text_color: '#6E3038', border_color: '#F3CDD2',
    } },
    { id: prefix + '-product', kind: 'checkout-offer-product', settings: {
      accept_text: downsell ? 'Add this offer · {amount}' : 'Add to my order · {amount}',
      decline_text: downsell ? 'No thanks, complete my order' : 'No thanks, continue',
    } },
    { id: prefix + '-policy', kind: 'checkout-policy-links', settings: offerPolicy() },
  ];
  const UPSELL_TEMPLATE = { sections: offerSections('up', false) };
  const DOWNSELL_TEMPLATE = { sections: offerSections('dn', true) };

  // ==========================================================================
  //  THANK YOU PAGE (Thank you PRD) — second transaction page, shares the
  //  Checkout theme settings. Final Funnel order confirmation, not the raw
  //  checkout cart. Required components + a limited set of reusable content &
  //  trust enhancement components, in their own insertion zones. (PRD §3, §9)
  // ==========================================================================

  // Thank-you insertion zones (PRD §9.2). No commerce here — order is already
  // placed. `col` mirrors the checkout render regions: 'announce' full-bleed top,
  // 'main' left column, 'summary' the right Order Summary column, 'bottom' the
  // full-bleed band (policy links → footer). Order status stays pinned to the top;
  // nothing can be inserted above it (PRD §9.3, §9.4).
  // The six content & trust components that may live in the Order details / Contact us /
  // Order summary zones (PRD §9.2). Header / Order status only allow Static content;
  // Policy Links only Testimonials; Page bottom only Footer.
  const TY_SIX = ['checkout-trust-badges', 'checkout-static-content', 'checkout-payment-icons',
    'checkout-trustpilot', 'checkout-review-card', 'checkout-fb-comments'];
  const THANKYOU_ZONES = [
    { id: 'announce', label: 'Above header', after: null, col: 'announce', allow: ['announcement-bar'] },
    { id: 'header', label: 'Below header', after: 'checkout-header', col: 'main', allow: ['checkout-static-content'] },
    { id: 'status', label: 'Below Order status', after: 'thankyou-order-status', col: 'main', allow: ['checkout-static-content'] },
    { id: 'details', label: 'Below Order details', after: 'thankyou-order-details', col: 'main', allow: TY_SIX.slice() },
    { id: 'continue', label: 'Below Contact us', after: 'thankyou-contact-us', col: 'main', allow: TY_SIX.slice() },
    { id: 'summary', label: 'Below Order Summary', after: 'checkout-order-summary', col: 'summary', allow: TY_SIX.slice() },
    // policytop is listed before 'bottom' so drag-onto-policy-links resolves here first.
    { id: 'policytop', label: 'Below Policy Links', after: 'checkout-policy-links', col: 'bottom', allow: ['checkout-testimonials'] },
    { id: 'bottom', label: 'Page bottom', after: 'checkout-policy-links', col: 'bottom', allow: ['checkout-footer'] },
  ];

  // Thank-you skeleton (PRD §3.1, §23.2). Required components are locked; reused
  // Checkout components (header, mobile summary bar, order summary, policy links,
  // footer) carry the same behaviour they have on Checkout.
  const THANKYOU_TEMPLATE = {
    sections: [
      { id: 'ty-header', kind: 'checkout-header' },
      { id: 'ty-status', kind: 'thankyou-order-status' },
      { id: 'ty-details', kind: 'thankyou-order-details' },
      { id: 'ty-continue', kind: 'thankyou-continue-shopping' },
      { id: 'ty-contact', kind: 'thankyou-contact-us' },
      { id: 'ty-summary', kind: 'checkout-order-summary', blocks: [
        { id: 'ty-blk-lines', kind: 'cart-lines' },
        { id: 'ty-blk-subtotal', kind: 'subtotal' },
        { id: 'ty-blk-discount', kind: 'discount' },
        { id: 'ty-blk-shipping', kind: 'shipping' },
        { id: 'ty-blk-tax', kind: 'tax' },
        { id: 'ty-blk-total', kind: 'total' },
      ] },
      { id: 'ty-policy', kind: 'checkout-policy-links', settings: {
        refund_policy_page: 'pg-refund', privacy_policy_page: 'pg-privacy', terms_of_service_page: 'pg-terms', contact_page: 'pg-contact',
      } },
    ],
  };

  // Add-component catalog for the Thank-you editor (PRD §7, §9.2). Only reusable
  // content & trust enhancement components — NO commerce boosters (PRD §8).
  // Each entry carries an optional `defaultZone` — the Thank-you page's own default
  // add position (PRD §9.5). This is page-scoped (looked up by addCheckoutComponent
  // in the active page's catalog) so it never disturbs the Checkout page's defaults,
  // which come from each section's shared `def.defaultZone`.
  const THANKYOU_CATALOG = [
    { label: 'Reviews & social proof', entries: [
      { kind: 'checkout-trustpilot', name: 'Trustpilot Review', desc: 'Trustpilot-style rating & reviews (static)', defaultZone: 'summary' },
      { kind: 'checkout-review-card', name: 'Review card', desc: 'Expert / media endorsement cards', defaultZone: 'summary' },
      { kind: 'checkout-testimonials', name: 'Testimonials', desc: 'Customer reviews (bottom area only)', defaultZone: 'policytop' },
      { kind: 'checkout-fb-comments', name: 'Facebook-style Comments', desc: 'Social-proof comment thread', defaultZone: 'summary' },
    ] },
    { label: 'Trust & security', entries: [
      { kind: 'checkout-trust-badges', name: 'Trust badges', desc: 'Guarantee / security / shipping badges', defaultZone: 'summary' },
      { kind: 'checkout-payment-icons', name: 'Payment Icons', desc: 'Accepted-payment brand badges', defaultZone: 'summary' },
    ] },
    { label: 'Promotion & urgency', entries: [
      { kind: 'announcement-bar', name: 'Announcement Bar', desc: 'Post-purchase notice / next-order offer (above header)', defaultZone: 'announce' },
    ] },
    { label: 'Content & structure', entries: [
      { kind: 'checkout-static-content', name: 'Static content', desc: 'Order-processing / shipping / support notice', defaultZone: 'summary' },
      { kind: 'checkout-footer', name: 'Footer', desc: 'Thank-you footer (bottom of page only)', defaultZone: 'bottom' },
    ] },
  ];

  // Final Order Snapshot (PRD §4, §5, §14) — the FUNNEL-final order shown on the
  // Thank-you page: the Checkout cart lines PLUS one accepted upsell line. Amounts
  // are read-only final results (the page never recalculates; PRD §5.3).
  const THANKYOU_UPSELL_LINE = { id: 'up-crew', title: 'Crewneck sweater', variant: 'Sage / M', qty: 1, price: 44.0, compareAt: 0, image: IMG.p5, upsell: true };
  const THANKYOU_SNAPSHOT = {
    storeName: 'AURA',
    currency: 'USD',
    confirmationNumber: 'ABC123EXAMPLE',
    orderNumber: '#1001',
    orderStatus: 'confirmed',
    customer: { name: 'Alanna', fullName: 'Alanna Bogan', email: 'alanna.bogan@example.com', phone: '+1 (202) 456-1414' },
    shippingAddress: {
      name: 'Alanna Bogan', line1: '1600 Pennsylvania Avenue NW', city: 'Washington', state: 'DC',
      zip: '20500-0005', country: 'United States', phone: '+1 (202) 456-1414',
    },
    shippingMethod: 'Standard (Example)',
    payment: { brand: 'Visa', last4: '—', label: 'Credit card' },
    billingSameAsShipping: true,
    // Final cart lines = the original 3 Checkout items + accepted upsell (PRD §4.3).
    // Slice to the first 3 so the demo subscription/bundle lines added for the live
    // Checkout preview don't perturb the read-only snapshot's hardcoded totals below.
    lines: CHECKOUT_MOCK.cart.slice(0, 3).concat([THANKYOU_UPSELL_LINE]),
    // Read-only final amounts (USD). subtotal = Σ line totals.
    subtotal: 152.97,
    discount: 10.99,
    // Applied discount breakdown for the summary (read-only). Mirrors the applied-coupon
    // shape used on Checkout so the Order Summary itemises the same rows: the discount
    // code chip + Order discount + Shipping discount. Sums to `discount` above.
    discounts: [{ code: 'THANKS', order: 7.0, shipping: 3.99 }],
    shipping: 5.99,
    tax: 7.34,
    total: 155.31,
  };

  window.OS_DATA = {
    THEMES, PAGE_OPTIONS, CATALOG, SETTINGS_GROUPS, SAMPLE, DEFAULT_THEME,
    CHECKOUT_PAGES, CHECKOUT_TEMPLATE_SETS, CHECKOUT_SETTINGS_GROUPS, CHECKOUT_TEMPLATE, CHECKOUT_MOCK, CHECKOUT_COMMERCE, CHECKOUT_CONTENT, CHECKOUT_ZONES, CHECKOUT_CATALOG,
    UPSELL_TEMPLATE, DOWNSELL_TEMPLATE, OFFER_ZONES, OFFER_CATALOG, OFFER_MOCKS,
    THANKYOU_TEMPLATE, THANKYOU_ZONES, THANKYOU_CATALOG, THANKYOU_SNAPSHOT,
  };
})();
