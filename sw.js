// Guarda os arquivos do painel para que ele abra mesmo sem internet.
const VERSAO = "painel-v2";
const BASE = ["./", "index.html", "fonts/quentin.ttf", "firebase-config.js", "manifest.webmanifest", "icons/icone-192.png", "icons/icone-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // login e banco de dados nunca passam pelo cache
  if (url.pathname.startsWith("/__/") || url.hostname.endsWith("googleapis.com") && !url.hostname.startsWith("fonts.")) return;
  const estatico = url.origin === location.origin || url.hostname === "www.gstatic.com" || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!estatico) return;
  // a página principal busca primeiro na internet, para receber atualizações
  if (req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html") || url.pathname.endsWith("firebase-config.js")) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSAO).then(x => x.put(req, c)); return r; }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { if (res.ok || res.type === "opaque") { const c = res.clone(); caches.open(VERSAO).then(x => x.put(req, c)); } return res; })));
});
