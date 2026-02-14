---
editUrl: false
next: false
prev: false
title: "ProcessingPhase"
---

> **ProcessingPhase** = `"request-headers"` \| `"request-body"` \| `"request-trailers"` \| `"response-headers"` \| `"response-body"` \| `"response-trailers"`

Defined in: [src/core/protocol.ts:46](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/core/protocol.ts#L46)

Lifecycle phases a policy can participate in.

Maps to:
- **HTTP**: `request-headers` → `request-body` → `response-headers` → `response-body`
  (trailers are N/A for HTTP/1.1; available in HTTP/2)
- **ext_proc**: All 6 phases — Envoy sends each as a `ProcessingRequest`
- **WebSocket**: `request-headers` (upgrade) → `request-body` (per-message)
