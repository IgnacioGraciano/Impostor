/* ESTELA · eventos históricos, crisis con decisiones y emergencias en vuelo
   Las funciones usan los helpers de E.X (definidos en sim/events.js). */
'use strict';

/* ================== Eventos históricos (por fecha) ================== */
E.HIST = [
  { id: 'oil73', y: 1973, m: 9, d: 17, kicker: 'Crisis del petróleo', head: 'La OPEP corta el suministro: el combustible se triplica',
    text: 'El embargo petrolero dispara el precio del jet fuel. Los aviones más sedientos (707, DC-8, primeros 747) se vuelven difíciles de rentabilizar. La demanda cae por la recesión.',
    fx: G => { E.X.mod(G, { k: 'demand', v: 0.9, days: 420, label: 'Recesión por crisis del petróleo' }); } },
  { id: 'tenerife77', y: 1977, m: 2, d: 27, kicker: 'Seguridad aérea', head: 'Tragedia en Los Rodeos: la peor catástrofe de la aviación',
    text: 'Dos 747 chocan en la pista de Tenerife entre niebla y congestión. Las autoridades endurecen procedimientos y la industria impulsará el entrenamiento CRM.',
    fx: G => { E.X.mod(G, { k: 'demand', v: 0.97, days: 60, label: 'Miedo a volar' }); } },
  { id: 'dereg78', y: 1978, m: 9, d: 24, kicker: 'Estados Unidos', head: 'Carter firma la desregulación: fin de las tarifas fijas',
    text: 'Las aerolíneas estadounidenses podrán fijar precios y abrir rutas libremente. Llega una ola de competidores y de tarifas bajas en Norteamérica.',
    fx: G => { E.X.mod(G, { k: 'fare', scope: { region: 'NA' }, v: 0.88, days: 99999, label: 'Desregulación' }); E.X.mod(G, { k: 'demand', scope: { region: 'NA' }, v: 1.1, days: 99999, label: 'Desregulación' }); E.X.competition(G, { region: 'NA' }, 1); } },
  { id: 'dc10_79', y: 1979, m: 5, d: 6, kicker: 'FAA', head: 'La FAA deja en tierra a todos los DC-10',
    text: 'Tras el accidente del vuelo 191 en Chicago, la flota mundial de DC-10 queda suspendida por inspecciones durante 37 días.',
    fx: G => { E.X.mod(G, { k: 'grounded', scope: { type: 'DC10' }, days: 37, label: 'Suspensión FAA del DC-10' }); } },
  { id: 'oil79', y: 1979, m: 5, d: 20, kicker: 'Revolución iraní', head: 'Segundo shock petrolero: el crudo vuelve a dispararse',
    text: 'La caída de la producción iraní eleva otra vez el combustible. Los bimotores eficientes empiezan a ganar terreno.',
    fx: G => { E.X.mod(G, { k: 'demand', v: 0.95, days: 365, label: 'Shock petrolero' }); } },
  { id: 'patco81', y: 1981, m: 7, d: 3, kicker: 'Huelga', head: 'Huelga de controladores en EE.UU.: Reagan despide a 11.000',
    text: 'El tráfico aéreo estadounidense opera con capacidad reducida durante semanas. Esperá demoras importantes en Norteamérica.',
    fx: G => { E.X.mod(G, { k: 'delay', scope: { cc: 'US' }, v: 35, days: 75, label: 'Huelga PATCO' }); } },
  { id: 'oil86', y: 1986, m: 1, d: 20, kicker: 'Mercados', head: 'Se derrumba el petróleo: el combustible cae a la mitad',
    text: 'La sobreoferta saudí hunde el precio del crudo. Momento de oro para expandirse… o de quedarse con aviones viejos.', fx: G => {} },
  { id: 'gulf90', y: 1990, m: 7, d: 2, kicker: 'Guerra del Golfo', head: 'Irak invade Kuwait: combustible por las nubes y miedo a volar',
    text: 'El espacio aéreo del Golfo se vuelve peligroso, el combustible se dispara y la demanda internacional se desploma.',
    fx: G => { E.X.mod(G, { k: 'demand', v: 0.88, days: 240, label: 'Guerra del Golfo' }); E.X.mod(G, { k: 'demand', scope: { region: 'ME' }, v: 0.5, days: 200, label: 'Guerra del Golfo' }); E.X.mod(G, { k: 'insurance', v: 1.8, days: 300, label: 'Riesgo de guerra' }); } },
  { id: 'ussr91', y: 1991, m: 11, d: 26, kicker: 'Fin de una era', head: 'Se disuelve la Unión Soviética',
    text: 'Se abren los cielos del este: más demanda hacia Rusia y Europa del Este, y cientos de aviones soviéticos baratos al mercado.',
    fx: G => { E.X.mod(G, { k: 'demand', scope: { cc: 'RU' }, v: 1.3, days: 99999, label: 'Apertura del Este' }); } },
  { id: 'eu93', y: 1993, m: 0, d: 1, kicker: 'Unión Europea', head: 'Nace el mercado aéreo único europeo',
    text: 'Los vuelos dentro de la UE pasan a ser prácticamente domésticos. Es el caldo de cultivo de las low-cost.',
    fx: G => { E.X.mod(G, { k: 'demand', scope: { region: 'EU' }, v: 1.08, days: 99999, label: 'Mercado único' }); E.X.competition(G, { region: 'EU' }, 1); } },
  { id: 'asia97', y: 1997, m: 6, d: 2, kicker: 'Crisis asiática', head: 'Se derrumban las monedas asiáticas',
    text: 'Tailandia, Indonesia y Corea entran en crisis. La demanda en Asia cae fuerte durante un año.',
    fx: G => { E.X.mod(G, { k: 'demand', scope: { region: 'AS' }, v: 0.82, days: 365, label: 'Crisis asiática' }); } },
  { id: 'sep11', y: 2001, m: 8, d: 11, kicker: 'Atentados', head: 'Ataques en Nueva York y Washington: EE.UU. cierra su espacio aéreo',
    text: 'Todos los vuelos hacia y desde Estados Unidos quedan suspendidos. La demanda mundial se desploma, los seguros se triplican y la seguridad aeroportuaria cambia para siempre.',
    fx: G => { E.X.mod(G, { k: 'closed', scope: { cc: 'US' }, days: 4, label: 'Espacio aéreo cerrado' }); E.X.mod(G, { k: 'demand', v: 0.78, days: 120, label: 'Miedo a volar' }); E.X.mod(G, { k: 'demand', v: 0.92, days: 420, label: 'Recuperación post 11-S' }); E.X.mod(G, { k: 'insurance', v: 3, days: 365, label: 'Seguros de guerra' }); G.econ.security = (G.econ.security || 0) + 3.5; } },
  { id: 'conc03', y: 2003, m: 9, d: 24, kicker: 'Fin del Concorde', head: 'El Concorde hace su último vuelo comercial',
    text: 'Airbus deja de dar soporte técnico. Los Concorde que aún vuelen quedan en tierra definitivamente: solo los museos los quieren.',
    fx: G => { E.X.mod(G, { k: 'grounded', scope: { type: 'CONC' }, days: 99999, label: 'Fin del soporte técnico' }); } },
  { id: 'sars03', y: 2003, m: 2, d: 15, kicker: 'Epidemia', head: 'El SARS paraliza los viajes a Asia',
    text: 'La OMS emite alertas para Hong Kong, China, Singapur, Taiwán y Toronto. La demanda asiática cae a la mitad durante meses.',
    fx: G => { E.X.mod(G, { k: 'demand', scope: { region: 'AS' }, v: 0.5, days: 110, label: 'SARS' }); E.X.mod(G, { k: 'demand', scope: { cc: 'CA' }, v: 0.8, days: 90, label: 'SARS' }); } },
  { id: 'crisis08', y: 2008, m: 8, d: 15, kicker: 'Crisis financiera', head: 'Quiebra Lehman Brothers: el mundo entra en recesión',
    text: 'Tras el récord del petróleo en julio, llega la crisis financiera. El crédito se encarece y los viajes de negocios caen.',
    fx: G => { E.X.mod(G, { k: 'demand', v: 0.88, days: 450, label: 'Gran Recesión' }); E.X.mod(G, { k: 'credit', v: 2.5, days: 500, label: 'Crisis de crédito' }); } },
  { id: 'ash10', y: 2010, m: 3, d: 15, kicker: 'Volcán', head: 'La ceniza del Eyjafjallajökull cierra los cielos de Europa',
    text: 'Una nube de ceniza volcánica obliga a cerrar casi todo el espacio aéreo del norte de Europa durante seis días.',
    fx: G => { E.X.mod(G, { k: 'closed', scope: { box: [-25, 42, 30, 72] }, days: 6, label: 'Ceniza volcánica' }); } },
  { id: 'ets12', y: 2012, m: 0, d: 1, kicker: 'Medio ambiente', head: 'Europa empieza a cobrar por las emisiones de CO₂',
    text: 'Los vuelos dentro y hacia Europa pagan derechos de emisión. El combustible sostenible (SAF) reduce el impacto.',
    fx: G => { G.econ.carbon = 0.035; } },
  { id: 'max19', y: 2019, m: 2, d: 13, kicker: 'Seguridad', head: 'El 737 MAX queda en tierra en todo el mundo',
    text: 'Tras dos accidentes, las autoridades suspenden el 737 MAX. La suspensión durará unos 20 meses.',
    fx: G => { E.X.mod(G, { k: 'grounded', scope: { types: ['B38M', 'B3XM'] }, days: 630, label: 'Suspensión del 737 MAX' }); } },
  { id: 'covid20', y: 2020, m: 2, d: 11, kicker: 'Pandemia', head: 'La OMS declara la pandemia de COVID-19',
    text: 'Cierres de fronteras en todo el mundo. La demanda cae más de un 85%. Habrá que estacionar aviones, renegociar leasings y decidir qué hacer con el personal.',
    fx: G => { E.X.mod(G, { k: 'demand', v: 0.12, days: 100, label: 'Confinamientos' }); E.X.mod(G, { k: 'demand', v: 0.4, days: 290, label: 'Pandemia' }); E.X.mod(G, { k: 'demand', v: 0.7, days: 650, label: 'Recuperación lenta' }); E.X.mod(G, { k: 'demand', v: 0.9, days: 1000, label: 'Recuperación' }); E.X.queue(G, 'furlough'); } },
  { id: 'ukr22', y: 2022, m: 1, d: 24, kicker: 'Guerra', head: 'Rusia invade Ucrania: se cierran espacios aéreos',
    text: 'Se cierra el espacio aéreo ucraniano y las sanciones excluyen a Rusia. El combustible se dispara.',
    fx: G => { E.X.mod(G, { k: 'closed', scope: { ccs: ['UA', 'RU'] }, days: 99999, label: 'Espacio aéreo cerrado' }); } }
];

/* ================== Crisis y oportunidades con decisiones ================== */
// Cada crisis: id, w (peso diario), cd (días de enfriamiento), cond(G), build(G) -> {title, text, icon, choices:[{t, d, fx(G)->texto}]}
E.CRISES = [
  { id: 'storm_hub', w: 0.010, cd: 50, cond: G => G.fleet.length >= 2,
    build: G => {
      const b = E.X.mainBase(G); const pax = Math.max(80, Math.round(E.X.paxDaily(G, b) * 0.35));
      return { icon: 'storm', title: 'Tormenta en ' + E.AP[b].city, kicker: 'Clima',
        text: `Una tormenta eléctrica cerró ${E.AP[b].city} (${b}) por seis horas. Hay ${E.U.n0(pax)} pasajeros varados en la terminal y las redes sociales empiezan a hervir.`,
        choices: [
          { t: 'Hotel y comidas para todos', d: `Costo ${E.U.money(pax * 140)} · servicio e imagen mejoran`, fx: G => { E.X.cash(G, -pax * 140, 'comp'); E.X.rep(G, 'service', 3); E.X.rep(G, 'image', 2); return 'Los pasajeros valoraron la atención. Buenas reseñas.'; } },
          { t: 'Vouchers de comida', d: `Costo ${E.U.money(pax * 25)} · leve impacto en servicio`, fx: G => { E.X.cash(G, -pax * 25, 'comp'); E.X.rep(G, 'service', -1); return 'Se entregaron vouchers. Algunos reclamos, nada grave.'; } },
          { t: 'Nada: es fuerza mayor', d: 'Sin costo · fuerte riesgo de reputación', fx: G => { E.X.rep(G, 'service', -4); E.X.rep(G, 'image', -4); if (E.U.chance(0.35)) { E.X.cash(G, -pax * 90, 'comp'); return 'Una asociación de consumidores te demandó y perdiste. Pagaste compensaciones.'; } return 'Llovieron críticas en redes y prensa.'; } }
        ] };
    } },
  { id: 'atc_strike', w: 0.006, cd: 90, cond: G => E.X.routeCountries(G).some(c => ['FR', 'ES', 'IT', 'PT', 'GR', 'BE', 'AR', 'BR'].includes(c)),
    build: G => {
      const cc = E.U.pick(E.X.routeCountries(G).filter(c => ['FR', 'ES', 'IT', 'PT', 'GR', 'BE', 'AR', 'BR'].includes(c)));
      const n = E.COUNTRIES[cc][0];
      return { icon: 'tower', title: 'Huelga de controladores en ' + n, kicker: 'Control de tránsito aéreo',
        text: `Los controladores aéreos de ${n} anuncian 72 horas de paro. El espacio aéreo operará con un 40% de capacidad.`,
        choices: [
          { t: 'Cancelar y reubicar pasajeros', d: 'Costo de reubicación · protege la puntualidad', fx: G => { E.X.mod(G, { k: 'closed', scope: { cc }, days: 3, label: 'Huelga ATC (vuelos cancelados)' }); E.X.cash(G, -E.X.scale(G) * 0.01, 'comp'); return 'Cancelaste los vuelos afectados con aviso previo. Los pasajeros lo entendieron.'; } },
          { t: 'Operar igual con demoras', d: 'Sin costo directo · demoras de 1-3 horas', fx: G => { E.X.mod(G, { k: 'delay', scope: { cc }, v: 110, days: 3, label: 'Huelga ATC' }); return 'Tus vuelos salen con demoras largas. La puntualidad va a sufrir.'; } }
        ] };
    } },
  { id: 'mech_type', w: 0.006, cd: 120, cond: G => G.fleet.filter(a => a.status !== 'delivery').length >= 3,
    build: G => {
      const ac = E.U.pick(G.fleet.filter(a => a.status !== 'delivery')); const t = E.AC[ac.type];
      const same = G.fleet.filter(a => a.type === ac.type && a.status !== 'delivery');
      return { icon: 'wrench', title: 'Fisura en un ' + t.short, kicker: 'Incidente técnico',
        text: `En una inspección de rutina del ${ac.reg} se detectó una fisura en un larguero. El fabricante no emitió alerta todavía. Tenés ${same.length} aviones del mismo tipo.`,
        choices: [
          { t: 'Inspeccionar toda la flota del tipo', d: `${same.length} aviones en tierra 2 días · ${E.U.money(same.length * 60000)}`, fx: G => { same.forEach(a => E.X.ground(G, a, 2, 'Inspección preventiva')); E.X.cash(G, -same.length * 60000, 'maint'); E.X.rep(G, 'safety', 4); return 'Inspección completa. La prensa destacó tu cultura de seguridad.'; } },
          { t: 'Reparar solo el avión afectado', d: '1 avión en tierra 5 días', fx: G => { E.X.ground(G, ac, 5, 'Reparación estructural'); E.X.cash(G, -E.AC[ac.type].price * 1e6 * 0.004 * G.econ.cpi, 'maint'); E.X.mod(G, { k: 'incident', scope: { type: ac.type }, v: 1.6, days: 90, label: 'Riesgo estructural' }); return 'Se reparó el avión. Queda un riesgo latente en el resto de la flota.'; } },
          { t: 'Seguir operando y monitorear', d: 'Sin costo · riesgo elevado', fx: G => { E.X.mod(G, { k: 'incident', scope: { type: ac.type }, v: 3.5, days: 120, label: 'Fisura sin reparar' }); E.X.rep(G, 'safety', -2); return 'Seguís volando. Ojalá no pase nada…'; } }
        ] };
    } },
  { id: 'bags_lost', w: 0.005, cd: 150, cond: G => E.X.paxDaily(G) > 800,
    build: G => {
      const b = E.X.mainBase(G); const bags = Math.round(E.X.paxDaily(G, b) * 0.6 + 300);
      return { icon: 'bag', title: 'Colapso del sistema de equipajes', kicker: E.AP[b].city,
        text: `La cinta de clasificación de ${b} falló en plena hora pico: ${E.U.n0(bags)} valijas no llegaron a destino.`,
        choices: [
          { t: 'Compensar generosamente', d: `${E.U.money(bags * 180)} · equipaje e imagen protegidos`, fx: G => { E.X.cash(G, -bags * 180, 'comp'); E.X.rep(G, 'bags', -2); E.X.rep(G, 'image', 1); return 'Entregaste las valijas a domicilio con compensación. Respuesta ejemplar.'; } },
          { t: 'Compensación mínima legal', d: `${E.U.money(bags * 60)}`, fx: G => { E.X.cash(G, -bags * 60, 'comp'); E.X.rep(G, 'bags', -6); E.X.rep(G, 'service', -2); return 'Cumpliste con lo mínimo. Muchos pasajeros quedaron furiosos.'; } },
          { t: 'Invertir en un sistema nuevo', d: `${E.U.money(E.X.scale(G) * 0.5 + bags * 60)} · menos pérdidas para siempre`, fx: G => { E.X.cash(G, -(E.X.scale(G) * 0.5 + bags * 60), 'other'); G.flags.bagSystem = true; E.X.rep(G, 'bags', 2); return 'Nuevo sistema RFID instalado: la tasa de equipajes perdidos bajará un 40%.'; } }
        ] };
    } },
  { id: 'union', w: 0, cd: 60, cond: G => false, // se dispara por moral baja (ver sim/staff.js)
    build: (G, cat) => {
      const C = E.STAFF_CATS[cat];
      return { icon: 'users', title: `El sindicato de ${C.pl} amenaza con huelga`, kicker: 'Relaciones laborales',
        text: `La moral de ${C.pl} está por el piso (${Math.round(G.staff[cat].morale)}%). El gremio exige una suba salarial del 12% y mejores condiciones, o paralizará la operación.`,
        choices: [
          { t: G.econ.cpi / G.staff[cat].cpiPaid > 1.05 ? 'Indexar por inflación y sumar 8%' : 'Aceptar el 12%', d: 'Salarios reales suben · moral +25', fx: G => { G.staff[cat].salary *= G.econ.cpi / G.staff[cat].cpiPaid > 1.05 ? 1.08 : 1.12; G.staff[cat].cpiPaid = G.econ.cpi; E.X.morale(G, cat, 25); return 'Acuerdo firmado. Paz social por un buen tiempo.'; } },
          { t: 'Negociar un 6%', d: 'Probabilidad de acuerdo según tu reputación', fx: G => { const p = 0.35 + G.rep.overall / 200; if (E.U.chance(p)) { G.staff[cat].salary *= 1.06; E.X.morale(G, cat, 14); return 'El gremio aceptó el 6% tras una larga negociación.'; } E.X.strike(G, cat, E.U.randi(2, 4)); E.X.morale(G, cat, 5); return 'No hubo acuerdo: comenzó una huelga.'; } },
          { t: 'Rechazar', d: 'Huelga casi segura de 4 a 8 días', fx: G => { E.X.strike(G, cat, E.U.randi(4, 8)); E.X.morale(G, cat, -5); E.X.rep(G, 'image', -3); return 'Huelga total. Los vuelos se cancelan en masa.'; } }
        ] };
    } },
  { id: 'viral', w: 0.006, cd: 120, cond: G => E.X.paxDaily(G) > 300,
    build: G => ({ icon: 'phone', title: 'Video viral en un vuelo tuyo', kicker: 'Redes sociales',
      text: 'Un pasajero filmó una discusión con la tripulación por el equipaje de mano. El video suma 8 millones de reproducciones.',
      choices: [
        { t: 'Disculpa pública y compensación', d: E.U.money(Math.max(15000, E.X.scale(G) * 0.004)) + ' · la imagen se recupera', fx: G => { E.X.cash(G, -Math.max(15000, E.X.scale(G) * 0.004), 'comp'); E.X.rep(G, 'image', -1); return 'Tu disculpa fue bien recibida.'; } },
        { t: 'Campaña de relaciones públicas', d: E.U.money(Math.max(60000, E.X.scale(G) * 0.03)) + ' · imagen +', fx: G => { E.X.cash(G, -Math.max(60000, E.X.scale(G) * 0.03), 'mkt'); E.X.rep(G, 'image', 2); return 'Convertiste la crisis en oportunidad con una campaña simpática.'; } },
        { t: 'No responder', d: 'Gratis · imagen −6', fx: G => { E.X.rep(G, 'image', -6); return 'El silencio fue interpretado como soberbia.'; } }
      ] }) },
  { id: 'lawsuit', w: 0.004, cd: 200, cond: G => G.rep.punct < 62 && E.X.paxDaily(G) > 500,
    build: G => { const amt = Math.max(100000, E.X.scale(G) * 0.05);
      return { icon: 'gavel', title: 'Demanda colectiva por demoras', kicker: 'Legal',
        text: `Una asociación de consumidores te demanda por la impuntualidad crónica (OTP ${E.U.pct(G.rep.otp)}). Reclaman ${E.U.money(amt)}.`,
        choices: [
          { t: 'Llegar a un acuerdo', d: E.U.money(amt * 0.5), fx: G => { E.X.cash(G, -amt * 0.5, 'comp'); return 'Acuerdo extrajudicial cerrado.'; } },
          { t: 'Ir a juicio', d: '55% de ganar · si perdés pagás todo y más', fx: G => { if (E.U.chance(0.55)) { E.X.cash(G, -amt * 0.08, 'other'); return 'Ganaste el juicio. Solo pagaste costas.'; } E.X.cash(G, -amt * 1.3, 'comp'); E.X.rep(G, 'image', -3); return 'Perdiste el juicio y pagaste con intereses.'; } }
        ] };
    } },
  { id: 'catering', w: 0.004, cd: 300, cond: G => E.X.paxDaily(G) > 400,
    build: G => ({ icon: 'cup', title: 'Quiebra tu proveedor de catering', kicker: 'Proveedores',
      text: 'La empresa que prepara tus comidas a bordo cerró sus cocinas sin aviso. Mañana salen vuelos sin comida.',
      choices: [
        { t: 'Contratar un proveedor premium de urgencia', d: 'Catering +30% por 3 meses', fx: G => { E.X.mod(G, { k: 'catering', v: 1.3, days: 90, label: 'Catering de emergencia' }); return 'El nuevo proveedor es caro pero excelente.'; } },
        { t: 'Servicio reducido 3 semanas', d: 'Servicio −', fx: G => { E.X.mod(G, { k: 'svcpen', v: 0.12, days: 21, label: 'Servicio reducido' }); return 'Durante tres semanas solo agua y galletitas.'; } },
        { t: 'Comprar la empresa', d: E.U.money(E.X.scale(G) * 0.3) + ' · catering −15% para siempre', fx: G => { E.X.cash(G, -E.X.scale(G) * 0.3, 'other'); E.X.mod(G, { k: 'catering', v: 0.85, days: 99999, label: 'Catering propio' }); return 'Ahora tenés tu propia cocina de catering.'; } }
      ] }) },
  { id: 'oem_offer', w: 0.007, cd: 150, cond: G => G.fleet.length >= 4,
    build: G => {
      const yr = E.U.year(G.t); const pool = E.AIRCRAFT.filter(t => t.y <= yr && (!t.e || t.e >= yr) && !t.freighter && t.cat !== 'ss');
      const t = E.U.pick(pool); const disc = E.U.randi(12, 22);
      return { icon: 'plane', title: `${t.mk} te ofrece un descuento`, kicker: 'Oportunidad',
        text: `El fabricante necesita cerrar ventas del ${t.m}: ofrece ${disc}% de descuento en compras nuevas durante los próximos 45 días.`,
        choices: [
          { t: 'Me interesa', d: 'El descuento queda activo en el catálogo', fx: G => { G.offers.push({ type: t.id, disc: disc / 100, until: G.t + 45 * 24 }); return `Descuento del ${disc}% activo en ${t.m} por 45 días.`; } },
          { t: 'No, gracias', d: '', fx: G => 'Oferta rechazada.' }
        ] };
    } },
  { id: 'comp_bankrupt', w: 0.004, cd: 200, cond: G => E.X.myCompetitors(G).length > 0,
    build: G => { const c = E.U.pick(E.X.myCompetitors(G));
      return { icon: 'chart', title: `${c} se declara en quiebra`, kicker: 'Competencia',
        text: `Tu competidor ${c} dejó de volar. Sus pasajeros buscan alternativas y sus activos salen a remate.`,
        choices: [
          { t: 'Contratar a sus pilotos', d: '+8% pilotos a sueldo de mercado, sin costo de formación', fx: G => { E.X.removeCompetitor(G, c); const n = Math.max(4, Math.round(G.staff.pilots.n * 0.08)); G.staff.pilots.n += n; return `Se sumaron ${n} pilotos con experiencia.`; } },
          { t: 'Comprar aviones del remate', d: 'Aparecen aviones baratos en el mercado de usados', fx: G => { E.X.removeCompetitor(G, c); E.X.fireSale(G, c); return 'Hay nuevas ofertas en el mercado de segunda mano (−35%).'; } },
          { t: 'Lanzar campaña para captar sus clientes', d: E.U.money(E.X.scale(G) * 0.08) + ' · imagen y notoriedad +', fx: G => { E.X.removeCompetitor(G, c); E.X.cash(G, -E.X.scale(G) * 0.08, 'mkt'); E.X.rep(G, 'image', 2); E.X.awareness(G, null, 6); return 'Captaste a muchos de sus pasajeros frecuentes.'; } }
        ] };
    } },
  { id: 'subsidy', w: 0.004, cd: 360, cond: G => E.X.smallDomestic(G) != null,
    build: G => { const ap = E.X.smallDomestic(G); const amt = Math.round(E.X.scale(G) * 0.012 + 60000);
      return { icon: 'flag', title: 'Subsidio para ruta esencial', kicker: 'Gobierno',
        text: `El gobierno ofrece ${E.U.money(amt)} por mes durante 2 años si operás al menos 7 vuelos semanales a ${E.AP[ap].city} (${ap}).`,
        choices: [
          { t: 'Aceptar el contrato', d: 'Debés abrir la ruta en 60 días', fx: G => { G.subsidies.push({ iata: ap, amt, until: G.t + 730 * 24, start: G.t + 60 * 24 }); return `Contrato firmado. Abrí una ruta a ${ap} con 7+ frecuencias semanales.`; } },
          { t: 'Rechazar', d: '', fx: G => 'Rechazaste el subsidio.' }
        ] };
    } },
  { id: 'price_war', w: 0.008, cd: 90, cond: G => E.X.contestedRoute(G) != null,
    build: G => { const r = E.X.contestedRoute(G); const m = E.X.market(G, r); const c = m.comps[0];
      return { icon: 'tag', title: 'Guerra de precios en ' + r.a + '–' + r.b, kicker: 'Competencia',
        text: `${c.name} bajó un 30% sus tarifas en ${E.AP[r.a].city}–${E.AP[r.b].city} para quitarte pasajeros.`,
        choices: [
          { t: 'Igualar precios (−25%)', d: 'Mantenés la cuota, perdés margen', fx: G => { c.price = 0.72; c.priceUntil = G.t + 75 * 24; ['y', 'p', 'j', 'f'].forEach(k => r.price[k] = Math.round(r.price[k] * 0.75)); return 'Bajaste tus tarifas. La guerra continúa.'; } },
          { t: 'Bajar parcialmente (−12%)', d: 'Equilibrio', fx: G => { c.price = 0.72; c.priceUntil = G.t + 75 * 24; ['y', 'p', 'j', 'f'].forEach(k => r.price[k] = Math.round(r.price[k] * 0.88)); return 'Ajustaste tarifas de forma moderada.'; } },
          { t: 'No reaccionar', d: 'Competí por servicio y puntualidad', fx: G => { c.price = 0.7; c.priceUntil = G.t + 75 * 24; return 'Mantenés precios. Veremos si tus pasajeros son fieles.'; } }
        ] };
    } },
  { id: 'audit', w: 0.004, cd: 200, cond: G => G.fleet.length >= 3,
    build: G => { const bad = G.fleet.filter(a => a.status !== 'delivery' && (a.cond < 55 || E.X.overdue(G, a)));
      if (bad.length === 0) return { icon: 'shield', title: 'Auditoría de la autoridad aeronáutica', kicker: 'Regulador', text: 'Los inspectores revisaron registros de mantenimiento, entrenamiento y operaciones. Todo en regla.', choices: [{ t: 'Excelente', d: 'Seguridad +3', fx: G => { E.X.rep(G, 'safety', 3); return 'Certificación renovada sin observaciones.'; } }] };
      const fine = Math.round(Math.min(250000 + bad.length * 150000, E.X.scale(G) * 0.05 + bad.length * 80000));
      return { icon: 'shield', title: 'La auditoría encontró irregularidades', kicker: 'Regulador',
        text: `Los inspectores detectaron ${bad.length} aviones con mantenimiento vencido o en mal estado. Proponen una multa de ${E.U.money(fine)} y dejarlos en tierra.`,
        choices: [
          { t: 'Pagar y corregir', d: `${E.U.money(fine)} · ${bad.length} aviones 5 días en tierra`, fx: G => { E.X.cash(G, -fine, 'other'); bad.forEach(a => { E.X.ground(G, a, 5, 'Orden del regulador'); a.cond = Math.max(a.cond, 70); }); E.X.rep(G, 'safety', -2); return 'Multa pagada y problemas corregidos.'; } },
          { t: 'Apelar', d: '40% de éxito; si fallás, multa doble', fx: G => { if (E.U.chance(0.4)) return 'La apelación prosperó.'; E.X.cash(G, -fine * 2, 'other'); bad.forEach(a => E.X.ground(G, a, 8, 'Orden del regulador')); E.X.rep(G, 'safety', -6); E.X.rep(G, 'image', -3); return 'Perdiste la apelación: multa doble y prensa negativa.'; } }
        ] };
    } },
  { id: 'ground_strike', w: 0.004, cd: 120, cond: G => !G.staff.ground.out && Object.keys(G.bases).length > 0,
    build: G => { const b = E.X.mainBase(G);
      return { icon: 'users', title: 'Paro de personal de rampa en ' + b, kicker: 'Aeropuerto',
        text: 'Los maleteros y agentes de rampa del aeropuerto paran 48 horas en reclamo al operador aeroportuario.',
        choices: [
          { t: 'Contratar handling externo', d: E.U.money(E.X.scale(G) * 0.015) + ' · operación casi normal', fx: G => { E.X.cash(G, -E.X.scale(G) * 0.015, 'airport'); E.X.mod(G, { k: 'delay', scope: { iata: b }, v: 20, days: 2, label: 'Paro de rampa' }); return 'Contrataste una empresa de handling temporal.'; } },
          { t: 'Aguantar', d: 'Demoras de 2-4 horas', fx: G => { E.X.mod(G, { k: 'delay', scope: { iata: b }, v: 150, days: 2, label: 'Paro de rampa' }); E.X.rep(G, 'bags', -3); return 'Dos días de caos en la terminal.'; } }
        ] };
    } },
  { id: 'volcano', w: 0.002, cd: 400, cond: G => true,
    build: G => { const v = E.U.pick([{ n: 'Calbuco', lat: -41.3, lon: -72.6 }, { n: 'Etna', lat: 37.7, lon: 15.0 }, { n: 'Merapi', lat: -7.5, lon: 110.4 }, { n: 'Popocatépetl', lat: 19.0, lon: -98.6 }, { n: 'Hekla', lat: 63.98, lon: -19.7 }, { n: 'Sakurajima', lat: 31.6, lon: 130.7 }, { n: 'Puyehue', lat: -40.6, lon: -72.1 }]);
      return { icon: 'volcano', title: 'Erupción del ' + v.n, kicker: 'Ceniza volcánica',
        text: `La nube de ceniza obliga a cerrar los aeropuertos en un radio de 700 km durante varios días.`,
        choices: [{ t: 'Entendido', d: 'Los vuelos afectados se cancelan', fx: G => { E.X.mod(G, { k: 'closed', scope: { near: [v.lat, v.lon, 700] }, days: E.U.randi(2, 5), label: 'Ceniza del ' + v.n }); return 'Aeropuertos cerrados por ceniza.'; } }] };
    } },
  { id: 'alliance', w: 0.004, cd: 365, cond: G => G.research.done.alliance && !G.mkt.alliance && G.rep.overall > 55,
    build: G => { const al = E.U.pick(E.ALLIANCES);
      return { icon: 'globe', title: `${al.n} te invita a sumarte`, kicker: 'Alianzas',
        text: `${al.n} ofrece incorporarte: códigos compartidos, salas VIP comunes y programa de millas integrado. Cuota anual ${E.U.money(al.fee)}.`,
        choices: [
          { t: 'Unirse a ' + al.n, d: 'Demanda internacional +8%, ejecutiva +6%', fx: G => { G.mkt.alliance = al.id; return `Ya sos miembro de ${al.n}.`; } },
          { t: 'Seguir independiente', d: '', fx: G => 'Decidiste seguir sola.' }
        ] };
    } },
  { id: 'celebrity', w: 0.004, cd: 180, cond: G => G.fleet.some(a => a.cabin && a.cabin.j > 0),
    build: G => { const good = E.X.premiumScore(G) > 0.62;
      return good ? { icon: 'star', title: 'Una estrella elogia tu ejecutiva', kicker: 'Prensa', text: 'Una famosa actriz publicó fotos de su cena a bordo: "la mejor ejecutiva que probé". Explotan las reservas premium.', choices: [{ t: '¡Genial!', d: 'Imagen +4', fx: G => { E.X.rep(G, 'image', 4); E.X.mod(G, { k: 'demandJ', v: 1.15, days: 60, label: 'Efecto celebridad' }); return 'Las ventas de ejecutiva suben.'; } }] }
        : { icon: 'star', title: 'Un influencer destroza tu ejecutiva', kicker: 'Prensa', text: 'Un famoso crítico de viajes calificó tu clase ejecutiva como "una económica con mantel". Las reservas premium sufren.', choices: [{ t: 'Ouch', d: 'Imagen −3', fx: G => { E.X.rep(G, 'image', -3); E.X.mod(G, { k: 'demandJ', v: 0.88, days: 60, label: 'Mala crítica' }); return 'Quizás sea hora de mejorar el producto premium.'; } }] };
    } },
  { id: 'fuel_offer', w: 0.005, cd: 200, cond: G => G.fleet.length >= 3,
    build: G => ({ icon: 'fuel', title: 'Contrato de combustible a precio fijo', kicker: 'Proveedores',
      text: `Una petrolera ofrece fijar el 40% de tu consumo por 6 meses a ${E.U.n2(G.econ.fuel * 0.96 * G.econ.cpi)} $/kg (hoy: ${E.U.n2(G.econ.fuel * G.econ.cpi)}).`,
      choices: [
        { t: 'Firmar', d: 'Protege contra subas', fx: G => { G.fin.hedges.push({ pct: 0.4, price: G.econ.fuel * 0.96, until: G.t + 182 * 24 }); return 'Cobertura firmada.'; } },
        { t: 'Rechazar', d: '', fx: G => 'Seguís comprando al precio de mercado.' }
      ] }) },
  { id: 'merger', w: 0.002, cd: 500, cond: G => G.cash > 120e6 * G.econ.cpi && G.fleet.length >= 8,
    build: G => { const offer = E.X.mergerOffer(G); if (!offer) return null;
      return { icon: 'building', title: 'Aerolínea regional busca comprador', kicker: 'Fusiones y adquisiciones',
        text: `${offer.name}, con base en ${E.AP[offer.base].city}, está al borde de la quiebra. Ofrece ${offer.ac.length} aviones (${offer.desc}) y su base por ${E.U.money(offer.price)}.`,
        choices: [
          { t: 'Comprar la aerolínea', d: 'Obtenés aviones y una nueva base', fx: G => E.X.doMerger(G, offer) },
          { t: 'Pasar', d: '', fx: G => 'Dejaste pasar la oportunidad.' }
        ] };
    } },
  { id: 'overbook', w: 0.006, cd: 150, cond: G => G.svc.overbook > 0.03,
    build: G => ({ icon: 'user', title: 'Pasajero bajado por sobreventa', kicker: 'Redes sociales',
      text: 'Un pasajero se negó a bajar de un vuelo sobrevendido y la policía lo retiró a la fuerza. Las imágenes dan la vuelta al mundo.',
      choices: [
        { t: 'Eliminar la sobreventa', d: 'Sobreventa a 0% · imagen −2', fx: G => { G.svc.overbook = 0; E.X.rep(G, 'image', -2); return 'Prometiste no volver a sobrevender.'; } },
        { t: 'Compensar y mantener la política', d: E.U.money(Math.max(40000, E.X.scale(G) * 0.01)) + ' · imagen −5', fx: G => { E.X.cash(G, -Math.max(40000, E.X.scale(G) * 0.01), 'comp'); E.X.rep(G, 'image', -5); return 'La política sigue. La imagen sufre.'; } }
      ] }) },
  { id: 'fatigue', w: 0, cd: 90, cond: G => false, // disparado por fatiga alta
    build: G => ({ icon: 'moon', title: 'Pilotos denuncian fatiga extrema', kicker: 'Seguridad operacional',
      text: `La fatiga de los pilotos llegó a ${Math.round(G.staff.pilots.fatigue)}%. El gremio advierte que es cuestión de tiempo antes de un incidente grave.`,
      choices: [
        { t: 'Contratación urgente (+12%)', d: 'Costo de reclutamiento y formación', fx: G => { E.X.hire(G, 'pilots', Math.ceil(G.staff.pilots.n * 0.12)); return 'Pilotos nuevos en formación: en unas semanas baja la carga.'; } },
        { t: 'Pagar horas extra', d: 'Salario +5%, fatiga igual', fx: G => { G.staff.pilots.salary *= 1.05; E.X.morale(G, 'pilots', 8); return 'Pagás más, pero el problema de fondo sigue.'; } },
        { t: 'Ignorar', d: 'Riesgo de incidentes ↑', fx: G => { E.X.morale(G, 'pilots', -10); E.X.mod(G, { k: 'incident', v: 1.5, days: 60, label: 'Fatiga ignorada' }); return 'Seguís igual. La seguridad está en juego.'; } }
      ] }) },
  { id: 'tourism', w: 0.006, cd: 120, cond: G => G.routes.length > 0,
    build: G => { const r = E.U.pick(G.routes); const ap = E.AP[r.b];
      return { icon: 'sun', title: 'Boom turístico en ' + ap.city, kicker: 'Mercado',
        text: `Una serie de televisión filmada en ${ap.city} disparó el interés turístico. La demanda hacia ${r.b} sube un 25% por seis meses.`,
        choices: [{ t: 'Aprovecharlo', d: 'Considerá subir frecuencias o precios', fx: G => { E.X.mod(G, { k: 'demand', scope: { iata: r.b }, v: 1.25, days: 180, label: 'Boom turístico' }); return 'Más pasajeros hacia ' + ap.city + '.'; } }] };
    } },
  { id: 'tax', w: 0.004, cd: 300, cond: G => G.routes.length > 2,
    build: G => { const cc = E.U.pick(E.X.routeCountries(G)); const n = E.COUNTRIES[cc][0];
      return { icon: 'building', title: n + ' sube las tasas aeroportuarias', kicker: 'Gobierno',
        text: `El gobierno de ${n} aumentó un 25% las tasas de aterrizaje y por pasajero en todos sus aeropuertos.`,
        choices: [{ t: 'Trasladar a las tarifas', d: 'Tus precios en esas rutas suben 4%', fx: G => { E.X.mod(G, { k: 'fees', scope: { cc }, v: 1.25, days: 99999, label: 'Tasas ' + n }); G.routes.forEach(r => { if (E.AP[r.a].cc === cc || E.AP[r.b].cc === cc) ['y', 'p', 'j', 'f'].forEach(k => r.price[k] = Math.round(r.price[k] * 1.04)); }); return 'Subiste levemente las tarifas.'; } },
          { t: 'Absorber el costo', d: 'Mantener precios', fx: G => { E.X.mod(G, { k: 'fees', scope: { cc }, v: 1.25, days: 99999, label: 'Tasas ' + n }); return 'Absorbés el aumento.'; } }] };
    } },
  { id: 'sponsor', w: 0.004, cd: 365, cond: G => G.fleet.length >= 6,
    build: G => { const cost = Math.round(E.X.scale(G) * 0.15 + 150000);
      return { icon: 'trophy', title: 'Propuesta de patrocinio deportivo', kicker: 'Marketing',
        text: `Un club de fútbol de primera división ofrece tu logo en la camiseta por un año a cambio de ${E.U.money(cost)}.`,
        choices: [
          { t: 'Firmar el patrocinio', d: 'Notoriedad e imagen +', fx: G => { E.X.cash(G, -cost, 'mkt'); E.X.awareness(G, G.airline.region, 12); E.X.rep(G, 'image', 3); return 'Tu marca aparece en todos los partidos.'; } },
          { t: 'Rechazar', d: '', fx: G => 'Preferiste otros canales.' }
        ] };
    } },
  { id: 'poach', w: 0.004, cd: 200, cond: G => G.staff.pilots.salary < 0.95 && G.staff.pilots.n > 30,
    build: G => { const n = Math.round(G.staff.pilots.n * 0.07);
      return { icon: 'users', title: 'Un competidor quiere llevarse a tus pilotos', kicker: 'Recursos humanos',
        text: `Una aerolínea en expansión ofrece 20% más de sueldo. ${n} de tus pilotos tienen ofertas sobre la mesa.`,
        choices: [
          { t: 'Igualar: subir salarios 8%', d: 'Retenés a todos', fx: G => { G.staff.pilots.salary *= 1.08; E.X.morale(G, 'pilots', 8); return 'Retuviste a tu plantel.'; } },
          { t: 'Dejarlos ir', d: `Perdés ${n} pilotos`, fx: G => { G.staff.pilots.n = Math.max(0, G.staff.pilots.n - n); E.X.morale(G, 'pilots', -4); return `${n} pilotos renunciaron.`; } }
        ] };
    } },
  { id: 'ad_engine', w: 0.004, cd: 250, cond: G => G.fleet.length >= 4,
    build: G => { const types = [...new Set(G.fleet.map(a => a.type))]; const ty = E.U.pick(types); const list = G.fleet.filter(a => a.type === ty && a.status !== 'delivery'); const c = list.length * E.AC[ty].engines * 45000;
      return { icon: 'wrench', title: 'Directiva de aeronavegabilidad', kicker: 'Fabricante',
        text: `El fabricante del motor del ${E.AC[ty].short} emitió una directiva obligatoria: inspección boroscópica de todos los motores en 30 días.`,
        choices: [
          { t: 'Cumplir de inmediato', d: `${E.U.money(c)} · 1 día de inspección por avión`, fx: G => { E.X.cash(G, -c, 'maint'); list.forEach(a => { E.X.ground(G, a, 1, 'Directiva AD'); a.eng = a.eng.map(e => Math.min(100, e + 8)); }); E.X.rep(G, 'safety', 1); return 'Inspecciones completadas.'; } },
          { t: 'Escalonar en 30 días', d: `${E.U.money(c)} · sin impacto operativo`, fx: G => { E.X.cash(G, -c, 'maint'); return 'Las inspecciones se hacen en las paradas nocturnas.'; } }
        ] };
    } },
  { id: 'freeze', w: 0.012, cd: 160, cond: G => G.econ.infl > 0.03,
    build: G => ({ icon: 'flag', title: 'El gobierno congela las tarifas', kicker: 'Economía',
      text: 'Para frenar la inflación, el Ministerio de Economía prohíbe aumentar los precios de los pasajes durante 60 días. Los costos, en cambio, siguen subiendo.',
      choices: [
        { t: 'Acatar el congelamiento', d: 'Tarifas fijas 60 días', fx: G => { E.X.mod(G, { k: 'pricefreeze', v: 1, days: 60, label: 'Congelamiento de tarifas' }); return 'Las tarifas quedan congeladas por 60 días.'; } },
        { t: 'Subir antes de que entre en vigor (+15%)', d: 'Imagen −4 · después, congelamiento', fx: G => { G.routes.forEach(r => ['y', 'p', 'j', 'f'].forEach(k => r.price[k] = Math.round(r.price[k] * 1.15))); E.X.rep(G, 'image', -4); E.X.mod(G, { k: 'pricefreeze', v: 1, days: 60, label: 'Congelamiento de tarifas' }); return 'Remarcaste a último momento. La prensa no te perdona.'; } }
      ] }) },
  { id: 'furlough', w: 0, cd: 9999, cond: G => false,
    build: G => ({ icon: 'users', title: 'Pandemia: ¿qué hacemos con el personal?', kicker: 'Recursos humanos',
      text: 'Con la flota casi parada, la nómina se come la caja. El gobierno ofrece un programa de suspensiones con subsidio parcial.',
      choices: [
        { t: 'Suspensiones con subsidio (60%)', d: 'Nómina −50% por 9 meses · moral −15', fx: G => { E.X.mod(G, { k: 'payroll', v: 0.5, days: 270, label: 'Suspensiones' }); E.X.morale(G, 'all', -15); return 'Personal suspendido con subsidio.'; } },
        { t: 'Despidos del 25%', d: 'Indemnizaciones · moral −30 · imagen −', fx: G => { E.STAFF_KEYS.forEach(k => { const n = Math.round(G.staff[k].n * 0.25); E.X.cash(G, -n * E.X.salary(G, k) / 4, 'staff'); G.staff[k].n -= n; }); E.X.morale(G, 'all', -30); E.X.rep(G, 'image', -4); return 'Despidos masivos. Va a costar volver a crecer.'; } },
        { t: 'Mantener a todos', d: 'Caro, pero moral +20 e imagen +', fx: G => { E.X.morale(G, 'all', 20); E.X.rep(G, 'image', 3); return 'Mantuviste a tu gente. Te lo van a agradecer.'; } }
      ] }) }
];
E.ALLIANCES = [
  { id: 'polaris', n: 'Alianza Polaris', fee: 3e6, c: '#c9a227' },
  { id: 'meridian', n: 'Meridian Group', fee: 2.5e6, c: '#6aa5d8' },
  { id: 'horizonte', n: 'Horizonte Alliance', fee: 2e6, c: '#b56a8a' }
];

/* ================== Emergencias en vuelo (cabina) ================== */
// steps: {t: texto} o {q: pregunta, o:[{t, v (0-1 calidad), a (acción: divert|return|continue)}]}
E.EMERG = [
  { id: 'engfire', n: 'Fuego en motor', msg: e => `ENG ${e} FIRE`, lvl: 'w', w: (ac, t) => 0.6 + (100 - Math.min(...ac.eng)) / 30, eng: true,
    steps: e => [
      { t: 'Autothrottle — DESCONECTAR' }, { t: `Palanca de empuje ${e} — RALENTÍ` }, { t: `Interruptor de combustible ${e} — CORTE` },
      { t: `Manija de fuego ${e} — TIRAR Y GIRAR` }, { t: 'Botella de extinción — DESCARGAR' },
      { q: 'Declarar la emergencia al ATC', o: [{ t: 'MAYDAY MAYDAY MAYDAY', v: 1 }, { t: 'PAN-PAN', v: 0.5 }, { t: 'No declarar', v: 0 }] },
      { q: '¿Dónde aterrizamos?', o: [{ t: 'Aeropuerto adecuado más cercano', v: 1, a: 'divert' }, { t: 'Continuar a destino', v: 0, a: 'continue' }] }
    ], sev: 0.9 },
  { id: 'engfail', n: 'Falla de motor', msg: e => `ENG ${e} FAIL`, lvl: 'w', w: (ac, t) => 0.8 + (100 - Math.min(...ac.eng)) / 25, eng: true,
    steps: (e, ac) => [
      { t: 'Mantener control — PIE AL TIMÓN' }, { t: 'Autothrottle — DESCONECTAR' }, { t: `Palanca de empuje ${e} — RALENTÍ` },
      { q: '¿Intentar reencendido?', o: [{ t: 'Sí, dentro de la envolvente', v: 0.8 }, { t: 'No, asegurar el motor', v: 0.9 }] },
      { t: `Interruptor de combustible ${e} — CORTE` }, { t: 'Descenso a nivel de un motor — INICIAR' },
      { q: '¿Plan de vuelo?', o: E.AC[ac.type].engines > 2 ? [{ t: 'Continuar a destino (cuatrimotor)', v: 0.85, a: 'continue' }, { t: 'Desviar al más cercano', v: 0.9, a: 'divert' }] : [{ t: 'Desviar al más cercano', v: 1, a: 'divert' }, { t: 'Continuar a destino', v: 0.05, a: 'continue' }] }
    ], sev: 0.6 },
  { id: 'depress', n: 'Despresurización', msg: () => 'CABIN ALTITUDE', lvl: 'w', w: (ac) => 0.5 + (100 - ac.sys.press) / 25,
    steps: () => [
      { t: 'Máscaras de oxígeno — PUESTAS 100%' }, { t: 'Comunicación de tripulación — ESTABLECIDA' }, { t: 'Descenso de emergencia — INICIAR' },
      { t: 'Transpondedor — 7700' }, { t: 'Máscaras de pasajeros — DESPLEGAR' }, { t: 'Nivelar a FL100' },
      { q: '¿Plan de vuelo?', o: [{ t: 'Desviar al más cercano', v: 1, a: 'divert' }, { t: 'Continuar a FL100 a destino', v: 0.3, a: 'continue' }] }
    ], sev: 0.7 },
  { id: 'hyd', n: 'Falla hidráulica', msg: () => 'HYD SYS B LO PRESS', lvl: 'c', w: (ac) => 0.5 + (100 - ac.sys.hyd) / 20,
    steps: () => [
      { t: 'Bombas del sistema B — APAGAR' }, { t: 'Checklist de aterrizaje degradado — LEER' }, { t: 'Calcular distancia de aterrizaje (+45%)' },
      { q: '¿Dónde aterrizamos?', o: [{ t: 'Aeropuerto con la pista más larga cercana', v: 1, a: 'divert' }, { t: 'Destino actual', v: 0.55, a: 'continue' }] },
      { t: 'Tren de aterrizaje — EXTENSIÓN ALTERNATIVA' }, { t: 'Solicitar servicios de emergencia en pista' }
    ], sev: 0.4 },
  { id: 'bird', n: 'Impacto de aves', msg: () => 'ENG 1 VIBRATION', lvl: 'c', w: () => 1.2, climb: true,
    steps: () => [
      { t: 'Parámetros de motor — VERIFICAR' }, { t: 'Motor 1 — REDUCIR EMPUJE' }, { t: 'Informar a ATC — impacto de aves' },
      { q: '¿Plan de vuelo?', o: [{ t: 'Regresar al aeropuerto de origen', v: 1, a: 'return' }, { t: 'Continuar a destino', v: 0.25, a: 'continue' }] }
    ], sev: 0.35 },
  { id: 'smoke', n: 'Humo en bodega', msg: () => 'SMOKE CARGO FWD', lvl: 'w', w: (ac) => 0.35 + (100 - ac.sys.elec) / 40,
    steps: () => [
      { t: 'Máscaras y gafas antihumo — PUESTAS' }, { t: 'Fuego de bodega — ARMAR' }, { t: 'Extintor de bodega — DESCARGAR' },
      { t: 'Ventiladores de recirculación — APAGAR' }, { q: 'Declarar la emergencia', o: [{ t: 'MAYDAY', v: 1 }, { t: 'PAN-PAN', v: 0.4 }] },
      { q: '¿Dónde aterrizamos?', o: [{ t: 'Desviar INMEDIATAMENTE al más cercano', v: 1, a: 'divert' }, { t: 'Continuar a destino', v: 0, a: 'continue' }] }
    ], sev: 1.0 },
  { id: 'medical', n: 'Emergencia médica', msg: () => 'CABIN CALL · MEDICAL', lvl: 'c', w: (ac) => 1.8, pax: true,
    steps: () => [
      { t: 'Anuncio: ¿hay un médico a bordo?' }, { t: 'Botiquín y desfibrilador — PREPARAR' }, { t: 'Contactar asistencia médica en tierra' },
      { q: 'Pasajero de 64 años con dolor en el pecho. El médico de tierra recomienda atención en menos de 2 horas.', o: [{ t: 'Desviar al más cercano', v: 1, a: 'divert' }, { t: 'Continuar a destino', v: 0.3, a: 'continue' }] }
    ], sev: 0.2 },
  { id: 'gear', n: 'Tren inseguro', msg: () => 'GEAR DISAGREE', lvl: 'c', w: (ac) => 0.4 + (100 - ac.sys.gear) / 25, landing: true,
    steps: () => [
      { t: 'Aproximación frustrada — POTENCIA Y ARRIBA' }, { t: 'Tren — SUBIR y BAJAR (reciclar)' }, { t: 'Extensión alternativa — ACTIVAR' },
      { q: 'La luz del tren principal izquierdo sigue roja', o: [{ t: 'Pasada baja para inspección visual de la torre', v: 1 }, { t: 'Aterrizar directamente', v: 0.45 }] },
      { t: 'Cabina preparada para aterrizaje de emergencia' }, { t: 'Combustible — QUEMAR para reducir peso' }
    ], sev: 0.5 },
  { id: 'turb', n: 'Turbulencia severa', msg: () => 'SEVERE TURBULENCE', lvl: 'c', w: () => 1.0, weather: true,
    steps: () => [
      { t: 'Señal de cinturones — ENCENDIDA' }, { t: 'Velocidad de penetración — AJUSTAR' }, { t: 'Tripulación de cabina — SENTARSE' },
      { q: '¿Qué pedimos al ATC?', o: [{ t: 'Cambio de nivel y desvío lateral', v: 1 }, { t: 'Mantener nivel y ruta', v: 0.2 }] }
    ], sev: 0.3 },
  { id: 'unruly', n: 'Pasajero disruptivo', msg: () => 'CABIN CALL · SECURITY', lvl: 'c', w: () => 0.8, pax: true,
    steps: () => [
      { t: 'Tripulación — CONTENER (kit de restricción)' }, { t: 'Puerta de cabina — ASEGURADA' }, { t: 'Informar a ATC y pedir policía' },
      { q: 'El pasajero fue reducido pero sigue agresivo', o: [{ t: 'Continuar a destino con policía esperando', v: 0.9, a: 'continue' }, { t: 'Desviar al más cercano', v: 0.7, a: 'divert' }] }
    ], sev: 0.15 },
  { id: 'elec', n: 'Falla eléctrica', msg: () => 'ELEC GEN 1 OFF', lvl: 'c', w: (ac) => 0.3 + (100 - ac.sys.elec) / 25,
    steps: () => [
      { t: 'Generador 1 — REARMAR' }, { t: 'APU — ARRANCAR' }, { t: 'Cargas no esenciales — DESCONECTAR' },
      { q: 'El APU alimenta el bus 1', o: [{ t: 'Continuar a destino', v: 0.85, a: 'continue' }, { t: 'Desviar por precaución', v: 0.8, a: 'divert' }] }
    ], sev: 0.25 }
];
