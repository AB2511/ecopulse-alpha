// This is a basic service worker file.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Add assets to cache
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
});

self.addEventListener('fetch', (event) => {
  // Respond with cached assets if available, otherwise fetch from network
});
