/* ESTELA · vistas de flota: lista, ficha de avión, cabina, mantenimiento, sistemas, catálogo y usados */
'use strict';
E.UIS = { cab: {}, buy: { cat: 'all', sort: 'year', show: 'avail' } };
(() => {
  const U = E.U, UI = E.UI;
  const ST = { active: ['En servicio', 'good'], maint: ['Mantenimiento', 'warn'], grounded: ['En tierra', 'bad'], delivery: ['Entrega', ''], parked: ['Estacionado', ''] };
  E.acStatus = (G, ac) => {
    if (ac.fl) { const f = G.flights.find(x => x.id === ac.fl); return f ? [`En vuelo ${f.fn}`, 'acc'] : ['En vuelo', 'acc']; }
    if (ac.status === 'active' && !ac.route) return ['Sin ruta', 'warn'];
    return ST[ac.status] || [ac.status, ''];
  };
  const acRow = (G, ac) => {
    const t = E.AC[ac.type];
    const r = ac.route ? G.routes.find(x => x.id === ac.route) : null;
    const st = E.acStatus(G, ac);
    const age = E.F.age(G, ac);
    return `<button class="item acrow" data-a="openAc" data-v="${ac.id}">
      <div class="art-sm">${E.ART.side(ac.type, G.airline, { gear: false, shadow: false })}</div>
      <div class="grow"><div class="row"><span class="t mono">${ac.reg}</span>${ac.name ? `<span class="small muted ellipsis">${U.esc(ac.name)}</span>` : ''}</div><div class="s">${t.short} · ${U.n1(age)} años · ${ac.own === 'lease' ? 'leasing' : 'propio'}</div>
      <div class="s">${r ? `${r.a}–${r.b} · ${ac.freq}×/sem` : '—'}</div>${UI.bar(ac.cond / 100, ac.cond < 50 ? 'bad' : ac.cond < 70 ? 'warn' : 'good', true)}</div>
      <div class="r">${UI.chip(st[0], st[1])}</div></button>`;
  };
  E.A.openAc = (d) => { UI.open('ac', { id: d.v }); E.HUD.unfollow(); };

  /* ---------- Flota ---------- */
  E.V.fleet = {
    title: 'Flota', live: true,
    sub: () => { const G = E.G; return `${G.fleet.length} aviones · ${new Set(G.fleet.map(a => E.AC[a.type].fam)).size} familias · ${G.orders.length} pedidos`; },
    render(p) {
      const G = E.G;
      const f = p.filter || 'all';
      let list = G.fleet.slice();
      if (f === 'idle') list = list.filter(a => !a.route && a.status === 'active');
      if (f === 'maint') list = list.filter(a => a.status === 'maint' || a.status === 'grounded' || a.cond < 60 || E.F.overdue(G, a));
      if (f === 'lease') list = list.filter(a => a.own === 'lease');
      list.sort((a, b) => (E.AC[a.type].fam + a.type).localeCompare(E.AC[b.type].fam + b.type) || a.reg.localeCompare(b.reg));
      const val = G.fleet.reduce((s, a) => s + (a.own === 'own' ? E.F.value(G, a) : 0), 0);
      const avgAge = G.fleet.length ? U.sum(G.fleet, a => E.F.age(G, a)) / G.fleet.length : 0;
      let h = `<div class="btns mb8"><button class="btn primary" data-a="open" data-v="buy">${UI.icon('plus')}Comprar o alquilar</button><button class="btn" data-a="open" data-v="used">${UI.icon('tag')}Usados (${G.used.length})</button><button class="btn ghost" data-a="open" data-v="maintPolicy">${UI.icon('wrench')}Política de mantenimiento</button></div>`;
      h += `<div class="grid3 r2">${UI.stat('Valor flota propia', U.money(val))}${UI.stat('Edad media', U.n1(avgAge) + ' años')}${UI.stat('En el aire', G.flights.length + '/' + G.fleet.length)}</div>`;
      h += `<div class="mt12">${UI.tabs('fleetTab', [{ v: 'all', l: 'Todos' }, { v: 'idle', l: 'Sin ruta' }, { v: 'maint', l: 'Taller' }, { v: 'lease', l: 'Leasing' }], f)}</div>`;
      if (!G.fleet.length && !G.orders.length) h += `<div class="empty"><span class="serif">Hangar vacío</span>Comprá, alquilá o conseguí un avión usado para empezar a volar.<div class="mt12"><button class="btn primary" data-a="open" data-v="buy">Ver catálogo</button></div></div>`;
      h += `<div class="list">${list.map(a => acRow(G, a)).join('')}</div>`;
      if (G.orders.length) {
        h += UI.sec('Pedidos y entregas');
        h += `<div class="list">${G.orders.slice().sort((a, b) => a.due - b.due).map(o => { const t = E.AC[o.type]; return `<div class="item acrow"><div class="art-sm" style="opacity:.75">${E.ART.side(o.type, G.airline, { gear: false, shadow: false })}</div><div class="grow"><div class="t">${t.short}</div><div class="s">${o.kind === 'buy' ? 'Compra nueva' : o.kind === 'lease' ? 'Leasing nuevo' : 'Usado ' + (o.mode === 'buy' ? 'comprado' : 'en leasing')} · entrega ${U.fmtDate(o.due)}</div><div class="s">en ${o.base}</div></div><button class="btn sm ghost" data-a="cancelOrder" data-v="${o.id}">Cancelar</button></div>`; }).join('')}</div>`;
      }
      return h;
    }
  };
  E.A.fleetTab = (d) => { UI.current().params = { filter: d.v }; UI.render(true); };
  E.A.cancelOrder = async (d) => { if (await UI.confirm('¿Cancelar el pedido?', 'Perdés el anticipo (o la mitad del depósito).', 'Cancelar pedido', true)) { E.F.cancelOrder(E.G, d.v); UI.render(); } };

  /* ---------- Ficha del avión ---------- */
  E.V.ac = {
    title: (p) => { const ac = E.G.fleet.find(a => a.id === p.id); return ac ? ac.reg : 'Avión'; },
    sub: (p) => { const ac = E.G.fleet.find(a => a.id === p.id); return ac ? E.AC[ac.type].name : ''; },
    live: true,
    render(p) {
      const G = E.G;
      const ac = G.fleet.find(a => a.id === p.id);
      if (!ac) return `<div class="empty"><span class="serif">Este avión ya no está en la flota</span></div>`;
      const t = E.AC[ac.type];
      const tab = p.tab || 'op';
      const st = E.acStatus(G, ac);
      const age = E.F.age(G, ac);
      let h = `<div class="art-hero">${E.ART.side(ac.type, G.airline)}</div>`;
      h += `<div class="row wrap gap4">${UI.chip(st[0], st[1])}${UI.chip(ac.own === 'lease' ? 'Leasing' : 'Propio')}${UI.chip(U.n1(age) + ' años')}${UI.chip(U.n0(ac.hours) + ' h')}${ac.name ? UI.chip('“' + U.esc(ac.name) + '”', 'acc') : ''}<button class="btn sm ghost" data-a="renameAc" data-v="${ac.id}">Bautizar</button></div>`;
      if (ac.status === 'maint' || ac.status === 'grounded') h += `<div class="note warn mt8">${U.esc(ac.why || 'Fuera de servicio')} · vuelve ${U.fmtDT(ac.until)}</div>`;
      h += `<div class="mt12">${UI.tabs('acTab', [{ v: 'op', l: 'Operación' }, { v: 'cab', l: 'Cabina' }, { v: 'mnt', l: 'Mantenimiento' }, { v: 'sys', l: 'Sistemas' }, { v: 'fin', l: 'Finanzas' }], tab)}</div>`;
      if (tab === 'op') h += acOp(G, ac);
      if (tab === 'cab') h += acCab(G, ac);
      if (tab === 'mnt') h += acMnt(G, ac);
      if (tab === 'sys') h += acSys(G, ac);
      if (tab === 'fin') h += acFin(G, ac);
      return h;
    }
  };
  E.A.acTab = (d) => { const c = UI.current(); c.params = Object.assign({}, c.params, { tab: d.v }); UI.render(); };
  E.A.renameAc = async (d) => { const ac = E.G.fleet.find(a => a.id === d.v); const n = await UI.prompt('Nombre del avión', ac.name || ''); if (n != null) { ac.name = n.trim().slice(0, 30); UI.render(); } };

  const acOp = (G, ac) => {
    const t = E.AC[ac.type];
    const r = ac.route ? G.routes.find(x => x.id === ac.route) : null;
    let h = '';
    if (r) {
      const max = E.FL.maxFreq(G, ac, r);
      const eo = E.FL.legEcon(G, ac, r, true), ei = E.FL.legEcon(G, ac, r, false);
      const wk = (eo.profit + ei.profit) * ac.freq;
      const util = ac.freq * (eo.block + ei.block) / 7;
      h += `<div class="card"><div class="row sp"><div><div class="tiny muted up">Ruta asignada</div><div class="mono" style="font-size:20px;font-weight:800">${r.a} ⇄ ${r.b}</div><div class="small muted">${E.AP[r.a].city} – ${E.AP[r.b].city} · ${U.km(r.d)}</div></div><button class="btn sm" data-a="openRoute" data-v="${r.id}">Ver ruta</button></div>
        <div class="slider-row mt12"><span class="small">Frecuencia semanal</span><span class="val">${ac.freq}×</span>${UI.range('acFreq', 1, max, 1, ac.freq, `data-id="${ac.id}"`)}</div>
        <div class="tiny muted">Máximo ${max}×/sem · utilización ${U.n1(util)} h/día · ${ac.freq >= max ? '<span class="warn">sin margen para demoras</span>' : 'con colchón para recuperar demoras'}</div>
        <div class="grid3 r2 mt12">${UI.stat('Ocupación est.', U.pct((eo.lf + ei.lf) / 2))}${UI.stat('Resultado/vuelo', `<span class="${(eo.profit + ei.profit) >= 0 ? 'good' : 'bad'}">${U.signed((eo.profit + ei.profit) / 2)}</span>`)}${UI.stat('Semana', `<span class="${wk >= 0 ? 'good' : 'bad'}">${U.signed(wk)}</span>`)}</div>
        <div class="btns mt12"><button class="btn" data-a="assignAc" data-v="${ac.id}">Cambiar de ruta</button><button class="btn danger" data-a="unassignAc" data-v="${ac.id}">Quitar de la ruta</button></div></div>`;
    } else {
      h += `<div class="card"><div class="serif" style="font-size:22px">Sin ruta asignada</div><p class="small muted">Un avión en tierra cuesta ${U.money((ac.own === 'lease' && ac.lease ? ac.lease.mo * G.econ.cpi : E.F.value(G, ac) * 0.006))} por mes sin generar ingresos.</p><div class="btns"><button class="btn primary" data-a="assignAc" data-v="${ac.id}">Asignar a una ruta</button><button class="btn" data-a="newRouteFrom" data-v="${ac.loc && G.bases[ac.loc] ? ac.loc : G.airline.home}">Crear ruta nueva</button></div></div>`;
    }
    const life = ac.life;
    const mh = ac.mhist.slice(-6);
    h += UI.sec('Últimos meses');
    if (mh.length) h += `<div class="card tight">${UI.bars(mh.map(m => m.rev - m.cost), { labels: mh.map((m, i) => '') })}<div class="tiny muted">Resultado operativo mensual (sin leasing ni personal)</div></div>`;
    h += `<div class="grid2 mt8">${UI.stat('Vuelos', U.n0(life.fl))}${UI.stat('Pasajeros', U.n0(life.pax))}${UI.stat('Ingresos', U.money(life.rev))}${UI.stat('Margen directo', `<span class="${life.rev - life.cost >= 0 ? 'good' : 'bad'}">${U.money(life.rev - life.cost)}</span>`)}</div>`;
    h += `<div class="kv mt12"><span>Ubicación</span><span>${ac.loc || 'en vuelo'}</span><span>Base de mantenimiento</span><span>${ac.base}</span><span>Ciclos</span><span>${U.n0(ac.cycles)}</span></div>`;
    return h;
  };
  E.IN.acFreq = (el, type) => {
    const ac = E.G.fleet.find(a => a.id === el.dataset.id);
    el.parentElement.querySelector('.val').textContent = el.value + '×';
    if (type === 'change') { const r = E.G.routes.find(x => x.id === ac.route); const res = E.FL.assign(E.G, ac, r, +el.value); if (!res.ok) UI.toast(res.why, 'bad'); E.ST.required(E.G); UI.render(); }
  };
  E.A.unassignAc = async (d) => { const ac = E.G.fleet.find(a => a.id === d.v); if (await UI.confirm('¿Quitar de la ruta?', 'El avión terminará el tramo actual y quedará en tierra.', 'Quitar')) { E.FL.unassign(E.G, ac); E.ST.required(E.G); UI.render(); } };
  E.A.assignAc = (d) => E.MOD.assignAc(d.v);

  /* ---------- Cabina ---------- */
  const cabDraft = (ac) => (E.UIS.cab[ac.id] = E.UIS.cab[ac.id] || Object.assign({}, ac.cabin));
  const acCab = (G, ac) => {
    const t = E.AC[ac.type];
    if (t.freighter) return `<div class="note">Carguero: capacidad de ${U.n0(t.cargo)} t en bodega principal.</div>`;
    const c = cabDraft(ac);
    const units = E.F.units(c), cap = t.seats;
    const yf = U.yearF(G.t);
    const prodOpts = (cls) => Object.entries(E.CABIN[cls]).map(([k, v]) => ({ v: k, l: v.n, dis: v.y > yf || (v.req && !G.research.done[v.req]), tip: v.req && !G.research.done[v.req] ? 'Requiere investigación: ' + E.RES[v.req].n : v.y > yf ? 'Disponible desde ' + v.y : '' }));
    const seg = (cls, count, prod) => `<div class="card tight mt8"><div class="row sp"><b>${{ y: 'Turista', p: 'Premium Economy', j: 'Ejecutiva', f: 'Primera' }[cls]}</b><div class="row gap4"><button class="iconbtn" data-a="cabStep" data-c="${cls}" data-d="-${cls === 'y' ? 6 : 2}" data-id="${ac.id}">${UI.icon('minus')}</button><span class="pill-num" style="min-width:44px;text-align:center">${count}</span><button class="iconbtn" data-a="cabStep" data-c="${cls}" data-d="${cls === 'y' ? 6 : 2}" data-id="${ac.id}">${UI.icon('plus')}</button></div></div>
      ${prod ? `<div class="mt8">${UI.seg('cabProd', prodOpts(cls).map(o => Object.assign(o, { v: cls + ':' + o.v })), cls + ':' + prod)}</div>` : ''}</div>`;
    const pyOk = G.research.done.py && yf >= 1992;
    const bar = (n, u, col) => n > 0 ? `<i style="width:${n * u / cap * 100}%;background:${col}"></i>` : '';
    let h = `<div class="cabin-map">${bar(c.f, E.CABIN.f[c.fp].u, '#d4af37')}${bar(c.j, E.CABIN.j[c.jp].u, '#7cc4ff')}${bar(c.p, E.CABIN.p.std.u, '#c792ea')}${bar(c.y, E.CABIN.y[c.yp].u, 'var(--brand)')}<i style="flex:1;background:var(--panel3)"></i></div>`;
    h += `<div class="row sp mt8 small"><span>Espacio usado</span><span class="mono ${units > cap ? 'bad' : ''}">${U.n1(units)} / ${cap}</span></div>`;
    h += `<div class="btns mt8"><button class="btn sm" data-a="cabPreset" data-v="dense" data-id="${ac.id}">Alta densidad</button><button class="btn sm" data-a="cabPreset" data-v="two" data-id="${ac.id}">Dos clases</button>${t.seats >= 250 ? `<button class="btn sm" data-a="cabPreset" data-v="three" data-id="${ac.id}">Tres clases</button>` : ''}<button class="btn sm ghost" data-a="cabReset" data-id="${ac.id}">Deshacer</button></div>`;
    if (t.seats >= 250) h += seg('f', c.f, c.fp);
    h += seg('j', c.j, c.jp);
    if (pyOk) h += seg('p', c.p, null);
    h += seg('y', c.y, c.yp);
    const err = E.F.validCabin(G, ac, c);
    const same = JSON.stringify(c) === JSON.stringify(ac.cabin);
    const cost = same ? 0 : E.F.reconfigCost(G, ac, c);
    h += `<div class="card mt12"><div class="row sp"><div><div class="small muted">Asientos totales</div><div class="mono" style="font-size:20px;font-weight:800">${c.y + c.p + c.j + c.f}</div></div><div class="r"><div class="small muted">Costo de reconfiguración</div><div class="mono">${same ? '—' : U.money(cost)}</div></div></div>
      ${err ? `<div class="note bad mt8">${err}</div>` : ''}
      <div class="tiny muted mt8">Calidad percibida · Turista ${U.pct(E.D.seatScore(G, Object.assign({}, ac, { cabin: c }), 'y'))}${c.j ? ' · Ejecutiva ' + U.pct(E.D.seatScore(G, Object.assign({}, ac, { cabin: c }), 'j')) : ''}${c.f ? ' · Primera ' + U.pct(E.D.seatScore(G, Object.assign({}, ac, { cabin: c }), 'f')) : ''} (50% = promedio del mercado)</div>
      <button class="btn primary block mt12" data-a="cabApply" data-id="${ac.id}" ${err || same ? 'disabled' : ''}>Aplicar cambios (avión ${E.AC[ac.type].cat === 'wb' || E.AC[ac.type].cat === 'jb' ? '6-8' : '2-3'} días en taller)</button></div>`;
    return h;
  };
  E.A.cabStep = (d) => {
    const ac = E.G.fleet.find(a => a.id === d.id); const c = cabDraft(ac); const t = E.AC[ac.type];
    c[d.c] = Math.max(0, c[d.c] + +d.d);
    // ajustar turista para no exceder
    if (d.c !== 'y') { while (E.F.units(c) > t.seats && c.y > 0) c.y--; }
    else if (E.F.units(c) > t.seats) c.y = Math.max(0, Math.floor((t.seats - (E.F.units(c) - c.y * E.CABIN.y[c.yp].u)) / E.CABIN.y[c.yp].u));
    UI.render();
  };
  E.A.cabProd = (d) => {
    const [cls, prod] = d.v.split(':');
    const ac = E.G.fleet.find(a => a.id === UI.current().params.id); const c = cabDraft(ac); const t = E.AC[ac.type];
    if (cls === 'y') c.yp = prod; if (cls === 'j') c.jp = prod; if (cls === 'f') c.fp = prod;
    while (E.F.units(c) > t.seats && c.y > 0) c.y--;
    if (cls === 'y') c.y = Math.floor((t.seats - (E.F.units(c) - c.y * E.CABIN.y[c.yp].u)) / E.CABIN.y[c.yp].u);
    UI.render();
  };
  E.A.cabPreset = (d) => {
    const G = E.G; const ac = G.fleet.find(a => a.id === d.id); const t = E.AC[ac.type];
    const c = { y: 0, yp: 'std', p: 0, j: 0, jp: E.F.bestJ(G), f: 0, fp: E.F.bestF(G) };
    if (d.v === 'dense') c.yp = 'dense';
    if (d.v === 'two') c.j = Math.round(t.seats * (t.rng > 7000 ? 0.08 : 0.05));
    if (d.v === 'three') { c.f = t.seats > 500 ? 12 : 8; c.j = Math.round(t.seats * 0.09); if (G.research.done.py) c.p = Math.round(t.seats * 0.06); }
    c.y = Math.max(0, Math.floor((t.seats - E.F.units(c)) / E.CABIN.y[c.yp].u));
    E.UIS.cab[ac.id] = c; UI.render();
  };
  E.A.cabReset = (d) => { delete E.UIS.cab[d.id]; UI.render(); };
  E.A.cabApply = (d) => {
    const G = E.G; const ac = G.fleet.find(a => a.id === d.id);
    const r = E.F.reconfigure(G, ac, cabDraft(ac));
    if (!r.ok) return UI.toast(r.why, 'bad');
    delete E.UIS.cab[ac.id]; UI.toast('Cabina reconfigurada (' + U.money(r.cost) + ')', 'good'); UI.render();
  };

  /* ---------- Mantenimiento ---------- */
  const acMnt = (G, ac) => {
    const ci = E.F.checkInfo(G, ac);
    const row = (k, n) => { const c = ci[k]; const p = U.clamp(1 - c.left / c.int, 0, 1.2); const s = E.F.checkSpec(G, ac, k); return `<div class="card tight mt8"><div class="row sp"><div><b>${n}</b><div class="tiny muted">cada ${U.n0(c.int)} h${c.days != null ? ' o ' + (k === 'C' ? '20 meses' : '7 años') : ''} · ${U.money(s.cost)} · ${U.dur(s.hours)}</div></div><button class="btn sm" data-a="startCheck" data-k="${k}" data-v="${ac.id}" ${ac.fl || ac.status !== 'active' ? 'disabled' : ''}>Hacer ahora</button></div><div class="mt8">${UI.bar(Math.min(1, p), p > 1 ? 'bad' : p > 0.85 ? 'warn' : 'good', true)}</div><div class="tiny ${c.left < 0 ? 'bad' : 'muted'} mt4">${c.left < 0 ? 'VENCIDO hace ' + U.n0(-c.left) + ' h' : 'Faltan ' + U.n0(c.left) + ' h'}${c.days != null ? ' · ' + (c.days < 0 ? 'vencido por fecha' : c.days + ' días') : ''}</div></div>`; };
    let h = `<div class="grid2">${UI.stat('Estado general', `<span class="${ac.cond < 50 ? 'bad' : ac.cond < 70 ? 'warn' : 'good'}">${Math.round(ac.cond)}%</span>`, UI.bar(ac.cond / 100, ac.cond < 50 ? 'bad' : ac.cond < 70 ? 'warn' : 'good', true))}${UI.stat('Motores', `${Math.round(Math.min(...ac.eng))}%`, `peor de ${ac.eng.length}`)}</div>`;
    h += row('A', 'Chequeo A (línea)') + row('C', 'Chequeo C (base)') + row('D', 'Chequeo D (gran inspección)');
    const es = E.F.checkSpec(G, ac, 'eng');
    h += `<div class="card tight mt8"><div class="row sp"><div><b>Overhaul de motores</b><div class="tiny muted">${U.money(es.cost)} · ${U.dur(es.hours)} · restaura todos los motores</div></div><button class="btn sm" data-a="startCheck" data-k="eng" data-v="${ac.id}" ${ac.fl || ac.status !== 'active' ? 'disabled' : ''}>Programar</button></div></div>`;
    h += `<div class="note mt12">Política actual: <b>${E.F.MPOL[G.mpol || 'std'].n}</b>. Los chequeos ${G.settings.autoMaint ? 'se programan automáticamente al vencer' : '<b>no</b> se programan solos: ¡ojo con los vencimientos!'}. ${G.bases[ac.loc] && G.bases[ac.loc].hangar ? 'Hay hangar propio en ' + ac.loc + ' (−25%).' : 'Sin hangar propio en la ubicación actual (+8%).'}</div>`;
    return h;
  };
  E.A.startCheck = async (d) => {
    const G = E.G; const ac = G.fleet.find(a => a.id === d.v);
    const s = E.F.checkSpec(G, ac, d.k);
    if (!await UI.confirm('¿Iniciar mantenimiento?', `El avión queda ${U.dur(s.hours)} fuera de servicio. Costo: ${U.money(s.cost)}.`, 'Iniciar')) return;
    E.F.startCheck(G, ac, d.k); UI.toast('Mantenimiento iniciado', 'good', 'wrench'); UI.render();
  };
  E.V.maintPolicy = {
    title: 'Mantenimiento', render() {
      const G = E.G;
      const pol = G.mpol || 'std';
      let h = `<p class="muted">La política define intervalos entre chequeos, desgaste y costo. Diferir ahorra plata hoy, pero sube el riesgo de averías, incidentes y sanciones.</p>`;
      h += `<div class="list">${Object.entries(E.F.MPOL).map(([k, v]) => `<button class="item ${pol === k ? 'hl' : ''}" data-a="setMpol" data-v="${k}" style="${pol === k ? 'border-color:var(--accent)' : ''}"><div class="grow"><div class="t">${v.n}</div><div class="s">Desgaste ×${v.k} · costo ×${v.cost} · intervalos ×${v.int}</div></div>${pol === k ? UI.icon('check') : ''}</button>`).join('')}</div>`;
      h += `<div class="item mt12"><div class="grow"><div class="t">Mantenimiento automático</div><div class="s">Programar chequeos al vencer</div></div>${UI.toggle('setting', G.settings.autoMaint, 'data-k="autoMaint"')}</div>`;
      const due = G.fleet.filter(a => a.status !== 'delivery').map(a => ({ a, ci: E.F.checkInfo(G, a) })).sort((x, y) => Math.min(x.ci.C.left, x.ci.D.left) - Math.min(y.ci.C.left, y.ci.D.left)).slice(0, 8);
      h += UI.sec('Próximos chequeos pesados');
      h += `<div class="list">${due.map(({ a, ci }) => `<button class="item" data-a="openAc" data-v="${a.id}"><div class="grow"><div class="t mono">${a.reg}</div><div class="s">${E.AC[a.type].short} · estado ${Math.round(a.cond)}%</div></div><div class="r small mono">C: ${U.n0(ci.C.left)} h<br>D: ${U.n0(ci.D.left)} h</div></button>`).join('')}</div>`;
      return h;
    }
  };
  E.A.setMpol = (d) => { E.G.mpol = d.v; UI.render(); };

  /* ---------- Sistemas ---------- */
  const acSys = (G, ac) => {
    const t = E.AC[ac.type];
    const gauge = (n, v) => `<div class="mt8"><div class="row sp small"><span>${n}</span><span class="mono ${v < 40 ? 'bad' : v < 65 ? 'warn' : ''}">${Math.round(v)}%</span></div>${UI.bar(v / 100, v < 40 ? 'bad' : v < 65 ? 'warn' : 'good', true)}</div>`;
    let h = `<div class="scr" style="border-width:4px;min-height:0;padding:12px">${ac.eng.map((e, i) => `<div class="row sp mono small" style="color:#9ff0bf"><span>ENG ${i + 1}</span><span>EGT MARGIN ${Math.round(e * 0.9)}°</span><span>${e < 40 ? '<span style="color:#ffbf3f">CHECK</span>' : 'NORM'}</span></div>`).join('')}<div class="row sp mono small mt8" style="color:#7fd1ff"><span>HYD ${Math.round(ac.sys.hyd)}%</span><span>ELEC ${Math.round(ac.sys.elec)}%</span><span>PRESS ${Math.round(ac.sys.press)}%</span><span>GEAR ${Math.round(ac.sys.gear)}%</span></div></div>`;
    h += `<div class="card mt12">${ac.eng.map((e, i) => gauge('Motor ' + (i + 1), e)).join('')}${gauge('Hidráulica', ac.sys.hyd)}${gauge('Eléctrico', ac.sys.elec)}${gauge('Presurización', ac.sys.press)}${gauge('Tren de aterrizaje', ac.sys.gear)}</div>`;
    h += UI.sec('Aviónica y mejoras');
    h += `<div class="list">${Object.entries(E.UPG).map(([k, u]) => { const av = E.F.upgAvail(G, ac, k); const inst = ac.upg[k]; return `<div class="item"><div class="grow"><div class="t">${u.n}</div><div class="s">${u.d}</div></div>${inst ? UI.chip('Instalado', 'good') : av.ok ? `<button class="btn sm" data-a="upgrade" data-k="${k}" data-v="${ac.id}">${U.money(av.cost)}</button>` : `<span class="tiny muted r" style="max-width:120px">${av.why}</span>`}</div>`; }).join('')}</div>`;
    h += `<div class="kv mt12"><span>Motores</span><span>${t.engines} ${t.prop ? 'turbohélices' : 'reacción'}</span><span>Tripulación técnica</span><span>${t.crew}${t.crew === 3 ? ' (con ingeniero)' : ''}</span><span>Pista necesaria</span><span>${U.n0(t.rwy)} m</span><span>Ruido</span><span>${t.ch2 ? 'Capítulo 2' : 'Capítulo 3+'}</span></div>`;
    return h;
  };
  E.A.upgrade = (d) => { const G = E.G; const ac = G.fleet.find(a => a.id === d.v); const r = E.F.upgrade(G, ac, d.k); if (!r.ok) return UI.toast(r.why, 'bad'); UI.toast('Instalación en curso', 'good'); UI.render(); };

  /* ---------- Finanzas del avión ---------- */
  const acFin = (G, ac) => {
    const v = E.F.value(G, ac);
    let h = `<div class="grid2">${UI.stat('Valor de mercado', U.money(v))}${ac.own === 'lease' ? UI.stat('Leasing mensual', U.money(ac.lease.mo * G.econ.cpi), 'vence ' + U.fmtMonth(ac.lease.until)) : UI.stat('Precio pagado', ac.paid ? U.money(ac.paid) : '—')}</div>`;
    const loan = G.fin.loans.find(l => l.ac === ac.id);
    if (loan) h += `<div class="note mt8">Financiado: saldo ${U.money(loan.amt)} al ${U.pct(loan.rate, 1)}. Se cancela con la venta.</div>`;
    if (ac.own === 'own') h += `<div class="card mt12"><b>Vender</b><p class="small muted">Un broker vende el avión al 90% de su valor de mercado: ${U.money(v * 0.9)}.</p><button class="btn danger" data-a="sellAc" data-v="${ac.id}">Vender avión</button></div>`;
    else { const c = E.F.returnCost(G, ac); h += `<div class="card mt12"><b>Devolver al arrendador</b><p class="small muted">Penalidad por devolución anticipada y condiciones de entrega: ${U.money(c)}. Recuperás el depósito.</p><button class="btn danger" data-a="returnAc" data-v="${ac.id}">Devolver</button></div>`; }
    return h;
  };
  E.A.sellAc = async (d) => { const G = E.G; const ac = G.fleet.find(a => a.id === d.v); if (!await UI.confirm('¿Vender ' + ac.reg + '?', `Recibís ${U.money(E.F.value(G, ac) * 0.9)}.`, 'Vender', true)) return; const r = E.F.sell(G, ac); UI.toast(r.pending ? 'Se venderá al aterrizar' : 'Avión vendido por ' + U.money(r.value), 'good'); if (!r.pending) UI.back(); else UI.render(); };
  E.A.returnAc = async (d) => { const G = E.G; const ac = G.fleet.find(a => a.id === d.v); if (!await UI.confirm('¿Devolver ' + ac.reg + '?', `Costo: ${U.money(E.F.returnCost(G, ac))}.`, 'Devolver', true)) return; const r = E.F.returnLease(G, ac); UI.toast(r.pending ? 'Se devolverá al aterrizar' : 'Avión devuelto', 'good'); if (!r.pending) UI.back(); else UI.render(); };

  /* ---------- Catálogo ---------- */
  const CATF = [{ v: 'all', l: 'Todos' }, { v: 'rp', l: 'Turbohélices' }, { v: 'rj', l: 'Regionales' }, { v: 'nb', l: 'Estrechos' }, { v: 'wb', l: 'Anchos' }, { v: 'jb', l: 'Jumbos' }, { v: 'fr', l: 'Cargueros' }, { v: 'ss', l: 'Supersónico' }];
  E.V.buy = {
    title: 'Catálogo', wide: true,
    sub: () => `Aviones disponibles en ${U.year(E.G.t)}`,
    render() {
      const G = E.G, S = E.UIS.buy;
      const yf = U.yearF(G.t);
      let list = E.AIRCRAFT.filter(t => S.cat === 'all' || t.cat === S.cat);
      if (S.show === 'avail') list = list.filter(t => E.F.available(G, t));
      else if (S.show === 'future') list = list.filter(t => t.y > yf);
      else list = list.filter(t => t.y <= yf && !E.F.available(G, t));
      const sorts = { year: (a, b) => a.y - b.y, seats: (a, b) => (a.seats || a.cargo * 4) - (b.seats || b.cargo * 4), range: (a, b) => a.rng - b.rng, price: (a, b) => a.price - b.price };
      list.sort(sorts[S.sort]);
      let h = UI.tabs('buyCat', CATF, S.cat);
      h += `<div class="row sp wrap mb8">${UI.seg('buyShow', [{ v: 'avail', l: 'En producción' }, { v: 'old', l: 'Discontinuados' }, { v: 'future', l: 'Futuros' }], S.show)}${UI.seg('buySort', [{ v: 'year', l: 'Año' }, { v: 'seats', l: 'Capacidad' }, { v: 'range', l: 'Alcance' }, { v: 'price', l: 'Precio' }], S.sort)}</div>`;
      if (S.show === 'old') h += `<div class="note mb8">Estos modelos ya no se fabrican: solo se consiguen en el mercado de segunda mano.</div>`;
      if (!list.length) h += `<div class="empty">No hay modelos en esta categoría.</div>`;
      h += `<div class="list">${list.map(t => {
        const off = G.offers.find(o => o.type === t.id && o.until > G.t);
        const fut = t.y > yf;
        const famN = G.fleet.filter(a => E.AC[a.type].fam === t.fam).length;
        return `<button class="item" data-a="openType" data-v="${t.id}" style="${fut ? 'opacity:.55' : ''}"><div style="width:42%;max-width:240px;flex:none" class="art-box">${E.ART.side(t.id, G.airline, { gear: true })}</div>
          <div class="grow"><div class="row wrap gap4"><span class="t">${t.short}</span>${off ? UI.chip('−' + Math.round(off.disc * 100) + '%', 'acc') : ''}${famN ? UI.chip('familia en flota', 'good') : ''}${fut ? UI.chip('desde ' + t.y) : ''}</div><div class="s">${t.mk} · ${E.CATS[t.cat]} · ${t.y}${t.e ? '–' + t.e : ''}</div>
          <div class="s mono">${t.freighter ? U.n0(t.cargo) + ' t' : t.seats + ' asientos'} · ${U.km(t.rng)} · ${U.n0(t.spd)} km/h</div><div class="mono" style="font-weight:700;margin-top:2px">${fut ? '—' : U.money(E.F.newPrice(G, t.id))}</div></div></button>`;
      }).join('')}</div>`;
      return h;
    }
  };
  E.A.buyCat = (d) => { E.UIS.buy.cat = d.v; UI.render(true); };
  E.A.buyShow = (d) => { E.UIS.buy.show = d.v; UI.render(true); };
  E.A.buySort = (d) => { E.UIS.buy.sort = d.v; UI.render(true); };
  E.A.openType = (d) => UI.open('type', { id: d.v });

  E.V.type = {
    title: (p) => E.AC[p.id].short, sub: (p) => E.AC[p.id].mk + ' · ' + E.CATS[E.AC[p.id].cat],
    render(p) {
      const G = E.G, t = E.AC[p.id];
      const yf = U.yearF(G.t);
      const avail = E.F.available(G, t);
      let h = `<div class="art-hero">${E.ART.side(t.id, G.airline)}</div>`;
      const perSeat = t.seats ? t.burn / t.seats * 100 : 0;
      h += `<div class="grid4">${UI.stat(t.freighter ? 'Carga' : 'Asientos máx.', t.freighter ? U.n0(t.cargo) + ' t' : t.seats)}${UI.stat('Alcance', U.km(t.rng))}${UI.stat('Crucero', U.n0(t.spd) + ' km/h')}${UI.stat(t.freighter ? 'Consumo' : 'Consumo/asiento', t.freighter ? U.n1(t.burn) + ' kg/km' : U.n1(perSeat) + ' kg/100km')}</div>`;
      h += `<div class="kv mt12"><span>Fabricante</span><span>${t.mk}</span><span>Servicio</span><span>${t.y}${t.e ? '–' + t.e : ' – hoy'}</span><span>MTOW / OEW</span><span>${U.n0(t.mtow)} t / ${U.n1(t.oew)} t</span><span>Consumo</span><span>${U.n1(t.burn)} kg/km</span><span>Pista mínima</span><span>${U.n0(t.rwy)} m</span><span>Tripulación técnica</span><span>${t.crew} pilotos${t.crew === 3 ? ' (ingeniero de vuelo)' : ''}</span><span>Bodega</span><span>${U.n1(t.cargo)} t</span><span>Mantenimiento</span><span>${U.money(t.maint * G.econ.cpi)}/h bloque</span><span>ETOPS</span><span>${t.twin ? (t.etops ? 'Certificable' : 'No') : 'No aplica (' + t.engines + ' motores)'}</span><span>Ruido</span><span>${t.ch2 ? 'Capítulo 2 (ruidoso)' : 'Moderno'}</span></div>`;
      const famN = G.fleet.filter(a => E.AC[a.type].fam === t.fam).length;
      if (famN) h += `<div class="note mt8">Ya operás ${famN} avión(es) de esta familia: tripulaciones y repuestos compartidos.</div>`;
      else if (G.fleet.length) h += `<div class="note warn mt8">Familia nueva para tu flota: más costos de formación (ya incluidos en la contratación) y complejidad.</div>`;
      if (!avail) {
        h += t.y > yf ? `<div class="note mt12">Entra en servicio en ${t.y}.</div>` : `<div class="note mt12">Fuera de producción desde ${t.e}. Buscalo en el mercado de usados.</div>`;
      } else {
        const cu = E.F.canUseType(G, t);
        const price = E.F.newPrice(G, t.id);
        const lm = E.F.leaseRate(G, t.id, 0) * 1.02 * G.econ.cpi;
        const months = E.F.deliveryMonths(G, t);
        const bases = Object.keys(G.bases);
        h += UI.sec('Comprar nuevo');
        h += `<div class="card"><div class="row sp"><div><div class="mono" style="font-size:22px;font-weight:800">${U.money(price)}</div><div class="small muted">Entrega en ~${months} meses</div></div>${G.offers.some(o => o.type === t.id && o.until > G.t) ? UI.chip('Oferta del fabricante', 'acc') : ''}</div>
          <div class="row wrap mt12"><label class="field grow"><span>Cantidad</span><select class="input" id="buyN">${[1, 2, 3, 4, 5, 6, 8, 10].map(n => `<option>${n}</option>`).join('')}</select></label><label class="field grow"><span>Base de entrega</span><select class="input" id="buyBase">${bases.map(b => `<option>${b}</option>`).join('')}</select></label></div>
          <div class="btns mt12"><button class="btn primary" data-a="buyNew" data-v="${t.id}" ${cu.ok ? '' : 'disabled'}>Comprar (20% anticipo)</button><button class="btn" data-a="buyFin" data-v="${t.id}" ${cu.ok ? '' : 'disabled'}>Financiar (8% + crédito)</button></div>${cu.ok ? '' : `<div class="note bad mt8">${cu.why}</div>`}</div>`;
        h += UI.sec('Leasing operativo');
        h += `<div class="card"><div class="row sp"><div><div class="mono" style="font-size:22px;font-weight:800">${U.money(lm)}<span class="small muted">/mes</span></div><div class="small muted">Entrega en 5-9 semanas · depósito 2 meses</div></div></div>
          <div class="row wrap mt12"><label class="field grow"><span>Plazo</span><select class="input" id="leaseY">${[4, 6, 8, 10, 12].map(n => `<option value="${n}" ${n === 8 ? 'selected' : ''}>${n} años</option>`).join('')}</select></label></div>
          <button class="btn mt12" data-a="leaseNew" data-v="${t.id}" ${cu.ok ? '' : 'disabled'}>Alquilar</button></div>`;
      }
      const used = G.used.filter(l => l.type === t.id);
      if (used.length) { h += UI.sec('En el mercado de usados'); h += `<div class="list">${used.map(l => usedRow(G, l)).join('')}</div>`; }
      return h;
    }
  };
  const getN = () => +(UI.$('#buyN') || { value: 1 }).value;
  const getBase = () => (UI.$('#buyBase') || { value: E.G.airline.home }).value;
  E.A.buyNew = async (d) => { const G = E.G, n = getN(); const price = E.F.newPrice(G, d.v); if (!await UI.confirm(`¿Comprar ${n} ${E.AC[d.v].short}?`, `Anticipo ahora: ${U.money(price * 0.2 * n)}. Resto al entregar: ${U.money(price * 0.8 * n)}.`, 'Comprar')) return; const r = E.F.order(G, d.v, 'buy', { n, base: getBase() }); if (!r.ok) return UI.toast(r.why, 'bad'); UI.toast(`Pedido confirmado: ${n} × ${E.AC[d.v].short}`, 'good', 'plane'); UI.root('fleet'); };
  E.A.buyFin = async (d) => { const G = E.G, n = getN(); const price = E.F.newPrice(G, d.v); const rate = E.EC.loanRate(G, 120) - 0.006; if (!await UI.confirm(`¿Financiar ${n} ${E.AC[d.v].short}?`, `Anticipo ${U.money(price * 0.08 * n)}. Al entregar, el banco presta el resto a 10 años al ${U.pct(rate, 1)} anual.`, 'Financiar')) return; const r = E.F.order(G, d.v, 'buy', { n, finance: true, base: getBase() }); if (!r.ok) return UI.toast(r.why, 'bad'); UI.toast('Pedido financiado', 'good', 'plane'); UI.root('fleet'); };
  E.A.leaseNew = async (d) => { const G = E.G, y = +(UI.$('#leaseY') || { value: 8 }).value; const lm = E.F.leaseRate(G, d.v, 0) * 1.02 * G.econ.cpi; if (!await UI.confirm(`¿Alquilar un ${E.AC[d.v].short}?`, `${U.money(lm)} por mes durante ${y} años. Depósito: ${U.money(lm * 2)}.`, 'Alquilar')) return; const r = E.F.order(G, d.v, 'lease', { years: y, base: G.airline.home }); if (!r.ok) return UI.toast(r.why, 'bad'); UI.toast('Leasing firmado', 'good', 'plane'); UI.root('fleet'); };

  /* ---------- Usados ---------- */
  const usedRow = (G, l) => {
    const t = E.AC[l.type];
    const age = U.yearF(G.t) - l.built;
    return `<div class="item" style="flex-wrap:wrap"><div class="art-box" style="width:42%;max-width:210px;height:70px;flex:none">${E.ART.side(l.type, G.airline, { gear: false, shadow: false })}</div>
      <div class="grow" style="min-width:150px"><div class="t">${t.short}</div><div class="s">${U.n1(age)} años · ${U.n0(l.hours)} h · ${U.esc(l.seller)}</div><div class="row mt4"><span class="tiny muted">Estado</span><div class="grow">${UI.bar(l.cond / 100, l.cond < 50 ? 'bad' : l.cond < 70 ? 'warn' : 'good', true)}</div><span class="mono tiny">${l.cond}%</span></div></div>
      <div class="col" style="align-items:flex-end"><button class="btn sm primary" data-a="usedBuy" data-v="${l.id}">${U.money(l.price)}</button><button class="btn sm" data-a="usedLease" data-v="${l.id}">${U.money(l.lease)}/mes</button></div></div>`;
  };
  E.V.used = {
    title: 'Mercado de usados', wide: true, live: false,
    sub: () => 'Se renueva cada semana · más baratos, pero con más mantenimiento',
    render(p) {
      const G = E.G;
      const cat = p.cat || 'all';
      let list = G.used.filter(l => cat === 'all' || E.AC[l.type].cat === cat).sort((a, b) => a.price - b.price);
      let h = UI.tabs('usedCat', CATF.filter(c => c.v !== 'ss'), cat);
      h += list.length ? `<div class="list">${list.map(l => usedRow(G, l)).join('')}</div>` : `<div class="empty"><span class="serif">Nada por ahora</span>Volvé la semana que viene.</div>`;
      return h;
    }
  };
  E.A.usedCat = (d) => { UI.current().params = { cat: d.v }; UI.render(true); };
  E.A.usedBuy = async (d) => { const G = E.G; const l = G.used.find(x => x.id === d.v); if (!l) return; if (!await UI.confirm('¿Comprar este ' + E.AC[l.type].short + '?', `${U.money(l.price)} · entrega en 1-3 semanas en ${G.airline.home}.`, 'Comprar')) return; const r = E.F.buyUsed(G, d.v, 'buy'); if (!r.ok) return UI.toast(r.why, 'bad'); UI.toast('Compra cerrada', 'good', 'plane'); UI.render(); };
  E.A.usedLease = async (d) => { const G = E.G; const l = G.used.find(x => x.id === d.v); if (!l) return; if (!await UI.confirm('¿Alquilar este ' + E.AC[l.type].short + '?', `${U.money(l.lease)} por mes, 4 años. Depósito ${U.money(l.lease * 2)}.`, 'Alquilar')) return; const r = E.F.buyUsed(G, d.v, 'lease'); if (!r.ok) return UI.toast(r.why, 'bad'); UI.toast('Leasing firmado', 'good', 'plane'); UI.render(); };
})();
