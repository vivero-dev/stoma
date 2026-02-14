---
editUrl: false
next: false
prev: false
title: "retry"
---

> **retry**(`config?`): [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/resilience/retry.ts:86](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/resilience/retry.ts#L86)

Retry failed upstream calls with configurable backoff.

After `next()` completes, checks the response status against `retryOn`
codes. If a retry is warranted and a `_proxyRequest` is available on the
context (set by `createUrlUpstream()` in `gateway.ts`), the policy clones
the stored request and calls `fetch()` directly - fully concurrency-safe
with no `globalThis.fetch` patching.

For handler-based or service-binding upstreams (no `_proxyRequest`), the
retry policy is a no-op since there is no stored request to re-issue.
Sets `X-Retry-Count` on the response when retries occur.

## Parameters

### config?

[`RetryConfig`](/api/policies/interfaces/retryconfig/)

Retry limits, backoff strategy, and retryable status codes.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 90 (runs late, wraps the upstream fetch).

## Example

```ts
// Retry 502/503/504 up to 3 times with exponential backoff
retry();

// Fixed 500ms delay, retry on 500 too
retry({
  maxRetries: 2,
  retryOn: [500, 502, 503, 504],
  backoff: "fixed",
  baseDelayMs: 500,
});
```
