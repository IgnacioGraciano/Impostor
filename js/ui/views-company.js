/* ESTELA · finanzas (resultados, deuda, combustible, seguros, bolsa) y marketing */
'use strict';
(() => {
  const U = E.U, UI = E.UI;
  E.UIS.loan = { amt: 0, months: 60 };
  E.UIS.hedge = { pct: 0.3, months: 6 };
  E.UIS.camp = { type: 'tv', region: null, budget: 100000, weeks: 8 };

  E.V.finance = {
    title: 'Finanzas', live: true, wide: true,
    sub: () => { const G = E.G; return `Calificación ${G.fin.rating} · deuda ${U.money(E.EC.debt(G))}`; },
    render(p) {
      const G = E.G;
      const tab = p.tab || 'pl';
      let h = UI.tabs('finTab', [{ v: 'pl', l: 'Resultados' }, { v: 'debt', l: 'Préstamos' }, { v: 'fuel', l: 'Combustible' }, { v: 'ins', l: 'Seguros' }, { v: 'stock', l: 'Bolsa' }], tab);
      if (tab === 'pl') h += fPL(G);
      if (tab === 'debt') h += fDebt(G);
      if (tab === 'fuel') h += fFuel(G);
      if (tab === 'ins') h += fIns(G);
      if (tab === 'stock') h += fStock(G);
      return h;
    }
  };
  E.A.finTab = (d) => { UI.current().params = { tab: d.v }; UI.render(true); };

  const fPL = (G) => {
    const cur = G.fin.cur, last = G.fin.hist[G.fin.hist.length - 1] || E.newLedger();
    const y12 = G.fin.hist.slice(-12);
    const sumCat = (list, side, k) => list.reduce((s, m) => s + ((m[side] || {})[k] || 0), 0);
    let h = `<div class="grid4">${UI.stat('Caja', U.money(G.cash))}${UI.stat('Patrimonio neto', U.money(E.EC.equity(G)))}${UI.stat('Ingresos 12 meses', U.money(E.EC.revenue12(G)))}${UI.stat('EBITDA 12 meses', U.money(E.EC.ebitda12(G)))}</div>`;
    const tbl = (cats, side) => Object.keys(cats).filter(k => (cur[side][k] || last[side][k] || sumCat(y12, side, k))).map(k => `<tr><td>${cats[k]}</td><td class="n">${U.money(cur[side][k] || 0)}</td><td class="n">${U.money(last[side][k] || 0)}</td><td class="n">${U.money(sumCat(y12, side, k))}</td></tr>`).join('');
    const pr = m => E.EC.profitOf(m);
    const yr = y12.reduce((s, m) => s + pr(m), 0);
    const rev12 = y12.reduce((s, m) => s + E.EC.total(m.rev), 0);
    h += UI.sec('Estado de resultados');
    h += `<div class="tbl-wrap"><table class="tbl"><tr><th>Concepto</th><th class="n">Mes en curso</th><th class="n">Mes anterior</th><th class="n">12 meses</th></tr>
      ${tbl(E.EC.REV_CATS, 'rev')}<tr class="tot"><td>Ingresos</td><td class="n">${U.money(E.EC.total(cur.rev))}</td><td class="n">${U.money(E.EC.total(last.rev))}</td><td class="n">${U.money(rev12)}</td></tr>
      ${tbl(E.EC.COST_CATS, 'cost')}<tr class="tot"><td>Costos</td><td class="n">${U.money(E.EC.total(cur.cost))}</td><td class="n">${U.money(E.EC.total(last.cost))}</td><td class="n">${U.money(y12.reduce((s, m) => s + E.EC.total(m.cost), 0))}</td></tr>
      <tr class="tot"><td>Resultado</td><td class="n ${pr(cur) >= 0 ? 'good' : 'bad'}">${U.money(pr(cur))}</td><td class="n ${pr(last) >= 0 ? 'good' : 'bad'}">${U.money(pr(last))}</td><td class="n ${yr >= 0 ? 'good' : 'bad'}">${U.money(yr)}</td></tr>
      <tr><td class="muted">Margen</td><td class="n muted">${E.EC.total(cur.rev) ? U.pct(pr(cur) / E.EC.total(cur.rev), 1) : '—'}</td><td class="n muted">${E.EC.total(last.rev) ? U.pct(pr(last) / E.EC.total(last.rev), 1) : '—'}</td><td class="n muted">${rev12 ? U.pct(yr / rev12, 1) : '—'}</td></tr></table></div>`;
    const lm = G.fin.hist[G.fin.hist.length - 1];
    if (lm) {
      const parts = Object.entries(lm.cost).filter(([k, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v], i) => ({ k, v, c: UI.COLORS[i % UI.COLORS.length] }));
      h += UI.sec('Estructura de costos', `<span class="tiny muted">${U.fmtMonth(lm.t)}</span>`);
      h += `<div class="card row top wrap">${UI.donut(parts, 130)}<div class="grow" style="min-width:180px">${parts.slice(0, 9).map(p => `<div class="row sp small mt4"><span><i style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${p.c};margin-right:6px"></i>${E.EC.COST_CATS[p.k] || p.k}</span><span class="mono">${U.pct(p.v / E.EC.total(lm.cost))}</span></div>`).join('')}</div></div>`;
    }
    const hs = G.fin.hist.slice(-24);
    if (hs.length > 1) {
      h += UI.sec('Resultado mensual');
      h += `<div class="card tight">${UI.bars(hs.map(pr), { labels: hs.map(m => U.month(m.t) === 0 ? String(U.year(m.t)).slice(2) : '') })}</div>`;
      h += UI.sec('Caja');
      h += `<div class="card tight">${UI.lineChart([{ vals: hs.map(m => m.cash), color: 'var(--accent)', fill: true }])}</div>`;
    }
    h += `<div class="kv mt12"><span>Impuesto a las ganancias</span><span>25% trimestral</span><span>Quebrantos acumulados</span><span>${U.money(G.fin.taxLoss)}</span>${G.econ.infl > 0 ? `<span>Inflación mensual</span><span class="warn">${U.pct(G.econ.infl, 1)}</span><span>Índice de precios</span><span>${U.n2(G.econ.cpi)}</span>` : ''}</div>`;
    return h;
  };

  const fDebt = (G) => {
    const lim = E.EC.loanLimit(G);
    const L = E.UIS.loan;
    if (!L.amt || L.amt > lim) L.amt = Math.round(lim * 0.5 / 1e5) * 1e5;
    const rate = E.EC.loanRate(G, L.months);
    const pay = E.EC.makeLoan(G, Math.max(1, L.amt), rate, L.months).pay;
    let h = `<div class="grid3 r2">${UI.stat('Calificación', G.fin.rating, 'según deuda/EBITDA')}${UI.stat('Deuda total', U.money(E.EC.debt(G)))}${UI.stat('Capacidad de crédito', U.money(lim))}</div>`;
    h += UI.sec('Préstamos vigentes');
    h += G.fin.loans.length ? `<div class="list">${G.fin.loans.map(l => `<div class="item"><div class="grow"><div class="t">${U.esc(l.label || 'Préstamo bancario')}</div><div class="s">${U.pct(l.rate, 1)} anual · cuota ${U.money(l.pay)} · ${l.left} meses</div>${UI.bar(1 - l.amt / l.orig, '', true)}</div><div class="col" style="align-items:flex-end"><span class="mono">${U.money(l.amt)}</span><button class="btn sm" data-a="repay" data-v="${l.id}">Cancelar</button></div></div>`).join('')}</div>` : `<div class="empty">Sin deuda bancaria.</div>`;
    h += UI.sec('Pedir un préstamo');
    h += `<div class="card"><div class="slider-row"><span class="small">Monto</span><span class="val" id="lnAmt">${U.money(L.amt)}</span>${UI.range('loanAmt', 0, Math.max(1e6, Math.round(lim)), Math.max(1e5, Math.round(lim / 100 / 1e5) * 1e5), L.amt)}</div>
      <div class="row sp mt8"><span class="small">Plazo</span>${UI.seg('loanM', [12, 36, 60, 120].map(m => ({ v: m, l: m / 12 + (m === 12 ? ' año' : ' años') })), L.months)}</div>
      <div class="row sp mt12"><span class="small muted">Tasa ${U.pct(rate, 1)} · cuota mensual</span><span class="mono" style="font-weight:800" id="lnPay">${U.money(pay)}</span></div>
      <button class="btn primary block mt12" data-a="takeLoan" ${lim < 1e5 ? 'disabled' : ''}>Pedir préstamo</button></div>`;
    h += `<div class="note mt12">Los aviones comprados con financiación se garantizan con el propio avión (tasa menor). La tasa base depende de la época: en los 80 el crédito era caro.</div>`;
    return h;
  };
  E.IN.loanAmt = (el, type) => { E.UIS.loan.amt = +el.value; UI.$('#lnAmt').textContent = U.money(+el.value); const G = E.G; UI.$('#lnPay').textContent = U.money(E.EC.makeLoan(G, Math.max(1, +el.value), E.EC.loanRate(G, E.UIS.loan.months), E.UIS.loan.months).pay); };
  E.A.loanM = (d) => { E.UIS.loan.months = +d.v; UI.render(); };
  E.A.takeLoan = async () => { const G = E.G, L = E.UIS.loan; if (!await UI.confirm('¿Tomar el préstamo?', `${U.money(L.amt)} a ${L.months} meses al ${U.pct(E.EC.loanRate(G, L.months), 1)}.`, 'Confirmar')) return; const r = E.EC.takeLoan(G, L.amt, L.months); if (!r.ok) return UI.toast(r.why, 'bad'); UI.toast('Préstamo acreditado', 'good', 'bank'); UI.render(); };
  E.A.repay = async (d) => { const G = E.G; const l = G.fin.loans.find(x => x.id === d.v); if (!await UI.confirm('¿Cancelar el préstamo?', `Pagás ${U.money(Math.min(l.amt, G.cash))} ahora.`, 'Pagar')) return; E.EC.repay(G, d.v, l.amt); UI.render(); };

  const fFuel = (G) => {
    const fh = G.econ.fuelHist || [];
    const price = G.econ.fuel * G.econ.cpi;
    const day = Math.max(1, U.date(G.t).getUTCDate() - 1);
    const fuelMo = G.fin.hist.length ? (G.fin.hist[G.fin.hist.length - 1].cost.fuel || 0) : (G.fin.cur.cost.fuel || 0) * 30 / day;
    const monthlyKg = fuelMo / Math.max(0.01, price);
    let h = `<div class="grid3 r2">${UI.stat('Precio actual', U.n2(price) + ' $/kg', U.n2(price * 3.04) + ' $/galón')}${UI.stat('Consumo mensual', U.n0(monthlyKg / 1000) + ' t')}${UI.stat('Cubierto', U.pct(Math.min(0.9, G.fin.hedges.reduce((s, x) => s + x.pct, 0))))}</div>`;
    if (fh.length > 2) h += `<div class="card tight mt12">${UI.lineChart([{ vals: fh, color: 'var(--accent)', fill: true }], { fmt: v => U.n2(v) + ' $' })}<div class="tiny muted">Últimas ${fh.length} semanas</div></div>`;
    h += UI.sec('Precio por región');
    h += `<div class="grid4">${Object.entries(E.EC.REGF).map(([r, k]) => UI.stat(E.REGIONS[r], U.n2(price * k), k < 1 ? '<span class="good">barato</span>' : k > 1.1 ? '<span class="bad">caro</span>' : '')).join('')}</div>`;
    h += UI.sec('Coberturas (hedging)');
    h += G.fin.hedges.length ? `<div class="list">${G.fin.hedges.map(x => `<div class="item"><div class="grow"><div class="t">${U.pct(x.pct)} del consumo a ${U.n2(x.price * G.econ.cpi)} $/kg</div><div class="s">vence ${U.fmtDate(x.until)}</div></div>${x.price * G.econ.cpi < price ? UI.chip('ganando', 'good') : UI.chip('perdiendo', 'bad')}</div>`).join('')}</div>` : `<div class="note">Sin coberturas: tu costo sigue al mercado.</div>`;
    const H = E.UIS.hedge;
    const fwd = G.econ.fuel * (1 + 0.01 * H.months);
    const fee = monthlyKg * H.pct * H.months * price * 0.012;
    h += `<div class="card mt8"><div class="slider-row"><span class="small">Porcentaje a cubrir</span><span class="val">${U.pct(H.pct)}</span>${UI.range('hedgePct', 0.1, 0.6, 0.05, H.pct)}</div>
      <div class="row sp mt8"><span class="small">Plazo</span>${UI.seg('hedgeM', [3, 6, 12].map(m => ({ v: m, l: m + ' meses' })), H.months)}</div>
      <div class="row sp mt12 small"><span class="muted">Precio fijado</span><span class="mono">${U.n2(fwd * G.econ.cpi)} $/kg</span></div><div class="row sp small"><span class="muted">Prima</span><span class="mono">${U.money(fee)}</span></div>
      <button class="btn primary block mt12" data-a="buyHedge" ${monthlyKg <= 0 ? 'disabled' : ''}>Contratar cobertura</button></div>`;
    h += `<div class="note mt8">Cubrirte protege contra subas (crisis del petróleo, guerras), pero si el precio baja pagás más que la competencia.</div>`;
    return h;
  };
  E.IN.hedgePct = (el) => { E.UIS.hedge.pct = +el.value; el.parentElement.querySelector('.val').textContent = U.pct(+el.value); };
  E.A.hedgeM = (d) => { E.UIS.hedge.months = +d.v; UI.render(); };
  E.A.buyHedge = () => {
    const G = E.G, H = E.UIS.hedge; const price = G.econ.fuel * G.econ.cpi;
    const day = Math.max(1, U.date(G.t).getUTCDate() - 1);
    const monthlyKg = (G.fin.hist.length ? (G.fin.hist[G.fin.hist.length - 1].cost.fuel || 0) : (G.fin.cur.cost.fuel || 0) * 30 / day) / price;
    const fee = monthlyKg * H.pct * H.months * price * 0.012;
    if (G.cash < fee) return UI.toast('Caja insuficiente', 'bad');
    E.X.cash(G, -fee, 'fuel');
    G.fin.hedges.push({ pct: H.pct, price: G.econ.fuel * (1 + 0.01 * H.months), until: G.t + H.months * 730 });
    UI.toast('Cobertura contratada', 'good', 'fuel'); UI.render();
  };

  const fIns = (G) => {
    let h = `<p class="muted small" style="margin-top:0">El seguro cubre la pérdida del avión (casco) y las indemnizaciones a pasajeros y terceros. La prima depende del valor de la flota y de la cantidad de pasajeros.</p>`;
    h += `<div class="list">${Object.entries(E.EC.INS).map(([k, v]) => { const cur = G.fin.ins === k; const old = G.fin.ins; G.fin.ins = k; const m = E.EC.insuranceMonthly(G); G.fin.ins = old; return `<button class="item" data-a="setIns" data-v="${k}" style="${cur ? 'border-color:var(--accent)' : ''}"><div class="grow"><div class="t">${v.n}</div><div class="s">Casco ${U.pct(v.cover)} · responsabilidad civil ${U.pct(v.lcover)}</div></div><div class="r"><div class="mono">${U.money(m)}</div><div class="tiny muted">por mes</div></div>${cur ? UI.icon('check') : ''}</button>`; }).join('')}</div>`;
    const ins = G.mods.find(m => m.k === 'insurance' && m.until > G.t);
    if (ins) h += `<div class="note warn mt8">Primas elevadas por "${U.esc(ins.label)}" hasta ${U.fmtDate(ins.until)}.</div>`;
    return h;
  };
  E.A.setIns = (d) => { E.G.fin.ins = d.v; UI.render(); };

  const fStock = (G) => {
    const S = G.fin.stock;
    let h = '';
    if (!S.listed) {
      const why = E.EC.canIPO(G);
      const val = E.EC.valuation(G);
      h += `<div class="card"><div class="serif" style="font-size:24px">Salir a la bolsa</div><p class="small muted">Vendé parte de la compañía a inversores para financiar el crecimiento. Si perdés la mayoría y los accionistas se enojan, pueden destituirte.</p><div class="kv"><span>Valuación estimada</span><span>${U.money(val)}</span></div>
        ${why.length ? `<div class="note warn mt12">Requisitos pendientes:<br>${why.map(w => '· ' + w).join('<br>')}</div>` : `<div class="btns mt12">${[0.2, 0.3, 0.4, 0.49].map(p => `<button class="btn ${p === 0.3 ? 'primary' : ''}" data-a="ipo" data-v="${p}">Vender ${U.pct(p)} · ${U.money(val * p * 0.94)}</button>`).join('')}</div>`}</div>`;
      return h;
    }
    const cap = S.price * S.shares;
    h += `<div class="grid4">${UI.stat('Acción', U.n2(S.price) + ' $', `salida ${U.n2(S.ipoPrice)} $`)}${UI.stat('Capitalización', U.money(cap))}${UI.stat('Tu participación', U.pct(S.own, 1), S.own < 0.5 ? '<span class="warn">sin mayoría</span>' : 'controlante')}${UI.stat('Accionistas', Math.round(S.sat) + '%', S.sat < 25 ? '<span class="bad">furiosos</span>' : S.sat < 45 ? '<span class="warn">inquietos</span>' : 'conformes')}</div>`;
    if (S.hist.length > 2) h += `<div class="card tight mt12">${UI.lineChart([{ vals: S.hist.map(x => x.p), color: 'var(--sky)', fill: true }], { fmt: v => U.n2(v) + ' $' })}</div>`;
    h += `<div class="card mt12"><div class="slider-row"><span><b>Dividendos</b><div class="tiny muted">Porcentaje de la ganancia trimestral</div></span><span class="val">${U.pct(S.payout)}</span>${UI.range('payout', 0, 0.6, 0.05, S.payout)}</div></div>`;
    h += `<div class="card mt8"><b>Emitir acciones</b><div class="small muted">Diluye tu participación y baja el precio, pero trae caja fresca.</div><div class="btns mt8">${[0.05, 0.1, 0.2].map(p => `<button class="btn sm" data-a="issue" data-v="${p}">+${U.pct(p)} · ${U.money(S.shares * p * S.price * 0.95)}</button>`).join('')}</div></div>`;
    h += `<div class="card mt8"><b>Recomprar acciones</b><div class="small muted">Sube el precio y tu participación.</div><div class="btns mt8">${[0.02, 0.05, 0.1].map(p => `<button class="btn sm" data-a="buyback" data-v="${Math.round(cap * p)}">${U.money(cap * p)}</button>`).join('')}</div></div>`;
    return h;
  };
  E.A.ipo = async (d) => { const G = E.G; if (!await UI.confirm('¿Salir a la bolsa?', `Vendés el ${U.pct(+d.v)} de la compañía.`, 'Tocar la campana')) return; const c = E.EC.ipo(G, +d.v); if (c) UI.toast('¡Salida a bolsa! Recaudaste ' + U.money(c), 'good', 'trophy'); UI.render(); };
  E.IN.payout = (el, type) => { el.parentElement.querySelector('.val').textContent = U.pct(+el.value); if (type === 'change') E.G.fin.stock.payout = +el.value; };
  E.A.issue = async (d) => { if (!await UI.confirm('¿Emitir acciones?', 'Tu participación se diluye.', 'Emitir')) return; const c = E.EC.issue(E.G, +d.v); UI.toast('Recaudaste ' + U.money(c), 'good'); UI.render(); };
  E.A.buyback = (d) => { const G = E.G; if (G.cash < +d.v) return UI.toast('Caja insuficiente', 'bad'); E.EC.buyback(G, +d.v); UI.toast('Recompra ejecutada', 'good'); UI.render(); };

  /* ---------- Marketing ---------- */
  E.V.marketing = {
    title: 'Marketing', sub: 'Notoriedad, campañas y alianzas', live: true,
    render() {
      const G = E.G, C = E.UIS.camp;
      if (!C.region) C.region = G.airline.region;
      const yf = U.yearF(G.t);
      let h = UI.sec('Notoriedad de marca por región');
      h += `<div class="card">${Object.entries(E.REGIONS).map(([r, n]) => `<div class="mt8"><div class="row sp small"><span>${n}</span><span class="mono">${Math.round(G.mkt.aw[r])}%</span></div>${UI.bar(G.mkt.aw[r] / 100, 'brand', true)}</div>`).join('')}<div class="tiny muted mt8">La notoriedad multiplica tu atractivo ante pasajeros que salen de esa región. Se desgasta con el tiempo.</div></div>`;
      h += UI.sec('Campañas activas');
      h += G.mkt.campaigns.length ? `<div class="list">${G.mkt.campaigns.map(c => `<div class="item"><div class="grow"><div class="t">${E.MKT[c.type].n} · ${c.region === 'all' ? 'Mundial' : E.REGIONS[c.region]}</div><div class="s">${U.money(c.budget * G.econ.cpi)}/semana · hasta ${U.fmtDate(c.until)}</div></div><button class="btn sm ghost" data-a="stopCamp" data-v="${c.id}">Cortar</button></div>`).join('')}</div>` : `<div class="empty small">Sin campañas en curso.</div>`;
      h += UI.sec('Nueva campaña');
      h += `<div class="card"><div>${UI.seg('campType', Object.entries(E.MKT).map(([k, m]) => ({ v: k, l: m.n, dis: m.y > yf, tip: m.y > yf ? 'Desde ' + m.y : '' })), C.type)}</div><div class="small muted mt8">${E.MKT[C.type].d}</div>
        <label class="field mt12"><span>Región</span><select class="input" data-in="campRegion"><option value="all" ${C.region === 'all' ? 'selected' : ''}>Mundial</option>${Object.entries(E.REGIONS).map(([r, n]) => `<option value="${r}" ${C.region === r ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <div class="slider-row mt12"><span class="small">Presupuesto semanal</span><span class="val">${U.money(C.budget * G.econ.cpi)}</span>${UI.range('campBudget', 10000, 2000000, 10000, C.budget)}</div>
        <div class="row sp mt8"><span class="small">Duración</span>${UI.seg('campWeeks', [4, 8, 12, 26].map(w => ({ v: w, l: w + ' sem' })), C.weeks)}</div>
        <div class="row sp mt12"><span class="small muted">Costo total</span><span class="mono" style="font-weight:800" id="campTot">${U.money(C.budget * C.weeks * G.econ.cpi)}</span></div>
        <button class="btn primary block mt12" data-a="launchCamp">Lanzar campaña</button></div>`;
      h += UI.sec('Alianzas globales');
      if (!G.research.done.alliance) h += `<div class="note">Investigá "Diplomacia de alianzas" (desde 1997) para sumarte a una alianza: códigos compartidos, salas comunes y más pasajeros internacionales.</div>`;
      else h += `<div class="list">${E.ALLIANCES.map(a => { const on = G.mkt.alliance === a.id; return `<div class="item"><span style="width:12px;height:12px;border-radius:50%;background:${a.c};flex:none"></span><div class="grow"><div class="t">${a.n}</div><div class="s">Cuota ${U.money(a.fee * G.econ.cpi)}/año · demanda internacional +8%</div></div>${on ? `<button class="btn sm danger" data-a="leaveAll">Salir</button>` : `<button class="btn sm" data-a="joinAll" data-v="${a.id}" ${G.mkt.alliance || G.rep.overall < 50 ? 'disabled' : ''}>Unirse</button>`}</div>`; }).join('')}</div>${G.rep.overall < 50 ? '<div class="tiny muted mt8">Las alianzas exigen una reputación mínima de 50.</div>' : ''}`;
      h += UI.sec('Programa de fidelidad');
      h += G.research.done.ffp ? `<div class="note">Tu programa de viajero frecuente está activo: +10% de demanda en ejecutiva (costo ~0,4% de los ingresos).</div>` : `<div class="note">Investigá "Programa de viajero frecuente" (desde 1981).</div>`;
      return h;
    }
  };
  E.A.campType = (d) => { E.UIS.camp.type = d.v; UI.render(); };
  E.IN.campRegion = (el) => { E.UIS.camp.region = el.value; };
  E.IN.campBudget = (el) => { E.UIS.camp.budget = +el.value; el.parentElement.querySelector('.val').textContent = U.money(+el.value * E.G.econ.cpi); UI.$('#campTot').textContent = U.money(+el.value * E.UIS.camp.weeks * E.G.econ.cpi); };
  E.A.campWeeks = (d) => { E.UIS.camp.weeks = +d.v; UI.render(); };
  E.A.launchCamp = () => { const G = E.G, C = E.UIS.camp; G.mkt.campaigns.push({ id: U.uid(G, 'c'), type: C.type, region: C.region, budget: C.budget, until: G.t + C.weeks * 168 }); UI.toast('Campaña lanzada', 'good', 'mega'); UI.render(); };
  E.A.stopCamp = (d) => { E.G.mkt.campaigns = E.G.mkt.campaigns.filter(c => c.id !== d.v); UI.render(); };
  E.A.joinAll = (d) => { E.G.mkt.alliance = d.v; UI.toast('Te uniste a ' + E.ALLIANCES.find(a => a.id === d.v).n, 'good', 'globe'); UI.render(); };
  E.A.leaveAll = () => { E.G.mkt.alliance = null; E.X.rep(E.G, 'image', -2); UI.render(); };
})();
