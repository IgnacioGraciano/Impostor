/* ESTELA · geografía: decodificación del mapa, tierra/agua y análisis de rutas */
'use strict';
E.GEO = (() => {
  const Gx = {};
  const W = window.WORLD_GEO;
  const dec = arr => { const q = W.q; const out = []; let x = 0, y = 0; for (let i = 0; i < arr.length; i += 2) { x += arr[i]; y += arr[i + 1]; out.push([x / q, y / q]); } return out; };
  Gx.land = W.land.map(dec);
  Gx.borders = W.borders.map(dec);
  Gx.bbox = Gx.land.map(r => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; r.forEach(([x, y]) => { if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y; }); return [a, b, c, d]; });

  Gx.isLand = (lon, lat) => {
    lon = ((lon + 540) % 360) - 180;
    let inside = false;
    for (let k = 0; k < Gx.land.length; k++) {
      const bb = Gx.bbox[k];
      if (lon < bb[0] || lon > bb[2] || lat < bb[1] || lat > bb[3]) continue;
      const r = Gx.land[k];
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1];
        if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
      }
    }
    return inside;
  };

  // aeropuertos de alternativa oceánica (solo para ETOPS y desvíos, sin demanda comercial)
  Gx.ALTS = [['YQX', 'Gander', 48.94, -54.57], ['TER', 'Lajes (Azores)', 38.76, -27.09], ['SID', 'Sal (Cabo Verde)', 16.74, -22.95], ['ASI', 'Isla Ascensión', -7.97, -14.39], ['BDA', 'Bermudas', 32.36, -64.68], ['SNN', 'Shannon', 52.70, -8.92],
    ['MDY', 'Midway', 28.20, -177.38], ['AWK', 'Isla Wake', 19.28, 166.64], ['CDB', 'Cold Bay', 55.21, -162.72], ['PKC', 'Petropávlovsk', 53.17, 158.45], ['CCK', 'Islas Cocos', -12.19, 96.83], ['MAJ', 'Majuro', 7.06, 171.27],
    ['CXI', 'Kiritimati', 1.99, -157.35], ['NLK', 'Isla Norfolk', -29.04, 167.94], ['HNL', 'Honolulu', 21.32, -157.92], ['RUN', 'Reunión', -20.89, 55.51], ['FPO', 'Freeport', 26.56, -78.70], ['SFJ', 'Kangerlussuaq', 67.01, -50.69],
    ['BGI', 'Barbados', 13.07, -59.49], ['NBO', 'Nairobi', -1.32, 36.93], ['DGA', 'Diego García', -7.31, 72.41], ['PTP', 'Guadalupe', 16.27, -61.53], ['FAI', 'Fairbanks', 64.82, -147.86], ['ROB', 'Monrovia', 6.23, -10.36]]
    .map(([iata, city, lat, lon]) => ({ iata, city, lat, lon }));
  // análisis de una ruta: fracción sobre agua, tramo oceánico continuo más largo y máxima distancia a un alternativo (km)
  const cache = {};
  Gx.analyze = (a, b) => {
    const key = a.iata < b.iata ? a.iata + b.iata : b.iata + a.iata;
    if (cache[key]) return cache[key];
    const d = E.U.dist(a, b);
    const n = Math.max(8, Math.min(120, Math.round(d / 60)));
    const pts = E.U.gcPath(a, b, n);
    let water = 0, run = 0, maxRun = 0;
    const seg = d / n;
    const wet = pts.map((p, i) => i > 0 && i < n && !Gx.isLand(p[0], p[1]));
    wet.forEach((w, i) => {
      if (i === 0 || i === n) return;
      if (w) { water++; run += seg; if (run > maxRun) maxRun = run; } else run = 0;
    });
    // distancia máxima a un aeropuerto de alternativa a lo largo de la trayectoria
    const alts = E.AIRPORTS.filter(x => x.rwy >= 2400).concat(Gx.ALTS);
    let div = 0;
    pts.forEach((p, i) => {
      if (!wet[i]) return; // sobre tierra siempre hay pistas de emergencia cerca
      const q = { lon: p[0], lat: p[1] };
      let m = 1e9;
      for (const x of alts) { if (Math.abs(x.lat - q.lat) > 30) continue; const dd = E.U.dist(q, x); if (dd < m) m = dd; }
      if (m > div) div = m;
    });
    const res = { d, water: water / Math.max(1, n - 1), gap: maxRun, div: Math.min(div, 9999), lat: Math.max(...pts.map(p => Math.abs(p[1]))) };
    cache[key] = res;
    return res;
  };
  return Gx;
})();
