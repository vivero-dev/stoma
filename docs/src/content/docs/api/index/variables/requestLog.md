---
editUrl: false
next: false
prev: false
title: "requestLog"
---

> `const` **requestLog**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/observability/request-log.ts:142](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L142)

Emit structured JSON logs for every request/response pair.

Captures method, path, status, duration, client IP, user agent, and
gateway context (request ID, gateway name, route path). Runs at priority 0
so it wraps the entire pipeline and measures end-to-end latency.

By default, logs are written to `console.log` as JSON lines. Provide a
custom `sink` to route logs to an external service (e.g., Logflare,
Datadog, or a Durable Object buffer).

## Data boundary: request logs vs analytics

Request logs and analytics (`@homegrower-club/stoma-analytics`) serve
different purposes and deliberately carry different fields.

**Request logs** (this policy) are for **debugging and operational triage**.
Fields are high-cardinality — grep-friendly, not GROUP BY-friendly:

| Field        | Why it's here                                          |
|--------------|--------------------------------------------------------|
| requestId    | Unique per request — grep to find a single transaction |
| path         | Actual URL e.g. /users/42 (high cardinality)           |
| clientIp     | PII, high cardinality — abuse investigation only       |
| userAgent    | High cardinality — debug specific client issues         |
| spanId       | Distributed tracing span correlation                   |
| requestBody  | Deep debugging (opt-in, redactable)                    |
| responseBody | Deep debugging (opt-in, redactable)                    |

**Overlapping fields** (appear in both logs and analytics):

| Field       | Why both need it                                       |
|-------------|--------------------------------------------------------|
| timestamp   | Time-series bucketing (analytics) / grep by time (logs)|
| gatewayName | GROUP BY gateway (analytics) / filter logs by gateway  |
| routePath   | GROUP BY route pattern (analytics) / filter by route   |
| method      | GROUP BY method (analytics) / filter logs by method    |
| statusCode  | Error rate dashboards (analytics) / grep errors (logs) |
| durationMs  | AVG/P99 latency (analytics) / slow request triage      |
| traceId     | Dashboard anomaly drill-down → find matching log lines |

**Analytics-only fields** (NOT in request logs):

| Field        | Why only analytics                                    |
|--------------|-------------------------------------------------------|
| responseSize | SUM bandwidth, detect payload bloat — aggregate only   |
| dimensions   | Extensible low-cardinality facets for GROUP BY         |

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
