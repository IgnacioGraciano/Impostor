/* ESTELA · vistas principales: resumen, bandeja, menú, ajustes y logros */
'use strict';
(() => {
  const U = E.U, UI = E.UI;

  /* ---------- alertas accionables ---------- */
  E.alerts = (G) => {
    const out = [];
    const idle = G.fleet.filter(a => !a.route && a.status === 'active');
    if (idle.length) out.push({ k: 'warn', i: 'plane', t: `${idle.length} avión(es) sin ruta`, s: 'Un avión parado solo genera costos.', a: 'open', v: 'fleet', p: JSON.stringify({ filter: 'idle' }) });
    if (G.cash < 0) out.push({ k: 'bad', i: 'dollar', t: 'Caja negativa', s: `Quedan ${60 - (G.fin.neg || 0)} días antes de la quiebra.`, a: 'root', v: 'finance' });
    E.STAFF_KEYS.forEach(k => { const r = E.ST.ratio(G, k); if (r < 0.95 && !(k === 'ground' && G.staff.ground.out) && (G.req || {})[k] > 0) out.push({ k: r < 0.85 ? 'bad' : 'warn', i: 'users', t: `Faltan ${E.STAFF_CATS[k].n.toLowerCase()} (${U.pct(r)})`, s: 'Habrá cancelaciones y fatiga.', a: 'root', v: 'staff' }); });
    E.STAFF_KEYS.forEach(k => { if (G.staff[k].morale < 38 && G.staff[k].n > 5) out.push({ k: 'warn', i: 'alert', t: `Moral baja: ${E.STAFF_CATS[k].n.toLowerCase()} (${Math.round(G.staff[k].morale)}%)`, s: 'Riesgo de huelga.', a: 'root', v: 'staff' }); });
    const od = G.fleet.filter(a => a.status !== 'delivery' && E.F.overdue(G, a));
    if (od.length) out.push({ k: 'bad', i: 'wrench', t: `${od.length} avión(es) con mantenimiento vencido`, s: 'El regulador puede dejarlos en tierra.', a: 'open', v: 'fleet', p: JSON.stringify({ filter: 'maint' }) });
    const worn = G.fleet.filter(a => a.status !== 'delivery' && a.cond < 50);
    if (worn.length) out.push({ k: 'warn', i: 'wrench', t: `${worn.length} avión(es) en mal estado (<50%)`, s: 'Más averías, consumo y riesgo.', a: 'open', v: 'fleet', p: JSON.stringify({ filter: 'maint' }) });
    if (!G.research.cur && G.fleet.length > 1) out.push({ k: '', i: 'flask', t: 'Investigación detenida', s: 'Elegí un nuevo proyecto de I+D.', a: 'root', v: 'research' });
    const infl = G.econ.infl > 0 && E.STAFF_KEYS.some(k => G.econ.cpi / G.staff[k].cpiPaid > 1.1);
    if (infl) out.push({ k: 'warn', i: 'dollar', t: 'Salarios atrasados por la inflación', s: 'Indexalos para evitar huelgas.', a: 'root', v: 'staff' });
    if (G.econ.infl > 0 && !G.settings.indexPrices && G.routes.length) {
      const lag = U.sum(G.routes, r => r.dem ? r.price.y / Math.max(1, r.dem.ref.y) : 1) / G.routes.length;
      if (lag < 0.85 && !E.X.modMult(G, 'pricefreeze', {}, true)) out.push({ k: 'bad', i: 'tag', t: `Tus tarifas quedaron al ${U.pct(lag)} de la referencia`, s: 'La inflación las licuó. Tocá para indexarlas ya.', a: 'indexPricesNow' });
    }
    G.routes.forEach(r => { if (E.FL.routeFreq(G, r) === 0 && G.t - r.since > 24 * 3) out.push({ k: '', i: 'route', t: `Ruta ${r.a}–${r.b} sin aviones`, s: 'Asigná un avión o eliminala.', a: 'openRoute', v: r.id }); });
    if (G.ev.queue.length) out.unshift({ k: 'acc', i: 'bell', t: 'Hay decisiones pendientes', s: 'Resolvé los eventos en espera.', a: 'showEvent' });
    return out.slice(0, 8);
  };

  /* ---------- tablero de salidas ---------- */
  E.board = (G, iata, n = 7) => {
    const rows = [];
    G.fleet.forEach(ac => {
      if (!ac.route || ac.status !== 'active' || ac.fl || ac.loc !== iata) return;
      const r = G.routes.find(x => x.id === ac.route); if (!r) return;
      const dest = ac.out ? r.b : r.a;
      const sched = ac.out ? ac.slotOut : (ac.schedNext || ac.next);
      const late = ac.next - sched > 0.25;
      const st = late ? 'DEMORADO' : ac.next - G.t < 0.6 ? 'EMBARCANDO' : 'A TIEMPO';
      rows.push({ t: sched, fn: E.FL.flightNo(G, r, ac.out, ac), to: E.AP[dest].city, st, cls: late ? 'st-late' : st === 'EMBARCANDO' ? 'st-board' : 'st-ok', nt: late ? U.fmtTime(ac.next) : '' });
    });
    G.fleet.forEach(ac => { if ((ac.status === 'maint' || ac.status === 'grounded') && ac.loc === iata && ac.route) { const r = G.routes.find(x => x.id === ac.route); if (r) rows.push({ t: ac.until, fn: E.FL.flightNo(G, r, ac.out, ac), to: E.AP[ac.out ? r.b : r.a].city, st: ac.status === 'maint' ? 'MANTENIM.' : 'CANCELADO', cls: 'st-canc' }); } });
    G.flights.forEach(f => { if (f.o === iata && G.t - f.dep < 0.4 && !f.ferry) rows.push({ t: f.sd, fn: f.fn, to: E.AP[f.d].city, st: 'DESPEGÓ', cls: 'st-ok', past: true }); });
    rows.sort((a, b) => a.t - b.t);
    return rows.slice(0, n);
  };
  E.boardHTML = (G, iata) => {
    const rows = E.board(G, iata);
    const ap = E.AP[iata];
    return `<div class="board"><div class="board-h"><span><b>Salidas</b> · ${U.esc(ap.city)}</span><span>${U.fmtTime(G.t)}</span></div>
      <div class="brow head"><span>HORA</span><span>VUELO</span><span>DESTINO</span><span>ESTADO</span></div>
      ${rows.length ? rows.map((r, i) => `<div class="brow"><span>${UI.flap('bt' + iata + i, U.fmtTime(r.t), 5)}</span><span>${UI.flap('bf' + iata + i, r.fn, 6)}</span><span class="ellipsis">${UI.flap('bd' + iata + i, r.to, 13)}</span><span class="${r.cls}">${UI.flap('bs' + iata + i, r.nt ? r.nt : r.st, 10)}</span></div>`).join('') : `<div class="brow"><span class="dim">—</span><span class="dim">Sin salidas programadas</span></div>`}
    </div>`;
  };

  /* ---------- Resumen ---------- */
  E.V.home = {
    title: () => 'Resumen', live: true, sub: () => { const G = E.G; return `${E.MODELS[G.airline.model].n} · fundada en ${U.year(G.airline.founded)} · ${E.SCN[G.scn] ? E.SCN[G.scn].n : ''}`; },
    render() {
      const G = E.G;
      const L = G.fin.cur, last = G.fin.hist[G.fin.hist.length - 1];
      const prof = E.EC.profitOf(L);
      const day = U.date(G.t).getUTCDate();
      const lf = L.seats ? L.pax / L.seats : (last && last.seats ? last.pax / last.seats : 0);
      const otp = G.rep.otp;
      const fuelH = G.econ.fuelHist || [];
      const fuelTrend = fuelH.length > 4 ? G.econ.fuel * G.econ.cpi / fuelH[fuelH.length - 5] - 1 : 0;
      let h = '';
      // tutorial
      h += E.tutorialCard(G);
      // alertas
      const al = E.alerts(G);
      if (al.length) {
        h += UI.sec('Atención');
        h += `<div class="list">${al.map(a => `<button class="item" data-a="${a.a}" data-v="${a.v || ''}" ${a.p ? `data-p='${a.p}'` : ''}><span class="${a.k}">${UI.icon(a.i)}</span><div class="grow"><div class="t">${a.t}</div><div class="s">${a.s}</div></div><span class="chev">${UI.icon('chev')}</span></button>`).join('')}</div>`;
      }
      // KPIs
      h += UI.sec('Este mes', `<span class="tiny muted">día ${day}</span>`);
      h += `<div class="grid2">
        ${UI.stat('Caja', `<span class="${G.cash < 0 ? 'bad' : ''}">${U.money(G.cash)}</span>`, `Calificación ${G.fin.rating}`)}
        ${UI.stat('Resultado', `<span class="${prof >= 0 ? 'good' : 'bad'}">${U.signed(prof)}</span>`, last ? `Mes anterior ${U.signed(E.EC.profitOf(last))}` : 'Primer mes')}
        ${UI.stat('Pasajeros', U.n0(L.pax), `${U.n0(L.fl)} vuelos`)}
        ${UI.stat('Ocupación', U.pct(lf), UI.bar(lf, lf > 0.8 ? 'good' : lf > 0.6 ? '' : 'bad', true))}
        ${UI.stat('Puntualidad', U.pct(otp), otp < 0.8 ? '<span class="warn">Los ejecutivos lo notan</span>' : 'Llegadas a ±15 min')}
        ${UI.stat('Reputación', `${Math.round(G.rep.overall)}`, UI.stars(G.rep.overall))}
        ${UI.stat('Jet fuel', `${U.n2(G.econ.fuel * G.econ.cpi)} $/kg`, `<span class="${fuelTrend > 0.02 ? 'bad' : fuelTrend < -0.02 ? 'good' : ''}">${fuelTrend >= 0 ? '▲' : '▼'} ${U.pct(Math.abs(fuelTrend), 1)} en 4 semanas</span>`)}
        ${UI.stat('Patrimonio', U.money(E.EC.equity(G)), G.fin.stock.listed ? `Acción ${U.n2(G.fin.stock.price)} $` : 'Empresa privada')}
      </div>`;
      // tablero
      h += UI.sec('Operaciones');
      const bases = Object.keys(G.bases);
      const main = E.X.mainBase(G);
      h += E.boardHTML(G, main);
      if (bases.length > 1) h += `<div class="btns mt8">${bases.filter(b => b !== main).slice(0, 4).map(b => `<button class="btn sm" data-a="openAirport" data-v="${b}">${b}</button>`).join('')}</div>`;
      // gráfico
      const hist = G.fin.hist.slice(-18);
      if (hist.length >= 2) {
        h += UI.sec('Ingresos y costos', `<span class="legend"><span><i style="background:var(--good)"></i>Ingresos</span><span><i style="background:var(--bad)"></i>Costos</span></span>`);
        h += `<div class="card tight">${UI.lineChart([{ vals: hist.map(m => E.EC.total(m.rev)), color: 'var(--good)', fill: true }, { vals: hist.map(m => E.EC.total(m.cost)), color: 'var(--bad)' }], { labels: hist.map((m, i) => i % 3 === 0 ? U.MES[U.month(m.t)] : '') })}</div>`;
      }
      // objetivos
      const scn = E.SCN[G.scn];
      if (scn && scn.goals.length) {
        h += UI.sec('Objetivos del escenario', scn.deadline ? `<span class="tiny muted">hasta ${scn.deadline}</span>` : '');
        h += `<div class="card">${scn.goals.map(g => { let p = 0; try { p = U.clamp(g.f(G), 0, 1); } catch (e) { } return `<div class="mt8"><div class="row sp small"><span>${g.t}</span><span class="mono ${p >= 1 ? 'good' : ''}">${p >= 1 ? '✓' : U.pct(p)}</span></div>${UI.bar(p, p >= 1 ? 'good' : '', true)}</div>`; }).join('')}${G.won ? `<div class="note mt12">${UI.icon('trophy')} ¡Escenario completado el ${U.fmtDate(G.won.t)}!</div>` : ''}</div>`;
      }
      // clima en bases
      h += UI.sec('Clima en tus bases');
      h += `<div class="scroll-x">${bases.map(b => { const w = E.W.at(G, b); return `<button class="item" style="width:auto;flex:none" data-a="openAirport" data-v="${b}"><div><div class="mono" style="font-weight:800">${b}</div><div class="s">${UI.wx(w)}</div></div></button>`; }).join('')}</div>`;
      // últimas noticias
      if (G.news.length) {
        h += UI.sec('Noticias');
        h += `<div class="card tight">${G.news.slice(0, 4).map(n => `<div class="row top mt8 small"><span class="mono tiny muted nowrap">${U.fmtDate(n.t)}</span><span>${U.esc(n.text)}</span></div>`).join('')}</div>`;
      }
      return h;
    }
  };
  E.A.showEvent = () => E.MOD.nextEvent(true);
  E.A.indexPricesNow = () => { const G = E.G; G.routes.forEach(r => { const d = r.dem || E.D.routeDemand(G, r); ['y', 'p', 'j', 'f'].forEach(k => { if (r.price[k] < d.ref[k]) r.price[k] = Math.round(d.ref[k] * (r.price[k] / Math.max(1, d.ref[k]) < 0.85 ? 1 : r.price[k] / d.ref[k])); }); E.D.routeDemand(G, r); }); G.econ.cpiPrices = G.econ.cpi; UI.toast('Tarifas actualizadas a la referencia', 'good', 'tag'); UI.render(); };

  /* ---------- tutorial ---------- */
  E.tutorialCard = (G) => {
    if (G.tut.done) return '';
    const steps = [
      { t: 'Conocé tu flota', d: G.fleet.length > 0 || G.orders.length > 0, s: 'Comprá o alquilá un avión en Flota → Comprar.', a: 'open', v: G.fleet.length ? 'fleet' : 'buy' },
      { t: 'Abrí tu primera ruta', d: G.routes.length > 0, s: 'Rutas → Nueva ruta, o tocá un aeropuerto en el mapa.', a: 'newRouteFrom', v: G.airline.home },
      { t: 'Asigná un avión a la ruta', d: G.fleet.some(a => a.route), s: 'Elegí frecuencias según la demanda.', a: 'root', v: 'routes' },
      { t: 'Revisá precios y servicio', d: !!G.flags.sawService, s: 'Tarifas por clase, comidas y equipaje definen tu marca.', a: 'root', v: 'service' },
      { t: 'Acelerá el tiempo', d: G.stats.flights > 20, s: 'Usá los controles de velocidad arriba a la derecha.', a: 'speed', v: 2 }
    ];
    const done = steps.filter(s => s.d).length;
    if (done === steps.length) { G.tut.done = true; return ''; }
    return `<div class="card hl"><div class="row sp"><div><div class="up tiny acc" style="font-weight:800">Primeros pasos</div><div class="serif" style="font-size:22px">Despegue de ${U.esc(G.airline.name)}</div></div><div class="dots">${steps.map(s => `<i class="${s.d ? 'on' : ''}"></i>`).join('')}</div></div>
      <div class="small muted mt4">${done} de ${steps.length} completados</div>
      <div class="list mt12">${steps.filter(s => !s.d).slice(0, 2).map(s => `<button class="item" data-a="${s.a}" data-v="${s.v}"><span class="acc">${UI.icon('chev')}</span><div class="grow"><div class="t">${s.t}</div><div class="s">${s.s}</div></div></button>`).join('')}</div>
      <div class="r mt8"><button class="btn sm ghost" data-a="tutSkip">Ocultar guía</button></div></div>`;
  };
  E.A.tutSkip = () => { E.G.tut.done = true; UI.render(); };

  /* ---------- Bandeja ---------- */
  E.V.inbox = {
    title: 'Bandeja', live: true,
    sub: () => `${E.G.inbox.filter(m => !m.read).length} sin leer`,
    render(p) {
      const G = E.G;
      const f = p.f || 'all';
      const K = { info: ['info', ''], good: ['check', 'good'], warn: ['alert', 'warn'], bad: ['alert', 'bad'], event: ['bell', 'acc'] };
      let list = G.inbox;
      if (f === 'alert') list = list.filter(m => m.kind === 'warn' || m.kind === 'bad');
      if (f === 'event') list = list.filter(m => m.kind === 'event');
      const pend = G.ev.queue.length;
      let h = UI.tabs('inboxTab', [{ v: 'all', l: 'Todo' }, { v: 'alert', l: 'Alertas' }, { v: 'event', l: 'Decisiones' }, { v: 'news', l: 'Noticias' }], f);
      if (pend) h += `<button class="btn primary block mb8" data-a="showEvent">${UI.icon('bell')}Resolver ${pend} decisión(es) pendiente(s)</button>`;
      if (f === 'news') {
        h += G.news.length ? `<div class="list">${G.news.map(n => `<div class="item"><div class="grow"><div class="s mono">${U.fmtDate(n.t)}</div><div class="t" style="font-weight:500">${U.esc(n.text)}</div></div></div>`).join('')}</div>` : `<div class="empty"><span class="serif">Sin noticias</span>El mundo está tranquilo… por ahora.</div>`;
        return h;
      }
      h += `<div class="row sp mb8"><span class="tiny muted">${list.length} mensajes</span><button class="btn sm ghost" data-a="inboxRead">Marcar todo leído</button></div>`;
      h += list.length ? `<div class="list">${list.slice(0, 80).map(m => { const k = K[m.kind] || K.info; return `<div class="item" style="${m.read ? 'opacity:.72' : ''}"><span class="${k[1]}">${UI.icon(k[0])}</span><div class="grow"><div class="row sp"><div class="t">${U.esc(m.title)}</div><span class="tiny muted mono nowrap">${U.fmtDate(m.t)}</span></div><div class="s">${U.esc(m.text)}</div></div></div>`; }).join('')}</div>` : `<div class="empty"><span class="serif">Todo en orden</span>No hay mensajes.</div>`;
      return h;
    },
    mount() { setTimeout(() => { E.G.inbox.forEach(m => m.read = true); }, 1500); }
  };
  E.A.inboxTab = (d) => { UI.current().params = { f: d.v }; UI.render(true); };
  E.A.inboxRead = () => { E.G.inbox.forEach(m => m.read = true); UI.render(); };

  /* ---------- Más ---------- */
  E.V.more = {
    title: 'Más', render() {
      const G = E.G;
      const items = [
        ['bases', 'building', 'Aeropuertos y bases', `${Object.keys(G.bases).length} bases · slots y salas VIP`],
        ['staff', 'users', 'Personal', 'Contratación, moral, fatiga y sindicatos'],
        ['service', 'cup', 'Servicio y tarifas', 'Catering, entretenimiento, equipaje y modelo de negocio'],
        ['research', 'flask', 'Investigación', G.research.cur ? 'En curso: ' + E.RES[G.research.cur.id].n : 'Sin proyecto activo'],
        ['marketing', 'mega', 'Marketing y alianzas', 'Campañas, notoriedad y alianzas globales'],
        ['used', 'tag', 'Mercado de segunda mano', `${G.used.length} aviones en venta`],
        ['inbox', 'inbox', 'Bandeja', `${G.inbox.filter(m => !m.read).length} sin leer`],
        ['goals', 'trophy', 'Objetivos y logros', `${Object.keys(G.stats.ach).length}/${E.ACH.length} logros`],
        ['help', 'info', 'Guía del juego', 'Cómo funciona la demanda, las frecuencias, el clima y más'],
        ['settings', 'gear', 'Ajustes y partidas', 'Guardar, tema, nivel de simulación']
      ];
      return `<div class="list">${items.map(([v, i, t, s]) => `<button class="item" data-a="open" data-v="${v}">${UI.icon(i)}<div class="grow"><div class="t">${t}</div><div class="s">${s}</div></div><span class="chev">${UI.icon('chev')}</span></button>`).join('')}</div>`;
    }
  };

  /* ---------- Guía ---------- */
  const HELP = [
    ['Primeros pasos', 'Conseguí aviones en <b>Flota → Comprar o alquilar</b> (o en el mercado de usados), creá una ruta desde una de tus bases y asigná el avión con una frecuencia semanal. Después acelerá el tiempo con los controles de arriba. El mapa muestra cada vuelo en tiempo real: tocá un avión o un aeropuerto para ver detalles.'],
    ['Demanda y competencia', 'Cada par de ciudades tiene una demanda diaria según población, negocios, turismo, distancia, época y estación. Te la repartís con competidores según precio, calidad, reputación, notoriedad de marca y capacidad ofrecida. Si llenás siempre los aviones con precios altos, aparecerán rivales.'],
    ['Frecuencias y puntualidad', 'Más frecuencias = más pasajeros captados, pero menos ocupación y menos colchón entre rotaciones: una demora se propaga al resto del día. Con puntualidad menor al 80%, los pasajeros de ejecutiva (los más rentables) se van a la competencia.'],
    ['Tarifas', 'La tarifa de referencia es el precio medio del mercado. Turistas son muy sensibles al precio; ejecutivos mucho menos. Con ocupación del 100% probablemente estés cobrando poco. El yield management habilita precios automáticos; las tarifas estacionales siguen la temporada.'],
    ['Cabina y servicio', 'Cada avión tiene un espacio fijo: elegís cuántos asientos de cada clase y qué producto (de butaca reclinable a suite). El catering, el entretenimiento y el Wi-Fi suman calidad, sobre todo en vuelos largos. Las expectativas cambian con la época: una cama plana en 2020 es lo normal.'],
    ['Modelo de negocio', 'Low-cost: densidad alta, extras pagos y precios bajos que estimulan la demanda turística, pero los ejecutivos te evitan. Tradicional: servicio incluido, ejecutiva y conexiones. Podés mezclar a gusto con los cargos de equipaje.'],
    ['Mantenimiento', 'Los chequeos A, C y D mantienen el estado del avión. Un avión gastado consume más, falla más y es más peligroso. La política "diferida" ahorra hoy pero aumenta el riesgo y las sanciones del regulador. Los hangares propios y la investigación abaratan el mantenimiento.'],
    ['Personal', 'Pilotos, tripulantes, mecánicos y personal de tierra se calculan según tus horas de vuelo. Con dotación escasa sube la fatiga (más incidentes) y hay cancelaciones; con moral baja llegan las huelgas. Contratá con experiencia (inmediato, caro) o formá cadetes (barato, lento).'],
    ['Clima, ATC y ETOPS', 'Tormentas, ciclones, nieve, niebla y viento cruzado provocan demoras, esperas y desvíos al alternativo. Para aterrizar con niebla necesitás autoland CAT III e investigación. La corriente en chorro acelera los vuelos hacia el este. Los bimotores que se alejan de aeropuertos alternativos necesitan kit y certificación ETOPS.'],
    ['Emergencias', 'En modo Realista tomás la cabina: seguí la lista de chequeo en orden, rápido, y elegí bien dónde aterrizar. En Simplificado decide la tripulación según su entrenamiento (simuladores y CRM ayudan).'],
    ['Finanzas', 'Préstamos según tu calificación crediticia, coberturas de combustible, seguros, impuestos trimestrales y salida a bolsa. Si la caja queda negativa 60 días, quebrás. En escenarios con inflación, indexá tarifas y salarios.'],
    ['Atajos', 'Espacio: pausa/reanudar · 1-4: velocidades · Esc: volver. En el mapa: arrastrar para mover, pellizcar o rueda para zoom, doble toque para acercar.']
  ];
  E.V.help = { title: 'Guía del juego', render() { return HELP.map(([t, d]) => `<div class="card mt8"><b>${t}</b><p class="small muted" style="margin:6px 0 0">${d}</p></div>`).join(''); } };

  /* ---------- Objetivos y logros ---------- */
  E.V.goals = {
    title: 'Objetivos y logros', render() {
      const G = E.G;
      const scn = E.SCN[G.scn];
      let h = '';
      if (scn && scn.goals.length) {
        h += UI.sec(scn.n);
        h += `<div class="card"><p class="muted small" style="margin-top:0">${scn.desc}</p>${scn.goals.map(g => { let p = 0; try { p = U.clamp(g.f(G), 0, 1); } catch (e) { } return `<div class="mt8"><div class="row sp small"><span>${g.t}</span><span class="mono">${U.pct(p)}</span></div>${UI.bar(p, p >= 1 ? 'good' : '', true)}</div>`; }).join('')}</div>`;
      }
      h += UI.sec('Estadísticas');
      h += `<div class="grid2">${UI.stat('Pasajeros totales', U.n0(G.stats.pax))}${UI.stat('Vuelos', U.n0(G.stats.flights))}${UI.stat('Kilómetros', U.n0(G.stats.km))}${UI.stat('Emergencias', U.n0(G.stats.emerg), `${G.stats.incidents} incidentes · ${G.stats.accidents} accidentes`)}</div>`;
      h += UI.sec('Logros');
      h += `<div class="list">${E.ACH.map(a => { const t = G.stats.ach[a.id]; return `<div class="ach ${t ? '' : 'lock'}"><div class="medal">${UI.icon(t ? 'trophy' : 'lock')}</div><div class="grow"><div style="font-weight:650">${a.n}</div><div class="small muted">${a.d}</div></div>${t ? `<span class="tiny mono muted">${U.fmtMonth(t)}</span>` : ''}</div>`; }).join('')}</div>`;
      return h;
    }
  };

  /* ---------- Ajustes ---------- */
  E.V.settings = {
    title: 'Ajustes', render() {
      const G = E.G, S = G.settings;
      const row = (k, t, s) => `<div class="item"><div class="grow"><div class="t">${t}</div><div class="s">${s}</div></div>${UI.toggle('setting', S[k], `data-k="${k}"`)}</div>`;
      let h = UI.sec('Apariencia');
      h += `<div class="card"><div class="row sp"><div><div style="font-weight:650">Tema</div><div class="small muted">Noche: centro de operaciones · Carta: mapa aeronáutico</div></div>${UI.seg('setTheme', [{ v: 'dark', l: 'Noche' }, { v: 'light', l: 'Carta' }], S.theme)}</div></div>`;
      h += UI.sec('Simulación');
      h += `<div class="card"><div class="row sp"><div><div style="font-weight:650">Emergencias en vuelo</div><div class="small muted">Realista: vos manejás la cabina. Simplificado: decide la tripulación.</div></div>${UI.seg('setSim', [{ v: 'simple', l: 'Simplificado' }, { v: 'real', l: 'Realista' }], S.sim)}</div></div>`;
      h += `<div class="list mt8">${row('pauseEvents', 'Pausar en eventos', 'Detiene el tiempo cuando hay una decisión')}${row('autoMaint', 'Mantenimiento automático', 'Programa chequeos A, C y D al vencer')}${row('autoStaff', 'Contratación automática', 'RR.HH. mantiene la dotación al 105%')}${row('crises', 'Crisis aleatorias', 'Huelgas, tormentas, auditorías, oportunidades…')}${row('hist', 'Eventos históricos', 'Crisis del petróleo, 11-S, pandemia…')}${G.econ.infl > 0 ? row('indexPrices', 'Indexar tarifas por inflación', 'Ajusta precios cada semana') + row('indexWages', 'Indexar salarios por inflación', 'Evita conflictos, pero sube la nómina') : ''}${row('sound', 'Sonido', 'Campanilla de cabina y efectos')}</div>`;
      h += UI.sec('Partida');
      const saves = E.SAVE.list();
      h += `<div class="list">${['1', '2', '3'].map(s => { const m = saves.find(x => x.slot === s); return `<div class="item"><div class="grow"><div class="t">Ranura ${s}</div><div class="s">${m ? `${U.esc(m.name)} · ${m.date}` : 'Vacía'}</div></div><button class="btn sm" data-a="saveSlot" data-v="${s}">${UI.icon('save')}Guardar</button></div>`; }).join('')}</div>`;
      h += `<div class="btns mt12"><button class="btn" data-a="exportSave">Exportar partida</button><button class="btn" data-a="importSave">Importar partida</button><button class="btn danger" data-a="quitTitle">Salir al menú</button></div>`;
      h += `<p class="tiny muted mt16">La partida se guarda automáticamente cada pocos minutos en este dispositivo. Estela · datos de mapa: Natural Earth.</p>`;
      return h;
    }
  };
  E.IN.setting = (el) => { E.G.settings[el.dataset.k] = el.checked; if (el.dataset.k === 'indexWages' && el.checked) E.ST.indexSalaries(E.G); };
  E.A.setTheme = (d) => { E.G.settings.theme = d.v; E.applyTheme(d.v); UI.render(); };
  E.A.setSim = (d) => { E.G.settings.sim = d.v; UI.render(); };
  E.A.saveSlot = (d) => { if (E.SAVE.save(E.G, d.v)) UI.toast('Partida guardada en la ranura ' + d.v, 'good', 'save'); UI.render(); };
  E.A.exportSave = () => {
    if (!E.framed) {
      const blob = new Blob([E.SAVE.exportText(E.G)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `estela-${E.G.airline.code}-${U.year(E.G.t)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      return;
    }
    const m = UI.modal(`<h2>Exportar partida</h2><p>Copiá este texto y guardalo donde quieras (notas, correo). Para recuperarla usá «Importar» y pegalo.</p><textarea id="expTxt" class="input mono" style="min-height:160px;padding:10px;font-size:11px" readonly>${U.esc(E.SAVE.exportText(E.G))}</textarea><div class="btns mt12" style="justify-content:flex-end"><button class="btn ghost" data-a="mClose">Cerrar</button><button class="btn primary" id="expCopy">Copiar</button></div>`);
    m.box.querySelector('#expCopy').onclick = () => { const ta = m.box.querySelector('#expTxt'); const ok = () => UI.toast('Partida copiada', 'good'); try { navigator.clipboard.writeText(ta.value).then(ok, () => { ta.select(); UI.toast('Seleccioné el texto: copialo manualmente'); }); } catch (e) { ta.select(); } };
  };
  E.A.importSave = () => {
    const m = UI.modal(`<h2>Importar partida</h2><p>Pegá el texto de una partida exportada o elegí un archivo .json.</p><textarea id="impTxt" class="input mono" style="min-height:140px;padding:10px;font-size:11px" placeholder='{"v":3,...}'></textarea><div class="row wrap mt12"><label class="btn sm" for="impFile">Elegir archivo</label><input type="file" id="impFile" accept=".json,application/json" class="hidden"></div><div class="btns mt12" style="justify-content:flex-end"><button class="btn ghost" data-a="mClose">Cancelar</button><button class="btn primary" id="impGo">Cargar</button></div>`);
    const load = (txt) => { try { const G = E.SAVE.importText(txt); m.close(); E.startGame(G); UI.toast('Partida importada', 'good'); } catch (e) { UI.toast('El texto no es una partida válida', 'bad'); } };
    m.box.querySelector('#impGo').onclick = () => load(m.box.querySelector('#impTxt').value);
    m.box.querySelector('#impFile').onchange = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => load(r.result); r.readAsText(f); };
  };
  E.A.quitTitle = async () => { if (await UI.confirm('¿Salir al menú?', 'La partida se guarda automáticamente.', 'Salir')) { E.SAVE.save(E.G, 'auto'); E.toTitle(); } };
})();
