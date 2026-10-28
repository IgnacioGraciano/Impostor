/* ESTELA · meteorología dinámica: sistemas móviles, niebla, viento cruzado y corriente en chorro */
'use strict';
E.W = (() => {
  const U = E.U;
  const W = {};
  const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  // zonas de formación: [latMin, latMax, lonMin, lonMax]
  const ZONES = [
    { k: 'cyclone', b: [10, 24, 125, 160], m: [6, 7, 8, 9, 10], p: 0.22, n: 'Tifón', dir: 'w' },
    { k: 'cyclone', b: [12, 24, -78, -45], m: [7, 8, 9, 10], p: 0.17, n: 'Huracán', dir: 'w' },
    { k: 'cyclone', b: [12, 20, 62, 92], m: [4, 5, 9, 10], p: 0.06, n: 'Ciclón', dir: 'w' },
    { k: 'cyclone', b: [-22, -11, 112, 165], m: [0, 1, 2, 11], p: 0.08, n: 'Ciclón', dir: 'w' },
    { k: 'cyclone', b: [-22, -12, 48, 72], m: [0, 1, 2], p: 0.06, n: 'Ciclón', dir: 'w' },
    { k: 'front', b: [40, 60, -60, -12], m: ALL, p: 0.45, win: 0.35 },
    { k: 'front', b: [40, 56, 150, 215], m: ALL, p: 0.35, win: 0.3 },
    { k: 'front', b: [42, 60, -8, 30], m: ALL, p: 0.35, win: 0.35 },
    { k: 'front', b: [32, 50, -110, -72], m: ALL, p: 0.4, win: 0.3 },
    { k: 'front', b: [28, 44, 100, 140], m: [10, 11, 0, 1, 2, 3], p: 0.25 },
    { k: 'front', b: [-56, -34, -80, -52], m: ALL, p: 0.3, win: 0.3, south: true },
    { k: 'front', b: [-48, -32, 135, 180], m: ALL, p: 0.25, win: 0.3, south: true },
    { k: 'front', b: [-40, -28, 10, 40], m: [4, 5, 6, 7, 8], p: 0.15, south: true },
    { k: 'storm', b: [27, 46, -104, -80], m: [3, 4, 5, 6, 7, 8], p: 0.9 },
    { k: 'storm', b: [-32, 4, -68, -38], m: [9, 10, 11, 0, 1, 2, 3], p: 0.8 },
    { k: 'storm', b: [-10, 14, -15, 38], m: ALL, p: 0.6 },
    { k: 'storm', b: [-8, 24, 92, 125], m: ALL, p: 0.7 },
    { k: 'storm', b: [8, 28, 70, 92], m: [5, 6, 7, 8], p: 0.9 },
    { k: 'storm', b: [40, 54, -2, 35], m: [5, 6, 7], p: 0.5 },
    { k: 'storm', b: [20, 33, 105, 125], m: [4, 5, 6, 7, 8], p: 0.5 },
    { k: 'storm', b: [-30, -12, 130, 153], m: [10, 11, 0, 1, 2], p: 0.4 },
    { k: 'storm', b: [8, 22, -100, -78], m: [5, 6, 7, 8, 9], p: 0.5 },
    { k: 'snow', b: [38, 55, -98, -68], m: [11, 0, 1, 2], p: 0.35 },
    { k: 'snow', b: [45, 62, -2, 35], m: [11, 0, 1], p: 0.3 },
    { k: 'snow', b: [34, 46, 115, 145], m: [11, 0, 1], p: 0.25 },
    { k: 'snow', b: [50, 62, 30, 90], m: [10, 11, 0, 1, 2, 3], p: 0.3 },
    { k: 'snow', b: [-48, -36, -74, -64], m: [5, 6, 7], p: 0.15, south: true }
  ];
  const SPEC = {
    cyclone: { r: [350, 650], life: [140, 260], spd: [14, 24], int: [0.6, 1] },
    front: { r: [450, 900], life: [50, 110], spd: [35, 60], int: [0.3, 0.7] },
    storm: { r: [120, 320], life: [10, 36], spd: [8, 25], int: [0.45, 1] },
    snow: { r: [300, 600], life: [30, 80], spd: [25, 45], int: [0.4, 0.9] }
  };
  const NAMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Félix', 'Gala', 'Hugo', 'Irene', 'Joaquín', 'Kira', 'Leo', 'Mara', 'Nico', 'Olga', 'Pablo', 'Rita', 'Saúl', 'Tania', 'Vera'];

  const spawn = (G, z) => {
    const S = SPEC[z.k];
    const lat = U.rand(z.b[0], z.b[1]);
    let lon = U.rand(z.b[2], z.b[3]); if (lon > 180) lon -= 360;
    const spd = U.rand(S.spd[0], S.spd[1]);
    let ang; // dirección de movimiento (rad, 0 = este)
    if (z.k === 'front' || z.k === 'snow') ang = U.rand(-0.35, 0.35) + (z.south ? -0.15 : 0.15);
    else if (z.k === 'cyclone') ang = Math.PI + U.rand(-0.5, 0.1) * (lat > 0 ? -1 : 1);
    else ang = U.rand(0, Math.PI * 2);
    const c = {
      id: U.uid(G, 'w'), k: z.k, lat, lon, r: U.rand(S.r[0], S.r[1]), int: U.rand(S.int[0], S.int[1]),
      vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, age: 0, life: U.rand(S.life[0], S.life[1]), rot: U.rand(0, 6.28)
    };
    if (z.k === 'cyclone') { c.name = z.n + ' ' + NAMES[(G.weather.nameI = ((G.weather.nameI || 0) + 1)) % NAMES.length]; }
    G.weather.cells.push(c);
    return c;
  };
  W.init = (G) => {
    G.weather.cells = [];
    for (let i = 0; i < 6; i++) W.daily(G, true);
    G.weather.cells.forEach(c => c.age = U.rand(0, c.life * 0.6));
  };
  W.daily = (G) => {
    const mo = U.month(G.t);
    ZONES.forEach(z => {
      if (!z.m.includes(mo)) return;
      let p = z.p;
      if (z.win) { const winter = z.south ? [5, 6, 7, 8].includes(mo) : [10, 11, 0, 1, 2].includes(mo); if (winter) p += z.win; }
      let n = Math.floor(p) + (U.chance(p - Math.floor(p)) ? 1 : 0);
      while (n-- > 0) spawn(G, z);
    });
    if (G.weather.cells.length > 70) G.weather.cells.splice(0, G.weather.cells.length - 70);
  };
  W.step = (G, h) => {
    const cells = G.weather.cells;
    for (let i = cells.length - 1; i >= 0; i--) {
      const c = cells[i];
      c.age += h;
      // los ciclones recurvan hacia el polo
      if (c.k === 'cyclone' && c.age > c.life * 0.45) { const pole = c.lat > 0 ? 1 : -1; c.vy += pole * 0.12 * h; c.vx += 0.12 * h; }
      c.lat += c.vy * h / 111;
      c.lon += c.vx * h / (111 * Math.max(0.2, Math.cos(c.lat * U.DEG)));
      if (c.lon > 180) c.lon -= 360; if (c.lon < -180) c.lon += 360;
      c.rot += h * (c.k === 'cyclone' ? 0.25 : 0.05);
      if (c.age > c.life || Math.abs(c.lat) > 75) cells.splice(i, 1);
    }
  };
  W.cellStrength = (c) => { const f = c.age / c.life; return c.int * Math.min(1, f * 5) * Math.min(1, (1 - f) * 4); };

  // condición en un aeropuerto
  W.at = (G, iata, t) => {
    t = t || G.t;
    const ap = E.AP[iata];
    let best = { k: 'clear', sev: 0 };
    const mo = U.month(t);
    G.weather.cells.forEach(c => {
      const d = U.dist(ap, c);
      if (d > c.r) return;
      const s = W.cellStrength(c) * (1 - d / c.r * 0.7);
      let k = c.k;
      if (k === 'front') k = s > 0.55 ? 'storm' : 'rain';
      if (k === 'snow' && Math.abs(ap.lat) < 30) k = 'rain';
      if (k === 'cyclone') k = d < c.r * 0.45 ? 'cyclone' : 'storm';
      const rank = { clear: 0, rain: 1, wind: 1.5, snow: 2, storm: 2.5, fog: 2.2, cyclone: 4 }[k] + s;
      const brank = { clear: 0, rain: 1, wind: 1.5, snow: 2, storm: 2.5, fog: 2.2, cyclone: 4 }[best.k] + best.sev;
      if (rank > brank) best = { k, sev: U.clamp(s, 0, 1), cell: c };
    });
    // niebla matinal (determinista por día)
    const day = U.dayIdx(t);
    const lh = U.localHour(t, ap.lon);
    const winterN = [10, 11, 0, 1, 2].includes(mo), winterS = [5, 6, 7, 8].includes(mo);
    let fogP = ap.fog * ((ap.lat > 0 && winterN) || (ap.lat < 0 && winterS) ? 1.6 : 0.6);
    if (ap.iata === 'SFO') fogP = ap.fog * ([5, 6, 7, 8].includes(mo) ? 1.8 : 0.6);
    if (best.k === 'clear' && lh >= 2 && lh <= 10.5 && U.hash(iata + day) < fogP * 0.16) best = { k: 'fog', sev: 0.5 + U.hash(iata + day + 'f') * 0.5 };
    if (best.k === 'clear' && U.hash(iata + day + 'w') < ap.wind * 0.22 && lh > 9 && lh < 21) best = { k: 'wind', sev: 0.4 + U.hash(iata + day + 'v') * 0.6 };
    return best;
  };
  W.LABEL = { clear: 'Despejado', rain: 'Lluvia', storm: 'Tormentas', snow: 'Nieve', fog: 'Niebla', wind: 'Viento cruzado', cyclone: 'Ciclón' };
  W.ICON = { clear: 'sun', rain: 'rain', storm: 'storm', snow: 'snow', fog: 'fog', wind: 'wind', cyclone: 'cyclone' };

  // componente de viento medio (km/h, positivo = de cola) por corriente en chorro
  const wcache = {};
  W.routeWind = (G, from, to) => {
    const mo = U.month(G.t);
    const key = from + to + mo;
    if (wcache[key] != null) return wcache[key];
    const a = E.AP[from], b = E.AP[to];
    const pts = U.gcPath(a, b, 10);
    let sum = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const p = { lat: pts[i][1], lon: pts[i][0] }, q = { lat: pts[i + 1][1], lon: pts[i + 1][0] };
      const brg = U.bearing(p, q) * U.DEG;
      const al = Math.abs(p.lat);
      const north = p.lat >= 0;
      const season = 1 + 0.35 * Math.cos(((mo + (north ? 0 : 6)) % 12 + 0.5) / 12 * Math.PI * 2);
      const jet = 125 * Math.exp(-Math.pow((al - 38) / 11, 2)) * season - 22 * Math.exp(-Math.pow((al - 14) / 8, 2));
      sum += jet * Math.sin(brg);
    }
    return (wcache[key] = sum / (pts.length - 1));
  };
  // severidad meteorológica a lo largo de una trayectoria (para turbulencia y desvíos)
  W.pathSeverity = (G, path) => {
    let s = 0;
    for (let i = 0; i < path.length; i += 3) {
      const p = { lat: path[i][1], lon: path[i][0] };
      for (const c of G.weather.cells) {
        if (c.k === 'snow') continue;
        if (Math.abs(c.lat - p.lat) > 8) continue;
        const d = U.dist(p, c);
        if (d < c.r) s = Math.max(s, W.cellStrength(c) * (1 - d / c.r) * (c.k === 'front' ? 0.5 : 1));
      }
    }
    return s;
  };
  return W;
})();
