/* BestShopio Admin · Microsoft Clarity.
   This is a connection workspace, not an Analytics sub-page: it is visible by
   default, and its Clarity tools unlock after a project has been connected. */
(function () {
  let root;
  let editing = false;
  let disconnecting = false;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 18) + '" height="' + (w || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    clarity: '<img class="clarity-mark" src="https://claritystatic.azureedge.net/images/logo.ico" alt="" aria-hidden="true" referrerpolicy="no-referrer">',
    check: svg('<circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16.5 9"/>', 17),
    arrow: svg('<path d="M7 17 17 7"/><path d="M9 7h8v8"/>', 16),
    play: svg('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 9 5 3-5 3Z"/>', 19),
    map: svg('<path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2Z"/><path d="M9 4v14M15 6v14"/>', 19),
    spark: svg('<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7Z"/><path d="m18.5 15 .7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7Z"/>', 19),
  };

  const STYLES =
    '.clarity-page{width:860px;max-width:100%;box-sizing:border-box;margin:0 auto;padding:24px 0 0}' +
    '.clarity-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:22px;padding:26px 28px;margin-bottom:18px;background:linear-gradient(135deg,#f1f7ff 0%,#fff 68%);border:1px solid #d7e6fb;border-radius:14px}' +
    '.clarity-hero-main{display:flex;gap:16px;align-items:flex-start;min-width:0}' +
    '.clarity-logo{width:48px;height:48px;border:1px solid #d7e6fb;border-radius:13px;display:grid;place-items:center;background:#fff;flex:none;box-shadow:0 8px 18px rgba(37,99,235,.12)}' +
    '.clarity-logo .clarity-mark{display:block;width:28px;height:28px;object-fit:contain}' +
    '.clarity-hero h1{font-size:24px;line-height:1.2;margin:0;color:var(--ink)}' +
    '.clarity-hero p{margin:8px 0 0;color:var(--ink-body);font-size:14px;line-height:1.55}' +
    '.clarity-status{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:650;white-space:nowrap;background:#f2f4f7;color:var(--ink-muted)}' +
    '.clarity-status.ok{background:#e9f8ef;color:#167443}.clarity-status-dot{width:7px;height:7px;border-radius:50%;background:currentColor}' +
    '.clarity-stack{display:grid;gap:18px}.clarity-setup{width:100%;box-sizing:border-box}' +
    '.clarity-panel{padding:22px}.clarity-panel h2{font-size:16px;line-height:1.35;margin:0;color:var(--ink)}.clarity-panel p{font-size:13.5px;line-height:1.6;color:var(--ink-body);margin:8px 0 0}' +
    '.clarity-form{display:grid;gap:15px;margin-top:20px}.clarity-field{display:grid;gap:7px}.clarity-field-label-row{display:flex;align-items:baseline;justify-content:space-between;gap:12px}.clarity-field label{font-size:12px;font-weight:650;color:var(--ink)}.clarity-field-help{font-size:12px;color:var(--ink-muted);line-height:1.35;text-align:right}.clarity-field input{width:100%;box-sizing:border-box}.clarity-field.has-error .input{border-color:var(--err);box-shadow:0 0 0 1px rgba(217,45,32,.22)}.clarity-domain-note{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 15px;border:1px solid var(--hair);border-radius:9px;background:#fafbfc}.clarity-domain-note-label{font-size:11px;font-weight:650;color:var(--ink-muted);text-transform:uppercase;letter-spacing:.04em}.clarity-domain-note-value{font-size:14px;font-weight:650;color:var(--ink);margin-top:5px}.clarity-domain-note p{font-size:12px;line-height:1.45;color:var(--ink-muted);margin:0}' +
    '.clarity-form-foot{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:3px}.clarity-error{font-size:12px;color:var(--err);display:none;line-height:1.4}.clarity-error.show{display:block}' +
    '.clarity-connected-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px}.clarity-stat{padding:14px;border:1px solid var(--hair);border-radius:10px;background:var(--page)}.clarity-stat-label{font-size:11px;color:var(--ink-muted);text-transform:uppercase;letter-spacing:.04em;font-weight:650}.clarity-stat-value{font-size:14px;font-weight:650;margin-top:6px;color:var(--ink);word-break:break-word}' +
    '.clarity-tools{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px}.clarity-tool{display:flex;flex-direction:column;min-height:185px;padding:18px;border:1px solid var(--hair);border-radius:12px;background:var(--page)}.clarity-tool-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;background:#f3f0ff;color:#6d46d8}.clarity-tool h3{font-size:14px;margin:14px 0 0}.clarity-tool p{font-size:12.5px;margin:7px 0 16px}.clarity-tool a{margin-top:auto;display:inline-flex;gap:6px;align-items:center;font-size:12.5px;font-weight:650;color:var(--brand);text-decoration:none}.clarity-tool a:hover{text-decoration:underline}' +
    '.clarity-action-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.clarity-connection-heading{min-width:0;flex:1 1 420px}.clarity-connection-heading p{max-width:620px}.clarity-connection-actions{flex:none}.clarity-link-btn{display:inline-flex;align-items:center;gap:7px;text-decoration:none}.clarity-danger-btn{color:var(--err);border-color:#f3c4ba}.clarity-danger-btn:hover{background:#fff6f4}.clarity-modal-backdrop{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:20px;background:rgba(21,26,36,.42)}.clarity-modal{width:min(100%,560px);box-sizing:border-box;padding:22px;background:#fff;border:1px solid var(--hair);border-radius:14px;box-shadow:0 20px 56px rgba(23,31,50,.24)}.clarity-modal h2{font-size:17px;line-height:1.35;margin:0;color:var(--ink)}.clarity-modal>p{font-size:13px;line-height:1.55;color:var(--ink-body);margin:8px 0 0}.clarity-modal .clarity-form{margin-top:18px}.clarity-modal-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:20px}.clarity-modal-actions p{font-size:12.5px;line-height:1.5;color:var(--ink-body);margin:0 0 14px}' +
    '@media(max-width:920px){.clarity-page{padding-left:24px;padding-right:24px}}@media(max-width:780px){.clarity-page{padding:18px 16px 0}.clarity-hero{padding:20px;flex-direction:column}.clarity-connected-grid,.clarity-tools{grid-template-columns:1fr}.clarity-hero h1{font-size:21px}.clarity-modal-backdrop{align-items:end;padding:12px}.clarity-modal{max-height:calc(100vh - 24px);overflow:auto}}';

  function connection() {
    return window.ClarityConnection || { read: () => ({ connected: false, projectId: '', domain: 'lovocross.com', connectedAt: '' }), save: () => ({}), disconnect: () => ({}) };
  }
  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  function toast(message) {
    const el = document.createElement('div');
    const icon = document.createElement('span');
    icon.textContent = '✓';
    icon.style.cssText = 'color:#1f8f4e;display:inline-flex;font-weight:700';
    const copy = document.createElement('span');
    copy.textContent = message;
    el.append(icon, copy);
    el.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);display:inline-flex;align-items:center;gap:8px;background:#fff;color:#1f2433;border:1px solid #e6e8ee;padding:9px 16px;border-radius:8px;font-size:13.5px;z-index:200;box-shadow:0 6px 20px rgba(20,30,55,.14)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
  function hero(state) {
    const status = state.connected
      ? '<span class="clarity-status ok"><i class="clarity-status-dot"></i>Connected</span>'
      : '<span class="clarity-status"><i class="clarity-status-dot"></i>Not connected</span>';
    return '<section class="clarity-hero">' +
      '<div class="clarity-hero-main"><span class="clarity-logo">' + I.clarity + '</span><div><h1>Microsoft Clarity</h1><p>Understand how visitors use your storefront with session recordings, heatmaps and behavior insights.</p></div></div>' +
      status +
    '</section>';
  }
  function connectionForm(state, submitLabel, cancelAttribute) {
    const cancel = cancelAttribute ? '<button type="button" class="btn btn-default" ' + cancelAttribute + '>Cancel</button>' : '';
    return '<form class="clarity-form" data-connect-form novalidate>' +
      '<div class="clarity-field" data-project-field><div class="clarity-field-label-row"><label for="clarity-project-id">Clarity project ID</label><span class="clarity-field-help">Find this in your Microsoft Clarity project settings.</span></div><input class="input" id="clarity-project-id" name="projectId" maxlength="80" autocomplete="off" placeholder="For example: ab12cd34ef" value="' + esc(state.projectId) + '" aria-describedby="clarity-project-error"><div class="clarity-error" id="clarity-project-error" data-form-error role="alert">Please enter a Clarity project ID.</div></div>' +
      '<div class="clarity-domain-note"><div><div class="clarity-domain-note-label">Storefront domain</div><div class="clarity-domain-note-value">' + esc(state.domain || 'lovocross.com') + '</div></div><p>Uses the primary domain already connected to this store.</p></div>' +
      '<div class="clarity-form-foot">' + cancel + '<button type="submit" class="btn btn-primary">' + submitLabel + '</button></div>' +
    '</form>';
  }
  function setupView(state) {
    return '<section class="panel clarity-panel clarity-setup"><h2>Connect a Clarity project</h2>' +
      '<p>Enter the Microsoft Clarity project ID for this storefront.</p>' +
      connectionForm(state, 'Connect Clarity', '') +
    '</section>';
  }
  function editModal(state) {
    return '<div class="clarity-modal-backdrop"><section class="clarity-modal" role="dialog" aria-modal="true" aria-labelledby="clarity-edit-title"><h2 id="clarity-edit-title">Edit Clarity connection</h2><p>Update the project ID connected to this storefront.</p>' +
      connectionForm(state, 'Save changes', 'data-cancel-edit') +
    '</section></div>';
  }
  function disconnectModal(state) {
    return '<div class="clarity-modal-backdrop"><section class="clarity-modal" role="dialog" aria-modal="true" aria-labelledby="clarity-disconnect-title"><h2 id="clarity-disconnect-title">Disconnect Microsoft Clarity?</h2><p>This stops future Clarity tracking for ' + esc(state.domain) + ' and removes this project connection from your store. Existing data remains in Microsoft Clarity.</p><div class="clarity-modal-actions"><button class="btn btn-default" data-cancel-disconnect>Cancel</button><button class="btn clarity-danger-btn" data-confirm-disconnect>Disconnect</button></div></section></div>';
  }
  function connectedView(state) {
    return '<div class="clarity-stack"><section class="panel clarity-panel"><div class="flex items-start justify-between" style="gap:16px;flex-wrap:wrap"><div class="clarity-connection-heading"><h2>Clarity project connected</h2><p>Your storefront is ready to use Microsoft Clarity. Open Clarity to view the live recordings and behavior tools.</p></div><div class="clarity-action-row clarity-connection-actions"><a class="btn btn-primary clarity-link-btn" href="https://clarity.microsoft.com/" target="_blank" rel="noopener">Open Microsoft Clarity ' + I.arrow + '</a><button class="btn btn-default" data-edit-connection>Edit connection</button><button class="btn btn-default clarity-danger-btn" data-request-disconnect>Disconnect</button></div></div>' +
      '<div class="clarity-connected-grid"><div class="clarity-stat"><div class="clarity-stat-label">Project ID</div><div class="clarity-stat-value">' + esc(state.projectId) + '</div></div><div class="clarity-stat"><div class="clarity-stat-label">Storefront domain</div><div class="clarity-stat-value">' + esc(state.domain) + '</div></div><div class="clarity-stat"><div class="clarity-stat-label">Connected</div><div class="clarity-stat-value">' + esc(formatDate(state.connectedAt)) + '</div></div></div>' +
    '</section>' +
    '<section class="panel clarity-panel"><h2>Use Clarity</h2><p>These tools open in Microsoft Clarity, where the recordings and behavior data remain managed.</p><div class="clarity-tools">' +
      tool(I.play, 'Session recordings', 'Watch real visitor journeys and spot where people hesitate or abandon.', 'Open recordings') +
      tool(I.map, 'Heatmaps', 'See where customers click, scroll and spend attention on your storefront.', 'Open heatmaps') +
      tool(I.spark, 'Behavior insights', 'Review friction signals and high-intent behavior in your Clarity project.', 'Open insights') +
    '</div></section>' +
    '<section class="panel clarity-panel"><h2>Tracking coverage</h2><p>Clarity is connected for <strong>' + esc(state.domain) + '</strong>. Before production rollout, ensure your storefront consent experience covers session recording and that the tracking tag is verified on every public template.</p></section></div>';
  }
  function tool(icon, title, copy, cta) {
    return '<article class="clarity-tool"><span class="clarity-tool-icon">' + icon + '</span><h3>' + esc(title) + '</h3><p>' + esc(copy) + '</p><a href="https://clarity.microsoft.com/" target="_blank" rel="noopener">' + esc(cta) + ' ' + I.arrow + '</a></article>';
  }
  function render() {
    const state = connection().read();
    const page = state.connected ? connectedView(state) : setupView(state);
    const modal = state.connected && editing ? editModal(state) : (state.connected && disconnecting ? disconnectModal(state) : '');
    root.innerHTML = '<style>' + STYLES + '</style><div class="clarity-page">' + hero(state) + page + '</div>' + modal;
    const form = root.querySelector('[data-connect-form]');
    if (form) form.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = form.elements.projectId;
      const projectId = input.value.trim();
      const error = root.querySelector('[data-form-error]');
      const field = root.querySelector('[data-project-field]');
      if (!projectId) {
        if (error) error.classList.add('show');
        if (field) field.classList.add('has-error');
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      const wasEditing = editing;
      connection().save({ projectId: projectId });
      editing = false;
      disconnecting = false;
      render();
      toast(wasEditing ? 'Clarity connection updated' : 'Microsoft Clarity connected');
    });
    if (form) {
      const input = form.elements.projectId;
      input.addEventListener('input', () => {
        if (!input.value.trim()) return;
        const error = root.querySelector('[data-form-error]');
        const field = root.querySelector('[data-project-field]');
        if (error) error.classList.remove('show');
        if (field) field.classList.remove('has-error');
        input.removeAttribute('aria-invalid');
      });
    }
    const edit = root.querySelector('[data-edit-connection]');
    if (edit) edit.addEventListener('click', () => { editing = true; disconnecting = false; render(); });
    const requestDisconnect = root.querySelector('[data-request-disconnect]');
    if (requestDisconnect) requestDisconnect.addEventListener('click', () => { editing = false; disconnecting = true; render(); });
    const cancelEdit = root.querySelector('[data-cancel-edit]');
    if (cancelEdit) cancelEdit.addEventListener('click', () => { editing = false; render(); });
    const cancelDisconnect = root.querySelector('[data-cancel-disconnect]');
    if (cancelDisconnect) cancelDisconnect.addEventListener('click', () => { disconnecting = false; render(); });
    const confirmDisconnect = root.querySelector('[data-confirm-disconnect]');
    if (confirmDisconnect) confirmDisconnect.addEventListener('click', () => {
      connection().disconnect();
      editing = false;
      disconnecting = false;
      render();
      toast('Microsoft Clarity disconnected');
    });
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.clarity = {
    render: function (el) { root = el; editing = false; disconnecting = false; render(); },
    unmount: function () { editing = false; disconnecting = false; },
  };
})();
