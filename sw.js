/* Service worker PAV Futsal – version 6fd4461ad3 */
const CACHE = 'pav-6fd4461ad3';
const COEUR = ['/', '/index.html', '/manifest.webmanifest', '/assets/pav.png', '/icons/icon-192.png', '/icons/icon-512.png'];
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
firebase.initializeApp({"apiKey": "AIzaSyAqT1nHuZPvJauYxEvC0wyGTUd_9X3809k", "authDomain": "pav-futsal.firebaseapp.com", "projectId": "pav-futsal", "messagingSenderId": "830735003485", "appId": "1:830735003485:web:efa7310ef780fb486802b4"});
const messaging = firebase.messaging();
messaging.onBackgroundMessage(p => {
  if (p.notification) return; // Firebase l'affiche déjà
  const d = p.data || {};
  self.registration.showNotification(d.title || 'PAV Futsal', { body: d.body || '', icon: '/icons/icon-192.png', badge: '/icons/badge-96.png', tag: d.tag || 'pav-live', renotify: true, data: { url: d.url || '/' } });
});
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(COEUR)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('pav-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (/script\.google(usercontent)?\.com$/.test(u.hostname) || u.hostname.endsWith('googleapis.com') && u.pathname.includes('fcm')) return;
  if (r.mode === 'navigate') {   // pages : réseau d'abord, sinon la dernière version gardée
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put('/index.html', c)); return res; })
      .catch(() => caches.match('/index.html')));
    return;
  }
  const memeSite = u.origin === self.location.origin, polices = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (!memeSite && !polices) return;
  e.respondWith(caches.open(CACHE).then(async k => {   // fichiers : cache tout de suite, mise à jour en fond
    const vieux = await k.match(r);
    const neuf = fetch(r).then(res => { if (res.ok || res.type === 'opaque') k.put(r, res.clone()); return res; }).catch(() => vieux);
    return vieux || neuf;
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && (e.notification.data.url || (e.notification.data.FCM_MSG && e.notification.data.FCM_MSG.notification && e.notification.data.FCM_MSG.notification.click_action))) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    const w = ws.find(c => new URL(c.url).origin === self.location.origin);
    return w ? w.focus().then(c => c.navigate ? c.navigate(url) : c) : self.clients.openWindow(url);
  }));
});
