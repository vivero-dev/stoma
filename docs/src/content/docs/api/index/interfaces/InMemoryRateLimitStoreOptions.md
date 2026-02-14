---
editUrl: false
next: false
prev: false
title: "InMemoryRateLimitStoreOptions"
---

Defined in: [src/policies/traffic/rate-limit.ts:41](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/traffic/rate-limit.ts#L41)

Default in-memory rate limit store

## Properties

### cleanupIntervalMs?

> `optional` **cleanupIntervalMs**: `number`

Defined in: [src/policies/traffic/rate-limit.ts:45](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/traffic/rate-limit.ts#L45)

Cleanup interval in ms for expired entries. Default: 60000.

***

### maxKeys?

> `optional` **maxKeys**: `number`

Defined in: [src/policies/traffic/rate-limit.ts:43](https://github.com/HomeGrower-club/stoma/blob/6293f5d254fea2989ebdf0b4b444e914a25475fc/src/policies/traffic/rate-limit.ts#L43)

Maximum number of unique keys to prevent memory exhaustion. Default: 100000.
