# Estela · gestión de aerolíneas

Juego de gestión de aerolíneas hecho desde cero en HTML, CSS y JavaScript, sin dependencias ni paso de compilación. Está pensado primero para el celular (pantalla vertical, hoja inferior deslizable, gestos de pellizco sobre el mapa) y se adapta al escritorio con un panel lateral.

Fundás tu compañía en el año que elijas entre 1970 y 2026, comprás o alquilás aviones, diseñás la red, ponés precios, contratás personal y atravesás cinco décadas de historia de la aviación: crisis del petróleo, desregulación, 11-S, ceniza volcánica, pandemia.

## Cómo jugar

Abrí `index.html` desde un servidor web local (los navegadores bloquean algunos recursos cuando se abre con `file://`):

```bash
python3 -m http.server 8000
```

Después entrá a `http://localhost:8000`. También funciona tal cual en GitHub Pages o cualquier hosting estático. En HTTPS se instala como aplicación (PWA) y sigue andando sin conexión.

Primeros pasos dentro del juego:

1. Elegí un escenario histórico o una partida libre, el nombre, la librea y el modelo de negocio (tradicional, híbrida, low-cost, ultra low-cost).
2. En **Rutas → Nueva ruta** tocá dos aeropuertos en el mapa. El planificador te muestra demanda, competencia, slots y qué aviones pueden volarla.
3. Asigná un avión y la frecuencia. Ajustá precios por clase y temporada en la ficha de la ruta.
4. Avanzá el tiempo con los controles de velocidad del HUD y mirá el tablero de salidas, las alertas y el informe mensual.
5. La guía completa está en **Más → Guía**.

## Qué incluye

- **Flota**: 117 tipos de 27 fabricantes, desde 1958 hasta 2027 (F27, DC-9, 727, 747, Concorde, Tu-154, A320neo, 787, A350, C919, entre otros). Se desbloquean por año. Compra nueva con fila de entrega, leasing, financiación, mercado de segunda mano, venta, reconfiguración de cabina (económica, premium, business, primera, suites) y densidad de asientos, mejoras (winglets, TCAS, EGPWS, autoland CAT III, kit ETOPS, hushkit) y chequeos A, C, D y de motor.
- **Red**: 251 aeropuertos reales con población, perfil de negocios y turismo, tamaño, pista, congestión, niebla y viento. Negociación de slots, bases secundarias, licencias domésticas e internacionales, ETOPS según distancia real a aeropuertos alternativos.
- **Demanda y precios**: modelo de gravedad con crecimiento por época, estacionalidad, reparto por clase, elasticidad, competidores que reaccionan a tus tarifas, precios por temporada y precio automático.
- **Finanzas**: estado de resultados por categoría, préstamos con calificación crediticia, impuestos, cobertura de combustible, seguros, inflación con deuda indexada, salida a bolsa, emisión y recompra de acciones.
- **Personal**: pilotos, tripulantes, mecánicos y personal de tierra con salarios por región, contratación con experiencia o cadetes, fatiga, moral, gremios y huelgas.
- **Planificación de vuelo**: índice de costo, política de combustible, tankering, aeropuerto alternativo, peso y balance con centro de gravedad.
- **Meteorología y ATC**: tormentas, turbulencia, niebla y vientos que se mueven por el mapa y afectan horarios, combustible, esperas y desvíos.
- **Cabina**: emergencias con PFD y EICAS animados y listas QRH paso a paso (fuego de motor, despresurización, falla hidráulica y otras), o delegación en la tripulación.
- **Servicio a bordo**: catering, entretenimiento, Wi-Fi, amenities, salas VIP y programa de viajero frecuente.
- **Crisis**: 28 crisis con decisiones (huelgas de ATC, equipaje perdido, demandas, virales, fusiones) y 20 hechos históricos contados como portadas de diario.
- **Investigación**: 39 tecnologías en 6 ramas.
- **Reputación**: puntualidad, servicio, seguridad y marca; si la puntualidad cae debajo del umbral, los pasajeros de negocios se van.
- **Escenarios**: charter regional en 1972, desregulación en EE. UU. en 1978, aerolínea de bandera al borde de la quiebra con hiperinflación en 1989, low-cost europea en 1995, superconectora del Golfo en 2004, pandemia en 2020 y partida libre.
- Mapa del mundo con día y noche en tiempo real, luces de ciudades, rutas por arco de círculo máximo y aviones animados con estelas. Libreas generadas por tipo de avión. Temas Noche y Carta. 17 logros, informe anual, sonido sintetizado.
- Guardado automático y en tres ranuras (localStorage), exportación e importación de partidas.

## Estructura

```
index.html              página y orden de carga de los scripts
css/style.css           tokens de diseño, temas y componentes
js/core/                utilidades, geografía y estado de partida (guardado)
js/data/                mapa mundial, aeropuertos, aviones, investigación, eventos, escenarios
js/sim/                 simulación sin DOM: economía, demanda, flota, clima, vuelos, personal, eventos, motor
js/render/              mapa en canvas y arte lateral SVG de los aviones
js/ui/                  HUD, vistas, modales, cabina de emergencias, asistente de nueva partida
js/main.js              arranque, bucle principal, sonido y autoguardado
sw.js, manifest.webmanifest, icons/   instalación como PWA y uso sin conexión
```

Todos los módulos cuelgan del espacio de nombres global `E`. La simulación (`js/core`, `js/data`, `js/sim`) no toca el DOM, así que puede ejecutarse en Node con `vm` para probar el balance sin navegador.
