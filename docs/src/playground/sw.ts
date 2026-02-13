/**
 * Service Worker entry point for the Stoma playground.
 *
 * Intercepts only `/playground/` requests and routes them through a real
 * Stoma gateway. All other requests (docs pages, assets, etc.) pass
 * through to the network untouched.
 *
 * This file lives in docs/ only. It is NOT part of the Stoma library.
 */
import { createPlaygroundGateway } from "./gateway-config";

// Typed reference to the service worker global scope
declare const self: ServiceWorkerGlobalScope;

// ---------------------------------------------------------------------------
// Gateway initialization
//
// Created at MODULE scope, not inside the `install` handler. This is
// important: `install` only fires once per SW version, but module-level
// code runs every time the worker starts up (including after a browser
// restart). If we created the gateway inside `install`, it would be
// undefined on subsequent startups.
//
// The fetch handler awaits this promise before dispatching, so requests
// arriving during init just wait — they're never dropped.
// ---------------------------------------------------------------------------
const gatewayPromise = createPlaygroundGateway();

// ---------------------------------------------------------------------------
// Lifecycle events
// ---------------------------------------------------------------------------

self.addEventListener("install", () => {
  // Activate immediately without waiting for old SW to release clients
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of all open tabs immediately
  event.waitUntil(self.clients.claim());
});

// ---------------------------------------------------------------------------
// Fetch handler — only intercepts /playground/ requests
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle playground API paths — let everything else pass through
  if (!url.pathname.startsWith("/playground/")) {
    return;
  }

  event.respondWith(
    (async () => {
      const gateway = await gatewayPromise;
      return gateway.app.fetch(event.request);
    })()
  );
});
