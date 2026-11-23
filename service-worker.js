
"use strict";

/*
 * K-ULTRA AI — VERSION 252
 * FILE: service-worker.js
 * Progressive Web App Service Worker
 */

const CACHE_VERSION = "kultra-v252-cache-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./config.js",
  "./app.js",
  "./manifest.json",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-512-maskable.png"
];

// Install: cache essential application files.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(error => {
        console.error("Service worker installation failed:", error);
      })
  );
});

// Activate: remove outdated application caches.
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              key.startsWith("kultra-v252-cache-") &&
              key !== CACHE_VERSION
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: use network-first for pages and cache-first for static assets.
// Never cache authenticated API responses or user-specific data.
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only handle this app's own origin.
  if (url.origin !== self.location.origin) return;

  // Never cache backend API requests.
  if (
    url.pathname.includes("/api/") ||
    url.pathname.includes("/auth/") ||
    url.pathname.includes("/login")
  ) {
    return;
  }

  // HTML navigation: network first, then cached app shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then(cache => {
              cache.put("./index.html", copy);
            });
          }
          return response;
        })
        .catch(async () => {
          return (
            await caches.match(request) ||
            await caches.match("./index.html") ||
            new Response(
              "<h1>K-ULTRA AI</h1><p>You are offline. Please reconnect to the internet.</p>",
              {
                headers: {
                  "Content-Type": "text/html; charset=utf-8"
                }
              }
            )
          );
        })
    );

    return;
  }

  // Static application files: cache first, then network.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (
          response.ok &&
          response.type === "basic"
        ) {
          const copy = response.clone();

          caches.open(CACHE_VERSION).then(cache => {
            cache.put(request, copy);
          });
        }

        return response;
      });
    })
  );
});

// Allow the app to request an update.
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data?.type === "CLEAR_APP_CACHE") {
    event.waitUntil(
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith("kultra-v252-cache-"))
            .map(key => caches.delete(key))
        )
      )
    );
  }
});
