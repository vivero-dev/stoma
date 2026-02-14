/**
 * Web Worker for the Stoma editor.
 *
 * Receives compiled gateway code via postMessage, dynamic-imports it from a
 * Blob URL, and exposes the gateway's `app.fetch()` for request processing.
 *
 * Message protocol:
 *   → { type: "deploy", code: string }        — deploy compiled JS code
 *   ← { type: "deployed", registry }           — gateway ready, here are routes
 *   ← { type: "deploy-error", error: string }  — compilation/deploy failed
 *
 *   → { type: "request", id, method, path, headers, body }  — send a request
 *   ← { type: "response", id, status, statusText, headers, body, timing }
 *   ← { type: "request-error", id, error: string }
 */

declare const self: DedicatedWorkerGlobalScope;

interface GatewayApp {
  fetch: (request: Request) => Promise<Response>;
}

interface GatewayInstance {
  app: GatewayApp;
  _registry: {
    routes: Array<{
      path: string;
      methods: string[];
      policyNames: string[];
      upstreamType: string;
    }>;
    policies: Array<{ name: string; priority: number }>;
    gatewayName: string;
  };
}

let gateway: GatewayInstance | null = null;
let currentBlobUrl: string | null = null;

self.onmessage = async (event: MessageEvent) => {
  const msg = event.data;

  if (msg.type === "deploy") {
    try {
      // Clean up previous blob URL
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
        currentBlobUrl = null;
      }

      // Create a blob URL from the compiled code and import it
      const blob = new Blob([msg.code], { type: "application/javascript" });
      currentBlobUrl = URL.createObjectURL(blob);

      const mod = await import(/* @vite-ignore */ currentBlobUrl);

      // The compiled code exports createPlaygroundGateway()
      if (typeof mod.createPlaygroundGateway !== "function") {
        throw new Error(
          "Compiled code must export a `createPlaygroundGateway` function. " +
            "Make sure your code has: export function createPlaygroundGateway() { ... }"
        );
      }

      gateway = await mod.createPlaygroundGateway();

      self.postMessage({
        type: "deployed",
        registry: gateway!._registry,
      });
    } catch (err) {
      gateway = null;
      self.postMessage({
        type: "deploy-error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  if (msg.type === "request") {
    if (!gateway) {
      self.postMessage({
        type: "request-error",
        id: msg.id,
        error: "No gateway deployed. Click 'Compile & Run' first.",
      });
      return;
    }

    try {
      // Build a Request object from the message data
      const url = `http://editor.local${msg.path}`;
      const init: RequestInit = {
        method: msg.method,
        headers: {
          accept: "application/json",
          "x-stoma-debug": "trace",
          ...(msg.headers || {}),
        },
      };

      if (msg.body && !["GET", "HEAD"].includes(msg.method)) {
        init.body = msg.body;
      }

      const request = new Request(url, init);

      // Capture the actual request headers for display
      const requestHeaders: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        requestHeaders[key] = value;
      });

      const start = performance.now();
      const response = await gateway.app.fetch(request);
      const timingMs = Math.round((performance.now() - start) * 100) / 100;

      // Collect response headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const body = await response.text();

      self.postMessage({
        type: "response",
        id: msg.id,
        status: response.status,
        statusText: response.statusText,
        headers,
        requestHeaders,
        body,
        timingMs,
      });
    } catch (err) {
      self.postMessage({
        type: "request-error",
        id: msg.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
};
