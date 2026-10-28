/* ESTELA · flota: compra, leasing, mercado de usados, cabinas, mantenimiento y sistemas */
'use strict';
E.UPG = {
  tcas: { n: 'TCAS II (anticolisión)', y: 1990, c: 0.25, d: 'Obligatorio para volar a Norteamérica desde 1994 y a Europa desde 2000. Reduce riesgo de accidente.' },
  egpws: { n: 'EGPWS (alerta de terreno)', y: 1997, c: 0.15, d: 'Reduce el riesgo de impacto contra el terreno un 40%.' },
  cat3: { n: 'Autoland CAT III', y: 1975, c: 0.6, d: 'Permite aterrizar con niebla (requiere investigación CAT III).', jet: true },
  etops: { n: 'Kit ETOPS', y: 1985, c: 1.2, d: 'Redundancias para cruzar océanos con bimotores (requiere certificación ETOPS).', etops: true },
  wl: { n: 'Winglets', y: 2001, c: 2.5, d: 'Reduce el consumo un 4%. Requiere investigar el retrofit.', wl: true },
  hush: { n: 'Hushkit (capítulo 3)', y: 1988, c: 2.2, d: 'Silencia motores viejos: sin él, desde 2000 no podés operar en EE.UU. ni desde 2002 en Europa.', ch2: true }
};
E.F = (() => {
  const U = E.U;
  const F = {};
  const FH = { rp: 1900, rj: 2300, nb: 2900, wb: 4100, jb: 4300, ss: 900, fr: 3000 };
  F.MPOL = { strict: { n: 'Estricto', k: 0.78, cost: 1.18, int: 0.9 }, std: { n: 'Estándar', k: 1, cost: 1, int: 1 }, defer: { n: 'Diferido', k: 1.3, cost: 0.86, int: 1.25 } };
  F.age = (G, ac) => Math.max(0, U.yearF(G.t) - ac.built);

  F.reg = (G) => {
    const p = E.COUNTRIES[G.airline.cc][1];
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const l = n => Array.from({ length: n }, () => L[U.randi(0, 25)]).join('');
    let r, tries = 0;
    do {
      if (p === 'N') r = 'N' + U.randi(101, 989) + l(2);
      else if (['JA', 'HL'].includes(p)) r = p + U.randi(1000, 9899);
      else if (p === 'B-') r = 'B-' + U.randi(1000, 9899);
      else if (p === 'UK') r = 'UK-' + U.randi(10000, 99999);
      else if (p === 'RP-C') r = 'RP-C' + U.randi(1000, 9899);
      else if (p === 'B-H') r = 'B-H' + l(2);
      else r = p + (p.endsWith('-') ? '' : '-') + l(p.length >= 3 ? 2 : 3);
    } while (G.fleet.some(a => a.reg === r) && tries++ < 50);
    return r;
  };

  F.bestJ = (G) => { const yf = U.yearF(G.t); let b = 'rec'; Object.entries(E.CABIN.j).forEach(([k, v]) => { if (v.y <= yf && (!v.req || G.research.done[v.req])) b = k; }); return b; };
  F.bestF = (G) => { const yf = U.yearF(G.t); let b = 'rec'; Object.entries(E.CABIN.f).forEach(([k, v]) => { if (v.y <= yf && (!v.req || G.research.done[v.req])) b = k; }); return b; };
  F.units = (c) => c.y * E.CABIN.y[c.yp].u + c.p * E.CABIN.p.std.u + c.j * E.CABIN.j[c.jp].u + c.f * E.CABIN.f[c.fp].u;
  F.defaultCabin = (G, typeId, model) => {
    const t = E.AC[typeId];
    model = model || G.airline.model;
    const c = { y: 0, yp: 'std', p: 0, j: 0, jp: F.bestJ(G), f: 0, fp: F.bestF(G) };
    if (t.freighter) return c;
    if (model === 'lcc' || model === 'ulcc') { c.yp = 'dense'; c.y = t.seats; return c; }
    if (t.seats < 60) { c.yp = 'std'; c.y = Math.floor(t.seats / E.CABIN.y.std.u); return c; }
    const long = t.rng > 7000;
    let U0 = t.seats;
    if (model === 'legacy') {
      if (long && t.seats >= 350) { c.f = t.seats >= 500 ? 12 : 8; }
      c.j = Math.round(t.seats * (long ? 0.075 : 0.05));
      if (G.research.done.py && long) c.p = Math.round(t.seats * 0.06);
    } else { c.j = Math.round(t.seats * (long ? 0.05 : 0.03)); }
    if (t.seats < 100) c.j = Math.min(c.j, 8);
    const used = c.p * E.CABIN.p.std.u + c.j * E.CABIN.j[c.jp].u + c.f * E.CABIN.f[c.fp].u;
    c.y = Math.max(0, Math.floor((U0 - used) / E.CABIN.y[c.yp].u));
    return c;
  };
  F.seats = (ac) => { const c = ac.cabin; return { y: c.y, p: c.p, j: c.j, f: c.f, total: c.y + c.p + c.j + c.f }; };
  F.cargoCap = (G, ac, d) => {
    const t = E.AC[ac.type];
    if (t.freighter) return t.cargo * F.payloadK(G, ac, d);
    return t.cargo * (ac.cabin.yp === 'dense' ? 0.85 : 1) * F.payloadK(G, ac, d);
  };
  // fracción de carga útil disponible por peso (restricción de MTOW a gran distancia)
  F.payloadK = (G, ac, d) => {
    const t = E.AC[ac.type];
    const fuel = F.planFuel(G, ac, d, 'std') / 1000;
    const avail = t.mtow - t.oew - fuel;
    return U.clamp(avail / t.payloadMax, 0, 1);
  };
  F.planFuel = (G, ac, d, pol) => {
    const t = E.AC[ac.type];
    const trip = t.burn * d * 1.0;
    const extra = { min: 0.02, std: 0.05, cons: 0.1 }[pol || 'std'];
    return trip * (1 + extra) + t.burn * t.spd * (pol === 'cons' ? 1.0 : 0.75) + t.burn * 220;
  };

  F.create = (G, typeId, o = {}) => {
    const t = E.AC[typeId];
    const built = o.built != null ? o.built : U.yearF(G.t);
    const age = Math.max(0, U.yearF(G.t) - built);
    const hours = o.hours != null ? o.hours : Math.round(age * FH[t.cat] * U.rand(0.8, 1.15));
    const cond = o.cond != null ? o.cond : 97;
    const ac = {
      id: U.uid(G, 'a'), type: typeId, reg: F.reg(G), name: '', built, acq: G.t, own: o.own || 'own', lease: null, paid: o.paid || 0,
      hours, cycles: Math.round(hours / (t.cat === 'wb' || t.cat === 'jb' ? 6 : 1.6)), cond,
      eng: Array.from({ length: t.engines }, () => U.clamp(cond + U.rand(-8, 4), 30, 100)),
      sys: { hyd: U.clamp(cond + U.rand(-5, 5), 30, 100), elec: U.clamp(cond + U.rand(-5, 5), 30, 100), gear: U.clamp(cond + U.rand(-5, 5), 30, 100), press: U.clamp(cond + U.rand(-5, 5), 30, 100) },
      upg: {}, cabin: o.cabin || F.defaultCabin(G, typeId),
      status: o.status || 'active', until: 0, why: '', base: o.base || G.airline.home, loc: o.loc || G.airline.home,
      route: null, freq: 0, next: 0, out: true, delay: 0, fl: null,
      lastA: hours - U.rand(0, 400), lastC: hours - U.rand(0, 0.85) * Math.min(6000, FH[t.cat] * 1.6), lastCt: 0, lastD: hours - U.rand(0, 0.85) * Math.min(28000, FH[t.cat] * 6.8), lastDt: 0,
      life: { fl: 0, pax: 0, rev: 0, cost: 0 }, mo: { fl: 0, pax: 0, rev: 0, cost: 0 }, mhist: []
    };
    if (ac.lastD < 0) ac.lastD = 0; if (ac.lastC < ac.lastD) ac.lastC = ac.lastD; if (ac.lastA < ac.lastC) ac.lastA = ac.lastC;
    // fechas de los chequeos coherentes con las horas voladas
    const perH = 8766 / FH[t.cat];
    ac.lastCt = Math.max(G.t - age * 8766, G.t - (hours - ac.lastC) * perH);
    ac.lastDt = Math.max(G.t - age * 8766, G.t - (hours - ac.lastD) * perH);
    // equipamiento de época
    const yf = U.yearF(G.t);
    if (built >= 1993 && yf >= 1993) ac.upg.tcas = true;
    if (built >= 2000) ac.upg.egpws = true;
    if (built >= 1990 && !t.prop && t.cat !== 'rj') ac.upg.cat3 = true;
    if (t.etops && built >= 1990 && (t.cat === 'wb' || t.id === 'B752' || t.id === 'B753')) ac.upg.etops = true;
    if (t.wl === 'blended' && built >= 2001) ac.upg.wl = true;
    return ac;
  };

  /* ----- Valores y precios ----- */
  F.value = (G, ac) => {
    const t = E.AC[ac.type];
    const age = F.age(G, ac);
    const yr = U.year(G.t);
    let v = t.price * 1e6 * Math.pow(0.935, age) * (0.6 + 0.4 * ac.cond / 100);
    if (t.e && yr > t.e + 8) v *= 0.75;
    if (t.ch2 && !ac.upg.hush && yr >= 1998) v *= 0.6;
    if (t.sst && yr >= 2003) v = t.price * 1e6 * 0.01;
    return Math.max(t.price * 1e6 * 0.035, v) * G.econ.cpi;
  };
  F.newPrice = (G, typeId) => {
    const t = E.AC[typeId];
    const off = G.offers.find(o => o.type === typeId && o.until > G.t);
    return t.price * 1e6 * G.econ.cpi * (1 - (off ? off.disc : 0));
  };
  F.leaseRate = (G, typeId, age) => E.AC[typeId].price * 1e6 * (0.0066 * Math.pow(0.94, age) + 0.001);
  F.available = (G, t) => { const yf = U.yearF(G.t); return t.y <= yf + 0.01 && (!t.e || t.e >= Math.floor(yf)); };
  F.deliveryMonths = (G, t) => {
    const base = { rp: 3, rj: 4, nb: 6, wb: 9, jb: 12, ss: 16, fr: 8 }[t.cat];
    const fresh = U.yearF(G.t) - t.y < 3 ? 1.4 : 1;
    return Math.round(base * fresh * (0.85 + U.hash(t.id + U.year(G.t)) * 0.4));
  };
  F.canUseType = (G, t) => {
    if (t.freighter && !G.research.done.cargo) return { ok: false, why: 'Investigá "División de carga" para operar cargueros' };
    return { ok: true };
  };

  /* ----- Pedidos ----- */
  F.order = (G, typeId, kind, o = {}) => {
    const t = E.AC[typeId];
    if (!F.available(G, t)) return { ok: false, why: 'No está en producción' };
    const cu = F.canUseType(G, t); if (!cu.ok) return cu;
    const n = o.n || 1;
    const base = o.base || G.airline.home;
    const orders = [];
    for (let i = 0; i < n; i++) {
      let due, ord = { id: U.uid(G, 'o'), type: typeId, kind, base, t0: G.t };
      if (kind === 'buy') {
        const price = F.newPrice(G, typeId);
        const dep = price * 0.2;
        if (!o.finance && G.cash < dep) return { ok: false, why: 'Necesitás ' + U.money(dep) + ' de anticipo' };
        if (o.finance && G.cash < price * 0.08) return { ok: false, why: 'Necesitás ' + U.money(price * 0.08) + ' para el anticipo financiado' };
        due = G.t + (F.deliveryMonths(G, t) + Math.floor(i / 2)) * 730;
        ord.price = price; ord.finance = !!o.finance; ord.paid = o.finance ? price * 0.08 : dep;
        E.X.cash(G, -ord.paid, 'cap');
      } else if (kind === 'lease') {
        const mo = F.leaseRate(G, typeId, 0) * 1.02;
        const dep = mo * 2 * G.econ.cpi;
        if (G.cash < dep) return { ok: false, why: 'Necesitás ' + U.money(dep) + ' de depósito' };
        due = G.t + U.randi(5, 9) * 24 * 7 + i * 24 * 10;
        ord.mo = mo; ord.years = o.years || 8; ord.dep = dep;
        E.X.cash(G, -dep, 'cap');
      }
      ord.due = due;
      G.orders.push(ord); orders.push(ord);
    }
    return { ok: true, orders };
  };
  F.buyUsed = (G, lid, mode) => {
    const L = G.used.find(x => x.id === lid); if (!L) return { ok: false, why: 'La oferta ya no existe' };
    const t = E.AC[L.type];
    const cu = F.canUseType(G, t); if (!cu.ok) return cu;
    if (mode === 'buy' && G.cash < L.price) return { ok: false, why: 'Caja insuficiente' };
    if (mode === 'lease' && G.cash < L.lease * 2) return { ok: false, why: 'Caja insuficiente para el depósito' };
    const ord = { id: U.uid(G, 'o'), type: L.type, kind: 'used', base: G.airline.home, t0: G.t, due: G.t + U.randi(8, 20) * 24, built: L.built, cond: L.cond, hours: L.hours, mode, seller: L.seller };
    if (mode === 'buy') { ord.price = L.price; E.X.cash(G, -L.price, 'cap'); }
    else { ord.mo = L.lease / G.econ.cpi; ord.years = 4; ord.dep = L.lease * 2; E.X.cash(G, -L.lease * 2, 'cap'); }
    G.orders.push(ord);
    G.used = G.used.filter(x => x !== L);
    return { ok: true, order: ord };
  };
  F.cancelOrder = (G, oid) => {
    const o = G.orders.find(x => x.id === oid); if (!o) return;
    // se pierde el anticipo
    G.orders = G.orders.filter(x => x !== o);
    if (o.kind === 'lease' || (o.kind === 'used' && o.mode === 'lease')) E.X.cash(G, (o.dep || 0) * 0.5, 'cap');
    if (o.kind === 'used' && o.mode === 'buy') E.X.cash(G, o.price * 0.85, 'cap');
  };
  F.deliver = (G, o) => {
    const t = E.AC[o.type];
    let ac;
    if (o.kind === 'used') ac = F.create(G, o.type, { built: o.built, cond: o.cond, hours: o.hours, own: o.mode === 'buy' ? 'own' : 'lease', loc: o.base, base: o.base });
    else ac = F.create(G, o.type, { own: o.kind === 'lease' ? 'lease' : 'own', loc: o.base, base: o.base, cond: 99, hours: 0 });
    if (o.kind === 'buy') {
      const rest = o.price - o.paid;
      if (o.finance) {
        const L = E.EC.makeLoan(G, rest, E.EC.loanRate(G, 120) - 0.006, 120);
        L.ac = ac.id; L.label = 'Financiación ' + t.short;
        G.fin.loans.push(L);
      } else if (G.cash >= rest) E.X.cash(G, -rest, 'cap');
      else {
        // sin caja: el banco financia automáticamente a tasa alta
        const L = E.EC.makeLoan(G, rest, E.EC.loanRate(G, 84) + 0.02, 84); L.label = 'Crédito puente ' + t.short; G.fin.loans.push(L);
        E.X.inbox(G, 'Financiación forzada', `No tenías caja para pagar el ${t.short}. El banco otorgó un crédito puente caro.`, 'warn');
      }
      ac.paid = o.price;
    }
    if (ac.own === 'lease') ac.lease = { mo: o.mo, until: G.t + (o.years || 4) * 8766, dep: o.dep || 0 };
    // equipamiento según servicio vigente
    if (G.svc.wifi !== 'none') E.X.cash(G, -E.SVC.wifi[G.svc.wifi].ac * G.econ.cpi, 'other');
    G.fleet.push(ac);
    G.stats.peakFleet = Math.max(G.stats.peakFleet, G.fleet.length);
    E.X.inbox(G, 'Avión entregado', `${t.name} ${ac.reg} llegó a ${o.base}. Asignalo a una ruta.`, 'good');
    E.bus.emit('delivery', ac);
    return ac;
  };
  F.sell = (G, ac) => {
    if (ac.own !== 'own') return { ok: false, why: 'Solo podés vender aviones propios' };
    if (ac.fl) { ac.sellAfter = true; E.FL.unassign(G, ac); return { ok: true, pending: true }; }
    const v = F.value(G, ac) * 0.9;
    E.FL.unassign(G, ac);
    E.X.cash(G, v, 'cap');
    // si tenía un préstamo asociado, se cancela con la venta
    G.fin.loans.filter(l => l.ac === ac.id).forEach(l => { E.X.cash(G, -l.amt, 'cap'); l.amt = 0; });
    G.fin.loans = G.fin.loans.filter(l => l.amt > 1);
    G.fleet = G.fleet.filter(a => a !== ac);
    return { ok: true, value: v };
  };
  F.returnCost = (G, ac) => {
    if (ac.own !== 'lease') return 0;
    const left = Math.max(0, (ac.lease.until - G.t) / 730);
    const pen = Math.min(left, 6) * ac.lease.mo * G.econ.cpi;
    const cond = ac.cond < 70 ? (70 - ac.cond) * E.AC[ac.type].price * 1e6 * 0.0015 * G.econ.cpi : 0;
    return pen + cond;
  };
  F.returnLease = (G, ac) => {
    if (ac.own !== 'lease') return { ok: false };
    const c = F.returnCost(G, ac);
    if (ac.fl) { ac.returnAfter = true; E.FL.unassign(G, ac); return { ok: true, pending: true }; }
    E.FL.unassign(G, ac);
    E.X.cash(G, -c, 'lease');
    E.X.cash(G, (ac.lease.dep || 0), 'cap');
    G.fleet = G.fleet.filter(a => a !== ac);
    return { ok: true, cost: c };
  };

  /* ----- Mercado de segunda mano ----- */
  const SELLERS = ['ex Pan Continental', 'ex Aerovía Norte', 'ex Oriental Express', 'ex Línea Atlántica', 'arrendador AerCap*', 'arrendador GECAS*', 'ex Sunrise Air', 'ex TransPacífico', 'ex Royal Desert', 'ex Nordic Wings', 'ex Andina', 'ex Cielo Azul', 'liquidación judicial', 'ex fuerza aérea', 'ex Charter Mediterráneo'];
  F.makeListing = (G, typeId, o = {}) => {
    const t = E.AC[typeId];
    const yf = U.yearF(G.t);
    const maxAge = Math.min(32, yf - t.y);
    const age = o.age != null ? o.age : U.clamp(U.rand(1, maxAge), 0.5, maxAge);
    const built = yf - age;
    const cond = o.cond != null ? o.cond : U.clamp(U.rand(38, 92) - age * 0.6, 28, 95);
    const fake = { type: typeId, built, cond, upg: {} };
    let price = F.value(G, fake) * U.rand(0.82, 1.08) * (o.disc ? 1 - o.disc : 1);
    const lease = F.leaseRate(G, typeId, age) * U.rand(0.9, 1.15) * G.econ.cpi;
    return { id: U.uid(G, 'u'), type: typeId, built, cond: Math.round(cond), hours: Math.round(age * FH[t.cat] * U.rand(0.7, 1.2)), price: Math.round(price), lease: Math.round(lease), seller: o.seller || U.pick(SELLERS).replace('*', ''), until: G.t + U.randi(14, 60) * 24 };
  };
  F.refreshUsed = (G, init) => {
    G.used = G.used.filter(l => l.until > G.t);
    const yf = U.yearF(G.t);
    const pool = E.AIRCRAFT.filter(t => t.y < yf - 1 && (!t.e || yf - t.e < 26) && !(t.sst && yf >= 2003));
    const target = init ? 18 : 16;
    let tries = 0;
    while (G.used.length < target && tries++ < 80) {
      const t = U.wpick(pool, t => (t.e && t.e < yf ? 0.7 : 1) * (t.cat === 'nb' ? 1.6 : t.cat === 'rp' || t.cat === 'rj' ? 1.3 : t.cat === 'ss' ? 0.15 : 1) * (yf - t.y > 40 ? 0.3 : 1));
      if (!t) break;
      G.used.push(F.makeListing(G, t.id));
    }
  };

  /* ----- Configuración de cabina ----- */
  F.SEATCOST = { y: { dense: 2500, std: 3000, comfort: 3800 }, p: { std: 12000 }, j: { rec: 15000, cradle: 40000, angled: 80000, flat: 120000, suite: 240000 }, f: { rec: 30000, sleeper: 60000, flat: 200000, suite: 420000 } };
  F.reconfigCost = (G, ac, c) => {
    const o = ac.cabin;
    let cost = 0;
    ['y', 'p', 'j', 'f'].forEach(k => {
      const prod = k === 'y' ? c.yp : k === 'p' ? 'std' : k === 'j' ? c.jp : c.fp;
      const oprod = k === 'y' ? o.yp : k === 'p' ? 'std' : k === 'j' ? o.jp : o.fp;
      const n = prod !== oprod ? c[k] : Math.max(0, c[k] - o[k]);
      cost += n * F.SEATCOST[k][prod];
    });
    cost += 60000;
    return cost * G.econ.cpi;
  };
  F.validCabin = (G, ac, c) => {
    const t = E.AC[ac.type];
    const yf = U.yearF(G.t);
    if (F.units(c) > t.seats + 0.01) return 'La cabina excede el espacio disponible';
    if (c.p > 0 && (!G.research.done.py || yf < 1992)) return 'Premium Economy no investigada';
    const jp = E.CABIN.j[c.jp], fp = E.CABIN.f[c.fp];
    if (c.j > 0 && (jp.y > yf || (jp.req && !G.research.done[jp.req]))) return 'Producto de ejecutiva no disponible';
    if (c.f > 0 && (fp.y > yf || (fp.req && !G.research.done[fp.req]))) return 'Producto de primera no disponible';
    if (c.f > 0 && t.seats < 250) return 'Primera clase solo en fuselaje ancho';
    return null;
  };
  F.reconfigure = (G, ac, c) => {
    const err = F.validCabin(G, ac, c); if (err) return { ok: false, why: err };
    const cost = F.reconfigCost(G, ac, c);
    if (G.cash < cost) return { ok: false, why: 'Caja insuficiente' };
    E.X.cash(G, -cost, 'maint');
    ac.cabin = Object.assign({}, c);
    const t = E.AC[ac.type];
    const days = { rp: 2, rj: 2, nb: 3, wb: 6, jb: 8, ss: 5, fr: 1 }[t.cat];
    F.downtime(G, ac, days * 24, 'Reconfiguración de cabina');
    return { ok: true, cost };
  };
  F.downtime = (G, ac, hours, why) => {
    ac.status = 'maint'; ac.why = why;
    ac.until = Math.max(ac.until || 0, (ac.fl ? (G.flights.find(f => f.id === ac.fl) || {}).arr || G.t : G.t) + hours);
    if (ac.fl) ac.pendingMaint = true;
  };

  /* ----- Mejoras ----- */
  F.upgAvail = (G, ac, k) => {
    const u = E.UPG[k], t = E.AC[ac.type];
    if (ac.upg[k]) return { ok: false, why: 'Instalado' };
    if (U.yearF(G.t) < u.y) return { ok: false, why: 'Disponible desde ' + u.y };
    if (u.jet && t.prop) return { ok: false, why: 'Solo jets' };
    if (u.etops && !t.etops) return { ok: false, why: 'Este modelo no es certificable ETOPS' };
    if (u.wl && !(['blended', 'none', 'fence'].includes(t.wl) && ['B737', 'B757', 'B767', 'A320'].includes(t.fam) && !['B721', 'B722', 'B732'].includes(t.id))) return { ok: false, why: 'No hay winglets para este modelo' };
    if (u.wl && !G.research.done.winglets) return { ok: false, why: 'Investigá "Retrofit de winglets"' };
    if (u.ch2 && !t.ch2) return { ok: false, why: 'No hace falta' };
    return { ok: true, cost: u.c * 1e6 * (t.cat === 'wb' || t.cat === 'jb' ? 1.6 : 1) * G.econ.cpi };
  };
  F.upgrade = (G, ac, k) => {
    const a = F.upgAvail(G, ac, k); if (!a.ok) return a;
    if (G.cash < a.cost) return { ok: false, why: 'Caja insuficiente' };
    E.X.cash(G, -a.cost, 'maint');
    ac.upg[k] = true;
    F.downtime(G, ac, k === 'wl' ? 96 : 30, 'Instalación: ' + E.UPG[k].n);
    return { ok: true };
  };

  /* ----- Restricciones operativas ----- */
  F.rwyNeed = (t, d, ap) => t.rwy * (0.72 + 0.28 * Math.min(1, d / t.rng)) * (1 + ap.e / 1000 * 0.11);
  // distancia máxima permitida a un aeropuerto de alternativa (regla de 60 min y certificaciones ETOPS)
  F.etopsGapMax = (G, ac) => {
    const t = E.AC[ac.type];
    if (!t.twin) return Infinity;
    if (t.prop) return 600;
    const base = 800;
    if (!t.etops || !ac.upg.etops) return base;
    if (G.research.done.etops330) return Infinity;
    if (G.research.done.etops180) return 2400;
    if (G.research.done.etops120) return 1600;
    return base;
  };
  F.etopsNeed = (info) => info.div <= 800 ? null : info.div <= 1600 ? 'ETOPS-120' : info.div <= 2400 ? 'ETOPS-180' : 'ETOPS-330';
  F.canFly = (G, ac, a, b) => {
    const t = E.AC[ac.type];
    const A = E.AP[a], B = E.AP[b];
    const d = U.dist(A, B);
    const why = [], warn = [];
    if (d > t.rng * 1.0) why.push(`Alcance insuficiente (${U.km(t.rng)} < ${U.km(d)})`);
    [A, B].forEach(ap => { const need = F.rwyNeed(t, d, ap); if (need > ap.rwy) why.push(`Pista de ${ap.iata} corta (${U.n0(ap.rwy)} m, necesita ${U.n0(need)} m${ap.e > 1500 ? ' por altitud' : ''})`); });
    const info = E.GEO.analyze(A, B);
    const gmax = F.etopsGapMax(G, ac);
    if (info.div > gmax) why.push(t.prop ? `Demasiado lejos de aeropuertos alternativos (${U.km(info.div)}) para un turbohélice` : t.etops ? `Hasta ${U.km(info.div)} de un alternativo: necesitás ${F.etopsNeed(info)} (kit en el avión + certificación)` : `Hasta ${U.km(info.div)} de un alternativo: este bimotor no es certificable ETOPS`);
    if (t.a380 && (A.size < 4 || B.size < 4)) why.push('El A380 necesita aeropuertos preparados (tamaño 4+)');
    const yr = U.yearF(G.t);
    [A, B].forEach(ap => {
      if (t.ch2 && !ac.upg.hush && ((ap.region === 'NA' && yr >= 2000) || (ap.region === 'EU' && yr >= 2002))) why.push(`Ruido: ${ap.iata} prohíbe aviones capítulo 2 sin hushkit`);
      if (!ac.upg.tcas && ((ap.region === 'NA' && yr >= 1994) || (ap.region === 'EU' && yr >= 2000))) why.push(`${ap.iata} exige TCAS II`);
    });
    if (E.X.groundedType(G, t)) why.push('Tipo suspendido por la autoridad');
    if (t.freighter && !G.research.done.cargo) why.push('Requiere "División de carga"');
    if (d > t.rng * 0.9 && !why.length) warn.push('Cerca del alcance máximo: habrá restricción de peso');
    return { ok: why.length === 0, why, warn, d };
  };

  /* ----- Rendimiento ----- */
  F.cruise = (G, t, r, ci) => {
    let spd = t.spd * (0.965 + 0.0007 * (ci == null ? 40 : ci));
    if (t.sst) { const w = r.info.water; spd = 1 / (w / 2150 + (1 - w) / 950); }
    return spd;
  };
  F.blockTime = (G, ac, r, out) => {
    const t = E.AC[ac.type];
    const spd = F.cruise(G, t, r, r.plan.ci);
    const wind = E.W.routeWind(G, out ? r.a : r.b, out ? r.b : r.a);
    const gs = Math.max(spd * 0.6, spd + wind * (t.sst ? 0.2 : 1) * (t.prop ? 0.7 : 1));
    return r.d / gs + 0.42 + (t.prop ? 0.05 : 0.12);
  };
  F.fuelFactor = (G, ac, ci) => {
    let k = 1 + (100 - ac.cond) / 900 + (100 - Math.min(...ac.eng)) / 1200;
    k *= 0.97 + 0.0008 * (ci == null ? 40 : ci);
    const R = G.research.done;
    if (R.fuelmgmt) k *= 0.98; if (R.ci) k *= 0.98; if (R.efb) k *= 0.99;
    if (ac.upg.wl) k *= 0.96;
    return k;
  };

  /* ----- Mantenimiento ----- */
  F.INT = { A: 550, C: 6000, D: 28000 };
  F.checkInfo = (G, ac) => {
    const pol = F.MPOL[G.mpol || 'std'];
    const iA = F.INT.A * pol.int, iC = F.INT.C * pol.int, iD = F.INT.D * pol.int;
    const tC = 20 * 730 * pol.int, tD = 7 * 8766 * pol.int;
    return {
      A: { left: iA - (ac.hours - ac.lastA), int: iA },
      C: { left: Math.min(iC - (ac.hours - ac.lastC), (tC - (G.t - ac.lastCt)) / 24 * 9), int: iC, days: Math.round((tC - (G.t - ac.lastCt)) / 24) },
      D: { left: Math.min(iD - (ac.hours - ac.lastD), (tD - (G.t - ac.lastDt)) / 24 * 9), int: iD, days: Math.round((tD - (G.t - ac.lastDt)) / 24) }
    };
  };
  F.checkSpec = (G, ac, kind) => {
    const t = E.AC[ac.type];
    const P = t.price * 1e6;
    const hangar = G.bases[ac.loc] && G.bases[ac.loc].hangar;
    const mro = G.research.done.mro && hangar;
    const ratio = U.clamp(E.ST.ratio(G, 'mech'), 0.5, 1.1);
    let cost, hours;
    if (kind === 'A') { cost = t.maint * 5 + 4000; hours = 10; }
    else if (kind === 'C') { cost = P * 0.006 + 60000; hours = { rp: 4, rj: 5, nb: 8, wb: 12, jb: 15, ss: 14, fr: 10 }[t.cat] * 24; }
    else if (kind === 'D') { cost = P * 0.024 + 350000; hours = { rp: 14, rj: 18, nb: 24, wb: 32, jb: 40, ss: 45, fr: 30 }[t.cat] * 24; }
    else if (kind === 'eng') { cost = P * 0.014 * (G.research.done.engshop ? 0.65 : 1) + 150000; hours = 6 * 24; }
    const pol = F.MPOL[G.mpol || 'std'];
    cost *= pol.cost * (hangar ? 0.75 : 1.08) * (mro && kind !== 'A' ? 0.7 : 1);
    hours *= (mro && kind !== 'A' ? 0.7 : 1) / ratio;
    return { cost: cost * G.econ.cpi, hours };
  };
  F.startCheck = (G, ac, kind) => {
    const s = F.checkSpec(G, ac, kind);
    E.X.cash(G, -s.cost, 'maint');
    const age = F.age(G, ac);
    ac.maintKind = kind;
    F.downtime(G, ac, s.hours, { A: 'Chequeo A', C: 'Chequeo C', D: 'Chequeo D (gran inspección)', eng: 'Overhaul de motores' }[kind]);
    const pol = F.MPOL[G.mpol || 'std'];
    if (kind === 'A') { ac.lastA = ac.hours; ac.cond = Math.min(100, ac.cond + 3 / pol.k); }
    if (kind === 'C') { ac.lastA = ac.lastC = ac.hours; ac.lastCt = G.t; ac.cond = Math.max(ac.cond, 90 - age * 0.35); Object.keys(ac.sys).forEach(k => ac.sys[k] = Math.max(ac.sys[k], 88 - age * 0.3)); }
    if (kind === 'D') { ac.lastA = ac.lastC = ac.lastD = ac.hours; ac.lastCt = ac.lastDt = G.t; ac.cond = Math.max(ac.cond, 97 - age * 0.22); Object.keys(ac.sys).forEach(k => ac.sys[k] = Math.max(ac.sys[k], 96 - age * 0.2)); }
    if (kind === 'eng') ac.eng = ac.eng.map(() => 98);
    return s;
  };
  F.overdue = (G, ac) => { const c = F.checkInfo(G, ac); return c.C.left < -c.C.int * 0.15 || c.D.left < -c.D.int * 0.1 || c.A.left < -c.A.int * 0.5; };
  // desgaste por hora de vuelo
  F.wear = (G, ac, h) => {
    const age = F.age(G, ac);
    const pol = F.MPOL[G.mpol || 'std'];
    const mech = U.clamp(E.ST.ratio(G, 'mech'), 0.4, 1.2);
    let k = 0.0058 * (1 + age / 22) * pol.k * (mech < 1 ? 1 + (1 - mech) * 1.6 : 1) * (G.research.done.predictive ? 0.85 : 1) * (2 - G.staff.mech.tlevel * 0.5 + 0.5) / 1.5;
    ac.cond = U.clamp(ac.cond - k * h, 5, 100);
    const ek = 0.0036 * pol.k * (G.research.done.engshop ? 0.85 : 1) * (1 + age / 30);
    ac.eng = ac.eng.map(e => U.clamp(e - ek * h * U.rand(0.6, 1.4), 5, 100));
    Object.keys(ac.sys).forEach(s => { ac.sys[s] = U.clamp(ac.sys[s] - k * 0.8 * h * U.rand(0.3, 1.7), 5, 100); });
    ac.hours += h;
  };
  // diaria: entregas, fin de mantenimiento, chequeos automáticos, leasings
  F.daily = (G) => {
    G.orders.filter(o => o.due <= G.t).forEach(o => { G.orders = G.orders.filter(x => x !== o); F.deliver(G, o); });
    G.fleet.forEach(ac => {
      if ((ac.status === 'maint' || ac.status === 'grounded') && ac.until <= G.t && !ac.fl) {
        ac.status = 'active'; ac.why = ''; ac.pendingMaint = false;
        if (ac.route) { ac.next = Math.max(ac.next, G.t + 1); }
      }
      if (ac.status !== 'active' || ac.fl) return;
      if (G.settings.autoMaint) {
        const ci = F.checkInfo(G, ac);
        const atBase = !!G.bases[ac.loc];
        const due = k => ci[k].left <= (atBase ? ci[k].int * 0.04 : -ci[k].int * 0.05);
        if (due('D')) F.startCheck(G, ac, 'D');
        else if (due('C')) F.startCheck(G, ac, 'C');
        else if (due('A')) F.startCheck(G, ac, 'A');
        else if (Math.min(...ac.eng) < 38) F.startCheck(G, ac, 'eng');
      }
      // inactivos se degradan levemente
      if (!ac.route) ac.cond = Math.max(5, ac.cond - 0.004);
    });
    // fin de leasing: renovación automática con descuento
    G.fleet.forEach(ac => {
      if (ac.own !== 'lease' || !ac.lease) return;
      const left = ac.lease.until - G.t;
      if (left < 60 * 24 && !ac.lease.warned) { ac.lease.warned = true; E.X.inbox(G, 'Fin de leasing', `El leasing del ${E.AC[ac.type].short} ${ac.reg} vence en 60 días. Se renovará automáticamente por 2 años con 12% de descuento si no lo devolvés.`, 'warn'); }
      if (left <= 0) { ac.lease.until = G.t + 2 * 8766; ac.lease.mo *= 0.88; ac.lease.warned = false; }
    });
    // limpieza de ofertas
    G.offers = G.offers.filter(o => o.until > G.t);
  };
  return F;
})();
