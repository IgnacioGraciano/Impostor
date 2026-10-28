/* ESTELA · ilustraciones laterales de aviones (SVG procedural con la librea de la aerolínea) */
'use strict';
E.ART = (() => {
  const A = {};
  let uid = 0;
  const f1 = n => Math.round(n * 10) / 10;
  const P = (pts) => pts.map((p, i) => (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1])).join(' ') + ' Z';

  // glifos de logo en caja 100x100
  A.GLYPH = {
    ala: '<path d="M8 72 L50 26 L92 72 L74 72 L50 46 L26 72 Z"/><path d="M30 86 L50 64 L70 86 L60 86 L50 75 L40 86 Z" opacity=".75"/>',
    estrella: '<path d="M50 8 L61 38 L93 38 L67 57 L77 88 L50 69 L23 88 L33 57 L7 38 L39 38 Z"/>',
    sol: '<circle cx="50" cy="50" r="20"/><g stroke-width="7" stroke-linecap="round" fill="none" stroke="currentColor"><path d="M50 8v12M50 80v12M8 50h12M80 50h12M20 20l9 9M71 71l9 9M80 20l-9 9M29 71l-9 9"/></g>',
    condor: '<path d="M3 58 Q26 30 50 48 Q74 30 97 58 Q74 46 56 60 L50 74 L44 60 Q26 46 3 58 Z"/>',
    globo: '<g fill="none" stroke="currentColor" stroke-width="7"><circle cx="50" cy="50" r="38"/><ellipse cx="50" cy="50" rx="16" ry="38"/><path d="M14 38h72M14 62h72"/></g>',
    flecha: '<path d="M10 62 L62 62 L62 80 L94 50 L62 20 L62 38 L10 38 Z"/>',
    onda: '<g fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"><path d="M8 38 Q29 20 50 38 T92 38"/><path d="M8 64 Q29 46 50 64 T92 64"/></g>',
    cruz: '<path d="M50 6 l5 12 12 1-9 8 3 12-11-7-11 7 3-12-9-8 12-1z"/><path d="M50 66 l5 12 12 1-9 8 3 12-11-7-11 7 3-12-9-8 12-1z"/><path d="M18 38 l4 9 10 1-7 6 2 9-9-5-9 5 2-9-7-6 10-1z"/><path d="M82 34 l4 9 10 1-7 6 2 9-9-5-9 5 2-9-7-6 10-1z"/><path d="M64 54 l3 6 7 1-5 4 1 7-6-4-6 4 1-7-5-4 7-1z"/>',
    inicial: null
  };
  A.glyph = (logo, color, name) => {
    if (logo === 'inicial' || !A.GLYPH[logo]) return `<text x="50" y="74" text-anchor="middle" font-family="Instrument Serif, Georgia, serif" font-size="78" font-style="italic" fill="${color}">${E.U.esc((name || 'A').trim()[0] || 'A')}</text>`;
    return `<g fill="${color}" color="${color}">${A.GLYPH[logo]}</g>`;
  };
  // logo circular para la interfaz
  A.badge = (al, size = 32) => `<svg viewBox="0 0 100 100" width="${size}" height="${size}" class="badge" aria-hidden="true"><circle cx="50" cy="50" r="49" fill="${al.p}"/><g transform="translate(20 20) scale(.6)">${A.glyph(al.logo, al.s, al.name)}</g></svg>`;

  const ENGD = { rp: 1.1, rj: 1.45, nb: 1.95, wb: 2.9, jb: 2.6, ss: 1.25, fr: 2.8 };
  const ENGL = { rp: 3.2, rj: 3.2, nb: 3.9, wb: 5.6, jb: 5.4, ss: 6.5, fr: 5.6 };
  const BIG = { B772: 3.5, B77L: 3.5, B77W: 3.6, B779: 3.8, B77F: 3.5, A388: 3.1, B788: 3.0, B789: 3.0, B78X: 3.0, A359: 3.1, A35K: 3.2, A35F: 3.2, A339: 3.0, B38M: 2.1, A20N: 2.2, A21N: 2.2, A21X: 2.2, B3XM: 2.1, B732: 1.35, B721: 1.4, B722: 1.4, DC93: 1.4, MD82: 1.55, MD90: 1.7, B712: 1.6, BA11: 1.4, F28: 1.3, F100: 1.4, F70: 1.4 };

  A.side = (typeId, al, o = {}) => {
    const t = E.AC[typeId];
    const id = 'p' + (++uid);
    const L = 1000, s = L / t.len; // unidades por metro
    const Hf = t.dia * s;
    const top = -Hf / 2, bot = Hf / 2;
    const prop = t.prop, sst = t.sst;
    const nl = sst ? 0.16 : t.nose === 'blunt' ? 0.055 : t.nose === 'round' ? 0.065 : t.nose === 'sharp' ? 0.095 : 0.075;
    const deck = t.deck || 0;
    const hh = deck === 1 || deck === 3 ? Hf * 0.34 : 0;
    const xh = deck === 3 ? 0.36 : 0.29;
    const finK = { rp: 1.55, rj: 1.55, nb: 1.75, wb: 1.45, jb: 1.22, ss: 1.85, fr: 1.45 }[t.cat] * (t.tail === 'T' ? 1.05 : 1);
    const finH = Hf * finK;
    const c = { p: al.p || '#1f5fa8', s: al.s || '#f2a900' };
    const style = al.livery || 'moderna';
    const white = '#f4f6f9', metal = '#c9ced6', dark = '#2a3442', wingC = '#a9b2be';
    // ----- fuselaje -----
    let body;
    if (sst) {
      body = `M0 ${f1(Hf * 0.42)} C ${f1(L * 0.05)} ${f1(-Hf * 0.05)} ${f1(L * 0.1)} ${f1(top)} ${f1(L * 0.17)} ${f1(top)} L ${f1(L * 0.86)} ${f1(top)} C ${f1(L * 0.94)} ${f1(top)} ${f1(L * 0.98)} ${f1(top + Hf * 0.3)} ${f1(L)} ${f1(top + Hf * 0.45)} L ${f1(L)} ${f1(top + Hf * 0.62)} C ${f1(L * 0.94)} ${f1(bot)} ${f1(L * 0.9)} ${f1(bot)} ${f1(L * 0.84)} ${f1(bot)} L ${f1(L * 0.15)} ${f1(bot)} C ${f1(L * 0.07)} ${f1(bot)} ${f1(L * 0.02)} ${f1(Hf * 0.5)} 0 ${f1(Hf * 0.42)} Z`;
    } else {
      const nx = nl * L;
      let upper;
      if (hh) {
        upper = `C 0 ${f1(top - hh * 0.1)} ${f1(nx * 0.55)} ${f1(top - hh * 0.75)} ${f1(L * 0.12)} ${f1(top - hh)} L ${f1(L * xh)} ${f1(top - hh)} C ${f1(L * (xh + 0.05))} ${f1(top - hh)} ${f1(L * (xh + 0.07))} ${f1(top)} ${f1(L * (xh + 0.12))} ${f1(top)}`;
      } else upper = `C 0 ${f1(top + Hf * 0.22)} ${f1(nx * 0.35)} ${f1(top)} ${f1(nx)} ${f1(top)}`;
      body = `M0 ${f1(Hf * 0.12)} ${upper} L ${f1(L * 0.82)} ${f1(top)} C ${f1(L * 0.92)} ${f1(top)} ${f1(L * 0.97)} ${f1(top + Hf * 0.1)} ${f1(L)} ${f1(top + Hf * 0.24)} L ${f1(L)} ${f1(top + Hf * 0.4)} C ${f1(L * 0.9)} ${f1(top + Hf * 0.62)} ${f1(L * 0.8)} ${f1(bot)} ${f1(L * 0.68)} ${f1(bot)} L ${f1(nx * 1.4)} ${f1(bot)} C ${f1(nx * 0.4)} ${f1(bot)} 0 ${f1(Hf * 0.42)} 0 ${f1(Hf * 0.12)} Z`;
    }
    const parts = [];
    const defs = [];
    defs.push(`<clipPath id="${id}c"><path d="${body}"/></clipPath>`);
    defs.push(`<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>`);
    defs.push(`<linearGradient id="${id}e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>`);
    defs.push(`<linearGradient id="${id}w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfd6df"/><stop offset="1" stop-color="#8b95a3"/></linearGradient>`);
    defs.push(`<radialGradient id="${id}pr"><stop offset="0" stop-color="#6c7888" stop-opacity=".55"/><stop offset=".8" stop-color="#6c7888" stop-opacity=".28"/><stop offset="1" stop-color="#6c7888" stop-opacity=".05"/></radialGradient>`);

    // ----- geometría auxiliar -----
    const gearH = Hf * (t.cat === 'wb' || t.cat === 'jb' || t.cat === 'fr' ? 0.52 : prop ? 0.42 : 0.5) + (sst ? Hf * 1.1 : 0);
    const wheelR = Hf * (sst ? 0.16 : 0.12);
    const ground = bot + gearH + wheelR;
    // ala
    const wingHi = t.wing === 'hi';
    const wingRootX = sst ? 0.36 : prop ? 0.37 : 0.34;
    const wing = [];
    if (sst) {
      wing.push(`<path d="M ${f1(L * 0.3)} ${f1(bot - Hf * 0.15)} C ${f1(L * 0.55)} ${f1(bot - Hf * 0.12)} ${f1(L * 0.8)} ${f1(bot - Hf * 0.1)} ${f1(L * 0.93)} ${f1(bot - Hf * 0.12)} L ${f1(L * 0.93)} ${f1(bot + Hf * 0.12)} C ${f1(L * 0.75)} ${f1(bot + Hf * 0.16)} ${f1(L * 0.5)} ${f1(bot + Hf * 0.1)} ${f1(L * 0.3)} ${f1(bot - Hf * 0.05)} Z" fill="url(#${id}w)"/>`);
      wing.push(`<path d="M ${f1(L * 0.56)} ${f1(bot + Hf * 0.08)} L ${f1(L * 0.84)} ${f1(bot + Hf * 0.1)} L ${f1(L * 0.86)} ${f1(bot + Hf * 0.62)} L ${f1(L * 0.6)} ${f1(bot + Hf * 0.62)} L ${f1(L * 0.55)} ${f1(bot + Hf * 0.5)} Z" fill="#dfe4ea"/><path d="M ${f1(L * 0.56)} ${f1(bot + Hf * 0.08)} L ${f1(L * 0.84)} ${f1(bot + Hf * 0.1)} L ${f1(L * 0.86)} ${f1(bot + Hf * 0.62)} L ${f1(L * 0.6)} ${f1(bot + Hf * 0.62)} L ${f1(L * 0.55)} ${f1(bot + Hf * 0.5)} Z" fill="url(#${id}e)"/><rect x="${f1(L * 0.855)}" y="${f1(bot + Hf * 0.22)}" width="${f1(L * 0.02)}" height="${f1(Hf * 0.34)}" fill="#4a5565"/>`);
    } else if (wingHi) {
      wing.push(`<path d="${P([[L * (wingRootX - 0.01), top + Hf * 0.04], [L * (wingRootX + 0.17), top - Hf * 0.02], [L * (wingRootX + 0.2), top + Hf * 0.06], [L * (wingRootX + 0.01), top + Hf * 0.12]])}" fill="url(#${id}w)"/>`);
    } else {
      const ry = bot - Hf * 0.16;
      wing.push(`<path d="M ${f1(L * (wingRootX - 0.02))} ${f1(ry + Hf * 0.02)} C ${f1(L * (wingRootX + 0.05))} ${f1(ry - Hf * 0.04)} ${f1(L * (wingRootX + 0.2))} ${f1(ry - Hf * 0.16)} ${f1(L * (wingRootX + 0.31))} ${f1(ry - Hf * 0.2)} L ${f1(L * (wingRootX + 0.315))} ${f1(ry - Hf * 0.13)} C ${f1(L * (wingRootX + 0.22))} ${f1(ry - Hf * 0.05)} ${f1(L * (wingRootX + 0.16))} ${f1(ry + Hf * 0.1)} ${f1(L * (wingRootX + 0.12))} ${f1(ry + Hf * 0.14)} L ${f1(L * (wingRootX - 0.01))} ${f1(ry + Hf * 0.12)} Z" fill="url(#${id}w)"/>`);
      // punteras
      const tx = L * (wingRootX + 0.31), ty = ry - Hf * 0.2;
      const wl = t.wl;
      if (wl === 'blended' || wl === 'sharklet' || wl === 'curved' || wl === 'winglet') wing.push(`<path d="M ${f1(tx - Hf * 0.12)} ${f1(ty)} Q ${f1(tx)} ${f1(ty - Hf * 0.02)} ${f1(tx + Hf * 0.04)} ${f1(ty - Hf * (wl === 'winglet' ? 0.38 : 0.45))} L ${f1(tx + Hf * 0.1)} ${f1(ty - Hf * (wl === 'winglet' ? 0.38 : 0.45))} Q ${f1(tx + Hf * 0.06)} ${f1(ty)} ${f1(tx + Hf * 0.02)} ${f1(ty + Hf * 0.02)} Z" fill="${style === 'minimal' ? white : c.p}"/>`);
      if (wl === 'split') wing.push(`<path d="${P([[tx - Hf * 0.1, ty], [tx + Hf * 0.06, ty - Hf * 0.45], [tx + Hf * 0.13, ty - Hf * 0.45], [tx + Hf * 0.04, ty + Hf * 0.02], [tx + Hf * 0.1, ty + Hf * 0.2], [tx + Hf * 0.04, ty + Hf * 0.2]])}" fill="${c.p}"/>`);
      if (wl === 'fence') wing.push(`<path d="${P([[tx - Hf * 0.04, ty - Hf * 0.16], [tx + Hf * 0.06, ty - Hf * 0.16], [tx + Hf * 0.05, ty + Hf * 0.12], [tx - Hf * 0.02, ty + Hf * 0.12]])}" fill="${c.p}"/>`);
      if (wl === 'raked') wing.push(`<path d="${P([[tx - Hf * 0.1, ty - Hf * 0.01], [tx + Hf * 0.3, ty - Hf * 0.08], [tx + Hf * 0.04, ty + Hf * 0.03]])}" fill="url(#${id}w)"/>`);
    }
    // ----- motores -----
    const engs = [];
    const ed = (BIG[t.id] || ENGD[t.cat]) * s, el = ENGL[t.cat] * s * (t.cat === 'nb' && BIG[t.id] && BIG[t.id] < 1.7 ? 1.25 : 1);
    const nacColor = style === 'moderna' ? c.p : style === 'audaz' ? c.s : white;
    const nacelle = (x, cy, len, dia, col, op = 1) => {
      const r = dia / 2;
      return `<g opacity="${op}"><path d="M ${f1(x)} ${f1(cy - r)} L ${f1(x + len * 0.8)} ${f1(cy - r * 0.86)} Q ${f1(x + len)} ${f1(cy)} ${f1(x + len * 0.8)} ${f1(cy + r * 0.86)} L ${f1(x)} ${f1(cy + r)} Q ${f1(x - r * 0.25)} ${f1(cy)} ${f1(x)} ${f1(cy - r)} Z" fill="${col}"/><path d="M ${f1(x)} ${f1(cy - r)} L ${f1(x + len * 0.8)} ${f1(cy - r * 0.86)} Q ${f1(x + len)} ${f1(cy)} ${f1(x + len * 0.8)} ${f1(cy + r * 0.86)} L ${f1(x)} ${f1(cy + r)} Q ${f1(x - r * 0.25)} ${f1(cy)} ${f1(x)} ${f1(cy - r)} Z" fill="url(#${id}e)"/><ellipse cx="${f1(x)}" cy="${f1(cy)}" rx="${f1(r * 0.22)}" ry="${f1(r * 0.92)}" fill="#3b4656"/><path d="M ${f1(x + len * 0.86)} ${f1(cy - r * 0.55)} L ${f1(x + len * 1.08)} ${f1(cy)} L ${f1(x + len * 0.86)} ${f1(cy + r * 0.55)} Z" fill="#596474"/></g>`;
    };
    const pylon = (x1, y1, x2, y2, w) => `<path d="${P([[x1, y1], [x1 + w, y1], [x2 + w, y2], [x2, y2]])}" fill="#b9c1cc"/>`;
    if (t.eng === 'w2' || t.eng === 'w4' || t.eng === 'w2t1' || t.eng === 'w2s') {
      const wy = bot - Hf * 0.12;
      const cy = wy + ed * 0.55;
      const x0 = L * (wingRootX - 0.035) - el * 0.25;
      if (t.eng === 'w4') {
        if (wingHi) { engs.push(nacelle(L * 0.41, top + Hf * 0.2, el * 0.85, ed * 0.85, nacColor, 0.92)); engs.push(nacelle(L * 0.36, top + Hf * 0.26, el * 0.85, ed * 0.85, nacColor)); }
        else { engs.push(pylon(x0 + L * 0.1 + el * 0.4, wy - Hf * 0.2, x0 + L * 0.1 + el * 0.3, cy - ed * 0.5 - Hf * 0.12, el * 0.35)); engs.push(nacelle(x0 + L * 0.1, cy - Hf * 0.14, el * 0.95, ed * 0.92, nacColor, 0.95)); engs.push(pylon(x0 + el * 0.4, wy, x0 + el * 0.3, cy - ed * 0.5, el * 0.35)); engs.push(nacelle(x0, cy, el, ed, nacColor)); }
      } else { engs.push(pylon(x0 + el * 0.45, wy, x0 + el * 0.32, cy - ed * 0.5, el * 0.4)); engs.push(nacelle(x0, cy, el, ed, nacColor)); }
    }
    const tailEng = (x, cy, len, dia) => `${pylon(x + len * 0.3, cy + dia * 0.2, x + len * 0.35, Math.min(bot - Hf * 0.3, cy + dia * 0.9), len * 0.3)}${nacelle(x, cy, len, dia, nacColor)}`;
    if (t.eng === 't2' || t.eng === 't3') engs.push(tailEng(L * 0.69, top + Hf * 0.32, el * 0.95, ed));
    if (t.eng === 't4') { engs.push(tailEng(L * 0.7, top + Hf * 0.18, el * 0.9, ed * 0.92)); engs.push(tailEng(L * 0.665, top + Hf * 0.44, el * 0.9, ed * 0.92)); }
    // ----- hélices -----
    const props = [];
    if (prop) {
      const pr = { DHC6: 1.3, EMB110: 1.2, L188: 2.1, AT43: 1.95, AT46: 1.95, AT72: 1.97, AT75: 1.97, AT76: 1.97, AT7F: 1.97, DH8D: 2.05 }[t.id] || 1.7;
      const R = pr * s;
      const mk = (x, cy, len, dia) => {
        const nac = `<path d="M ${f1(x)} ${f1(cy - dia * 0.42)} Q ${f1(x + len * 0.15)} ${f1(cy - dia * 0.55)} ${f1(x + len)} ${f1(cy - dia * 0.25)} L ${f1(x + len * 1.1)} ${f1(cy + dia * 0.1)} L ${f1(x + len * 0.2)} ${f1(cy + dia * 0.5)} Q ${f1(x - dia * 0.1)} ${f1(cy + dia * 0.2)} ${f1(x)} ${f1(cy - dia * 0.42)} Z" fill="${nacColor}"/><path d="M ${f1(x)} ${f1(cy - dia * 0.42)} Q ${f1(x + len * 0.15)} ${f1(cy - dia * 0.55)} ${f1(x + len)} ${f1(cy - dia * 0.25)} L ${f1(x + len * 1.1)} ${f1(cy + dia * 0.1)} L ${f1(x + len * 0.2)} ${f1(cy + dia * 0.5)} Q ${f1(x - dia * 0.1)} ${f1(cy + dia * 0.2)} ${f1(x)} ${f1(cy - dia * 0.42)} Z" fill="url(#${id}e)"/>`;
        const disc = `<ellipse cx="${f1(x - dia * 0.12)}" cy="${f1(cy)}" rx="${f1(Math.max(4, dia * 0.14))}" ry="${f1(R)}" fill="url(#${id}pr)" stroke="rgba(40,50,64,.35)" stroke-width="${f1(Math.max(1, dia * 0.02))}"/><path d="M ${f1(x - dia * 0.12)} ${f1(cy - R * 0.95)} L ${f1(x - dia * 0.12)} ${f1(cy + R * 0.95)}" stroke="rgba(30,38,50,.55)" stroke-width="${f1(Math.max(1.2, dia * 0.05))}"/><path d="M ${f1(x - dia * 0.12)} ${f1(cy - dia * 0.2)} Q ${f1(x - dia * 0.45)} ${f1(cy)} ${f1(x - dia * 0.12)} ${f1(cy + dia * 0.2)} Z" fill="#2d3846"/>`;
        return nac + disc;
      };
      const nd = Hf * 0.42, nlen = L * 0.13;
      if (wingHi) {
        const cy = top + Hf * 0.1;
        if (t.eng === 'p4') { props.push(mk(L * 0.41, cy - Hf * 0.06, nlen * 0.9, nd * 0.9)); }
        props.push(mk(L * (wingRootX - 0.02), cy, nlen, nd));
      } else {
        const cy = bot - Hf * 0.08;
        if (t.eng === 'p4') props.push(mk(L * 0.42, cy - Hf * 0.12, nlen * 0.9, nd * 0.85));
        props.push(mk(L * (wingRootX - 0.01), cy, nlen, nd));
      }
    }
    // ----- empenaje -----
    const fin = [];
    const fx0 = sst ? 0.7 : prop ? 0.8 : t.tail === 'T' ? 0.77 : 0.79;
    const sweep = sst ? 0.2 : prop ? 0.08 : 0.12;
    const finPath = P([[L * fx0, top + 2], [L * (fx0 + sweep), top - finH], [L * (fx0 + sweep + (sst ? 0.06 : 0.065)), top - finH], [L * 0.99, top + Hf * 0.22]]);
    const finColor = c.p;
    fin.push(`<path d="${finPath}" fill="${finColor}"/>`);
    fin.push(`<path d="${finPath}" fill="url(#${id}e)" opacity=".5"/>`);
    // estabilizador horizontal
    if (!sst) {
      if (t.tail === 'T') fin.push(`<path d="${P([[L * (fx0 + sweep - 0.04), top - finH + 3], [L * (fx0 + sweep + 0.1), top - finH - 2], [L * (fx0 + sweep + 0.12), top - finH + 4], [L * (fx0 + sweep + 0.01), top - finH + Hf * 0.12]])}" fill="${finColor}"/>`);
      else if (t.tail === 'X') fin.push(`<path d="${P([[L * 0.86, top - finH * 0.38], [L * 0.98, top - finH * 0.48], [L * 0.99, top - finH * 0.42], [L * 0.88, top - finH * 0.28]])}" fill="${wingC}"/>`);
      else fin.push(`<path d="${P([[L * 0.855, top + Hf * 0.3], [L * 0.975, top + Hf * 0.05], [L * 1.0, top + Hf * 0.07], [L * 0.9, top + Hf * 0.4]])}" fill="url(#${id}w)"/>`);
    }
    // motor central (trirreactores)
    if (t.eng === 'w2t1') { const cy = top - finH * 0.26, dia = ed * 0.95; fin.push(nacelle(L * 0.84, cy, L * 0.12, dia, white)); }
    if (t.eng === 't3' || t.eng === 'w2s') fin.push(`<path d="M ${f1(L * 0.76)} ${f1(top + 1)} Q ${f1(L * 0.77)} ${f1(top - Hf * 0.32)} ${f1(L * 0.82)} ${f1(top - Hf * 0.34)} L ${f1(L * 0.86)} ${f1(top - Hf * 0.3)} L ${f1(L * 0.86)} ${f1(top + 1)} Z" fill="${nacColor}"/><ellipse cx="${f1(L * 0.775)}" cy="${f1(top - Hf * 0.16)}" rx="${f1(Hf * 0.04)}" ry="${f1(Hf * 0.15)}" fill="#3b4656"/>`);
    // logo en la cola
    const lx = L * (fx0 + sweep * 0.55 + 0.035), ly = top - finH * 0.48, ls = finH * 0.5;
    fin.push(`<g transform="translate(${f1(lx - ls / 2)} ${f1(ly - ls / 2)}) scale(${f1(ls / 100 * 100) / 100})">${A.glyph(al.logo, c.s, al.name)}</g>`);
    // ----- librea sobre el fuselaje -----
    const liv = [];
    if (style === 'moderna') {
      liv.push(`<path d="M ${f1(L * 0.16)} ${f1(bot + 4)} C ${f1(L * 0.42)} ${f1(bot - Hf * 0.12)} ${f1(L * 0.66)} ${f1(bot - Hf * 0.5)} ${f1(L * 0.83)} ${f1(top - 4)} L ${f1(L + 20)} ${f1(top - 20)} L ${f1(L + 20)} ${f1(bot + 20)} Z" fill="${c.p}"/>`);
      liv.push(`<path d="M ${f1(L * 0.16)} ${f1(bot + 4)} C ${f1(L * 0.42)} ${f1(bot - Hf * 0.12)} ${f1(L * 0.66)} ${f1(bot - Hf * 0.5)} ${f1(L * 0.83)} ${f1(top - 4)}" fill="none" stroke="${c.s}" stroke-width="${f1(Hf * 0.05)}"/>`);
    } else if (style === 'clasica') {
      liv.push(`<rect x="-10" y="${f1(Hf * 0.18)}" width="${L + 20}" height="${f1(Hf)}" fill="${metal}"/>`);
      liv.push(`<rect x="${f1(nl * L * 0.6)}" y="${f1(-Hf * 0.24)}" width="${L}" height="${f1(Hf * 0.23)}" fill="${c.p}"/>`);
      liv.push(`<rect x="${f1(nl * L * 0.8)}" y="${f1(Hf * 0.03)}" width="${L}" height="${f1(Hf * 0.06)}" fill="${c.s}"/>`);
    } else if (style === 'audaz') {
      liv.push(`<rect x="-10" y="${f1(top - hh - 10)}" width="${L + 20}" height="${f1(Hf * 0.62 + hh + 10)}" fill="${c.p}"/>`);
      liv.push(`<rect x="-10" y="${f1(Hf * 0.12)}" width="${L + 20}" height="${f1(Hf * 0.05)}" fill="${c.s}"/>`);
    } else if (style === 'retro') {
      liv.push(`<rect x="-10" y="${f1(Hf * 0.2)}" width="${L + 20}" height="${f1(Hf)}" fill="${metal}"/>`);
      liv.push(`<path d="M ${f1(nl * L * 0.5)} ${f1(-Hf * 0.02)} L ${f1(L * 0.7)} ${f1(-Hf * 0.02)} Q ${f1(L * 0.8)} ${f1(-Hf * 0.04)} ${f1(L * 0.86)} ${f1(top - 10)} L ${f1(L * 0.92)} ${f1(top - 10)} Q ${f1(L * 0.84)} ${f1(Hf * 0.12)} ${f1(L * 0.7)} ${f1(Hf * 0.12)} L ${f1(nl * L * 0.5)} ${f1(Hf * 0.12)} Z" fill="${c.p}"/>`);
      liv.push(`<path d="M ${f1(nl * L * 0.7)} ${f1(Hf * 0.15)} L ${f1(L * 0.7)} ${f1(Hf * 0.15)} Q ${f1(L * 0.86)} ${f1(Hf * 0.15)} ${f1(L * 0.95)} ${f1(top - 10)} L ${f1(L * 0.99)} ${f1(top - 10)} Q ${f1(L * 0.9)} ${f1(Hf * 0.24)} ${f1(L * 0.7)} ${f1(Hf * 0.24)} L ${f1(nl * L * 0.7)} ${f1(Hf * 0.24)} Z" fill="${c.s}"/>`);
    }
    // ----- ventanillas, puertas y cabina -----
    const win = [];
    const winY = deck === 2 ? -Hf * 0.04 : -Hf * 0.1;
    const pitch = Math.max(Hf * 0.155, 0.52 * s);
    const ww = Math.max(2.2, Hf * 0.07), wh = Math.max(3.2, Hf * 0.12);
    const winCol = style === 'audaz' ? '#1a2230' : '#26303e';
    const doors = sst ? [0.2] : [nl + 0.04, t.cat === 'wb' || t.cat === 'jb' ? 0.5 : 0.47, 0.84];
    if (!t.freighter) {
      for (let x = L * (nl + 0.07); x < L * (sst ? 0.8 : 0.8); x += pitch) {
        if (doors.some(d => Math.abs(x - L * d) < pitch * 1.1)) continue;
        win.push(`<rect x="${f1(x)}" y="${f1(winY - wh / 2)}" width="${f1(ww)}" height="${f1(wh)}" rx="${f1(ww / 2)}" fill="${winCol}"/>`);
        if (deck === 2) win.push(`<rect x="${f1(x)}" y="${f1(-Hf * 0.25 - wh / 2)}" width="${f1(ww)}" height="${f1(wh)}" rx="${f1(ww / 2)}" fill="${winCol}"/>`);
      }
      if (hh) for (let x = L * 0.15; x < L * (xh - 0.01); x += pitch) win.push(`<rect x="${f1(x)}" y="${f1(top - hh * 0.45 - wh / 2)}" width="${f1(ww)}" height="${f1(wh)}" rx="${f1(ww / 2)}" fill="${winCol}"/>`);
    } else {
      win.push(`<rect x="${f1(L * 0.62)}" y="${f1(top + Hf * 0.12)}" width="${f1(L * 0.09)}" height="${f1(Hf * 0.5)}" rx="3" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.6"/>`);
    }
    doors.forEach((d, i) => { if (t.freighter && i > 0) return; const dh = Hf * (deck === 2 ? 0.32 : 0.52); win.push(`<rect x="${f1(L * d - Hf * 0.07)}" y="${f1(winY - dh * 0.55)}" width="${f1(Hf * 0.14)}" height="${f1(dh)}" rx="${f1(Hf * 0.03)}" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="${f1(Math.max(1, Hf * 0.012))}"/>`); });
    // parabrisas
    let cx0, cyT;
    if (sst) { cx0 = L * 0.125; cyT = top + Hf * 0.12; }
    else if (hh) { cx0 = L * 0.085; cyT = top - hh * 0.72; }
    else { cx0 = L * nl * 0.62; cyT = top + Hf * 0.12; }
    win.push(`<path d="${P([[cx0, cyT + Hf * 0.12], [cx0 + Hf * 0.12, cyT], [cx0 + Hf * 0.36, cyT - Hf * 0.01], [cx0 + Hf * 0.34, cyT + Hf * 0.13]])}" fill="#18202b"/>`);
    // nombre
    const nameCol = style === 'audaz' ? '#fff' : c.p;
    const nameSize = Math.max(8, Hf * (deck === 2 ? 0.11 : 0.2));
    const nameY = deck === 2 ? -Hf * 0.37 : -Hf * 0.27;
    const nameX = L * (hh ? xh + 0.1 : nl + 0.1);
    const nm = (al.name || '').toUpperCase();
    // ----- tren de aterrizaje -----
    const gear = [];
    if (o.gear !== false) {
      const wheel = (x, y, r) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#1d232c"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 0.45)}" fill="#7b8592"/>`;
      const nx = L * (sst ? 0.18 : nl + 0.05);
      gear.push(`<rect x="${f1(nx - Hf * 0.025)}" y="${f1(bot - 2)}" width="${f1(Hf * 0.05)}" height="${f1(ground - wheelR - bot + 2)}" fill="#7b8592"/>`, wheel(nx, ground - wheelR, wheelR));
      const mx = L * (sst ? 0.62 : wingHi && prop ? 0.45 : 0.5);
      const gtop = wingHi ? bot - Hf * 0.1 : bot - Hf * 0.15;
      gear.push(`<rect x="${f1(mx - Hf * 0.035)}" y="${f1(gtop)}" width="${f1(Hf * 0.07)}" height="${f1(ground - wheelR - gtop)}" fill="#6b7582"/>`);
      if (t.cat === 'wb' || t.cat === 'jb' || t.cat === 'fr') { gear.push(wheel(mx - wheelR * 1.15, ground - wheelR, wheelR), wheel(mx + wheelR * 1.15, ground - wheelR, wheelR)); }
      else gear.push(wheel(mx, ground - wheelR, wheelR * 1.05));
    }
    // ----- composición -----
    const shadow = o.shadow !== false ? `<ellipse cx="${f1(L * 0.5)}" cy="${f1(ground + 2)}" rx="${f1(L * 0.42)}" ry="${f1(Hf * 0.12)}" fill="#000" opacity=".22" filter="url(#${id}b)"/>` : '';
    defs.push(`<filter id="${id}b" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="${f1(Hf * 0.12)}"/></filter>`);
    const finTop = top - Math.max(finH, hh) - (t.eng === 'w2t1' ? 0 : 0);
    const minY = Math.min(finTop, top - hh) - Hf * 0.1, maxY = ground + Hf * 0.3;
    const minX = -L * 0.02 - (prop ? Hf * 0.4 : 0), maxX = L * 1.05 + (t.wl === 'raked' ? 0 : 0);
    const vb = `${f1(minX)} ${f1(minY)} ${f1(maxX - minX)} ${f1(maxY - minY)}`;
    const bodyCol = style === 'audaz' ? white : white;
    const svg = `<svg class="ac-art" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${E.U.esc(t.name)}"><defs>${defs.join('')}</defs>
${shadow}${gear.join('')}
${fin.join('')}
<path d="${body}" fill="${bodyCol}"/>
<g clip-path="url(#${id}c)">${liv.join('')}${win.join('')}${nm ? `<text x="${f1(nameX)}" y="${f1(nameY)}" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="${f1(nameSize)}" letter-spacing="${f1(nameSize * 0.08)}" fill="${nameCol}">${E.U.esc(nm.slice(0, 22))}</text>` : ''}<rect x="-20" y="${f1(top - hh - 20)}" width="${L + 40}" height="${f1(Hf + hh + 40)}" fill="url(#${id}g)"/></g>
<path d="${body}" fill="none" stroke="rgba(10,20,35,.35)" stroke-width="${f1(Math.max(1.2, Hf * 0.015))}"/>
${wing.join('')}${engs.join('')}${props.join('')}
</svg>`;
    return svg;
  };
  return A;
})();
