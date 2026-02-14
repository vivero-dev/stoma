---
editUrl: false
next: false
prev: false
title: "KVRateLimitStore"
---

Defined in: [src/adapters/cloudflare.ts:12](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/adapters/cloudflare.ts#L12)

Rate limit store backed by Cloudflare Workers KV.

## Implements

- [`RateLimitStore`](/api/index/interfaces/ratelimitstore/)

## Constructors

### Constructor

> **new KVRateLimitStore**(`kv`): `KVRateLimitStore`

Defined in: [src/adapters/cloudflare.ts:13](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/adapters/cloudflare.ts#L13)

#### Parameters

##### kv

`KVNamespace`

#### Returns

`KVRateLimitStore`

## Methods

### increment()

> **increment**(`key`, `windowSeconds`): `Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>

Defined in: [src/adapters/cloudflare.ts:15](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/adapters/cloudflare.ts#L15)

Increment the counter for a key, returning the new count and TTL

#### Parameters

##### key

`string`

##### windowSeconds

`number`

#### Returns

`Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>

#### Implementation of

[`RateLimitStore`](/api/index/interfaces/ratelimitstore/).[`increment`](/api/index/interfaces/ratelimitstore/#increment)
