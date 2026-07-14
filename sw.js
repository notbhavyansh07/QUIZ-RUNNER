const CACHE_NAME = 'quizrunner-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './data/questions.js',
  './js/audio.js',
  './js/renderer2d.js',
  './js/game.js',
  './manifest.json',
  './images/solar_system.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => console.log("SW Caching error: ", err));
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
