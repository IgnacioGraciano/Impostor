/* ESTELA · personal: dotación requerida, contratación, fatiga, moral y sindicatos */
'use strict';
E.ST = (() => {
  const U = E.U;
  const ST = {};
  ST.TLEVELS = ['Ninguna', 'Básica', 'Estándar', 'Excelente'];
  ST.TCOST = [0, 600, 1800, 4500];
  ST.required = (G) => {
    const req = { pilots: 0, cabin: 0, mech: 0, ground: 0 };
    let depDay = 0, paxDay = 0;
    G.fleet.forEach(ac => {
      if (ac.status === 'delivery') return;
      const t = E.AC[ac.type];
      req.mech += 2.5 + t.seats / 45 + t.engines * 0.8 + (t.cat === 'jb' ? 3 : 0);
      if (!ac.route) return;
      const r = G.routes.find(x => x.id === ac.route);
      if (!r) return;
      const bo = E.F.blockTime(G, ac, r, true), bi = E.F.blockTime(G, ac, r, false);
      const wh = ac.freq * (bo + bi);
      const blk = (bo + bi) / 2;
      const pilots = t.crew + (blk > 12 ? 2 : blk > 8 ? 1 : 0);
      req.pilots += pilots * wh / 17 * 1.12;
      const s = E.F.seats(ac);
      const cc = s.total < 20 ? 0 : Math.ceil(s.total / 50) + (s.j + s.f > 0 ? 1 : 0) + (blk > 8 ? 1 : 0);
      req.cabin += cc * wh / 19 * 1.12;
      depDay += ac.freq * 2 / 7;
      paxDay += ac.freq * 2 / 7 * s.total * 0.8;
    });
    req.ground = G.staff.ground && G.staff.ground.out ? 0 : depDay * 2.4 + paxDay / 220;
    E.STAFF_KEYS.forEach(k => req[k] = Math.ceil(req[k]));
    G.req = req;
    return req;
  };
  ST.ratio = (G, cat) => {
    const req = (G.req || ST.required(G))[cat];
    if (!req) return 1.2;
    return G.staff[cat].n / req;
  };
  ST.salary = (G, cat) => E.STAFF_CATS[cat].sal * G.staff[cat].salary * G.staff[cat].cpiPaid;
  ST.payroll = (G) => {
    let m = 0;
    E.STAFF_KEYS.forEach(k => {
      const s = G.staff[k];
      const n = s.n + s.train.reduce((a, b) => a + b.n, 0);
      m += n * ST.salary(G, k) / 12;
      m += n * ST.TCOST[s.tlevel] * (k === 'pilots' ? 3 : 1) * (G.research.done.training ? 0.7 : 1) * G.econ.cpi / 12;
    });
    return m * E.X.modMult(G, 'payroll', {});
  };
  // con experiencia: disponibles de inmediato pero cuestan el doble; cadetes: baratos, tardan semanas en formarse
  ST.hireCost = (G, cat, n, mode = 'exp') => E.STAFF_CATS[cat].hire * n * G.econ.cpi * (G.research.done.training ? 0.7 : 1) * (mode === 'exp' ? 2 : 0.8);
  ST.hire = (G, cat, n, mode = 'exp') => {
    n = Math.max(0, Math.round(n)); if (!n) return 0;
    const c = ST.hireCost(G, cat, n, mode);
    E.X.cash(G, -c, 'staff');
    if (mode === 'exp') { G.staff[cat].n += n; G.req = null; }
    else G.staff[cat].train.push({ n, until: G.t + E.STAFF_CATS[cat].wk * 7 * 24 });
    return c;
  };
  ST.fire = (G, cat, n) => {
    const s = G.staff[cat];
    n = Math.min(s.n, Math.max(0, Math.round(n)));
    if (!n) return 0;
    const c = n * ST.salary(G, cat) / 4;
    E.X.cash(G, -c, 'staff');
    s.n -= n;
    s.morale = Math.max(0, s.morale - Math.min(25, n / Math.max(1, s.n) * 60));
    return c;
  };
  ST.inTraining = (G, cat) => G.staff[cat].train.reduce((a, b) => a + b.n, 0);
  ST.daily = (G) => {
    const req = ST.required(G);
    E.STAFF_KEYS.forEach(k => {
      const s = G.staff[k];
      // egresos de formación
      s.train = s.train.filter(tr => { if (tr.until <= G.t) { s.n += tr.n; return false; } return true; });
      // contratación automática
      if (G.settings.autoStaff && !(k === 'ground' && s.out)) {
        if (s.n < req[k]) ST.hire(G, k, Math.ceil(req[k] - s.n), 'exp');
        const have = s.n + ST.inTraining(G, k);
        if (have < req[k] * 1.04) ST.hire(G, k, Math.ceil(req[k] * 1.07 - have), 'cadet');
      }
      // fatiga
      const r = req[k] ? s.n / req[k] : 1.3;
      let ft = 22 + Math.max(0, 1 / Math.max(0.3, r) - 1) * 170 - (G.research.done.frms && k !== 'ground' ? 7 : 0);
      if (k === 'ground' && s.out) ft = 20;
      s.fatigue += (U.clamp(ft, 5, 100) - s.fatigue) * 0.1;
      // moral
      const infl = Math.max(0, G.econ.cpi / s.cpiPaid - 1);
      if (G.settings.indexWages && infl > 0.02) { s.cpiPaid = G.econ.cpi; }
      let mt = 58 + (s.salary - 1) * 110 + (s.tlevel - 2) * 4 - Math.max(0, s.fatigue - 40) * 0.6 + (G.rep.overall - 60) * 0.15 - infl * 140;
      if (G.cash < 0) mt -= 10;
      s.morale += (U.clamp(mt, 0, 100) - s.morale) * 0.03;
      s.morale = U.clamp(s.morale, 0, 100);
      // sindicatos
      if (!(k === 'ground' && s.out) && s.morale < 33 && s.n > 10 && U.chance(0.035)) E.X.queue(G, 'union', k);
    });
    if (G.staff.pilots.fatigue > 72 && U.chance(0.03)) E.X.queue(G, 'fatigue');
  };
  ST.indexSalaries = (G) => { E.STAFF_KEYS.forEach(k => G.staff[k].cpiPaid = G.econ.cpi); };
  return ST;
})();
