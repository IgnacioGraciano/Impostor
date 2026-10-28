/* ESTELA · núcleo de la interfaz: vistas, acciones, modales, iconos, gráficos y tablero split-flap */
'use strict';
E.V = {};   // vistas
E.A = {};   // acciones (data-a)
E.IN = {};  // entradas (data-in)
E.UI = (() => {
  const U = E.U;
  const UI = {};
  UI.stack = [];
  UI.$ = (s, r = document) => r.querySelector(s);
  UI.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  const G = () => E.G;

  /* ---------- iconos ---------- */
  const IC = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    plane: '<path d="M10.5 21l1.5-1.2 1.5 1.2v-2.2l-1-1V13l8 2.5v-2L12.5 9V4.5a1.5 1.5 0 0 0-3 0V9L2.5 13.5v2l8-2.5v4.8l-1 1z" transform="translate(0.5 0)"/>',
    route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M7.8 16.6C10 10 14 14 16.2 7.4" stroke-dasharray="2.5 2.5"/>',
    building: '<path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-5h6v5M8 11h.01M12 11h.01M16 11h.01"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
    line: '<path d="M3 17l5-5 4 3 8-8"/><path d="M15 7h5v5"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.3 3-5 6-5s5.4 1.7 6 5"/><path d="M16 4.8a3 3 0 0 1 0 6M18 15c1.8.6 3 2.2 3.4 5"/>',
    cup: '<path d="M5 8h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 9h2a2 2 0 0 1 0 4h-2M8 2.5c-.5 1 .5 2 0 3M11 2.5c-.5 1 .5 2 0 3"/>',
    flask: '<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7.5 15h9"/>',
    mega: '<path d="M3 10v4a1 1 0 0 0 1 1h3l8 4V5L7 9H4a1 1 0 0 0-1 1z"/><path d="M19 9a4 4 0 0 1 0 6M7 15l1.5 5"/>',
    inbox: '<path d="M3 13l2.5-8h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L22 13.6 13.6 22l-2.3-2.3a4 4 0 0 0-5-5L2 10.4 10.4 2z" transform="scale(.9) translate(1.3 1.3)"/>',
    fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M4 10h10"/><path d="M14 8l3 3v6a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
    storm: '<path d="M7 15a4 4 0 1 1 1-7.9A5 5 0 0 1 18 8a3.5 3.5 0 0 1 0 7"/><path d="M12 13l-2 4h3l-2 4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    rain: '<path d="M7 14a4 4 0 1 1 1-7.9A5 5 0 0 1 18 7a3.5 3.5 0 0 1 0 7"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>',
    snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.5L12 6l2.5-1.5M9.5 19.5L12 18l2.5 1.5"/>',
    fog: '<path d="M4 9h16M3 13h18M5 17h14M8 5h8"/>',
    wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>',
    cyclone: '<path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M20 8c-2-4-8-5-11-2M4 16c2 4 8 5 11 2M8 4C4 6 3 12 6 15M16 20c4-2 5-8 2-11"/>',
    clear: '<circle cx="12" cy="12" r="4"/>',
    tower: '<path d="M9 21l1-9h4l1 9M8 12h8l-1-4H9zM10 8V5h4v3M12 2v3"/>',
    bag: '<rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 11v5M15 11v5"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
    gavel: '<path d="M14 4l6 6M12.5 5.5l6 6M10 8l6 6M3 21l8-8M13 3l8 8-3 3-8-8z"/>',
    tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
    star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3a3 3 0 0 1-3 4M7 5H4a3 3 0 0 0 3 4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    volcano: '<path d="M2 21l6-10h2l2-3 2 3h2l6 10z"/><path d="M11 5c-1-1 0-2 1-2s2-1 1.5-2"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    pause: '<path d="M8 5v14M16 5v14" stroke-width="2.6"/>',
    play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
    ff: '<path d="M3 5v14l9-7zM12 5v14l9-7z" fill="currentColor"/>',
    fff: '<path d="M1.5 6v12l6.5-6zM8 6v12l6.5-6zM14.5 6v12L21 12z" fill="currentColor"/>',
    ffff: '<path d="M1 6v12l5.2-6zM6.2 6v12l5.2-6zM11.4 6v12l5.2-6zM16.6 6v12l5.2-6z" fill="currentColor"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/>',
    dollar: '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    bank: '<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    save: '<path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    seat: '<path d="M6 3v10a2 2 0 0 0 2 2h8M8 15l-2 6M16 15l2 6M9 11h9a2 2 0 0 1 2 2v2"/>',
    wifi: '<path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"/>',
    tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    up: '<path d="M7 14l5-5 5 5"/>', down: '<path d="M7 10l5 5 5-5"/>',
    swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'
  };
  UI.icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || IC.info}</svg>`;

  /* ---------- helpers de HTML ---------- */
  UI.stat = (l, v, d, cls = '') => `<div class="stat ${cls}"><div class="l">${l}</div><div class="v">${v}</div>${d != null ? `<div class="d">${d}</div>` : ''}</div>`;
  UI.sec = (t, extra = '') => `<div class="sec"><h3>${t}</h3><div class="line"></div>${extra}</div>`;
  UI.bar = (v, cls = '', thin) => `<div class="bar ${cls} ${thin ? 'thin' : ''}"><i style="width:${U.clamp(v, 0, 1) * 100}%"></i></div>`;
  UI.chip = (t, cls = '') => `<span class="chip ${cls}">${t}</span>`;
  UI.stars = (rep) => { const s = rep / 20; let o = ''; for (let i = 1; i <= 5; i++) o += s >= i - 0.25 ? '★' : s >= i - 0.75 ? '⯪' : '☆'; return `<span class="stars">${o}</span>`; };
  UI.seg = (name, opts, cur, extra = '') => `<div class="seg ${extra}">${opts.map(o => `<button data-a="${name}" data-v="${o.v}" class="${String(o.v) === String(cur) ? 'on' : ''}" ${o.dis ? 'disabled' : ''} title="${U.esc(o.tip || '')}">${o.l}</button>`).join('')}</div>`;
  UI.toggle = (name, on, data = '') => `<label class="toggle"><input type="checkbox" data-in="${name}" ${data} ${on ? 'checked' : ''}><span></span></label>`;
  UI.tabs = (name, list, cur) => `<div class="tabs">${list.map(t => `<button data-a="${name}" data-v="${t.v}" class="${t.v === cur ? 'on' : ''}">${t.l}</button>`).join('')}</div>`;
  UI.wx = (w) => `<span class="wx ${w.k === 'clear' ? 'muted' : w.k === 'fog' || w.k === 'storm' || w.k === 'cyclone' ? 'warn' : ''}">${UI.icon(E.W.ICON[w.k])}${E.W.LABEL[w.k]}</span>`;
  UI.range = (name, min, max, step, val, data = '') => `<input type="range" data-in="${name}" min="${min}" max="${max}" step="${step}" value="${val}" ${data} style="--p:${(val - min) / (max - min) * 100}%">`;

  /* ---------- hoja (sheet) ---------- */
  const sheet = () => UI.$('#sheet');
  UI.current = () => UI.stack[UI.stack.length - 1];
  UI.open = (view, params = {}, replace) => {
    if (!E.V[view]) { console.warn('vista desconocida', view); return; }
    if (replace || !UI.stack.length) UI.stack = [{ view, params }];
    else {
      const top = UI.current();
      if (top && top.view === view && JSON.stringify(top.params) === JSON.stringify(params)) { UI.render(); return; }
      UI.stack.push({ view, params });
    }
    UI.render(true);
    const s = sheet();
    s.classList.add('open'); s.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sheet-open');
    E.bus.emit('view', view);
  };
  UI.root = (view, params) => { UI.stack = []; UI.open(view, params, true); };
  UI.back = () => { if (UI.stack.length > 1) { UI.stack.pop(); UI.render(true); } else UI.close(); };
  UI.close = () => {
    UI.stack = [];
    const s = sheet(); s.classList.remove('open'); s.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('sheet-open');
    E.MAP.preview = null; E.MAP.highlight = null;
    E.bus.emit('view', null);
  };
  UI.isOpen = () => UI.stack.length > 0;
  UI.render = (scrollTop) => {
    const top = UI.current(); if (!top || !E.G) return;
    const v = E.V[top.view];
    const s = sheet();
    s.classList.toggle('wide', !!v.wide);
    let html = '';
    try { html = v.render(top.params || {}); } catch (e) { console.error(e); html = `<div class="note bad">Error al mostrar la vista: ${U.esc(e.message)}</div>`; }
    const title = typeof v.title === 'function' ? v.title(top.params || {}) : v.title;
    const sub = v.sub ? (typeof v.sub === 'function' ? v.sub(top.params || {}) : v.sub) : '';
    UI.$('.sheet-head', s).innerHTML = `${UI.stack.length > 1 ? `<button class="iconbtn" data-a="back" aria-label="Volver">${UI.icon('back')}</button>` : ''}<div class="grow"><h2>${title}</h2>${sub ? `<div class="sub">${sub}</div>` : ''}</div><button class="iconbtn x" data-a="close" aria-label="Cerrar">${UI.icon('x')}</button>`;
    const body = UI.$('.sheet-body', s);
    const st = body.scrollTop;
    body.innerHTML = html;
    if (scrollTop) body.scrollTop = 0; else body.scrollTop = st;
    UI.afterRender(body);
    if (v.mount) try { v.mount(body, top.params || {}); } catch (e) { console.error(e); }
  };
  UI.afterRender = (root) => { UI.$$('[data-flap]', root).forEach(el => UI.flapApply(el)); };
  // refresco periódico de vistas "vivas" sin romper la interacción
  UI.interacting = 0;
  UI.refresh = (force) => {
    if (!UI.isOpen()) return;
    const v = E.V[UI.current().view];
    if (!force && !v.live) return;
    if (!force && (Date.now() - UI.interacting < 2500)) return;
    const ae = document.activeElement;
    if (!force && ae && ae.closest && ae.closest('#sheet') && (ae.tagName === 'INPUT' || ae.tagName === 'SELECT')) return;
    UI.render();
  };

  /* ---------- toasts ---------- */
  UI.toast = (msg, kind = '', icon) => {
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = (icon ? UI.icon(icon) : '') + `<span>${msg}</span>`;
    UI.$('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, kind === 'bad' ? 4200 : 3000);
    const all = UI.$$('#toasts .toast'); if (all.length > 3) all[0].remove();
  };

  /* ---------- modales ---------- */
  UI.modals = [];
  UI.modal = (html, o = {}) => {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${o.cls || ''}" role="dialog" aria-modal="true">${html}</div>`;
    UI.$('#modals').appendChild(bg);
    const m = { el: bg, box: bg.firstChild, close: () => { bg.remove(); UI.modals = UI.modals.filter(x => x !== m); if (o.onClose) o.onClose(); E.bus.emit('modal:close'); } };
    if (!o.sticky) bg.addEventListener('click', e => { if (e.target === bg) m.close(); });
    UI.modals.push(m);
    return m;
  };
  UI.topModal = () => UI.modals[UI.modals.length - 1];
  UI.confirm = (title, text, ok = 'Confirmar', danger) => new Promise(res => {
    let done = false;
    const m = UI.modal(`<h2>${title}</h2><p>${text}</p><div class="btns mt16" style="justify-content:flex-end"><button class="btn ghost" data-a="mClose">Cancelar</button><button class="btn ${danger ? 'danger' : 'primary'}" id="mOk">${ok}</button></div>`, { onClose: () => { if (!done) res(false); } });
    m.box.querySelector('#mOk').onclick = (e) => { e.stopPropagation(); done = true; m.close(); res(true); };
  });
  UI.prompt = (title, value, ok = 'Guardar') => new Promise(res => {
    const m = UI.modal(`<h2>${title}</h2><input class="input mt12" id="promptIn" value="${U.esc(value || '')}" maxlength="40"><div class="btns mt16" style="justify-content:flex-end"><button class="btn ghost" data-a="mClose">Cancelar</button><button class="btn primary" id="promptOk">${ok}</button></div>`, { onClose: () => res(null) });
    const inp = m.box.querySelector('#promptIn'); setTimeout(() => inp.focus(), 50);
    const done = () => { const v = inp.value; m.el.remove(); UI.modals = UI.modals.filter(x => x !== m); res(v); };
    m.box.querySelector('#promptOk').onclick = done;
    inp.onkeydown = e => { if (e.key === 'Enter') done(); };
  });
  E.A.mClose = (d, el) => { const m = UI.modals.find(x => x.el.contains(el)); if (m) m.close(); };

  /* ---------- gráficos SVG ---------- */
  UI.lineChart = (series, o = {}) => {
    const W = 600, H = o.h || 150, P = { l: 6, r: 6, t: 10, b: 18 };
    const all = series.flatMap(s => s.vals).filter(v => v != null && isFinite(v));
    if (!all.length) return `<div class="empty small">Sin datos todavía</div>`;
    let mn = Math.min(...all, o.zero ? 0 : Infinity), mx = Math.max(...all, o.zero ? 0 : -Infinity);
    if (mx === mn) { mx += 1; mn -= 1; }
    const pad = (mx - mn) * 0.08; mx += pad; mn -= o.zero && mn >= 0 ? 0 : pad;
    const n = Math.max(...series.map(s => s.vals.length));
    const X = i => P.l + (W - P.l - P.r) * (n <= 1 ? 0.5 : i / (n - 1));
    const Yp = v => P.t + (H - P.t - P.b) * (1 - (v - mn) / (mx - mn));
    let g = '<g class="grid">';
    for (let k = 0; k <= 3; k++) { const y = P.t + (H - P.t - P.b) * k / 3; g += `<line x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}"/>`; }
    g += '</g>';
    if (mn < 0 && mx > 0) g += `<line x1="${P.l}" x2="${W - P.r}" y1="${Yp(0)}" y2="${Yp(0)}" stroke="var(--line2)" stroke-dasharray="3 3"/>`;
    const lines = series.map(s => {
      const pts = s.vals.map((v, i) => v == null ? null : [X(i), Yp(v)]).filter(Boolean);
      if (!pts.length) return '';
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      const area = s.fill ? `<path d="${d} L ${pts[pts.length - 1][0].toFixed(1)} ${H - P.b} L ${pts[0][0].toFixed(1)} ${H - P.b} Z" fill="${s.color}" opacity=".12"/>` : '';
      return area + `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.w || 2}" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? 'stroke-dasharray="4 4"' : ''}/>` + (s.dot !== false ? `<circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="3" fill="${s.color}"/>` : '');
    }).join('');
    const fmt = o.fmt || (v => U.money(v));
    const labels = `<text x="${W - P.r}" y="${P.t + 8}" text-anchor="end">${fmt(mx - pad)}</text><text x="${W - P.r}" y="${H - P.b - 4}" text-anchor="end">${fmt(mn + (o.zero && mn >= 0 ? 0 : pad))}</text>` + (o.labels ? o.labels.map((l, i) => l ? `<text x="${X(i)}" y="${H - 4}" text-anchor="middle">${l}</text>` : '').join('') : '');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px">${g}${lines}${labels}</svg>`;
  };
  UI.bars = (vals, o = {}) => {
    const W = 600, H = o.h || 120, P = { t: 8, b: 16 };
    if (!vals.length) return `<div class="empty small">Sin datos todavía</div>`;
    const mx = Math.max(...vals.map(v => Math.abs(v)), 1);
    const neg = vals.some(v => v < 0);
    const zero = neg ? P.t + (H - P.t - P.b) / 2 : H - P.b;
    const scale = neg ? (H - P.t - P.b) / 2 / mx : (H - P.t - P.b) / mx;
    const bw = W / vals.length;
    const r = vals.map((v, i) => { const h = Math.abs(v) * scale; const y = v >= 0 ? zero - h : zero; return `<rect x="${(i * bw + bw * 0.18).toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${Math.max(1, h).toFixed(1)}" rx="2" fill="${v >= 0 ? (o.pos || 'var(--good)') : (o.neg || 'var(--bad)')}" opacity="${i === vals.length - 1 ? 1 : 0.78}"/>`; }).join('');
    const labels = o.labels ? o.labels.map((l, i) => l ? `<text x="${(i * bw + bw / 2).toFixed(1)}" y="${H - 3}" text-anchor="middle">${l}</text>` : '').join('') : '';
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px"><line x1="0" x2="${W}" y1="${zero}" y2="${zero}" stroke="var(--line2)"/>${r}${labels}</svg>`;
  };
  UI.donut = (parts, size = 120) => {
    const tot = parts.reduce((s, p) => s + Math.max(0, p.v), 0) || 1;
    let a = -Math.PI / 2; const R = 46, r = 30;
    const segs = parts.map(p => { const da = Math.max(0, p.v) / tot * Math.PI * 2; const a2 = a + da; const large = da > Math.PI ? 1 : 0; const pth = `M ${50 + R * Math.cos(a)} ${50 + R * Math.sin(a)} A ${R} ${R} 0 ${large} 1 ${50 + R * Math.cos(a2)} ${50 + R * Math.sin(a2)} L ${50 + r * Math.cos(a2)} ${50 + r * Math.sin(a2)} A ${r} ${r} 0 ${large} 0 ${50 + r * Math.cos(a)} ${50 + r * Math.sin(a)} Z`; a = a2; return da > 0.001 ? `<path d="${pth}" fill="${p.c}"/>` : ''; }).join('');
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}">${segs}</svg>`;
  };
  UI.COLORS = ['#f3b64a', '#7cc4ff', '#4fd69c', '#ff8a6b', '#c792ea', '#5fd3c6', '#ff6b9a', '#a3b4c8', '#e0d35a', '#6b8cff', '#9be36b', '#ffb3d1', '#8a7f72', '#3fb0ff', '#d97757', '#6dd'];

  /* ---------- tablero split-flap ---------- */
  const flapPrev = new Map();
  UI.flap = (key, text, width) => {
    text = String(text == null ? '' : text).toUpperCase();
    if (width) text = text.padEnd(width).slice(0, width);
    return `<span class="flap" data-flap="${U.esc(key)}" data-txt="${U.esc(text)}"></span>`;
  };
  UI.flapApply = (el) => {
    const key = el.dataset.flap, txt = el.dataset.txt;
    const prev = flapPrev.get(key) || '';
    let h = '';
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i] === ' ' ? '&nbsp;' : U.esc(txt[i]);
      const changed = prev[i] !== txt[i];
      h += `<i class="${changed ? 'f' : ''}" style="${changed ? `animation-delay:${(i * 0.025).toFixed(3)}s` : ''}">${ch}</i>`;
    }
    el.innerHTML = h;
    flapPrev.set(key, txt);
  };

  /* ---------- despacho de acciones ---------- */
  document.addEventListener('click', ev => {
    const el = ev.target.closest('[data-a]');
    if (!el) return;
    const fn = E.A[el.dataset.a];
    if (!fn) { console.warn('acción desconocida', el.dataset.a); return; }
    ev.preventDefault();
    UI.interacting = 0;
    try { fn(el.dataset, el, ev); } catch (e) { console.error(e); UI.toast('Error: ' + e.message, 'bad'); }
    E.SND && E.SND.click();
  });
  const onInput = ev => {
    const el = ev.target.closest('[data-in]');
    if (!el) return;
    if (el.type === 'range') el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min) * 100) + '%');
    UI.interacting = Date.now();
    const fn = E.IN[el.dataset.in];
    if (fn) try { fn(el, ev.type, ev); } catch (e) { console.error(e); }
  };
  document.addEventListener('input', onInput);
  document.addEventListener('change', onInput);
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') { if (UI.modals.length && !UI.topModal().el.querySelector('.cockpit')) UI.topModal().close(); else if (UI.isOpen()) UI.back(); }
    if (ev.target.tagName === 'INPUT') return;
    if (ev.key === ' ' && E.G) { ev.preventDefault(); E.A.speed({ v: E.G.speed ? 0 : (E.UI.lastSpeed || 1) }); }
    if (['1', '2', '3', '4'].includes(ev.key) && E.G) E.A.speed({ v: +ev.key });
  });
  E.A.back = () => UI.back();
  E.A.close = () => UI.close();
  E.A.open = (d) => UI.open(d.v, d.p ? JSON.parse(d.p) : {});
  E.A.root = (d) => UI.root(d.v, d.p ? JSON.parse(d.p) : {});
  // arrastre de la hoja hacia abajo para cerrar (móvil)
  (() => {
    let y0 = null, dy = 0;
    document.addEventListener('pointerdown', e => { if (window.innerWidth >= 960) return; if (e.target.closest('.sheet-grab') || (e.target.closest('.sheet-head') && !e.target.closest('button'))) { y0 = e.clientY; dy = 0; } });
    document.addEventListener('pointermove', e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); const s = sheet(); s.style.transition = 'none'; s.style.transform = `translateY(${dy}px)`; });
    document.addEventListener('pointerup', () => { if (y0 == null) return; const s = sheet(); s.style.transition = ''; s.style.transform = ''; if (dy > 110) UI.close(); y0 = null; });
  })();
  E.A.sheetGrab = () => { };
  return UI;
})();
