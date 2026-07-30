/* Checkout · Testimonials (Content PRD §12) — adapted from the Online Store Testimonial.
   Same review cards (avatar / rating / author / verified) WITHOUT the associated-product
   config. Bottom-area only (Policy Links / above Footer). */
(function () {
  if (!window.OS) return;
  const { esc } = OS;
  const IMG = (OS.sample && OS.sample.IMG) || {};

  const STAR = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" stroke="none"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>';
  const stars = (n, color) => { let h = ''; for (let i = 1; i <= 5; i++) h += '<span style="color:' + (n >= i ? color : '#d8dce3') + '">' + STAR + '</span>'; return '<div class=" cktm-stars">' + h + '</div>'; };

  OS.register('checkout-testimonials', {
    name: 'Testimonials', icon: 'layers',
    // Bottom-area only (above Footer) — like the Footer it can't be reordered out of the
    // page-bottom band, so the tree shows a lock instead of a drag grip.
    pinned: true,
    schema: [
      { key: 'subheading', label: 'Subheading', control: 'text', default: '' },
      { key: 'heading', label: 'Heading', control: 'text', default: 'What our customers say' },
      { key: 'desktop_columns', control: 'range', label: 'Desktop columns', min: 1, max: 4, step: 1, default: 3 },
      { key: 'mobile_columns', control: 'range', label: 'Mobile columns', min: 1, max: 2, step: 1, default: 1 },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'card_background', control: 'color', label: 'Card background', default: '#FFFFFF', allowTransparent: true },
      { key: 'star_color', control: 'color', label: 'Star color', default: '#F5B301' },
      { key: 'verified_color', control: 'color', label: 'Verified badge', default: '#22C55E' },
      { sub: 'Advanced' },
      { key: 'custom_css', control: 'custom_css', label: 'Custom CSS', default: '' },
    ],
    defaults() { return {}; },
    blocks: {
      name: 'Testimonial', kind: 'review', max: 20,
      fields: [
        { key: 'avatar', control: 'image', label: 'Avatar', default: '' },
        { key: 'round_avatar', control: 'toggle', label: 'Round avatar', default: true },
        { key: 'show_rating', control: 'toggle', label: 'Show rating', default: true },
        { key: 'rating', control: 'range', label: 'Rating', min: 1, max: 5, step: 0.5, default: 5, visibleWhen: (s) => s.show_rating },
        { key: 'author', control: 'text', label: 'Author', default: '' },
        { key: 'show_verified', control: 'toggle', label: 'Show verified buyer', default: false },
        { key: 'heading', control: 'text', label: 'Heading', default: '' },
        { key: 'content', control: 'richtext', label: 'Content', default: '', required: true },
      ],
      defaults: () => ({ round_avatar: true, show_rating: true, rating: 5, content: 'Absolutely love it — exactly as described and great quality.' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('ctm'), kind: 'review', hidden: false, settings: { avatar: IMG.av1, round_avatar: true, show_rating: true, rating: 5, author: 'Sarah M.', show_verified: true, heading: 'Pure quality', content: 'The fit is perfect and the fabric feels amazing. I’ve already ordered two more.' } },
      { id: OS.uid('ctm'), kind: 'review', hidden: false, settings: { avatar: IMG.av2, round_avatar: true, show_rating: true, rating: 4.5, author: 'James L.', show_verified: true, heading: 'Great value', content: 'Shipping was fast and the product exceeded my expectations for the price.' } },
      { id: OS.uid('ctm'), kind: 'review', hidden: false, settings: { avatar: IMG.av3, round_avatar: true, show_rating: true, rating: 5, author: 'Mei K.', show_verified: false, heading: 'Obsessed', content: 'My new favourite. Comfortable enough to wear every single day.' } },
    ]),

    render(s, blocks, ctx) {
      const mob = ctx && ctx.mob;
      const cardBg = OS.bgOrTransparent(s.card_background) || '#fff';
      const cols = mob ? OS.clamp(s.mobile_columns, 1, 2, 1) : OS.clamp(s.desktop_columns, 1, 4, 3);
      const items = (blocks || []).filter((b) => !b.hidden && b.settings.content);
      if (!items.length) return '<div class="cksec" style="display:none"></div>';
      const cards = items.map((b0) => {
        const b = b0.settings;
        return '<div class="cktm-card" data-block-id="' + esc(b0.id) + '" style="background:' + cardBg + ';text-align:left">' +
          (b.show_rating ? stars(b.rating, s.star_color || '#f5b301') : '') +
          (b.heading ? '<div class="cktm-h">' + esc(b.heading) + '</div>' : '') +
          '<div class="cktm-q">' + (b.content || '') + '</div>' +
          '<div class="cktm-author">' + (b.avatar ? '<div class="cktm-av' + (b.round_avatar ? ' round' : '') + '" style="background-image:url(' + esc(b.avatar) + ')"></div>' : '') +
          '<div><div class="cktm-name">' + esc(b.author || 'Verified buyer') + '</div>' + (b.show_verified ? '<div class="cktm-verified" style="color:' + (s.verified_color || '#22c55e') + '">✓ Verified buyer</div>' : '') + '</div></div>' +
        '</div>';
      }).join('');
      const head = '<div class="cktm-head">' + (s.subheading ? '<div class="cktm-sub">' + esc(s.subheading) + '</div>' : '') +
        (s.heading ? '<div class="cktm-title">' + esc(s.heading) + '</div>' : '') + '</div>';
      return '<div class="cksec cktm" style="background:' + (OS.bgOrTransparent(s.background) || 'transparent') + '">' +
        head + '<div class="cktm-grid" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))">' + cards + '</div>' +
        (s.custom_css ? '<style>' + s.custom_css + '</style>' : '') +
      '</div>';
    },
  });

  OS.css('cktm', `
  .cktm-head{text-align:center;margin-bottom:18px}
  .cktm-sub{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.6;margin-bottom:6px}
  .cktm-title{font-family:var(--ck-heading-font);font-size:calc(var(--ck-heading-fs) + 6px);font-weight:var(--ck-fw-h);color:var(--ck-text);line-height:1.15}
  .cktm-grid{display:grid;gap:16px}
  .cktm-card{border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:10px;box-shadow:0 1px 3px rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.05);color:var(--ck-text)}
  .cktm-stars{display:flex;gap:2px}
  .cktm-h{font-weight:700;font-size:var(--ck-base-fs)}
  .cktm-q{font-size:var(--ck-small-fs);line-height:1.6}
  .cktm-q p{margin:0 0 6px}.cktm-q p:last-child{margin-bottom:0}
  .cktm-author{display:flex;align-items:center;gap:10px;margin-top:auto}
  .cktm-av{width:38px;height:38px;background-size:cover;background-position:center;background-color:#e7e9ee;flex:none}
  .cktm-av.round{border-radius:50%}
  .cktm-name{font-size:var(--ck-small-fs);font-weight:600}
  .cktm-verified{font-size:11px}
  `);
})();
