---
editUrl: false
next: false
prev: false
title: "InMemoryCacheStoreOptions"
---

Defined in: [packages/gateway/src/policies/traffic/cache.ts:53](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L53)

Options for the in-memory cache store.

## Properties

### maxEntries?

> `optional` **maxEntries**: `number`

Defined in: [packages/gateway/src/policies/traffic/cache.ts:55](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L55)

Maximum number of cached entries. When exceeded, the oldest entry is evicted (LRU).
