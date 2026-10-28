/* ESTELA · motor de eventos: modificadores, crisis, noticias históricas y emergencias */
'use strict';
E.X = (() => {
  const U = E.U;
  const X = {};
  X.cash = (G, v, cat = 'other') => { if (!v || !isFinite(v)) return; G.cash += v; E.EC.book(G, cat, v); };
  X.rep = (G, k, d) => { G.rep[k] = U.clamp((G.rep[k] || 0) + d, 0, 100); };
  X.morale = (G, cat, d) => { (cat === 'all' ? E.STAFF_KEYS : [cat]).forEach(k => G.staff[k].morale = U.clamp(G.staff[k].morale + d, 0, 100)); };
  X.inbox = (G, title, text, kind = 'info') => {
    G.inbox.unshift({ id: U.uid(G, 'm'), t: G.t, title, text, kind, read: false });
    if (G.inbox.length > 120) G.inbox.length = 120;
    E.bus.emit('inbox', G.inbox[0]);
  };
  X.news = (G, text) => { G.news.unshift({ t: G.t, text }); if (G.news.length > 40) G.news.length = 40; E.bus.emit('news', text); };

  /* ----- Modificadores ----- */
  X.mod = (G, m) => {
    const o = { id: U.uid(G, 'x'), k: m.k, scope: m.scope || null, v: m.v == null ? 1 : m.v, until: G.t + (m.days || 30) * 24, label: m.label || '' };
    G.mods.push(o);
    return o;
  };
  const match = (s, ctx) => {
    if (!s) return true;
    if (s.region && s.region !== ctx.region) return false;
    if (s.cc && s.cc !== ctx.cc) return false;
    if (s.ccs && !s.ccs.includes(ctx.cc)) return false;
    if (s.iata && s.iata !== ctx.iata) return false;
    if (s.type && s.type !== ctx.type) return false;
    if (s.types && !s.types.includes(ctx.type)) return false;
    if (s.cat && s.cat !== ctx.cat) return false;
    if (s.box || s.near) {
      const ap = ctx.iata && E.AP[ctx.iata]; if (!ap) return false;
      if (s.box && !(ap.lon >= s.box[0] && ap.lon <= s.box[2] && ap.lat >= s.box[1] && ap.lat <= s.box[3])) return false;
      if (s.near && U.dist(ap, { lat: s.near[0], lon: s.near[1] }) > s.near[2]) return false;
    }
    return true;
  };
  X.modMult = (G, k, ctx, additive, noGlobal) => {
    let v = additive ? 0 : 1;
    for (const m of G.mods) {
      if (m.k !== k || m.until < G.t) continue;
      if (noGlobal && !m.scope) continue;
      if (m.scope && !ctx) continue;
      if (!match(m.scope, ctx || {})) continue;
      if (additive) v += m.v; else v *= m.v;
    }
    return v;
  };
  X.isClosed = (G, iata, permOnly) => {
    const ap = E.AP[iata];
    const ctx = { iata, cc: ap.cc, region: ap.region };
    return G.mods.some(m => m.k === 'closed' && m.until > G.t && (!permOnly || m.until - G.t > 24 * 3000) && m.scope && match(m.scope, ctx));
  };
  X.groundedType = (G, t) => G.mods.some(m => m.k === 'grounded' && m.until > G.t && match(m.scope, { type: t.id }));
  X.strike = (G, cat, days) => { X.mod(G, { k: 'strike', scope: { cat }, days, label: 'Huelga de ' + E.STAFF_CATS[cat].n.toLowerCase() }); X.inbox(G, 'Huelga', `Comenzó una huelga de ${E.STAFF_CATS[cat].pl} por ${days} días.`, 'bad'); };
  X.strikeLevel = (G) => {
    let p = 0;
    G.mods.forEach(m => { if (m.k === 'strike' && m.until > G.t) p = Math.max(p, { pilots: 0.88, cabin: 0.8, ground: 0.35, mech: 0.15 }[m.scope.cat] || 0.5); });
    return p;
  };
  X.queue = (G, id, arg) => {
    if (G.ev.queue.some(q => q.id === id)) return;
    const cd = G.ev.cd[id];
    if (cd && cd > G.t) return;
    const def = E.CRISES.find(c => c.id === id);
    G.ev.queue.push({ id, arg, t: G.t });
    if (def) G.ev.cd[id] = G.t + def.cd * 24;
  };

  /* ----- Consultas de apoyo ----- */
  X.mainBase = (G) => {
    let best = G.airline.home, bn = -1;
    Object.keys(G.bases).forEach(b => { const n = G.routes.filter(r => r.a === b || r.b === b).length; if (n > bn) { bn = n; best = b; } });
    return best;
  };
  X.paxDaily = (G, iata) => {
    let p = 0;
    G.routes.forEach(r => { if (!r.dem) return; if (iata && r.a !== iata && r.b !== iata) return; ['y', 'p', 'j', 'f'].forEach(k => p += (r.dem[k][0] + r.dem[k][1])); });
    return p;
  };
  X.scale = (G) => Math.max(2e6 * G.econ.cpi, E.EC.revenue12(G) / 12);
  X.routeCountries = (G) => [...new Set(G.routes.flatMap(r => [E.AP[r.a].cc, E.AP[r.b].cc]))];
  X.ground = (G, ac, days, why) => { if (ac.status === 'delivery') return; ac.status = 'grounded'; ac.why = why; ac.until = Math.max(ac.until || 0, G.t + days * 24); };
  X.myCompetitors = (G) => [...new Set(G.routes.flatMap(r => (G.markets[r.key] ? G.markets[r.key].comps.map(c => c.name) : [])))];
  X.removeCompetitor = (G, name) => { Object.values(G.markets).forEach(m => m.comps = m.comps.filter(c => c.name !== name)); };
  X.fireSale = (G, name) => {
    const yf = U.yearF(G.t);
    const pool = E.AIRCRAFT.filter(t => t.y < yf - 3 && (!t.e || yf - t.e < 15) && !t.freighter && t.cat !== 'ss');
    for (let i = 0; i < 4; i++) G.used.push(E.F.makeListing(G, U.pick(pool).id, { disc: 0.35, seller: 'remate de ' + name }));
  };
  X.awareness = (G, region, d) => { Object.keys(G.mkt.aw).forEach(r => { if (!region || r === region) G.mkt.aw[r] = U.clamp(G.mkt.aw[r] + d * (region ? 1 : 0.6), 0, 100); }); };
  X.smallDomestic = (G) => {
    const home = E.AP[G.airline.home];
    const c = E.AIRPORTS.filter(a => a.cc === home.cc && a.size <= 2 && !G.routes.some(r => r.a === a.iata || r.b === a.iata) && U.dist(a, home) > 200);
    return c.length ? c[Math.floor(U.hash(G.airline.name + U.year(G.t)) * c.length)].iata : null;
  };
  X.contestedRoute = (G) => { const rs = G.routes.filter(r => G.markets[r.key] && G.markets[r.key].comps.length && FLfreq(G, r) > 0); return rs.length ? U.pick(rs) : null; };
  const FLfreq = (G, r) => E.FL.routeFreq(G, r);
  X.market = (G, r) => E.D.market(G, r.a, r.b);
  X.overdue = (G, ac) => E.F.overdue(G, ac);
  X.premiumScore = (G) => { const ac = G.fleet.find(a => a.cabin && a.cabin.j > 0); return ac ? E.D.quality(G, ac, 'j', 6) : 0.4; };
  X.hire = (G, cat, n) => E.ST.hire(G, cat, n);
  X.salary = (G, cat) => E.ST.salary(G, cat);
  X.competition = (G, scope, n) => {
    G.routes.forEach(r => { const A = E.AP[r.a]; if (!match(scope, { region: A.region, cc: A.cc, iata: A.iata })) return; const m = E.D.market(G, r.a, r.b); for (let i = 0; i < n; i++) m.comps.push({ name: 'Nueva ' + U.pick(['Express', 'Jet', 'Air', 'Wings']), cap: (r.dem ? (r.dem.mkt.y) : 200) * 0.2, price: 0.82, q: 0.45, lf: 0.7 }); });
  };
  X.annualProfit = (G) => { const h = G.fin.hist.slice(-12); return h.reduce((s, m) => s + E.EC.profitOf(m), 0) * (h.length ? 12 / h.length : 0); };
  X.equity = (G) => E.EC.equity(G);
  X.avgMorale = (G) => U.sum(E.STAFF_KEYS, k => G.staff[k].morale) / 4;
  X.avgLoad = (G) => { const h = G.fin.hist.slice(-3); const s = h.reduce((a, m) => a + m.seats, 0); return s ? h.reduce((a, m) => a + m.pax, 0) / s : 0; };
  X.destinations = (G) => [...new Set(G.routes.filter(r => E.FL.routeFreq(G, r) > 0).flatMap(r => [r.a, r.b]))];
  X.annualPax = (G) => { const h = G.fin.hist.slice(-12); return h.reduce((s, m) => s + m.pax, 0) * (h.length ? 12 / h.length : 0); };

  /* ----- Fusiones ----- */
  X.mergerOffer = (G) => {
    const home = E.AP[G.airline.home];
    const cands = E.AIRPORTS.filter(a => !G.bases[a.iata] && a.size >= 2 && a.size <= 4 && (a.cc === home.cc || (G.research.done.subsid && a.region === home.region)));
    if (!cands.length) return null;
    const base = U.pick(cands);
    const yf = U.yearF(G.t);
    const pool = E.AIRCRAFT.filter(t => t.y < yf - 5 && (!t.e || yf - t.e < 18) && (t.cat === 'nb' || t.cat === 'rp' || t.cat === 'rj'));
    const t = U.pick(pool);
    const n = U.randi(3, 6);
    const ac = Array.from({ length: n }, () => ({ type: t.id, age: U.rand(6, Math.min(24, yf - t.y)), cond: U.rand(45, 75) }));
    const val = ac.reduce((s, a) => s + E.F.value(G, { type: a.type, built: yf - a.age, cond: a.cond, upg: {} }), 0);
    return { name: U.pick(['Aerolíneas ', 'Líneas Aéreas ', 'Air ', 'Aero ']) + base.city.split(' ')[0], base: base.iata, ac, desc: n + '× ' + t.short, price: Math.round(val * 0.75 + E.EC.baseCost(G, base.iata) * 0.5) };
  };
  X.doMerger = (G, o) => {
    if (G.cash < o.price) return 'No tenés caja suficiente para cerrar la compra.';
    X.cash(G, -o.price, 'cap');
    G.bases[o.base] = { since: G.t, lounge: 0, hangar: 0, abroad: E.AP[o.base].cc !== G.airline.cc };
    const yf = U.yearF(G.t);
    o.ac.forEach(a => { const ac = E.F.create(G, a.type, { built: yf - a.age, cond: a.cond, own: 'own', loc: o.base, base: o.base }); G.fleet.push(ac); });
    E.STAFF_KEYS.forEach(k => G.staff[k].n += Math.round(o.ac.length * { pilots: 9, cabin: 14, mech: 7, ground: 12 }[k]));
    return `Compraste ${o.name}: ${o.ac.length} aviones y una nueva base en ${E.AP[o.base].city}.`;
  };

  /* ----- Accidente ----- */
  X.accident = (G, ac, f, r) => {
    const t = E.AC[ac.type];
    const pax = f.pax.y + f.pax.p + f.pax.j + f.pax.f;
    const survivable = f.accident > 0.45;
    const val = E.F.value(G, ac);
    const P = E.EC.INS[G.fin.ins];
    const liab = pax * (survivable ? 0.25e6 : 1.4e6) * G.econ.cpi;
    X.cash(G, val * P.cover, 'cap');
    X.cash(G, -liab * (1 - P.lcover), 'comp');
    if (ac.own === 'lease') X.cash(G, -val * (1 - P.cover) * 0.5, 'other');
    G.fleet = G.fleet.filter(a => a !== ac);
    G.fin.loans.filter(l => l.ac === ac.id).forEach(l => { X.cash(G, -Math.min(l.amt, Math.max(0, G.cash)), 'cap'); l.amt = 0; });
    G.fin.loans = G.fin.loans.filter(l => l.amt > 1);
    G.stats.accidents++;
    G.rep.safety = Math.max(4, G.rep.safety - (survivable ? 25 : 45));
    X.rep(G, 'image', survivable ? -12 : -25);
    X.mod(G, { k: 'demand', v: survivable ? 0.93 : 0.82, days: 120, label: 'Impacto del accidente' });
    const where = E.AP[f.d].city;
    const txt = survivable
      ? `El ${t.short} ${ac.reg} (vuelo ${f.fn}) se salió de pista al aterrizar en ${where}. La evacuación fue exitosa, aunque hay heridos. El avión es pérdida total.`
      : `El vuelo ${f.fn} (${t.short} ${ac.reg}) sufrió un accidente grave en la aproximación a ${where}. Es el peor día en la historia de la compañía.`;
    X.inbox(G, 'Accidente', txt, 'bad');
    X.news(G, `Accidente del vuelo ${f.fn} de ${G.airline.name} en ${where}.`);
    G.ev.queue.unshift({ id: 'accident', arg: { txt, survivable }, t: G.t });
  };
  return X;
})();

/* ================== Motor de eventos ================== */
E.EV = (() => {
  const U = E.U;
  const EV = {};
  const ACC = {
    id: 'accident', build: (G, a) => ({
      icon: 'alert', title: a.survivable ? 'Accidente en aterrizaje' : 'Accidente grave', kicker: 'Crisis', text: a.txt + ' La prensa espera tu declaración.',
      choices: [
        { t: 'Transparencia total y asistencia a familias', d: 'Costoso, pero protege la imagen a largo plazo', fx: G => { E.X.cash(G, -4e6 * G.econ.cpi, 'comp'); E.X.rep(G, 'image', 8); return 'Tu respuesta fue elogiada por la prensa y las autoridades.'; } },
        { t: 'Declaración legal mínima', d: 'Sin costo extra · la imagen sufre más', fx: G => { E.X.rep(G, 'image', -6); return 'La comunicación fue percibida como fría y defensiva.'; } },
        { t: 'Inmovilizar la flota del tipo para revisión', d: 'Seguridad +, 3 días sin esos aviones', fx: G => { E.X.rep(G, 'safety', 6); E.X.rep(G, 'image', 4); G.fleet.forEach(x => { if (x.status === 'active') E.X.ground(G, x, 3, 'Revisión tras accidente'); }); return 'La revisión preventiva fue bien recibida.'; } }
      ]
    })
  };
  EV.daily = (G) => {
    // históricos
    E.HIST.forEach(h => {
      if (G.ev.hist[h.id]) return;
      if (G.t >= U.tOf(h.y, h.m, h.d)) {
        G.ev.hist[h.id] = true;
        if (!G.settings.hist) return;
        try { h.fx(G); } catch (e) { console.error(e); }
        E.X.news(G, h.head);
        G.ev.queue.push({ hist: h.id, t: G.t });
      }
    });
    // limpieza de modificadores
    G.mods = G.mods.filter(m => m.until > G.t);
    // crisis aleatorias
    if (G.settings.crises && G.t - G.ev.last > 24 * 6 && G.fleet.length) {
      const size = U.clamp(G.fleet.length / 12, 0.45, 1.8);
      for (const c of E.CRISES) {
        if (!c.w) continue;
        if (G.ev.cd[c.id] && G.ev.cd[c.id] > G.t) continue;
        let ok = false; try { ok = c.cond(G); } catch (e) { ok = false; }
        if (!ok) continue;
        if (U.chance(c.w * size)) { E.X.queue(G, c.id); G.ev.last = G.t; break; }
      }
    }
  };
  EV.pending = (G) => G.ev.queue.length > 0;
  // construye el próximo evento para mostrar
  EV.next = (G) => {
    while (G.ev.queue.length) {
      const q = G.ev.queue.shift();
      if (q.hist) { const h = E.HIST.find(x => x.id === q.hist); if (h) return { hist: h }; continue; }
      const def = q.id === 'accident' ? ACC : E.CRISES.find(c => c.id === q.id);
      if (!def) continue;
      let ev = null;
      try { ev = def.build(G, q.arg); } catch (e) { console.error(e); }
      if (ev) { ev.id = q.id; return ev; }
    }
    return null;
  };
  EV.choose = (G, ev, i) => {
    const c = ev.choices[i];
    let res = '';
    try { res = c.fx(G) || ''; } catch (e) { console.error(e); }
    E.X.inbox(G, ev.title, (c.t + ': ' + res).trim(), 'event');
    return res;
  };

  /* ----- Emergencias ----- */
  EV.checkEmergencies = (G) => {
    for (const f of G.flights) {
      if (!f.emg || f.emg.done || G.t < f.emg.at) continue;
      f.emg.done = true;
      G.stats.emerg++;
      if (G.settings.sim === 'real') { G.ev.emq = G.ev.emq || []; G.ev.emq.push(f.id); E.bus.emit('emergency', f); }
      else EV.autoResolve(G, f);
    }
  };
  EV.def = (id) => E.EMERG.find(e => e.id === id);
  EV.crewScore = (G) => U.clamp(0.45 + G.staff.pilots.tlevel * 0.12 + (G.research.done.sim ? 0.08 : 0) + (G.research.done.crm ? 0.07 : 0) - Math.max(0, G.staff.pilots.fatigue - 50) / 120 + U.rand(-0.15, 0.15), 0.05, 1);
  EV.autoResolve = (G, f) => {
    const em = EV.def(f.emg.id);
    const ac = G.fleet.find(a => a.id === f.ac); if (!ac) return;
    const steps = em.steps(f.emg.eng, ac);
    // la tripulación elige la mejor opción con probabilidad según entrenamiento
    const s = EV.crewScore(G);
    let action = 'continue';
    steps.forEach(st => { if (st.o) { const best = st.o.reduce((a, b) => b.v > a.v ? b : a); const pick = U.chance(s) ? best : U.pick(st.o); if (pick.a) action = pick.a; } });
    const opts = EV.divertOptions(G, f);
    EV.resolve(G, f, { score: s, action, airport: action === 'return' ? f.o : opts[0] ? opts[0].iata : f.d });
  };
  // aeropuertos posibles para desviar desde la posición actual
  EV.divertOptions = (G, f) => {
    const ac = G.fleet.find(a => a.id === f.ac); if (!ac) return [];
    const t = E.AC[ac.type];
    const pos = E.FL.pos(G, f, G.t) || E.AP[f.o];
    const list = E.AIRPORTS.filter(a => a.size >= 2 && a.rwy >= t.rwy * 0.75 && !E.X.isClosed(G, a.iata))
      .map(a => ({ iata: a.iata, city: a.city, d: U.dist(pos, a), rwy: a.rwy }))
      .sort((a, b) => a.d - b.d).slice(0, 3);
    return list;
  };
  EV.AOG = { engfire: [7, 14, 0.05], engfail: [4, 8, 0.025], depress: [2, 4, 0.006], hyd: [2, 3, 0.004], bird: [3, 6, 0.012], smoke: [3, 7, 0.01], medical: [0, 0, 0], gear: [2, 5, 0.008], turb: [1, 2, 0.002], unruly: [0, 0, 0], elec: [1, 2, 0.003] };
  EV.resolve = (G, f, o) => {
    const ac = G.fleet.find(a => a.id === f.ac); if (!ac) return null;
    const t = E.AC[ac.type];
    const em = EV.def(f.emg.id);
    const s = U.clamp(o.score, 0, 1);
    const pax = f.pax.y + f.pax.p + f.pax.j + f.pax.f;
    const res = { lines: [], s };
    const aog = EV.AOG[em.id];
    let tier = s >= 0.8 ? 'great' : s >= 0.55 ? 'ok' : s >= 0.3 ? 'bad' : 'awful';
    const goodAction = (() => { const st = em.steps(f.emg.eng, ac).filter(x => x.o); const last = st[st.length - 1]; if (!last) return null; const best = last.o.reduce((a, b) => b.v > a.v ? b : a); return best.a || null; })();
    if (o.action === 'continue' && goodAction && goodAction !== 'continue' && U.chance((1 - s) * em.sev)) tier = tier === 'great' ? 'ok' : tier === 'ok' ? 'bad' : 'awful';
    // efectos de la decisión
    if (o.action === 'divert' || o.action === 'return') {
      const to = o.airport || (o.action === 'return' ? f.o : f.d);
      const pos = E.FL.pos(G, f, G.t) || E.AP[f.o];
      G.flights = G.flights.filter(x => x !== f);
      ac.fl = null;
      const g = E.FL.ferry(G, ac, to, G.t, 'Desvío', { lat: pos.lat, lon: pos.lon });
      g.fn = f.fn; g.pax = f.pax; g.o = f.o;
      const days = aog[0] ? U.randi(aog[0], aog[1]) : 0;
      g.after = { route: f.r, back: f.d, out: f.out, aog: days, cont: days === 0 && to !== f.d, why: 'Reparación tras ' + em.n.toLowerCase() };
      if (days) { const c = t.price * 1e6 * aog[2] * G.econ.cpi * (tier === 'great' ? 0.8 : tier === 'awful' ? 1.6 : 1); E.X.cash(G, -c, 'maint'); res.lines.push(`Reparación: ${U.money(c)}, ${days} días en tierra.`); }
      const care = pax * (to === f.o ? 60 : 160) * G.econ.cpi * E.SVC.comp[G.svc.comp].k;
      E.X.cash(G, -care, 'comp');
      res.lines.push(`Atención a ${pax} pasajeros en ${to}: ${U.money(care)}.`);
      res.where = to;
    } else {
      res.lines.push('El vuelo continuó a destino.');
      if (aog[0] && tier !== 'great') { const days = U.randi(1, aog[0]); E.X.ground(G, ac, days, 'Revisión tras ' + em.n.toLowerCase()); }
    }
    if (em.eng) ac.eng[(f.emg.eng || 1) - 1] = Math.min(ac.eng[(f.emg.eng || 1) - 1], 20);
    if (tier === 'great') { E.X.rep(G, 'safety', 1); E.X.rep(G, 'image', 2); E.X.morale(G, 'pilots', 3); res.title = 'Manejo ejemplar'; res.lines.unshift('La tripulación resolvió la emergencia de forma impecable. La prensa destaca el profesionalismo.'); E.X.news(G, `Tripulación de ${G.airline.name} elogiada tras una emergencia en el vuelo ${f.fn}.`); }
    else if (tier === 'ok') { E.X.rep(G, 'safety', -0.5); res.title = 'Emergencia resuelta'; res.lines.unshift('El avión aterrizó sin novedades para los pasajeros.'); }
    else if (tier === 'bad') { E.X.rep(G, 'safety', -4); E.X.rep(G, 'image', -3); const c = pax * 2000 * G.econ.cpi; E.X.cash(G, -c, 'comp'); E.X.ground(G, ac, U.randi(3, 8), 'Daños tras incidente'); G.stats.incidents++; res.title = 'Incidente serio'; res.lines.unshift('Hubo heridos leves y el avión sufrió daños. La autoridad abrió una investigación.'); }
    else {
      if (em.sev >= 0.7 && U.chance(0.4)) { f.accident = 0.6; if (G.flights.includes(f)) { /* se procesa al llegar */ } else E.X.accident(G, ac, Object.assign({}, f, { d: res.where || f.d }), null); res.title = 'Accidente'; res.lines = ['La situación se salió de control. Revisá la bandeja de crisis.']; }
      else { E.X.rep(G, 'safety', -8); E.X.rep(G, 'image', -6); E.X.cash(G, -pax * 6000 * G.econ.cpi, 'comp'); E.X.ground(G, ac, U.randi(8, 20), 'Daños graves'); G.stats.incidents++; res.title = 'Incidente grave'; res.lines.unshift('El aterrizaje fue muy duro. Varios heridos y daños estructurales.'); }
    }
    E.X.inbox(G, res.title + ' · ' + f.fn, em.n + '. ' + res.lines.join(' '), tier === 'great' || tier === 'ok' ? 'good' : 'bad');
    return res;
  };
  return EV;
})();
