---
editUrl: false
next: false
prev: false
title: "ProcessingPhase"
---

> **ProcessingPhase** = `"request-headers"` \| `"request-body"` \| `"request-trailers"` \| `"response-headers"` \| `"response-body"` \| `"response-trailers"`

Defined in: [src/core/protocol.ts:46](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/core/protocol.ts#L46)

Lifecycle phases a policy can participate in.

Maps to:
- **HTTP**: `request-headers` → `request-body` → `response-headers` → `response-body`
  (trailers are N/A for HTTP/1.1; available in HTTP/2)
- **ext_proc**: All 6 phases — Envoy sends each as a `ProcessingRequest`
- **WebSocket**: `request-headers` (upgrade) → `request-body` (per-message)
