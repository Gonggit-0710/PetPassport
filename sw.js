/* PawTrip 서비스 워커
   - 규정 데이터(data.json)·페이지·기능 파일(features.js/css, airports.json)은 "네트워크 우선": 인터넷이 되면 항상 최신 규정, 안 될 때만 저장본
   - 아이콘·이미지·글꼴은 저장본을 먼저 보여 주고 뒤에서 갱신
   - 히어로 영상(1MB 이상)과 GA·광고 요청은 건드리지 않음
   배포 때 규정만 바뀌면 VERSION을 안 올려도 됩니다(네트워크 우선이라 자동 갱신). sw.js나 저장 목록을 바꿀 때만 올리세요. */
const VERSION = 'pawtrip-v7';
const CORE = ['./', 'index.html', 'data.json', 'base.css', 'nav.js', 'search.js', 'search-index.json', 'features.js', 'features.css'];
const EXTRA = ['privacy.html', 'domestic/', 'titer/', 'cost/', 'local/', 'changes/', 'manifest.webmanifest', 'airports.json', 'media/logo-dark.svg', 'media/logo-light.svg', 'media/mark.svg', 'media/hero-poster.jpg',
  'media/icon-192.png', 'media/icon-512.png', 'media/apple-touch-icon.png'];
const FONT_HOST = 'cdn.jsdelivr.net';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(CORE);
    await Promise.allSettled(EXTRA.map(u => c.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function networkFirst(req, fallbackKey) {
  const c = await caches.open(VERSION);
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000);
    const res = await fetch(req.url, { signal: ctl.signal, cache: 'no-cache', credentials: 'same-origin' }); clearTimeout(t);
    if (res.ok) c.put(fallbackKey || req, res.clone());
    return res;
  } catch (err) {
    const hit = await c.match(fallbackKey || req, { ignoreSearch: true });
    if (hit) return hit;
    throw err;
  }
}

async function staleWhileRevalidate(req) {
  const c = await caches.open(VERSION);
  const hit = await c.match(req);
  const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.destination === 'video' || /\.(mp4|webm)$/.test(url.pathname)) return;
    if (req.mode === 'navigate') {
      // 페이지마다 따로 저장: / → index.html, /domestic/ → domestic/, /privacy.html → privacy.html
      const p = url.pathname.replace(/^\//, '');
      const key = (p === '' || p === 'index.html') ? 'index.html' : (p.endsWith('/') || p.endsWith('.html') ? p : p + '/');
      e.respondWith(networkFirst(req, key)); return;
    }
    if (url.pathname.endsWith('/data.json')) { e.respondWith(networkFirst(req, 'data.json')); return; }
    const m = url.pathname.match(/\/(features\.(?:js|css)|base\.css|nav\.js|search\.js|search-index\.json|airports\.json)$/);
    if (m) { e.respondWith(networkFirst(req, m[1])); return; }
    e.respondWith(staleWhileRevalidate(req)); return;
  }
  if (url.hostname === FONT_HOST) e.respondWith(staleWhileRevalidate(req));
});
