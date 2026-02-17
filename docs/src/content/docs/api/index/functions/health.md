---
editUrl: false
next: false
prev: false
title: "health"
---

> **health**\<`TBindings`\>(`config?`): [`RouteConfig`](/api/index/interfaces/routeconfig/)\<`TBindings`\>

Defined in: [packages/gateway/src/core/health.ts:76](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/health.ts#L76)

Create a health check route for liveness and upstream probing.

Returns a [RouteConfig](/api/index/interfaces/routeconfig/) (not a Policy) - add it directly to the
gateway's `routes` array. Without upstream probes, returns a simple
`{ status: "healthy" }` response. With probes, performs concurrent HEAD
requests (5s timeout each) and reports aggregate status:
- `"healthy"` - all probes passed
- `"degraded"` - some probes failed
- `"unhealthy"` - all probes failed (returns 503)

## Type Parameters

### TBindings

`TBindings` = `Record`\<`string`, `unknown`\>

## Parameters

### config?

[`HealthConfig`](/api/policies/interfaces/healthconfig/)

Endpoint path, upstream probe URLs, and status detail toggle. All fields optional.

## Returns

[`RouteConfig`](/api/index/interfaces/routeconfig/)\<`TBindings`\>

A [RouteConfig](/api/index/interfaces/routeconfig/) for a GET health endpoint.

## Security

Enabling `includeUpstreamStatus: true` causes the response to
include the URLs and availability status of internal upstream services.
On public-facing endpoints this leaks internal service topology, which
can aid attackers in reconnaissance (identifying internal hostnames,
ports, and service availability patterns). Restrict health routes that
expose upstream status to internal or admin-only paths, or protect them
with an authentication policy.

## Example

```ts
import { createGateway } from "@homegrower-club/stoma";
import { health } from "@homegrower-club/stoma/policies";

createGateway({
  routes: [
    // Simple liveness check at /health
    health(),

    // Probe upstreams with detailed status at /healthz
    health({
      path: "/healthz",
      upstreamProbes: [
        "https://api.example.com/health",
        "https://auth.example.com/health",
      ],
      includeUpstreamStatus: true,
    }),

    // ...other routes
  ],
});
```
