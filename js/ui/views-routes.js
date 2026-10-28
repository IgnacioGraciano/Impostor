/* ESTELA · rutas, planificación de vuelos, aeropuertos, bases y slots */
'use strict';
(() => {
  const U = E.U, UI = E.UI;
  const CLS = { y: 'Turista', p: 'Premium', j: 'Ejecutiva', f: 'Primera' };
  E.A.openRoute = (d) => { UI.open('route', { id: d.v }); };
  E.A.openAirport = (d) => UI.open('airport', { iata: d.v });

  const routeWeek = (G, r) => {
    let rev = 0, cost = 0;
    G.fleet.forEach(ac => { if (ac.route !== r.id || ac.status === 'delivery') return; const o = E.FL.legEcon(G, ac, r, true), i = E.FL.legEcon(G, ac, r, false); rev += (o.rev + i.rev) * ac.freq; cost += (o.cost + i.cost) * ac.freq; });
    return { rev, cost, profit: rev - cost };
  };

  /* ---------- Lista de rutas ---------- */
  E.V.routes = {
    title: 'Rutas', live: true,
    sub: () => { const G = E.G; return `${G.routes.length} rutas · ${E.X.destinations(G).length} destinos`; },
    render(p) {
      const G = E.G;
      const sort = p.sort || 'profit';
      const rows = G.routes.map(r => { const w = routeWeek(G, r); const d = r.dem || E.D.routeDemand(G, r); return { r, w, d, f: E.FL.routeFreq(G, r), h: r.stats.hist[r.stats.hist.length - 1] }; });
      const sorts = { profit: (a, b) => b.w.profit - a.w.profit, lf: (a, b) => b.d.lfAll - a.d.lfAll, dist: (a, b) => b.r.d - a.r.d, name: (a, b) => a.r.key.localeCompare(b.r.key) };
      rows.sort(sorts[sort]);
      const tot = rows.reduce((s, x) => s + x.w.profit, 0);
      let h = `<div class="btns mb8"><button class="btn primary" data-a="newRouteFrom" data-v="${G.airline.home}">${UI.icon('plus')}Nueva ruta</button><button class="btn" data-a="open" data-v="bases">${UI.icon('building')}Bases y slots</button></div>`;
      h += `<div class="grid3 r2">${UI.stat('Resultado semanal est.', `<span class="${tot >= 0 ? 'good' : 'bad'}">${U.signed(tot)}</span>`)}${UI.stat('Frecuencias', U.n0(rows.reduce((s, x) => s + x.f, 0)) + '/sem')}${UI.stat('Licencia', { nat: 'Nacional', reg: 'Continental', int: 'Intercontinental' }[E.R.license(G)])}</div>`;
      h += `<div class="row sp mt12 mb8"><span class="tiny muted">Ordenar</span>${UI.seg('routeSort', [{ v: 'profit', l: 'Resultado' }, { v: 'lf', l: 'Ocupación' }, { v: 'dist', l: 'Distancia' }, { v: 'name', l: 'Nombre' }], sort)}</div>`;
      if (!rows.length) h += `<div class="empty"><span class="serif">Sin rutas todavía</span>Tocá un aeropuerto en el mapa o creá una ruta desde tu base.</div>`;
      h += `<div class="list">${rows.map(({ r, w, d, f }) => `<button class="item" data-a="openRoute" data-v="${r.id}" data-hl="${r.id}">
        <div class="grow"><div class="row"><span class="t mono">${r.a} ⇄ ${r.b}</span>${f === 0 ? UI.chip('sin aviones', 'warn') : ''}${r.auto ? UI.chip('auto', 'acc') : ''}</div><div class="s">${E.AP[r.a].city} – ${E.AP[r.b].city} · ${U.km(r.d)} · ${f}×/sem</div>
        <div class="row mt4"><span class="tiny muted" style="width:62px">Ocup. ${U.pct(d.lfAll)}</span><div class="grow">${UI.bar(d.lfAll, d.lfAll > 0.8 ? 'good' : d.lfAll > 0.6 ? '' : 'bad', true)}</div></div></div>
        <div class="r"><div class="mono ${w.profit >= 0 ? 'good' : 'bad'}" style="font-weight:700">${U.signed(w.profit)}</div><div class="tiny muted">por semana</div></div></button>`).join('')}</div>`;
      return h;
    }
  };
  E.A.routeSort = (d) => { UI.current().params = { sort: d.v }; UI.render(); };

  /* ---------- Detalle de ruta ---------- */
  E.V.route = {
    title: (p) => { const r = E.G.routes.find(x => x.id === p.id); return r ? `${r.a} ⇄ ${r.b}` : 'Ruta'; },
    sub: (p) => { const r = E.G.routes.find(x => x.id === p.id); return r ? `${E.AP[r.a].city} – ${E.AP[r.b].city} · ${U.km(r.d)}` : ''; },
    live: true,
    render(p) {
      const G = E.G;
      const r = G.routes.find(x => x.id === p.id);
      if (!r) return `<div class="empty">La ruta ya no existe.</div>`;
      E.MAP.highlight = r.id;
      const tab = p.tab || 'sum';
      let h = UI.tabs('routeTab', [{ v: 'sum', l: 'Resumen' }, { v: 'price', l: 'Tarifas' }, { v: 'plan', l: 'Plan de vuelo' }, { v: 'comp', l: 'Mercado' }, { v: 'hist', l: 'Historial' }], tab);
      if (tab === 'sum') h += rSum(G, r);
      if (tab === 'price') h += rPrice(G, r);
      if (tab === 'plan') h += rPlan(G, r);
      if (tab === 'comp') h += rComp(G, r);
      if (tab === 'hist') h += rHist(G, r);
      return h;
    },
    mount(el, p) { const r = E.G.routes.find(x => x.id === p.id); if (r && !p._fit) { p._fit = 1; E.MAP.fit([E.AP[r.a], E.AP[r.b]]); } }
  };
  E.A.routeTab = (d) => { const c = UI.current(); c.params = Object.assign({}, c.params, { tab: d.v }); UI.render(); };

  const rSum = (G, r) => {
    const d = r.dem || E.D.routeDemand(G, r);
    const acs = E.FL.routeAc(G, r);
    const w = routeWeek(G, r);
    const f = E.FL.routeFreq(G, r);
    let h = `<div class="grid2">${UI.stat('Resultado semanal', `<span class="${w.profit >= 0 ? 'good' : 'bad'}">${U.signed(w.profit)}</span>`, `Ingresos ${U.money(w.rev)}`)}${UI.stat('Ocupación', U.pct(d.lfAll), UI.bar(d.lfAll, d.lfAll > 0.8 ? 'good' : '', true))}${UI.stat('Frecuencia', f + '×/sem', (f / 7).toFixed(1) + ' diarias')}${UI.stat('Pasajeros/día', U.n0(['y', 'p', 'j', 'f'].reduce((s, k) => s + d[k][0] + d[k][1], 0)), 'ambos sentidos')}</div>`;
    const wa = E.W.at(G, r.a), wb = E.W.at(G, r.b);
    h += `<div class="card mt12"><div class="row sp"><div><div class="mono" style="font-weight:800">${r.a}</div>${UI.wx(wa)}</div><div class="tiny muted r">${r.info.water > 0.3 ? U.pct(r.info.water) + ' sobre agua' : ''}${E.F.etopsNeed(r.info) ? '<br>requiere ' + E.F.etopsNeed(r.info) + ' en bimotores' : ''}</div><div class="r"><div class="mono" style="font-weight:800">${r.b}</div>${UI.wx(wb)}</div></div></div>`;
    h += UI.sec('Aviones asignados', `<button class="btn sm" data-a="assignTo" data-v="${r.id}">${UI.icon('plus')}Asignar</button>`);
    if (!acs.length) h += `<div class="note warn">Esta ruta no tiene aviones. Asigná uno para empezar a vender pasajes.</div>`;
    h += `<div class="list">${acs.map(ac => { const o = E.FL.legEcon(G, ac, r, true), i = E.FL.legEcon(G, ac, r, false); const pr = (o.profit + i.profit) * ac.freq; const st = E.acStatus(G, ac); return `<div class="item acrow"><div class="art-sm">${E.ART.side(ac.type, G.airline, { gear: false, shadow: false })}</div><div class="grow"><div class="t mono">${ac.reg}</div><div class="s">${E.AC[ac.type].short} · ${E.F.seats(ac).total} asientos · bloque ${U.dur(o.block)}</div><div class="slider-row"><span class="tiny muted">${ac.freq}×/sem (máx. ${E.FL.maxFreq(G, ac, r)})</span><span class="val tiny ${pr >= 0 ? 'good' : 'bad'}">${U.signed(pr)}</span>${UI.range('routeAcFreq', 1, E.FL.maxFreq(G, ac, r), 1, ac.freq, `data-id="${ac.id}"`)}</div></div><div class="col" style="align-items:flex-end">${UI.chip(st[0], st[1])}<button class="btn sm ghost" data-a="openAc" data-v="${ac.id}">Ver</button></div></div>`; }).join('')}</div>`;
    // economía de un vuelo
    if (acs.length) {
      const e = E.FL.legEcon(G, acs[0], r, true);
      h += UI.sec('Economía de un vuelo de ida', `<span class="tiny muted">${E.AC[acs[0].type].short}</span>`);
      const rows = [['Pasajes', e.ticket], ['Auxiliares', e.anc], ['Carga', e.cargoRev], ['Combustible', -e.fuelCost - e.carbon], ['Tasas y handling', -(e.landing + e.paxFees + e.handling)], ['Navegación', -e.nav], ['Servicio a bordo', -e.catering], ['Mantenimiento', -e.maint], ['Distribución y otros', -(e.distr + e.crewHotel + e.comp)]];
      h += `<div class="card tight"><table class="tbl">${rows.map(([n, v]) => `<tr><td>${n}</td><td class="n ${v < 0 ? 'bad' : ''}">${U.money(v)}</td></tr>`).join('')}<tr class="tot"><td>Resultado directo</td><td class="n ${e.profit >= 0 ? 'good' : 'bad'}">${U.money(e.profit)}</td></tr></table><div class="tiny muted mt8">${e.paxN} pasajeros · ${U.n0(e.fuelKg)} kg de combustible · no incluye leasing, personal ni seguros.</div></div>`;
    }
    h += `<div class="btns mt16"><button class="btn danger" data-a="delRoute" data-v="${r.id}">Cerrar ruta</button></div>`;
    return h;
  };
  E.IN.routeAcFreq = (el, type) => {
    const G = E.G; const ac = G.fleet.find(a => a.id === el.dataset.id);
    el.parentElement.querySelector('.tiny.muted').textContent = el.value + '×/sem';
    if (type === 'change') { const r = G.routes.find(x => x.id === ac.route); const res = E.FL.assign(G, ac, r, +el.value); if (!res.ok) UI.toast(res.why, 'bad'); E.D.routeDemand(G, r); E.ST.required(G); UI.render(); }
  };
  E.A.assignTo = (d) => E.MOD.assignRoute(d.v);
  E.A.delRoute = async (d) => {
    const G = E.G; const r = G.routes.find(x => x.id === d.v);
    if (!await UI.confirm('¿Cerrar la ruta?', `${r.a}–${r.b}: los aviones quedarán libres.`, 'Cerrar ruta', true)) return;
    E.R.remove(G, r); E.ST.required(G); E.MAP.clearCache(); UI.back();
  };

  /* ----- Tarifas ----- */
  E.priceEst = (G, r, cls, price) => {
    const clone = Object.assign({}, r, { price: Object.assign({}, r.price, { [cls]: price }) });
    const d = E.D.routeDemand(G, clone);
    const pax = d[cls][0] + d[cls][1];
    const cap = d.cap[cls] / 7 * 2;
    const sold = Math.min(pax, cap);
    return { lf: cap ? sold / cap : 0, rev: sold * price * 7 * 0.95, pax };
  };
  const rPrice = (G, r) => {
    const d = r.dem || E.D.routeDemand(G, r);
    const ref = d.ref;
    let h = `<p class="small muted" style="margin-top:0">La tarifa de referencia es el precio medio del mercado para esta distancia y época. Por encima perdés pasajeros sensibles al precio; por debajo estimulás demanda pero dejás plata sobre la mesa.</p>`;
    const seasonNow = E.D.season(E.AP[r.a], E.AP[r.b], U.month(G.t));
    h += `<div class="row wrap gap4 mb8">${UI.chip(seasonNow > 1.06 ? 'Temporada alta' : seasonNow < 0.95 ? 'Temporada baja' : 'Temporada media', seasonNow > 1.06 ? 'good' : seasonNow < 0.95 ? 'warn' : '')}${G.rep.otp < 0.8 ? UI.chip('Ejecutivos molestos por demoras', 'bad') : ''}${d.lowcost > 0.5 ? UI.chip('Percepción low-cost', 'acc') : ''}</div>`;
    ['y', 'p', 'j', 'f'].forEach(k => {
      if (!d.cap[k]) return;
      const est = E.priceEst(G, r, k, r.price[k]);
      const min = Math.round(ref[k] * 0.4), max = Math.round(ref[k] * 2.6);
      h += `<div class="card mt8"><div class="row sp"><b>${CLS[k]}</b><span class="tiny muted">ref. ${U.money(ref[k])}</span></div>
        <div class="slider-row mt8"><span class="mono" style="font-size:22px;font-weight:800" id="pv-${k}">${U.moneyFull(r.price[k])}</span><span class="val small" id="pe-${k}">Ocup. ${U.pct(est.lf)} · ${U.money(est.rev)}/sem</span>${UI.range('price', min, max, 1, r.price[k], `data-c="${k}" data-id="${r.id}"`)}</div>
        <div class="row sp tiny muted"><span>${U.money(min)}</span><span>${U.pct(r.price[k] / ref[k])} de la referencia</span><span>${U.money(max)}</span></div></div>`;
    });
    if (d.cap.c > 0) h += `<div class="card mt8"><div class="row sp"><b>Carga</b><span class="mono">${U.n2(E.D.cargoRate(G, r.d) * (r.cargoP || 1))} $/t·km</span></div><div class="slider-row mt8"><span class="small">Tarifa relativa</span><span class="val">${U.pct(r.cargoP || 1)}</span>${UI.range('cargoP', 0.6, 1.6, 0.05, r.cargoP || 1, `data-id="${r.id}"`)}</div></div>`;
    h += `<div class="item mt12"><div class="grow"><div class="t">Tarifas estacionales</div><div class="s">Sube los precios en temporada alta y los baja en la baja (hoy ${seasonNow >= 1 ? '+' : ''}${U.pct((seasonNow - 1) * 0.8)}).</div></div>${UI.toggle('seasonal', r.seasonal, `data-id="${r.id}"`)}</div>`;
    const canAuto = G.research.done.yield || G.research.done.dyn;
    h += `<div class="item mt12"><div class="grow"><div class="t">Precios automáticos</div><div class="s">${canAuto ? 'El sistema de yield ajusta cada semana según la ocupación.' : 'Requiere investigar Yield management.'}</div></div>${canAuto ? UI.toggle('autoPrice', r.auto, `data-id="${r.id}"`) : UI.icon('lock')}</div>`;
    h += `<div class="btns mt12"><button class="btn sm" data-a="priceRef" data-v="${r.id}">Volver a la referencia</button><button class="btn sm" data-a="priceAll" data-v="${r.id}" data-k="0.9">−10% todas</button><button class="btn sm" data-a="priceAll" data-v="${r.id}" data-k="1.1">+10% todas</button></div>`;
    return h;
  };
  E.IN.price = (el, type) => {
    const G = E.G; const r = G.routes.find(x => x.id === el.dataset.id); const k = el.dataset.c; const v = +el.value;
    const est = E.priceEst(G, r, k, v);
    UI.$('#pv-' + k).textContent = U.moneyFull(v);
    UI.$('#pe-' + k).textContent = `Ocup. ${U.pct(est.lf)} · ${U.money(est.rev)}/sem`;
    if (type === 'change') {
      if (v > r.price[k] && E.X.modMult(G, 'pricefreeze', {}, true)) { UI.toast('Tarifas congeladas por el gobierno: no podés subirlas', 'bad'); UI.render(); return; }
      r.price[k] = v; r.auto = false; E.D.routeDemand(G, r); UI.render();
    }
  };
  E.IN.cargoP = (el, type) => { const r = E.G.routes.find(x => x.id === el.dataset.id); el.parentElement.querySelector('.val').textContent = U.pct(+el.value); if (type === 'change') { r.cargoP = +el.value; E.D.routeDemand(E.G, r); } };
  E.IN.seasonal = (el) => { const r = E.G.routes.find(x => x.id === el.dataset.id); r.seasonal = el.checked; E.D.routeDemand(E.G, r); };
  E.IN.autoPrice = (el) => { const r = E.G.routes.find(x => x.id === el.dataset.id); r.auto = el.checked; };
  E.A.priceRef = (d) => { const G = E.G; const r = G.routes.find(x => x.id === d.v); const ref = E.D.refN(G, r.d, r.a, r.b); ['y', 'p', 'j', 'f'].forEach(k => r.price[k] = Math.round(ref[k])); E.D.routeDemand(G, r); UI.render(); };
  E.A.priceAll = (d) => { const G = E.G; const r = G.routes.find(x => x.id === d.v); ['y', 'p', 'j', 'f'].forEach(k => r.price[k] = Math.round(r.price[k] * +d.k)); E.D.routeDemand(G, r); UI.render(); };

  /* ----- Plan de vuelo ----- */
  const rPlan = (G, r) => {
    const acs = E.FL.routeAc(G, r);
    const ac = acs[0];
    const P = r.plan;
    const wo = E.W.routeWind(G, r.a, r.b), wi = E.W.routeWind(G, r.b, r.a);
    let h = '';
    h += `<div class="grid2">${UI.stat('Viento medio ida', `<span class="${wo >= 0 ? 'good' : 'bad'}">${wo >= 0 ? '+' : ''}${Math.round(wo)} km/h</span>`, wo >= 0 ? 'de cola' : 'de frente')}${UI.stat('Viento medio vuelta', `<span class="${wi >= 0 ? 'good' : 'bad'}">${wi >= 0 ? '+' : ''}${Math.round(wi)} km/h</span>`, wi >= 0 ? 'de cola' : 'de frente')}</div>`;
    // Cost index
    const t = ac ? E.AC[ac.type] : null;
    const spd = t ? E.F.cruise(G, t, r, P.ci) : 0;
    h += `<div class="card mt12"><div class="row sp"><b>Cost Index</b><span class="tiny muted">velocidad vs. combustible</span></div>
      <div class="slider-row mt8"><span class="small" id="ciTxt">${t ? `${U.n0(spd)} km/h · bloque ${U.dur(E.F.blockTime(G, ac, r, true))}` : 'Asigná un avión para ver el efecto'}</span><span class="val">CI ${P.ci}</span>${UI.range('ci', 0, 100, 5, P.ci, `data-id="${r.id}"`)}</div>
      <div class="tiny muted">CI bajo: vuelo lento y económico. CI alto: recupera demoras pero quema hasta 8% más.</div></div>`;
    // combustible
    h += `<div class="card mt8"><b>Política de combustible</b><div class="mt8">${UI.seg('fuelPol', [{ v: 'min', l: 'Mínimo legal' }, { v: 'std', l: 'Estándar' }, { v: 'cons', l: 'Conservadora' }], P.fuel, 'full')}</div>
      <div class="tiny muted mt8">${{ min: 'Menos peso, menos consumo… pero si hay espera por clima, más desvíos por combustible mínimo.', std: 'Contingencia del 5% + alternativo + reserva final de 30 min.', cons: 'Margen amplio para esperas largas: menos desvíos, ~1% más de consumo.' }[P.fuel]}</div></div>`;
    // tankering
    const pa = E.EC.fuelPrice(G, r.a), pb = E.EC.fuelPrice(G, r.b);
    h += `<div class="item mt8"><div class="grow"><div class="t">Tankering</div><div class="s">Cargar en ${r.a} el combustible de la vuelta. ${r.a}: ${U.n2(pa)} $/kg · ${r.b}: ${U.n2(pb)} $/kg ${pb > pa * 1.04 ? '<span class="good">conviene</span>' : '<span class="muted">no conviene</span>'}</div></div>${UI.toggle('tank', P.tank, `data-id="${r.id}"`)}</div>`;
    // alternativo
    const alts = E.AIRPORTS.filter(x => x.iata !== r.b && x.iata !== r.a && x.size >= 2).map(x => ({ x, d: U.dist(E.AP[r.b], x) })).sort((a, b) => a.d - b.d).slice(0, 6);
    h += `<div class="card mt8"><div class="row sp"><b>Aeropuerto alternativo en ${r.b}</b><span class="tiny muted">plan de contingencia</span></div><select class="input mt8" data-in="altAp" data-id="${r.id}">${alts.map(({ x, d }) => `<option value="${x.iata}" ${P.alt === x.iata ? 'selected' : ''}>${x.iata} · ${x.city} (${U.n0(d)} km${x.rwy < (t ? t.rwy : 0) ? ', pista corta' : ''})</option>`).join('')}</select>
      <div class="tiny muted mt8">Si hay niebla sin CAT III, tormentas o viento cruzado en ${r.b}, el vuelo se desvía aquí. Más cerca = desvíos más baratos.</div></div>`;
    // peso y balance
    if (ac) {
      const e = E.FL.legEcon(G, ac, r, true);
      const payload = e.paxN * 0.1 + e.cargo;
      const fuel = E.F.planFuel(G, ac, r.d, P.fuel) / 1000;
      const tow = t.oew + payload + fuel;
      const k = t.mtow * 1.05;
      const pk = E.F.payloadK(G, ac, r.d);
      const cg = P.cg == null ? 0.5 : P.cg;
      const mac = 18 + cg * 16;
      h += UI.sec('Peso y balance', `<span class="tiny muted">${t.short} · ida</span>`);
      h += `<div class="card"><div class="row" style="height:26px;border-radius:8px;overflow:hidden;gap:1px">
          <i style="display:block;height:100%;width:${t.oew / k * 100}%;background:#5e6b80" title="Peso vacío"></i>
          <i style="display:block;height:100%;width:${payload / k * 100}%;background:var(--sky)" title="Carga paga"></i>
          <i style="display:block;height:100%;width:${fuel / k * 100}%;background:var(--accent)" title="Combustible"></i></div>
        <div class="legend mt8"><span><i style="background:#5e6b80"></i>Vacío ${U.n0(t.oew)} t</span><span><i style="background:var(--sky)"></i>Carga paga ${U.n1(payload)} t</span><span><i style="background:var(--accent)"></i>Combustible ${U.n1(fuel)} t</span></div>
        <div class="row sp mt8 small"><span>Peso de despegue</span><span class="mono ${tow > t.mtow ? 'bad' : ''}">${U.n0(tow)} / ${U.n0(t.mtow)} t MTOW</span></div>
        ${pk < 0.999 ? `<div class="note warn mt8">Restricción de peso: solo ${U.pct(pk)} de la carga paga máxima a esta distancia.</div>` : ''}
        <div class="slider-row mt12"><span class="small">Centro de gravedad (carga hacia atrás)</span><span class="val" id="cgTxt">${U.n1(mac)}% MAC</span>${UI.range('cg', 0.05, 0.9, 0.05, cg, `data-id="${r.id}"`)}</div>
        <div class="tiny muted">Un CG más atrasado reduce la resistencia del estabilizador (óptimo ≈ 29% MAC). Fuera de envolvente: no despega.</div>
        <button class="btn sm mt8" data-a="cgOpt" data-v="${r.id}">Optimizar carga</button></div>`;
    }
    h += `<div class="kv mt12"><span>Distancia</span><span>${U.km(r.d)}</span><span>Sobre agua</span><span>${U.pct(r.info.water)}</span><span>Tramo oceánico máx.</span><span>${U.km(r.info.gap)}</span><span>Distancia máx. a un alternativo</span><span>${U.km(r.info.div)}</span><span>ETOPS para bimotores</span><span>${E.F.etopsNeed(r.info) || 'No'}</span></div>`;
    return h;
  };
  E.IN.ci = (el, type) => {
    const G = E.G; const r = G.routes.find(x => x.id === el.dataset.id); const v = +el.value;
    el.parentElement.querySelector('.val').textContent = 'CI ' + v;
    const ac = E.FL.routeAc(G, r)[0];
    if (ac) { const old = r.plan.ci; r.plan.ci = v; UI.$('#ciTxt').textContent = `${U.n0(E.F.cruise(G, E.AC[ac.type], r, v))} km/h · bloque ${U.dur(E.F.blockTime(G, ac, r, true))}`; r.plan.ci = old; }
    if (type === 'change') { r.plan.ci = v; }
  };
  E.A.fuelPol = (d) => { const r = E.G.routes.find(x => x.id === UI.current().params.id); r.plan.fuel = d.v; UI.render(); };
  E.IN.tank = (el) => { const r = E.G.routes.find(x => x.id === el.dataset.id); r.plan.tank = el.checked; };
  E.IN.altAp = (el) => { const r = E.G.routes.find(x => x.id === el.dataset.id); r.plan.alt = el.value; };
  E.IN.cg = (el, type) => { const r = E.G.routes.find(x => x.id === el.dataset.id); UI.$('#cgTxt').textContent = U.n1(18 + +el.value * 16) + '% MAC'; if (type === 'change') r.plan.cg = +el.value; };
  E.A.cgOpt = (d) => { const r = E.G.routes.find(x => x.id === d.v); r.plan.cg = 0.7; UI.toast('Carga redistribuida: CG 29,2% MAC', 'good'); UI.render(); };

  /* ----- Mercado y competencia ----- */
  const rComp = (G, r) => {
    const d = r.dem || E.D.routeDemand(G, r);
    const m = E.D.market(G, r.a, r.b);
    const mktDay = (d.mkt.y + d.mkt.p + d.mkt.j + d.mkt.f) / 2;
    const my = ['y', 'p', 'j', 'f'].reduce((s, k) => s + d[k][0] + d[k][1], 0) / 2;
    let h = `<div class="grid2">${UI.stat('Mercado total', U.n0(mktDay) + ' pax/día', 'por sentido, todas las aerolíneas')}${UI.stat('Tu cuota', U.pct(mktDay ? my / mktDay : 0), U.n0(my) + ' pax/día')}</div>`;
    h += UI.sec('Competidores');
    h += m.comps.length ? `<div class="list">${m.comps.map(c => `<div class="item"><div class="grow"><div class="t">${U.esc(c.name)}</div><div class="s">${U.n0(c.cap / 2)} asientos/día por sentido</div></div><div class="r small"><div>Precio ${U.pct(c.priceUntil && c.priceUntil > G.t ? c.price : Math.max(c.price, 0.88))}</div><div class="muted">Calidad ${U.pct(c.q)}</div></div></div>`).join('')}</div>` : `<div class="note">Monopolio: nadie más vuela esta ruta. Ojo: si las ocupaciones son muy altas, atraerás competidores.</div>`;
    h += UI.sec('Demanda por clase');
    h += `<table class="tbl"><tr><th>Clase</th><th class="n">Mercado/día</th><th class="n">Tuyos/día</th><th class="n">Calidad</th></tr>${['y', 'p', 'j', 'f'].filter(k => d.mkt[k] > 0.5).map(k => `<tr><td>${CLS[k]}</td><td class="n">${U.n0(d.mkt[k] / 2)}</td><td class="n">${U.n0((d[k][0] + d[k][1]) / 2)}</td><td class="n">${d.cap[k] ? U.pct(d.q[k]) : '—'}</td></tr>`).join('')}</table>`;
    const months = U.MES.map((n, i) => ({ n, s: E.D.season(E.AP[r.a], E.AP[r.b], i) }));
    h += UI.sec('Estacionalidad');
    h += `<div class="card tight">${UI.bars(months.map(x => x.s - 1), { labels: months.map(x => x.n[0]), pos: 'var(--accent)', neg: 'var(--sky)', h: 90 })}<div class="tiny muted">Variación de la demanda respecto de la media anual.</div></div>`;
    return h;
  };
  const rHist = (G, r) => {
    const hs = r.stats.hist.slice(-26);
    if (hs.length < 2) return `<div class="empty"><span class="serif">Todavía sin historia</span>Las estadísticas semanales aparecen tras unas semanas de operación.</div>`;
    let h = UI.sec('Resultado semanal');
    h += `<div class="card tight">${UI.bars(hs.map(w => w.rev - w.cost))}</div>`;
    h += UI.sec('Ocupación y puntualidad');
    h += `<div class="card tight">${UI.lineChart([{ vals: hs.map(w => w.seats ? w.pax / w.seats : null), color: 'var(--accent)', fill: true }, { vals: hs.map(w => w.fl ? w.ontime / w.fl : null), color: 'var(--sky)' }], { fmt: v => U.pct(v) })}<div class="legend"><span><i style="background:var(--accent)"></i>Ocupación</span><span><i style="background:var(--sky)"></i>Puntualidad</span></div></div>`;
    const last = hs[hs.length - 1];
    h += `<div class="kv mt12"><span>Pasajeros (última semana)</span><span>${U.n0(last.pax)}</span><span>Vuelos</span><span>${last.fl}</span><span>Cancelaciones</span><span>${last.canc}</span><span>Desvíos</span><span>${last.div || 0}</span><span>Carga</span><span>${U.n1(last.cargo)} t</span></div>`;
    return h;
  };

  /* ---------- Nueva ruta ---------- */
  E.A.newRouteFrom = (d) => { const G = E.G; const from = G.bases[d.v] ? d.v : G.airline.home; UI.open('newroute', { from }); };
  E.A.newRouteTo = (d) => { const G = E.G; const from = Object.keys(G.bases).find(b => E.R.allowed(G, b, d.v).ok) || G.airline.home; UI.open('routeplan', { a: from, b: d.v }); };
  E.V.newroute = {
    title: 'Nueva ruta', sub: 'Elegí el destino (también podés tocarlo en el mapa)',
    render(p) {
      const G = E.G;
      const from = p.from || G.airline.home;
      const q = (p.q || '').toLowerCase();
      const reg = p.reg || 'all';
      const sort = p.sort || 'dem';
      const A = E.AP[from];
      const served = new Set(G.routes.filter(r => r.a === from || r.b === from).map(r => r.a === from ? r.b : r.a));
      let list = E.AIRPORTS.filter(b => b.iata !== from).map(b => ({ b, ok: E.R.allowed(G, from, b.iata), d: U.dist(A, b) }));
      list = list.filter(x => (reg === 'all' || x.b.region === reg) && (!q || (x.b.city + ' ' + x.b.iata + ' ' + x.b.country).toLowerCase().includes(q)));
      list.forEach(x => { x.est = x.ok.ok ? E.D.estimate(G, from, x.b.iata) : null; });
      const fleetRng = Math.max(0, ...G.fleet.map(a => E.AC[a.type].rng));
      const sorts = { dem: (a, b) => (b.est ? b.est.potential : -1) - (a.est ? a.est.potential : -1), dist: (a, b) => a.d - b.d, name: (a, b) => a.b.city.localeCompare(b.b.city) };
      list.sort(sorts[sort]);
      let h = `<div class="row wrap mb8"><span class="small muted">Desde</span>${UI.seg('nrFrom', Object.keys(G.bases).map(b => ({ v: b, l: b })), from)}</div>`;
      h += `<input class="input" placeholder="Buscar ciudad, país o código…" data-in="nrSearch" value="${U.esc(p.q || '')}">`;
      h += `<div class="mt8">${UI.tabs('nrReg', [{ v: 'all', l: 'Todo' }].concat(Object.entries(E.REGIONS).map(([v, l]) => ({ v, l }))), reg)}</div>`;
      h += `<div class="row sp mb8"><span class="tiny muted">${list.length} aeropuertos</span>${UI.seg('nrSort', [{ v: 'dem', l: 'Demanda' }, { v: 'dist', l: 'Distancia' }, { v: 'name', l: 'Nombre' }], sort)}</div>`;
      h += `<div class="list">${list.slice(0, 60).map(x => `<button class="item" data-a="pickDest" data-v="${x.b.iata}" ${x.ok.ok ? '' : 'style="opacity:.5"'}><div class="grow"><div class="row"><span class="t mono">${x.b.iata}</span><span class="t" style="font-weight:500">${x.b.city}</span>${served.has(x.b.iata) ? UI.chip('ya operás', 'good') : ''}</div><div class="s">${x.b.country} · ${U.km(x.d)}${x.d > fleetRng && G.fleet.length ? ' · <span class="warn">fuera del alcance de tu flota</span>' : ''}</div>${x.ok.ok ? '' : `<div class="s warn">${x.ok.why}</div>`}</div>${x.est ? `<div class="r"><div class="mono" style="font-weight:700">${U.n0(x.est.potential)}</div><div class="tiny muted">pax/día pot.</div></div>` : ''}</button>`).join('')}</div>`;
      return h;
    }
  };
  E.A.nrFrom = (d) => { const c = UI.current(); c.params = Object.assign({}, c.params, { from: d.v }); UI.render(); };
  E.A.nrReg = (d) => { const c = UI.current(); c.params = Object.assign({}, c.params, { reg: d.v }); UI.render(true); };
  E.A.nrSort = (d) => { const c = UI.current(); c.params = Object.assign({}, c.params, { sort: d.v }); UI.render(true); };
  E.IN.nrSearch = U.debounce((el) => { const c = UI.current(); if (!c || c.view !== 'newroute') return; c.params = Object.assign({}, c.params, { q: el.value }); UI.render(); const inp = UI.$('.sheet-body input.input'); if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } }, 250);
  E.A.pickDest = (d) => { const c = UI.current(); const from = c && c.params.from ? c.params.from : E.G.airline.home; UI.open('routeplan', { a: from, b: d.v }); };

  E.V.routeplan = {
    title: (p) => `${p.a} → ${p.b}`, sub: (p) => `${E.AP[p.a].city} – ${E.AP[p.b].city}`,
    render(p) {
      const G = E.G;
      const A = E.AP[p.a], B = E.AP[p.b];
      E.MAP.preview = { a: p.a, b: p.b };
      const ok = E.R.allowed(G, p.a, p.b);
      const est = E.D.estimate(G, p.a, p.b);
      const info = E.GEO.analyze(A, B);
      const exist = G.routes.find(r => r.key === E.D.mkey(p.a, p.b));
      let h = `<div class="grid2">${UI.stat('Distancia', U.km(est.d))}${UI.stat('Demanda total', U.n0(est.base) + '/día', 'por sentido, todas las aerolíneas')}${UI.stat('Potencial para vos', U.n0(est.potential) + '/día', est.comps.length ? est.comps.length + ' competidores' : 'sin competencia')}${UI.stat('Tarifa ref. turista', U.money(est.ref.y), 'ejecutiva ' + U.money(est.ref.j))}</div>`;
      const sp = est.sp;
      h += `<div class="card mt12"><div class="small muted">Mezcla de pasajeros</div><div class="cabin-map mt8"><i style="width:${sp.f * 100}%;background:#d4af37"></i><i style="width:${sp.j * 100}%;background:#7cc4ff"></i><i style="width:${sp.p * 100}%;background:#c792ea"></i><i style="width:${sp.y * 100}%;background:var(--brand)"></i></div><div class="legend mt8"><span><i style="background:var(--brand)"></i>Turista ${U.pct(sp.y)}</span><span><i style="background:#7cc4ff"></i>Ejecutiva ${U.pct(sp.j)}</span>${sp.f > 0.002 ? `<span><i style="background:#d4af37"></i>Primera ${U.pct(sp.f, 1)}</span>` : ''}${sp.p ? `<span><i style="background:#c792ea"></i>Premium ${U.pct(sp.p)}</span>` : ''}</div></div>`;
      const risks = [];
      if (B.fog > 0.2) risks.push('niebla frecuente en ' + B.iata);
      if (B.wind > 0.3) risks.push('viento cruzado en ' + B.iata);
      if (B.e > 1500) risks.push('aeropuerto de altura (' + U.n0(B.e) + ' m)');
      if (B.slot >= 2) risks.push('aeropuerto saturado: necesitás slots');
      if (E.F.etopsNeed(info)) risks.push('bimotores necesitan ' + E.F.etopsNeed(info));
      if (risks.length) h += `<div class="note warn mt8">${risks.join(' · ')}</div>`;
      // flota apta
      h += UI.sec('Tu flota para esta ruta');
      const types = [...new Set(G.fleet.map(a => a.type))];
      if (!types.length) h += `<div class="note">Todavía no tenés aviones. Podés crear la ruta y asignar uno cuando llegue.</div>`;
      h += `<div class="list">${types.map(ty => { const ac = G.fleet.find(a => a.type === ty); const c = E.F.canFly(G, ac, p.a, p.b); const n = G.fleet.filter(a => a.type === ty && !a.route && a.status === 'active').length; return `<div class="item"><div class="grow"><div class="t">${E.AC[ty].short}</div><div class="s">${n} libre(s) · ${E.F.seats(ac).total} asientos</div>${c.ok ? '' : `<div class="s warn">${c.why[0]}</div>`}</div>${c.ok ? UI.chip('Apto', 'good') : UI.chip('No apto', 'bad')}</div>`; }).join('')}</div>`;
      if (!ok.ok) h += `<div class="note bad mt12">${ok.why}</div>`;
      h += `<div class="btns mt16">${exist ? `<button class="btn primary" data-a="openRoute" data-v="${exist.id}">Ver ruta existente</button>` : `<button class="btn primary" data-a="createRoute" data-a2="${p.a}" data-b="${p.b}" ${ok.ok ? '' : 'disabled'}>${UI.icon('plus')}Crear ruta</button>`}<button class="btn ghost" data-a="openAirport" data-v="${p.b}">Ver ${p.b}</button></div>`;
      return h;
    },
    mount(el, p) { if (!p._fit) { p._fit = 1; E.MAP.fit([E.AP[p.a], E.AP[p.b]]); } }
  };
  E.A.createRoute = (d) => {
    const G = E.G;
    const r = E.R.create(G, d.a2, d.b);
    if (!r) return UI.toast('No se pudo crear la ruta', 'bad');
    E.D.routeDemand(G, r);
    E.MAP.preview = null;
    UI.stack = UI.stack.filter(s => s.view !== 'newroute' && s.view !== 'routeplan');
    UI.open('route', { id: r.id });
    UI.toast('Ruta creada: ' + r.a + '–' + r.b, 'good', 'route');
    if (G.fleet.some(a => !a.route && a.status === 'active')) setTimeout(() => E.MOD.assignRoute(r.id), 250);
  };

  /* ---------- Aeropuerto ---------- */
  E.V.airport = {
    title: (p) => E.AP[p.iata].city, sub: (p) => { const a = E.AP[p.iata]; return `${a.iata} · ${a.country} · ${E.REGIONS[a.region]}`; }, live: true,
    render(p) {
      const G = E.G, a = E.AP[p.iata];
      const base = G.bases[a.iata];
      const w = E.W.at(G, a.iata);
      const rs = G.routes.filter(r => r.a === a.iata || r.b === a.iata);
      let h = `<div class="grid2">${UI.stat('Clima ahora', UI.wx(w), w.k === 'clear' ? '' : 'severidad ' + U.pct(w.sev))}${UI.stat('Hora local', U.fmtTime(G.t + a.lon / 15), 'aprox.')}${UI.stat('Pista', U.n0(a.rwy) + ' m', a.e > 500 ? 'elevación ' + U.n0(a.e) + ' m' : '')}${UI.stat('Población', U.n1(a.pop) + ' M', `negocios ${U.pct(a.biz)} · turismo ${U.pct(a.tour)}`)}</div>`;
      if (base) {
        h += UI.sec('Tu base');
        h += E.boardHTML(G, a.iata);
        const res = G.research.done;
        h += `<div class="list mt8">
          <div class="item"><div class="grow"><div class="t">Sala VIP</div><div class="s">Mejora la experiencia de ejecutiva y primera en salidas desde ${a.iata}.</div></div>${base.lounge ? UI.chip('Operativa', 'good') : res.lounge ? `<button class="btn sm" data-a="buildLounge" data-v="${a.iata}">${U.money(E.EC.loungeCost(G, a.iata))}</button>` : `<span class="tiny muted">Investigá Salas VIP</span>`}</div>
          <div class="item"><div class="grow"><div class="t">Hangar de mantenimiento</div><div class="s">−25% en costos de mantenimiento de aviones basados aquí.</div></div>${base.hangar ? UI.chip('Operativo', 'good') : res.hangar ? `<button class="btn sm" data-a="buildHangar" data-v="${a.iata}">${U.money(E.EC.hangarCost(G, a.iata))}</button>` : `<span class="tiny muted">Investigá Hangares</span>`}</div></div>`;
      } else {
        const c = E.R.canOpenBase(G, a.iata);
        h += `<div class="card mt12"><div class="row sp"><div><b>Abrir una base</b><div class="small muted">Te permite crear rutas desde ${a.iata}. Costo ${U.money(E.EC.baseCost(G, a.iata))} + ${U.money(E.EC.baseCost(G, a.iata) * 0.012)}/mes.</div></div><button class="btn sm primary" data-a="openBase" data-v="${a.iata}" ${c.ok ? '' : 'disabled'}>Abrir base</button></div>${c.ok ? '' : `<div class="tiny warn mt8">${c.why}</div>`}</div>`;
      }
      if (a.slot >= 2) {
        const use = E.R.slotUse(G, a.iata), held = G.slots[a.iata] || 0;
        h += UI.sec('Slots');
        h += `<div class="card"><div class="row sp"><div><div class="small muted">Aeropuerto ${a.slot === 3 ? 'saturado' : 'congestionado'}: cada frecuencia semanal necesita un slot.</div><div class="mono mt4" style="font-size:18px;font-weight:800">${use} / ${held} <span class="small muted">usados / propios</span></div></div><button class="btn sm primary" data-a="slotNeg" data-v="${a.iata}">Negociar</button></div>${held ? UI.bar(use / held, use / held < 0.8 ? 'warn' : 'good', true) : ''}${held && use / held < 0.8 ? '<div class="tiny warn mt4">Regla "úsalo o perdelo": por debajo del 80% podés perder slots al cambiar la temporada.</div>' : ''}</div>`;
      } else if (a.slot === 1) h += `<div class="note mt12">Aeropuerto coordinado: los slots se asignan sin costo.</div>`;
      if (rs.length) { h += UI.sec('Tus rutas'); h += `<div class="list">${rs.map(r => `<button class="item" data-a="openRoute" data-v="${r.id}"><span class="t mono">${r.a} ⇄ ${r.b}</span><span class="s grow r">${E.FL.routeFreq(G, r)}×/sem</span></button>`).join('')}</div>`; }
      // mejores destinos
      const from = base ? a.iata : Object.keys(G.bases).find(b => E.R.allowed(G, b, a.iata).ok);
      if (base) {
        const best = E.AIRPORTS.filter(b => b.iata !== a.iata && !rs.some(r => r.a === b.iata || r.b === b.iata) && E.R.allowed(G, a.iata, b.iata).ok).map(b => ({ b, e: E.D.estimate(G, a.iata, b.iata) })).sort((x, y) => y.e.potential - x.e.potential).slice(0, 6);
        h += UI.sec('Oportunidades desde aquí');
        h += `<div class="list">${best.map(x => `<button class="item" data-a="openPlan" data-a2="${a.iata}" data-b="${x.b.iata}"><div class="grow"><div class="t"><span class="mono">${x.b.iata}</span> ${x.b.city}</div><div class="s">${U.km(x.e.d)} · ${x.e.comps.length} competidores</div></div><div class="r mono">${U.n0(x.e.potential)}<div class="tiny muted">pax/día</div></div></button>`).join('')}</div>`;
      } else if (from) h += `<button class="btn primary mt12" data-a="openPlan" data-a2="${from}" data-b="${a.iata}">${UI.icon('route')}Planificar ruta ${from} → ${a.iata}</button>`;
      return h;
    },
    mount(el, p) { if (!p._fit) { p._fit = 1; E.MAP.focusAirport(p.iata, Math.max(E.MAP.cam.z, 8)); } }
  };
  E.A.openPlan = (d) => UI.open('routeplan', { a: d.a2, b: d.b });
  E.A.openBase = async (d) => { const G = E.G; if (!await UI.confirm('¿Abrir base en ' + E.AP[d.v].city + '?', `Inversión ${U.money(E.EC.baseCost(G, d.v))}.`, 'Abrir base')) return; const r = E.R.openBase(G, d.v); if (!r.ok) return UI.toast(r.why, 'bad'); UI.toast('Nueva base en ' + d.v, 'good', 'building'); UI.render(); };
  E.A.buildLounge = (d) => { const G = E.G; const c = E.EC.loungeCost(G, d.v); if (G.cash < c) return UI.toast('Caja insuficiente', 'bad'); E.X.cash(G, -c, 'infra'); G.bases[d.v].lounge = 1; UI.toast('Sala VIP inaugurada', 'good'); UI.render(); };
  E.A.buildHangar = (d) => { const G = E.G; const c = E.EC.hangarCost(G, d.v); if (G.cash < c) return UI.toast('Caja insuficiente', 'bad'); E.X.cash(G, -c, 'infra'); G.bases[d.v].hangar = 1; UI.toast('Hangar construido', 'good'); UI.render(); };
  E.A.slotNeg = (d) => E.MOD.slots(d.v);

  /* ---------- Bases ---------- */
  E.V.bases = {
    title: 'Aeropuertos', sub: 'Bases, instalaciones y slots',
    render() {
      const G = E.G;
      let h = `<div class="list">${Object.entries(G.bases).map(([i, b]) => { const a = E.AP[i]; const n = G.routes.filter(r => r.a === i || r.b === i).length; return `<button class="item" data-a="openAirport" data-v="${i}"><div class="grow"><div class="row"><span class="t mono">${i}</span><span class="t" style="font-weight:500">${a.city}</span>${i === G.airline.home ? UI.chip('principal', 'brand') : ''}${b.abroad ? UI.chip('filial') : ''}</div><div class="s">${n} rutas · ${b.lounge ? 'Sala VIP · ' : ''}${b.hangar ? 'Hangar · ' : ''}desde ${U.year(b.since)}</div></div><span class="chev">${UI.icon('chev')}</span></button>`; }).join('')}</div>`;
      const slots = Object.entries(G.slots).filter(([i, n]) => n > 0);
      if (slots.length) { h += UI.sec('Slots en aeropuertos saturados'); h += `<table class="tbl"><tr><th>Aeropuerto</th><th class="n">Propios</th><th class="n">Usados</th></tr>${slots.map(([i, n]) => `<tr><td>${i} · ${E.AP[i].city}</td><td class="n">${n}</td><td class="n">${E.R.slotUse(G, i)}</td></tr>`).join('')}</table>`; }
      h += UI.sec('Abrir una nueva base');
      const home = E.AP[G.airline.home];
      const cands = E.AIRPORTS.filter(a => !G.bases[a.iata]).map(a => ({ a, c: E.R.canOpenBase(G, a.iata) })).filter(x => x.c.ok || x.a.cc === home.cc).sort((x, y) => y.a.size - x.a.size || y.a.pop - x.a.pop).slice(0, 14);
      h += `<div class="list">${cands.map(({ a, c }) => `<button class="item" data-a="openAirport" data-v="${a.iata}" ${c.ok ? '' : 'style="opacity:.55"'}><div class="grow"><div class="t"><span class="mono">${a.iata}</span> ${a.city}</div><div class="s">${a.country} · ${U.money(E.EC.baseCost(G, a.iata))}</div></div><span class="chev">${UI.icon('chev')}</span></button>`).join('')}</div>`;
      if (!G.research.done.subsid) h += `<div class="note mt8">Para abrir bases fuera de ${home.country} investigá "Filiales en el extranjero"${home.region === 'EU' ? ' (en la UE es libre desde 1997)' : ''}.</div>`;
      return h;
    }
  };
})();
