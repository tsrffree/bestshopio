/* Checkout · Facebook-style Comments (Content PRD §13) — Section + Comment blocks.
   Social-proof comment thread styled after a real Facebook comment feed: round avatar,
   grey rounded bubble (bold name + text), a meta row (time-ago · Like · Reply · Hide) with
   a reaction pill (count + reaction emojis), and an optional "[Brand] replied · N Replies"
   affordance. Make sure these comments are accurate and do not mislead customers (PRD §19.2). */
(function () {
  if (!window.OS) return;
  const { esc } = OS;
  const IMG = (OS.sample && OS.sample.IMG) || {};

  // Reaction presets → ordered list of reaction kinds. Emoji glyphs are shown in small
  // overlapping white chips (Facebook-style stacked reactions).
  const REACT_SET = {
    love_like: ['love', 'like'],
    like_love: ['like', 'love'],
    like: ['like'],
    love: ['love'],
    like_love_haha: ['like', 'love', 'haha'],
  };
  const EMOJI = { like: '👍', love: '❤️', haha: '😆', wow: '😮', care: '🥰' };

  OS.register('checkout-fb-comments', {
    name: 'Facebook-style Comments', icon: 'layers',
    defaultZone: 'summary',
    schema: [
      { info: 'Make sure these comments are accurate and do not mislead customers.' },
      { key: 'heading', label: 'Heading', control: 'text', default: '' },
      { sub: 'Style' },
      { key: 'background_color', label: 'Background color', control: 'color', default: 'transparent', allowTransparent: true },
      { key: 'comment_background', label: 'Comment background', control: 'color', default: '#F0F2F5', allowTransparent: true },
      { key: 'text_color', label: 'Text color', control: 'color', default: '', allowTransparent: true, info: 'Empty inherits Checkout settings.' },
      { key: 'avatar_size', label: 'Avatar size', control: 'number', default: 40, min: 24, max: 64 },
      { sub: 'Advanced' },
      { key: 'custom_css', label: 'Custom CSS', control: 'custom_css', default: '' },
    ],
    defaults() { return {}; },
    blocks: {
      name: 'Comment', kind: 'comment', max: 30,
      fields: [
        { key: 'avatar', label: 'Avatar', control: 'image', default: '' },
        { key: 'name', label: 'Name', control: 'text', default: '' },
        { key: 'comment_text', label: 'Comment text', control: 'textarea', default: '', required: true },
        { key: 'time_ago', label: 'Time', control: 'text', default: '4w', placeholder: 'e.g. 4w, 2d, 5h' },
        { key: 'like_text', label: 'Like text', control: 'text', default: 'Like' },
        { key: 'reply_text', label: 'Reply text', control: 'text', default: 'Reply' },
        { key: 'show_hide', label: 'Show “Hide” link', control: 'toggle', default: false },
        { sub: 'Reactions' },
        { key: 'reactions', label: 'Reactions shown', control: 'select', default: 'love_like', options: [
          { value: 'love_like', label: '❤️ 👍  Love + Like' },
          { value: 'like_love', label: '👍 ❤️  Like + Love' },
          { value: 'like', label: '👍  Like' },
          { value: 'love', label: '❤️  Love' },
          { value: 'like_love_haha', label: '👍 ❤️ 😆  Like + Love + Haha' },
        ] },
        { key: 'reactions_count', label: 'Reaction count', control: 'number', default: 0, min: 0, max: 999999 },
        { sub: 'Brand reply' },
        { key: 'show_brand_reply', label: 'Show brand reply', control: 'toggle', default: false },
        { key: 'brand_name', label: 'Brand name', control: 'text', default: 'Store', visibleWhen: (s) => s.show_brand_reply },
        { key: 'brand_avatar', label: 'Brand avatar', control: 'image', default: '', visibleWhen: (s) => s.show_brand_reply },
        { key: 'replies_count', label: 'Replies count', control: 'number', default: 0, min: 0, max: 999999, visibleWhen: (s) => s.show_brand_reply },
      ],
      defaults: () => ({ time_ago: '4w', like_text: 'Like', reply_text: 'Reply', reactions: 'love_like', reactions_count: 0, replies_count: 0, brand_name: 'Store' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('fc'), kind: 'comment', hidden: false, settings: {
        avatar: IMG.av1 || '', name: 'Marge Roberts',
        comment_text: 'I wasn’t looking to become a bodybuilder, I just wanted to stop feeling so tired and soft. I noticed that after 45, my muscles just didn’t feel “engaged” anymore. A friend recommended this — the difference was amazing. I can actually feel my muscles working when I exercise, and I feel stronger carrying groceries or doing yard work.',
        time_ago: '4w', like_text: 'Like', reply_text: 'Reply', show_hide: false,
        reactions: 'love_like', reactions_count: 3, show_brand_reply: false, brand_name: 'Store', brand_avatar: '', replies_count: 0,
      } },
      { id: OS.uid('fc'), kind: 'comment', hidden: false, settings: {
        avatar: IMG.av3 || '', name: 'Jamie Thomas',
        comment_text: 'I’ve been lifting consistently for 20 years, but once I hit 50 the results just stopped coming. I honestly thought my peak was behind me. I started taking this about six weeks ago hoping for a little energy boost, but I got way more than that. My arms are stronger than before and I can hit the gym 5 days a week without feeling wrecked the next morning.',
        time_ago: '3w', like_text: 'Like', reply_text: 'Reply', show_hide: true,
        reactions: 'like_love', reactions_count: 54, show_brand_reply: true, brand_name: 'Anolvi', brand_avatar: '', replies_count: 18,
      } },
    ]),

    render(s, blocks) {
      const vis = (blocks || []).filter((b) => !b.hidden && b.settings.comment_text);
      if (!vis.length) return '<div class="cksec" style="display:none"></div>';
      const av = OS.clamp(Number(s.avatar_size) || 40, 24, 64, 40);
      const bubbleBg = OS.bgOrTransparent(s.comment_background) || '#F0F2F5';
      const txt = s.text_color || 'var(--ck-text)';

      const reactChip = (b) => {
        const n = Number(b.reactions_count != null ? b.reactions_count : b.likes_count) || 0;
        if (n <= 0) return '';
        const kinds = REACT_SET[b.reactions] || REACT_SET.love_like;
        const emos = kinds.map((k, i) => '<span class="ckfc-emo"' + (i ? ' style="margin-left:-6px"' : '') + '>' + (EMOJI[k] || '👍') + '</span>').join('');
        return '<span class="ckfc-react"><span class="ckfc-react-n">' + n + '</span><span class="ckfc-react-emos">' + emos + '</span></span>';
      };

      const brandRow = (b) => {
        if (!b.show_brand_reply || (Number(b.replies_count) || 0) <= 0) return '';
        const name = esc(b.brand_name || 'Store');
        const bav = b.brand_avatar
          ? '<span class="ckfc-brand-av" style="background-image:url(' + esc(b.brand_avatar) + ')"></span>'
          : '<span class="ckfc-brand-av ckfc-brand-ph">' + esc((b.brand_name || 'S').slice(0, 1).toUpperCase()) + '</span>';
        const n = Number(b.replies_count) || 0;
        return '<div class="ckfc-replies">' + bav +
          '<span class="ckfc-replies-t"><b>' + name + '</b> replied · ' + n + ' ' + (n === 1 ? 'Reply' : 'Replies') + '</span></div>';
      };

      const item = (b0) => {
        const b = b0.settings;
        const avatar = b.avatar
          ? '<div class="ckfc-av" style="width:' + av + 'px;height:' + av + 'px;background-image:url(' + esc(b.avatar) + ')"></div>'
          : '<div class="ckfc-av ckfc-av-ph" style="width:' + av + 'px;height:' + av + 'px">' + esc((b.name || '?').slice(0, 1).toUpperCase()) + '</div>';
        const meta = '<div class="ckfc-meta">' +
          (b.time_ago ? '<span class="ckfc-time">' + esc(b.time_ago) + '</span>' : '') +
          '<span class="ckfc-act ckfc-like">' + esc(b.like_text || 'Like') + '</span>' +
          '<span class="ckfc-act">' + esc(b.reply_text || 'Reply') + '</span>' +
          (b.show_hide ? '<span class="ckfc-act">Hide</span>' : '') +
          reactChip(b) + '</div>';
        return '<div class="ckfc-item" data-block-id="' + esc(b0.id) + '">' + avatar +
          '<div class="ckfc-body"><div class="ckfc-bubble" style="background:' + bubbleBg + '">' +
            (b.name ? '<div class="ckfc-name">' + esc(b.name) + '</div>' : '') +
            '<div class="ckfc-text">' + esc(b.comment_text) + '</div></div>' + meta + brandRow(b) + '</div></div>';
      };

      return '<div class="cksec ckfc" style="background:' + (OS.bgOrTransparent(s.background_color) || 'transparent') + ';color:' + txt + '">' +
        (s.heading ? '<div class="cksec-h">' + esc(s.heading) + '</div>' : '') +
        '<div class="ckfc-list">' + vis.map(item).join('') + '</div>' +
        (s.custom_css ? '<style>' + s.custom_css + '</style>' : '') +
      '</div>';
    },
  });

  OS.css('ckfc', `
  .ckfc-list{display:flex;flex-direction:column;gap:22px}
  .ckfc-item{display:flex;gap:8px;align-items:flex-start}
  .ckfc-av{flex:none;border-radius:50%;background-size:cover;background-position:center;background-color:#dfe3e8}
  .ckfc-av-ph{display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;background:#9aa4b2}
  .ckfc-body{min-width:0;flex:1}
  .ckfc-bubble{border-radius:18px;padding:8px 12px;display:inline-block;max-width:100%}
  .ckfc-name{font-weight:700;font-size:var(--ck-small-fs);color:var(--ck-text);margin-bottom:2px}
  .ckfc-text{font-size:var(--ck-small-fs);line-height:1.45;color:var(--ck-text);word-break:break-word;white-space:pre-wrap}
  .ckfc-meta{display:flex;align-items:center;gap:14px;margin:5px 0 0 12px;font-size:12px;color:var(--ck-muted)}
  .ckfc-time{font-weight:600}
  .ckfc-act{font-weight:700;cursor:pointer;color:var(--ck-muted)}
  .ckfc-like{color:#1877F2}
  .ckfc-react{margin-left:auto;display:inline-flex;align-items:center;gap:5px;color:var(--ck-muted);font-weight:600}
  .ckfc-react-emos{display:inline-flex;align-items:center}
  .ckfc-emo{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 0 0 1.5px #fff, 0 1px 2px rgba(0,0,0,.18);font-size:10px;line-height:1}
  .ckfc-replies{display:flex;align-items:center;gap:8px;margin:9px 0 0 6px;font-size:12px;color:var(--ck-muted)}
  .ckfc-brand-av{flex:none;display:inline-block;width:24px;height:24px;border-radius:50%;background-size:cover;background-position:center;background-color:#243b2f}
  .ckfc-brand-ph{display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:10px}
  .ckfc-replies-t b{font-weight:700;color:var(--ck-text)}
  .ckpage.mob .ckfc-text,.ckpage.mob .ckfc-name{font-size:var(--ck-small-fs)}
  .ckpage.mob .ckfc-meta{gap:12px}
  `);
})();
