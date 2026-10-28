/* ESTELA · service worker: funciona sin conexión una vez cargado */
const CACHE = 'estela-v2';
const FILES = ['./', 'index.html', 'css/style.css', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/core/util.js', 'js/data/world.js', 'js/data/airports.js', 'js/data/aircraft.js', 'js/data/research.js', 'js/data/events.js', 'js/data/scenarios.js',
  'js/core/geo.js', 'js/core/state.js', 'js/sim/economy.js', 'js/sim/demand.js', 'js/sim/fleet.js', 'js/sim/weather.js', 'js/sim/flights.js', 'js/sim/staff.js',
  'js/sim/events.js', 'js/sim/engine.js', 'js/render/planeart.js', 'js/render/map.js', 'js/ui/core.js', 'js/ui/hud.js', 'js/ui/views-main.js', 'js/ui/views-fleet.js',
  'js/ui/views-routes.js', 'js/ui/views-ops.js', 'js/ui/views-company.js', 'js/ui/modals.js', 'js/ui/cockpit.js', 'js/ui/newgame.js', 'js/main.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return res;
  }).catch(() => caches.match('index.html'))));
});
