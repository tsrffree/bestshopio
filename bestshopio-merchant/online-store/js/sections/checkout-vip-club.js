/* Checkout · VIP Club (Commerce PRD §9) — opt-in membership add-on.
   Price & Order-Summary image are configured on the component (Item 1); the buyer ticks
   the card to add it to the order. Addable / hideable / deletable / draggable. Prototype:
   ticking recalculates the shared Order Summary via OS.ckRecalc(). Complex subscription /
   recurring-billing compliance is out of scope this round (PRD §9.1). */
(function () {
  if (!window.OS) return;
  const { esc } = OS;

  const CHECK = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

  OS.register('checkout-vip-club', {
    name: 'VIP Club', icon: 'badgePercent',
    defaultZone: 'cta',
    schema: [
      { info: 'Offers a membership the buyer can tick to join. Price & Order-Summary image are configured here.' },
      { sub: 'Content' },
      { key: 'title', label: 'Title', control: 'text', default: 'Welcome to the VIP Club!', placeholder: 'Welcome to the VIP Club!' },
      { key: 'description', label: 'Description', control: 'richtext', default: '', info: 'Membership perks. Basic HTML allowed.' },
      { key: 'price', label: 'Price', control: 'number', default: 29.99, min: 0, step: 0.01, info: 'Membership fee added to the Order Summary when selected.' },
      { key: 'image', label: 'Order Summary image', control: 'image', default: '', info: 'Image shown in the Order Summary line.' },
      { sub: 'Behavior' },
      { key: 'default_selected', label: 'Default selected', control: 'toggle', default: false, info: 'Add to the order on page load.' },
      { sub: 'Style' },
      { key: 'card_style', label: 'Card style', control: 'select', default: 'border', options: [
        { value: 'border', label: 'Border card' }, { value: 'dashed', label: 'Dashed card' } ] },
      { key: 'background_color', label: 'Background color', control: 'color', default: '' },
      { key: 'border_color', label: 'Border color', control: 'color', default: '#DDDDDD' },
      { key: 'selected_border_color', label: 'Selected border color', control: 'color', default: '', info: 'Empty inherits the Accent color.' },
      { key: 'text_color', label: 'Text color', control: 'color', default: '' },
      { key: 'border_radius', label: 'Border radius', control: 'number', default: 8, min: 0, max: 24 },
      { sub: 'Advanced' },
      { key: 'custom_css', label: 'Custom CSS', control: 'custom_css', default: '', info: 'Applies to this component only.' },
    ],
    defaults() {
      return { description: 'Get exclusive perks with your order including priority shipping, 30 day no-risk money back, and bonus access to our VIP Club for exclusive products and discounts! You will be billed $29.99 after your first month. Cancel at any time by contacting us or through the Member Portal.' };
    },

    render(s, blocks, ctx) {
      const st = (OS.ckState || {})[ctx.sectionId] || {};
      const sel = ('selected' in st) ? st.selected : !!s.default_selected;
      const radius = (s.border_radius == null ? 8 : s.border_radius);
      const border = s.border_color || '#DDDDDD';
      const selBorder = s.selected_border_color || 'var(--ck-accent)';
      const bg = s.background_color || 'transparent';
      const txt = s.text_color || 'var(--ck-text)';
      const dashed = (s.card_style || 'border') === 'dashed';
      const title = s.title || 'Welcome to the VIP Club!';
      const desc = s.description ? '<div class="ckvip-desc">' + s.description + '</div>' : '';

      const cardStyle = 'border-color:' + (sel ? selBorder : border) + ';border-radius:' + radius + 'px;background:' + bg +
        ';border-style:' + (dashed ? 'dashed' : 'solid') + ';--ckvip-sel:' + selBorder;
      return '<div class="cksec ckvip" style="color:' + txt + '">' +
        '<label class="ckvip-card' + (sel ? ' sel' : '') + '" data-ckvip-card style="' + cardStyle + '">' +
          '<div class="ckvip-head">' +
            '<span class="ckvip-check' + (sel ? ' on' : '') + '" data-ckvip-check role="checkbox" aria-checked="' + (sel ? 'true' : 'false') + '">' + CHECK + '</span>' +
            '<div class="ckvip-title">' + esc(title) + '</div>' +
          '</div>' + desc +
        '</label>' +
        (s.custom_css ? '<style>' + s.custom_css + '</style>' : '') +
      '</div>';
    },

    hydrate(el, settings, blocks, ctx) {
      const card = el.querySelector('[data-ckvip-card]'); if (!card) return;
      const chk = card.querySelector('[data-ckvip-check]');
      const id = ctx && ctx.sectionId;
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const on = !card.classList.contains('sel');
        card.classList.toggle('sel', on);
        if (chk) { chk.classList.toggle('on', on); chk.setAttribute('aria-checked', on ? 'true' : 'false'); }
        if (id) { OS.ckSet(id, { selected: on }); OS.ckRecalc(); }
      });
    },
  });

  OS.css('ckvip', `
  .ckvip-card{display:block;border:1px solid #DDDDDD;padding:16px 18px;cursor:pointer;transition:border-color .15s}
  .ckvip-card.sel{border-color:var(--ckvip-sel,var(--ck-accent))}
  .ckvip-head{display:flex;align-items:center;gap:12px}
  .ckvip-check{flex:none;width:24px;height:24px;border:1.5px solid var(--ck-input-border);border-radius:6px;display:inline-flex;align-items:center;justify-content:center;
    color:#fff;background:transparent;transition:background .12s,border-color .12s}
  .ckvip-check svg{opacity:0;transition:opacity .12s}
  .ckvip-check.on{background:var(--ckvip-sel,var(--ck-accent));border-color:var(--ckvip-sel,var(--ck-accent))}
  .ckvip-check.on svg{opacity:1}
  .ckvip-title{font-size:var(--ck-base-fs);font-weight:700;line-height:1.4}
  .ckvip-desc{font-size:var(--ck-small-fs);color:var(--ck-muted);line-height:1.55;margin-top:10px}
  .ckvip-desc p{margin:0 0 8px}
  .ckvip-desc p:last-child{margin-bottom:0}
  `);
})();
