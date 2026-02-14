---
editUrl: false
next: false
prev: false
title: "safeCall"
---

> **safeCall**\<`T`\>(`fn`, `fallback`, `debug?`, `label?`): `Promise`\<`T`\>

Defined in: [src/policies/sdk/helpers.ts:107](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/policies/sdk/helpers.ts#L107)

Execute an async operation with graceful error handling.

Designed for store-backed policies (cache, rate-limit, circuit-breaker)
where a store failure should degrade gracefully — not crash the request.
Returns the `fallback` value if `fn` throws.

## Type Parameters

### T

`T`

## Parameters

### fn

() => `Promise`\<`T`\>

The async operation to attempt.

### fallback

`T`

Value to return if `fn` throws.

### debug?

[`DebugLogger`](/api/index/type-aliases/debuglogger/)

Optional debug logger for error reporting.

### label?

`string`

Optional label for the debug message (e.g. `"store.get()"`).

## Returns

`Promise`\<`T`\>

The result of `fn`, or `fallback` on error.

## Example

```ts
const cached = await safeCall(
  () => store.get(key),
  null,
  debug,
  "store.get()",
);
```
