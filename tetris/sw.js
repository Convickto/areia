// Service Worker para PWA
const CACHE_NAME = 'areia-quantica-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/js/main.js',
  '/js/core/GameEngine.js',
  '/js/core/AudioManager.js',
  '/js/core/SandSimulation.js',
  '/js/core/PieceManager.js',
  '/js/core/CollisionSystem.js',
  '/js/core/ScoreSystem.js',
  '/js/core/ParticleSystem.js',
  '/js/ui/UIManager.js',
  '/js/config/Config.js',
  '/js/utils/PerformanceMonitor.js',
  '/audio/bg-sound.mp3',
  '/audio/pop.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
