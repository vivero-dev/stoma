---
editUrl: false
next: false
prev: false
title: "GatewayError"
---

Defined in: [packages/gateway/src/core/errors.ts:27](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/errors.ts#L27)

Structured gateway error with HTTP status code, machine-readable code,
and optional response headers (e.g. `Retry-After`, `X-RateLimit-*`).

Throw this from policies or handlers to produce a structured JSON error
response. The gateway error handler catches it automatically.

## Example

```ts
throw new GatewayError(429, "rate_limited", "Too many requests", {
  "retry-after": "60",
});
// Produces: { "error": "rate_limited", "message": "Too many requests", "statusCode": 429 }
```

## Extends

- `Error`

## Constructors

### Constructor

> **new GatewayError**(`statusCode`, `code`, `message`, `headers?`): `GatewayError`

Defined in: [packages/gateway/src/core/errors.ts:33](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/errors.ts#L33)

#### Parameters

##### statusCode

`number`

##### code

`string`

##### message

`string`

##### headers?

`Record`\<`string`, `string`\>

#### Returns

`GatewayError`

#### Overrides

`Error.constructor`

## Properties

### cause?

> `optional` **cause**: `unknown`

Defined in: docs/node\_modules/typescript/lib/lib.es2022.error.d.ts:26

#### Inherited from

`Error.cause`

***

### code

> `readonly` **code**: `string`

Defined in: [packages/gateway/src/core/errors.ts:29](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/errors.ts#L29)

***

### headers?

> `readonly` `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [packages/gateway/src/core/errors.ts:31](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/errors.ts#L31)

Optional headers to include in the error response (e.g. rate-limit headers)

***

### message

> **message**: `string`

Defined in: docs/node\_modules/typescript/lib/lib.es5.d.ts:1077

#### Inherited from

`Error.message`

***

### name

> **name**: `string`

Defined in: docs/node\_modules/typescript/lib/lib.es5.d.ts:1076

#### Inherited from

`Error.name`

***

### stack?

> `optional` **stack**: `string`

Defined in: docs/node\_modules/typescript/lib/lib.es5.d.ts:1078

#### Inherited from

`Error.stack`

***

### statusCode

> `readonly` **statusCode**: `number`

Defined in: [packages/gateway/src/core/errors.ts:28](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/errors.ts#L28)
