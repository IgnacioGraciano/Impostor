/* ESTELA · programación y simulación de vuelos */
'use strict';
E.FL = (() => {
  const U = E.U;
  const FL = {};
  FL.minTurn = (G, t) => t.turn * (G.research.done.quickturn ? 0.8 : 1) * (G.airline.model === 'lcc' || G.airline.model === 'ulcc' ? 0.85 : 1) * (G.staff.ground.out ? 1 : U.clamp(1.6 - E.ST.ratio(G, 'ground') * 0.6, 1, 1.4));
  FL.WEEK_H = 119; // horas de vuelo disponibles por semana (≈17 h/día)
  FL.cycleH = (G, ac, r) => { const t = E.AC[ac.type]; return E.F.blockTime(G, ac, r, true) + E.F.blockTime(G, ac, r, false) + 2 * FL.minTurn(G, t); };
  FL.maxFreq = (G, ac, r) => Math.max(1, Math.floor(FL.WEEK_H / FL.cycleH(G, ac, r)));
  FL.routeAc = (G, r) => G.fleet.filter(a => a.route === r.id);
  FL.routeFreq = (G, r) => FL.routeAc(G, r).reduce((s, a) => s + (a.status !== 'delivery' ? a.freq : 0), 0);

  FL.assign = (G, ac, r, freq, grant) => {
    const chk = E.F.canFly(G, ac, r.a, r.b);
    if (!chk.ok) return { ok: false, why: chk.why[0] };
    freq = U.clamp(Math.round(freq), 1, FL.maxFreq(G, ac, r));
    if (grant) E.R.slotCheck(G, r, ac.route === r.id ? freq - ac.freq : freq).forEach(s => G.slots[s.iata] = s.need);
    const slots = E.R.slotCheck(G, r, ac.route === r.id ? freq - ac.freq : freq);
    if (slots.length) return { ok: false, why: `Faltan slots en ${slots.map(s => s.iata + ' (' + s.held + '/' + s.need + ')').join(', ')}`, slots };
    if (ac.route && ac.route !== r.id) FL.unassign(G, ac, true);
    ac.route = r.id; ac.freq = freq;
    ac.period = 168 / freq;
    if (G.settings.autoStaff && G.staff.pilots) { const req = E.ST.required(G); E.STAFF_KEYS.forEach(k => { if (!(k === 'ground' && G.staff.ground.out) && G.staff[k].n < req[k]) E.ST.hire(G, k, Math.ceil(req[k] * 1.03 - G.staff[k].n), 'exp'); }); }
    // horario: primera salida a la mañana local de la base + desfase por avión
    const A = E.AP[r.a];
    const off = U.hash(ac.id + r.id) * Math.min(ac.period, 14);
    const lh = U.localHour(G.t, A.lon);
    let first = G.t + ((6 + off - lh) % 24 + 24) % 24;
    if (first - G.t > ac.period) first -= Math.floor((first - G.t) / ac.period) * ac.period;
    ac.slotOut = Math.max(G.t + 0.5, first);
    if (!ac.fl) {
      if (ac.loc === r.a) { ac.out = true; ac.next = ac.slotOut; }
      else if (ac.loc === r.b) { ac.out = false; ac.next = G.t + 0.5; ac.slotOut = G.t + 0.5 + E.F.blockTime(G, ac, r, false) + FL.minTurn(G, E.AC[ac.type]); }
      else FL.ferry(G, ac, r.a, G.t + 0.4, 'Posicionamiento');
    }
    return { ok: true, freq };
  };
  FL.unassign = (G, ac) => { ac.route = null; ac.freq = 0; ac.next = 0; };

  FL.path = (f) => {
    if (!f._path) f._path = U.gcPath(f.from || E.AP[f.o], E.AP[f.d]);
    return f._path;
  };
  // posición en el mapa
  FL.pos = (G, f, t) => {
    const p = FL.path(f);
    const air = f.air;
    const el = t - f.dep;
    if (el < 0) return null;
    const dest = E.AP[f.d];
    if (el > air) {
      // circuito de espera sobre el destino
      const ang = (el - air) * 9;
      const R = 0.35;
      const lat = dest.lat + Math.sin(ang) * R * 0.6, lon = dest.lon + Math.cos(ang) * R / Math.max(0.3, Math.cos(dest.lat * U.DEG));
      return { lon, lat, hdg: (ang * 180 / Math.PI + 90) % 360, phase: 'hold', frac: 1, alt: 0.35 };
    }
    const fr = U.clamp(el / air, 0, 1);
    const x = fr * (p.length - 1), i = Math.min(p.length - 2, Math.floor(x)), k = x - i;
    const a = p[i], b = p[i + 1];
    const lon = a[0] + (b[0] - a[0]) * k, lat = a[1] + (b[1] - a[1]) * k;
    const dy = U.projY(b[1]) - U.projY(a[1]), dx = b[0] - a[0];
    const hdg = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
    const climb = Math.min(1, el / 0.33), desc = Math.min(1, (air - el) / 0.4);
    const alt = Math.min(climb, desc);
    return { lon, lat, hdg, frac: fr, phase: climb < 1 ? 'climb' : desc < 1 ? 'desc' : 'cruise', alt, idx: x };
  };

  FL.flightNo = (G, r, out, ac) => G.airline.code + (r.fn + (out ? 1 : 2) + (FL.routeAc(G, r).indexOf(ac) * 2) % 8);

  /* ----- Economía de un tramo (determinista, para UI y simulación) ----- */
  FL.legEcon = (G, ac, r, out, opt = {}) => {
    const t = E.AC[ac.type];
    const o = out ? r.a : r.b, d = out ? r.b : r.a;
    const O = E.AP[o], Dd = E.AP[d];
    const dir = out ? 0 : 1;
    const dem = r.dem || E.D.routeDemand(G, r);
    const fpd = Math.max(0.15, (dem.freqW || FL.routeFreq(G, r)) / 7);
    const seats = E.F.seats(ac);
    const pk = E.F.payloadK(G, ac, r.d);
    const ob = G.svc.overbook;
    const noise = opt.noise || (() => 1);
    const pax = { y: 0, p: 0, j: 0, f: 0 }; let denied = 0;
    ['y', 'p', 'j', 'f'].forEach(k => {
      if (!seats[k]) return;
      const mean = dem[k][dir] / fpd * noise();
      const booked = Math.min(mean, seats[k] * (1 + ob));
      const show = booked * (1 - (k === 'y' ? 0.055 : 0.09));
      const cap = Math.floor(seats[k] * (k === 'y' ? Math.min(1, pk * 1.05) : 1));
      pax[k] = Math.max(0, Math.floor(Math.min(show, cap)));
      denied += Math.max(0, show - seats[k]);
    });
    const paxN = pax.y + pax.p + pax.j + pax.f;
    const cargoCap = E.F.cargoCap(G, ac, r.d);
    const cargo = Math.min(cargoCap, dem.c[dir] / fpd * noise() * (t.freighter ? 1 : 0.9));
    const block = E.F.blockTime(G, ac, r, out);
    const hours = block;
    const lf = seats.total ? paxN / seats.total : (cargoCap ? cargo / cargoCap : 0);
    // combustible
    const ff = E.F.fuelFactor(G, ac, r.plan.ci);
    const wind = E.W.routeWind(G, o, d);
    const windK = (t.spd) / Math.max(t.spd * 0.6, t.spd + wind * (t.prop ? 0.7 : 1));
    const loadK = 0.9 + 0.16 * (paxN * 0.1 + cargo) / Math.max(1, t.payloadMax);
    const extra = { min: 0.0, std: 0.04, cons: 0.09 }[r.plan.fuel];
    let fuelKg = t.burn * r.d * windK * loadK * ff * (1 + extra * 0.035 * hours) + t.burn * 120 * (t.engines / 2);
    let fuelP = E.EC.fuelPrice(G, o);
    let fuelCost = fuelKg * fuelP;
    if (r.plan.tank && out) {
      const pd = E.EC.fuelPrice(G, d);
      if (pd > fuelP * 1.04) fuelCost -= fuelKg * (pd - fuelP) * (1 - 0.035 * hours * 1.6) * 0.95;
    }
    const euC = (O.region === 'EU' || Dd.region === 'EU') && G.econ.carbon ? fuelKg * G.econ.carbon * (G.research.done.saf ? 0.5 : 1) * G.econ.cpi : 0;
    // tasas y servicios
    const cpi = G.econ.cpi;
    const feeK = E.X.modMult(G, 'fees', { iata: d, cc: Dd.cc }) * 0.5 + E.X.modMult(G, 'fees', { iata: o, cc: O.cc }) * 0.5;
    const landing = (60 + 6 * t.mtow) * (1 + 0.12 * Dd.size) * feeK * cpi;
    const paxFees = paxN * (2 + O.size * 0.8 + G.econ.security) * feeK * cpi;
    const handling = (150 + seats.total * 2 + cargo * 30) * (G.staff.ground.out ? 1.6 : 0.75) * cpi;
    const nav = 0.55 * r.d * Math.sqrt(t.mtow / 50) * cpi;
    const S = G.svc;
    const cat = E.SVC;
    const catK = E.X.modMult(G, 'catering', {});
    let catering = 0, anc = 0;
    catering += (pax.y + pax.p) * (cat.cateringY[S.cateringY].c + cat.cateringY[S.cateringY].ch * hours) * catK;
    if (S.cateringY === 'bob') anc += (pax.y + pax.p) * (cat.cateringY.bob.rev + 0.8 * hours);
    catering += pax.p * 6 * catK;
    catering += pax.j * (cat.cateringJ[S.cateringJ].c + cat.cateringJ[S.cateringJ].ch * hours + cat.amenity[S.amenity].c * (hours > 5 ? 1 : 0.3)) * catK;
    catering += pax.f * (cat.cateringF[S.cateringF].c + cat.cateringF[S.cateringF].ch * hours + cat.amenity[S.amenity].c * 2) * catK;
    if (!S.alcohol) catering *= 0.92;
    catering += seats.total * cat.ife[S.ife].run * hours + paxN * cat.wifi[S.wifi].run * hours * 0.4;
    catering *= cpi;
    // ingresos auxiliares
    const y = pax.y + pax.p;
    const ancK = (G.research.done.app ? 1.12 : 1) * cpi;
    anc += y * (S.bag * 0.55 * Math.exp(-S.bag / 65) + S.carry * 0.42 * Math.exp(-S.carry / 45) + S.seat * 0.32 * Math.exp(-S.seat / 22) + S.prio * 0.14 * Math.exp(-S.prio / 16));
    if (S.wifi === 'paid') anc += paxN * 0.1 * 9;
    anc *= ancK;
    // pasajes
    const yieldK = 0.95 * (G.research.done.yield ? 1.04 : 1) * (G.research.done.dyn ? 1.05 : 1);
    const sk = r.seasonal ? 1 + (E.D.season(O, Dd, U.month(G.t)) - 1) * 0.8 : 1;
    const ticket = (pax.y * r.price.y + pax.p * r.price.p + pax.j * r.price.j + pax.f * r.price.f) * yieldK * sk;
    const distr = ticket * (G.research.done.web ? 0.035 : G.research.done.gds ? 0.085 : 0.07);
    const cargoRev = cargo * r.d * E.D.cargoRate(G, r.d) * (r.cargoP || 1);
    // mantenimiento por hora de bloque
    const age = E.F.age(G, ac);
    const hangar = G.bases[ac.base] && G.bases[ac.base].hangar;
    const maint = t.maint * hours * U.clamp(0.62 + age * 0.032, 0.62, 1.7) * (hangar ? 0.78 : 1) * E.F.MPOL[G.mpol || 'std'].cost * (G.research.done.predictive ? 0.93 : 1) * cpi;
    const crewHotel = hours > 4.5 ? (t.crew + Math.ceil(seats.total / 50)) * 140 * cpi : 0;
    const comp = denied * 350 * cpi * E.SVC.comp[S.comp].k;
    const rev = ticket + anc + cargoRev;
    const cost = fuelCost + euC + landing + paxFees + handling + nav + catering + maint + crewHotel + distr + comp;
    return { pax, paxN, denied, cargo, lf, block, fuelKg, fuelCost, carbon: euC, landing, paxFees, handling, nav, catering, maint, crewHotel, distr, comp, ticket, anc, cargoRev, rev, cost, profit: rev - cost, seats };
  };

  /* ----- Ferry / posicionamiento ----- */
  FL.ferry = (G, ac, to, depT, why, from) => {
    const t = E.AC[ac.type];
    const o = from ? null : ac.loc;
    const A = from || E.AP[o], B = E.AP[to];
    const d = U.dist(A, B);
    const air = d / t.spd + 0.25;
    const f = { id: U.uid(G, 'f'), ac: ac.id, r: null, o: o || to, from: from || null, d: to, fn: G.airline.code + (why === 'Desvío' ? 'DIV' : 'FRY'), sd: depT, dep: depT, air, hold: 0, arr: depT + air, pax: { y: 0, p: 0, j: 0, f: 0 }, cargo: 0, out: true, ferry: why || 'Posicionamiento', delay: 0, kind: 'ferry' };
    const fuelKg = t.burn * d * 0.85;
    E.X.cash(G, -fuelKg * E.EC.fuelPrice(G, o || to), 'fuel');
    E.X.cash(G, -((60 + 6 * t.mtow) * (1 + 0.12 * B.size) + 0.55 * d * Math.sqrt(t.mtow / 50)) * G.econ.cpi, 'airport');
    G.flights.push(f);
    ac.fl = f.id; ac.loc = null;
    return f;
  };

  /* ----- Salida de un vuelo regular ----- */
  FL.cancel = (G, ac, r, why, planned) => {
    const w = r.stats.w;
    if (!planned) { w.canc++; G.wk.canc = (G.wk.canc || 0) + 1; }
    FL.advance(G, ac, r, true);
    if (!planned && U.chance(0.02)) E.X.inbox(G, 'Vuelo cancelado', `${FL.flightNo(G, r, ac.out, ac)} (${ac.out ? r.a + '→' + r.b : r.b + '→' + r.a}): ${why}.`, 'warn');
  };
  // avanza el horario del avión a la próxima salida
  FL.advance = (G, ac, r, cancelled) => {
    const t = E.AC[ac.type];
    if (cancelled) {
      // el avión se queda donde está; la próxima salida es el siguiente horario
      if (ac.out) { ac.slotOut += ac.period; ac.next = ac.slotOut; }
      else { ac.next = G.t + Math.min(ac.period, 6); ac.schedNext = ac.next; }
      return;
    }
  };
  FL.depart = (G, ac) => {
    const r = G.routes.find(x => x.id === ac.route);
    if (!r) { FL.unassign(G, ac); return; }
    const t = E.AC[ac.type];
    const out = ac.out;
    const o = out ? r.a : r.b, d = out ? r.b : r.a;
    if (ac.loc !== o) { // fuera de posición
      if (ac.loc) FL.ferry(G, ac, o, G.t + 0.3, 'Posicionamiento');
      return;
    }
    const sched = out ? ac.slotOut : (ac.schedNext || ac.next);
    // ----- cancelaciones -----
    if (E.X.isClosed(G, o) || E.X.isClosed(G, d)) return FL.cancel(G, ac, r, 'espacio aéreo cerrado', true);
    if (E.X.groundedType(G, t)) { ac.status = 'grounded'; ac.why = 'Suspensión de la autoridad'; ac.until = G.t + 24; return FL.cancel(G, ac, r, 'tipo suspendido', true); }
    const strikeP = E.X.strikeLevel(G);
    if (strikeP > 0 && U.chance(strikeP)) return FL.cancel(G, ac, r, 'huelga');
    const crewR = Math.min(E.ST.ratio(G, 'pilots'), E.ST.ratio(G, 'cabin') + 0.05);
    if (crewR < 0.9 && U.chance((0.9 - crewR) * 2.2)) return FL.cancel(G, ac, r, 'falta de tripulación');
    const wo = E.W.at(G, o);
    if (wo.k === 'cyclone' && wo.sev > 0.4) return FL.cancel(G, ac, r, 'ciclón en ' + o, true);
    const condM = 1 + Math.max(0, 78 - ac.cond) / 11 + (E.F.overdue(G, ac) ? 1.5 : 0);
    if (U.chance(0.0007 * condM * E.X.modMult(G, 'incident', { type: ac.type }))) {
      const days = U.randi(1, 3);
      const cost = E.AC[ac.type].price * 1e6 * U.rand(0.0008, 0.003) * G.econ.cpi;
      E.X.cash(G, -cost, 'maint');
      ac.status = 'grounded'; ac.why = 'Avería (AOG)'; ac.until = G.t + days * 24;
      ac.cond = Math.min(100, ac.cond + 4);
      G.stats.incidents++;
      E.X.rep(G, 'safety', -0.15);
      E.X.inbox(G, 'Avión en tierra (AOG)', `${t.short} ${ac.reg} quedó en tierra en ${o} por una avería. Reparación: ${days} día(s), ${U.money(cost)}.`, 'warn');
      return FL.cancel(G, ac, r, 'avería técnica');
    }
    // ----- demoras en origen (min) -----
    let delay = Math.max(0, (G.t - sched) * 60);
    const ex = U.rand(0, 1);
    delay += -Math.log(1 - ex * 0.999) * 5; // base aleatoria
    delay += E.AP[o].slot * U.rand(0, 7);
    delay += E.X.modMult(G, 'delay', { iata: o, cc: E.AP[o].cc, region: E.AP[o].region }, true);
    if (wo.k === 'storm') delay += U.rand(15, 80) * wo.sev;
    if (wo.k === 'snow') delay += U.rand(15, 55) * wo.sev;
    if (wo.k === 'fog') delay += U.rand(5, 30);
    if (U.chance(0.022 + Math.max(0, 85 - ac.cond) * 0.0012)) delay += U.rand(20, 130);
    if (!G.staff.ground.out) delay += Math.max(0, 1 - E.ST.ratio(G, 'ground')) * U.rand(10, 60);
    delay += Math.max(0, G.staff.pilots.fatigue - 60) * U.rand(0, 0.6);
    // ----- economía del tramo -----
    const ec = FL.legEcon(G, ac, r, out, { noise: () => U.rand(0.86, 1.12) });
    // ----- arribo previsto, espera y desvío -----
    const wd = E.W.at(G, d, G.t + ec.block);
    let hold = E.AP[d].slot * U.rand(0, 0.12) + E.X.modMult(G, 'delay', { iata: d, cc: E.AP[d].cc, region: E.AP[d].region }, true) / 120;
    let divert = false, why = '';
    const advW = G.research.done.weather ? 0.7 : 1;
    if (wd.k === 'storm') { hold += U.rand(0.1, 0.6) * wd.sev; if (U.chance(0.05 * wd.sev * advW * (r.plan.fuel === 'min' ? 2.2 : r.plan.fuel === 'cons' ? 0.6 : 1))) { divert = true; why = 'tormentas en ' + d; } }
    if (wd.k === 'snow') hold += U.rand(0.1, 0.4) * wd.sev;
    if (wd.k === 'cyclone') { divert = true; why = 'ciclón en ' + d; }
    if (wd.k === 'fog') {
      const cat3 = ac.upg.cat3 && G.research.done.cat3;
      if (!cat3) { hold += U.rand(0.2, 0.6); if (U.chance(0.45 * wd.sev * advW)) { divert = true; why = 'niebla en ' + d + ' (sin CAT III)'; } }
      else hold += U.rand(0, 0.15);
    }
    if (wd.k === 'wind' && (t.cat === 'rp' || t.cat === 'rj') && U.chance(0.12 * wd.sev * advW)) { divert = true; why = 'viento cruzado en ' + d; }
    if (r.plan.fuel === 'min' && hold > 0.45 && !divert && U.chance(0.3)) { divert = true; why = 'combustible mínimo en espera'; }
    const air = Math.max(0.3, ec.block - 0.35);
    const dep = G.t;
    const f = {
      id: U.uid(G, 'f'), ac: ac.id, r: r.id, o, d, fn: FL.flightNo(G, r, out, ac), sd: sched, dep, air, hold, arr: dep + air + hold,
      pax: ec.pax, cargo: ec.cargo, out, delay, blk: ec.block, kind: 'reg', lf: ec.lf
    };
    if (divert) { f.div = r.plan.alt && r.plan.alt !== o ? r.plan.alt : E.R.altFor(d, o); f.divWhy = why; }
    // ----- contabilidad -----
    E.X.cash(G, ec.ticket, 'ticket'); E.X.cash(G, ec.anc, 'anc'); E.X.cash(G, ec.cargoRev, 'cargo');
    E.X.cash(G, -ec.fuelCost, 'fuel'); E.X.cash(G, -ec.carbon, 'carbon');
    E.X.cash(G, -(ec.landing + ec.paxFees + ec.handling), 'airport'); E.X.cash(G, -ec.nav, 'nav');
    E.X.cash(G, -ec.catering, 'svc'); E.X.cash(G, -ec.maint, 'maint'); E.X.cash(G, -(ec.crewHotel + ec.distr), 'other'); E.X.cash(G, -ec.comp, 'comp');
    const L = G.fin.cur;
    L.pax += ec.paxN; L.fl++; L.seats += ec.seats.total; L.ask += ec.seats.total * r.d; L.rpk += ec.paxN * r.d;
    const w = r.stats.w;
    w.pax += ec.paxN; w.seats += ec.seats.total; w.rev += ec.rev; w.cost += ec.cost; w.fl++; w.cargo += ec.cargo; w.paxJ += ec.pax.j + ec.pax.f; w.seatsJ += ec.seats.j + ec.seats.f;
    f.rev = ec.rev; f.cost = ec.cost;
    ac.mo.fl++; ac.mo.pax += ec.paxN; ac.mo.rev += ec.rev; ac.mo.cost += ec.cost;
    ac.life.fl++; ac.life.pax += ec.paxN; ac.life.rev += ec.rev; ac.life.cost += ec.cost;
    G.stats.pax += ec.paxN; G.stats.flights++; G.stats.km += r.d;
    const yr = U.year(G.t); G.stats.yearPax[yr] = (G.stats.yearPax[yr] || 0) + ec.paxN;
    G.wk.pax += ec.paxN; G.wk.seats += ec.seats.total; G.wk.fl++;
    // equipaje perdido
    const bagRate = 0.0055 * (G.staff.ground.out ? 1.25 : U.clamp(1.8 - E.ST.ratio(G, 'ground') * 0.8, 1, 2)) * (G.flags.bagSystem ? 0.6 : 1) * (1.15 - G.staff.ground.tlevel * 0.15) * (E.AP[o].size >= 5 ? 1.3 : 1);
    const lost = ec.paxN * bagRate * U.rand(0.5, 1.5);
    if (lost > 0) { E.X.cash(G, -lost * 95 * G.econ.cpi * E.SVC.comp[G.svc.comp].k, 'comp'); }
    G.rep.bags += ((1 - bagRate * 40) * 100 - G.rep.bags) * 0.0015 * Math.min(4, ec.paxN / 100);
    // satisfacción
    const hours = ec.block;
    let sat = 0, sw = 0;
    ['y', 'p', 'j', 'f'].forEach(k => { if (ec.pax[k]) { const q = E.D.quality(G, ac, k, hours); sat += q * ec.pax[k] * (k === 'y' ? 1 : 2.5); sw += ec.pax[k] * (k === 'y' ? 1 : 2.5); } });
    if (sw) {
      sat /= sw;
      if (ec.denied > 0) sat -= 0.05;
      const fees = (G.svc.bag + G.svc.carry * 1.5 + G.svc.seat) / Math.max(30, r.price.y);
      sat -= Math.min(0.15, fees * 0.25) * (1 - (r.dem ? r.dem.lowcost : 0) * 0.6);
      f.sat = sat;
      G.rep.service += (sat * 100 - G.rep.service) * 0.0012 * Math.min(4, ec.paxN / 100);
      const val = U.clamp(1.25 - r.price.y / Math.max(1, (r.dem ? r.dem.ref.y : r.price.y)) * 0.5, 0, 1);
      G.rep.value += (val * 100 - G.rep.value) * 0.0008 * Math.min(4, ec.paxN / 100);
    }
    // ----- desgaste -----
    E.F.wear(G, ac, ec.block);
    ac.cycles++;
    // ----- emergencias e incidentes graves -----
    FL.rollIncidents(G, ac, f, r, wd, wo);
    G.flights.push(f);
    ac.fl = f.id; ac.loc = null;
    ac.delay = delay;
    // horario siguiente
    if (out) ac.slotOut = sched;
    return f;
  };

  FL.rollIncidents = (G, ac, f, r, wd, wo) => {
    const t = E.AC[ac.type];
    const yf = U.yearF(G.t);
    const era = U.table({ 1960: 5, 1975: 3.5, 1990: 2, 2005: 1.2, 2020: 0.9 }, yf);
    const condM = 1 + Math.max(0, 75 - ac.cond) / 12 + (E.F.overdue(G, ac) ? 1.2 : 0);
    const engM = 1 + Math.max(0, 60 - Math.min(...ac.eng)) / 15;
    const fatM = 1 + Math.max(0, G.staff.pilots.fatigue - 50) / 25;
    const trainM = 1.25 - G.staff.pilots.tlevel * 0.12 - (G.research.done.sim ? 0.1 : 0) - (G.research.done.crm ? 0.1 : 0);
    const pred = G.research.done.predictive ? 0.65 : 1;
    const mods = E.X.modMult(G, 'incident', { type: ac.type });
    const sevW = E.W.pathSeverity(G, FL.path(f));
    // emergencias en vuelo (con enfriamiento para no saturar)
    const cool = G.t - (G.ev.lastEmg || 0) > 24 * (G.settings.sim === 'real' ? 12 : 4);
    const pE = 0.00042 * condM * engM * fatM * trainM * era * pred * mods * (1 + sevW * 2);
    if (cool && U.chance(pE)) {
      const list = E.EMERG.filter(e => !(e.weather && sevW < 0.1) || U.chance(0.2));
      const em = U.wpick(list, e => e.w(ac, t) * (e.weather ? 1 + sevW * 5 : 1) * (e.pax ? f.pax.y / 120 + 0.2 : 1));
      if (em) {
        const at = em.climb ? 0.06 : em.landing ? 0.97 : U.rand(0.25, 0.75);
        f.emg = { id: em.id, at: f.dep + f.air * at, eng: U.randi(1, t.engines) };
        G.ev.lastEmg = G.t;
      }
    }
    // turbulencia con heridos
    if (sevW > 0.35 && U.chance(0.01 * sevW * (G.research.done.weather ? 0.5 : 1))) {
      const inj = U.randi(1, 6);
      E.X.cash(G, -inj * 25000 * G.econ.cpi * (1 - E.EC.INS[G.fin.ins].lcover * 0.7), 'comp');
      E.X.rep(G, 'safety', -0.4);
      E.X.inbox(G, 'Turbulencia severa', `El vuelo ${f.fn} atravesó turbulencia severa: ${inj} heridos leves.`, 'warn');
    }
    // accidente (muy raro)
    const accP = 1.4e-7 * condM * condM * fatM * fatM * trainM * era * (ac.upg.egpws ? 0.6 : 1) * (ac.upg.tcas ? 0.8 : 1) * mods * (1 + sevW * 3) * (wd.k === 'fog' && !ac.upg.cat3 ? 2 : 1);
    if (U.chance(accP)) f.accident = U.rand(0.05, 0.95);
  };

  /* ----- Llegada ----- */
  FL.arrive = (G, f) => {
    const ac = G.fleet.find(a => a.id === f.ac);
    G.flights = G.flights.filter(x => x !== f);
    if (!ac) return;
    const r = f.r ? G.routes.find(x => x.id === f.r) : null;
    // accidente
    if (f.accident != null && !f.ferry) { E.X.accident(G, ac, f, r); return; }
    // desvío: espera sobre destino y vuela al alternativo
    if (f.div && !f.ferry) {
      const pax = f.pax.y + f.pax.p + f.pax.j + f.pax.f;
      const cost = pax * (110 + U.rand(0, 120)) * G.econ.cpi * E.SVC.comp[G.svc.comp].k;
      E.X.cash(G, -cost, 'comp');
      G.rep.otp += (0 - G.rep.otp) * 0.004;
      if (r) r.stats.w.div++;
      G.wk.div = (G.wk.div || 0) + 1;
      if (!f.div || !E.AP[f.div]) f.div = E.R.altFor(f.d, f.o);
      const g = FL.ferry(G, ac, f.div, G.t, 'Desvío', { lat: E.AP[f.d].lat, lon: E.AP[f.d].lon });
      g.fn = f.fn; g.pax = f.pax; g.o = f.d;
      g.after = { route: f.r, back: f.d, out: f.out };
      E.X.inbox(G, 'Vuelo desviado', `${f.fn} no pudo aterrizar en ${f.d} (${f.divWhy}) y se desvió a ${f.div}. Costo de atención a pasajeros: ${U.money(cost)}.`, 'warn');
      ac.fl = g.id;
      return;
    }
    ac.fl = null;
    ac.loc = f.d;
    // combustible quemado en circuitos de espera
    if (f.hold > 0.05 && !f.ferry) { const t = E.AC[ac.type]; E.X.cash(G, -f.hold * t.burn * t.spd * 0.55 * E.EC.fuelPrice(G, f.d), 'fuel'); }
    // registro de puntualidad
    if (!f.ferry && r) {
      const arrDelay = Math.max(0, (G.t - (f.sd + f.blk)) * 60);
      const ontime = arrDelay <= 15;
      r.stats.w.ontime += ontime ? 1 : 0;
      G.wk.ontime += ontime ? 1 : 0;
      G.fin.cur.ontime += ontime ? 1 : 0;
      G.rep.otp += ((ontime ? 1 : 0) - G.rep.otp) * 0.004;
      G.rep.otpN = (G.rep.otpN || 0) + 1;
      if (arrDelay > 180) {
        const pax = f.pax.y + f.pax.p + f.pax.j + f.pax.f;
        const eu = E.AP[f.o].region === 'EU' || E.AP[f.d].region === 'EU';
        E.X.cash(G, -pax * (eu && U.yearF(G.t) >= 2005 ? 300 : 60) * G.econ.cpi * E.SVC.comp[G.svc.comp].k * 0.5, 'comp');
      }
    }
    // fin de un desvío: volver a destino original
    if (f.after) {
      const A = f.after;
      if (A.aog) { ac.status = 'grounded'; ac.why = A.why || 'Reparación'; ac.until = G.t + A.aog * 24; ac.out = true; ac.next = ac.until; return; }
      const rr = G.routes.find(x => x.id === A.route);
      if (rr && ac.route === rr.id) {
        if (A.cont) { const g = FL.ferry(G, ac, A.back, G.t + 1.2, 'Continuación'); g.fn = f.fn; g.pax = f.pax; g.cont = { route: A.route, out: A.out }; }
        else FL.ferry(G, ac, A.back, G.t + U.rand(2, 5), 'Reposicionamiento');
      }
      return;
    }
    if (ac.sellAfter) { ac.sellAfter = false; E.F.sell(G, ac); return; }
    if (ac.returnAfter) { ac.returnAfter = false; E.F.returnLease(G, ac); return; }
    if (ac.pendingMaint) { ac.pendingMaint = false; }
    // próxima salida
    if (ac.route) {
      const rr = G.routes.find(x => x.id === ac.route);
      if (!rr) { FL.unassign(G, ac); return; }
      const t = E.AC[ac.type];
      const mt = FL.minTurn(G, t);
      if (f.ferry) {
        // posicionado: definir sentido según dónde quedó
        if (ac.loc === rr.a) { ac.out = true; while (ac.slotOut < G.t + mt) ac.slotOut += ac.period; ac.next = ac.slotOut; }
        else if (ac.loc === rr.b) { ac.out = false; ac.next = G.t + mt; }
        else FL.ferry(G, ac, rr.a, G.t + mt, 'Posicionamiento');
        return;
      }
      const occK = G.research.done.occ ? 0.7 : 1;
      if (f.out) {
        // en la escala: rotación con colchón
        const schedIn = f.sd + f.blk + mt * 1.3;
        ac.out = false;
        ac.next = Math.max(schedIn, G.t + mt * (1 - (1 - occK) * 0.5));
        ac.schedNext = schedIn;
      } else {
        ac.out = true;
        let s = ac.slotOut + ac.period;
        while (s < G.t - ac.period * 0.5) s += ac.period; // horarios perdidos
        ac.slotOut = s;
        ac.next = Math.max(s, G.t + mt * (1 - (1 - occK) * 0.5));
      }
    }
  };
  FL.byId = (G, id) => G.flights.find(f => f.id === id);
  return FL;
})();
