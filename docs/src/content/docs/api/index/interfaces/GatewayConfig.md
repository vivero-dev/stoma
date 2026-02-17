---
editUrl: false
next: false
prev: false
title: "GatewayConfig"
---

Defined in: [packages/gateway/src/core/types.ts:25](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L25)

Top-level gateway configuration.

## Type Parameters

### TBindings

`TBindings` = `Record`\<`string`, `unknown`\>

Worker bindings type (e.g. your `Env` interface).
  Defaults to `Record<string, unknown>` so `service` on
  [ServiceBindingUpstream](/api/index/interfaces/servicebindingupstream/) accepts any string. When you pass your
  own Env type, `service` autocompletes to valid binding names.

## Properties

### adapter?

> `optional` **adapter**: [`GatewayAdapter`](/api/index/interfaces/gatewayadapter/)

Defined in: [packages/gateway/src/core/types.ts:73](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L73)

Runtime adapter providing store implementations and runtime-specific capabilities
(e.g. `waitUntil`, `dispatchBinding`). Created via adapter factories like
`cloudflareAdapter()`, `memoryAdapter()`, etc.

***

### admin?

> `optional` **admin**: `boolean` \| [`AdminConfig`](/api/index/interfaces/adminconfig/)

Defined in: [packages/gateway/src/core/types.ts:81](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L81)

Admin introspection API. Exposes `___gateway/*` routes for operational visibility.

- `true` - enable with defaults (no auth)
- `AdminConfig` object - full customization
- `false` / `undefined` - disabled (default)

***

### basePath?

> `optional` **basePath**: `string`

Defined in: [packages/gateway/src/core/types.ts:29](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L29)

Base path prefix for all routes (e.g. "/api")

***

### debug?

> `optional` **debug**: `string` \| `boolean`

Defined in: [packages/gateway/src/core/types.ts:56](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L56)

Enable internal debug logging for gateway operators.

- `true` - log all namespaces
- `false` / `undefined` - disabled (default, zero overhead)
- `string` - comma-separated glob patterns to filter namespaces

Namespaces: `stoma:gateway`, `stoma:pipeline`, `stoma:upstream`,
`stoma:policy:*` (e.g. `stoma:policy:cache`, `stoma:policy:jwt-auth`)

Output goes to `console.debug()` which is captured by `wrangler tail`
and Cloudflare Workers Logs.

#### Example

```ts
createGateway({ debug: true, ... })                         // everything
createGateway({ debug: "stoma:gateway,stoma:upstream", ... }) // core only
createGateway({ debug: "stoma:policy:*", ... })              // policies only
```

***

### debugHeaders?

> `optional` **debugHeaders**: `boolean` \| [`DebugHeadersConfig`](/api/index/interfaces/debugheadersconfig/)

Defined in: [packages/gateway/src/core/types.ts:105](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L105)

Enable client-requested debug headers.

When enabled, clients can send an `x-stoma-debug` request header listing
the debug values they want returned as response headers. Policies contribute
debug data via [setDebugHeader](/api/index/functions/setdebugheader/) from the SDK - only requested values
are included in the response.

- `true` - enable with defaults
- `DebugHeadersConfig` - full customization (request header name, allowlist)
- `false` / `undefined` - disabled (default, zero overhead)

#### Example

```
// Client request:
GET /api/users
x-stoma-debug: x-stoma-cache-key, x-stoma-cache-ttl

// Response includes:
x-stoma-cache-key: GET:http://example.com/api/users
x-stoma-cache-ttl: 300
```

***

### defaultErrorMessage?

> `optional` **defaultErrorMessage**: `string`

Defined in: [packages/gateway/src/core/types.ts:65](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L65)

Default error message for unexpected (non-GatewayError) errors. Default: `"An unexpected error occurred"`.

***

### defaultMethods?

> `optional` **defaultMethods**: [`HttpMethod`](/api/index/type-aliases/httpmethod/)[]

Defined in: [packages/gateway/src/core/types.ts:63](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L63)

Default HTTP methods for routes that don't specify `methods`.
Default: `["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]`.

***

### defaultPolicyPriority?

> `optional` **defaultPolicyPriority**: `number`

Defined in: [packages/gateway/src/core/types.ts:67](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L67)

Default priority for policies that don't specify one. Default: `100`.

***

### name?

> `optional` **name**: `string`

Defined in: [packages/gateway/src/core/types.ts:27](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L27)

Gateway name, used in logs and metrics

***

### onError()?

> `optional` **onError**: (`error`, `c`) => `Response` \| `Promise`\<`Response`\>

Defined in: [packages/gateway/src/core/types.ts:35](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L35)

Global error handler

#### Parameters

##### error

`Error`

##### c

`Context`

#### Returns

`Response` \| `Promise`\<`Response`\>

***

### policies?

> `optional` **policies**: [`Policy`](/api/index/interfaces/policy/)[]

Defined in: [packages/gateway/src/core/types.ts:33](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L33)

Global policies applied to all routes

***

### requestIdHeader?

> `optional` **requestIdHeader**: `string`

Defined in: [packages/gateway/src/core/types.ts:58](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L58)

Response header name for the request ID. Default: `"x-request-id"`.

***

### routes

> **routes**: [`RouteConfig`](/api/index/interfaces/routeconfig/)\<`TBindings`\>[]

Defined in: [packages/gateway/src/core/types.ts:31](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L31)

Route definitions

***

### tracing?

> `optional` **tracing**: [`TracingConfig`](/api/index/interfaces/tracingconfig/)

Defined in: [packages/gateway/src/core/types.ts:129](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/types.ts#L129)

OpenTelemetry-compatible distributed tracing.

When configured, the gateway creates a root SERVER span per request,
INTERNAL child spans per policy, and CLIENT child spans for upstream
calls. Spans are exported asynchronously via `adapter.waitUntil()`.

Zero overhead when not configured - no span objects are allocated.

#### Example

```ts
import { createGateway, OTLPSpanExporter } from "@homegrower-club/stoma";

createGateway({
  tracing: {
    exporter: new OTLPSpanExporter({ endpoint: "https://otel-collector/v1/traces" }),
    serviceName: "my-api",
    sampleRate: 0.1,
  },
  // ...routes
});
```
