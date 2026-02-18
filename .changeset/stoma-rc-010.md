---
"@vivero/stoma": minor
---

Initial release candidate for v0.1.0

Declarative API gateway library built on Hono for Cloudflare Workers and edge runtimes. Features:

- Gateway construction from declarative TypeScript config
- 43 policies across auth, traffic, resilience, transform, and observability domains
- 4-layer policy SDK with `definePolicy()`, priority constants, composable helpers, and test harness
- Three upstream types: URL proxy, Cloudflare Service Binding, and custom handler
- Runtime adapters for Cloudflare Workers, Node.js, Deno, and Bun
- Cloudflare-specific stores (KV, Durable Objects, Cache API)
- Admin introspection API with Prometheus metrics export
- W3C trace context propagation
- Zod-based config validation (optional peer dependency)
- Zero-dependency debug system with namespace filtering
- SSRF protection on URL upstreams
