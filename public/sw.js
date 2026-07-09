// MoodWorld service worker — minimal offline app-shell cache so the PWA is installable
// and the shell still loads (stale) when there's no network. Network-FIRST for the
// shell/assets: with a connection, always fetch the latest deploy rather than serving
// a possibly-months-stale cached copy (this app ships new features often, and the old
// cache-first strategy meant returning visitors — e.g. friends opening a shared LINE
// link — could get stuck on an old version indefinitely, since nothing ever forced
// a refresh). Cache is only a fallback for genuine offline use. Stats/vote calls
// always go straight to the network and are never cached either way.
//
// Bump CACHE's version suffix (v1 -> v2 here) whenever this file's caching logic
// changes — activate() deletes any cache whose name doesn't match, so a version
// bump forces every existing installed copy to throw away its old cached files.
const CACHE = "moodworld-shell-v2";
const SHELL_URLS = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Never cache API calls — always fresh data.
  if (url.pathname.startsWith("/api/")) return;
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
