/**
 * Gateway factory - the main entry point for creating a stoma gateway.
 *
 * Wires together route registration, the policy pipeline, error handling,
 * and upstream dispatch (URL proxy, Service Binding, or custom handler).
 * All configuration is declarative - pass a {@link GatewayConfig} to
 * {@link createGateway} and export the resulting Hono app as your Worker.
 *
 * @module gateway
 *
 * @example
 * ```ts
 * import { createGateway, jwtAuth, rateLimit, cors } from "@homegrower-club/stoma";
 *
 * const gateway = createGateway({
 *   name: "my-api",
 *   basePath: "/api",
 *   debug: env.DEBUG, // "stoma:*" for all, or "stoma:policy:*" for policies only
 *   policies: [cors(), rateLimit({ max: 100 })],
 *   routes: [
 *     {
 *       path: "/users/*",
 *       pipeline: {
 *         policies: [jwtAuth({ secret: env.JWT_SECRET })],
 *         upstream: { type: "url", target: "https://users-service.internal" },
 *       },
 *     },
 *   ],
 * });
 *
 * export default gateway.app;
 * ```
 */
import { type Context, Hono } from "hono";
import type { GatewayAdapter } from "../adapters/types";
import { registerAdminRoutes } from "../observability/admin";
import type { ReadableSpan } from "../observability/tracing";
import {
  generateOtelSpanId,
  SemConv,
  SpanBuilder,
} from "../observability/tracing";
import { createDebugFactory, noopDebugLogger } from "../utils/debug";
import { cloneRequestHeaders } from "../utils/headers";
import { formatTraceparent, generateSpanId } from "../utils/trace-context";
import { defaultErrorResponse, errorToResponse, GatewayError } from "./errors";
import {
  buildPolicyChain,
  createContextInjector,
  getGatewayContext,
  policiesToMiddleware,
} from "./pipeline";
import type {
  AdminConfig,
  GatewayConfig,
  GatewayInstance,
  GatewayRegistry,
  HandlerUpstream,
  HttpMethod,
  RegisteredPolicy,
  RegisteredRoute,
  RouteConfig,
  ServiceBindingUpstream,
  UrlUpstream,
} from "./types";

/**
 * Create a gateway instance from a declarative configuration.
 *
 * Registers all routes on a Hono app, builds per-route policy pipelines
 * (merging global + route-level policies), and wires up upstream dispatch.
 * Returns a {@link GatewayInstance} whose `.app` property is the Hono app
 * ready to be exported as a Cloudflare Worker default export.
 *
 * @param config - Full gateway configuration including routes, policies, and options.
 * @returns A {@link GatewayInstance} with the configured Hono app.
 * @throws {GatewayError} If no routes are provided.
 *
 * @example
 * ```ts
 * import { createGateway, jwtAuth, rateLimit } from "@homegrower-club/stoma";
 *
 * const gateway = createGateway({
 *   name: "my-api",
 *   basePath: "/api",
 *   routes: [
 *     {
 *       path: "/users/*",
 *       pipeline: {
 *         policies: [jwtAuth({ secret: env.JWT_SECRET }), rateLimit({ max: 100 })],
 *         upstream: { type: "url", target: "https://users-service.internal" },
 *       },
 *     },
 *   ],
 * });
 *
 * export default gateway.app;
 * ```
 */
export function createGateway<TBindings = Record<string, unknown>>(
  config: GatewayConfig<TBindings>
): GatewayInstance {
  if (!config.routes || config.routes.length === 0) {
    throw new GatewayError(
      500,
      "config_error",
      "Gateway requires at least one route"
    );
  }

  const gatewayName = config.name ?? "edge-gateway";
  const debugFactory = createDebugFactory(config.debug);
  const debug = debugFactory("stoma:gateway");
  const debugPipeline = debugFactory("stoma:pipeline");
  const debugUpstream = debugFactory("stoma:upstream");

  const app = new Hono();

  // Global error handler
  app.onError((err, c) => {
    if (config.onError) {
      return config.onError(err, c);
    }

    const ctx = getGatewayContext(c);

    if (err instanceof GatewayError) {
      return errorToResponse(err, ctx?.requestId);
    }

    // Log unexpected errors - these are bugs, not expected policy rejections
    console.error(
      `[${gatewayName}] Unhandled error on ${c.req.method} ${c.req.path}:`,
      err
    );

    return defaultErrorResponse(ctx?.requestId, config.defaultErrorMessage);
  });

  // Catch-all for unmatched routes - return structured JSON instead of Hono's plain-text 404
  app.notFound((c) => {
    debug(`no route matches ${c.req.method} ${c.req.path}`);
    return c.json(
      {
        error: "not_found",
        message: `No route matches ${c.req.method} ${c.req.path}`,
        statusCode: 404,
        gateway: gatewayName,
      },
      404
    );
  });

  let routeCount = 0;

  // Build registry for admin introspection
  const registeredRoutes: RegisteredRoute[] = [];
  const allPoliciesMap = new Map<string, RegisteredPolicy>();

  for (const route of config.routes) {
    const fullPath = joinPaths(config.basePath, route.path);

    // Build the policy chain: context injector + merged policies
    const contextInjector = createContextInjector(
      gatewayName,
      route.path,
      debugFactory,
      config.requestIdHeader,
      config.adapter,
      config.debugHeaders,
      config.tracing
    );
    const mergedPolicies = buildPolicyChain(
      config.policies ?? [],
      route.pipeline.policies ?? [],
      debugPipeline,
      config.defaultPolicyPriority
    );
    const middlewareChain = policiesToMiddleware(mergedPolicies);

    // Build the upstream handler
    const upstreamHandler = createUpstreamHandler(
      route,
      debugUpstream,
      config.adapter
    );

    // All middleware in order: context → policies → upstream
    const allHandlers = [contextInjector, ...middlewareChain, upstreamHandler];

    const methods =
      route.methods ??
      config.defaultMethods ??
      (["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as HttpMethod[]);

    // Use app.on() for safe method registration - avoids missing method issues
    // (Hono handles HEAD automatically when GET is registered)
    const methodNames = methods.map((m) => m.toUpperCase());

    // Auto-inject an OPTIONS handler for CORS preflight when a cors policy
    // is present but OPTIONS is not already in the route's method list.
    // The preflight handler runs only the context injector + policy chain
    // (no upstream) — the CORS middleware returns 204 and the terminal
    // handler ensures the context is finalized if CORS doesn't short-circuit.
    const hasCors = mergedPolicies.some((p) => p.name === "cors");
    if (hasCors && !methodNames.includes("OPTIONS")) {
      const preflightHandlers = [
        contextInjector,
        ...middlewareChain,
        async (c: Context) => c.body(null, 204),
      ];
      // biome-ignore lint/suspicious/noExplicitAny: Hono's overloaded .on() types don't infer well with dynamic method arrays
      (app as any).on("OPTIONS", fullPath, ...preflightHandlers);
      routeCount += 1;
    }

    // biome-ignore lint/suspicious/noExplicitAny: Hono's overloaded .on() types don't infer well with dynamic method arrays
    (app as any).on(methodNames, fullPath, ...allHandlers);
    routeCount += methods.length;

    const policyNames = mergedPolicies.map((p) => p.name);

    // Track registry data (include auto-injected OPTIONS in the method list)
    const registeredMethods =
      hasCors && !methodNames.includes("OPTIONS")
        ? [...methodNames, "OPTIONS"]
        : methodNames;
    registeredRoutes.push({
      path: fullPath,
      methods: registeredMethods,
      policyNames,
      upstreamType: route.pipeline.upstream.type,
    });

    for (const p of mergedPolicies) {
      if (!allPoliciesMap.has(p.name)) {
        allPoliciesMap.set(p.name, {
          name: p.name,
          priority: p.priority ?? config.defaultPolicyPriority ?? 100,
        });
      }
    }

    debug(
      `route ${fullPath} [${methodNames.join(",")}]${policyNames.length ? ` policies=[${policyNames.join(", ")}]` : ""} upstream=${route.pipeline.upstream.type}`
    );
  }

  const registry: GatewayRegistry = {
    routes: registeredRoutes,
    policies: Array.from(allPoliciesMap.values()).sort(
      (a, b) => a.priority - b.priority
    ),
    gatewayName,
  };

  // Register admin introspection routes if configured
  if (config.admin) {
    const adminConfig: AdminConfig =
      typeof config.admin === "boolean" ? { enabled: true } : config.admin;
    if (adminConfig.enabled) {
      if (!adminConfig.auth) {
        console.warn(
          `[stoma:${gatewayName}] admin routes enabled without authentication`
        );
      }
      registerAdminRoutes(app, adminConfig, registry);
      debug(
        `admin routes registered at /${adminConfig.prefix ?? "___gateway"}/*`
      );
    }
  }

  debug(`"${gatewayName}" started with ${routeCount} route handlers`);

  return { app, routeCount, name: gatewayName, _registry: registry };
}

/** Join a base path with a route path, handling slashes */
function joinPaths(basePath: string | undefined, routePath: string): string {
  if (!basePath) return routePath;
  const base = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const route = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return `${base}${route}`;
}

/** Create the terminal handler that dispatches to the upstream */
function createUpstreamHandler(
  // biome-ignore lint/suspicious/noExplicitAny: Internal function - TBindings is erased at runtime
  route: RouteConfig<any>,
  debug = noopDebugLogger,
  adapter?: GatewayAdapter
) {
  const upstream = route.pipeline.upstream;

  switch (upstream.type) {
    case "handler":
      return createHandlerUpstream(upstream);
    case "url":
      return createUrlUpstream(upstream, debug);
    case "service-binding":
      return createServiceBindingUpstream(upstream, debug, adapter);
    default:
      throw new GatewayError(
        500,
        "config_error",
        `Unknown upstream type: ${(upstream as { type: string }).type}`
      );
  }
}

/** Handler upstream - invoke the custom function directly */
function createHandlerUpstream(upstream: HandlerUpstream) {
  return async (c: Context) => {
    return upstream.handler(c);
  };
}

/**
 * Hop-by-hop headers that MUST NOT be forwarded by proxies (RFC 2616 §13.5.1).
 * These are connection-specific and meaningless to the upstream.
 */
const HOP_BY_HOP_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

/**
 * Service Binding upstream - forward to a named service binding or sidecar.
 *
 * Requires `adapter.dispatchBinding` to be configured. On Cloudflare, pass
 * `env` to `cloudflareAdapter()`. On other runtimes, provide a custom
 * `dispatchBinding` implementation.
 */
function createServiceBindingUpstream(
  upstream: ServiceBindingUpstream,
  debug = noopDebugLogger,
  adapter?: GatewayAdapter
) {
  return async (c: Context) => {
    if (!adapter?.dispatchBinding) {
      throw new GatewayError(
        502,
        "config_error",
        `Service binding "${upstream.service}" requires adapter.dispatchBinding - pass "env" to cloudflareAdapter() or provide a custom dispatchBinding`
      );
    }

    const incomingUrl = new URL(c.req.url);

    // Apply path rewrite if configured
    let targetPath = incomingUrl.pathname;
    if (upstream.rewritePath) {
      const originalPath = targetPath;
      targetPath = upstream.rewritePath(targetPath);
      debug(`path rewrite: ${originalPath} -> ${targetPath}`);
    }

    // Build the forwarded URL preserving query string
    const targetUrl = new URL(targetPath + incomingUrl.search, c.req.url);

    debug(
      `service-binding "${upstream.service}": ${c.req.method} ${targetUrl.pathname}${targetUrl.search}`
    );

    // Clone headers, strip hop-by-hop
    const headers = cloneRequestHeaders(c);
    for (const h of HOP_BY_HOP_HEADERS) {
      headers.delete(h);
    }

    // Forward W3C traceparent with a new spanId for the upstream leg
    const ctx = getGatewayContext(c);
    if (ctx) {
      const upstreamSpanId = generateSpanId();
      headers.set(
        "traceparent",
        formatTraceparent({
          version: "00",
          traceId: ctx.traceId,
          parentId: upstreamSpanId,
          flags: "01",
        })
      );
    }

    const proxyRequest = new Request(targetUrl.toString(), {
      method: c.req.method,
      headers,
      body: c.req.raw.body,
      // @ts-expect-error -- duplex is needed for streaming bodies
      duplex: c.req.raw.body ? "half" : undefined,
    });

    // OTel: create CLIENT span for the service binding call
    const otelSpans = c.get("_otelSpans") as ReadableSpan[] | undefined;
    let upstreamSpan: SpanBuilder | undefined;
    if (otelSpans !== undefined) {
      const rootSpan = c.get("_otelRootSpan") as SpanBuilder;
      upstreamSpan = new SpanBuilder(
        `upstream:service-binding:${upstream.service}`,
        "CLIENT",
        rootSpan.traceId,
        generateOtelSpanId(),
        rootSpan.spanId
      );
      upstreamSpan
        .setAttribute(SemConv.HTTP_METHOD, c.req.method)
        .setAttribute(SemConv.URL_PATH, targetUrl.pathname)
        .setAttribute("rpc.service", upstream.service);
    }

    const startTime = Date.now();
    const response = await adapter.dispatchBinding(
      upstream.service,
      proxyRequest
    );

    debug(
      `service-binding responded: ${response.status} (${Date.now() - startTime}ms)`
    );

    // OTel: finalize upstream span
    if (upstreamSpan) {
      upstreamSpan
        .setAttribute(SemConv.HTTP_STATUS_CODE, response.status)
        .setStatus(response.status >= 500 ? "ERROR" : "OK");
      otelSpans!.push(upstreamSpan.end());
    }

    // Strip hop-by-hop headers from the upstream response
    const responseHeaders = new Headers(response.headers);
    for (const h of HOP_BY_HOP_HEADERS) {
      responseHeaders.delete(h);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  };
}

/** URL upstream - proxy the request to a remote URL */
function createUrlUpstream(upstream: UrlUpstream, debug = noopDebugLogger) {
  // Pre-validate the target URL at config time
  const targetBase = new URL(upstream.target);

  return async (c: Context) => {
    const incomingUrl = new URL(c.req.url);

    // Apply path rewrite if configured
    let targetPath = incomingUrl.pathname;
    if (upstream.rewritePath) {
      const originalPath = targetPath;
      targetPath = upstream.rewritePath(targetPath);
      debug(`path rewrite: ${originalPath} -> ${targetPath}`);
    }

    const targetUrl = new URL(targetPath + incomingUrl.search, targetBase);

    // SSRF protection: ensure the rewritten URL still points to the
    // configured upstream origin (protocol + host + port).
    if (targetUrl.origin !== targetBase.origin) {
      debug(
        `SSRF blocked: rewritten URL origin ${targetUrl.origin} != ${targetBase.origin}`
      );
      throw new GatewayError(
        502,
        "upstream_error",
        "Rewritten URL must not change the upstream origin"
      );
    }

    debug(`proxying ${c.req.method} ${c.req.path} -> ${targetUrl.toString()}`);

    // Clone headers, strip hop-by-hop headers
    const headers = cloneRequestHeaders(c);
    for (const h of HOP_BY_HOP_HEADERS) {
      headers.delete(h);
    }

    // Preserve inbound Host only when explicitly requested by proxy policy.
    const preserveHost = c.get("_preserveHost") === true;
    if (!preserveHost) {
      headers.set("host", targetUrl.host);
    }

    // Apply configured header overrides
    if (upstream.headers) {
      for (const [key, value] of Object.entries(upstream.headers)) {
        headers.set(key, value);
      }
    }

    // Forward W3C traceparent with a new spanId for the upstream leg
    const ctx = getGatewayContext(c);
    if (ctx) {
      const upstreamSpanId = generateSpanId();
      headers.set(
        "traceparent",
        formatTraceparent({
          version: "00",
          traceId: ctx.traceId,
          parentId: upstreamSpanId,
          flags: "01",
        })
      );
    }

    const proxyRequest = new Request(targetUrl.toString(), {
      method: c.req.method,
      headers,
      body: c.req.raw.body,
      redirect: "manual", // Prevent SSRF via redirect to internal services
      // @ts-expect-error -- duplex is needed for streaming bodies
      duplex: c.req.raw.body ? "half" : undefined,
    });

    // Store the proxy request on context so the retry policy can re-issue
    // it directly via fetch() without monkey-patching globalThis.fetch.
    c.set("_proxyRequest", proxyRequest.clone());

    // Read the timeout signal if the timeout policy set one
    const timeoutSignal = c.get("_timeoutSignal") as AbortSignal | undefined;

    // OTel: create CLIENT span for the upstream call
    const otelSpans = c.get("_otelSpans") as ReadableSpan[] | undefined;
    let upstreamSpan: SpanBuilder | undefined;
    if (otelSpans !== undefined) {
      const rootSpan = c.get("_otelRootSpan") as SpanBuilder;
      upstreamSpan = new SpanBuilder(
        `upstream:url:${targetUrl.host}`,
        "CLIENT",
        rootSpan.traceId,
        generateOtelSpanId(),
        rootSpan.spanId
      );
      upstreamSpan
        .setAttribute(SemConv.HTTP_METHOD, c.req.method)
        .setAttribute(SemConv.URL_PATH, targetUrl.pathname)
        .setAttribute(SemConv.SERVER_ADDRESS, targetUrl.host);
    }

    const startTime = Date.now();
    let response: Response;
    try {
      response = await fetch(
        proxyRequest,
        timeoutSignal ? { signal: timeoutSignal } : undefined
      );
    } catch (err) {
      // AbortError from the timeout policy should stay as-is so the
      // timeout policy's catch handler can identify it.
      if (err instanceof DOMException && err.name === "AbortError") {
        throw err;
      }
      debug(
        `upstream fetch failed: ${err instanceof Error ? err.message : err}`
      );
      throw new GatewayError(
        502,
        "upstream_error",
        `Upstream request to ${targetUrl.host} failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    debug(
      `upstream responded: ${response.status} (${Date.now() - startTime}ms)`
    );

    // OTel: finalize upstream span
    if (upstreamSpan) {
      upstreamSpan
        .setAttribute(SemConv.HTTP_STATUS_CODE, response.status)
        .setStatus(response.status >= 500 ? "ERROR" : "OK");
      otelSpans!.push(upstreamSpan.end());
    }

    // Strip hop-by-hop headers from the upstream response before returning
    const responseHeaders = new Headers(response.headers);
    for (const h of HOP_BY_HOP_HEADERS) {
      responseHeaders.delete(h);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  };
}
