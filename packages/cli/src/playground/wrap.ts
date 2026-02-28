import type { GatewayRegistry } from "../gateway/types.js";
import { playgroundHtml } from "./html.js";
import { oauthRelayHtml } from "./oauth-relay.js";

/**
 * Wrap a gateway's fetch function with playground routes.
 *
 * Intercepts playground paths before delegating to the original gateway fetch.
 *
 * - `/__playground`          → serves the playground HTML UI
 * - `/__playground/registry` → returns the gateway registry as JSON
 * - `/__playground/send`     → redirect fallback: re-executes a request server-side
 *                              to capture full 3xx response details that browser
 *                              fetch cannot access (opaque redirect limitation)
 */
export function wrapWithPlayground(
  gatewayFetch: (request: Request) => Response | Promise<Response>,
  registry: GatewayRegistry
): (request: Request) => Response | Promise<Response> {
  const html = playgroundHtml(registry);

  // Pre-compute callback route paths for OAuth relay interception
  const callbackPaths = registry.routes
    .map((r) => r.path)
    .filter((p) => p.toLowerCase().includes("callback"));

  return async (request: Request) => {
    const url = new URL(request.url);

    if (url.pathname === "/__playground") {
      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/__playground/registry") {
      return Response.json(registry);
    }

    if (url.pathname === "/__playground/send" && request.method === "POST") {
      return handlePlaygroundSend(request, gatewayFetch, url.origin);
    }

    // OAuth relay: when the OAuth provider redirects the popup to a callback
    // route, serve a relay page that sends the params back to the playground
    // via postMessage instead of letting the gateway handle the browser request.
    const isNavigation = request.headers.get("accept")?.includes("text/html");
    if (isNavigation && url.search) {
      const isCallbackRoute = callbackPaths.some(
        (p) =>
          url.pathname === p || url.pathname.startsWith(p.replace(/\*$/, ""))
      );
      if (isCallbackRoute) {
        return new Response(oauthRelayHtml(url), {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
    }

    return gatewayFetch(request);
  };
}

/**
 * Headers that are stale or meaningless after the body has been fully
 * read and decoded in-process. Forwarding these to the playground UI
 * causes garbled display (content-encoding implies the body is still
 * compressed) or misleading metadata (content-length from the
 * compressed payload doesn't match the decoded text).
 */
const STRIPPED_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
]);

/**
 * Execute a request against the gateway in-process and return the full
 * response details as JSON. This avoids browser fetch limitations
 * (redirect following, CORS, opaque responses).
 */
async function handlePlaygroundSend(
  request: Request,
  gatewayFetch: (request: Request) => Response | Promise<Response>,
  origin: string
): Promise<Response> {
  try {
    const payload = (await request.json()) as {
      method: string;
      path: string;
      headers?: Record<string, string>;
      body?: string;
    };

    // Build a Request as if the browser had made it directly
    const targetUrl = new URL(payload.path, origin).href;
    const init: RequestInit = {
      method: payload.method,
      headers: payload.headers ?? {},
    };
    if (payload.body && payload.method !== "GET" && payload.method !== "HEAD") {
      init.body = payload.body;
    }

    const gatewayRequest = new Request(targetUrl, init);
    const start = performance.now();
    const res = await gatewayFetch(gatewayRequest);
    const elapsed = performance.now() - start;

    const body = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      if (!STRIPPED_HEADERS.has(k)) {
        headers[k] = v;
      }
    });

    return Response.json({
      status: res.status,
      statusText: res.statusText,
      headers,
      body,
      elapsed,
    });
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
