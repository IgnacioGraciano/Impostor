/* ESTELA · modales: eventos y crisis, periódico histórico, asignación de aviones, slots y fin de partida */
'use strict';
E.MOD = (() => {
  const U = E.U, UI = E.UI;
  const M = {};
  let evOpen = false;

  /* ---------- eventos ---------- */
  M.nextEvent = (force) => {
    const G = E.G;
    if (evOpen || (!force && UI.modals.length)) return;
    const ev = E.EV.next(G);
    if (!ev) return;
    evOpen = true;
    if (G.settings.pauseEvents && G.speed) { M.resumeSpeed = G.speed; E.A.speed({ v: 0 }); }
    E.SND && E.SND.chime();
    if (ev.hist) {
      const h = ev.hist;
      const m = UI.modal(`<div class="mast"><span>${U.fmtDateL(G.t)}</span><b>El Cronista Aeronáutico</b><span>Edición extra</span></div>
        <div class="kick">${h.kicker}</div><h2>${h.head}</h2><p>${h.text}</p>
        <div class="r mt12"><button class="btn" data-a="evOk">Seguir</button></div>`, { cls: 'paper', sticky: true, onClose: done });
      return;
    }
    const m = UI.modal(`<div class="ev-icon">${UI.icon(ev.icon || 'bell')}</div><div class="kicker">${U.esc(ev.kicker || 'Decisión')}</div><h2>${U.esc(ev.title)}</h2><p>${ev.text}</p>
      <div>${ev.choices.map((c, i) => `<button class="choice" data-a="evChoose" data-v="${i}"><b>${U.esc(c.t)}</b>${c.d ? `<span>${c.d}</span>` : ''}</button>`).join('')}</div>`, { sticky: true, onClose: done });
    m.ev = ev;
  };
  const done = () => {
    evOpen = false;
    UI.refresh(true);
    setTimeout(() => {
      if (E.G.ev.queue.length) M.nextEvent();
      else if (M.resumeSpeed) { E.A.speed({ v: M.resumeSpeed }); M.resumeSpeed = 0; }
    }, 300);
  };
  E.A.evOk = (d, el) => { const m = UI.modals.find(x => x.el.contains(el)); if (m) m.close(); };
  E.A.evChoose = (d, el) => {
    const m = UI.modals.find(x => x.el.contains(el)); if (!m) return;
    const res = E.EV.choose(E.G, m.ev, +d.v);
    m.close();
    if (res) UI.toast(res, '', 'info');
  };

  /* ---------- estimación de una asignación ---------- */
  M.estAssign = (G, ac, r, freq) => {
    const old = { route: ac.route, freq: ac.freq };
    ac.route = r.id; ac.freq = freq;
    E.D.routeDemand(G, r);
    const o = E.FL.legEcon(G, ac, r, true), i = E.FL.legEcon(G, ac, r, false);
    ac.route = old.route; ac.freq = old.freq;
    E.D.routeDemand(G, r);
    if (old.route && old.route !== r.id) { const ro = G.routes.find(x => x.id === old.route); if (ro) E.D.routeDemand(G, ro); }
    return { week: (o.profit + i.profit) * freq, lf: (o.lf + i.lf) / 2, block: o.block };
  };

  /* ---------- asignar un avión a una ruta ---------- */
  M.assignAc = (acId) => {
    const G = E.G; const ac = G.fleet.find(a => a.id === acId);
    const cands = G.routes.map(r => ({ r, c: E.F.canFly(G, ac, r.a, r.b) })).sort((a, b) => (b.c.ok - a.c.ok) || ((a.r.dem ? a.r.dem.lfAll : 0) < (b.r.dem ? b.r.dem.lfAll : 0) ? 1 : -1));
    const html = `<h2>Asignar ${ac.reg}</h2><p>${E.AC[ac.type].name} · ${E.F.seats(ac).total} asientos · alcance ${U.km(E.AC[ac.type].rng)}</p>
      ${cands.length ? `<div class="list">${cands.map(({ r, c }) => `<button class="item" data-a="asgPick" data-ac="${ac.id}" data-r="${r.id}" ${c.ok ? '' : 'disabled style="opacity:.5"'}><div class="grow"><div class="t mono">${r.a} ⇄ ${r.b}</div><div class="s">${U.km(r.d)} · ocupación actual ${U.pct(r.dem ? r.dem.lfAll : 0)} · ${E.FL.routeFreq(G, r)}×/sem</div>${c.ok ? '' : `<div class="s warn">${c.why[0]}</div>`}</div>${c.ok ? UI.icon('chev') : ''}</button>`).join('')}</div>` : `<div class="empty">No tenés rutas. Creá una primero.</div>`}
      <div class="btns mt16"><button class="btn primary" data-a="asgNew" data-v="${ac.loc && G.bases[ac.loc] ? ac.loc : G.airline.home}">${UI.icon('plus')}Crear ruta nueva</button><button class="btn ghost" data-a="mClose">Cerrar</button></div>`;
    UI.modal(html);
  };
  M.assignRoute = (rid) => {
    const G = E.G; const r = G.routes.find(x => x.id === rid);
    const list = G.fleet.filter(a => a.status !== 'delivery' && a.route !== r.id).map(ac => ({ ac, c: E.F.canFly(G, ac, r.a, r.b) })).sort((a, b) => (b.c.ok - a.c.ok) || (!a.ac.route - !b.ac.route) * -1);
    const html = `<h2>Asignar a ${r.a} ⇄ ${r.b}</h2><p>${U.km(r.d)} · ${E.FL.routeFreq(G, r)} frecuencias semanales</p>
      ${list.length ? `<div class="list">${list.map(({ ac, c }) => `<button class="item acrow" data-a="asgPick" data-ac="${ac.id}" data-r="${r.id}" ${c.ok ? '' : 'disabled style="opacity:.5"'}><div class="art-sm">${E.ART.side(ac.type, G.airline, { gear: false, shadow: false })}</div><div class="grow"><div class="t mono">${ac.reg}</div><div class="s">${E.AC[ac.type].short} · ${ac.route ? '<span class="warn">en otra ruta</span>' : 'libre'} · ${ac.loc || 'en vuelo'}</div>${c.ok ? '' : `<div class="s warn">${c.why[0]}</div>`}</div>${c.ok ? UI.icon('chev') : ''}</button>`).join('')}</div>` : `<div class="empty">No hay aviones disponibles. Comprá o alquilá uno.</div>`}
      <div class="btns mt16"><button class="btn" data-a="asgBuy">${UI.icon('plus')}Conseguir un avión</button><button class="btn ghost" data-a="mClose">Cerrar</button></div>`;
    UI.modal(html);
  };
  E.A.asgNew = (d, el) => { E.A.mClose(d, el); E.A.newRouteFrom({ v: d.v }); };
  E.A.asgBuy = (d, el) => { E.A.mClose(d, el); UI.open('buy'); };
  E.A.asgPick = (d, el) => {
    const G = E.G; const ac = G.fleet.find(a => a.id === d.ac); const r = G.routes.find(x => x.id === d.r);
    const m = UI.modals.find(x => x.el.contains(el));
    const max = E.FL.maxFreq(G, ac, r);
    const dem = r.dem || E.D.routeDemand(G, r);
    const daily = ['y', 'p', 'j', 'f'].reduce((s, k) => s + dem.mkt[k], 0) / 2;
    const seats = E.F.seats(ac).total;
    const sugg = U.clamp(Math.round(E.D.estimate(G, r.a, r.b).potential * 0.6 * 7 / Math.max(1, seats)), 1, max);
    const est = M.estAssign(G, ac, r, sugg);
    const slots = E.R.slotCheck(G, r, sugg);
    m.box.innerHTML = `<h2>${ac.reg} → ${r.a} ⇄ ${r.b}</h2><p>Bloque ${U.dur(est.block)} · máximo ${max} rotaciones por semana. A más frecuencia, menos colchón para absorber demoras.</p>
      <div class="card"><div class="slider-row"><span class="small">Frecuencia semanal</span><span class="val" id="asgF">${sugg}×</span>${UI.range('asgFreq', 1, max, 1, sugg, `data-ac="${ac.id}" data-r="${r.id}"`)}</div>
      <div class="grid2 mt8"><div class="stat"><div class="l">Ocupación estimada</div><div class="v" id="asgLf">${U.pct(est.lf)}</div></div><div class="stat"><div class="l">Resultado directo/sem</div><div class="v ${est.week >= 0 ? 'good' : 'bad'}" id="asgW">${U.signed(est.week)}</div></div></div>
      <div class="tiny muted mt8">Mercado: ${U.n0(daily)} pasajeros/día por sentido. Sugerido: ${sugg}× (según demanda captable).</div>
      <div id="asgSlots">${slots.length ? `<div class="note warn mt8">Faltan slots en ${slots.map(s => s.iata).join(', ')}.</div>` : ''}</div></div>
      <div class="btns mt16" style="justify-content:flex-end"><button class="btn ghost" data-a="mClose">Cancelar</button><button class="btn primary" data-a="asgDo" data-ac="${ac.id}" data-r="${r.id}">Asignar</button></div>`;
  };
  E.IN.asgFreq = U.debounce((el) => {
    const G = E.G; const ac = G.fleet.find(a => a.id === el.dataset.ac); const r = G.routes.find(x => x.id === el.dataset.r);
    const est = M.estAssign(G, ac, r, +el.value);
    UI.$('#asgF').textContent = el.value + '×';
    UI.$('#asgLf').textContent = U.pct(est.lf);
    const w = UI.$('#asgW'); w.textContent = U.signed(est.week); w.className = 'v ' + (est.week >= 0 ? 'good' : 'bad');
    const slots = E.R.slotCheck(G, r, +el.value);
    UI.$('#asgSlots').innerHTML = slots.length ? `<div class="note warn mt8">Faltan slots en ${slots.map(s => `${s.iata} (${s.held}/${s.need})`).join(', ')}.</div>` : '';
  }, 60);
  E.A.asgDo = (d, el) => {
    const G = E.G; const ac = G.fleet.find(a => a.id === d.ac); const r = G.routes.find(x => x.id === d.r);
    const f = +(UI.$('input[data-in=asgFreq]') || { value: 1 }).value;
    const res = E.FL.assign(G, ac, r, f);
    if (!res.ok) {
      if (res.slots) { UI.toast(res.why, 'warn'); E.A.mClose(d, el); M.slots(res.slots[0].iata, res.slots[0].need - res.slots[0].held); return; }
      return UI.toast(res.why, 'bad');
    }
    E.A.mClose(d, el);
    E.D.routeDemand(G, r); E.ST.required(G);
    UI.toast(`${ac.reg} asignado: ${res.freq}×/sem en ${r.a}–${r.b}`, 'good', 'plane');
    UI.refresh(true);
  };

  /* ---------- negociación de slots ---------- */
  M.slots = (iata, need) => {
    const G = E.G; const a = E.AP[iata];
    const free = E.R.slotsFree(G, iata);
    const price = E.R.slotPrice(G, iata);
    const n0 = U.clamp(need || 7, 1, Math.max(1, free));
    const m = UI.modal(`<div class="kicker">Coordinador de slots</div><h2>${a.city} (${iata})</h2><p>Aeropuerto ${a.slot === 3 ? 'saturado' : 'congestionado'}. Disponibles esta temporada: <b>${free}</b> slots semanales. Precio de referencia: ${U.money(price)} por slot.</p>
      ${free < 1 ? `<div class="note warn">No quedan slots esta temporada. Probá en la próxima (abril/octubre) o comprale a otra aerolínea vía un evento.</div><div class="r mt12"><button class="btn" data-a="mClose">Cerrar</button></div>` : `
      <div class="card"><div class="slider-row"><span class="small">Slots semanales</span><span class="val" id="slN">${n0}</span>${UI.range('slotN', 1, Math.max(1, free), 1, n0, `data-i="${iata}"`)}</div>
      <div class="slider-row mt8"><span class="small">Tu oferta</span><span class="val" id="slK">100%</span>${UI.range('slotK', 0.6, 1.4, 0.05, 1, `data-i="${iata}"`)}</div>
      <div class="row sp mt12"><span class="small muted">Total ofrecido</span><span class="mono" style="font-weight:800" id="slTot">${U.money(price * n0)}</span></div>
      <div class="row sp"><span class="small muted">Probabilidad de aceptación</span><span class="mono" id="slP">${U.pct(E.R.slotChance(G, iata, 1))}</span></div></div>
      <div class="btns mt16" style="justify-content:flex-end"><button class="btn ghost" data-a="mClose">Cancelar</button><button class="btn primary" data-a="slotDo" data-i="${iata}">Presentar oferta</button></div>`}`);
  };
  const slotUpd = (iata) => {
    const G = E.G; const n = +UI.$('input[data-in=slotN]').value, k = +UI.$('input[data-in=slotK]').value;
    UI.$('#slN').textContent = n; UI.$('#slK').textContent = U.pct(k);
    UI.$('#slTot').textContent = U.money(E.R.slotPrice(G, iata) * n * k);
    UI.$('#slP').textContent = U.pct(E.R.slotChance(G, iata, k));
  };
  E.IN.slotN = (el) => slotUpd(el.dataset.i);
  E.IN.slotK = (el) => slotUpd(el.dataset.i);
  E.A.slotDo = (d, el) => {
    const G = E.G; const n = +UI.$('input[data-in=slotN]').value, k = +UI.$('input[data-in=slotK]').value;
    const r = E.R.negotiate(G, d.i, n, k);
    E.A.mClose(d, el);
    UI.toast(r.msg, r.ok ? 'good' : 'bad');
    UI.refresh(true);
  };

  /* ---------- fin de partida y victoria ---------- */
  M.gameOver = () => {
    const G = E.G; const o = G.over;
    E.A.speed({ v: 0 });
    UI.modal(`<div class="ev-icon" style="color:var(--bad);background:color-mix(in srgb,var(--bad) 14%,transparent)">${UI.icon('alert')}</div><div class="kicker" style="color:var(--bad)">Fin de la partida</div><h2>${o.title}</h2><p>${o.text}</p>
      <div class="grid2 mt12">${UI.stat('Pasajeros transportados', U.n0(G.stats.pax))}${UI.stat('Años al mando', U.n1(U.yearF(G.t) - U.yearF(G.t0)))}${UI.stat('Flota máxima', G.stats.peakFleet || G.fleet.length)}${UI.stat('Logros', Object.keys(G.stats.ach).length + '/' + E.ACH.length)}</div>
      <div class="btns mt16" style="justify-content:flex-end"><button class="btn" data-a="overLoad">Cargar otra partida</button><button class="btn primary" data-a="overNew">Nueva aerolínea</button></div>`, { sticky: true });
  };
  E.A.overNew = (d, el) => { E.A.mClose(d, el); E.SAVE.remove('auto'); E.toTitle(); E.NG.start(); };
  E.A.overLoad = (d, el) => { E.A.mClose(d, el); E.SAVE.remove('auto'); E.toTitle(); };
  M.victory = () => {
    const G = E.G; const scn = E.SCN[G.scn];
    E.A.speed({ v: 0 });
    UI.modal(`<div class="ev-icon">${UI.icon('trophy')}</div><div class="kicker">Escenario completado</div><h2>${scn ? scn.n : 'Victoria'}</h2><p>Cumpliste todos los objetivos el ${U.fmtDateL(G.t)}. ${U.esc(G.airline.name)} es leyenda.</p>
      <div class="grid2 mt12">${UI.stat('Pasajeros', U.n0(G.stats.pax))}${UI.stat('Flota', G.fleet.length)}${UI.stat('Reputación', Math.round(G.rep.overall))}${UI.stat('Patrimonio', U.money(E.EC.equity(G)))}</div>
      <div class="r mt16"><button class="btn primary" data-a="mClose">Seguir jugando</button></div>`);
  };
  E.bus.on('won', () => setTimeout(M.victory, 400));

  /* ---------- informe anual ---------- */
  M.pendingYear = null;
  E.bus.on('year', (y) => { M.pendingYear = y; });
  M.yearReport = () => {
    const G = E.G, y = M.pendingYear; M.pendingYear = null;
    const months = G.fin.hist.filter(m => U.year(m.t) === y);
    const prev = G.fin.hist.filter(m => U.year(m.t) === y - 1);
    if (!months.length) return;
    const sum = (list, f) => list.reduce((s, m) => s + f(m), 0);
    const rev = sum(months, m => E.EC.total(m.rev)), prof = sum(months, m => E.EC.profitOf(m)), pax = sum(months, m => m.pax);
    const seats = sum(months, m => m.seats), fl = sum(months, m => m.fl), ont = sum(months, m => m.ontime);
    const prevRev = sum(prev, m => E.EC.total(m.rev)), prevPax = sum(prev, m => m.pax), prevProf = sum(prev, m => E.EC.profitOf(m));
    const delta = (a, b) => b ? `<span class="${a >= b ? 'good' : 'bad'}">${a >= b ? '▲' : '▼'} ${U.pct(Math.abs(a / b - 1), 1)}</span>` : '';
    const rr = G.routes.map(r => ({ r, p: r.stats.hist.slice(-26).reduce((s, w) => s + w.rev - w.cost, 0) })).sort((a, b) => b.p - a.p);
    const ach = E.ACH.filter(a => G.stats.ach[a.id] && U.year(G.stats.ach[a.id]) === y);
    if (G.settings.pauseEvents && G.speed) { M.resumeSpeed = G.speed; E.A.speed({ v: 0 }); }
    UI.modal(`<div class="mast"><span>Memoria y balance</span><b>${U.esc(G.airline.name)}</b><span>Ejercicio ${y}</span></div>
      <div class="kick">Informe anual</div><h2>${prof >= 0 ? 'Un año en verde' : 'Un año para olvidar'}: ${U.money(prof)} de ${prof >= 0 ? 'ganancia' : 'pérdida'}</h2>
      <div class="grid2" style="font-family:var(--font)">
        <div><div class="tiny up">Ingresos</div><div class="mono" style="font-size:20px;font-weight:800">${U.money(rev)}</div><div class="small">${delta(rev, prevRev)}</div></div>
        <div><div class="tiny up">Resultado</div><div class="mono" style="font-size:20px;font-weight:800">${U.money(prof)}</div><div class="small">${prevProf ? 'anterior ' + U.money(prevProf) : ''}</div></div>
        <div><div class="tiny up">Pasajeros</div><div class="mono" style="font-size:20px;font-weight:800">${U.n0(pax)}</div><div class="small">${delta(pax, prevPax)}</div></div>
        <div><div class="tiny up">Ocupación · puntualidad</div><div class="mono" style="font-size:20px;font-weight:800">${U.pct(seats ? pax / seats : 0)} · ${U.pct(fl ? ont / fl : 0)}</div></div>
        <div><div class="tiny up">Flota</div><div class="mono" style="font-size:20px;font-weight:800">${G.fleet.length}</div></div>
        <div><div class="tiny up">Reputación</div><div class="mono" style="font-size:20px;font-weight:800">${Math.round(G.rep.overall)}/100</div></div>
      </div>
      ${rr.length ? `<p style="font-size:15px;margin-top:14px"><b>Ruta estrella:</b> ${rr[0].r.a}–${rr[0].r.b} (${U.money(rr[0].p)} en el semestre).${rr.length > 1 && rr[rr.length - 1].p < 0 ? ` <b>La que más pierde:</b> ${rr[rr.length - 1].r.a}–${rr[rr.length - 1].r.b} (${U.money(rr[rr.length - 1].p)}).` : ''}</p>` : ''}
      ${ach.length ? `<p style="font-size:15px"><b>Logros del año:</b> ${ach.map(a => a.n).join(', ')}.</p>` : ''}
      <div class="r mt12"><button class="btn" data-a="mClose">Seguir</button></div>`, { cls: 'paper', onClose: () => { if (M.resumeSpeed) { E.A.speed({ v: M.resumeSpeed }); M.resumeSpeed = 0; } } });
  };
  return M;
})();
