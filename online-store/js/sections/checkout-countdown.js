/* Checkout · Countdown (Content PRD §7) — static urgency timer.
   Section only (no blocks). Inline / Alert bar / Success bar styles. The timer is a
   visual countdown only — it does not reflect real stock or reservation (PRD §19.1). */
(function () {
  if (!window.OS) return;
  const { esc } = OS;

  const ICONS = {
    warning: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    fire: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none"><path d="M12 2s5 4 5 9a5 5 0 0 1-10 0c0-1.3.5-2.4 1-3 .2 1 .8 1.7 1.6 1.7.9 0 1.4-.7 1.4-1.7 0-2-1.5-3.5-1.5-3.5S12 4 12 2z"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    truck: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  };

  OS.register('checkout-countdown', {
    name: 'Countdown', icon: 'layers',
    schema: [
      { info: 'Static urgency timer. The countdown does not reflect real stock — avoid misleading scarcity claims.' },
      { key: 'style', label: 'Countdown style', control: 'select', default: 'alert', options: [
        { value: 'inline', label: 'Inline' }, { value: 'alert', label: 'Alert bar' } ] },
      { key: 'icon', label: 'Icon', control: 'select', default: 'warning', options: [
        { value: 'none', label: 'No icon' }, { value: 'warning', label: 'Warning' }, { value: 'clock', label: 'Clock' }, { value: 'fire', label: 'High demand' }, { value: 'truck', label: 'Truck' }, { value: 'check', label: 'Check' } ] },
      { key: 'prefix_text', label: 'Prefix text', control: 'text', default: 'We will reserve your order for', placeholder: 'We will reserve your order for' },
      { sub: 'Timer' },
      { key: 'duration', label: 'Countdown duration (minutes)', control: 'number', default: 10, min: 1, max: 1440 },
      { key: 'time_format', label: 'Time format', control: 'select', default: 'mmss', options: [
        { value: 'mmss', label: 'MM:SS' }, { value: 'hhmmss', label: 'HH:MM:SS' } ] },
      { key: 'expired_behavior', label: 'Expired behavior', control: 'select', default: 'stop', options: [
        { value: 'stop', label: 'Stop at 0' }, { value: 'restart', label: 'Restart' }, { value: 'hide', label: 'Hide section' } ] },
      { key: 'expired_text', label: 'Expired text', control: 'text', default: '0:00', placeholder: '0:00' },
      { sub: 'Style' },
      { key: 'text_alignment', label: 'Text alignment', control: 'segmented', default: 'left', options: [
        { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' } ] },
      { key: 'background_color', label: 'Background color', control: 'color', default: '#FFF2F2', allowTransparent: true },
      { key: 'text_color', label: 'Text color', control: 'color', default: '#B42318' },
      { key: 'border_color', label: 'Border color', control: 'color', default: '#F5C2C2', allowTransparent: true },
      { key: 'border_radius', label: 'Border radius', control: 'number', default: 8, min: 0, max: 24 },
      { sub: 'Advanced' },
      { key: 'custom_css', label: 'Custom CSS', control: 'custom_css', default: '', info: 'Applies to this component only.' },
    ],
    defaults() { return {}; },

    render(s, blocks, ctx) {
      const style = s.style || 'alert';
      const inline = style === 'inline';
      const align = s.text_alignment === 'center' ? 'center' : 'left';
      const dur = Math.max(1, Number(s.duration) || 10) * 60;
      const ico = (s.icon && s.icon !== 'none') ? '<span class="ckcd-ico">' + (ICONS[s.icon] || ICONS.warning) + '</span>' : '';
      const prefix = s.prefix_text ? '<span class="ckcd-pre">' + esc(s.prefix_text) + '</span>' : '';
      const fmt = s.time_format || 'mmss';
      const box = inline ? '' : ('background:' + (OS.bgOrTransparent(s.background_color) || '#FFF2F2') + ';border:1px solid ' + (OS.bgOrTransparent(s.border_color) || '#F5C2C2') + ';border-radius:' + (s.border_radius == null ? 8 : s.border_radius) + 'px;padding:12px 16px;');
      return '<div class="cksec ckcd ckcd-' + style + '" style="color:' + (s.text_color || '#B42318') + ';text-align:' + align + '">' +
        '<div class="ckcd-bar" style="justify-content:' + (align === 'center' ? 'center' : 'flex-start') + ';' + box + '" ' +
          'data-ckcd data-dur="' + dur + '" data-fmt="' + fmt + '" data-exp="' + esc(s.expired_behavior || 'stop') + '" data-exptext="' + esc(s.expired_text || '0:00') + '">' +
          ico + prefix + '<span class="ckcd-timer" data-ckcd-timer>' + fmtTime(dur, fmt) + '</span>' +
        '</div>' +
        (s.custom_css ? '<style>' + s.custom_css + '</style>' : '') +
      '</div>';
    },

    hydrate(el) {
      const bar = el.querySelector('[data-ckcd]'); if (!bar) return;
      const timer = bar.querySelector('[data-ckcd-timer]');
      const fmt = bar.getAttribute('data-fmt') || 'mmss';
      const behavior = bar.getAttribute('data-exp') || 'stop';
      const expText = bar.getAttribute('data-exptext') || '0:00';
      let remain = parseInt(bar.getAttribute('data-dur'), 10) || 600;
      if (el._ckcdT) clearInterval(el._ckcdT);
      const tick = () => {
        if (!document.body.contains(el)) { clearInterval(el._ckcdT); return; }
        remain--;
        if (remain <= 0) {
          if (behavior === 'restart') { remain = parseInt(bar.getAttribute('data-dur'), 10) || 600; }
          else if (behavior === 'hide') { clearInterval(el._ckcdT); el.style.display = 'none'; return; }
          else { remain = 0; clearInterval(el._ckcdT); if (timer) timer.textContent = expText; return; }
        }
        if (timer) timer.textContent = fmtTime(remain, fmt);
      };
      el._ckcdT = setInterval(tick, 1000);
    },
  });

  function fmtTime(sec, fmt) {
    sec = Math.max(0, sec | 0);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const p = (n) => String(n).padStart(2, '0');
    return fmt === 'hhmmss' ? (p(h) + ':' + p(m) + ':' + p(s)) : (p(Math.floor(sec / 60)) + ':' + p(s));
  }

  OS.css('ckcd', `
  .ckcd-bar{display:flex;align-items:center;gap:8px;font-size:var(--ck-base-fs);font-weight:600;line-height:1.4}
  .ckcd-ico{display:inline-flex;align-items:center}
  .ckcd-timer{font-variant-numeric:tabular-nums;font-weight:700}
  .ckcd-inline .ckcd-bar{padding:0}
  `);
})();
