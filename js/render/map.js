/* ESTELA · mapa del mundo en canvas: proyección Miller, día/noche, clima, rutas y tráfico animado */
'use strict';
E.MAP = (() => {
  const U = E.U;
  const M = {};
  let cv, ctx, W = 0, H = 0, dpr = 1;
  const cam = { x: -40, y: 0, z: 4 };
  let vel = { x: 0, y: 0 }, lastInteract = 0;
  M.layers = { weather: true, night: true, routes: true, labels: true, traffic: true };
  M.sel = null;          // {kind:'flight'|'airport', id}
  M.preview = null;      // {a, b} ruta en planificación
  M.highlight = null;    // id de ruta resaltada
  let G = null;
  const PAL = {
    dark: { ocean0: '#0c1b2e', ocean1: '#08121f', land: '#203248', land2: '#22344a', coast: 'rgba(120,160,200,.42)', border: 'rgba(150,180,215,.10)', grat: 'rgba(120,160,210,.06)', label: 'rgba(210,222,236,.9)', labelDim: 'rgba(170,186,206,.55)', ap: 'rgba(160,180,205,.55)', night: [3, 6, 16, .62], lights: '#ffcf7a', contrail: '255,255,255', vign: 'rgba(2,6,14,.55)' },
    light: { ocean0: '#d6e6ea', ocean1: '#c4d8de', land: '#efe6d2', land2: '#e6dbc3', coast: 'rgba(120,100,70,.45)', border: 'rgba(120,95,60,.22)', grat: 'rgba(60,100,120,.10)', label: 'rgba(48,44,38,.92)', labelDim: 'rgba(80,74,64,.6)', ap: 'rgba(90,84,74,.55)', night: [18, 28, 62, .3], lights: '#ffd27a', contrail: '255,255,255', vign: 'rgba(80,90,100,.18)' }
  };
  let pal = PAL.dark;
  M.setTheme = th => { pal = PAL[th] || PAL.dark; baseDirty = true; };

  /* ---------- geometría proyectada ---------- */
  const Y = lat => -U.projY(lat);
  const YMIN = Y(83), YMAX = Y(-62);
  let landPath, borderPath, gratPath;
  const buildPaths = () => {
    landPath = new Path2D();
    E.GEO.land.forEach(r => { r.forEach(([x, y], i) => { const py = Y(y); if (i) landPath.lineTo(x, py); else landPath.moveTo(x, py); }); landPath.closePath(); });
    borderPath = new Path2D();
    E.GEO.borders.forEach(r => { r.forEach(([x, y], i) => { const py = Y(y); if (i) borderPath.lineTo(x, py); else borderPath.moveTo(x, py); }); });
    gratPath = new Path2D();
    for (let lon = -180; lon <= 180; lon += 30) { gratPath.moveTo(lon, Y(80)); gratPath.lineTo(lon, Y(-60)); }
    for (let lat = -60; lat <= 80; lat += 20) { gratPath.moveTo(-180, Y(lat)); gratPath.lineTo(180, Y(lat)); }
  };

  /* ---------- cámara ---------- */
  const zMin = () => Math.max(H / (YMAX - YMIN) * 1.02, W / 360 * 0.9);
  const clampCam = () => {
    cam.z = U.clamp(cam.z, zMin(), 90);
    const half = H / 2 / cam.z;
    cam.y = U.clamp(cam.y, YMIN + half, YMAX - half);
    if (YMAX - YMIN < half * 2) cam.y = (YMIN + YMAX) / 2;
    if (cam.x > 180) cam.x -= 360; if (cam.x < -180) cam.x += 360;
  };
  const toScreen = (x, y) => [(x - cam.x) * cam.z + W / 2, (y - cam.y) * cam.z + H / 2];
  const wrapX = x => { let d = x - cam.x; while (d > 180) d -= 360; while (d < -180) d += 360; return cam.x + d; };
  M.project = (lon, lat) => toScreen(wrapX(lon), Y(lat));
  M.focus = (lon, lat, z) => { cam.x = lon; cam.y = Y(lat); if (z) cam.z = z; clampCam(); baseDirty = true; };
  M.focusAirport = (iata, z) => { const a = E.AP[iata]; if (a) M.focus(a.lon, a.lat, z || Math.max(cam.z, 14)); };
  M.fit = (pts) => {
    if (!pts.length) return;
    let lons = pts.map(p => p.lon), lats = pts.map(p => p.lat);
    const c0 = lons[0]; lons = lons.map(l => { let d = l - c0; while (d > 180) d -= 360; while (d < -180) d += 360; return c0 + d; });
    const x0 = Math.min(...lons), x1 = Math.max(...lons), y0 = Math.min(...lats.map(Y)), y1 = Math.max(...lats.map(Y));
    cam.x = (x0 + x1) / 2; cam.y = (y0 + y1) / 2;
    cam.z = Math.min(W / Math.max(8, (x1 - x0) * 1.35), H / Math.max(6, (y1 - y0) * 1.5), 30);
    clampCam(); baseDirty = true;
  };
  M.cam = cam;

  /* ---------- capa base cacheada ---------- */
  let base, bctx, baseDirty = true, baseCam = { x: 0, y: 0, z: 0 }, margin = 0;
  const renderBase = () => {
    margin = Math.round(Math.max(W, H) * 0.25);
    const bw = W + margin * 2, bh = H + margin * 2;
    if (!base) { base = document.createElement('canvas'); bctx = base.getContext('2d'); }
    if (base.width !== bw * dpr || base.height !== bh * dpr) { base.width = bw * dpr; base.height = bh * dpr; }
    const c = bctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, bh * dpr);
    g.addColorStop(0, pal.ocean0); g.addColorStop(1, pal.ocean1);
    c.fillStyle = g; c.fillRect(0, 0, bw * dpr, bh * dpr);
    const z = cam.z;
    const copies = [-360, 0, 360];
    copies.forEach(off => {
      const ox = (off - cam.x) * z + W / 2 + margin, oy = (-cam.y) * z + H / 2 + margin;
      if (ox + 180 * z < -10 || ox - 180 * z > bw + 10) return;
      c.setTransform(dpr * z, 0, 0, dpr * z, dpr * ox, dpr * oy);
      c.lineWidth = 0.6 / z; c.strokeStyle = pal.grat; c.stroke(gratPath);
      c.fillStyle = pal.land; c.fill(landPath);
      c.lineWidth = 0.9 / z; c.strokeStyle = pal.coast; c.stroke(landPath);
      if (z > 2.4) { c.lineWidth = 0.6 / z; c.strokeStyle = pal.border; c.stroke(borderPath); }
    });
    c.setTransform(1, 0, 0, 1, 0, 0);
    baseCam = { x: cam.x, y: cam.y, z: cam.z };
    baseDirty = false;
  };
  const drawBase = () => {
    const now = performance.now();
    let dx = (baseCam.x - cam.x), ddx = dx; while (ddx > 180) ddx -= 360; while (ddx < -180) ddx += 360;
    const offX = ddx * cam.z, offY = (baseCam.y - cam.y) * cam.z;
    const zoomed = Math.abs(baseCam.z - cam.z) > 1e-6;
    if (baseDirty || !base || (!zoomed && (Math.abs(offX) > margin * 0.9 || Math.abs(offY) > margin * 0.9)) || (zoomed && now - lastInteract > 90)) renderBase();
    const k = cam.z / baseCam.z;
    let ox = (baseCam.x - cam.x); while (ox > 180) ox -= 360; while (ox < -180) ox += 360;
    const sx = W / 2 + (ox * cam.z) - (W / 2 + margin) * k, sy = H / 2 + (baseCam.y - cam.y) * cam.z - (H / 2 + margin) * k;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = pal.ocean1; ctx.fillRect(0, 0, W * dpr, H * dpr);
    ctx.drawImage(base, sx * dpr, sy * dpr, base.width * k, base.height * k);
  };

  /* ---------- noche ---------- */
  let nightCv, nctx, nightT = -1, lights = [], lightPts = null;
  const NW = 240, NH = 120;
  const buildLights = () => {
    lightPts = [];
    const rnd = U.rng('luces');
    E.AIRPORTS.forEach(a => {
      const n = Math.round(3 + Math.sqrt(a.pop) * 7);
      for (let i = 0; i < n; i++) {
        const r = (0.12 + Math.sqrt(a.pop) * 0.14) * Math.sqrt(rnd());
        const ang = rnd() * Math.PI * 2;
        lightPts.push({ lon: a.lon + Math.cos(ang) * r * 1.3, lat: a.lat + Math.sin(ang) * r, w: 0.4 + rnd() * 0.6 * Math.min(1, a.pop / 8) });
      }
    });
  };
  const renderNight = (t) => {
    if (!nightCv) { nightCv = document.createElement('canvas'); nightCv.width = NW; nightCv.height = NH; nctx = nightCv.getContext('2d'); }
    const img = nctx.createImageData(NW, NH);
    const sun = U.sun(t);
    const [r, g, b, A] = pal.night;
    for (let j = 0; j < NH; j++) {
      const py = YMIN + (j + 0.5) / NH * (YMAX - YMIN);
      const lat = U.unprojY(-py);
      for (let i = 0; i < NW; i++) {
        const lon = -180 + (i + 0.5) / NW * 360;
        const el = U.sunElev(lat, lon, sun);
        const a = U.smooth(4, -14, el);
        const k = (j * NW + i) * 4;
        img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = a * A * 255;
      }
    }
    nctx.putImageData(img, 0, 0);
    if (!lightPts) buildLights();
    lights = [];
    lightPts.forEach(p => { const el = U.sunElev(p.lat, p.lon, sun); const a = U.smooth(-2, -10, el); if (a > 0.05) lights.push([p.lon, Y(p.lat), a * p.w]); });
    nightT = t;
  };
  let glow;
  const glowSprite = () => {
    glow = document.createElement('canvas'); glow.width = glow.height = 32;
    const c = glow.getContext('2d'); const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,214,140,1)'); g.addColorStop(0.25, 'rgba(255,190,110,.55)'); g.addColorStop(1, 'rgba(255,170,90,0)');
    c.fillStyle = g; c.fillRect(0, 0, 32, 32);
  };
  const drawNight = (t) => {
    if (Math.abs(t - nightT) > 0.08 || nightT < 0) renderNight(t);
    [-360, 0, 360].forEach(off => {
      const ox = (-180 + off - cam.x) * cam.z + W / 2;
      if (ox > W || ox + 360 * cam.z < 0) return;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(nightCv, ox, (YMIN - cam.y) * cam.z + H / 2, 360 * cam.z, (YMAX - YMIN) * cam.z);
    });
    if (!glow) glowSprite();
    ctx.globalCompositeOperation = 'lighter';
    const s = U.clamp(cam.z * 0.5, 1.6, 9);
    for (const [lon, py, a] of lights) {
      const [x, y] = toScreen(wrapX(lon), py);
      if (x < -10 || y < -10 || x > W + 10 || y > H + 10) continue;
      ctx.globalAlpha = Math.min(1, a * (pal === PAL.light ? 0.5 : 0.85));
      ctx.drawImage(glow, x - s, y - s, s * 2, s * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  /* ---------- clima ---------- */
  const drawWeather = (now) => {
    if (!G) return;
    for (const c of G.weather.cells) {
      const st = E.W.cellStrength(c);
      if (st < 0.05) continue;
      const [x, y] = M.project(c.lon, c.lat);
      const rr = c.r / 111 * cam.z / Math.max(0.35, Math.cos(c.lat * U.DEG)) * 0.95;
      if (x + rr < 0 || y + rr < 0 || x - rr > W || y - rr > H || rr < 2) continue;
      ctx.save();
      ctx.translate(x, y);
      if (c.k === 'cyclone') {
        ctx.rotate(c.rot + now * 0.00008 * (c.lat > 0 ? -1 : 1));
        const g = ctx.createRadialGradient(0, 0, rr * 0.05, 0, 0, rr);
        g.addColorStop(0, `rgba(255,255,255,${0.1 * st})`); g.addColorStop(0.15, `rgba(235,240,250,${0.55 * st})`); g.addColorStop(0.6, `rgba(210,220,235,${0.25 * st})`); g.addColorStop(1, 'rgba(210,220,235,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(245,248,255,${0.35 * st})`; ctx.lineWidth = Math.max(1.5, rr * 0.08); ctx.lineCap = 'round';
        for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let a = 0; a < 3.6; a += 0.12) { const rad = rr * (0.12 + a / 4.2); const ang = a * (c.lat > 0 ? 1 : -1) + k * 2.094; const px = Math.cos(ang) * rad, py = Math.sin(ang) * rad; if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke(); }
        ctx.fillStyle = `rgba(20,30,50,${0.5 * st})`; ctx.beginPath(); ctx.arc(0, 0, Math.max(1.5, rr * 0.05), 0, Math.PI * 2); ctx.fill();
      } else if (c.k === 'storm') {
        ctx.rotate(c.rot);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
        g.addColorStop(0, `rgba(230,60,60,${0.55 * st})`); g.addColorStop(0.28, `rgba(245,190,50,${0.45 * st})`); g.addColorStop(0.62, `rgba(70,200,110,${0.28 * st})`); g.addColorStop(1, 'rgba(70,200,110,0)');
        ctx.fillStyle = g; ctx.scale(1, 0.78); ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill();
      } else if (c.k === 'snow') {
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
        g.addColorStop(0, `rgba(225,238,255,${0.4 * st})`); g.addColorStop(1, 'rgba(225,238,255,0)');
        ctx.fillStyle = g; ctx.scale(1.4, 0.75); ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill();
      } else {
        const ang = Math.atan2(c.vy, c.vx);
        ctx.rotate(-ang + Math.PI / 2);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
        g.addColorStop(0, `rgba(80,190,130,${0.32 * st})`); g.addColorStop(0.5, `rgba(80,170,200,${0.18 * st})`); g.addColorStop(1, 'rgba(80,170,200,0)');
        ctx.fillStyle = g; ctx.scale(1.6, 0.6); ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      if (c.name && cam.z > 2.5) { ctx.font = '600 10px Inter, system-ui, sans-serif'; ctx.fillStyle = 'rgba(235,240,250,.8)'; ctx.textAlign = 'center'; ctx.fillText(c.name, x, y + rr * 0.55 + 12); }
    }
  };

  /* ---------- siluetas cenitales ---------- */
  const SIL = {};
  const mkSil = () => {
    const jet = new Path2D('M0.5 0 C0.48 -0.035 0.4 -0.045 0.3 -0.045 L0.08 -0.045 L-0.12 -0.5 L-0.2 -0.5 L-0.1 -0.045 L-0.36 -0.04 L-0.44 -0.18 L-0.5 -0.18 L-0.47 -0.035 L-0.5 0 L-0.47 0.035 L-0.5 0.18 L-0.44 0.18 L-0.36 0.04 L-0.1 0.045 L-0.2 0.5 L-0.12 0.5 L0.08 0.045 L0.3 0.045 C0.4 0.045 0.48 0.035 0.5 0 Z');
    const wide = new Path2D('M0.5 0 C0.48 -0.05 0.4 -0.06 0.3 -0.06 L0.1 -0.06 L-0.12 -0.5 L-0.21 -0.5 L-0.1 -0.06 L-0.35 -0.05 L-0.44 -0.2 L-0.5 -0.2 L-0.47 -0.04 L-0.5 0 L-0.47 0.04 L-0.5 0.2 L-0.44 0.2 L-0.35 0.05 L-0.1 0.06 L-0.21 0.5 L-0.12 0.5 L0.1 0.06 L0.3 0.06 C0.4 0.06 0.48 0.05 0.5 0 Z');
    const prop = new Path2D('M0.5 0 C0.48 -0.04 0.4 -0.05 0.3 -0.05 L0.1 -0.05 L0.1 -0.5 L-0.03 -0.5 L-0.04 -0.05 L-0.36 -0.04 L-0.38 -0.2 L-0.47 -0.2 L-0.47 -0.04 L-0.5 0 L-0.47 0.04 L-0.47 0.2 L-0.38 0.2 L-0.36 0.04 L-0.04 0.05 L-0.03 0.5 L0.1 0.5 L0.1 0.05 L0.3 0.05 C0.4 0.05 0.48 0.04 0.5 0 Z');
    const sst = new Path2D('M0.5 0 L0.3 -0.03 L0.05 -0.05 L-0.42 -0.3 L-0.48 -0.3 L-0.48 -0.04 L-0.5 0 L-0.48 0.04 L-0.48 0.3 L-0.42 0.3 L0.05 0.05 L0.3 0.03 Z');
    SIL.jet = jet; SIL.wide = wide; SIL.prop = prop; SIL.sst = sst;
  };
  const silFor = t => t.sst ? SIL.sst : t.prop ? SIL.prop : (t.cat === 'wb' || t.cat === 'jb' || t.cat === 'fr') && t.len > 45 ? SIL.wide : SIL.jet;

  /* ---------- rutas ---------- */
  const routeCache = new Map();
  const projPath = (key, a, b) => {
    let p = routeCache.get(key);
    if (!p) { p = U.gcPath(E.AP[a], E.AP[b]).map(([x, y]) => [x, Y(y)]); routeCache.set(key, p); }
    return p;
  };
  const strokePath = (pts) => {
    // dibuja la polilínea en la copia del mundo más cercana a la cámara (y la vecina si hace falta)
    const mid = pts[Math.floor(pts.length / 2)][0];
    const base = wrapX(mid) - mid;
    [base - 360, base, base + 360].forEach(off => {
      const x0 = (pts[0][0] + off - cam.x) * cam.z + W / 2, x1 = (pts[pts.length - 1][0] + off - cam.x) * cam.z + W / 2;
      if (Math.max(x0, x1) < -50 || Math.min(x0, x1) > W + 50) return;
      ctx.beginPath();
      pts.forEach(([x, y], i) => { const sx = (x + off - cam.x) * cam.z + W / 2, sy = (y - cam.y) * cam.z + H / 2; if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); });
      ctx.stroke();
    });
  };
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; };
  const mix = (hex, to, k) => { const n = parseInt(hex.slice(1), 16), m = parseInt(to.slice(1), 16); const c = [16, 8, 0].map(s => Math.round(((n >> s) & 255) * (1 - k) + ((m >> s) & 255) * k)); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); };
  M.routeColor = () => { const p = G.airline.p; const L = lum(p); if (pal === PAL.light) return L > 0.75 ? mix(p, '#000000', 0.45) : p; return L < 0.45 ? mix(p, '#ffffff', 0.55 - L * 0.6) : p; };
  const drawRoutes = () => {
    if (!G) return;
    const col = M.routeColor();
    ctx.lineCap = 'round';
    for (const r of G.routes) {
      const pts = projPath(r.key, r.a, r.b);
      const hl = M.highlight === r.id;
      const active = E.FL.routeFreq(G, r) > 0;
      ctx.strokeStyle = hl ? '#fff' : col;
      ctx.globalAlpha = hl ? 0.95 : active ? 0.5 : 0.22;
      ctx.lineWidth = hl ? 2.6 : Math.min(2.2, 0.9 + E.FL.routeFreq(G, r) / 30);
      if (!active) ctx.setLineDash([4, 5]);
      strokePath(pts);
      ctx.setLineDash([]);
    }
    if (M.preview && M.preview.a && M.preview.b) {
      const pts = projPath('pv' + M.preview.a + M.preview.b, M.preview.a, M.preview.b);
      ctx.strokeStyle = '#ffd27a'; ctx.globalAlpha = 0.95; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -(performance.now() / 60) % 12;
      strokePath(pts); ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1;
  };

  /* ---------- aeropuertos ---------- */
  let apScreen = [];
  const drawAirports = () => {
    if (!G) return;
    apScreen = [];
    const served = new Set();
    G.routes.forEach(r => { served.add(r.a); served.add(r.b); });
    const z = cam.z;
    ctx.textBaseline = 'middle';
    const boxes = [];
    const free = (x, y, w) => { for (const b of boxes) if (x < b[0] + b[2] && x + w > b[0] && Math.abs(y - b[1]) < 12) return false; boxes.push([x, y, w]); return true; };
    const order = E.AIRPORTS.slice().sort((p, q) => (G.bases[q.iata] ? 10 : served.has(q.iata) ? 5 : 0) + q.size - ((G.bases[p.iata] ? 10 : served.has(p.iata) ? 5 : 0) + p.size));
    for (const a of order) {
      const [x, y] = M.project(a.lon, a.lat);
      if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
      const base = !!G.bases[a.iata], srv = served.has(a.iata);
      const show = base || srv || a.size >= 5 || (a.size >= 4 && z > 3) || (a.size >= 3 && z > 6) || z > 9 || (M.preview && (M.preview.a === a.iata || M.preview.b === a.iata));
      if (!show) continue;
      apScreen.push([x, y, a.iata]);
      const w = E.W.at(G, a.iata);
      if (M.layers.weather && w.k === 'fog' && z > 3) { ctx.fillStyle = `rgba(210,215,225,${0.25 * w.sev})`; ctx.beginPath(); ctx.arc(x, y, 10 + z * 0.3, 0, Math.PI * 2); ctx.fill(); }
      if (base) {
        ctx.fillStyle = G.airline.p; ctx.beginPath(); ctx.arc(x, y, 5.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.strokeStyle = G.airline.p; ctx.globalAlpha = 0.35; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 9 + Math.sin(performance.now() / 600) * 1.2, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      } else if (srv) {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = G.airline.p; ctx.lineWidth = 1.4; ctx.stroke();
      } else {
        ctx.fillStyle = pal.ap; ctx.beginPath(); ctx.arc(x, y, a.size >= 4 ? 2.2 : 1.6, 0, Math.PI * 2); ctx.fill();
      }
      if (M.layers.labels && (base || srv || z > 5 || (a.size >= 5 && z > 2.2)) && free(x + 6, y, z > 11 ? Math.max(30, a.city.length * 5.6) : 30)) {
        const big = base || z > 12;
        ctx.font = (base ? '700 ' : '600 ') + (big ? 11 : 10) + 'px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = base || srv ? pal.label : pal.labelDim;
        ctx.textAlign = 'left';
        ctx.fillText(a.iata, x + 7, y - 1);
        if (z > 11) { ctx.font = '500 10px Inter, system-ui, sans-serif'; ctx.fillStyle = pal.labelDim; ctx.fillText(a.city, x + 7, y + 11); }
      }
    }
  };

  /* ---------- tráfico ---------- */
  let planeScreen = [];
  const drawTraffic = (now) => {
    if (!G) return;
    planeScreen = [];
    const t = G.t + M.lerpT;
    const col = G.airline.p, rc = M.routeColor();
    const sizeK = U.clamp(Math.pow(cam.z, 0.45) * 5, 10, 34);
    const labels = cam.z > 9;
    for (const f of G.flights) {
      const p = E.FL.pos(G, f, t);
      if (!p) continue;
      const [x, y] = M.project(p.lon, p.lat);
      if (x < -40 || y < -40 || x > W + 40 || y > H + 40) continue;
      const ac = G.fleet.find(a => a.id === f.ac); if (!ac) continue;
      const ty = E.AC[ac.type];
      const size = sizeK * U.clamp(Math.sqrt(ty.len / 38), 0.72, 1.5);
      const sel = M.sel && M.sel.kind === 'flight' && M.sel.id === f.id;
      // estela
      if (p.phase !== 'hold') {
        const path = E.FL.path(f);
        const idx = p.idx;
        const d = U.dist(E.AP[f.o] || f.from, E.AP[f.d]);
        const span = Math.min(idx, (path.length - 1) * Math.min(0.5, (380 + cam.z * 6) / Math.max(1, d)) * (0.4 + p.alt * 0.6));
        if (span > 0.2) {
          const n = 7;
          let prev = null;
          ctx.lineCap = 'round';
          for (let k = 0; k <= n; k++) {
            const xi = idx - span + span * k / n;
            const i0 = Math.floor(xi), kk = xi - i0;
            const a = path[Math.max(0, i0)], b = path[Math.min(path.length - 1, i0 + 1)];
            const lon = a[0] + (b[0] - a[0]) * kk, lat = a[1] + (b[1] - a[1]) * kk;
            const pt = M.project(lon, lat);
            if (prev && Math.abs(pt[0] - prev[0]) < W / 2) {
              ctx.strokeStyle = `rgba(${pal.contrail},${(k / n) * (pal === PAL.light ? 0.75 : 0.32) * p.alt})`;
              ctx.lineWidth = 1 + (k / n) * size * 0.12;
              ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(pt[0], pt[1]); ctx.stroke();
            }
            prev = pt;
          }
        }
      }
      const ang = (p.hdg - 90) * U.DEG;
      // sombra (más separada en crucero)
      const sh = 1.5 + p.alt * size * 0.18;
      ctx.save();
      ctx.translate(x + sh * 0.6, y + sh);
      ctx.rotate(ang); ctx.scale(size, size);
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fill(silFor(ty));
      ctx.restore();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang); ctx.scale(size, size);
      const sil = silFor(ty);
      ctx.fillStyle = f.ferry ? '#9aa8ba' : '#f3f6fa'; ctx.fill(sil);
      ctx.lineWidth = 1.4 / size; ctx.strokeStyle = rc; ctx.stroke(sil);
      // cola con color de la librea
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-0.32, 0); ctx.lineTo(-0.5, -0.05); ctx.lineTo(-0.5, 0.05); ctx.closePath(); ctx.fill();
      ctx.fillRect(-0.1, -0.03, 0.35, 0.06);
      ctx.restore();
      if (f.emg && f.emg.done && !f.ferry) { ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, size * 0.8 + Math.sin(now / 150) * 2, 0, Math.PI * 2); ctx.stroke(); }
      if (sel) {
        ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, size * 0.85 + 3, 0, Math.PI * 2); ctx.stroke();
      }
      if (labels || sel) {
        ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace'; ctx.textAlign = 'left';
        ctx.fillStyle = pal.label; ctx.fillText(f.fn, x + size * 0.6 + 4, y - size * 0.4);
      }
      planeScreen.push([x, y, f.id, size]);
    }
  };

  /* ---------- ruta del vuelo seleccionado ---------- */
  const drawSelected = () => {
    if (!G || !M.sel || M.sel.kind !== 'flight') return;
    const f = G.flights.find(x => x.id === M.sel.id);
    if (!f) return;
    const path = E.FL.path(f).map(([x, y]) => [x, Y(y)]);
    ctx.strokeStyle = 'rgba(255,210,122,.75)'; ctx.lineWidth = 1.6; ctx.setLineDash([3, 5]);
    strokePath(path); ctx.setLineDash([]);
  };

  /* ---------- bucle de render ---------- */
  M.lerpT = 0;
  M.render = (game, now) => {
    G = game;
    if (!cv) return;
    // inercia
    if (!dragging && (Math.abs(vel.x) > 0.02 || Math.abs(vel.y) > 0.02)) { cam.x -= vel.x / cam.z; cam.y -= vel.y / cam.z; vel.x *= 0.92; vel.y *= 0.92; clampCam(); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBase();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (G) {
      if (M.layers.night) drawNight(G.t + M.lerpT);
      if (M.layers.weather) drawWeather(now);
      if (M.layers.routes) drawRoutes();
      drawSelected();
      drawAirports();
      if (M.layers.traffic) drawTraffic(now);
    }
    // viñeta
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.8);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, pal.vign);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };

  /* ---------- interacción ---------- */
  const ptrs = new Map();
  let dragging = false, downAt = null, pinch0 = null, moved = 0, lastTap = 0;
  const onDown = e => {
    cv.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragging = true; moved = 0; vel = { x: 0, y: 0 };
    downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; }
  };
  const onMove = e => {
    if (!ptrs.has(e.pointerId)) return;
    const prev = ptrs.get(e.pointerId);
    const cur = { x: e.clientX, y: e.clientY };
    ptrs.set(e.pointerId, cur);
    lastInteract = performance.now();
    if (ptrs.size === 1) {
      const dx = cur.x - prev.x, dy = cur.y - prev.y;
      moved += Math.abs(dx) + Math.abs(dy);
      cam.x -= dx / cam.z; cam.y -= dy / cam.z;
      vel = { x: dx, y: dy };
      clampCam();
    } else if (ptrs.size === 2 && pinch0) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      zoomAt(pinch0.z * d / pinch0.d / cam.z, mx, my);
      // paneo con dos dedos
      cam.x -= (mx - pinch0.mx) / cam.z; cam.y -= (my - pinch0.my) / cam.z; pinch0.mx = mx; pinch0.my = my;
      moved += 10; clampCam();
    }
  };
  const onUp = e => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch0 = null;
    if (ptrs.size === 0) {
      dragging = false;
      if (moved < 8 && downAt && performance.now() - downAt.t < 450) {
        const rect = cv.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const now = performance.now();
        if (now - lastTap < 300) { zoomAt(1.8, x, y); lastTap = 0; return; }
        lastTap = now;
        tap(x, y);
        vel = { x: 0, y: 0 };
      }
    }
  };
  const zoomAt = (k, sx, sy) => {
    const rect = cv.getBoundingClientRect();
    const lx = sx - (rect.left ? 0 : 0), ly = sy;
    const wx = cam.x + (lx - W / 2) / cam.z, wy = cam.y + (ly - H / 2) / cam.z;
    cam.z = U.clamp(cam.z * k, zMin(), 90);
    cam.x = wx - (lx - W / 2) / cam.z; cam.y = wy - (ly - H / 2) / cam.z;
    clampCam(); lastInteract = performance.now();
  };
  M.zoom = k => zoomAt(k, W / 2, H / 2);
  const onWheel = e => { e.preventDefault(); const rect = cv.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY * 0.0016), e.clientX - rect.left, e.clientY - rect.top); };
  const tap = (x, y) => {
    let best = null, bd = 22;
    for (const [px, py, id, s] of planeScreen) { const d = Math.hypot(px - x, py - y); if (d < Math.max(bd, s * 0.8) && (!best || d < best.d)) best = { d, kind: 'flight', id }; }
    if (!best) { bd = 16; for (const [px, py, id] of apScreen) { const d = Math.hypot(px - x, py - y); if (d < bd && (!best || d < best.d)) best = { d, kind: 'airport', id }; } }
    E.bus.emit('map:tap', best);
  };
  M.resize = () => {
    const r = cv.parentElement.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    clampCam(); baseDirty = true;
  };
  M.init = (canvas) => {
    cv = canvas; ctx = cv.getContext('2d');
    buildPaths(); mkSil();
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', () => M.resize());
    M.resize();
  };
  M.dirty = () => { baseDirty = true; };
  M.clearCache = () => routeCache.clear();
  return M;
})();
