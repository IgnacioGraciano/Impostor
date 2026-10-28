/* ESTELA · árbol de tecnologías e investigación
   c: costo (M$) · d: días · req: prerequisitos · y: año mínimo */
'use strict';
E.RES_CATS = {
  ops: { n: 'Operaciones', i: 'route' },
  mnt: { n: 'Mantenimiento', i: 'wrench' },
  com: { n: 'Comercial', i: 'chart' },
  svc: { n: 'Servicio', i: 'cup' },
  crew: { n: 'Personal', i: 'users' },
  eff: { n: 'Eficiencia', i: 'fuel' }
};
E.RESEARCH = [
  // Operaciones
  { id: 'lic_reg', cat: 'ops', n: 'Licencia continental', d: 20, c: 1.5, req: [], y: 1950, desc: 'Permite volar entre cualquier aeropuerto de tu continente.' },
  { id: 'lic_int', cat: 'ops', n: 'Licencia intercontinental', d: 45, c: 8, req: ['lic_reg'], y: 1950, desc: 'Permite rutas a cualquier continente.' },
  { id: 'subsid', cat: 'ops', n: 'Filiales en el extranjero', d: 60, c: 15, req: ['lic_int'], y: 1970, desc: 'Abrí bases en otros países (como LATAM o AirAsia) y operá sus rutas domésticas.' },
  { id: 'etops120', cat: 'ops', n: 'Certificación ETOPS-120', d: 30, c: 3, req: ['lic_int'], y: 1985, desc: 'Bimotores con kit ETOPS pueden cruzar tramos oceánicos de hasta ~3.000 km.' },
  { id: 'etops180', cat: 'ops', n: 'Certificación ETOPS-180', d: 30, c: 5, req: ['etops120'], y: 1988, desc: 'Tramos oceánicos de hasta ~4.600 km para bimotores (Atlántico Norte, Pacífico).' },
  { id: 'etops330', cat: 'ops', n: 'Certificación ETOPS-330', d: 40, c: 8, req: ['etops180'], y: 2008, desc: 'Bimotores sin restricción oceánica: rutas polares y del Pacífico Sur.' },
  { id: 'cat3', cat: 'ops', n: 'Operaciones CAT III', d: 25, c: 2, req: [], y: 1975, desc: 'Tripulaciones certificadas para aterrizar con niebla en aviones equipados con autoland.' },
  { id: 'occ', cat: 'ops', n: 'Centro de Control Operativo', d: 30, c: 4, req: [], y: 1970, desc: 'Coordina contingencias: la propagación de demoras baja un 30%.' },
  { id: 'quickturn', cat: 'ops', n: 'Rotaciones rápidas', d: 20, c: 2, req: ['occ'], y: 1975, desc: 'Procesos de escala optimizados: tiempo mínimo de rotación −20%.' },
  // Mantenimiento
  { id: 'hangar', cat: 'mnt', n: 'Hangares propios', d: 20, c: 3, req: [], y: 1950, desc: 'Permite construir hangares en tus bases: mantenimiento −25% en aviones basados allí.' },
  { id: 'mro', cat: 'mnt', n: 'Centro MRO pesado', d: 45, c: 10, req: ['hangar'], y: 1960, desc: 'Chequeos C y D un 30% más rápidos y baratos.' },
  { id: 'engshop', cat: 'mnt', n: 'Taller de motores', d: 40, c: 8, req: ['hangar'], y: 1960, desc: 'Overhaul de motores −35% de costo; los motores se desgastan más lento.' },
  { id: 'predictive', cat: 'mnt', n: 'Mantenimiento predictivo', d: 50, c: 12, req: ['mro'], y: 2012, desc: 'Sensores y análisis de datos: incidentes técnicos −35%, desgaste −15%.' },
  // Comercial
  { id: 'crs', cat: 'com', n: 'Reservas computarizadas', d: 15, c: 1, req: [], y: 1965, desc: 'Sistema de reservas propio: demanda +3%.' },
  { id: 'yield', cat: 'com', n: 'Yield management', d: 30, c: 4, req: ['crs'], y: 1985, desc: 'Gestión de ingresos: +4% de ingreso por pasaje y habilita precios automáticos.' },
  { id: 'gds', cat: 'com', n: 'Distribución GDS', d: 25, c: 3, req: ['crs'], y: 1987, desc: 'Presencia en agencias de todo el mundo: demanda internacional +5%.' },
  { id: 'web', cat: 'com', n: 'Venta online', d: 25, c: 3, req: ['gds'], y: 1996, desc: 'Venta directa por internet: comisiones −60% y demanda +4%.' },
  { id: 'app', cat: 'com', n: 'App móvil', d: 30, c: 4, req: ['web'], y: 2010, desc: 'Check-in y extras desde el celular: ingresos auxiliares +12%, satisfacción +.' },
  { id: 'dyn', cat: 'com', n: 'Precios dinámicos con IA', d: 45, c: 10, req: ['yield', 'web'], y: 2016, desc: 'Optimiza precios cada semana por ruta y temporada: +5% de ingresos.' },
  { id: 'ffp', cat: 'com', n: 'Programa de viajero frecuente', d: 25, c: 3, req: [], y: 1981, desc: 'Fideliza a ejecutivos: demanda business +10%.' },
  { id: 'alliance', cat: 'com', n: 'Diplomacia de alianzas', d: 30, c: 5, req: ['ffp', 'lic_int'], y: 1997, desc: 'Permite unirse a una alianza global y hacer códigos compartidos.' },
  { id: 'cargo', cat: 'com', n: 'División de carga', d: 25, c: 3, req: [], y: 1950, desc: 'Equipo comercial de carga: ingresos de carga +25% y habilita cargueros.' },
  // Servicio
  { id: 'lounge', cat: 'svc', n: 'Salas VIP', d: 20, c: 2, req: [], y: 1950, desc: 'Permite construir salas VIP en tus bases.' },
  { id: 'py', cat: 'svc', n: 'Premium Economy', d: 20, c: 2, req: [], y: 1992, desc: 'Nueva clase intermedia en las cabinas.' },
  { id: 'ife', cat: 'svc', n: 'Entretenimiento a bordo', d: 15, c: 2, req: [], y: 1978, desc: 'Habilita pantallas y sistemas IFE (según la época).' },
  { id: 'flatbed', cat: 'svc', n: 'Asientos cama', d: 30, c: 5, req: ['lounge'], y: 1996, desc: 'Habilita camas inclinadas/planas en ejecutiva y primera.' },
  { id: 'suites', cat: 'svc', n: 'Suites premium', d: 35, c: 8, req: ['flatbed'], y: 2007, desc: 'Suites privadas de primera (y con puerta en ejecutiva desde 2017).' },
  { id: 'wifi', cat: 'svc', n: 'Conectividad a bordo', d: 30, c: 5, req: [], y: 2008, desc: 'Habilita Wi-Fi satelital en la flota.' },
  { id: 'chef', cat: 'svc', n: 'Programa gastronómico', d: 15, c: 1.5, req: [], y: 1950, desc: 'Alianza con chefs: menús de autor en cabinas premium.' },
  // Personal
  { id: 'training', cat: 'crew', n: 'Centro de formación', d: 25, c: 3, req: [], y: 1950, desc: 'Capacitación interna: costo de formación −30% y más efectiva.' },
  { id: 'sim', cat: 'crew', n: 'Simuladores de vuelo', d: 35, c: 6, req: ['training'], y: 1972, desc: 'Pilotos mejor entrenados: emergencias mejor resueltas, seguridad +.' },
  { id: 'crm', cat: 'crew', n: 'Gestión de recursos de cabina (CRM)', d: 20, c: 2, req: [], y: 1981, desc: 'Trabajo en equipo en cabina: incidentes −25% en gravedad.' },
  { id: 'frms', cat: 'crew', n: 'Gestión de fatiga (FRMS)', d: 25, c: 3, req: ['crm'], y: 2005, desc: 'Escalas inteligentes: fatiga −25% con la misma plantilla.' },
  // Eficiencia
  { id: 'fuelmgmt', cat: 'eff', n: 'Gestión de combustible', d: 20, c: 2, req: [], y: 1974, desc: 'Procedimientos de ahorro: consumo −2%.' },
  { id: 'ci', cat: 'eff', n: 'Optimización Cost Index', d: 25, c: 3, req: ['fuelmgmt'], y: 1983, desc: 'FMS optimizado: −2% de combustible adicional en todas las rutas.' },
  { id: 'weather', cat: 'eff', n: 'Meteorología avanzada', d: 20, c: 3, req: [], y: 1985, desc: 'Despachadores con radar y modelos: desvíos −30%, turbulencia −50%.' },
  { id: 'winglets', cat: 'eff', n: 'Retrofit de winglets', d: 30, c: 4, req: ['ci'], y: 2001, desc: 'Permite instalar winglets en aviones compatibles (−4% de consumo).' },
  { id: 'efb', cat: 'eff', n: 'EFB y despacho digital', d: 20, c: 2, req: [], y: 2011, desc: 'Tablets en cabina: −1% consumo y mejor puntualidad.' },
  { id: 'saf', cat: 'eff', n: 'Combustible sostenible (SAF)', d: 30, c: 6, req: [], y: 2018, desc: 'Mezcla SAF: imagen +, reduce tasas de carbono un 50%.' }
];
E.RES = {};
E.RESEARCH.forEach(r => E.RES[r.id] = r);
