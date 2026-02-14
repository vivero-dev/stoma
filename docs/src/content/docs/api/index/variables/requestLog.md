---
editUrl: false
next: false
prev: false
title: "requestLog"
---

> `const` **requestLog**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/observability/request-log.ts:105](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/observability/request-log.ts#L105)

Emit structured JSON logs for every request/response pair.

Captures method, path, status, duration, client IP, user agent, and
gateway context (request ID, gateway name, route path). Runs at priority 0
so it wraps the entire pipeline and measures end-to-end latency.

By default, logs are written to `console.log` as JSON lines. Provide a
custom `sink` to route logs to an external service (e.g., Logflare,
Datadog, or a Durable Object buffer).

## Parameters

### config?

[`RequestLogConfig`](/api/policies/interfaces/requestlogconfig/)

Custom field extraction, body logging, and sink. All fields optional.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 0 (runs first, wraps everything).

## Example

```ts
import { createGateway } from "@homegrower-club/stoma";
import { requestLog } from "@homegrower-club/stoma/policies";

// Default structured JSON logging to console
createGateway({
  policies: [requestLog()],
  routes: [...],
});

// With body logging and redaction
requestLog({
  logRequestBody: true,
  logResponseBody: true,
  redactPaths: ["password", "*.secret", "auth.token"],
  sink: async (entry) => {
    await fetch("https://logs.example.com/ingest", {
      method: "POST",
      body: JSON.stringify(entry),
    });
  },
});
```
