/* ESTELA · estado de partida: creación, guardado y carga */
'use strict';
E.bus = (() => { const h = {}; return { on: (k, f) => (h[k] = h[k] || []).push(f), emit: (k, ...a) => (h[k] || []).forEach(f => { try { f(...a); } catch (e) { console.error(e); } }) }; })();

E.STAFF_CATS = {
  pilots: { n: 'Pilotos', pl: 'los pilotos', sal: 112000, hire: 15000, wk: 6, i: 'cap' },
  cabin: { n: 'Tripulación de cabina', pl: 'los tripulantes de cabina', sal: 36000, hire: 3000, wk: 3, i: 'users' },
  mech: { n: 'Mecánicos', pl: 'los mecánicos', sal: 56000, hire: 5000, wk: 4, i: 'wrench' },
  ground: { n: 'Personal de tierra', pl: 'el personal de tierra', sal: 30000, hire: 1200, wk: 1, i: 'bag' }
};
E.STAFF_KEYS = Object.keys(E.STAFF_CATS);

E.LIVERIES = { moderna: 'Moderna', clasica: 'Clásica (cheatline)', audaz: 'Audaz', retro: 'Retro 70s', minimal: 'Minimalista' };
E.LOGOS = { ala: 'Ala', estrella: 'Estrella', sol: 'Sol', condor: 'Cóndor', globo: 'Globo', flecha: 'Flecha', onda: 'Onda', cruz: 'Cruz del Sur', inicial: 'Inicial' };
E.PALETTE = ['#c8102e', '#e35d2a', '#f2a900', '#2a9d8f', '#0b7a4b', '#1f5fa8', '#0a2f6b', '#5b2a86', '#b83280', '#111827', '#7a8794', '#8b5e34', '#00a3c4', '#d4af37', '#e9eef5', '#243b55'];

E.newGame = (o) => {
  const U = E.U;
  const scn = E.SCN[o.scn] || E.SCN.free;
  const diff = E.DIFFS[o.diff || 'normal'];
  const year = scn.free ? (o.year || 2000) : scn.y;
  const t0 = U.tOf(year, scn.free ? 0 : scn.m, 1, 6);
  const home = E.AP[o.home];
  const G = {
    v: 3, t: t0, t0, speed: 0, lastDay: U.dayIdx(t0), lastMonth: null, ids: 0,
    scn: scn.id, diff: o.diff || 'normal',
    settings: Object.assign({ sim: 'real', pauseEvents: true, sound: true, theme: 'dark', autoMaint: true, autoStaff: true, crises: true, hist: true, labels: true, indexPrices: true, indexWages: false }, scn.settings || {}, o.settings || {}),
    airline: { name: o.name || 'Aerolínea', code: (o.code || 'XX').toUpperCase(), p: o.p || '#1f5fa8', s: o.s || '#f2a900', livery: o.livery || 'moderna', logo: o.logo || 'ala', home: home.iata, cc: home.cc, region: home.region, model: o.model || scn.model, founded: t0 },
    cash: 0,
    bases: {}, fleet: [], orders: [], used: [], routes: [], markets: {}, slots: {},
    staff: {}, svc: {}, research: { done: {}, cur: null, queue: [] },
    mkt: { campaigns: [], aw: {}, alliance: null, loyalty: false },
    fin: { loans: [], hedges: [], ins: 'std', cur: E.newLedger(), hist: [], qProfit: 0, taxLoss: 0, stock: { listed: false, shares: 100e6, own: 1, price: 0, hist: [], payout: 0, sat: 60 }, rating: 'BBB', neg: 0 },
    econ: { fuel: E.EC.fuelTrend(year), fuelN: 0, cycle: 1, cpi: 1, infl: scn.inflation || 0, security: year >= 2002 ? 3.5 : 0, carbon: year >= 2012 ? 0.035 : 0, cycleV: 0 },
    rep: { punct: 78, safety: 72, service: 55, value: 60, bags: 78, image: 50, overall: 60, otp: 0.85, otpN: 0 },
    flights: [], weather: { cells: [] }, mods: [], offers: [], subsidies: [],
    ev: { queue: [], cd: {}, hist: {}, last: t0 }, inbox: [], news: [],
    stats: { pax: 0, flights: 0, km: 0, incidents: 0, accidents: 0, emerg: 0, ach: {}, yearPax: {}, peakFleet: 0 },
    wk: { pax: 0, seats: 0, ontime: 0, fl: 0 },
    flags: {}, over: null, won: null, tut: { step: 0, done: false }
  };
  G.bases[home.iata] = { since: t0, lounge: 0, hangar: 0 };
  if (home.slot >= 2) G.slots[home.iata] = [0, 0, 40, 21][home.slot]; // derechos históricos en la base
  (scn.research || []).forEach(r => G.research.done[r] = true);
  // tecnologías estándar de la época
  [['crs', 1976], ['cat3', 1986], ['gds', 1993], ['ife', 1990], ['web', 2004], ['fuelmgmt', 1996]].forEach(([r, y]) => { if (year >= y) G.research.done[r] = true; });
  // servicios según modelo de negocio
  const M = E.MODELS[G.airline.model];
  G.svc = { cateringY: M.svc.cateringY, cateringJ: M.svc.cateringJ, cateringF: 'gourmet', ife: year >= 1975 ? 'audio' : 'none', wifi: 'none', amenity: 'basic', comp: 'standard', bag: M.fees.bag, carry: M.fees.carry, seat: M.fees.seat, prio: M.fees.prio, overbook: G.airline.model === 'legacy' ? 0.02 : 0.04, alcohol: true };
  if (G.airline.model === 'lcc' || G.airline.model === 'ulcc') G.svc.ife = 'none';
  // personal
  E.STAFF_KEYS.forEach(k => G.staff[k] = { n: 0, train: [], salary: 1, tlevel: 2, morale: scn.morale || 70, fatigue: 25, cpiPaid: 1, out: false });
  // notoriedad
  Object.keys(E.REGIONS).forEach(r => G.mkt.aw[r] = r === home.region ? 22 : 3);
  // caja
  G.cash = Math.round(scn.cash * (scn.free ? diff.cash : (o.diff === 'easy' ? 1.6 : o.diff === 'hard' ? 0.7 : 1)));
  if (scn.free && o.cash) G.cash = o.cash;
  // flota inicial
  (scn.fleet || []).forEach(fd => {
    for (let i = 0; i < fd.n; i++) {
      const age = U.rand(fd.age[0], fd.age[1]);
      const ac = E.F.create(G, fd.t, { built: year - age, cond: U.rand(fd.cond[0], fd.cond[1]), own: fd.own, loc: home.iata });
      if (fd.own === 'lease') { ac.lease = { mo: E.F.leaseRate(G, fd.t, age), until: t0 + U.randi(36, 84) * 730, dep: 0 }; }
      G.fleet.push(ac);
    }
  });
  (scn.loans || []).forEach(l => { const L = E.EC.makeLoan(G, l.amt, l.rate, l.months); if (G.econ.infl > 0) { L.idx = true; L.cpi = 1; L.label = 'Deuda en dólares'; } G.fin.loans.push(L); });
  // reputación especial
  if (scn.id === 'bankrupt89') Object.assign(G.rep, { punct: 58, safety: 58, service: 42, image: 34, bags: 62 });
  if (scn.id === 'gulf04') Object.assign(G.rep, { service: 66, image: 60 });
  // rutas automáticas
  if (scn.autoRoutes) E.autoNetwork(G, scn.autoRoutes);
  // personal inicial al 105% de lo requerido
  const req = E.ST.required(G);
  E.STAFF_KEYS.forEach(k => G.staff[k].n = Math.ceil(req[k] * 1.05 + (k === 'pilots' ? 4 : 2)));
  // eventos históricos ya ocurridos no se disparan
  E.HIST.forEach(h => { if (U.tOf(h.y, h.m, h.d) < t0) G.ev.hist[h.id] = true; });
  // mods permanentes de eventos pasados importantes
  if (year > 1979) { E.X.mod(G, { k: 'fare', scope: { region: 'NA' }, v: 0.88, days: 99999, label: 'Desregulación' }); E.X.mod(G, { k: 'demand', scope: { region: 'NA' }, v: 1.1, days: 99999, label: 'Desregulación' }); }
  if (year > 1993) E.X.mod(G, { k: 'demand', scope: { region: 'EU' }, v: 1.08, days: 99999, label: 'Mercado único' });
  if (year > 2003) E.X.mod(G, { k: 'grounded', scope: { type: 'CONC' }, days: 99999, label: 'Fin del soporte técnico' });
  if (year >= 2023) E.X.mod(G, { k: 'closed', scope: { ccs: ['UA', 'RU'] }, days: 99999, label: 'Espacio aéreo cerrado' });
  E.F.refreshUsed(G, true);
  E.W.init(G);
  E.EC.daily(G);
  G.lastMonth = U.year(G.t) * 12 + U.month(G.t);
  E.X.inbox(G, 'Bienvenida', `Bienvenido a ${G.airline.name}. Tu base principal es ${home.city} (${home.iata}). ${scn.desc}`, 'info');
  if (G.econ.infl > 0) E.X.inbox(G, 'Cuidado con la inflación', `Los precios suben ${E.U.pct(G.econ.infl)} por mes. Tus tarifas y salarios se licúan si no los indexás: revisá Rutas → Tarifas y Personal, o activá la indexación automática en Ajustes.`, 'warn');
  return G;
};

E.newLedger = () => ({ rev: {}, cost: {}, pax: 0, fl: 0, seats: 0, ontime: 0, ask: 0, rpk: 0 });

// genera una red inicial razonable desde la base con la flota disponible
E.autoNetwork = (G, n) => {
  const home = G.airline.home;
  const idle = () => G.fleet.filter(a => !a.route && a.status === 'active');
  const cands = E.AIRPORTS.filter(b => b.iata !== home && E.R.allowed(G, home, b.iata).ok)
    .map(b => ({ b, p: E.D.estimate(G, home, b.iata).potential }))
    .sort((x, y) => y.p - x.p);
  let made = 0;
  for (const c of cands) {
    const list = idle();
    if (!list.length || made >= Math.max(n, 1) + list.length) break;
    const d = E.U.dist(E.AP[home], c.b);
    // el avión más chico que alcance y cuya capacidad no supere demasiado la demanda
    const ok = list.filter(a => E.F.canFly(G, a, home, c.b.iata).ok && d < E.AC[a.type].rng * 0.92);
    if (!ok.length) continue;
    ok.sort((a, b) => Math.abs(E.F.seats(a).total - c.p * 0.45) - Math.abs(E.F.seats(b).total - c.p * 0.45));
    const ac = ok[0];
    const r = E.R.create(G, home, c.b.iata, true);
    if (!r) continue;
    const seats = Math.max(1, E.F.seats(ac).total);
    const f = E.U.clamp(Math.round(c.p * 0.5 * 7 / seats), 2, Math.min(E.FL.maxFreq(G, ac, r), 21));
    E.FL.assign(G, ac, r, f, true);
    made++;
  }
  G.routes.forEach(r => E.D.routeDemand(G, r));
};

/* ---------- Guardado ---------- */
E.SAVE = {
  key: s => 'estela.save.' + s,
  list() {
    const out = [];
    ['auto', '1', '2', '3'].forEach(s => {
      try {
        const raw = localStorage.getItem(this.key(s) + '.meta');
        if (raw) out.push(Object.assign({ slot: s }, JSON.parse(raw)));
      } catch (e) { }
    });
    return out;
  },
  save(G, slot = 'auto') {
    try {
      const data = JSON.stringify(G, (k, v) => k[0] === '_' ? undefined : typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1e4) / 1e4 : v);
      localStorage.setItem(this.key(slot), data);
      localStorage.setItem(this.key(slot) + '.meta', JSON.stringify({ name: G.airline.name, code: G.airline.code, date: E.U.fmtDate(G.t), real: Date.now(), cash: G.cash, fleet: G.fleet.length, p: G.airline.p, scn: E.SCN[G.scn] ? E.SCN[G.scn].n : '' }));
      localStorage.setItem('estela.last', slot);
      return true;
    } catch (e) { console.warn('No se pudo guardar', e); E.bus.emit('saveFail', e); return false; }
  },
  load(slot) {
    try {
      const raw = localStorage.getItem(this.key(slot));
      if (!raw) return null;
      return E.SAVE.migrate(JSON.parse(raw));
    } catch (e) { console.warn(e); return null; }
  },
  remove(slot) { try { localStorage.removeItem(this.key(slot)); localStorage.removeItem(this.key(slot) + '.meta'); } catch (e) { } },
  migrate(G) {
    G.settings = Object.assign({ sim: 'real', pauseEvents: true, sound: true, theme: 'dark', autoMaint: true, autoStaff: true, crises: true, hist: true, labels: true }, G.settings || {});
    G.flags = G.flags || {}; G.offers = G.offers || []; G.subsidies = G.subsidies || [];
    return G;
  },
  exportText(G) { return JSON.stringify(G); },
  importText(txt) { const G = JSON.parse(txt); if (!G || !G.airline || !G.fleet) throw new Error('Archivo inválido'); return E.SAVE.migrate(G); }
};
