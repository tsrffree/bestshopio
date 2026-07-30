/* Checkout · Shipping Insurance (Commerce PRD §8) — opt-in delivery-protection service.
   Price & Order-Summary image are configured on the component (Item 1); the buyer ticks
   the card to add the fee to the order. Addable / hideable / deletable / draggable.
   Prototype: ticking recalculates the shared Order Summary via OS.ckRecalc(). */
(function () {
  if (!window.OS) return;
  const { esc, money } = OS;

  const SHIELD = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

  OS.register('checkout-shipping-insurance', {
    name: 'Shipping Insurance', icon: 'layers',
    defaultZone: 'cta',
    schema: [
      { info: 'Offers delivery protection as a tickable add-on. Price & Order-Summary image are configured here.' },
      { key: 'heading', label: 'Heading', control: 'text', default: 'Shipping Insurance', placeholder: 'Shipping Insurance', info: 'Leave empty to show only the card.' },
      { sub: 'Content' },
      { key: 'title', label: 'Title', control: 'text', default: 'Shipping insurance', placeholder: 'Shipping insurance' },
      { key: 'description', label: 'Description', control: 'text', default: 'Receive your order faster for just $3.95', info: 'Supports a price variable.' },
      { key: 'price', label: 'Price', control: 'number', default: 3.95, min: 0, step: 0.01, info: 'Fee added to the Order Summary when selected.' },
      { key: 'image', label: 'Order Summary image', control: 'image', default: '', info: 'Product image shown in the Order Summary line.' },
      { key: 'social_proof', label: 'Social proof', control: 'text', default: '88% of people choose this option', info: 'Optional reassurance line.' },
      { key: 'icon', label: 'Icon', control: 'image', default: '', info: 'Card icon (distinct from the Order-Summary image). SVG / PNG. Falls back to a shield icon.' },
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

    render(s, blocks, ctx) {
      const st = (OS.ckState || {})[ctx.sectionId] || {};
      const sel = ('selected' in st) ? st.selected : !!s.default_selected;
      const radius = (s.border_radius == null ? 8 : s.border_radius);
      const border = s.border_color || '#DDDDDD';
      const selBorder = s.selected_border_color || 'var(--ck-accent)';
      const bg = s.background_color || 'transparent';
      const txt = s.text_color || 'var(--ck-text)';
      const dashed = (s.card_style || 'border') === 'dashed';

      const icon = s.icon
        ? '<img class="ckins-iconimg" src="' + esc(s.icon) + '" alt="">'
        : SHIELD;
      // Price is now component-level config (Item 1) — no longer pulled from a bound product.
      const price = (s.price == null ? 3.95 : s.price);
      const desc = (s.description || '').replace(/\$[\d.,]+/g, '$' + Number(price).toFixed(2)).trim();
      const descHtml = desc ? '<div class="ckins-desc">' + esc(desc) + '</div>' : '';
      const proof = s.social_proof ? '<div class="ckins-proof">' + esc(s.social_proof) + '</div>' : '';
      const title = s.title ? '<div class="ckins-title">' + esc(s.title) + '</div>' : '';
      const heading = s.heading ? '<h3 class="ck-h">' + esc(s.heading) + '</h3>' : '';

      const cardStyle = 'border-color:' + (sel ? selBorder : border) + ';border-radius:' + radius + 'px;background:' + bg +
        ';border-style:' + (dashed ? 'dashed' : 'solid') + ';--ckins-sel:' + selBorder;
      return '<div class="cksec ckins" style="color:' + txt + '">' + heading +
        '<label class="ckins-card' + (sel ? ' sel' : '') + '" data-ckins-card style="' + cardStyle + '">' +
          '<span class="ckins-icon">' + icon + '</span>' +
          '<div class="ckins-main">' + title + descHtml + proof + '</div>' +
          '<span class="ckins-check' + (sel ? ' on' : '') + '" data-ckins-check role="checkbox" aria-checked="' + (sel ? 'true' : 'false') + '">' + CHECK + '</span>' +
        '</label>' +
        (s.custom_css ? '<style>' + s.custom_css + '</style>' : '') +
      '</div>';
    },

    hydrate(el, settings, blocks, ctx) {
      const card = el.querySelector('[data-ckins-card]'); if (!card) return;
      const chk = card.querySelector('[data-ckins-check]');
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

  OS.css('ckins', `
  .ckins-card{display:flex;align-items:center;gap:14px;border:1px solid #DDDDDD;padding:16px;cursor:pointer;transition:border-color .15s}
  .ckins-card.sel{border-color:var(--ckins-sel,var(--ck-accent))}
  .ckins-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;color:var(--ck-accent)}
  .ckins-iconimg{width:28px;height:28px;object-fit:contain}
  .ckins-main{flex:1;min-width:0}
  .ckins-title{font-size:var(--ck-base-fs);font-weight:700;line-height:1.4}
  .ckins-desc{font-size:var(--ck-small-fs);color:var(--ck-muted);line-height:1.45;margin-top:2px}
  .ckins-proof{font-size:var(--ck-small-fs);color:var(--ck-muted);line-height:1.45}
  .ckins-check{flex:none;width:24px;height:24px;border:1.5px solid var(--ck-input-border);border-radius:6px;display:inline-flex;align-items:center;justify-content:center;
    color:#fff;background:transparent;transition:background .12s,border-color .12s}
  .ckins-check svg{opacity:0;transition:opacity .12s}
  .ckins-check.on{background:var(--ckins-sel,var(--ck-accent));border-color:var(--ckins-sel,var(--ck-accent))}
  .ckins-check.on svg{opacity:1}
  `);
})();
