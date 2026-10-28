/* ESTELA · escenarios históricos y partida libre */
'use strict';
E.SCENARIOS = [
  { id: 'charter72', n: 'Charter regional', era: '1972', y: 1972, m: 2, tone: '#c8773a',
    sub: 'Empezá con dos Fokker F27 usados y una licencia doméstica.',
    desc: 'Es 1972. El jet fuel cuesta centavos, las tarifas están reguladas y los 747 recién empiezan a volar. Fundás una pequeña compañía charter con dos turbohélices de segunda mano. Se viene la crisis del petróleo: elegí bien tus aviones.',
    cash: 14e6, model: 'legacy', homePick: a => a.size <= 4,
    fleet: [{ t: 'F27', n: 2, age: [5, 9], cond: [62, 75], own: 'own' }],
    research: [], morale: 72,
    goals: [
      { t: 'Tener 15 aviones', f: G => G.fleet.filter(a => a.status !== 'delivery').length / 15 },
      { t: 'Operar una ruta intercontinental', f: G => G.routes.some(r => E.AP[r.a].region !== E.AP[r.b].region) ? 1 : 0 },
      { t: '2 millones de pasajeros transportados', f: G => G.stats.pax / 2e6 }
    ], deadline: 1986 },
  { id: 'dereg78', n: 'Cielos abiertos', era: '1978', y: 1978, m: 9, tone: '#b8573a',
    sub: 'Estados Unidos desregula el mercado. Competencia feroz.',
    desc: 'Octubre de 1978: se acaban las tarifas fijas en Estados Unidos. Con cuatro DC-9 y un puñado de rutas, tenés que crecer antes de que las grandes te aplasten… o de que el segundo shock petrolero te funda.',
    cash: 45e6, model: 'hybrid', homePick: a => a.cc === 'US',
    fleet: [{ t: 'DC93', n: 4, age: [6, 10], cond: [65, 80], own: 'lease' }],
    research: ['crs'], morale: 65, autoRoutes: 3,
    goals: [
      { t: 'Tener 40 aviones', f: G => G.fleet.filter(a => a.status !== 'delivery').length / 40 },
      { t: 'Ganancia anual de $60 M', f: G => E.X.annualProfit(G) / (60e6 * G.econ.cpi) },
      { t: 'Reputación de 4 estrellas', f: G => G.rep.overall / 80 }
    ], deadline: 1990 },
  { id: 'bankrupt89', n: 'Al borde de la quiebra', era: '1989', y: 1989, m: 4, tone: '#9c3d3d',
    sub: 'Hiperinflación, deudas y una flota vieja. Salvá la compañía.',
    desc: 'Mayo de 1989. La inflación supera el 30% mensual, la compañía de bandera arrastra deudas enormes, la flota es vieja y los gremios están en pie de guerra. Te nombran presidente: tenés que indexar precios y salarios, renovar la flota y volver a dar ganancias.',
    cash: 6e6, model: 'legacy', homePick: a => a.region === 'SA' && a.size >= 4, homeDefault: 'EZE',
    fleet: [{ t: 'B722', n: 3, age: [14, 17], cond: [48, 60], own: 'own' }, { t: 'B732', n: 4, age: [12, 16], cond: [50, 62], own: 'own' }, { t: 'B742', n: 1, age: [11, 13], cond: [52, 60], own: 'own' }, { t: 'F28', n: 2, age: [14, 17], cond: [48, 58], own: 'own' }],
    research: ['lic_reg', 'lic_int', 'crs'], morale: 32, inflation: 0.14, loans: [{ amt: 160e6, rate: 0.16, months: 120 }], autoRoutes: 7,
    goals: [
      { t: 'Patrimonio neto positivo', f: G => E.X.equity(G) > 0 ? 1 : Math.max(0, 1 + E.X.equity(G) / (200e6 * G.econ.cpi)) },
      { t: 'Reputación de 50 o más', f: G => G.rep.overall / 50 },
      { t: 'Moral promedio del personal sobre 55%', f: G => E.X.avgMorale(G) / 55 }
    ], deadline: 1996 },
  { id: 'lowcost95', n: 'Revolución low-cost', era: '1995', y: 1995, m: 3, tone: '#e0a040',
    sub: 'Europa se liberaliza. Tres 737 en leasing y precios de risa.',
    desc: 'El mercado único europeo abrió las puertas a las aerolíneas de bajo costo. Con tres 737-300 alquilados, tarifas mínimas y cobro de extras, el objetivo es convertirte en la low-cost más grande del continente.',
    cash: 30e6, model: 'lcc', homePick: a => a.region === 'EU' && a.size <= 4,
    fleet: [{ t: 'B733', n: 3, age: [6, 9], cond: [72, 82], own: 'lease' }],
    research: ['lic_reg', 'crs', 'quickturn', 'occ'], morale: 70,
    goals: [
      { t: 'Tener 60 aviones', f: G => G.fleet.filter(a => a.status !== 'delivery').length / 60 },
      { t: 'Ocupación media del 85%', f: G => E.X.avgLoad(G) / 0.85 },
      { t: '30 millones de pasajeros transportados', f: G => G.stats.pax / 30e6 }
    ], deadline: 2010 },
  { id: 'gulf04', n: 'Supertransbordador', era: '2004', y: 2004, m: 0, tone: '#3d7a9c',
    sub: 'Capital ilimitado en el Golfo. Conectá el mundo por tu hub.',
    desc: 'Un fondo soberano te encarga construir una superconectora global en el desierto. Hay capital de sobra: lo que falta es red, producto premium y una reputación de lujo.',
    cash: 1.6e9, model: 'legacy', homePick: a => ['DXB', 'DOH', 'AUH', 'BAH', 'MCT'].includes(a.iata), homeDefault: 'DOH',
    fleet: [{ t: 'A332', n: 4, age: [2, 5], cond: [85, 92], own: 'lease' }, { t: 'A320', n: 4, age: [2, 6], cond: [85, 92], own: 'lease' }],
    research: ['lic_reg', 'lic_int', 'etops120', 'etops180', 'crs', 'gds', 'web', 'lounge', 'ffp'], morale: 75,
    goals: [
      { t: 'Volar a 50 destinos', f: G => E.X.destinations(G).length / 50 },
      { t: 'Destinos en los 6 continentes habitados', f: G => new Set(E.X.destinations(G).map(i => E.AP[i].region)).size / 7 },
      { t: '15 millones de pasajeros por año', f: G => E.X.annualPax(G) / 15e6 }
    ], deadline: 2018 },
  { id: 'covid20', n: 'Tormenta perfecta', era: '2020', y: 2020, m: 0, tone: '#5a6b8a',
    sub: 'Una aerolínea mediana en enero de 2020. Ya sabés lo que viene.',
    desc: 'Enero de 2020: récord de pasajeros, flota moderna y deuda alta. En marzo el mundo se detiene. Sobreviví hasta 2023 sin quebrar y salí más fuerte que la competencia.',
    cash: 220e6, model: 'hybrid', homePick: a => a.size >= 4,
    fleet: [{ t: 'A20N', n: 10, age: [1, 3], cond: [88, 95], own: 'lease' }, { t: 'A320', n: 8, age: [8, 12], cond: [70, 80], own: 'own' }, { t: 'B789', n: 4, age: [2, 4], cond: [88, 94], own: 'lease' }],
    research: ['lic_reg', 'lic_int', 'etops120', 'etops180', 'crs', 'gds', 'web', 'yield', 'ffp', 'lounge', 'py', 'ife', 'flatbed'], morale: 68, autoRoutes: 14, loans: [{ amt: 300e6, rate: 0.045, months: 96 }],
    goals: [
      { t: 'Llegar a 2023 sin quebrar', f: G => E.U.yearF(G.t) >= 2023 ? 1 : (E.U.yearF(G.t) - 2020) / 3 },
      { t: 'Recuperar 25 aviones activos', f: G => G.fleet.filter(a => a.status === 'active').length / 25 },
      { t: 'Caja de $100 M al final', f: G => G.cash / (100e6 * G.econ.cpi) }
    ], deadline: 2023 },
  { id: 'free', n: 'Partida libre', era: 'Libre', y: 2000, m: 0, tone: '#4f8a6e', free: true,
    sub: 'Elegí el año, la base y el capital. Sin objetivos: solo crecer.',
    desc: 'Construí la aerolínea de tus sueños desde cero, en la época que prefieras.',
    cash: 60e6, model: 'legacy', homePick: a => true, fleet: [], research: [], morale: 70, goals: [], deadline: 0 }
];
E.SCN = {}; E.SCENARIOS.forEach(s => E.SCN[s.id] = s);
E.FREE_YEARS = [1970, 1980, 1990, 2000, 2010, 2020, 2026];
E.DIFFS = { easy: { n: 'Holgada', cash: 2.2, k: 0.85 }, normal: { n: 'Normal', cash: 1, k: 1 }, hard: { n: 'Exigente', cash: 0.45, k: 1.15 } };
