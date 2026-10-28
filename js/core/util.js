/* ESTELA · utilidades comunes (matemática, azar, formato, fechas, geo) */
'use strict';
const E = window.E = window.E || {};

E.U = (() => {
  const U = {};
  const R = Math.PI / 180;
  U.DEG = R;

  U.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.smooth = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  U.rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  U.randi = (a, b) => Math.floor(U.rand(a, b + 1));
  U.chance = p => Math.random() < p;
  U.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  U.gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  U.wpick = (items, wf) => { let tot = 0; const ws = items.map(i => { const w = Math.max(0, wf(i)); tot += w; return w; }); if (tot <= 0) return null; let r = Math.random() * tot; for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; };
  U.sum = (arr, f = x => x) => arr.reduce((s, x) => s + f(x), 0);
  U.shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // hash determinista de string -> [0,1)
  U.hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000003) / 1000003; };
  U.rng = (seed) => { let a = (typeof seed === 'string' ? Math.floor(U.hash(seed) * 4294967295) : seed) >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

  // interpolación por tabla {año: valor}
  U.table = (tbl, x) => {
    const ks = Object.keys(tbl).map(Number).sort((a, b) => a - b);
    if (x <= ks[0]) return tbl[ks[0]];
    if (x >= ks[ks.length - 1]) return tbl[ks[ks.length - 1]];
    for (let i = 0; i < ks.length - 1; i++) if (x >= ks[i] && x <= ks[i + 1]) return U.lerp(tbl[ks[i]], tbl[ks[i + 1]], (x - ks[i]) / (ks[i + 1] - ks[i]));
    return tbl[ks[0]];
  };

  /* ---------- Formato ---------- */
  const nf0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  U.n0 = v => nf0.format(Math.round(v || 0));
  U.n1 = v => nf1.format(v || 0);
  U.n2 = v => nf2.format(v || 0);
  U.money = (v, plain) => {
    const s = v < 0 ? '−' : '';
    const a = Math.abs(v || 0);
    let out;
    if (a >= 1e9) out = nf2.format(a / 1e9) + ' mil M';
    else if (a >= 1e8) out = nf0.format(a / 1e6) + ' M';
    else if (a >= 1e6) out = nf1.format(a / 1e6) + ' M';
    else if (a >= 1e4) out = nf0.format(a / 1e3) + ' K';
    else out = nf0.format(a);
    return s + (plain ? '' : '$') + out;
  };
  U.moneyFull = v => (v < 0 ? '−$' : '$') + nf0.format(Math.abs(Math.round(v || 0)));
  U.pct = (v, d = 0) => (d ? nf1.format(v * 100) : nf0.format(v * 100)) + '%';
  U.signed = (v, f = U.money) => (v > 0 ? '+' : '') + f(v);
  U.km = v => nf0.format(v) + ' km';
  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.dur = h => { const hh = Math.floor(h); const mm = Math.round((h - hh) * 60); return hh + 'h ' + String(mm === 60 ? 59 : mm).padStart(2, '0') + 'm'; };
  U.mins = m => m < 60 ? Math.round(m) + ' min' : U.dur(m / 60);

  /* ---------- Fechas (t = horas desde 1970-01-01 UTC) ---------- */
  U.MES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  U.MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  U.DIA = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  U.date = t => new Date(t * 3600000);
  U.tOf = (y, m = 0, d = 1, h = 0) => Date.UTC(y, m, d, h) / 3600000;
  U.year = t => U.date(t).getUTCFullYear();
  U.yearF = t => { const d = U.date(t); const y = d.getUTCFullYear(); const s = Date.UTC(y, 0, 1); return y + (d.getTime() - s) / (Date.UTC(y + 1, 0, 1) - s); };
  U.month = t => U.date(t).getUTCMonth();
  U.dayIdx = t => Math.floor(t / 24);
  U.hourOf = t => ((t % 24) + 24) % 24;
  U.fmtDate = t => { const d = U.date(t); return d.getUTCDate() + ' ' + U.MES[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
  U.fmtDateL = t => { const d = U.date(t); return d.getUTCDate() + ' de ' + U.MESL[d.getUTCMonth()] + ' de ' + d.getUTCFullYear(); };
  U.fmtMonth = t => { const d = U.date(t); return U.MES[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
  U.fmtTime = t => { const d = U.date(t); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
  U.fmtDT = t => U.fmtDate(t) + ' · ' + U.fmtTime(t);
  U.weekday = t => U.date(t).getUTCDay();

  /* ---------- Geo ---------- */
  U.dist = (a, b) => {
    const la1 = a.lat * R, la2 = b.lat * R, dl = (b.lon - a.lon) * R, dp = la2 - la1;
    const h = Math.sin(dp / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dl / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
  };
  U.bearing = (a, b) => {
    const la1 = a.lat * R, la2 = b.lat * R, dl = (b.lon - a.lon) * R;
    const y = Math.sin(dl) * Math.cos(la2), x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dl);
    return (Math.atan2(y, x) / R + 360) % 360;
  };
  // puntos de círculo máximo [lon,lat] con longitudes desenrolladas (continuas)
  U.gcPath = (a, b, n) => {
    const d = U.dist(a, b);
    n = n || Math.max(12, Math.min(160, Math.round(d / 90)));
    const la1 = a.lat * R, lo1 = a.lon * R, la2 = b.lat * R, lo2 = b.lon * R;
    const v1 = [Math.cos(la1) * Math.cos(lo1), Math.cos(la1) * Math.sin(lo1), Math.sin(la1)];
    const v2 = [Math.cos(la2) * Math.cos(lo2), Math.cos(la2) * Math.sin(lo2), Math.sin(la2)];
    const dot = U.clamp(v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2], -1, 1);
    const om = Math.acos(dot), so = Math.sin(om) || 1e-9;
    const pts = [];
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      const k1 = om < 1e-6 ? 1 - f : Math.sin((1 - f) * om) / so, k2 = om < 1e-6 ? f : Math.sin(f * om) / so;
      const x = k1 * v1[0] + k2 * v2[0], y = k1 * v1[1] + k2 * v2[1], z = k1 * v1[2] + k2 * v2[2];
      let lon = Math.atan2(y, x) / R; const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) / R;
      if (prev !== null) { while (lon - prev > 180) lon -= 360; while (lon - prev < -180) lon += 360; }
      prev = lon; pts.push([lon, lat]);
    }
    return pts;
  };
  // proyección Miller (unidades ~grados); y hacia el norte
  U.projY = lat => { const l = U.clamp(lat, -85, 85) * R; return 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * l)) / R; };
  U.unprojY = y => (2.5 * Math.atan(Math.exp(0.8 * y * R)) - 0.625 * Math.PI) / R;

  // posición del sol: devuelve {lat (declinación), lon (subsolar)}
  U.sun = t => {
    const d = U.date(t);
    const start = Date.UTC(d.getUTCFullYear(), 0, 0);
    const doy = (d.getTime() - start) / 86400000;
    const dec = -23.44 * Math.cos(2 * Math.PI / 365 * (doy + 10));
    const hrs = d.getUTCHours() + d.getUTCMinutes() / 60;
    const lon = (12 - hrs) * 15;
    return { lat: dec, lon };
  };
  U.sunElev = (lat, lon, sun) => {
    const la = lat * R, de = sun.lat * R, H = (lon - sun.lon) * R;
    return Math.asin(Math.sin(la) * Math.sin(de) + Math.cos(la) * Math.cos(de) * Math.cos(H)) / R;
  };
  // hora local aproximada por longitud
  U.localHour = (t, lon) => ((U.hourOf(t) + lon / 15) % 24 + 24) % 24;

  U.uid = (S, p) => p + (S.ids = (S.ids || 0) + 1).toString(36);
  U.debounce = (fn, ms) => { let to; return (...a) => { clearTimeout(to); to = setTimeout(() => fn(...a), ms); }; };
  return U;
})();
