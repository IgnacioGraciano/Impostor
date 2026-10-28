/* ESTELA · arranque, bucle principal, sonido, tema y autoguardado */
'use strict';
(() => {
  const U = E.U, UI = E.UI;

  /* ---------- sonido (WebAudio sintetizado) ---------- */
  E.SND = (() => {
    let ac = null;
    const ok = () => E.G && E.G.settings.sound;
    const ctx = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } return ac; };
    const tone = (f, t0, dur, vol = 0.08, type = 'sine') => { const c = ctx(); if (!c) return; const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, c.currentTime + t0); g.gain.linearRampToValueAtTime(vol, c.currentTime + t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur); o.connect(g); g.connect(c.destination); o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.05); };
    return {
      click: () => { if (ok()) tone(1800, 0, 0.03, 0.012, 'triangle'); },
      chime: () => { if (!ok()) return; tone(784, 0, 1.4, 0.07); tone(587, 0.42, 1.8, 0.07); },
      alarm: (warn) => { if (!ok()) return; for (let i = 0; i < (warn ? 4 : 2); i++) { tone(warn ? 950 : 700, i * 0.32, 0.18, 0.06, 'square'); } },
      good: () => { if (ok()) { tone(660, 0, 0.25, 0.05); tone(990, 0.12, 0.4, 0.05); } }
    };
  })();

  /* ---------- tema ---------- */
  E.applyTheme = (th) => {
    E.themeNow = th;
    if (th === 'light') document.documentElement.dataset.theme = 'light'; else delete document.documentElement.dataset.theme;
    E.MAP.setTheme(th);
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = th === 'light' ? '#e9e1cf' : '#070c16';
    try { localStorage.setItem('estela.theme', th); } catch (e) { }
  };

  /* ---------- inicio y salida de partida ---------- */
  E.startGame = (G, isNew) => {
    E.SAVE.migrate(G);
    E.G = G;
    E.UIS.cab = {};
    E.ST.required(G);
    G.routes.forEach(r => E.D.routeDemand(G, r));
    UI.$('#title').classList.add('hidden');
    UI.$('#title').innerHTML = '';
    UI.$('#app').classList.remove('hidden');
    E.applyTheme(G.settings.theme || 'dark');
    E.MAP.resize();
    E.MAP.clearCache();
    E.MAP.sel = null;
    E.HUD.build();
    const h = E.AP[G.airline.home];
    E.MAP.focus(h.lon, h.lat, window.innerWidth < 700 ? 7 : 6);
    UI.close();
    if (isNew) {
      G.speed = 0;
      E.SAVE.save(G, 'auto');
      setTimeout(() => UI.root('home'), 350);
      UI.toast(`¡${U.esc(G.airline.name)} está en el aire!`, 'good', 'plane');
    } else { G.speed = 0; UI.toast('Partida cargada · ' + U.fmtDate(G.t), 'good'); }
    E.HUD.speedUI();
  };
  E.toTitle = () => {
    UI.close();
    UI.modals.slice().forEach(m => m.close());
    E.G = null;
    E.NG.title();
  };

  /* ---------- notificaciones ---------- */
  let lastToast = 0;
  E.bus.on('inbox', (m) => {
    if (!E.G) return;
    const now = performance.now();
    if (['Vuelo cancelado', 'Turbulencia severa'].includes(m.title)) return;
    if (m.kind === 'info' && m.title !== 'Ruta creada') return;
    if (now - lastToast < 1200) return;
    lastToast = now;
    UI.toast(`<b>${U.esc(m.title)}</b> · ${U.esc(m.text.length > 90 ? m.text.slice(0, 88) + '…' : m.text)}`, m.kind === 'bad' ? 'bad' : m.kind === 'warn' ? 'warn' : m.kind === 'good' ? 'good' : '', m.kind === 'bad' || m.kind === 'warn' ? 'alert' : 'check');
  });
  E.bus.on('achievement', (a) => { E.SND.good(); UI.toast(`<b>Logro desbloqueado:</b> ${a.n}`, 'good', 'trophy'); });
  E.bus.on('research', (r) => { E.SND.good(); });
  E.bus.on('month', () => { if (E.G) E.SAVE.save(E.G, 'auto'); });
  let saveWarned = false;
  E.bus.on('saveFail', () => { if (!saveWarned) { saveWarned = true; UI.toast('No se pudo guardar: el almacenamiento del navegador está lleno. Exportá la partida desde Ajustes.', 'bad', 'save'); } });

  /* ---------- bucle principal ---------- */
  let last = performance.now(), hudT = 0, refT = 0, saveT = performance.now(), overShown = false;
  const frame = (now) => {
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    const G = E.G;
    if (G) {
      if (!G.over) {
        const blocked = E.CK.active();
        if (G.speed && !blocked) {
          try { E.ENG.advance(G, dt * E.SPEEDS[G.speed]); } catch (e) { console.error(e); G.speed = 0; E.HUD.speedUI(); UI.toast('Error de simulación: ' + e.message, 'bad'); }
        }
        if (G.ev.queue.length && !UI.modals.length) E.MOD.nextEvent();
        if (G.ev.emq && G.ev.emq.length && !E.CK.active() && !UI.modals.length) E.CK.checkQueue();
      }
      if (G.over && !overShown) { overShown = true; E.SAVE.remove('auto'); E.MOD.gameOver(); }
      if (!G.over) overShown = false;
      E.HUD.follow();
      if (now - hudT > 200) { hudT = now; E.HUD.update(); }
      if (now - refT > 1400) { refT = now; UI.refresh(); }
      if (now - saveT > 90000 && !G.over) { saveT = now; E.SAVE.save(G, 'auto'); }
    }
    E.MAP.render(G, now);
    requestAnimationFrame(frame);
  };

  /* ---------- arranque ---------- */
  const boot = () => {
    E.MAP.init(UI.$('#map'));
    let th = 'dark'; try { th = localStorage.getItem('estela.theme') || 'dark'; } catch (e) { }
    E.applyTheme(th);
    E.NG.title();
    requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', () => { if (document.hidden && E.G && !E.G.over) E.SAVE.save(E.G, 'auto'); });
    window.addEventListener('pagehide', () => { if (E.G && !E.G.over) E.SAVE.save(E.G, 'auto'); });
    window.addEventListener('resize', U.debounce(() => { if (E.G) { E.HUD.build(); UI.refresh(true); } }, 300));
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => { });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
