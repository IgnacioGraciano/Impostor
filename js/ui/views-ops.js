/* ESTELA · personal, servicio a bordo y modelo de negocio, investigación */
'use strict';
(() => {
  const U = E.U, UI = E.UI;

  /* ---------- Personal ---------- */
  E.V.staff = {
    title: 'Personal', live: true,
    sub: () => { const G = E.G; return `${U.n0(U.sum(E.STAFF_KEYS, k => G.staff[k].n))} empleados · nómina ${U.money(E.ST.payroll(G))}/mes`; },
    render() {
      const G = E.G;
      const req = G.req || E.ST.required(G);
      let h = '';
      const strike = G.mods.find(m => m.k === 'strike' && m.until > G.t);
      if (strike) h += `<div class="note bad mb8">${UI.icon('alert')} ${U.esc(strike.label)} hasta ${U.fmtDate(strike.until)}.</div>`;
      if (G.econ.infl > 0) { const gap = Math.max(...E.STAFF_KEYS.map(k => G.econ.cpi / G.staff[k].cpiPaid - 1)); h += `<div class="card hl mb8"><div class="row sp"><div><b>Inflación ${U.pct(G.econ.infl, 1)} mensual</b><div class="small muted">Los salarios perdieron ${U.pct(gap)} de poder adquisitivo.</div></div><button class="btn sm primary" data-a="indexWages" ${gap < 0.01 ? 'disabled' : ''}>Indexar salarios</button></div></div>`; }
      h += `<div class="item mb8"><div class="grow"><div class="t">Contratación automática</div><div class="s">RR.HH. contrata para mantener la dotación al 105% de lo necesario.</div></div>${UI.toggle('setting', G.settings.autoStaff, 'data-k="autoStaff"')}</div>`;
      E.STAFF_KEYS.forEach(k => {
        const s = G.staff[k], C = E.STAFF_CATS[k];
        const tr = E.ST.inTraining(G, k);
        const ratio = req[k] ? s.n / req[k] : 1;
        const out = k === 'ground' && s.out;
        h += `<div class="card mt8"><div class="row sp"><div class="row">${UI.icon(C.i)}<b>${C.n}</b></div>${out ? UI.chip('Tercerizado', 'acc') : UI.chip(`${U.n0(s.n)} / ${U.n0(req[k])}`, ratio < 0.9 ? 'bad' : ratio < 1 ? 'warn' : 'good')}</div>`;
        if (!out) {
          h += `<div class="grid3 mt8"><div><div class="tiny muted">Moral</div><div class="mono ${s.morale < 35 ? 'bad' : s.morale < 55 ? 'warn' : 'good'}">${Math.round(s.morale)}%</div>${UI.bar(s.morale / 100, s.morale < 35 ? 'bad' : s.morale < 55 ? 'warn' : 'good', true)}</div><div><div class="tiny muted">Fatiga</div><div class="mono ${s.fatigue > 65 ? 'bad' : s.fatigue > 45 ? 'warn' : ''}">${Math.round(s.fatigue)}%</div>${UI.bar(s.fatigue / 100, s.fatigue > 65 ? 'bad' : s.fatigue > 45 ? 'warn' : 'sky', true)}</div><div><div class="tiny muted">En formación</div><div class="mono">${tr}</div></div></div>`;
          h += `<div class="slider-row mt12"><span class="small">Salario vs. mercado</span><span class="val">${U.pct(s.salary)} · ${U.money(E.ST.salary(G, k))}/año</span>${UI.range('salary', 0.7, 1.6, 0.01, s.salary, `data-k="${k}"`)}</div>`;
          h += `<div class="row sp mt8"><span class="small">Capacitación</span>${UI.seg('tlevel', E.ST.TLEVELS.map((n, i) => ({ v: k + ':' + i, l: n })), k + ':' + s.tlevel)}</div>`;
          h += `<div class="btns mt12"><button class="btn sm" data-a="hire" data-k="${k}" data-n="10" data-m="exp">+10 con experiencia</button><button class="btn sm" data-a="hire" data-k="${k}" data-n="10" data-m="cadet">+10 cadetes</button><button class="btn sm" data-a="hireReq" data-k="${k}">Cubrir lo necesario</button><button class="btn sm danger" data-a="fire" data-k="${k}">Despedir excedente</button></div>`;
          h += `<div class="tiny muted mt8">Con experiencia: ${U.money(E.ST.hireCost(G, k, 1, 'exp'))} c/u, disponibles ya. Cadetes: ${U.money(E.ST.hireCost(G, k, 1, 'cadet'))} c/u, ${C.wk} semana(s) de formación${k === 'pilots' ? ' y habilitación de tipo' : ''}.</div>`;
        }
        if (k === 'ground') h += `<div class="item mt8"><div class="grow"><div class="t">Tercerizar el handling</div><div class="s">Pagás por escala (+60%), sin personal propio ni huelgas, pero más equipaje perdido.</div></div>${UI.toggle('outsource', s.out)}</div>`;
        h += `</div>`;
      });
      h += `<div class="note mt12">Fatiga alta = más incidentes, demoras y cancelaciones. Moral baja (&lt;33%) = riesgo de huelga. La moral depende del salario, la capacitación, la fatiga, la inflación y la reputación de la empresa.</div>`;
      return h;
    }
  };
  E.IN.salary = (el, type) => { const s = E.G.staff[el.dataset.k]; el.parentElement.querySelector('.val').textContent = U.pct(+el.value) + ' · ' + U.money(E.STAFF_CATS[el.dataset.k].sal * E.ST.regW(E.G) * +el.value * s.cpiPaid) + '/año'; if (type === 'change') { s.salary = +el.value; UI.render(); } };
  E.A.tlevel = (d) => { const [k, v] = d.v.split(':'); E.G.staff[k].tlevel = +v; UI.render(); };
  E.A.hire = (d) => { const G = E.G; const c = E.ST.hire(G, d.k, +d.n, d.m); UI.toast(`${d.n} ${E.STAFF_CATS[d.k].n.toLowerCase()} ${d.m === 'exp' ? 'contratados' : 'en formación'} (${U.money(c)})`, 'good'); UI.render(); };
  E.A.hireReq = (d) => { const G = E.G; const req = E.ST.required(G)[d.k]; const need = Math.ceil(req * 1.03 - G.staff[d.k].n); if (need <= 0) return UI.toast('La dotación ya está cubierta'); const c = E.ST.hire(G, d.k, need, 'exp'); UI.toast(`Contrataste ${need} (${U.money(c)})`, 'good'); UI.render(); };
  E.A.fire = async (d) => { const G = E.G; const req = E.ST.required(G)[d.k]; const ex = Math.floor(G.staff[d.k].n - req * 1.05); if (ex <= 0) return UI.toast('No hay excedente'); if (!await UI.confirm(`¿Despedir ${ex} ${E.STAFF_CATS[d.k].n.toLowerCase()}?`, `Indemnización: ${U.money(ex * E.ST.salary(G, d.k) / 4)}. La moral va a caer.`, 'Despedir', true)) return; E.ST.fire(G, d.k, ex); UI.render(); };
  E.IN.outsource = (el) => { const G = E.G; G.staff.ground.out = el.checked; if (el.checked) { const n = G.staff.ground.n; E.X.cash(G, -n * E.ST.salary(G, 'ground') / 6, 'staff'); G.staff.ground.n = 0; G.staff.ground.train = []; UI.toast('Handling tercerizado', 'good'); } E.ST.required(G); UI.render(); };
  E.A.indexWages = () => { E.ST.indexSalaries(E.G); UI.toast('Salarios indexados', 'good'); UI.render(); };

  /* ---------- Servicio y modelo de negocio ---------- */
  E.V.service = {
    title: 'Servicio y tarifas', sub: 'Catering, entretenimiento, equipaje y modelo de negocio',
    render(p) {
      const G = E.G, S = G.svc;
      G.flags.sawService = true;
      const tab = p.tab || 'svc';
      const yf = U.yearF(G.t);
      let h = UI.tabs('svcTab', [{ v: 'svc', l: 'A bordo' }, { v: 'model', l: 'Modelo y equipaje' }, { v: 'care', l: 'Atención' }], tab);
      const opt = (group, sel, act) => Object.entries(E.SVC[group]).map(([k, v]) => ({ v: k, l: v.n, dis: (v.y && v.y > yf) || (v.req && !G.research.done[v.req]), tip: v.req && !G.research.done[v.req] ? 'Requiere ' + E.RES[v.req].n : v.y > yf ? 'Desde ' + v.y : '' }));
      if (tab === 'svc') {
        const card = (title, desc, group, cur, act, extra = '') => `<div class="card mt8"><div class="row sp"><b>${title}</b><span class="tiny muted">${extra}</span></div><div class="small muted mt4">${desc}</div><div class="mt8">${UI.seg(act, opt(group), cur)}</div></div>`;
        const cy = E.SVC.cateringY[S.cateringY];
        h += card('Catering turista', 'En vuelos cortos alcanza con un snack; en largos se espera comida caliente.', 'cateringY', S.cateringY, 'svcCatY', `${U.money(cy.c * G.econ.cpi)} + ${U.money(cy.ch * G.econ.cpi)}/h por pax`);
        h += card('Catering ejecutiva', 'Lo que más valoran los ejecutivos después del asiento.', 'cateringJ', S.cateringJ, 'svcCatJ', `${U.money(E.SVC.cateringJ[S.cateringJ].c * G.econ.cpi)} por pax`);
        h += card('Catering primera', 'Solo en aviones con cabina de primera.', 'cateringF', S.cateringF, 'svcCatF');
        h += card('Neceseres', 'Kits de amenidades en ejecutiva y primera.', 'amenity', S.amenity, 'svcAmen');
        h += card('Entretenimiento a bordo', 'Cambiar de sistema implica instalarlo en toda la flota (costo por asiento).', 'ife', S.ife, 'svcIfe', E.SVC.ife[S.ife].seat ? U.money(E.SVC.ife[S.ife].seat * G.econ.cpi) + '/asiento' : '');
        h += card('Wi-Fi', 'Satelital. Instalación por avión.', 'wifi', S.wifi, 'svcWifi', E.SVC.wifi[S.wifi].ac ? U.money(E.SVC.wifi[S.wifi].ac * G.econ.cpi) + '/avión' : '');
        h += `<div class="item mt8"><div class="grow"><div class="t">Bebidas alcohólicas sin cargo</div><div class="s">Clásico de las aerolíneas tradicionales.</div></div>${UI.toggle('alcohol', S.alcohol)}</div>`;
        const ac = G.fleet[0];
        if (ac) h += `<div class="grid3 r2 mt12">${UI.stat('Calidad turista', U.pct(E.D.quality(G, ac, 'y', 2)), 'vuelo de 2 h')}${UI.stat('Calidad turista', U.pct(E.D.quality(G, ac, 'y', 9)), 'vuelo de 9 h')}${UI.stat('Calidad ejecutiva', U.pct(E.D.svcScore(G, 'j', 6)), 'servicio')}</div>`;
      }
      if (tab === 'model') {
        h += `<div class="list">${Object.entries(E.MODELS).map(([k, m]) => `<button class="item" data-a="setModel" data-v="${k}" style="${G.airline.model === k ? 'border-color:var(--accent)' : ''}"><div class="grow"><div class="t">${m.n}</div><div class="s">${m.d}</div></div>${G.airline.model === k ? UI.icon('check') : ''}</button>`).join('')}</div>`;
        h += `<p class="tiny muted">Elegir un modelo aplica sus tarifas de extras y servicio sugerido. Podés ajustar cada cargo a mano.</p>`;
        const fee = (k, n, max, desc) => `<div class="card mt8"><div class="slider-row"><span><b>${n}</b><div class="tiny muted">${desc}</div></span><span class="val">${S[k] ? U.money(S[k] * G.econ.cpi) : 'Incluido'}</span>${UI.range('fee', 0, max, 1, S[k], `data-k="${k}"`)}</div></div>`;
        h += UI.sec('Cargos adicionales (turista)');
        h += fee('bag', 'Valija despachada', 80, 'La mitad de los pasajeros despacha; cobrar baja la satisfacción de clientes tradicionales.');
        h += fee('carry', 'Equipaje de mano grande', 60, 'Típico de ultra low-cost. Muy impopular.');
        h += fee('seat', 'Selección de asiento', 40, 'Ingreso fácil, pero molesta a las familias.');
        h += fee('prio', 'Embarque prioritario', 30, 'Bajo impacto en la satisfacción.');
        h += `<div class="card mt8"><div class="slider-row"><span><b>Sobreventa</b><div class="tiny muted">Vender por encima de la capacidad para compensar los que no se presentan.</div></span><span class="val">${U.pct(S.overbook)}</span>${UI.range('overbook', 0, 0.1, 0.01, S.overbook)}</div></div>`;
        const lc = G.routes.length ? (G.routes[0].dem || {}).lowcost || 0 : 0;
        h += `<div class="note mt12">Percepción de marca: <b>${lc > 0.6 ? 'low-cost' : lc > 0.3 ? 'híbrida' : 'tradicional'}</b>. Las low-cost estimulan demanda en turista con precios bajos, pero espantan a los pasajeros de ejecutiva.</div>`;
      }
      if (tab === 'care') {
        h += `<div class="card"><b>Política de compensaciones</b><div class="small muted mt4">Cuánto pagás en demoras, desvíos, sobreventa y equipaje perdido.</div><div class="mt8">${UI.seg('svcComp', Object.entries(E.SVC.comp).map(([k, v]) => ({ v: k, l: v.n })), S.comp)}</div></div>`;
        h += `<div class="grid2 mt12">${UI.stat('Servicio', Math.round(G.rep.service), UI.bar(G.rep.service / 100, '', true))}${UI.stat('Equipaje', Math.round(G.rep.bags), UI.bar(G.rep.bags / 100, '', true))}${UI.stat('Precio/valor', Math.round(G.rep.value), UI.bar(G.rep.value / 100, '', true))}${UI.stat('Puntualidad', Math.round(G.rep.punct), UI.bar(G.rep.punct / 100, '', true))}${UI.stat('Seguridad', Math.round(G.rep.safety), UI.bar(G.rep.safety / 100, '', true))}${UI.stat('Imagen pública', Math.round(G.rep.image), UI.bar(G.rep.image / 100, '', true))}</div>`;
        h += `<div class="note mt12">Si la puntualidad cae por debajo del 80%, los pasajeros de ejecutiva (los más rentables) empiezan a elegir a la competencia.</div>`;
      }
      return h;
    }
  };
  E.A.svcTab = (d) => { UI.current().params = { tab: d.v }; UI.render(true); };
  const setSvc = (k) => (d) => { E.G.svc[k] = d.v; UI.render(); };
  E.A.svcCatY = setSvc('cateringY'); E.A.svcCatJ = setSvc('cateringJ'); E.A.svcCatF = setSvc('cateringF'); E.A.svcAmen = setSvc('amenity'); E.A.svcComp = setSvc('comp');
  E.A.svcIfe = async (d) => {
    const G = E.G; const v = E.SVC.ife[d.v];
    const seats = G.fleet.reduce((s, a) => s + E.F.seats(a).total, 0);
    const c = v.seat * seats * G.econ.cpi;
    if (c > 0 && !await UI.confirm('¿Instalar ' + v.n + '?', `Retrofit en toda la flota: ${U.n0(seats)} asientos · ${U.money(c)}.`, 'Instalar')) return;
    if (G.cash < c) return UI.toast('Caja insuficiente', 'bad');
    E.X.cash(G, -c, 'other'); G.svc.ife = d.v; UI.render();
  };
  E.A.svcWifi = async (d) => {
    const G = E.G; const v = E.SVC.wifi[d.v];
    const prev = E.SVC.wifi[G.svc.wifi];
    const c = Math.max(0, v.ac - prev.ac) * G.fleet.length * G.econ.cpi;
    if (c > 0 && !await UI.confirm('¿Instalar ' + v.n + '?', `Antenas satelitales en ${G.fleet.length} aviones: ${U.money(c)}.`, 'Instalar')) return;
    if (G.cash < c) return UI.toast('Caja insuficiente', 'bad');
    E.X.cash(G, -c, 'other'); G.svc.wifi = d.v; UI.render();
  };
  E.IN.alcohol = (el) => { E.G.svc.alcohol = el.checked; };
  E.IN.fee = (el, type) => { const v = +el.value; el.parentElement.querySelector('.val').textContent = v ? U.money(v * E.G.econ.cpi) : 'Incluido'; if (type === 'change') { E.G.svc[el.dataset.k] = v; E.G.routes.forEach(r => E.D.routeDemand(E.G, r)); } };
  E.IN.overbook = (el, type) => { el.parentElement.querySelector('.val').textContent = U.pct(+el.value); if (type === 'change') E.G.svc.overbook = +el.value; };
  E.A.setModel = async (d) => {
    const G = E.G; const m = E.MODELS[d.v];
    if (!await UI.confirm('¿Cambiar a modelo ' + m.n + '?', 'Se aplican sus cargos de equipaje y el servicio sugerido. Las cabinas no cambian solas: reconfiguralas en cada avión.', 'Cambiar')) return;
    G.airline.model = d.v; Object.assign(G.svc, { bag: m.fees.bag, carry: m.fees.carry, seat: m.fees.seat, prio: m.fees.prio, cateringY: m.svc.cateringY, cateringJ: m.svc.cateringJ });
    G.routes.forEach(r => E.D.routeDemand(G, r)); UI.render();
  };

  /* ---------- Investigación ---------- */
  E.V.research = {
    title: 'Investigación', wide: true, live: true,
    sub: () => { const G = E.G; return `${Object.keys(G.research.done).length}/${E.RESEARCH.length} tecnologías`; },
    render() {
      const G = E.G, R = G.research;
      let h = '';
      if (R.cur) { const d = E.RES[R.cur.id]; h += `<div class="card hl"><div class="row sp"><div><div class="tiny up acc" style="font-weight:800">En desarrollo</div><div class="serif" style="font-size:24px">${d.n}</div><div class="small muted">${d.desc}</div></div><span class="mono">${Math.round(R.cur.prog)}/${d.d} días</span></div><div class="mt8">${UI.bar(R.cur.prog / d.d)}</div>${R.queue.length ? `<div class="tiny muted mt8">En cola: ${R.queue.map(q => E.RES[q].n).join(', ')}</div>` : ''}</div>`; }
      else h += `<div class="note warn">No hay ningún proyecto en curso. Elegí uno: se paga al iniciar y tarda los días indicados.</div>`;
      Object.entries(E.RES_CATS).forEach(([ck, c]) => {
        h += UI.sec(c.n);
        h += `<div class="grid2">${E.RESEARCH.filter(r => r.cat === ck).map(r => {
          const done = R.done[r.id], cur = R.cur && R.cur.id === r.id, q = R.queue.includes(r.id);
          const can = E.ENG.canResearch(G, r.id);
          const cls = done ? 'done' : cur ? 'cur' : can.ok ? '' : 'lock';
          return `<button class="res ${cls}" data-a="research" data-v="${r.id}" ${done || cur ? 'disabled' : ''}><div class="row sp"><span class="t">${r.n}</span>${done ? UI.icon('check', 'good') : cur ? `<span class="chip acc">${Math.round(R.cur.prog / r.d * 100)}%</span>` : q ? UI.chip('en cola') : can.ok ? `<span class="mono small">${U.money(can.cost)}</span>` : UI.icon('lock', 'dim')}</div><div class="small muted mt4">${r.desc}</div>${!done && !can.ok ? `<div class="tiny warn mt4">${can.why}</div>` : !done ? `<div class="tiny muted mt4">${r.d} días</div>` : ''}</button>`;
        }).join('')}</div>`;
      });
      return h;
    }
  };
  E.A.research = async (d) => {
    const G = E.G; const r = E.RES[d.v];
    const can = E.ENG.canResearch(G, d.v);
    if (!can.ok) return UI.toast(can.why, 'warn');
    if (!await UI.confirm(r.n, `${r.desc}<br><br>Costo ${U.money(can.cost)} · ${r.d} días${G.research.cur ? ' · se agrega a la cola' : ''}.`, G.research.cur ? 'Agregar a la cola' : 'Investigar')) return;
    const res = E.ENG.startResearch(G, d.v);
    if (!res.ok) return UI.toast(res.why, 'bad');
    UI.toast(res.queued ? 'Agregado a la cola' : 'Investigación iniciada', 'good', 'flask'); UI.render();
  };
})();
