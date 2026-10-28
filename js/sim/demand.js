/* ESTELA · demanda de pasajeros y carga, competencia y calidad de producto */
'use strict';
E.D = (() => {
  const U = E.U;
  const D = {};
  // crecimiento global del tráfico (2019 = 1)
  const GROWTH = { 1960: 0.06, 1970: 0.13, 1975: 0.17, 1980: 0.23, 1985: 0.28, 1990: 0.37, 1995: 0.44, 2000: 0.56, 2005: 0.66, 2010: 0.77, 2015: 0.9, 2019: 1.0, 2030: 1.38, 2045: 2.0 };
  D.growth = yf => U.table(GROWTH, yf);
  // multiplicador de tarifas reales por época (tarifas reguladas = caras)
  const FAREERA = { 1960: 2.05, 1972: 1.9, 1978: 1.66, 1985: 1.42, 1992: 1.24, 2000: 1.12, 2008: 1.03, 2015: 1.0, 2040: 0.98 };
  D.fareEra = yf => U.table(FAREERA, yf);

  D.distF = d => {
    if (d < 120) return 0;
    if (d < 600) return 0.28 + 0.72 * Math.pow((d - 120) / 480, 0.8);
    return Math.exp(-(d - 600) / 9500);
  };
  D.apMult = (ap, yf) => {
    let m = Math.pow(1 + ap.g, yf - 2019);
    if (ap.open && yf < ap.open) m *= 0.05;
    return U.clamp(m, 0.04, 3);
  };
  // demanda base diaria por sentido (todas las aerolíneas), sin estacionalidad
  const bcache = {};
  D.base = (a, b, yf) => {
    const k = a.iata + b.iata + Math.floor(yf * 4);
    if (bcache[k] != null) return bcache[k];
    const d = U.dist(a, b);
    const same = a.cc === b.cc;
    const sameReg = a.region === b.region;
    let intl = same ? 1 : sameReg ? 0.5 : 0.42;
    if (!same && a.region === 'EU' && b.region === 'EU' && yf >= 1993) intl = 0.78;
    const mix = 0.5 + 0.9 * a.biz * b.biz + 0.85 * Math.max(a.tour, b.tour) * (0.6 + 0.4 * Math.min(a.tour, b.tour) + 0.0) ;
    const pop = Math.pow(a.pop * b.pop, 0.5);
    let v = 430 * pop * D.distF(d) * mix * intl * D.growth(yf) * D.apMult(a, yf) * D.apMult(b, yf);
    // destinos insulares/turísticos remotos tienen un piso por turismo
    v = Math.max(v, 14 * b.tour * D.distF(d) * D.growth(yf) * 10 * (sameReg ? 1 : 0.6));
    bcache[k] = v;
    return v;
  };
  // reparto por clase
  D.split = (a, b, d, yf) => {
    const biz = (a.biz + b.biz) / 2, lux = Math.sqrt(a.biz * b.biz);
    const lh = U.clamp((d - 1500) / 6000, 0, 1);
    let j = 0.035 + 0.1 * lux * lux + 0.04 * lh;
    let f = lh * 0.012 * (lux > 0.75 ? 1.8 : 0.6);
    let p = yf >= 1992 ? 0.03 + 0.06 * lh : 0;
    j *= (1 - 0.35 * Math.max(a.tour, b.tour) * (1 - biz));
    return { y: 1 - j - f - p, p, j, f };
  };
  // estacionalidad: turismo con picos de verano del hemisferio del destino y diciembre
  D.season = (a, b, month) => {
    const tour = b.tour * 0.65 + a.tour * 0.35;
    const south = b.lat < -10;
    const peakM = south ? 0.5 : 6.5; // ene o jul
    const ang = (month - peakM) / 12 * Math.PI * 2;
    let s = 1 + 0.24 * tour * Math.cos(ang);
    if (month === 11) s += 0.08;
    const biz = (a.biz + b.biz) / 2;
    if (month === 7) s -= 0.07 * biz; // agosto
    if (month === 0) s -= 0.05;
    return s;
  };
  // tarifas de referencia (dólares constantes, por sentido)
  D.ref = (d, yf) => {
    const k = D.fareEra(yf);
    const y = (28 + 0.105 * Math.pow(d, 0.95)) * k;
    const jm = 2.2 + 1.8 * U.clamp(d / 6500, 0, 1);
    return { y, p: y * 1.65, j: y * jm, f: y * jm * 1.75 };
  };
  D.refN = (G, d, a, b) => {
    const r = D.ref(d, U.yearF(G.t));
    const fm = E.X.modMult(G, 'fare', { region: E.AP[a].region }) * 0.5 + E.X.modMult(G, 'fare', { region: E.AP[b].region }) * 0.5;
    const k = G.econ.cpi * fm;
    return { y: r.y * k, p: r.p * k, j: r.j * k, f: r.f * k };
  };

  /* ----- Competencia ----- */
  const NAMES = {
    NA: ['TransAmérica', 'Sunline', 'Frontier Sky', 'Atlantic Coast', 'Pioneer Air', 'Liberty Jet', 'Pacific West'],
    SA: ['Aerosur', 'Austral Andina', 'Cóndor Líneas', 'Pampa Air', 'TransBrasil Sul', 'Andes Express', 'Línea del Plata'],
    EU: ['EuroAtlantic', 'Hansa Express', 'Iberavia', 'Alpine Air', 'Nordwind', 'Aeropuente', 'Channel Air'],
    AF: ['Sahel Airways', 'Kilimanjaro Air', 'Cape Atlantic', 'Nile Wings', 'Sahara Express'],
    ME: ['Gulf Royal', 'Desert Falcon', 'Levant Air', 'Arabian Star'],
    AS: ['Orient Pacific', 'Lotus Air', 'Dragon Air Lines', 'Monsoon Jet', 'Sakura Wings', 'Golden Elephant', 'Silk Road Air'],
    OC: ['Southern Cross', 'Koru Air', 'Coral Sea Airways', 'Outback Jet']
  };
  D.mkey = (a, b) => a < b ? a + '-' + b : b + '-' + a;
  D.market = (G, a, b) => {
    const key = D.mkey(a, b);
    let m = G.markets[key];
    if (m) return m;
    const A = E.AP[a], B = E.AP[b];
    const yf = U.yearF(G.t);
    const dem = D.base(A, B, yf) + D.base(B, A, yf);
    const rnd = U.rng(key + Math.floor(yf / 5));
    const diffK = (E.DIFFS[G.diff] || E.DIFFS.normal).k;
    let n = dem < 60 ? 0 : Math.round(U.clamp(Math.log2(dem / 80) * (0.5 + rnd() * 0.45) * diffK, 0, 5));
    if (A.size + B.size <= 3 && rnd() < 0.5) n = Math.min(n, 1);
    const comps = [];
    const pool = U.shuffle([...new Set([...(NAMES[A.region] || []), ...(NAMES[B.region] || [])])]);
    for (let i = 0; i < n; i++) {
      const share = (0.55 + rnd() * 0.5) / Math.max(1, n);
      comps.push({ name: pool[i % pool.length], cap: dem * 0.9 * share, price: 0.9 + rnd() * 0.25, q: U.clamp(0.42 + rnd() * 0.22 + (i === 0 ? 0.06 : 0), 0.3, 0.75), lf: 0.78 });
    }
    m = G.markets[key] = { comps, created: G.t };
    return m;
  };
  D.freqFactor = (seatsDay, dem) => Math.pow(Math.max(0, seatsDay) / Math.max(1, dem), 0.55);

  /* ----- Calidad del producto (0..1, relativo al mercado = 0.5) ----- */
  D.svcScore = (G, cls, hours) => {
    const S = G.svc, yf = U.yearF(G.t);
    let s = 0.5, w = 0;
    const exp = U.table;
    if (cls === 'y' || cls === 'p') {
      const c = E.SVC.cateringY[S.cateringY].s;
      const expected = hours < 1.3 ? 0.15 : hours < 3.5 ? 0.38 : 0.62;
      s = 0.5 + (c - expected) * 0.8;
      if (cls === 'p') s += 0.08;
    } else if (cls === 'j') s = 0.5 + (E.SVC.cateringJ[S.cateringJ].s - 0.6) * 0.8 + (E.SVC.amenity[S.amenity].s - 0.4) * 0.2 * U.clamp(hours / 6, 0, 1);
    else s = 0.5 + (E.SVC.cateringF[S.cateringF].s - 0.7) * 0.8 + (E.SVC.amenity[S.amenity].s - 0.6) * 0.3;
    // entretenimiento y conectividad (importan en vuelos largos)
    const lh = U.clamp((hours - 1) / 6, 0, 1);
    const ifeExp = exp({ 1970: 0.15, 1985: 0.35, 1998: 0.55, 2010: 0.72, 2020: 0.8 }, yf);
    s += (E.SVC.ife[S.ife].s - ifeExp) * 0.35 * (0.25 + lh);
    const wifiExp = yf < 2010 ? 0 : exp({ 2010: 0.1, 2016: 0.35, 2024: 0.6 }, yf);
    s += (E.SVC.wifi[S.wifi].s - wifiExp) * 0.18;
    // tripulación de cabina
    const cab = G.staff.cabin;
    s += (cab.tlevel - 1) * 0.04 + (cab.morale - 60) / 600;
    s -= E.X.modMult(G, 'svcpen', {}, true);
    if (G.research.done.app) s += 0.02;
    return U.clamp(s, 0.05, 0.98);
  };
  D.seatScore = (G, ac, cls) => {
    const yf = U.yearF(G.t);
    const c = ac.cabin;
    let sc;
    if (cls === 'y') sc = E.CABIN.y[c.yp].s - U.table(E.EXPECT.y, yf);
    else if (cls === 'p') sc = E.CABIN.p.std.s - U.table(E.EXPECT.p, yf);
    else if (cls === 'j') sc = E.CABIN.j[c.jp].s - U.table(E.EXPECT.j, yf);
    else sc = E.CABIN.f[c.fp].s - U.table(E.EXPECT.f, yf);
    return 0.5 + sc * 0.9;
  };
  D.acScore = (G, ac) => {
    const age = U.yearF(G.t) - ac.built;
    return U.clamp(0.62 - age / 55 + (ac.cond - 75) / 250, 0.2, 0.75);
  };
  // calidad combinada de un avión en una clase
  D.quality = (G, ac, cls, hours) => {
    const seat = D.seatScore(G, ac, cls), svc = D.svcScore(G, cls, hours), plane = D.acScore(G, ac);
    const wSeat = cls === 'y' ? 0.3 + 0.2 * U.clamp(hours / 8, 0, 1) : 0.45;
    let q = seat * wSeat + svc * (0.75 - wSeat) + plane * 0.25;
    if (E.AC[ac.type].sst && cls !== 'y') q += 0.15;
    return U.clamp(q, 0.05, 1);
  };

  // cargo: toneladas diarias por sentido
  D.cargoBase = (a, b, yf) => {
    const d = U.dist(a, b);
    return 0.0028 * Math.pow(a.pop * b.pop, 0.5) * (0.4 + a.biz + b.biz) * D.distF(d) * (d > 2500 ? 1.6 : 1) * D.growth(yf) * 60 * (a.cc === b.cc ? 0.7 : 1);
  };
  D.cargoRate = (G, d) => (0.42 + 220 / Math.max(300, d)) * D.fareEra(U.yearF(G.t)) * 0.7 * G.econ.cpi; // $/t·km

  /* ----- Demanda de tu aerolínea en una ruta ----- */
  D.routeDemand = (G, r) => {
    const A = E.AP[r.a], B = E.AP[r.b];
    const yf = U.yearF(G.t), mo = U.month(G.t);
    const m = D.market(G, r.a, r.b);
    const acs = G.fleet.filter(a => a.route === r.id && a.status !== 'delivery');
    const ref = D.refN(G, r.d, r.a, r.b);
    const hours = r.d / 800 + 0.5;
    const sp = D.split(A, B, r.d, yf);
    // asientos semanales por clase
    const cap = { y: 0, p: 0, j: 0, f: 0, c: 0 };
    let freqW = 0;
    const q = { y: 0, p: 0, j: 0, f: 0 }, qw = { y: 0, p: 0, j: 0, f: 0 };
    acs.forEach(ac => {
      const s = E.F.seats(ac);
      const f = ac.status === 'active' ? ac.freq : 0;
      freqW += f;
      ['y', 'p', 'j', 'f'].forEach(k => { cap[k] += s[k] * f; if (s[k] > 0) { q[k] += D.quality(G, ac, k, hours) * s[k] * f; qw[k] += s[k] * f; } });
      cap.c += E.F.cargoCap(G, ac, r.d) * f;
    });
    ['y', 'p', 'j', 'f'].forEach(k => q[k] = qw[k] ? q[k] / qw[k] : 0.5);
    // factores de marca
    const rep = 0.55 + G.rep.overall / 110;
    const otp = G.rep.otp;
    const punctJ = otp >= 0.8 ? 1 : U.clamp(1 - (0.8 - otp) * 4.2, 0.12, 1);
    const punctY = otp >= 0.7 ? 1 : U.clamp(1 - (0.7 - otp) * 1.6, 0.5, 1);
    const fees = G.svc.bag * 0.6 + G.svc.carry + G.svc.seat * 0.3 + G.svc.prio * 0.2;
    const lowcost = U.clamp(fees / 60 + (G.svc.cateringY === 'bob' ? 0.25 : 0) + (G.svc.cateringY === 'none' ? 0.3 : 0), 0, 1);
    const res = G.research.done;
    let distK = 1 + (res.crs ? 0.03 : 0) + (res.web ? 0.04 : 0) + (res.gds && A.cc !== B.cc ? 0.05 : 0);
    const alliance = G.mkt.alliance && A.region !== B.region ? 1.08 : 1;
    // efecto red por conexiones en hubs
    const hubConn = (iata) => G.bases[iata] ? Math.min(40, G.routes.filter(x => x.a === iata || x.b === iata).length) : 0;
    const out = { y: [0, 0], p: [0, 0], j: [0, 0], f: [0, 0], c: [0, 0], mkt: { y: 0, p: 0, j: 0, f: 0 }, share: { y: 0, p: 0, j: 0, f: 0 }, spill: 0 };
    [0, 1].forEach(dir => {
      const O = dir === 0 ? A : B, X = dir === 0 ? B : A;
      const base = D.base(O, X, yf) * D.season(O, X, mo) * G.econ.cycle * (1 - Math.min(0.35, G.econ.infl * 2.5)) * E.X.modMult(G, 'demand', { iata: O.iata, cc: O.cc, region: O.region }) * E.X.modMult(G, 'demand', { iata: X.iata, cc: X.cc, region: X.region }, false, true);
      const closed = E.X.isClosed(G, O.iata) || E.X.isClosed(G, X.iata);
      const conn = 1 + 0.012 * (hubConn(O.iata) + hubConn(X.iata)) * U.clamp(r.d / 3000, 0.3, 1.4);
      const aw = 0.55 + 0.9 * (G.mkt.aw[O.region] || 0) / 100;
      ['y', 'p', 'j', 'f'].forEach(k => {
        const mkt = base * sp[k] * conn * (k === 'j' || k === 'f' ? E.X.modMult(G, 'demandJ', {}) * (res.ffp ? 1.1 : 1) * (alliance > 1 ? 1.06 : 1) : 1) * (k === 'p' && cap.p === 0 ? 0 : 1);
        if (k === 'f' && cap.f === 0) { out.mkt[k] += mkt; return; }
        const p = r.price[k] * (r.seasonal ? 1 + (D.season(O, X, mo) - 1) * 0.8 : 1) / Math.max(1, ref[k]);
        // estímulo de la demanda total por precio
        const eps = { y: 1.9, p: 1.5, j: 1.2, f: 1.0 }[k];
        const stim = { y: 0.75 + lowcost * 0.5, p: 0.5, j: 0.35, f: 0.25 }[k];
        // la competencia cobra cerca de la referencia
        const seatsDay = cap[k] / 7;
        const ff = Math.pow(Math.max(0, seatsDay), 0.8);
        let qual = q[k];
        let A_me = Math.exp(-eps * 1.6 * (p - 1)) * (0.45 + qual * 1.15) * rep * aw * distK * alliance * ff * (k === 'y' ? punctY : punctJ);
        if (k !== 'y' && lowcost > 0.5) A_me *= 1 - (lowcost - 0.5) * 0.9;
        if (k === 'y' && lowcost > 0.3) A_me *= 1 + (lowcost - 0.3) * 0.25;
        let A_c = 0, avgP = 0, cw = 0;
        m.comps.forEach(c => {
          const cp = c.priceUntil && c.priceUntil > G.t ? c.price : Math.max(c.price, 0.88);
          const cs = c.cap * sp[k] / 2;
          const a = Math.exp(-eps * 1.6 * (cp - 1)) * (0.45 + c.q * 1.15) * Math.pow(Math.max(0, cs), 0.8) * (k === 'y' ? 1 : 0.9);
          A_c += a; avgP += cp * cs; cw += cs;
        });
        const share = cap[k] > 0 ? A_me / (A_me + A_c + (m.comps.length ? 0 : 0.0001)) : 0;
        // la demanda total responde al precio medio del mercado
        const pAvg = cw ? (avgP + p * seatsDay) / (cw + seatsDay) : p;
        const pm = cap[k] > 0 ? pAvg : (cw ? avgP / cw : 1);
        const tot = mkt * (pm > 1 ? Math.exp(-eps * (pm - 1)) : 1 + stim * (1 - pm));
        let mine = closed ? 0 : tot * share;
        if (cap[k] === 0) mine = 0;
        out[k][dir] = mine;
        out.mkt[k] += mkt;
        out.share[k] += share / 2;
      });
      // carga
      const cb = D.cargoBase(O, X, yf) * G.econ.cycle * (res.cargo ? 1.25 : 1);
      const cpRatio = r.cargoP || 1;
      out.c[dir] = closed ? 0 : cb * Math.exp(-1.4 * (cpRatio - 1)) * (m.comps.length ? 1 / (1 + m.comps.length * 0.6) : 1) * (cap.c > 0 ? 1 : 0);
    });
    out.cap = cap; out.freqW = freqW; out.ref = ref; out.q = q; out.lowcost = lowcost;
    // ocupación esperada por clase y sentido
    const lf = {};
    ['y', 'p', 'j', 'f'].forEach(k => { const daily = cap[k] / 7; lf[k] = daily > 0 ? Math.min(1, (out[k][0] + out[k][1]) / 2 / daily) : 0; });
    out.lf = lf;
    const seatsT = (cap.y + cap.p + cap.j + cap.f) / 7;
    out.lfAll = seatsT > 0 ? (['y', 'p', 'j', 'f'].reduce((s, k) => s + Math.min(cap[k] / 7, (out[k][0] + out[k][1]) / 2), 0)) / seatsT : 0;
    r.dem = out;
    return out;
  };

  // estimación para planificar una ruta nueva
  D.estimate = (G, a, b) => {
    const A = E.AP[a], B = E.AP[b];
    const yf = U.yearF(G.t), d = U.dist(A, B);
    const mo = U.month(G.t);
    const m = D.market(G, a, b);
    const base = (D.base(A, B, yf) * D.season(A, B, mo) + D.base(B, A, yf) * D.season(B, A, mo)) / 2 * G.econ.cycle * E.X.modMult(G, 'demand', { iata: a, cc: A.cc, region: A.region });
    const sp = D.split(A, B, d, yf);
    const compCap = m.comps.reduce((s, c) => s + c.cap, 0) / 2;
    return { d, base, sp, comps: m.comps, compCap, ref: D.refN(G, d, a, b), cargo: D.cargoBase(A, B, yf), potential: base * (m.comps.length ? 1 / (1 + m.comps.length * 0.55) : 1) };
  };

  // evolución semanal de la competencia
  D.weeklyMarkets = (G) => {
    const used = new Set(G.routes.map(r => r.key));
    Object.keys(G.markets).forEach(k => {
      const m = G.markets[k];
      if (!used.has(k)) { if (G.t - (m.created || 0) > 24 * 365 * 3) delete G.markets[k]; return; }
      const r = G.routes.find(x => x.key === k);
      const dem = r.dem; if (!dem) return;
      const mktDay = (dem.mkt.y + dem.mkt.p + dem.mkt.j + dem.mkt.f) / 2;
      const mySeats = (dem.cap.y + dem.cap.p + dem.cap.j + dem.cap.f) / 7;
      const myShare = (dem.share.y || 0);
      m.comps.forEach(c => {
        // cada competidor ajusta su capacidad a su cuota natural del mercado; ceden algo si dominás la ruta
        if (!c.sh) c.sh = U.clamp(c.cap / Math.max(1, mktDay * 2), 0.05, 0.6);
        const target = mktDay * 2 * c.sh * (1 - 0.6 * Math.max(0, myShare - 0.35)) * (mySeats > mktDay * 1.4 ? 0.85 : 1);
        c.cap += (target - c.cap) * 0.05;
        if (c.priceUntil && c.priceUntil < G.t) { c.price = 0.92 + Math.random() * 0.2; c.priceUntil = 0; }
      });
      m.comps = m.comps.filter(c => c.cap > mktDay * 0.1 || c.sh > 0.05);
      m.comps.forEach(c => { if (myShare > 0.7 && Math.random() < 0.01) c.sh *= 0.8; });
      m.comps = m.comps.filter(c => c.sh > 0.04);
      // precios altos con ocupación alta atraen capacidad rival
      const pIdx = (r.price.y / Math.max(1, dem.ref.y));
      if (pIdx > 1.08 && dem.lfAll > 0.8) m.comps.forEach(c => { c.sh = Math.min(0.6, (c.sh || 0.1) * (1 + (pIdx - 1) * 0.08)); });
      // entrada de nuevos competidores en rutas muy rentables (ocupación alta y precios altos)
      if ((dem.lfAll > 0.9 || (pIdx > 1.15 && dem.lfAll > 0.78)) && m.comps.length < 5 && Math.random() < (0.015 + Math.max(0, pIdx - 1) * 0.05) * (E.DIFFS[G.diff] || E.DIFFS.normal).k) {
        const A = E.AP[r.a];
        const pool = NAMES[A.region] || NAMES.EU;
        const name = pool.find(n => !m.comps.some(c => c.name === n)) || pool[0];
        m.comps.push({ name, cap: mktDay * 0.5, sh: 0.25, price: 0.85, q: 0.45 + Math.random() * 0.2, lf: 0.7 });
        E.X.inbox(G, 'Nuevo competidor', `${name} empieza a volar ${E.AP[r.a].city}–${E.AP[r.b].city}, atraída por tus altas ocupaciones.`, 'warn');
      }
      if (myShare > 0.6 && m.comps.length === 0 && mktDay > 300 && Math.random() < 0.02) {
        const pool = NAMES[E.AP[r.b].region] || NAMES.EU;
        m.comps.push({ name: U.pick(pool), cap: mktDay * 0.2, price: 0.9, q: 0.5, lf: 0.7 });
      }
    });
  };
  return D;
})();

/* ================== Rutas ================== */
E.R = (() => {
  const U = E.U;
  const R = {};
  R.license = (G) => G.research.done.lic_int ? 'int' : G.research.done.lic_reg ? 'reg' : 'nat';
  R.allowed = (G, a, b) => {
    const A = E.AP[a], B = E.AP[b];
    if (!A || !B || a === b) return { ok: false, why: 'Aeropuerto inválido' };
    if (!G.bases[a] && !G.bases[b]) return { ok: false, why: 'Una de las puntas debe ser una de tus bases' };
    const d = U.dist(A, B);
    if (d < 120) return { ok: false, why: 'Demasiado cerca (menos de 120 km)' };
    const yr = U.yearF(G.t);
    if ((A.open && yr < A.open) || (B.open && yr < B.open)) return { ok: false, why: 'Aeropuerto cerrado a operadores extranjeros hasta ' + Math.max(A.open || 0, B.open || 0) };
    const lic = R.license(G);
    const home = E.AP[G.airline.home];
    const base = G.bases[a] ? A : B, other = base === A ? B : A;
    const domestic = A.cc === B.cc;
    if (lic === 'nat' && !(domestic && A.cc === home.cc) && !(domestic && G.bases[base.iata] && G.bases[base.iata].abroad)) return { ok: false, why: 'Necesitás la licencia continental (Investigación)' };
    if (lic === 'reg' && A.region !== B.region) return { ok: false, why: 'Necesitás la licencia intercontinental' };
    if (lic === 'reg' && A.region !== home.region && !domestic) return { ok: false, why: 'Fuera de tu continente: licencia intercontinental' };
    if (E.X.isClosed(G, a, true) || E.X.isClosed(G, b, true)) return { ok: false, why: 'Espacio aéreo cerrado' };
    return { ok: true, d };
  };
  R.create = (G, a, b, silent) => {
    if (G.bases[b] && !G.bases[a]) [a, b] = [b, a];
    const chk = R.allowed(G, a, b);
    if (!chk.ok) return null;
    const key = E.D.mkey(a, b);
    if (G.routes.some(r => r.key === key)) return G.routes.find(r => r.key === key);
    const A = E.AP[a], B = E.AP[b];
    const d = Math.round(U.dist(A, B));
    const ref = E.D.refN(G, d, a, b);
    const lc = (G.airline.model === 'lcc' || G.airline.model === 'ulcc') ? 0.82 : 1;
    const r = {
      id: U.uid(G, 'r'), a, b, d, key, fn: R.nextFn(G),
      price: { y: Math.round(ref.y * lc), p: Math.round(ref.p), j: Math.round(ref.j), f: Math.round(ref.f) }, cargoP: 1,
      plan: { ci: 40, fuel: 'std', tank: false, alt: null, cg: 0.5 }, auto: false, since: G.t,
      stats: { w: R.emptyWeek(), hist: [] }, info: E.GEO.analyze(A, B)
    };
    r.plan.alt = R.altFor(r.b, r.a);
    E.D.market(G, a, b);
    G.routes.push(r);
    if (!silent) E.X.inbox(G, 'Ruta creada', `${A.city} – ${B.city} (${U.km(d)}). Asigná aviones para empezar a volar.`, 'info');
    return r;
  };
  R.emptyWeek = () => ({ pax: 0, seats: 0, rev: 0, cost: 0, fl: 0, ontime: 0, canc: 0, cargo: 0, paxJ: 0, seatsJ: 0, div: 0 });
  R.nextFn = (G) => { const used = new Set(G.routes.map(r => r.fn)); let n = 100 + (G.routes.length * 10) % 800; while (used.has(n)) n += 10; return n; };
  R.altFor = (iata, not) => {
    const ap = E.AP[iata];
    let best = null, bd = 1e9;
    E.AIRPORTS.forEach(x => { if (x.iata === iata || x.iata === not || x.size < 2) return; const d = U.dist(ap, x); if (d > 80 && d < bd) { bd = d; best = x.iata; } });
    return best;
  };
  R.remove = (G, r) => {
    G.fleet.forEach(a => { if (a.route === r.id) E.FL.unassign(G, a); });
    G.routes = G.routes.filter(x => x !== r);
  };
  R.path = (r) => {
    if (!r._path) r._path = U.gcPath(E.AP[r.a], E.AP[r.b]);
    return r._path;
  };
  // slots: salidas semanales necesarias por aeropuerto
  R.slotUse = (G, iata) => {
    let n = 0;
    G.fleet.forEach(ac => { if (!ac.route || ac.status === 'delivery') return; const r = G.routes.find(x => x.id === ac.route); if (r && (r.a === iata || r.b === iata)) n += ac.freq; });
    return n;
  };
  R.slotPrice = (G, iata) => {
    const ap = E.AP[iata]; const yf = U.yearF(G.t);
    const era = yf < 1990 ? 0.35 : yf < 2005 ? 0.7 : 1;
    return [0, 18000, 160000, 900000][ap.slot] * era * G.econ.cpi;
  };
  R.slotFee = (G, iata) => [0, 0, 300, 900][E.AP[iata].slot] * G.econ.cpi; // mensual por slot semanal
  R.slotsFree = (G, iata) => {
    const ap = E.AP[iata];
    if (ap.slot < 2) return Infinity;
    G.slotPool = G.slotPool || {};
    let p = G.slotPool[iata];
    if (!p || p.until < G.t) { p = G.slotPool[iata] = { n: Math.round([0, 60, 18, 5][ap.slot] * (0.5 + Math.random())), until: G.t + 24 * 182 }; }
    return p.n;
  };
  // negociación de slots: oferta = fracción del precio pedido
  R.negotiate = (G, iata, n, offerK) => {
    const free = R.slotsFree(G, iata);
    if (n > free) return { ok: false, msg: 'El coordinador solo tiene ' + free + ' slots disponibles esta temporada.' };
    const price = R.slotPrice(G, iata) * n * offerK;
    if (G.cash < price) return { ok: false, msg: 'No tenés caja suficiente.' };
    const p = U.clamp(0.15 + (offerK - 0.6) * 1.4 + (G.rep.overall - 50) / 120 + (G.bases[iata] ? 0.12 : 0), 0.03, 0.97);
    G.slotNeg = G.slotNeg || {};
    if (G.slotNeg[iata] && G.slotNeg[iata] > G.t) return { ok: false, msg: 'El coordinador no recibe nuevas ofertas hasta dentro de unos días.' };
    if (Math.random() < p) {
      E.X.cash(G, -price, 'infra');
      G.slots[iata] = (G.slots[iata] || 0) + n;
      G.slotPool[iata].n -= n;
      return { ok: true, msg: `Conseguiste ${n} slots semanales en ${iata} por ${U.money(price)}.` };
    }
    G.slotNeg[iata] = G.t + 24 * 7;
    return { ok: false, msg: 'El coordinador rechazó tu oferta. Podés volver a intentar en una semana.', p };
  };
  R.slotChance = (G, iata, offerK) => U.clamp(0.15 + (offerK - 0.6) * 1.4 + (G.rep.overall - 50) / 120 + (G.bases[iata] ? 0.12 : 0), 0.03, 0.97);
  // ¿hay slots suficientes para agregar f frecuencias en la ruta?
  R.slotCheck = (G, r, extra) => {
    const out = [];
    [r.a, r.b].forEach(i => {
      const ap = E.AP[i]; if (ap.slot < 2) return;
      const need = R.slotUse(G, i) + extra;
      const held = G.slots[i] || 0;
      if (need > held) out.push({ iata: i, need, held });
    });
    return out;
  };
  // revisión de uso de slots (úsalo o perdelo) cada temporada IATA
  R.seasonCheck = (G) => {
    Object.keys(G.slots).forEach(i => {
      const use = R.slotUse(G, i), held = G.slots[i];
      if (held > 0 && use < held * 0.8) {
        const lost = Math.floor((held - use) * 0.5);
        if (lost > 0) { G.slots[i] -= lost; E.X.inbox(G, 'Slots perdidos en ' + i, `Usaste solo ${use} de tus ${held} slots semanales: el coordinador te retiró ${lost} por la regla de "úsalo o perdelo" (80%).`, 'warn'); }
      }
    });
  };
  // bases
  R.canOpenBase = (G, iata) => {
    const ap = E.AP[iata], home = E.AP[G.airline.home];
    if (G.bases[iata]) return { ok: false, why: 'Ya es una base' };
    const abroad = ap.cc !== home.cc;
    const euFree = ap.region === 'EU' && home.region === 'EU' && U.yearF(G.t) >= 1997;
    if (abroad && !euFree && !G.research.done.subsid) return { ok: false, why: 'Para bases en otro país investigá "Filiales en el extranjero"' };
    if (!abroad || euFree) { if (R.license(G) === 'nat' && ap.cc !== home.cc) return { ok: false, why: 'Licencia insuficiente' }; }
    const cost = E.EC.baseCost(G, iata);
    if (G.cash < cost) return { ok: false, why: 'Necesitás ' + U.money(cost) };
    return { ok: true, cost, abroad: abroad && !euFree };
  };
  R.openBase = (G, iata) => {
    const c = R.canOpenBase(G, iata); if (!c.ok) return c;
    E.X.cash(G, -c.cost, 'infra');
    G.bases[iata] = { since: G.t, lounge: 0, hangar: 0, abroad: c.abroad };
    E.X.inbox(G, 'Nueva base', `Abriste una base en ${E.AP[iata].city}. Ya podés crear rutas desde allí.`, 'good');
    return { ok: true };
  };
  return R;
})();
