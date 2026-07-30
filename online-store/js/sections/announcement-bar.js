/* Announcement bar — global Header-Group section, rotating Message blocks (max 5).
   Ported from announcement-bar.canvas.tsx (lean). Background inherits theme Primary color. */
(function () {
  const OS = window.OS;
  OS.css('announcement', [
    '.abx{display:flex;align-items:center;justify-content:center;gap:14px;padding:8px 16px;text-align:center;letter-spacing:.02em;line-height:1.3}',
    '.abx-msg u{cursor:pointer}',
    '.abx-arr{border:0;background:none;color:inherit;font-size:18px;line-height:1;cursor:pointer;opacity:.8;padding:0 2px}',
    '.abx-arr:hover{opacity:1}',
    '.abx-auto{justify-content:flex-start;overflow:hidden;gap:0}',
    '.abx-track{display:flex;flex-wrap:nowrap;align-items:center;white-space:nowrap;will-change:transform;animation:abx-marquee 20s linear infinite}',
    '.abx-track:hover{animation-play-state:paused}',
    '.abx-grp{display:flex;flex:0 0 auto;align-items:center}',
    '.abx-item{display:inline-flex;align-items:center;white-space:nowrap}',
    '.abx-item u{cursor:pointer}',
    '.abx-sep{opacity:.55;margin:0 14px}',
    '@keyframes abx-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}',
    '@media (prefers-reduced-motion:reduce){.abx-track{animation:none}}',
  ].join(''));

  const SIZE = { xsmall: 11, small: 12, medium: 13, large: 14 };

  OS.register('announcement-bar', {
    name: 'Announcement bar', group: 'header', icon: 'layers',
    // On Checkout the bar is locked to the top 'announce' zone — selectable/hideable but not
    // draggable (mirrors the Footer's fixedBottom pinning). checkoutRow() reads this flag.
    pinnedTop: true,
    schema: [
      { key: 'sticky', control: 'toggle', label: 'Enable sticky bar', default: false },
      { key: 'navigation', control: 'select', label: 'Multiple message navigation', default: 'arrows', options: [{ value: 'arrows', label: 'Arrows' }, { value: 'auto', label: 'Auto-scrolling' }] },
      { key: 'auto_rotate', control: 'toggle', label: 'Auto rotate between messages', default: true, visibleWhen: (s) => s.navigation !== 'auto' },
      { key: 'rotate_seconds', control: 'range', label: 'Change messages every', min: 4, max: 20, step: 1, unit: 's', default: 4, visibleWhen: (s) => s.navigation !== 'auto' && s.auto_rotate },
      { key: 'text_size', control: 'select', label: 'Text size', default: 'large', options: [{ value: 'xsmall', label: 'X-Small' }, { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }] },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: '', allowTransparent: true, info: 'Defaults to your theme Primary color.' },
      { key: 'text', control: 'color', label: 'Text', default: '#FFFFFF' },
    ],
    blocks: {
      name: 'Message', kind: 'message', max: 5,
      fields: [
        { key: 'text', control: 'text', label: 'Text', default: '', required: true, placeholder: 'Announcement text' },
        { key: 'link', control: 'url', label: 'Link', default: '', placeholder: 'https://…' },
      ],
      defaults: () => ({ text: 'Free shipping on orders over $79', link: '' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('msg'), kind: 'message', hidden: false, settings: { text: 'Free shipping on orders over $79', link: '' } },
      { id: OS.uid('msg'), kind: 'message', hidden: false, settings: { text: '30% off all dresses — this week only', link: '/collections/sale' } },
      { id: OS.uid('msg'), kind: 'message', hidden: false, settings: { text: 'New spring arrivals just dropped', link: '/collections/new-arrivals' } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens;
      // Checkout reuse (Content PRD §6.2): the same component is allowed on Checkout but
      // the click-through link is dropped there to avoid pulling buyers out of the funnel.
      const noLink = ctx.surface === 'checkout';
      let bg = OS.bgOrTransparent(OS.col(s.background, (t.colors && t.colors.primary_color) || '#103635'));
      const vis = (blocks || []).filter((b) => !b.hidden && b.settings.text) ;
      const list = vis.length ? vis : [{ id: '_', settings: { text: 'Add a message to this announcement bar.' } }];
      const multi = list.length > 1;
      const style = 'background:' + bg + ';color:' + (s.text || '#fff') + ';font-size:' + OS.fs(t, SIZE[s.text_size] || 14) + 'px';
      // Auto-scrolling (marquee): render every message in a continuously translating track.
      // The track holds two identical groups so a -50% shift loops seamlessly (see .abx CSS).
      if (s.navigation === 'auto' && multi) {
        const item = (b) => '<span class="abx-item" data-block-id="' + OS.esc(b.id) + '">' + OS.esc(b.settings.text) + (b.settings.link && !noLink ? ' <u>Shop now</u>' : '') + '</span>';
        const sep = '<span class="abx-sep" aria-hidden="true">\u00b7</span>';
        const seq = list.map((b) => item(b) + sep).join('');
        const grp = (hidden) => '<div class="abx-grp"' + (hidden ? ' aria-hidden="true"' : '') + '>' + seq + '</div>';
        return '<div class="abx abx-auto" style="' + style + '"><div class="abx-track">' + grp(false) + grp(true) + '</div></div>';
      }
      const m0 = list[0];
      const arr = (dir) => '<button class="abx-arr" data-ab-' + dir + '>' + (dir === 'prev' ? '‹' : '›') + '</button>';
      const msg = '<span class="abx-msg" data-block-id="' + OS.esc(m0.id) + '">' + OS.esc(m0.settings.text) + (m0.settings.link && !noLink ? ' <u>Shop now</u>' : '') + '</span>';
      return '<div class="abx" style="' + style + '">' +
        (multi ? arr('prev') : '') + msg + (multi ? arr('next') : '') + '</div>';
    },
    hydrate: function (root, s, blocks, ctx) {
      const noLink = ctx && ctx.surface === 'checkout';
      const vis = (blocks || []).filter((b) => !b.hidden && b.settings.text);
      if (vis.length < 2) return;
      if (root._t) { clearInterval(root._t); root._t = null; }
      // Marquee mode: set the animation duration from the content width for a constant speed
      // (~60px/s) so short and long tracks scroll at the same pace. CSS carries a fallback.
      if (s.navigation === 'auto') {
        const track = root.querySelector('.abx-track');
        const grp = root.querySelector('.abx-grp');
        if (track && grp) {
          const tune = () => { const w = grp.getBoundingClientRect().width; if (w) track.style.animationDuration = Math.max(6, Math.round(w / 60)) + 's'; };
          tune();
          requestAnimationFrame(tune);
        }
        return;
      }
      const msgEl = root.querySelector('.abx-msg'); let i = 0;
      const show = (n) => { i = (n + vis.length) % vis.length; const b = vis[i]; msgEl.innerHTML = OS.esc(b.settings.text) + (b.settings.link && !noLink ? ' <u>Shop now</u>' : ''); msgEl.setAttribute('data-block-id', b.id); };
      const p = root.querySelector('[data-ab-prev]'), n = root.querySelector('[data-ab-next]');
      if (p) p.onclick = (e) => { e.stopPropagation(); show(i - 1); };
      if (n) n.onclick = (e) => { e.stopPropagation(); show(i + 1); };
      if (s.auto_rotate) {
        const ms = Math.max(2, s.rotate_seconds || 4) * 1000;
        root._t = setInterval(() => { if (!document.body.contains(root)) { clearInterval(root._t); return; } show(i + 1); }, ms);
      }
    },
  });
})();
