/* ESTELA · pantalla de título y asistente de nueva aerolínea */
'use strict';
E.NG = (() => {
  const U = E.U, UI = E.UI;
  const NG = {};
  const W = { step: 0, scn: 'charter72', year: 2000, diff: 'normal', name: '', code: '', p: '#1f5fa8', s: '#f2a900', livery: 'moderna', logo: 'ala', home: null, model: null, sim: 'real', hist: true, crises: true, q: '' };
  const TZ = { 'Argentina': 'EZE', 'Buenos_Aires': 'EZE', 'Cordoba': 'COR', 'Madrid': 'MAD', 'Mexico': 'MEX', 'Bogota': 'BOG', 'Santiago': 'SCL', 'Lima': 'LIM', 'Montevideo': 'MVD', 'Sao_Paulo': 'GRU', 'Caracas': 'CCS', 'Asuncion': 'ASU', 'La_Paz': 'LPB', 'Guayaquil': 'GYE', 'Panama': 'PTY', 'New_York': 'JFK', 'Chicago': 'ORD', 'Los_Angeles': 'LAX', 'London': 'LHR', 'Paris': 'CDG', 'Berlin': 'BER', 'Rome': 'FCO', 'Lisbon': 'LIS', 'Canary': 'LPA', 'Costa_Rica': 'SJO', 'Guatemala': 'GUA', 'Santo_Domingo': 'SDQ', 'Havana': 'HAV', 'Puerto_Rico': 'SJU' };
  const guessHome = () => { try { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; const k = Object.keys(TZ).find(k => tz.includes(k)); return k ? TZ[k] : 'MAD'; } catch (e) { return 'MAD'; } };
  const previewType = (y) => y < 1975 ? 'B722' : y < 1985 ? 'DC10' : y < 1995 ? 'B744' : y < 2008 ? 'A333' : y < 2018 ? 'B789' : 'A359';

  /* ---------- título ---------- */
  NG.title = () => {
    const el = UI.$('#title');
    el.classList.remove('hidden');
    UI.$('#app').classList.add('hidden');
    const saves = E.SAVE.list().sort((a, b) => b.real - a.real);
    const last = saves[0];
    const art = E.ART.side('B742', { p: '#c8573a', s: '#f3e3c0', livery: 'retro', logo: 'sol', name: 'Estela' });
    el.innerHTML = `<div class="title-bg" style="background:radial-gradient(ellipse at 70% 20%, rgba(243,182,74,.16), transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(124,196,255,.12), transparent 50%), var(--bg)"></div>
      <div class="title-inner">
        <div class="row sp"><span class="tiny up muted" style="letter-spacing:.3em">Simulador de aerolíneas · <span style="white-space:nowrap">1970 – 2030</span></span><span class="tiny muted mono">v1.0</span></div>
        <div class="logo-big">Est<em>e</em>la</div>
        <div class="tagline">Fundá tu aerolínea, elegí cada avión, trazá rutas por el mundo y sobreviví a cinco décadas de crisis del petróleo, guerras de precios y tormentas.</div>
        <div style="max-width:620px;margin:26px 0 0 -10px;height:150px;animation:floaty 6s ease-in-out infinite">${art}</div>
        <div class="menu">
          ${last ? `<button class="btn primary" data-a="ngContinue" data-v="${last.slot}">${UI.icon('play')}Continuar · ${U.esc(last.name)} <span class="muted" style="margin-left:auto;font-weight:500">${last.date}</span></button>` : ''}
          <button class="btn ${last ? '' : 'primary'}" data-a="ngStart">${UI.icon('plus')}Nueva aerolínea</button>
          ${saves.length > 1 ? `<button class="btn" data-a="ngSaves">${UI.icon('save')}Cargar partida</button>` : ''}
          <button class="btn ghost" data-a="ngImport">${UI.icon('inbox')}Importar partida</button>
        </div>
        <div class="saves" id="ngSaves"></div>
        <p class="tiny muted" style="margin-top:auto;padding-top:30px">Jugable en celular y computadora. Datos de mapa: Natural Earth. Aviones y aeropuertos reales; aerolíneas competidoras ficticias.</p>
      </div>
      <style>@keyframes floaty{50%{transform:translateY(-8px)}}</style>`;
  };
  E.A.ngContinue = (d) => { const G = E.SAVE.load(d.v); if (!G) return UI.toast('No se pudo cargar', 'bad'); E.startGame(G); };
  E.A.ngStart = () => NG.start();
  E.A.ngImport = () => E.A.importSave();
  E.A.ngSaves = () => {
    const saves = E.SAVE.list().sort((a, b) => b.real - a.real);
    UI.$('#ngSaves').innerHTML = `<div class="list">${saves.map(s => `<div class="item"><span style="width:12px;height:12px;border-radius:50%;background:${s.p};flex:none"></span><div class="grow"><div class="t">${U.esc(s.name)} <span class="muted small">${s.slot === 'auto' ? 'autoguardado' : 'ranura ' + s.slot}</span></div><div class="s">${s.date} · ${s.fleet} aviones · ${U.money(s.cash)} · ${U.esc(s.scn || '')}</div></div><button class="btn sm" data-a="ngContinue" data-v="${s.slot}">Cargar</button><button class="iconbtn" data-a="ngDel" data-v="${s.slot}" aria-label="Borrar">${UI.icon('x')}</button></div>`).join('')}</div>`;
  };
  E.A.ngDel = async (d) => { if (await UI.confirm('¿Borrar la partida?', 'No se puede deshacer.', 'Borrar', true)) { E.SAVE.remove(d.v); NG.title(); E.A.ngSaves(); } };

  /* ---------- asistente ---------- */
  NG.start = () => { W.step = 0; W.home = null; W.model = null; NG.render(); };
  NG.render = () => {
    const el = UI.$('#title');
    const scn = E.SCN[W.scn];
    const year = scn.free ? W.year : scn.y;
    const steps = ['Escenario', 'Identidad', 'Base', 'Estrategia'];
    let body = '';
    if (W.step === 0) {
      body = `<h1>Elegí tu historia</h1><p class="muted">Cada escenario arranca en un momento distinto de la aviación, con sus aviones, precios y crisis.</p>
        <div class="scn-grid mt12">${E.SCENARIOS.map(s => `<button class="scn ${W.scn === s.id ? 'on' : ''}" data-a="ngScn" data-v="${s.id}"><div class="era" style="background:linear-gradient(135deg, ${s.tone}, color-mix(in srgb, ${s.tone} 45%, #000))">${s.era}<small>${s.n}</small></div><div class="bd"><span>${s.sub}</span></div></button>`).join('')}</div>
        <div class="card mt16"><b>${scn.n}</b><p class="small muted">${scn.desc}</p>${scn.goals.length ? `<div class="small"><b>Objetivos${scn.deadline ? ' (hasta ' + scn.deadline + ')' : ''}:</b><br>${scn.goals.map(g => '· ' + g.t).join('<br>')}</div>` : ''}
        ${scn.free ? `<div class="row wrap mt12"><span class="small muted">Año de inicio</span>${UI.seg('ngYear', E.FREE_YEARS.map(y => ({ v: y, l: y })), W.year)}</div>` : ''}
        <div class="row wrap mt12"><span class="small muted">Dificultad</span>${UI.seg('ngDiff', Object.entries(E.DIFFS).map(([k, d]) => ({ v: k, l: d.n })), W.diff)}</div></div>`;
    }
    if (W.step === 1) {
      if (!W.name) W.name = 'Aerovías ' + ['del Sur', 'Atlántica', 'Andina', 'Austral', 'Pampa', 'Meridiana', 'del Plata'][U.randi(0, 6)];
      if (!W.code) W.code = W.name.replace(/[^A-Za-z]/g, '').slice(0, 1).toUpperCase() + W.name.split(' ').slice(-1)[0].replace(/[^A-Za-z]/g, '').slice(0, 1).toUpperCase();
      const al = { p: W.p, s: W.s, livery: W.livery, logo: W.logo, name: W.name };
      body = `<h1>Tu aerolínea</h1><p class="muted">Nombre, código y librea. La verás en cada avión del mapa y del catálogo.</p>
        <div class="livery-preview mt12" style="--brand:${W.p}">${E.ART.side(previewType(year), al)}</div>
        <div class="row wrap mt12"><label class="field grow" style="min-width:200px"><span>Nombre</span><input class="input" data-in="ngName" value="${U.esc(W.name)}" maxlength="28"></label><label class="field" style="width:110px"><span>Código IATA</span><input class="input mono" data-in="ngCode" value="${U.esc(W.code)}" maxlength="2" style="text-transform:uppercase"></label></div>
        <div class="field mt12"><span>Color principal</span><div class="swatches">${E.PALETTE.map(c => `<button class="sw ${W.p === c ? 'on' : ''}" style="background:${c}" data-a="ngP" data-v="${c}" aria-label="${c}"></button>`).join('')}</div></div>
        <div class="field mt12"><span>Color secundario</span><div class="swatches">${E.PALETTE.map(c => `<button class="sw ${W.s === c ? 'on' : ''}" style="background:${c}" data-a="ngS" data-v="${c}" aria-label="${c}"></button>`).join('')}</div></div>
        <div class="field mt12"><span>Estilo de librea</span>${UI.seg('ngLiv', Object.entries(E.LIVERIES).map(([v, l]) => ({ v, l })), W.livery)}</div>
        <div class="field mt12"><span>Símbolo de cola</span><div class="swatches">${Object.keys(E.LOGOS).map(k => `<button class="sw ${W.logo === k ? 'on' : ''}" style="width:46px;height:46px;background:${W.p};display:grid;place-items:center" data-a="ngLogo" data-v="${k}" title="${E.LOGOS[k]}"><svg viewBox="0 0 100 100" width="30" height="30">${E.ART.glyph(k, W.s, W.name)}</svg></button>`).join('')}</div></div>`;
    }
    if (W.step === 2) {
      if (!W.home) {
        const g = scn.homeDefault || guessHome();
        const gcc = (E.AP[g] || {}).cc;
        const cands = [g].concat(E.AIRPORTS.filter(a => a.cc === gcc).sort((a, b) => b.size - a.size).map(a => a.iata), ['AEP', 'EZE', 'MAD', 'BCN', 'MEX', 'BOG', 'SCL', 'LIM']);
        W.home = cands.find(i => E.AP[i] && scn.homePick(E.AP[i])) || (E.AIRPORTS.filter(scn.homePick).sort((a, b) => b.size - a.size || b.pop - a.pop)[0] || {}).iata;
      }
      const q = W.q.toLowerCase();
      const list = E.AIRPORTS.filter(scn.homePick).filter(a => !q || (a.city + a.iata + a.country).toLowerCase().includes(q)).sort((a, b) => a.country.localeCompare(b.country) || b.size - a.size);
      const h = E.AP[W.home];
      body = `<h1>Tu base principal</h1><p class="muted">Desde aquí saldrán tus primeras rutas. Las grandes ciudades tienen más demanda… y más competencia.</p>
        ${h ? `<div class="card hl mt12"><div class="row sp"><div><div class="mono" style="font-size:24px;font-weight:800">${h.iata}</div><div>${h.city}, ${h.country}</div></div><div class="r small muted">Tamaño ${'●'.repeat(h.size)}${'○'.repeat(5 - h.size)}<br>${U.n1(h.pop)} M hab. · pista ${U.n0(h.rwy)} m${h.slot >= 2 ? '<br><span class="warn">aeropuerto saturado</span>' : ''}</div></div></div>` : ''}
        <input class="input mt12" placeholder="Buscar ciudad o país…" data-in="ngQ" value="${U.esc(W.q)}">
        <div class="list mt8" style="max-height:46vh;overflow:auto">${list.map(a => `<button class="item" data-a="ngHome" data-v="${a.iata}" style="${W.home === a.iata ? 'border-color:var(--accent)' : ''}"><span class="mono t" style="width:42px">${a.iata}</span><div class="grow"><div class="t" style="font-weight:500">${a.city}</div><div class="s">${a.country} · ${E.REGIONS[a.region]}</div></div><span class="tiny muted">${'●'.repeat(a.size)}</span></button>`).join('')}</div>`;
    }
    if (W.step === 3) {
      if (!W.model) W.model = scn.model;
      body = `<h1>Estrategia</h1><p class="muted">Tu modelo de negocio define precios, servicio y a qué pasajeros apuntás. Podés cambiarlo después.</p>
        <div class="list mt12">${Object.entries(E.MODELS).map(([k, m]) => `<button class="item" data-a="ngModel" data-v="${k}" style="${W.model === k ? 'border-color:var(--accent)' : ''}"><div class="grow"><div class="t">${m.n}</div><div class="s">${m.d}</div></div>${W.model === k ? UI.icon('check') : ''}</button>`).join('')}</div>
        <div class="card mt16"><div class="row sp"><div><b>Emergencias en vuelo</b><div class="small muted">Realista: tomás el control de la cabina con la lista de chequeo. Simplificado: decide la tripulación.</div></div>${UI.seg('ngSim', [{ v: 'real', l: 'Realista' }, { v: 'simple', l: 'Simplificado' }], W.sim)}</div>
        <div class="row sp mt12"><span>Eventos históricos</span>${UI.toggle('ngHist', W.hist)}</div><div class="row sp mt8"><span>Crisis y oportunidades aleatorias</span>${UI.toggle('ngCrises', W.crises)}</div></div>
        <div class="note mt12">Arrancás el ${U.fmtDateL(U.tOf(year, scn.free ? 0 : scn.m, 1))} en ${E.AP[W.home].city} con ${U.money(scn.cash * (scn.free ? E.DIFFS[W.diff].cash : 1))}${scn.fleet.length ? ' y ' + scn.fleet.map(f => f.n + '× ' + E.AC[f.t].short).join(', ') : ' y sin aviones: comprá o alquilá los primeros'}.</div>`;
    }
    el.innerHTML = `<div class="title-bg" style="background:radial-gradient(ellipse at 80% 0%, color-mix(in srgb, ${scn.tone} 30%, transparent), transparent 55%), var(--bg)"></div>
      <div class="title-inner wiz"><div class="row sp"><button class="btn ghost sm" data-a="ngBack">${UI.icon('back')}${W.step ? 'Atrás' : 'Menú'}</button><span class="tiny up muted">${steps[W.step]} · ${W.step + 1}/${steps.length}</span></div>
      <div class="stepper mt8">${steps.map((s, i) => `<i class="${i <= W.step ? 'on' : ''}"></i>`).join('')}</div>${body}
      <div class="wiz-foot"><span></span><button class="btn primary" data-a="ngNext" style="min-width:160px">${W.step === steps.length - 1 ? UI.icon('plane') + 'Fundar aerolínea' : 'Siguiente'}</button></div></div>`;
    el.scrollTop = 0;
  };
  E.A.ngScn = (d) => { W.scn = d.v; W.home = null; W.model = null; NG.render(); };
  E.A.ngYear = (d) => { W.year = +d.v; NG.render(); };
  E.A.ngDiff = (d) => { W.diff = d.v; NG.render(); };
  E.IN.ngName = (el) => { W.name = el.value; };
  E.IN.ngCode = (el) => { W.code = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2); };
  E.A.ngP = (d) => { W.p = d.v; NG.render(); };
  E.A.ngS = (d) => { W.s = d.v; NG.render(); };
  E.A.ngLiv = (d) => { W.livery = d.v; NG.render(); };
  E.A.ngLogo = (d) => { W.logo = d.v; NG.render(); };
  E.A.ngHome = (d) => { W.home = d.v; NG.render(); };
  E.IN.ngQ = U.debounce((el) => { W.q = el.value; NG.render(); const i = UI.$('#title input[data-in=ngQ]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250);
  E.A.ngModel = (d) => { W.model = d.v; NG.render(); };
  E.A.ngSim = (d) => { W.sim = d.v; NG.render(); };
  E.IN.ngHist = (el) => { W.hist = el.checked; };
  E.IN.ngCrises = (el) => { W.crises = el.checked; };
  E.A.ngBack = () => { if (W.step) { W.step--; NG.render(); } else NG.title(); };
  E.A.ngNext = () => {
    if (W.step === 1) { if (!W.name.trim()) return UI.toast('Poné un nombre', 'warn'); if (W.code.length !== 2) return UI.toast('El código IATA tiene 2 caracteres', 'warn'); }
    if (W.step === 2 && !W.home) return UI.toast('Elegí una base', 'warn');
    if (W.step < 3) { W.step++; NG.render(); return; }
    const scn = E.SCN[W.scn];
    const G = E.newGame({ scn: W.scn, year: W.year, diff: W.diff, name: W.name.trim(), code: W.code, p: W.p, s: W.s, livery: W.livery, logo: W.logo, home: W.home, model: W.model, settings: { sim: W.sim, hist: W.hist, crises: W.crises, theme: E.themeNow || 'dark' } });
    E.startGame(G, true);
  };
  return NG;
})();
