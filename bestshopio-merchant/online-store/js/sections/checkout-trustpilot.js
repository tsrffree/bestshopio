/* Checkout · Trustpilot Review (Content PRD §10) — Section + Review blocks.
   Static configuration only — not connected to the Trustpilot API. Make sure you have
   the right to display these reviews and ratings (PRD §19.2). */
(function () {
  if (!window.OS) return;
  const { esc } = OS;

  const GREEN = '#00B67A';
  const EMPTY = '#DCDCE6';
  const STAR = (color, size) => '<svg viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) + '" fill="' + color + '" stroke="none"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>';

  // Official Trustpilot rating style: green squares with a white star. Fractional ratings
  // (e.g. 4.4) split the last square green/grey via a green row clipped to the % width,
  // overlaid on a grey base row — the white star stays continuous across the seam.
  function stars(n) {
    n = Math.max(0, Math.min(5, Number(n) || 0));
    const pct = (n / 5) * 100;
    const row = (bg) => { let h = ''; for (let i = 0; i < 5; i++) h += '<span class="cktp-star" style="background:' + bg + '">' + STAR('#fff', 14) + '</span>'; return h; };
    return '<span class="cktp-stars">' +
      '<span class="cktp-stars-row">' + row(EMPTY) + '</span>' +
      '<span class="cktp-stars-row cktp-stars-fill" style="width:' + pct + '%">' + row(GREEN) + '</span>' +
    '</span>';
  }

  OS.register('checkout-trustpilot', {
    name: 'Trustpilot Review', icon: 'star',
    defaultZone: 'summary',
    schema: [
      { info: 'Static reviews only. Make sure you have the right to display this review and rating.' },
      { key: 'rating_label', label: 'Rating label', control: 'text', default: 'Excellent' },
      { key: 'overall_rating', label: 'Overall rating', control: 'number', default: 5, min: 0, max: 5, step: 0.1 },
      { key: 'show_trustpilot', label: 'Show Trustpilot text', control: 'toggle', default: true },
      { key: 'trustpilot_text', label: 'Trustpilot logo / text', control: 'text', default: 'Trustpilot', visibleWhen: (s) => s.show_trustpilot },
      { sub: 'Style' },
      { key: 'background_color', label: 'Background color', control: 'color', default: '#FFFFFF', allowTransparent: true },
      { key: 'border_color', label: 'Border color', control: 'color', default: '#E5E5E5', allowTransparent: true },
      { key: 'border_radius', label: 'Border radius', control: 'number', default: 8, min: 0, max: 24 },
      { sub: 'Advanced' },
      { key: 'custom_css', label: 'Custom CSS', control: 'custom_css', default: '' },
    ],
    defaults() { return {}; },
    blocks: {
      name: 'Review', kind: 'review', max: 20,
      fields: [
        { key: 'star_rating', label: 'Star rating', control: 'range', default: 5, min: 1, max: 5, step: 1 },
        { key: 'review_title', label: 'Review title', control: 'text', default: '' },
        { key: 'review_content', label: 'Review content', control: 'textarea', default: '' },
        { key: 'reviewer_name', label: 'Reviewer name', control: 'text', default: '' },
        { key: 'review_date', label: 'Review date', control: 'text', default: '', placeholder: 'e.g. May 12, 2026' },
        { key: 'verified_text', label: 'Verified text', control: 'text', default: '', placeholder: 'Verified customer' },
      ],
      defaults: () => ({ star_rating: 5 }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('tp'), kind: 'review', hidden: false, settings: { star_rating: 5, review_title: 'Exactly as described', review_content: 'Ordering was effortless and the quality blew me away. Shipping was quick too — will definitely buy again.', reviewer_name: 'Hannah W.', review_date: 'May 18, 2026', verified_text: 'Verified customer' } },
      { id: OS.uid('tp'), kind: 'review', hidden: false, settings: { star_rating: 5, review_title: 'Great experience', review_content: 'Customer service answered all my questions fast and the product is fantastic value.', reviewer_name: 'Marco D.', review_date: 'May 9, 2026', verified_text: 'Verified customer' } },
    ]),

    render(s, blocks) {
      const rating = s.overall_rating == null ? 5 : Number(s.overall_rating);
      const summary = '<div class="cktp-summary">' +
        (s.rating_label ? '<span class="cktp-label">' + esc(s.rating_label) + '</span>' : '') +
        stars(rating) +
        (s.show_trustpilot && s.trustpilot_text ? '<span class="cktp-brand"><span class="cktp-brand-star">' + STAR(GREEN, 16) + '</span>' + esc(s.trustpilot_text) + '</span>' : '') +
      '</div>';
      const vis = (blocks || []).filter((b) => !b.hidden && b.settings.review_content);
      const cards = vis.map((b0) => {
        const b = b0.settings;
        return '<div class="cktp-card" data-block-id="' + esc(b0.id) + '" style="border-color:' + (OS.bgOrTransparent(s.border_color) || '#E5E5E5') + ';border-radius:' + (s.border_radius == null ? 8 : s.border_radius) + 'px">' +
          stars(Number(b.star_rating) || 5) +
          (b.review_title ? '<div class="cktp-rt">' + esc(b.review_title) + '</div>' : '') +
          '<div class="cktp-rc">' + esc(b.review_content) + '</div>' +
          '<div class="cktp-rmeta">' +
            (b.reviewer_name ? '<span class="cktp-rn">' + esc(b.reviewer_name) + '</span>' : '') +
            (b.verified_text ? '<span class="cktp-verified">✓ ' + esc(b.verified_text) + '</span>' : '') +
            (b.review_date ? '<span class="cktp-rd">' + esc(b.review_date) + '</span>' : '') +
          '</div>' +
        '</div>';
      }).join('');
      if (!vis.length && !s.rating_label && !s.overall_rating) return '<div class="cksec" style="display:none"></div>';
      return '<div class="cksec cktp" style="background:' + (OS.bgOrTransparent(s.background_color) || '#fff') + ';border-radius:' + (s.border_radius == null ? 8 : s.border_radius) + 'px">' +
        summary +
        (cards ? '<div class="cktp-list">' + cards + '</div>' : '') +
        (s.custom_css ? '<style>' + s.custom_css + '</style>' : '') +
      '</div>';
    },
  });

  OS.css('cktp', `
  .cktp{padding:18px}
  .cktp-summary{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}
  .cktp-label{font-weight:800;font-size:calc(var(--ck-base-fs) + 1px);color:var(--ck-text)}
  .cktp-stars{position:relative;display:inline-flex;line-height:0;vertical-align:middle}
  .cktp-stars-row{display:inline-flex;gap:3px}
  .cktp-stars-fill{position:absolute;top:0;left:0;overflow:hidden;white-space:nowrap;pointer-events:none}
  .cktp-star{width:20px;height:20px;border-radius:3px;display:inline-flex;align-items:center;justify-content:center}
  .cktp-brand{display:inline-flex;align-items:center;gap:5px;font-weight:700;font-size:var(--ck-small-fs);color:var(--ck-text)}
  .cktp-brand-star{display:inline-flex;align-items:center}
  .cktp-list{display:flex;flex-direction:column;gap:12px}
  .cktp-card{border:1px solid #E5E5E5;padding:14px;background:#fff}
  .cktp-card .cktp-stars{margin-bottom:8px}
  .cktp-rt{font-weight:700;font-size:var(--ck-base-fs);color:var(--ck-text);margin-bottom:4px}
  .cktp-rc{font-size:var(--ck-small-fs);line-height:1.6;color:var(--ck-text)}
  .cktp-rmeta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:10px;font-size:var(--ck-small-fs);color:var(--ck-muted)}
  .cktp-rn{font-weight:600;color:var(--ck-text)}
  .cktp-verified{color:#00B67A;font-weight:600}
  `);
})();
