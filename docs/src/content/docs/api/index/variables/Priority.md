---
editUrl: false
next: false
prev: false
title: "Priority"
---

> `const` **Priority**: `object`

Defined in: [packages/gateway/src/policies/sdk/priority.ts:10](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/priority.ts#L10)

## Type Declaration

### AUTH

> `readonly` **AUTH**: `10` = `10`

Authentication (e.g. jwtAuth, apiKeyAuth, basicAuth)

### CACHE

> `readonly` **CACHE**: `40` = `40`

Caching - before upstream

### CIRCUIT\_BREAKER

> `readonly` **CIRCUIT\_BREAKER**: `30` = `30`

Circuit breaker - protects upstream

### DEFAULT

> `readonly` **DEFAULT**: `100` = `100`

Default priority for unspecified policies

### EARLY

> `readonly` **EARLY**: `5` = `5`

Early pipeline (e.g. cors) - before auth

### IP\_FILTER

> `readonly` **IP\_FILTER**: `1` = `1`

IP filtering - runs before all other logic

### METRICS

> `readonly` **METRICS**: `1` = `1`

Metrics collection - just after observability

### MOCK

> `readonly` **MOCK**: `999` = `999`

Mock - terminal, replaces upstream

### OBSERVABILITY

> `readonly` **OBSERVABILITY**: `0` = `0`

Observability policies (e.g. requestLog) - wraps everything

### PROXY

> `readonly` **PROXY**: `95` = `95`

Proxy header manipulation - just before upstream

### RATE\_LIMIT

> `readonly` **RATE\_LIMIT**: `20` = `20`

Rate limiting - after auth

### REQUEST\_TRANSFORM

> `readonly` **REQUEST\_TRANSFORM**: `50` = `50`

Request header transforms - mid-pipeline

### RESPONSE\_TRANSFORM

> `readonly` **RESPONSE\_TRANSFORM**: `92` = `92`

Response header transforms - after upstream

### RETRY

> `readonly` **RETRY**: `90` = `90`

Retry - wraps upstream fetch

### TIMEOUT

> `readonly` **TIMEOUT**: `85` = `85`

Timeout - wraps upstream call
