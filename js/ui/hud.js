/* ESTELA · HUD superior, navegación, controles del mapa, tarjeta de selección y teletipo */
'use strict';
E.HUD = (() => {
  const U = E.U, UI = E.UI;
  const H = {};
  const NAV = [
    { v: 'home', l: 'Resumen', i: 'home' },
    { v: 'fleet', l: 'Flota', i: 'plane' },
    { v: 'routes', l: 'Rutas', i: 'route' },
    { v: 'bases', l: 'Aeropuertos', i: 'building', desk: true },
    { v: 'finance', l: 'Finanzas', i: 'chart' },
    { v: 'staff', l: 'Personal', i: 'users', desk: true },
    { v: 'service', l: 'Servicio', i: 'cup', desk: true },
    { v: 'research', l: 'I+D', i: 'flask', desk: true },
    { v: 'marketing', l: 'Marketing', i: 'mega', desk: true },
    { v: 'more', l: 'Más', i: 'grid' }
  ];
  H.build = () => {
    const G = E.G;
    document.documentElement.style.setProperty('--brand', G.airline.p);
    document.documentElement.style.setProperty('--brand2', G.airline.s);
    UI.$('#hud').innerHTML = `
      <button class="hud-brand" data-a="root" data-v="home" aria-label="Resumen">${E.ART.badge(G.airline, 34)}<div><div class="hud-name ellipsis">${U.esc(G.airline.name)}</div><div class="hud-sub" id="hSub"></div></div></button>
      <div class="hud-date"><span class="d" id="hDate"></span><span class="t" id="hTime"></span></div>
      <div class="hud-rep" id="hRep"></div>
      <div class="hud-cash"><div class="v" id="hCash"></div><div class="l" id="hCashL"></div></div>
      <div class="speed" id="hSpeed"></div>
      <button class="hud-icon" data-a="root" data-v="inbox" aria-label="Bandeja">${UI.icon('bell')}<span class="dot hidden" id="hBell"></span></button>`;
    const desk = window.innerWidth >= 960;
    UI.$('#nav').innerHTML = NAV.filter(n => desk || !n.desk).map(n => `<button class="nav-b" data-a="nav" data-v="${n.v}" id="nav-${n.v}">${UI.icon(n.i)}<span class="lbl-short">${n.l}</span>${n.v === 'more' ? '<span class="cnt hidden" id="navMore"></span>' : ''}</button>`).join('');
    UI.$('#mapctl').innerHTML = `
      <button class="mbtn" data-a="layers" aria-label="Capas">${UI.icon('layers')}</button>
      <button class="mbtn" data-a="zoom" data-v="1.6" aria-label="Acercar">${UI.icon('plus')}</button>
      <button class="mbtn" data-a="zoom" data-v="0.62" aria-label="Alejar">${UI.icon('minus')}</button>
      <button class="mbtn" data-a="centerHome" aria-label="Centrar en la base">${UI.icon('target')}</button>
      <div id="layersPop" class="layers hidden"></div>`;
    H.speedUI();
    H.update(true);
  };
  H.navOn = (v) => {
    UI.$$('.nav-b').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  };
  E.bus.on('view', v => {
    const root = UI.stack.length ? UI.stack[0].view : null;
    const map = { home: 'home', fleet: 'fleet', ac: 'fleet', buy: 'fleet', type: 'fleet', used: 'fleet', routes: 'routes', route: 'routes', newroute: 'routes', bases: 'bases', airport: 'bases', finance: 'finance', staff: 'staff', service: 'service', research: 'research', marketing: 'marketing' };
    let n = map[root] || (root ? 'more' : null);
    if (window.innerWidth < 960 && ['bases', 'staff', 'service', 'research', 'marketing'].includes(n)) n = 'more';
    H.navOn(n);
  });
  E.A.nav = (d) => {
    const cur = UI.stack.length ? UI.stack[0].view : null;
    if (cur === d.v && UI.stack.length === 1) { UI.close(); return; }
    UI.root(d.v);
  };
  H.speedUI = () => {
    const G = E.G;
    const small = window.innerWidth < 720;
    const el = UI.$('#hSpeed');
    if (small) {
      el.innerHTML = `<button data-a="speed" data-v="${G.speed ? 0 : (UI.lastSpeed || 1)}" class="${G.speed ? '' : 'on'}" aria-label="Pausa">${UI.icon(G.speed ? 'pause' : 'play')}</button><button data-a="speedCycle" class="${G.speed ? 'on' : ''}" aria-label="Velocidad"><span class="mono tiny" style="font-weight:800">×${[0, 1, 4, 16, 48][G.speed || UI.lastSpeed || 1]}</span></button>`;
    } else {
      const ics = ['pause', 'play', 'ff', 'fff', 'ffff'];
      const tips = ['Pausa (espacio)', '1 h/s', '4 h/s', '16 h/s', '48 h/s'];
      el.innerHTML = ics.map((ic, i) => `<button data-a="speed" data-v="${i}" class="${G.speed === i ? 'on' : ''}" title="${tips[i]}" aria-label="${tips[i]}">${UI.icon(ic)}</button>`).join('');
    }
  };
  E.A.speed = (d) => {
    const G = E.G; if (!G) return;
    const v = +d.v;
    if (v > 0) UI.lastSpeed = v;
    G.speed = v;
    H.speedUI();
  };
  E.A.speedCycle = () => { const G = E.G; const cur = G.speed || UI.lastSpeed || 1; const nx = cur >= 4 ? 1 : cur + 1; E.A.speed({ v: nx }); };
  E.A.zoom = (d) => E.MAP.zoom(+d.v);
  E.A.centerHome = () => { const G = E.G; const b = E.AP[G.airline.home]; E.MAP.focus(b.lon, b.lat, Math.max(E.MAP.cam.z, 6)); };
  E.A.layers = () => {
    const p = UI.$('#layersPop');
    if (!p.classList.contains('hidden')) { p.classList.add('hidden'); return; }
    const L = E.MAP.layers;
    const row = (k, n) => `<label>${n}${UI.toggle('layer', L[k], `data-k="${k}"`)}</label>`;
    p.innerHTML = row('night', 'Día y noche') + row('weather', 'Radar meteorológico') + row('routes', 'Rutas') + row('traffic', 'Tráfico') + row('labels', 'Etiquetas');
    p.classList.remove('hidden');
  };
  E.IN.layer = (el) => { E.MAP.layers[el.dataset.k] = el.checked; };

  /* ---------- actualización periódica ---------- */
  let lastBell = -1, tickT = 0;
  H.update = () => {
    const G = E.G; if (!G) return;
    const t = G.t + (E.MAP.lerpT || 0);
    const small = window.innerWidth < 720;
    const d = U.date(t);
    UI.$('#hDate').textContent = small ? d.getUTCDate() + ' ' + U.MES[d.getUTCMonth()] + " '" + String(d.getUTCFullYear()).slice(2) : U.fmtDate(t);
    UI.$('#hTime').innerHTML = U.fmtTime(t) + (small ? '' : ' <span class="tiny muted">UTC</span>');
    const c = UI.$('#hCash');
    c.textContent = U.money(G.cash);
    c.className = 'v ' + (G.cash < 0 ? 'bad' : '');
    const L = G.fin.cur;
    const prof = E.EC.profitOf(L);
    UI.$('#hCashL').innerHTML = `<span class="${prof >= 0 ? 'good' : 'bad'}">${U.signed(prof)}</span>${small ? '' : ' este mes'}`;
    UI.$('#hSub').textContent = `${G.airline.code} · ${G.fleet.length} aviones · ${G.flights.length} en vuelo`;
    UI.$('#hRep').innerHTML = `${UI.stars(G.rep.overall)}<span class="tiny muted">OTP ${U.pct(G.rep.otp)}</span>`;
    const unread = G.inbox.filter(m => !m.read).length;
    if (unread !== lastBell) { const b = UI.$('#hBell'); b.textContent = unread > 99 ? '99+' : unread; b.classList.toggle('hidden', !unread); lastBell = unread; }
    if (selection) H.card(true);
  };

  /* ---------- tarjeta de selección del mapa ---------- */
  let selection = null;
  E.bus.on('map:tap', (hit) => {
    selection = hit;
    E.MAP.sel = hit;
    UI.$('#layersPop') && UI.$('#layersPop').classList.add('hidden');
    if (!hit) { UI.$('#fcard').classList.add('hidden'); return; }
    if (hit.kind === 'airport' && UI.isOpen() && UI.current().view === 'newroute') { E.A.pickDest({ v: hit.id }); return; }
    H.card();
  });
  H.select = (hit) => { selection = hit; E.MAP.sel = hit; H.card(); };
  H.card = (live) => {
    const G = E.G, el = UI.$('#fcard');
    if (!selection) { el.classList.add('hidden'); return; }
    if (selection.kind === 'flight') {
      const f = G.flights.find(x => x.id === selection.id);
      if (!f) { selection = null; E.MAP.sel = null; el.classList.add('hidden'); return; }
      const ac = G.fleet.find(a => a.id === f.ac); if (!ac) return;
      const t = E.AC[ac.type];
      const p = E.FL.pos(G, f, G.t) || { frac: 0, phase: 'climb', alt: 0 };
      const o = E.AP[f.o], d = E.AP[f.d];
      const pax = f.pax.y + f.pax.p + f.pax.j + f.pax.f;
      const seats = E.F.seats(ac).total;
      const fl = t.sst ? 580 : t.prop ? 250 : 370;
      const alt = Math.round(p.alt * fl / 10) * 10;
      const phase = { climb: 'Ascenso', cruise: 'Crucero', desc: 'Descenso', hold: 'En espera' }[p.phase];
      const delay = Math.round(f.delay || 0);
      const eta = f.arr;
      const wx = E.W.at(G, f.d, eta);
      const html = `
        <div class="row sp"><div><div class="mono" style="font-size:18px;font-weight:800">${f.fn}</div><div class="small muted">${t.short} · ${ac.reg}${ac.name ? ' · ' + U.esc(ac.name) : ''}</div></div>
        <div class="row gap4">${f.ferry ? UI.chip(f.ferry, 'warn') : delay > 15 ? UI.chip('+' + U.mins(delay), 'warn') : UI.chip('A tiempo', 'good')}<button class="iconbtn" data-a="cardClose">${UI.icon('x')}</button></div></div>
        <div class="art">${E.ART.side(ac.type, G.airline, { gear: false, shadow: false })}</div>
        <div class="row sp"><div><div class="mono" style="font-size:22px;font-weight:800">${f.from ? '···' : f.o}</div><div class="tiny muted">${f.from ? 'En ruta' : o.city}</div></div>
          <div class="grow" style="padding:0 10px">${UI.bar(p.frac, 'brand', true)}<div class="tiny muted" style="text-align:center;margin-top:4px">${phase}${alt ? ' · FL' + String(alt).padStart(3, '0') : ''}</div></div>
          <div class="r"><div class="mono" style="font-size:22px;font-weight:800">${f.d}</div><div class="tiny muted">${d.city}</div></div></div>
        <div class="grid3 mt8">
          <div><div class="tiny muted">Pasajeros</div><div class="mono">${pax}/${seats}</div></div>
          <div><div class="tiny muted">Llegada</div><div class="mono">${U.fmtTime(eta)}</div></div>
          <div><div class="tiny muted">Destino</div>${UI.wx(wx)}</div></div>
        <div class="btns mt12"><button class="btn sm" data-a="openAc" data-v="${ac.id}">Avión</button>${f.r ? `<button class="btn sm" data-a="openRoute" data-v="${f.r}">Ruta</button>` : ''}<button class="btn sm ghost" data-a="follow" data-v="${f.id}">${UI.icon('target')}Seguir</button></div>`;
      el.innerHTML = html;
    } else {
      const a = E.AP[selection.id];
      const base = G.bases[a.iata];
      const rs = G.routes.filter(r => r.a === a.iata || r.b === a.iata);
      const w = E.W.at(G, a.iata);
      el.innerHTML = `
        <div class="row sp"><div><div class="row"><span class="mono" style="font-size:20px;font-weight:800">${a.iata}</span>${base ? UI.chip('Tu base', 'brand') : ''}</div><div class="small muted">${a.city} · ${a.country}</div></div><button class="iconbtn" data-a="cardClose">${UI.icon('x')}</button></div>
        <div class="grid3 mt8"><div><div class="tiny muted">Clima</div>${UI.wx(w)}</div><div><div class="tiny muted">Rutas tuyas</div><div class="mono">${rs.length}</div></div><div><div class="tiny muted">Tamaño</div><div class="mono">${'●'.repeat(a.size)}${'○'.repeat(5 - a.size)}</div></div></div>
        <div class="btns mt12"><button class="btn sm" data-a="openAirport" data-v="${a.iata}">Ver aeropuerto</button>${base ? `<button class="btn sm primary" data-a="newRouteFrom" data-v="${a.iata}">${UI.icon('plus')}Nueva ruta</button>` : Object.keys(G.bases).some(b => E.R.allowed(G, b, a.iata).ok) ? `<button class="btn sm primary" data-a="newRouteTo" data-v="${a.iata}">${UI.icon('plus')}Volar aquí</button>` : ''}</div>`;
    }
    if (!live) el.classList.remove('hidden');
  };
  E.A.cardClose = () => { selection = null; E.MAP.sel = null; UI.$('#fcard').classList.add('hidden'); following = null; };
  let following = null;
  E.A.follow = (d) => { following = d.v; const f = E.G.flights.find(x => x.id === d.v); if (f) { const p = E.FL.pos(E.G, f, E.G.t); if (p) E.MAP.focus(p.lon, p.lat, Math.max(E.MAP.cam.z, 10)); } };
  H.follow = () => {
    if (!following) return;
    const f = E.G.flights.find(x => x.id === following);
    if (!f) { following = null; return; }
    const p = E.FL.pos(E.G, f, E.G.t + (E.MAP.lerpT || 0));
    if (p) { E.MAP.cam.x = p.lon; E.MAP.cam.y = -E.U.projY(p.lat); }
  };
  H.unfollow = () => { following = null; };

  /* ---------- teletipo de noticias ---------- */
  let tickTimer = null;
  H.ticker = (text, kicker = 'NOTICIA') => {
    const el = UI.$('#ticker');
    el.innerHTML = `<b>${kicker}</b>${U.esc(text)}`;
    el.classList.add('on');
    clearTimeout(tickTimer);
    tickTimer = setTimeout(() => el.classList.remove('on'), 7000);
  };
  E.bus.on('news', t => H.ticker(t));
  return H;
})();
