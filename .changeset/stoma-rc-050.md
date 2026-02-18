---
"@vivero/stoma": patch
---

Fix policy middleware swallowing handler return values, breaking context finalization

### Fixes

- **Policy pipeline context finalization**: `policiesToMiddleware` now propagates the return value from policy handlers back to Hono's compose chain. Previously, policies that short-circuit by returning a `Response` (rather than setting `c.res` or calling `next()`) would have their return value discarded, leaving `context.finalized` as `false` and causing Hono to throw "Context is not finalized". Both the fast path (no tracing) and slow path (OTel/policy trace active) are fixed.
- **Auto-inject OPTIONS for preflight**: When a route restricts its methods (e.g. `methods: ["GET"]`) and a policy that handles OPTIONS preflight is present, the gateway now automatically registers an OPTIONS handler for that path so preflight requests don't 404.
