---
editUrl: false
next: false
prev: false
title: "timingSafeEqual"
---

> **timingSafeEqual**(`a`, `b`): `boolean`

Defined in: [packages/gateway/src/utils/timing-safe.ts:30](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/utils/timing-safe.ts#L30)

Compare two strings in constant time.

Returns `true` if `a` and `b` are identical, `false` otherwise.
The comparison always examines every byte of the longer string,
preventing timing side-channels that leak prefix information.

## Parameters

### a

`string`

First string to compare.

### b

`string`

Second string to compare.

## Returns

`boolean`

`true` if the strings are identical.

## Example

```ts
import { timingSafeEqual } from "@vivero/stoma";

// Use in API key validators to prevent timing attacks
const isValid = timingSafeEqual(providedKey, storedKey);
```
