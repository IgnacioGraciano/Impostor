/* ESTELA · economía: combustible, ciclo, inflación, préstamos, seguros, impuestos y bolsa */
'use strict';
E.EC = (() => {
  const U = E.U;
  const EC = {};
  // jet fuel en dólares constantes por kg (tendencia histórica aproximada)
  const FUEL = { 1960: 0.25, 1972: 0.25, 1973.75: 0.3, 1974.4: 0.74, 1978: 0.72, 1979.5: 1.0, 1980.6: 1.25, 1982: 1.12, 1985: 0.88, 1986.3: 0.45, 1990.5: 0.46, 1990.85: 0.98, 1991.3: 0.5, 1994: 0.38, 1998.9: 0.3, 2000.6: 0.6, 2002: 0.46, 2004: 0.55, 2005.7: 0.8, 2007.5: 0.86, 2008.5: 1.35, 2009.1: 0.6, 2011.3: 1.1, 2014.4: 1.05, 2015.1: 0.62, 2016.1: 0.42, 2018.8: 0.7, 2019.9: 0.62, 2020.3: 0.3, 2021.5: 0.55, 2022.4: 1.28, 2023.5: 0.85, 2024.6: 0.76, 2027: 0.72, 2040: 0.8 };
  EC.fuelTrend = yf => U.table(FUEL, yf);
  // multiplicador regional del combustible
  EC.REGF = { NA: 0.97, SA: 1.12, EU: 1.05, AF: 1.22, ME: 0.86, AS: 1.0, OC: 1.1 };
  // tasa real base anual
  const RATE = { 1970: 0.03, 1979: 0.035, 1981: 0.065, 1985: 0.055, 1990: 0.05, 1995: 0.04, 2000: 0.04, 2005: 0.03, 2009: 0.02, 2015: 0.015, 2020: 0.01, 2023: 0.03, 2026: 0.025, 2040: 0.025 };
  EC.baseRate = yf => U.table(RATE, yf);
  EC.RATINGS = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC'];
  EC.SPREAD = { AAA: 0.006, AA: 0.009, A: 0.013, BBB: 0.02, BB: 0.035, B: 0.055, CCC: 0.09 };
  EC.INS = {
    basic: { n: 'Básico', hull: 0.0016, liab: 0.22, cover: 0.5, lcover: 0.4 },
    std: { n: 'Estándar', hull: 0.0027, liab: 0.38, cover: 0.85, lcover: 0.8 },
    full: { n: 'Integral', hull: 0.0042, liab: 0.6, cover: 1, lcover: 1 }
  };

  EC.fuelPrice = (G, iata) => {
    const base = G.econ.fuel;
    let p = base * (iata ? EC.REGF[E.AP[iata].region] : 1);
    // coberturas: mezcla con el precio fijado
    let hp = 0, hw = 0;
    G.fin.hedges.forEach(h => { if (h.until > G.t) { hw += h.pct; hp += h.pct * h.price; } });
    if (hw > 0) { hw = Math.min(0.9, hw); p = p * (1 - hw) + (hp / Math.max(1e-6, G.fin.hedges.filter(h => h.until > G.t).reduce((s, h) => s + h.pct, 0))) * hw; }
    return p * G.econ.cpi;
  };

  EC.daily = (G) => {
    const yf = U.yearF(G.t);
    const ec = G.econ;
    ec.fuelN = ec.fuelN * 0.985 + U.gauss() * 0.011;
    const shock = E.X.modMult(G, 'fuel', {});
    ec.fuel = EC.fuelTrend(yf) * Math.exp(ec.fuelN) * shock;
    // ciclo económico (proceso de reversión a la media)
    ec.cycleV = ec.cycleV * 0.995 + U.gauss() * 0.0018;
    ec.cycle = U.clamp(1 + ec.cycleV * 6, 0.88, 1.1);
    // inflación (mensual) -> índice de precios diario
    if (ec.infl > 0) ec.cpi *= Math.pow(1 + ec.infl, 1 / 30.4);
    (ec.fuelHist = ec.fuelHist || []);
    if (U.weekday(G.t) === 1) { ec.fuelHist.push(Math.round(ec.fuel * ec.cpi * 1000) / 1000); if (ec.fuelHist.length > 156) ec.fuelHist.shift(); }
    // bolsa
    if (G.fin.stock.listed) EC.stockDaily(G);
    G.fin.hedges = G.fin.hedges.filter(h => h.until > G.t);
  };

  /* ----- Libro contable ----- */
  EC.book = (G, cat, v) => {
    const L = G.fin.cur;
    if (cat === 'cap') { L.cap = (L.cap || 0) + v; return; }
    if (v >= 0 && EC.REV_CATS[cat]) L.rev[cat] = (L.rev[cat] || 0) + v;
    else L.cost[cat] = (L.cost[cat] || 0) - v;
  };
  EC.REV_CATS = { ticket: 'Pasajes', anc: 'Ingresos auxiliares', cargo: 'Carga', sub: 'Subsidios', other: 'Otros ingresos' };
  EC.COST_CATS = { fuel: 'Combustible', staff: 'Personal', maint: 'Mantenimiento', airport: 'Tasas y handling', nav: 'Navegación aérea', svc: 'Servicio a bordo', lease: 'Leasing', ins: 'Seguros', mkt: 'Marketing', infra: 'Bases, slots y salas', interest: 'Intereses', comp: 'Compensaciones', rd: 'Investigación', tax: 'Impuestos', carbon: 'Emisiones', other: 'Otros' };
  EC.total = (obj) => Object.values(obj || {}).reduce((s, v) => s + v, 0);
  EC.profitOf = (L) => EC.total(L.rev) - EC.total(L.cost);

  /* ----- Costos fijos diarios ----- */
  EC.dailyFixed = (G) => {
    const d = 1 / 30.4;
    // leasing
    let lease = 0; G.fleet.forEach(a => { if (a.own === 'lease' && a.lease && a.status !== 'delivery') lease += a.lease.mo; });
    if (lease) E.X.cash(G, -lease * d * G.econ.cpi, 'lease');
    // seguros
    const ins = EC.insuranceMonthly(G);
    if (ins) E.X.cash(G, -ins * d, 'ins');
    // bases, salas, hangares y slots
    const infra = EC.infraMonthly(G);
    if (infra) E.X.cash(G, -infra * d, 'infra');
    // nómina
    const pay = E.ST.payroll(G);
    if (pay) E.X.cash(G, -pay * d, 'staff');
    // alianza
    if (G.mkt.alliance) { const al = E.ALLIANCES.find(a => a.id === G.mkt.alliance); E.X.cash(G, -al.fee / 365 * G.econ.cpi, 'mkt'); }
    // programa de fidelidad
    if (G.research.done.ffp) E.X.cash(G, -Math.max(20000, EC.revenue12(G) * 0.004) / 365, 'mkt');
  };
  EC.insuranceMonthly = (G) => {
    const P = EC.INS[G.fin.ins];
    const hull = G.fleet.reduce((s, a) => s + (a.status === 'delivery' ? 0 : E.F.value(G, a)), 0);
    const pax = (G.wk.paxPrev || G.wk.pax || 0) * 4.35;
    return (hull * P.hull / 12 + pax * P.liab * G.econ.cpi) * E.X.modMult(G, 'insurance', {});
  };
  EC.baseCost = (G, iata) => { const ap = E.AP[iata]; return [0, 0.25e6, 0.8e6, 2.2e6, 6e6, 15e6][ap.size] * G.econ.cpi; };
  EC.loungeCost = (G, iata) => (0.8e6 + E.AP[iata].size * 0.5e6) * G.econ.cpi;
  EC.hangarCost = (G, iata) => (6e6 + E.AP[iata].size * 2e6) * G.econ.cpi;
  EC.infraMonthly = (G) => {
    let m = 0;
    Object.keys(G.bases).forEach(i => {
      const b = G.bases[i];
      if (i !== G.airline.home) m += EC.baseCost(G, i) * 0.012; else m += EC.baseCost(G, i) * 0.006;
      if (b.lounge) m += EC.loungeCost(G, i) * 0.025;
      if (b.hangar) m += EC.hangarCost(G, i) * 0.012;
    });
    Object.keys(G.slots).forEach(i => { m += G.slots[i] * E.R.slotFee(G, i); });
    return m;
  };

  /* ----- Préstamos ----- */
  EC.makeLoan = (G, amt, rate, months) => {
    const r = rate / 12;
    const pay = r > 0 ? amt * r / (1 - Math.pow(1 + r, -months)) : amt / months;
    return { id: U.uid(G, 'L'), amt, orig: amt, rate, months, left: months, pay, since: G.t };
  };
  EC.debt = G => G.fin.loans.reduce((s, l) => s + l.amt, 0);
  EC.revenue12 = (G) => { const h = G.fin.hist.slice(-12); const r = h.reduce((s, m) => s + EC.total(m.rev), 0); return h.length ? r * 12 / h.length : EC.total(G.fin.cur.rev) * 12; };
  EC.ebitda12 = (G) => {
    const h = G.fin.hist.slice(-12);
    if (!h.length) return 0;
    const e = h.reduce((s, m) => s + EC.total(m.rev) - EC.total(m.cost) + (m.cost.interest || 0) + (m.cost.tax || 0) + (m.cost.lease || 0) * 0.65, 0);
    return e * 12 / h.length;
  };
  EC.ownedValue = (G) => G.fleet.reduce((s, a) => s + (a.own === 'own' && a.status !== 'delivery' ? E.F.value(G, a) : 0), 0);
  EC.equity = (G) => G.cash + EC.ownedValue(G) - EC.debt(G);
  EC.rating = (G) => {
    const debt = EC.debt(G), e = Math.max(1, EC.ebitda12(G)), cash = Math.max(0, G.cash);
    const lev = (debt - cash * 0.5) / e;
    let i = lev < 0.5 ? 0 : lev < 1.2 ? 1 : lev < 2 ? 2 : lev < 3.2 ? 3 : lev < 4.5 ? 4 : lev < 6.5 ? 5 : 6;
    if (EC.ebitda12(G) <= 0 && debt > 0) i = Math.max(i, 5);
    if (G.cash < 0) i = 6;
    if (G.fin.hist.length < 6 && debt === 0) i = 3;
    return EC.RATINGS[i];
  };
  EC.loanRate = (G, months) => {
    const r = EC.baseRate(U.yearF(G.t)) + EC.SPREAD[G.fin.rating] + (months > 60 ? 0.006 : 0) + (E.X.modMult(G, 'credit', {}) - 1) / 100 + G.econ.infl * 12;
    return r;
  };
  EC.loanLimit = (G) => {
    const lim = EC.ownedValue(G) * 0.6 + Math.max(0, EC.ebitda12(G)) * 2.2 + EC.revenue12(G) * 0.06 + 4e6 * G.econ.cpi - EC.debt(G);
    const k = { AAA: 1.2, AA: 1.1, A: 1, BBB: 0.9, BB: 0.7, B: 0.45, CCC: 0.15 }[G.fin.rating];
    return Math.max(0, lim * k);
  };
  EC.takeLoan = (G, amt, months) => {
    if (amt > EC.loanLimit(G) + 1) return { ok: false, why: 'El banco no presta tanto' };
    const L = EC.makeLoan(G, amt, EC.loanRate(G, months), months);
    G.fin.loans.push(L);
    E.X.cash(G, amt, 'cap');
    return { ok: true, loan: L };
  };
  EC.repay = (G, id, amt) => {
    const L = G.fin.loans.find(l => l.id === id); if (!L) return false;
    amt = Math.min(amt, L.amt, Math.max(0, G.cash));
    if (amt <= 0) return false;
    E.X.cash(G, -amt, 'cap');
    L.amt -= amt;
    if (L.amt < 1) G.fin.loans = G.fin.loans.filter(l => l !== L);
    else { const r = L.rate / 12; L.pay = r > 0 ? L.amt * r / (1 - Math.pow(1 + r, -Math.max(1, L.left))) : L.amt / Math.max(1, L.left); }
    return true;
  };

  /* ----- Cierre mensual ----- */
  EC.monthly = (G) => {
    // préstamos (los indexados en dólares acompañan la inflación)
    G.fin.loans.forEach(L => { if (L.idx && L.cpi) { const k = G.econ.cpi / L.cpi; L.amt *= k; L.pay *= k; L.orig *= k; L.cpi = G.econ.cpi; } });
    G.fin.loans.forEach(L => {
      const int = L.amt * L.rate / 12;
      const princ = Math.min(L.amt, Math.max(0, L.pay - int));
      E.X.cash(G, -int, 'interest');
      E.X.cash(G, -princ, 'cap');
      L.amt -= princ; L.left--;
    });
    G.fin.loans = G.fin.loans.filter(L => L.amt > 1 && L.left > 0);
    // impuestos trimestrales
    const L = G.fin.cur;
    G.fin.qProfit += EC.profitOf(L);
    const m = U.month(G.t); // mes que empieza
    if (m % 3 === 0) {
      let p = G.fin.qProfit;
      if (p > 0) {
        const taxable = Math.max(0, p - G.fin.taxLoss);
        G.fin.taxLoss = Math.max(0, G.fin.taxLoss - p);
        const tax = taxable * 0.25;
        if (tax > 0) { E.X.cash(G, -tax, 'tax'); G.fin.cur.cost.tax = (G.fin.cur.cost.tax || 0); }
        // dividendos
        if (G.fin.stock.listed && G.fin.stock.payout > 0 && p > tax) {
          const div = (p - tax) * G.fin.stock.payout;
          if (G.cash > div) { E.X.cash(G, -div * (1 - G.fin.stock.own), 'cap'); G.fin.stock.lastDiv = div; G.fin.stock.sat = Math.min(100, G.fin.stock.sat + 6 * G.fin.stock.payout * 2); }
        }
      } else G.fin.taxLoss += -p;
      G.fin.qProfit = 0;
    }
    // inflación del escenario
    if (G.econ.infl > 0) {
      if (G.scn === 'bankrupt89' && U.yearF(G.t) >= 1991.25) { if (G.econ.infl > 0.004) { G.econ.infl = 0.003; E.X.news(G, 'Plan de Convertibilidad: un peso = un dólar. La inflación se desploma.'); E.X.inbox(G, 'Fin de la hiperinflación', 'El nuevo plan económico estabiliza la moneda. Los precios dejan de subir… y ya no podrás licuar tus deudas.', 'good'); } }
      else G.econ.infl = Math.max(0.004, G.econ.infl * 0.965);
    }
    G.fin.rating = EC.rating(G);
  };

  /* ----- Bolsa ----- */
  EC.valuation = (G) => {
    const e = EC.ebitda12(G);
    const h = G.fin.hist;
    let growth = 0;
    if (h.length >= 24) { const a = h.slice(-12).reduce((s, m) => s + EC.total(m.rev), 0), b = h.slice(-24, -12).reduce((s, m) => s + EC.total(m.rev), 0); growth = b > 0 ? a / b - 1 : 0; }
    const mult = U.clamp(4.5 + G.rep.overall / 22 + U.clamp(growth, -0.2, 0.4) * 9, 3, 13) * G.econ.cycle;
    const ev = Math.max(0, e) * mult;
    const eq = ev - EC.debt(G) + G.cash;
    return Math.max(eq, EC.equity(G) * 0.35, 1e6 * G.econ.cpi);
  };
  EC.canIPO = (G) => {
    const why = [];
    if (G.fin.stock.listed) why.push('La compañía ya cotiza');
    if (EC.revenue12(G) < 80e6 * G.econ.cpi) why.push('Ingresos anuales de al menos ' + U.money(80e6 * G.econ.cpi));
    if (EC.ebitda12(G) <= 0) why.push('EBITDA positivo en los últimos 12 meses');
    if (G.rep.overall < 50) why.push('Reputación de al menos 50');
    if (G.fin.hist.length < 12) why.push('Un año de historia contable');
    return why;
  };
  EC.ipo = (G, pct) => {
    if (EC.canIPO(G).length) return false;
    const val = EC.valuation(G);
    const S = G.fin.stock;
    S.listed = true; S.price = val / S.shares; S.fair = S.price; S.ipoPrice = S.price; S.noise = 0;
    const cash = val * pct * 0.94;
    S.own = 1 - pct;
    E.X.cash(G, cash, 'cap');
    S.hist = [{ t: G.t, p: S.price }];
    S.since = G.t;
    E.X.news(G, `${G.airline.name} debuta en la bolsa a ${U.n2(S.price)} $ por acción.`);
    return cash;
  };
  EC.issue = (G, pct) => {
    const S = G.fin.stock; if (!S.listed) return 0;
    const newSh = S.shares * pct;
    const cash = newSh * S.price * 0.95;
    const own = S.own * S.shares;
    S.shares += newSh; S.own = own / S.shares;
    S.price *= 0.97; S.sat -= 6;
    E.X.cash(G, cash, 'cap');
    return cash;
  };
  EC.buyback = (G, amount) => {
    const S = G.fin.stock; if (!S.listed || amount > G.cash) return 0;
    const sh = amount / (S.price * 1.02);
    const ownSh = S.own * S.shares;
    const floatSh = S.shares - ownSh;
    const b = Math.min(sh, floatSh * 0.9);
    S.shares -= b; S.own = ownSh / S.shares;
    S.price *= 1.015; S.sat += 3;
    E.X.cash(G, -b * S.price * 1.02, 'cap');
    return b;
  };
  EC.stockDaily = (G) => {
    const S = G.fin.stock;
    if (U.weekday(G.t) === 1 || !S.fair) S.fair = EC.valuation(G) / S.shares;
    S.noise = (S.noise || 0) * 0.97 + U.gauss() * 0.018;
    const target = S.fair * Math.exp(S.noise);
    S.price = S.price + (target - S.price) * 0.15;
    if (U.weekday(G.t) === 5) { S.hist.push({ t: G.t, p: S.price }); if (S.hist.length > 260) S.hist.shift(); }
    // satisfacción de accionistas
    const ref = S.hist.length > 13 ? S.hist[S.hist.length - 13].p : S.ipoPrice;
    const ret = S.price / ref - 1;
    S.sat = U.clamp(S.sat + (55 + ret * 120 + S.payout * 25 - S.sat) * 0.01, 0, 100);
    if (S.sat < 12 && S.own < 0.5 && !G.over) {
      G.over = { kind: 'board', title: 'El directorio te destituye', text: 'Los accionistas perdieron la paciencia con la caída de la acción. Con menos del 50% del capital, no pudiste evitar la votación.' };
    }
  };
  return EC;
})();
