---
editUrl: false
next: false
prev: false
title: "withSkip"
---

> **withSkip**(`skipFn`, `handler`): `MiddlewareHandler`

Defined in: [packages/gateway/src/policies/sdk/helpers.ts:68](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/helpers.ts#L68)

Wrap a middleware handler with skip logic.

If `skipFn` is undefined, returns the original handler unchanged
(zero overhead). Otherwise wraps it: when `skipFn(c)` returns `true`,
calls `next()` without running the handler.

This implements the `PolicyConfig.skip` feature that was defined in
types but never enforced at runtime.

## Parameters

### skipFn

Optional predicate from `PolicyConfig.skip`.

(`c`) => `boolean` \| `Promise`\<`boolean`\> | `undefined`

### handler

`MiddlewareHandler`

The policy's middleware handler.

## Returns

`MiddlewareHandler`

The original handler or a skip-aware wrapper.
