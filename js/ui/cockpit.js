/* ESTELA · cabina de emergencias: pantallas PFD/EICAS animadas y lista de chequeo (QRH) */
'use strict';
E.CK = (() => {
  const U = E.U, UI = E.UI;
  const CK = {};
  let st = null, raf = 0;
  CK.open = (fid) => {
    const G = E.G;
    const f = G.flights.find(x => x.id === fid);
    if (!f || !f.emg) return;
    const ac = G.fleet.find(a => a.id === f.ac); if (!ac) return;
    const em = E.EV.def(f.emg.id);
    const t = E.AC[ac.type];
    const prevSpeed = G.speed;
    E.A.speed({ v: 0 });
    E.SND && E.SND.alarm(em.lvl === 'w');
    const e = f.emg.eng || 1;
    let steps = em.steps(e, ac).map(s => Object.assign({}, s));
    // decisiones de desvío con aeropuertos concretos
    const opts = E.EV.divertOptions(G, f);
    steps.forEach(s => {
      if (!s.o) return;
      const out = [];
      s.o.forEach(o => {
        if (o.a === 'divert') opts.forEach((ap, i) => out.push({ t: `Desviar a ${ap.iata} · ${ap.city} (${U.n0(ap.d)} km)`, v: o.v * [1, 0.86, 0.72][i], a: 'divert', ap: ap.iata }));
        else if (o.a === 'return') out.push(Object.assign({}, o, { t: o.t + ` (${f.o})`, ap: f.o }));
        else out.push(o);
      });
      s.o = out;
    });
    const limit = 45 + steps.length * 4;
    st = { f, ac, em, t, steps, i: 0, q: [], t0: performance.now(), limit, prevSpeed, action: 'continue', airport: null, n1: Array.from({ length: t.engines }, () => 86 + Math.random() * 4), eng: e, cut: false, fireOut: false, done: false };
    const p = E.FL.pos(G, f, G.t) || {};
    const fl = t.sst ? 580 : t.prop ? 250 : 370;
    const m = UI.modal(`<div class="ck-top"><span><b style="color:#fff">${f.fn}</b> · ${t.short} ${ac.reg} · ${f.o}→${f.d}</span><span>${p.lat != null ? `${Math.abs(p.lat).toFixed(1)}°${p.lat >= 0 ? 'N' : 'S'} ${Math.abs(p.lon).toFixed(1)}°${p.lon >= 0 ? 'E' : 'O'}` : ''} · FL${Math.round((p.alt || 0.9) * fl / 10) * 10}</span></div>
      <div class="ck-warn"><span class="mw ${em.lvl}">${em.lvl === 'w' ? 'MASTER WARNING' : 'MASTER CAUTION'}</span><span class="eicas-msg" style="color:${em.lvl === 'w' ? '#ff5a5a' : '#ffbf3f'}">${em.msg(e)}</span></div>
      <div class="ck-screens mt8"><div class="scr"><svg viewBox="0 0 200 150" id="ckPfd"></svg></div><div class="scr"><svg viewBox="0 0 200 150" id="ckEicas"></svg></div></div>
      <div class="ck-list"><h4><span>QRH · ${em.n.toUpperCase()}</span><span id="ckClock"></span></h4><div id="ckSteps"></div><div class="ck-timer"><i id="ckTimer" style="width:100%"></i></div></div>
      <div class="row sp mt12"><span class="tiny" style="color:#8fa2b8">Tocá cada ítem en orden. Cuanto más rápido y mejores decisiones, mejor el resultado.</span><button class="btn sm" data-a="ckDelegate" style="background:#1b2635;color:#d9e3ef;border-color:#2b3a4e">Delegar a la tripulación</button></div>`, { cls: 'cockpit', sticky: true });
    st.modal = m;
    renderSteps();
    loop();
  };
  const renderSteps = () => {
    const el = UI.$('#ckSteps'); if (!el || !st) return;
    el.innerHTML = st.steps.map((s, i) => {
      const done = i < st.i, next = i === st.i;
      if (s.o) {
        if (done) return `<div class="ck-step done"><span class="n">${i + 1}</span>${U.esc(s.q)} — ${U.esc(s.pick || '')}</div>`;
        if (next) return `<div class="ck-step dec next"><span class="n">${i + 1}</span>${U.esc(s.q)}</div>${s.o.map((o, k) => `<button class="ck-opt" data-a="ckOpt" data-v="${k}">▸ ${U.esc(o.t)}</button>`).join('')}`;
        return `<div class="ck-step dec" style="opacity:.45"><span class="n">${i + 1}</span>${U.esc(s.q)}</div>`;
      }
      return `<button class="ck-step ${done ? 'done' : next ? 'next' : ''}" ${next ? 'data-a="ckStep"' : ''} ${!next && !done ? 'style="opacity:.45"' : ''}><span class="n">${done ? '✓' : i + 1}</span>${U.esc(s.t)}</button>`;
    }).join('');
  };
  E.A.ckStep = () => {
    if (!st || st.done) return;
    const s = st.steps[st.i];
    st.q.push(1);
    const txt = s.t.toUpperCase();
    if (txt.includes('CORTE')) st.cut = true;
    if (txt.includes('DESCARGAR') || txt.includes('EXTINC')) st.fireOut = true;
    st.i++;
    E.SND && E.SND.click();
    next();
  };
  E.A.ckOpt = (d) => {
    if (!st || st.done) return;
    const s = st.steps[st.i];
    const o = s.o[+d.v];
    s.pick = o.t;
    st.q.push(o.v);
    if (o.a) { st.action = o.a; st.airport = o.ap || null; }
    st.i++;
    next();
  };
  const next = () => { if (st.i >= st.steps.length) finish(false); else renderSteps(); };
  E.A.ckDelegate = () => finish(true);
  const finish = (delegated) => {
    if (!st || st.done) return;
    st.done = true;
    cancelAnimationFrame(raf);
    const G = E.G;
    const el = (performance.now() - st.t0) / 1000;
    const crew = E.EV.crewScore(G);
    let score;
    if (delegated) {
      // la tripulación decide según su entrenamiento
      score = crew;
      st.steps.forEach(s => { if (s.o) { const best = s.o.reduce((a, b) => b.v > a.v ? b : a); const pick = U.chance(crew) ? best : U.pick(s.o); if (pick.a) { st.action = pick.a; st.airport = pick.ap || null; } } });
    } else {
      const dec = st.q.length ? st.q.reduce((a, b) => a + b, 0) / st.q.length : 0.5;
      const minDec = Math.min(...st.q, 1);
      const timeK = U.clamp(1.12 - el / st.limit * 0.55, 0.45, 1.1);
      score = U.clamp(dec * 0.55 + minDec * 0.25 + timeK * 0.2 + (crew - 0.6) * 0.25, 0, 1);
    }
    if (st.action === 'divert' && !st.airport) { const o = E.EV.divertOptions(G, st.f); st.airport = o[0] ? o[0].iata : st.f.d; }
    const res = E.EV.resolve(G, st.f, { score, action: st.action, airport: st.airport });
    E.SND && E.SND.chime();
    const good = res && (res.title === 'Manejo ejemplar' || res.title === 'Emergencia resuelta');
    st.modal.box.innerHTML = `<div class="ck-top"><span><b style="color:#fff">${st.f.fn}</b> · ${st.t.short} ${st.ac.reg}</span><span>${delegated ? 'Resuelto por la tripulación' : 'Tiempo: ' + Math.round(el) + ' s'}</span></div>
      <div class="scr" style="min-height:0;padding:18px"><div class="eicas-msg" style="color:${good ? '#8ff0b6' : '#ff8585'};font-size:18px">${res ? res.title.toUpperCase() : 'SIN CAMBIOS'}</div>
      <p style="color:#c9d6e4;font-family:var(--font);font-size:14px;margin:10px 0 0">${res ? res.lines.map(U.esc).join('<br>') : ''}</p>
      <div class="row sp mt12 mono small" style="color:#7fd1ff"><span>CALIDAD DE RESPUESTA</span><span>${Math.round(score * 100)}%</span></div><div class="ck-timer"><i style="width:${score * 100}%;background:${good ? '#4fd69c' : '#ff6b6b'}"></i></div></div>
      <div class="r mt12"><button class="btn primary" data-a="ckClose">Continuar</button></div>`;
  };
  E.A.ckClose = () => {
    if (!st) return;
    const sp = st.prevSpeed;
    st.modal.close();
    st = null;
    E.A.speed({ v: sp || 1 });
    E.CK.checkQueue();
  };
  CK.active = () => !!st;
  CK.checkQueue = () => {
    const G = E.G;
    if (st || !G.ev.emq || !G.ev.emq.length) return;
    const id = G.ev.emq.shift();
    if (G.flights.some(f => f.id === id)) CK.open(id); else CK.checkQueue();
  };

  /* ---------- pantallas ---------- */
  const loop = () => {
    if (!st) return;
    const now = performance.now();
    const el = (now - st.t0) / 1000;
    const tt = UI.$('#ckTimer'); if (tt) tt.style.width = U.clamp(1 - el / st.limit, 0, 1) * 100 + '%';
    const cl = UI.$('#ckClock'); if (cl) cl.textContent = Math.max(0, Math.round(st.limit - el)) + ' s';
    if (el > st.limit) { finish(true); return; }
    const turb = st.em.id === 'turb' ? 1 : st.em.id === 'engfail' || st.em.id === 'engfire' ? 0.35 : 0.12;
    const roll = Math.sin(now / 700) * 4 * turb + (Math.random() - 0.5) * 3 * turb;
    const pitch = st.em.id === 'depress' && st.cut ? -8 : st.em.id === 'depress' && st.i > 2 ? -10 : Math.sin(now / 900) * 2 * turb;
    const pfd = UI.$('#ckPfd');
    if (pfd) {
      const desc = st.em.id === 'depress' && st.i > 2;
      const alt = Math.round((desc ? 37000 - Math.min(27000, el * 900) : 37000 - (st.em.id === 'engfail' && st.i > 5 ? el * 200 : 0)) / 20) * 20;
      const ias = Math.round(280 + Math.sin(now / 1300) * 3 + (desc ? 30 : 0));
      const hdg = Math.round((90 + Math.sin(now / 3000) * 3 + 360) % 360);
      pfd.innerHTML = `<defs><clipPath id="ckc"><rect x="45" y="18" width="110" height="114" rx="8"/></clipPath></defs>
        <g clip-path="url(#ckc)"><g transform="rotate(${-roll.toFixed(1)} 100 75) translate(0 ${(pitch * 3).toFixed(1)})"><rect x="0" y="-120" width="200" height="195" fill="#2f7fd1"/><rect x="0" y="75" width="200" height="200" fill="#8a5a2b"/><line x1="0" y1="75" x2="200" y2="75" stroke="#fff" stroke-width="1.4"/>${[-20, -10, 10, 20].map(p => `<line x1="${p % 20 ? 88 : 80}" x2="${p % 20 ? 112 : 120}" y1="${75 - p * 3}" y2="${75 - p * 3}" stroke="#fff" stroke-width="1"/>`).join('')}</g></g>
        <path d="M70 75 h18 l4 6 M130 75 h-18 l-4 6" stroke="#ffd54a" stroke-width="3" fill="none"/><rect x="98" y="73" width="4" height="4" fill="#ffd54a"/>
        <rect x="4" y="18" width="36" height="114" rx="4" fill="#0c1520"/><text x="22" y="79" fill="#fff" font-size="12" font-family="monospace" text-anchor="middle">${ias}</text><text x="22" y="30" fill="#7fd1ff" font-size="8" font-family="monospace" text-anchor="middle">IAS</text>
        <rect x="160" y="18" width="36" height="114" rx="4" fill="#0c1520"/><text x="178" y="79" fill="#fff" font-size="10" font-family="monospace" text-anchor="middle">${alt}</text><text x="178" y="30" fill="#7fd1ff" font-size="8" font-family="monospace" text-anchor="middle">ALT</text>
        <text x="100" y="146" fill="#9ff0bf" font-size="10" font-family="monospace" text-anchor="middle">HDG ${String(hdg).padStart(3, '0')}</text>`;
    }
    const eic = UI.$('#ckEicas');
    if (eic) {
      const n = st.n1.length;
      const bad = st.em.eng ? st.eng - 1 : -1;
      st.n1 = st.n1.map((v, i) => {
        let target = 88 + Math.sin(now / 1100 + i) * 1.2;
        if (i === bad && (st.em.id === 'engfail' || st.cut)) target = st.em.id === 'engfail' && !st.cut ? 22 : 0;
        if (st.em.id === 'bird' && i === 0) target = st.i >= 2 ? 55 : 70 + Math.random() * 20;
        return v + (target - v) * 0.06;
      });
      const w = 190 / n;
      let svg = '';
      st.n1.forEach((v, i) => {
        const cx = 5 + w * i + w / 2, cy = 52, R = Math.min(30, w * 0.38);
        const a0 = Math.PI * 0.75, a1 = a0 + Math.PI * 1.5 * U.clamp(v / 110, 0, 1);
        const p = (a) => `${(cx + Math.cos(a) * R).toFixed(1)} ${(cy + Math.sin(a) * R).toFixed(1)}`;
        const fire = i === bad && st.em.id === 'engfire' && !st.fireOut;
        const col = fire ? (Math.floor(now / 300) % 2 ? '#ff4d4d' : '#ffb3b3') : v < 30 ? '#ffbf3f' : '#e9eef5';
        svg += `<path d="M ${p(a0)} A ${R} ${R} 0 1 1 ${p(Math.PI * 2.25)}" stroke="#2b3a4e" stroke-width="3" fill="none"/><path d="M ${p(a0)} A ${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}" stroke="${col}" stroke-width="3.5" fill="none"/><text x="${cx}" y="${cy + 4}" fill="${col}" font-size="11" font-family="monospace" text-anchor="middle">${v.toFixed(1)}</text><text x="${cx}" y="${cy + R + 9}" fill="#7fd1ff" font-size="8" font-family="monospace" text-anchor="middle">N1 · ${i + 1}</text>`;
        const egt = fire ? 0.98 : i === bad && st.cut ? 0.1 : 0.55 + Math.sin(now / 900 + i) * 0.03;
        svg += `<rect x="${cx - 4}" y="104" width="8" height="40" fill="#18222e"/><rect x="${cx - 4}" y="${104 + 40 * (1 - egt)}" width="8" height="${40 * egt}" fill="${fire ? '#ff4d4d' : '#9ff0bf'}"/><text x="${cx + 8}" y="142" fill="#5f7590" font-size="7" font-family="monospace">EGT</text>${fire ? `<text x="${cx + 8}" y="116" fill="#ff4d4d" font-size="9" font-weight="700" font-family="monospace">FIRE</text>` : ''}`;
      });
      eic.innerHTML = svg;
    }
    raf = requestAnimationFrame(loop);
  };
  E.bus.on('emergency', () => { if (!st) setTimeout(CK.checkQueue, 50); });
  return CK;
})();
