// Demo API gateway - a real Stoma gateway serving fake data for the
// documentation editor. Dogfoods the product and keeps everything
// on the same origin (no CORS issues from the editor).

import type { Context } from "hono";
import { memoryAdapter } from "../../../packages/gateway/src/adapters/memory";
import { cors, createGateway, rateLimit, requestLog } from "../../../packages/gateway/src/index";

const adapter = memoryAdapter();

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/** Echo - returns the request details back as JSON. */
async function echoHandler(c: Context) {
  const url = new URL(c.req.url);
  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((v, k) => {
    headers[k] = v;
  });

  let body: unknown = null;
  if (c.req.method !== "GET" && c.req.method !== "HEAD") {
    try {
      body = await c.req.json();
    } catch {
      try {
        body = await c.req.text();
      } catch {
        // no body
      }
    }
  }

  return c.json({
    method: c.req.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    headers,
    body,
    timestamp: new Date().toISOString(),
  });
}

/** Users - fake user data for auth/proxy examples. */
const USERS = [
  {
    id: "usr_1",
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "admin",
  },
  { id: "usr_2", name: "Bob Smith", email: "bob@example.com", role: "member" },
  {
    id: "usr_3",
    name: "Carol Williams",
    email: "carol@example.com",
    role: "member",
  },
  {
    id: "usr_4",
    name: "Dave Brown",
    email: "dave@example.com",
    role: "viewer",
  },
];

function usersHandler(c: Context) {
  const url = new URL(c.req.url);
  const segments = url.pathname
    .replace(/^\/demo-api\/users\/?/, "")
    .split("/")
    .filter(Boolean);

  if (segments.length > 0) {
    const user = USERS.find((u) => u.id === segments[0]);
    if (user) return c.json(user);
    return c.json(
      { error: "not_found", message: `User ${segments[0]} not found` },
      404
    );
  }

  return c.json({ users: USERS, total: USERS.length });
}

/** Products - fake catalog data for caching examples. */
const PRODUCTS = [
  {
    id: "prod_1",
    name: "API Gateway Pro",
    price: 99.99,
    category: "software",
    inStock: true,
  },
  {
    id: "prod_2",
    name: "Edge Runtime",
    price: 49.99,
    category: "software",
    inStock: true,
  },
  {
    id: "prod_3",
    name: "Rate Limiter Plus",
    price: 29.99,
    category: "addon",
    inStock: false,
  },
  {
    id: "prod_4",
    name: "Cache Accelerator",
    price: 79.99,
    category: "addon",
    inStock: true,
  },
  {
    id: "prod_5",
    name: "Auth Shield",
    price: 149.99,
    category: "security",
    inStock: true,
  },
];

function productsHandler(c: Context) {
  const url = new URL(c.req.url);
  const segments = url.pathname
    .replace(/^\/demo-api\/products\/?/, "")
    .split("/")
    .filter(Boolean);

  if (segments.length > 0) {
    const product = PRODUCTS.find((p) => p.id === segments[0]);
    if (product) return c.json(product);
    return c.json(
      { error: "not_found", message: `Product ${segments[0]} not found` },
      404
    );
  }

  return c.json({ products: PRODUCTS, total: PRODUCTS.length });
}

/** Status - return any status code (for retry/circuit-breaker demos). */
function statusHandler(c: Context) {
  const code = Number.parseInt(c.req.param("code"), 10);
  if (Number.isNaN(code) || code < 100 || code > 599) {
    return c.json(
      { error: "invalid_status", message: "Status code must be 100-599" },
      400
    );
  }
  return c.json(
    { status: code, message: `Responded with status ${code}` },
    code as 200
  );
}

/** Delay - artificial latency (for timeout demos). */
async function delayHandler(c: Context) {
  const ms = Number.parseInt(c.req.param("ms"), 10);
  if (Number.isNaN(ms) || ms < 0 || ms > 10000) {
    return c.json(
      { error: "invalid_delay", message: "Delay must be 0-10000ms" },
      400
    );
  }
  await new Promise((resolve) => setTimeout(resolve, ms));
  return c.json({ delayed: ms, message: `Waited ${ms}ms` });
}

/** Catch-all - generic JSON for any unmatched path. */
function catchAllHandler(c: Context) {
  const url = new URL(c.req.url);
  return c.json({
    message: "Stoma Demo API",
    path: url.pathname,
    method: c.req.method,
    hint: "Try /demo-api/echo, /demo-api/users, /demo-api/products, /demo-api/status/418, or /demo-api/delay/500",
    timestamp: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Gateway
// ---------------------------------------------------------------------------

export const gateway = createGateway({
  name: "stoma-demo-api",
  basePath: "/demo-api",
  adapter,
  policies: [
    requestLog(),
    cors(),
    rateLimit({ max: 60, windowSeconds: 60, store: adapter.rateLimitStore }),
  ],
  routes: [
    {
      path: "/echo",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      pipeline: {
        upstream: { type: "handler", handler: echoHandler },
      },
    },
    {
      path: "/users/*",
      pipeline: {
        upstream: { type: "handler", handler: usersHandler },
      },
    },
    {
      path: "/users",
      pipeline: {
        upstream: { type: "handler", handler: usersHandler },
      },
    },
    {
      path: "/products/*",
      pipeline: {
        upstream: { type: "handler", handler: productsHandler },
      },
    },
    {
      path: "/products",
      pipeline: {
        upstream: { type: "handler", handler: productsHandler },
      },
    },
    {
      path: "/status/:code",
      pipeline: {
        upstream: { type: "handler", handler: statusHandler },
      },
    },
    {
      path: "/delay/:ms",
      pipeline: {
        upstream: { type: "handler", handler: delayHandler },
      },
    },
    {
      path: "/*",
      pipeline: {
        upstream: { type: "handler", handler: catchAllHandler },
      },
    },
  ],
});
