---
"@vivero/stoma": patch
---

Fix Content-Encoding/Content-Length mismatch on proxied upstream responses; enrich request logs with upstream target and client IP from socket

### Fixes

- **Stale encoding headers on URL and Service Binding upstreams**: The runtime's `fetch()` transparently decompresses gzip/deflate/br responses, but the gateway was forwarding the original `Content-Encoding` and `Content-Length` headers unchanged. Downstream clients (browsers, proxies) would then attempt to decompress an already-decoded body, resulting in `ERR_CONTENT_DECODING_FAILED` or `ERR_CONTENT_LENGTH_MISMATCH` errors. Both `createUrlUpstream` and `createServiceBindingUpstream` now strip `content-encoding` and `content-length` from upstream responses before returning them.
- **`upstream` always "unknown" in request logs**: The `request-log` policy hardcoded `upstream: "unknown"` because no upstream handler was setting the value. All three upstream types (`createUrlUpstream`, `createServiceBindingUpstream`, `createHandlerUpstream`) now set `c.set("_upstreamTarget", identifier)` with the full resolved URL (including rewritten path and query string), `"service-binding:<name>"`, or `"handler"` respectively.
- **`clientIp` always "unknown" when running locally**: `extractClientIp()` only checked HTTP headers (`cf-connecting-ip`, `x-forwarded-for`), which aren't present when running with `@hono/node-server` locally. Added a `fallbackAddress` option to `extractClientIp()` and a `getRemoteAddress()` helper in `request-log` that duck-types `c.env.incoming.socket.remoteAddress` from the Node.js adapter.
