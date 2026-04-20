# Fallback Policy — Design Proposal

> Design Document | 2026-03-05 | Status: Draft
> Updated: 2026-03-05 — Added latency-based and behavioral fallbacks

## Problem Statement

Currently, Stoma handles upstream failures through individual policies (circuit breaker, retry, timeout) but lacks a declarative mechanism for defining fallback behavior when an upstream fails.

### Current Workaround

To achieve fallback behavior, users must:
1. Build custom middleware that catches failures and manually dispatches to fallback upstreams
2. Chain multiple routes with circuit breaker policies as entry points
3. Write imperative try/catch logic in handler upstreams

This is verbose, error-prone, and not declarative.

### Desired Behavior

A user should be able to declare fallback upstreams alongside the primary upstream:

```typescript
pipeline: {
  upstream: { type: "url", target: "https://api.example.com" },
  fallbacks: [
    { when: { statusCode: 503 }, upstream: { type: "url", target: "https://backup.example.com" } },
    { when: { statusCode: [500, 503, 504] }, upstream: { type: "handler", handler: (c) => c.json({ ok: false }) } },
  ],
}
```

The gateway evaluates fallbacks at runtime based on the `when` conditions, without requiring custom middleware.

## Proposed Design

### Type Changes

Add `fallbacks` to `PipelineConfig`:

```typescript
// In src/core/types.ts

interface FallbackCondition {
  /** Match specific HTTP status codes from upstream */
  statusCode?: number[];
  /** Match when circuit breaker is open for this pipeline */
  circuitOpen?: boolean;
  /** Match when a specific upstream fails (by name or index) */
  upstream?: string;
  /** Match specific error types */
  error?: ("timeout" | "connection" | "ssrf" | "unknown")[];
  
  // === Downstream Behavioral Introspection ===
  
  /** Maximum acceptable latency in ms. Triggers fallback if exceeded. */
  maxLatencyMs?: number;
  /** Latency as percentage of budget consumed (0-100) */
  latencyBudgetPercent?: number;
  /** Match when upstream error rate exceeds threshold (0-1) */
  errorRateThreshold?: number;
  /** Time window to calculate error rate (seconds) */
  errorRateWindowSeconds?: number;
  /** Match when upstream returns 429 (rate limited) */
  rateLimited?: boolean;
  /** Match when upstream sends deprecation header */
  deprecated?: boolean;
  /** Match specific header values */
  header?: Record<string, string | string[]>;
  /** Match when response content-type doesn't match expected */
  contentTypeMismatch?: boolean;
  /** Match when response body is empty or unexpectedly small */
  emptyResponse?: boolean;
  /** Match when upstream returns 401 (auth expired) */
  authExpired?: boolean;
  /** Match when upstream returns 206 Partial Content */
  partialContent?: boolean;
  /** Match when concurrent requests exceed threshold */
  maxConcurrentRequests?: number;
}

interface FallbackConfig {
  /** Condition that triggers this fallback */
  when: FallbackCondition;
  /** The fallback upstream to use */
  upstream: UpstreamConfig;
}

interface PipelineConfig {
  policies?: Policy[];
  upstream: UpstreamConfig;
  /** Fallback chain evaluated when upstream fails */
  fallbacks?: FallbackConfig[];
}
```

### Evaluation Logic

The fallback chain is evaluated in order:

1. After the primary upstream returns a response or throws an error
2. For each fallback in order:
   - Check if `when` conditions match the current state
   - If matched, dispatch to the fallback upstream
   - If the fallback also fails, continue to next fallback
3. If all fallbacks fail, return the last error response

### Circuit Breaker Integration

When a circuit breaker opens:
- The pipeline stores `circuitOpen: true` in its context
- Fallbacks with `when: { circuitOpen: true }` can trigger immediately without waiting for upstream timeout
- This reduces perceived latency during partial outages

### Example Configuration

```typescript
const config: GatewayConfig = {
  routes: [
    {
      path: "/api/:resource",
      pipeline: {
        policies: [
          policies.circuitBreaker({ name: "main-cb", threshold: 5, resetTimeout: 30000 }),
        ],
        upstream: { type: "url", target: "https://primary.internal.com" },
        fallbacks: [
          // First fallback: try cache when primary is unhealthy
          {
            when: { circuitOpen: true },
            upstream: { type: "url", target: "https://cache.internal.com" },
          },
          // Second fallback: serve stale data from handler
          {
            when: { statusCode: [503, 504] },
            upstream: {
              type: "handler",
              handler: async (c) => {
                const data = await getStaleData(c.req.param("resource"));
                return c.json({ data, stale: true, source: "fallback" });
              },
            },
          },
          // Third fallback: graceful degradation response
          {
            when: { statusCode: [500, 502, 503, 504] },
            upstream: {
              type: "handler",
              handler: async (c) => {
                return c.json({
                  error: "service_unavailable",
                  message: "All upstreams failed",
                  degraded: true,
                }, 200); // Return 200 with degraded flag, not 503
              },
            },
          },
        ],
      },
    },
  ],
};
```

### Response Headers

Fallback responses include headers indicating the fallback source:

```
X-Fallback-Source: cache
X-Fallback-Reason: circuit_open
X-Original-Status-Code: 503
```

## Extended Fallback Conditions — Downstream Behavioral Introspection

The gateway has unique visibility into downstream behavior that clients don't. We can leverage this to make intelligent fallback decisions beyond simple error handling.

### 1. Latency-Based Fallback

The gateway measures downstream response time and can proactively switch to fallback before a timeout occurs.

```typescript
interface FallbackCondition {
  // ... existing fields
  /** Maximum acceptable latency in milliseconds. Triggers fallback if exceeded. */
  maxLatencyMs?: number;
  /** Latency as percentage of budget consumed (0-100) */
  latencyBudgetPercent?: number;
}
```

**Use case:** User has a 500ms SLA. If downstream takes >400ms, fallback to cache rather than risk missing the SLA.

```typescript
fallbacks: [
  // If downstream is slow but not failed, serve from cache proactively
  {
    when: { maxLatencyMs: 400 },
    upstream: { type: "url", target: "https://cache.internal.com" },
  },
]
```

**Why this matters:** Instead of making the user wait 30 seconds for a timeout, the gateway decides at 400ms "this is going to miss the SLA" and serves cache in 50ms. User gets *something* fast, with metadata saying it's potentially stale.

### 2. Error Rate-Based Fallback

Circuit breaker is binary (open/closed). But you might want fallback based on *error rate* even before the circuit fully opens.

```typescript
interface FallbackCondition {
  // ... existing fields
  /** Match when upstream error rate exceeds threshold (0-1) */
  errorRateThreshold?: number;
  /** Time window to calculate error rate (seconds) */
  errorRateWindowSeconds?: number;
}
```

**Use case:** If primary upstream has >10% errors over the last 30 seconds, switch to backup.

```typescript
fallbacks: [
  {
    when: { errorRateThreshold: 0.1, errorRateWindowSeconds: 30 },
    upstream: { type: "url", target: "https://backup.internal.com" },
  },
]
```

### 3. Rate Limit (429) Handling

When upstream returns 429, retry-after is often ignored or client gives up. Gateway can handle this gracefully.

```typescript
interface FallbackCondition {
  // ... existing fields
  /** Match when upstream returns 429 (rate limited) */
  rateLimited?: boolean;
}
```

**Use case:** Primary is rate limited → serve from cache, don't make user wait for retry window.

```typescript
fallbacks: [
  {
    when: { rateLimited: true },
    upstream: { type: "url", target: "https://cache.internal.com" },
  },
]
```

### 4. Deprecation / Sunset Headers

Upstreams often send `Deprecation` or `Sunset` headers. Gateway can route to newer version proactively.

```typescript
interface FallbackCondition {
  // ... existing fields
  /** Match when upstream sends deprecation header */
  deprecated?: boolean;
  /** Match specific header values */
  header?: Record<string, string | string[]>;
}
```

**Use case:** Primary API version deprecated → route to v2.

```typescript
fallbacks: [
  {
    when: { header: { "Deprecation": "true" } },
    upstream: { type: "url", target: "https://api.v2.internal.com" },
  },
]
```

### 5. Content Validation

Gateway can validate response before returning — if content is malformed or unexpected type, fallback.

```typescript
interface FallbackCondition {
  // ... existing fields
  /** Match when response content-type doesn't match expected */
  contentTypeMismatch?: boolean;
  /** Match when response body is empty or unexpectedly small */
  emptyResponse?: boolean;
  /** Custom response validator function */
  validateResponse?: (response: Response) => boolean;
}
```

**Use case:** API returns HTML error page instead of JSON → fallback to cache.

```typescript
fallbacks: [
  {
    when: { contentTypeMismatch: true },
    upstream: { type: "handler", handler: (c) => c.json({ error: "source_unavailable" }) },
  },
]
```

### 6. Authentication Expiry (401)

When upstream auth expires mid-request, gateway can refresh and retry transparently.

```typescript
interface FallbackCondition {
  // ... existing fields
  /** Match when upstream returns 401 (auth expired) */
  authExpired?: boolean;
}
```

**Use case:** Refresh token expired → fetch new token, retry once. If still fails, fallback to cache.

```typescript
fallbacks: [
  {
    when: { authExpired: true },
    upstream: { type: "handler", handler: refreshAndRetry }, // Custom handler
  },
]
```

### 7. Partial Content (206)

When upstream returns partial content, gateway can fetch the rest from a different source.

```typescript
interface FallbackCondition {
  // ... existing fields
  /** Match when upstream returns 206 Partial Content */
  partialContent?: boolean;
}
```

### 8. Concurrent Request Pressure

Gateway tracks concurrent requests per upstream. If overwhelmed, can shed load proactively.

```typescript
interface FallbackCondition {
  // ... existing fields
  /** Match when concurrent requests exceed threshold */
  maxConcurrentRequests?: number;
}
```

**Use case:** Too many requests to primary → serve from cache to reduce load.

```typescript
fallbacks: [
  {
    when: { maxConcurrentRequests: 100 },
    upstream: { type: "url", target: "https://cache.internal.com" },
  },
]
```

### Combined Example

```typescript
pipeline: {
  upstream: { type: "url", target: "https://primary.internal.com" },
  policies: [
    policies.circuitBreaker({ threshold: 5, resetTimeout: 30000 }),
  ],
  fallbacks: [
    // Priority 1: Too slow → cache (fast fail)
    { when: { maxLatencyMs: 400 }, upstream: cacheUpstream },
    
    // Priority 2: Circuit open → cache
    { when: { circuitOpen: true }, upstream: cacheUpstream },
    
    // Priority 3: Rate limited → cache
    { when: { rateLimited: true }, upstream: cacheUpstream },
    
    // Priority 4: Errors → backup
    { when: { errorRateThreshold: 0.1 }, upstream: backupUpstream },
    
    // Priority 5: Everything failed → graceful degradation
    { when: { statusCode: [500, 502, 503, 504] }, upstream: degradedResponse },
  ],
}
```

### Response Headers (Extended)

Extended headers for behavioral fallbacks:

```
X-Fallback-Source: cache
X-Fallback-Reason: max_latency_exceeded
X-Latency-Original: 450ms
X-Latency-Budget-Remaining: 50ms
X-Error-Rate: 12%
X-Concurrent-Requests: 87
```

## Open Questions

1. **Execution order**: Should fallbacks with `circuitOpen` be checked before the upstream is even called (fail-fast), or only after the upstream returns a 5xx?

2. **Naming**: Should upstreams be named so they can be referenced in `when.upstream`? Currently they're anonymous.

3. **Retry integration**: Should the retry policy execute before or after fallback evaluation? (Currently retry is a policy at priority 90.)

4. **Response merging**: Should fallback responses merge headers from the failed upstream, replace them, or use their own?

5. **Metrics**: How should fallback invocations be tracked in metrics? As separate requests? As a tag on the primary request?

6. **Latency measurement**: When exactly is latency measured? At first byte (TTFB)? At complete response? Does this vary by upstream type?

7. **Staleness metadata**: When serving stale data, what metadata should be included? Timestamp of cached data? How old? How does the client interpret this?

8. **Fallback loop prevention**: If fallback A → fallback B → fallback A, how do we prevent infinite loops? Max fallback depth?

9. **Caching integration**: How does the fallback system interact with the existing cache policy? Is fallback upstream the same as cache upstream?

10. **Budget concept**: Should latency budgets be configurable per-route, global, or derived from client hints (`Server-Timing`)?

## Implementation Phases

### Phase 1: Core Fallback Logic
- Add `FallbackConfig` and `FallbackCondition` types
- Implement fallback evaluation in the pipeline executor
- Add response headers for fallback metadata
- Support statusCode, error, upstream matching

### Phase 2: Circuit Breaker Integration
- Pass circuit breaker state to fallback evaluator
- Support `when: { circuitOpen: true }`

### Phase 3: Latency-Based Fallback
- Measure downstream latency at runtime
- Support `when: { maxLatencyMs: number }`
- Implement proactive "fast fail" before SLA breach

### Phase 4: Rate Limit & Error Rate
- Handle 429 responses with fallback
- Track error rate per upstream
- Support `when: { errorRateThreshold: number }`

### Phase 5: Content & Auth Validation
- Content-type mismatch detection
- Empty response detection
- 401 handling with token refresh

### Phase 6: Metrics & Observability
- Track fallback invocations
- Add fallback info to request logs
- Dashboard for fallback triggers

### Phase 7: Developer Experience
- Add TypeScript examples to documentation
- Visual debug output for fallback chain
- Playground/tester for fallback conditions

## Related

- Existing `circuitBreaker` policy: `src/policies/resilience/circuit-breaker.ts`
- Current `PipelineConfig`: `src/core/types.ts`
- Upstream resolution: `src/core/pipeline.ts`
