/**
 * Client-side utilities for the Stoma playground.
 *
 * Handles service worker registration, request dispatching with timing,
 * and playground state reset. Imported by the Playground.astro component.
 *
 * This file lives in docs/ only. It is NOT part of the Stoma library.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Parsed policy trace entry from x-stoma-trace. */
export interface PlaygroundTraceEntry {
  name: string;
  priority: number;
  durationMs: number;
  calledNext: boolean;
  error: string | null;
  detail?: { action: string; data?: Record<string, unknown> };
}

/** Parsed policy trace from x-stoma-trace. */
export interface PlaygroundTrace {
  requestId: string;
  traceId: string;
  route: string;
  totalMs: number;
  entries: PlaygroundTraceEntry[];
}

/** Structured response from a playground request. */
export interface PlaygroundResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timingMs: number;
  trace: PlaygroundTrace | null;
}

// ---------------------------------------------------------------------------
// Service Worker registration
// ---------------------------------------------------------------------------

/**
 * Register the playground service worker and wait for it to activate.
 *
 * The SW is scoped to "/" so it can intercept `/playground/api/*` requests
 * from any docs page. Returns the active registration.
 *
 * @throws {Error} If the browser doesn't support service workers.
 */
export async function registerPlaygroundSW(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "Service Workers are not supported in this browser. " +
        "Try Chrome, Firefox, or Safari."
    );
  }

  const registration = await navigator.serviceWorker.register(
    "/playground-sw.js",
    { scope: "/", type: "module" }
  );

  // Wait until the SW is both activated AND controlling this page.
  // `navigator.serviceWorker.ready` resolves when a SW is active for
  // this scope. We also check `.controller` — the SW only intercepts
  // fetches once it controls the page (after `clients.claim()`).
  await navigator.serviceWorker.ready;

  // If there's no controller yet (first load before claim() completes),
  // wait for the `controllerchange` event.
  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => resolve(),
        { once: true }
      );
    });
  }

  return registration;
}

// ---------------------------------------------------------------------------
// Request helper
// ---------------------------------------------------------------------------

/**
 * Send a request to the playground gateway and return a structured response.
 *
 * Timing is measured client-side around the fetch() call only (excludes
 * body reading). Since both the page and the service worker run in the
 * same browser, this closely tracks actual gateway processing time.
 *
 * @param method - HTTP method (GET, POST, etc.)
 * @param path   - Path relative to the gateway base (e.g. "/echo")
 * @param opts   - Optional headers and body
 */
export async function sendPlaygroundRequest(
  method: string,
  path: string,
  opts?: { headers?: Record<string, string>; body?: string }
): Promise<PlaygroundResponse> {
  const url = `/playground/api${path}`;

  // Merge user headers with the trace debug header so every playground
  // request automatically requests tracing.
  const mergedHeaders: Record<string, string> = {
    "x-stoma-debug": "trace",
    ...opts?.headers,
  };

  const start = performance.now();
  const res = await fetch(url, {
    method,
    headers: mergedHeaders,
    body: opts?.body,
  });
  const clientTimingMs = Math.round((performance.now() - start) * 100) / 100;

  // Prefer the gateway's own X-Response-Time header (more accurate),
  // falling back to client-side measurement
  const serverTime = res.headers.get("x-response-time");
  const timingMs = serverTime ? Number.parseFloat(serverTime) : clientTimingMs;

  // Collect all response headers into a plain object
  const headers: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const body = await res.text();

  // Parse the x-stoma-trace header if present
  let trace: PlaygroundTrace | null = null;
  const traceHeader = res.headers.get("x-stoma-trace");
  if (traceHeader) {
    try {
      trace = JSON.parse(traceHeader) as PlaygroundTrace;
    } catch {
      // Malformed trace — ignore
    }
  }

  return {
    status: res.status,
    statusText: res.statusText,
    headers,
    body,
    timingMs,
    trace,
  };
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

/** Database name used by the IDB rate limit store. */
const PLAYGROUND_DB_NAME = "stoma-playground";

/** Cache name used by the CacheAPI cache store. */
const PLAYGROUND_CACHE_NAME = "stoma-playground";

/**
 * Clear all playground state and re-register the service worker.
 *
 * 1. Delete the IndexedDB database (rate limit counters)
 * 2. Delete the Cache API cache (cached responses)
 * 3. Unregister the service worker
 * 4. Re-register a fresh service worker
 */
export async function resetPlayground(): Promise<void> {
  // 1. Clear IndexedDB
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(PLAYGROUND_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  // 2. Clear Cache API
  await caches.delete(PLAYGROUND_CACHE_NAME);

  // 3. Unregister existing SW
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    await reg.unregister();
  }

  // 4. Re-register fresh
  await registerPlaygroundSW();
}
