const CACHE = 'dealer-v4';
const ASSETS = ['/', '/index.html', '/main.js', '/style.css', '/icon-192.png', '/icon-512.png', '/manifest.json',
  '/assets/cards/jack_of_spades.svg', '/assets/cards/jack_of_hearts.svg', '/assets/cards/jack_of_diamonds.svg', '/assets/cards/jack_of_clubs.svg',
  '/assets/cards/queen_of_spades.svg', '/assets/cards/queen_of_hearts.svg', '/assets/cards/queen_of_diamonds.svg', '/assets/cards/queen_of_clubs.svg',
  '/assets/cards/king_of_spades.svg', '/assets/cards/king_of_hearts.svg', '/assets/cards/king_of_diamonds.svg', '/assets/cards/king_of_clubs.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Network first → fallback to cache (always picks up latest files)
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
