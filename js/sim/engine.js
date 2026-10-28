/* ESTELA · motor de tiempo: pasos, procesos diarios, semanales y mensuales */
'use strict';
E.SPEEDS = [0, 1, 4, 16, 48]; // horas de juego por segundo real
E.MKT = {
  tv: { n: 'TV y prensa', y: 1950, eff: 1.0, img: 0.012, d: 'Notoriedad amplia e imagen de marca.' },
  digital: { n: 'Campaña digital', y: 1998, eff: 1.45, img: 0.004, d: 'Barata y eficiente para atraer turistas.' },
  corp: { n: 'Ventas corporativas', y: 1950, eff: 0.5, img: 0.002, j: true, d: 'Contratos con empresas: más pasajeros de ejecutiva.' },
  brand: { n: 'Imagen institucional', y: 1950, eff: 0.4, img: 0.03, d: 'Mejora la imagen pública y amortigua crisis.' }
};
E.MKT_SCALE = { NA: 420000, EU: 380000, AS: 400000, SA: 160000, ME: 130000, AF: 110000, OC: 130000 };
E.ACH = [
  { id: 'first', n: 'Despegue', d: 'Operá tu primer vuelo', f: G => G.stats.flights >= 1 },
  { id: 'pax100k', n: 'Cien mil', d: '100.000 pasajeros', f: G => G.stats.pax >= 1e5 },
  { id: 'pax1m', n: 'El primer millón', d: '1 millón de pasajeros', f: G => G.stats.pax >= 1e6 },
  { id: 'pax10m', n: 'Gran aerolínea', d: '10 millones de pasajeros', f: G => G.stats.pax >= 1e7 },
  { id: 'pax100m', n: 'Gigante', d: '100 millones de pasajeros', f: G => G.stats.pax >= 1e8 },
  { id: 'fleet10', n: 'Escuadrilla', d: '10 aviones en la flota', f: G => G.fleet.length >= 10 },
  { id: 'fleet50', n: 'Flota mediana', d: '50 aviones', f: G => G.fleet.length >= 50 },
  { id: 'fleet100', n: 'Centenaria', d: '100 aviones', f: G => G.fleet.length >= 100 },
  { id: 'jumbo', n: 'Reina de los cielos', d: 'Operá un 747 o un A380', f: G => G.fleet.some(a => E.AC[a.type].cat === 'jb' && !E.AC[a.type].freighter) },
  { id: 'sst', n: 'Mach 2', d: 'Operá un Concorde', f: G => G.fleet.some(a => a.type === 'CONC') },
  { id: 'global', n: 'Vuelta al mundo', d: 'Destinos en 6 regiones', f: G => new Set(E.X.destinations(G).map(i => E.AP[i].region)).size >= 6 },
  { id: 'otp', n: 'Reloj suizo', d: 'Puntualidad del 90% (tras 2.000 vuelos)', f: G => G.stats.flights > 2000 && G.rep.otp >= 0.9 },
  { id: 'ipo', n: 'Campana de Wall Street', d: 'Salí a la bolsa', f: G => G.fin.stock.listed },
  { id: 'bn', n: 'Mil millones', d: 'Valuación de $1.000 M', f: G => G.fin.stock.listed && G.fin.stock.price * G.fin.stock.shares >= 1e9 * G.econ.cpi },
  { id: 'hubs', n: 'Multi-hub', d: 'Tres bases operativas', f: G => Object.keys(G.bases).length >= 3 },
  { id: 'stars', n: 'Cinco estrellas', d: 'Reputación de 88+', f: G => G.rep.overall >= 88 },
  { id: 'safe10', n: 'Década segura', d: '10 años sin accidentes', f: G => G.stats.accidents === 0 && E.U.yearF(G.t) - E.U.yearF(G.t0) >= 10 }
];

E.ENG = (() => {
  const U = E.U;
  const ENG = {};
  ENG.advance = (G, hours) => {
    let rem = Math.min(hours, 6);
    while (rem > 1e-9 && !G.over) {
      const step = Math.min(rem, 0.25);
      const nt = G.t + step;
      // eventos del paso en orden cronológico
      const evs = [];
      for (const f of G.flights) if (f.arr <= nt) evs.push({ t: Math.max(G.t, f.arr), f });
      for (const ac of G.fleet) if (ac.route && ac.status === 'active' && !ac.fl && ac.next && ac.next <= nt) evs.push({ t: Math.max(G.t, ac.next), ac });
      evs.sort((a, b) => a.t - b.t);
      for (const e of evs) {
        G.t = e.t;
        if (e.f) { if (G.flights.includes(e.f)) E.FL.arrive(G, e.f); }
        else if (!e.ac.fl && e.ac.status === 'active' && e.ac.route) E.FL.depart(G, e.ac);
      }
      G.t = nt;
      E.W.step(G, step);
      E.EV.checkEmergencies(G);
      const day = U.dayIdx(G.t);
      if (day !== G.lastDay) { G.lastDay = day; ENG.daily(G); }
      rem -= step;
      if (G.ev.emq && G.ev.emq.length && G.settings.sim === 'real') break;
    }
  };

  ENG.daily = (G) => {
    E.EC.daily(G);
    E.EC.dailyFixed(G);
    E.W.daily(G);
    E.F.daily(G);
    E.ST.daily(G);
    G.routes.forEach(r => E.D.routeDemand(G, r));
    ENG.research(G);
    ENG.marketing(G);
    E.EV.daily(G);
    ENG.reputation(G);
    ENG.solvency(G);
    if (U.weekday(G.t) === 1) ENG.weekly(G);
    const mi = U.year(G.t) * 12 + U.month(G.t);
    if (mi !== G.lastMonth) { G.lastMonth = mi; ENG.monthly(G); }
  };

  ENG.weekly = (G) => {
    G.routes.forEach(r => {
      const w = r.stats.w;
      w.t = G.t;
      r.stats.hist.push(w);
      if (r.stats.hist.length > 52) r.stats.hist.shift();
      r.stats.w = E.R.emptyWeek();
      if (r.auto && (G.research.done.yield || G.research.done.dyn) && r.dem) {
        const step = G.research.done.dyn ? 0.05 : 0.03;
        ['y', 'p', 'j', 'f'].forEach(k => {
          const lf = r.dem.lf[k]; if (!r.dem.cap[k]) return;
          const ref = r.dem.ref[k];
          if (lf > 0.96) r.price[k] = Math.round(Math.min(ref * 2.4, r.price[k] * (1 + step)));
          else if (lf < (k === 'y' ? 0.78 : 0.62)) r.price[k] = Math.round(Math.max(ref * 0.45, r.price[k] * (1 - step)));
        });
      }
    });
    // indexación de tarifas por inflación
    if (G.econ.infl > 0 && G.settings.indexPrices) {
      const k = G.econ.cpi / (G.econ.cpiPrices || 1);
      if (k > 1.005) { G.routes.forEach(r => ['y', 'p', 'j', 'f'].forEach(c => r.price[c] = Math.round(r.price[c] * k))); G.econ.cpiPrices = G.econ.cpi; }
    } else G.econ.cpiPrices = G.econ.cpi;
    G.wk.paxPrev = G.wk.pax;
    G.wkPrev = Object.assign({}, G.wk);
    G.wk = { pax: 0, seats: 0, ontime: 0, fl: 0, canc: 0, div: 0, paxPrev: G.wk.pax };
    E.D.weeklyMarkets(G);
    E.F.refreshUsed(G);
    const m = U.month(G.t), d = U.date(G.t).getUTCDate();
    if ((m === 3 || m === 9) && d <= 7) E.R.seasonCheck(G);
  };

  ENG.monthly = (G) => {
    E.EC.monthly(G);
    // subsidios
    G.subsidies = G.subsidies.filter(s => {
      if (G.t > s.until) return false;
      if (G.t < s.start) return true;
      const ok = G.routes.some(r => (r.a === s.iata || r.b === s.iata) && E.FL.routeFreq(G, r) >= 7);
      if (ok) { E.X.cash(G, s.amt * G.econ.cpi, 'sub'); return true; }
      s.miss = (s.miss || 0) + 1;
      if (s.miss >= 2) { E.X.inbox(G, 'Subsidio cancelado', `No cumpliste las 7 frecuencias semanales a ${s.iata}: el gobierno canceló el contrato.`, 'bad'); E.X.rep(G, 'image', -2); return false; }
      return true;
    });
    // cierre contable
    const L = G.fin.cur;
    L.t = G.t - 1; L.cash = G.cash; L.fleet = G.fleet.length; L.rep = G.rep.overall; L.otp = G.rep.otp; L.fuel = G.econ.fuel * G.econ.cpi;
    G.fin.hist.push(L);
    if (G.fin.hist.length > 240) G.fin.hist.shift();
    G.fin.cur = E.newLedger();
    G.fleet.forEach(a => { a.mhist.push(a.mo); if (a.mhist.length > 12) a.mhist.shift(); a.mo = { fl: 0, pax: 0, rev: 0, cost: 0 }; });
    // logros
    E.ACH.forEach(a => { if (!G.stats.ach[a.id]) { let ok = false; try { ok = a.f(G); } catch (e) { } if (ok) { G.stats.ach[a.id] = G.t; E.X.inbox(G, 'Logro: ' + a.n, a.d, 'good'); E.bus.emit('achievement', a); } } });
    // objetivos de escenario
    const scn = E.SCN[G.scn];
    if (scn && scn.goals.length && !G.won) {
      const prog = scn.goals.map(g => { try { return U.clamp(g.f(G), 0, 1); } catch (e) { return 0; } });
      if (prog.every(p => p >= 1)) { G.won = { t: G.t }; E.bus.emit('won', G); E.X.inbox(G, '¡Objetivos cumplidos!', 'Completaste todos los objetivos del escenario. Podés seguir jugando.', 'good'); }
      else if (scn.deadline && U.yearF(G.t) >= scn.deadline && !G.flags.deadlineMsg) { G.flags.deadlineMsg = true; E.X.inbox(G, 'Plazo cumplido', 'Llegó la fecha límite del escenario sin completar todos los objetivos. Podés seguir jugando en modo libre.', 'warn'); }
    }
    E.bus.emit('month', G);
  };

  ENG.research = (G) => {
    const R = G.research;
    if (!R.cur && R.queue.length) ENG.startResearch(G, R.queue.shift());
    if (!R.cur) return;
    R.cur.prog += 1;
    const def = E.RES[R.cur.id];
    if (R.cur.prog >= def.d) {
      R.done[def.id] = G.t;
      E.X.inbox(G, 'Investigación completada', `${def.n}: ${def.desc}`, 'good');
      E.bus.emit('research', def);
      R.cur = null;
      if (R.queue.length) ENG.startResearch(G, R.queue.shift());
    }
  };
  ENG.canResearch = (G, id) => {
    const r = E.RES[id];
    if (G.research.done[id]) return { ok: false, why: 'Completada' };
    if (U.yearF(G.t) < r.y) return { ok: false, why: 'Disponible en ' + r.y };
    const miss = r.req.filter(q => !G.research.done[q]);
    if (miss.length) return { ok: false, why: 'Requiere: ' + miss.map(q => E.RES[q].n).join(', ') };
    return { ok: true, cost: r.c * 1e6 * G.econ.cpi };
  };
  ENG.startResearch = (G, id) => {
    const c = ENG.canResearch(G, id);
    if (!c.ok) return c;
    if (G.research.cur) { if (!G.research.queue.includes(id)) G.research.queue.push(id); return { ok: true, queued: true }; }
    if (G.cash < c.cost) return { ok: false, why: 'Caja insuficiente (' + U.money(c.cost) + ')' };
    E.X.cash(G, -c.cost, 'rd');
    G.research.cur = { id, prog: 0 };
    return { ok: true };
  };

  ENG.marketing = (G) => {
    const yf = U.yearF(G.t);
    G.mkt.campaigns = G.mkt.campaigns.filter(c => c.until > G.t);
    G.mkt.campaigns.forEach(c => {
      const M = E.MKT[c.type];
      const cost = c.budget / 7 * G.econ.cpi;
      E.X.cash(G, -cost, 'mkt');
      const regs = c.region === 'all' ? Object.keys(E.REGIONS) : [c.region];
      regs.forEach(rg => {
        const scale = E.MKT_SCALE[rg] * (c.region === 'all' ? 7 : 1);
        const aw = G.mkt.aw[rg];
        G.mkt.aw[rg] = U.clamp(aw + c.budget / scale / 7 * 2.2 * M.eff * (100 - aw) / 100, 0, 100);
      });
      G.rep.image = U.clamp(G.rep.image + M.img * c.budget / 100000 / 7 * (100 - G.rep.image) / 60, 0, 100);
      if (M.j && !G.mods.some(m => m.k === 'demandJ' && m.label === 'Ventas corporativas')) E.X.mod(G, { k: 'demandJ', v: 1.08, days: 7, label: 'Ventas corporativas' });
    });
    // decaimiento
    Object.keys(G.mkt.aw).forEach(rg => {
      const floor = rg === G.airline.region ? 8 : 1;
      const flights = G.routes.some(r => E.AP[r.a].region === rg || E.AP[r.b].region === rg);
      G.mkt.aw[rg] = Math.max(floor, G.mkt.aw[rg] - G.mkt.aw[rg] * 0.0018 + (flights ? 0.03 : 0));
    });
  };

  ENG.reputation = (G) => {
    const R = G.rep;
    R.punct += (U.clamp((R.otp - 0.5) / 0.45 * 100, 0, 100) - R.punct) * 0.05;
    const safeBase = 64 + (G.mpol === 'strict' ? 8 : G.mpol === 'defer' ? -8 : 0) + G.staff.pilots.tlevel * 3 + (G.research.done.sim ? 3 : 0) + (G.research.done.crm ? 3 : 0) - G.fleet.filter(a => a.cond < 50).length / Math.max(1, G.fleet.length) * 25;
    R.safety += (U.clamp(safeBase, 20, 95) - R.safety) * 0.004;
    R.image += (50 - R.image) * 0.0015;
    if (G.research.done.saf) R.image = Math.min(100, R.image + 0.004);
    R.overall = U.clamp(0.18 * R.punct + 0.2 * R.safety + 0.24 * R.service + 0.1 * R.value + 0.1 * R.bags + 0.18 * R.image, 0, 100);
  };

  ENG.solvency = (G) => {
    if (G.cash < 0) {
      G.fin.neg = (G.fin.neg || 0) + 1;
      if (G.fin.neg === 1) E.X.inbox(G, 'Caja negativa', 'La compañía tiene saldo negativo. Pedí un préstamo, vendé aviones o recortá costos: si seguís así 60 días, quebrarás.', 'bad');
      if (G.fin.neg === 30) E.X.inbox(G, 'Quedan 30 días', 'Los bancos y proveedores pierden la paciencia. Tenés 30 días para volver a caja positiva.', 'bad');
      if (G.fin.neg >= 60) G.over = { kind: 'bankrupt', title: 'Quiebra', text: `Tras dos meses en rojo, ${G.airline.name} se presenta en quiebra. Los aviones vuelven a los arrendadores y los acreedores se reparten lo que queda.` };
    } else G.fin.neg = 0;
  };
  return ENG;
})();
