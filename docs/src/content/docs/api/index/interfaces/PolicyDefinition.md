---
editUrl: false
next: false
prev: false
title: "PolicyDefinition"
---

Defined in: [packages/stoma/src/policies/sdk/define-policy.ts:38](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/sdk/define-policy.ts#L38)

Declarative policy definition passed to [definePolicy](/api/index/functions/definepolicy/).

## Type Parameters

### TConfig

`TConfig` *extends* [`PolicyConfig`](/api/index/interfaces/policyconfig/) = [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### defaults?

> `optional` **defaults**: `Partial`\<`TConfig`\>

Defined in: [packages/stoma/src/policies/sdk/define-policy.ts:46](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/sdk/define-policy.ts#L46)

Default values for optional config fields.

***

### handler()

> **handler**: (`c`, `next`, `ctx`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/stoma/src/policies/sdk/define-policy.ts:59](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/sdk/define-policy.ts#L59)

The policy handler. Receives the Hono context, `next`, and a
[PolicyHandlerContext](/api/index/interfaces/policyhandlercontext/) with config, debug, and gateway context.

#### Parameters

##### c

`Context`

##### next

`Next`

##### ctx

[`PolicyHandlerContext`](/api/index/interfaces/policyhandlercontext/)\<`TConfig`\>

#### Returns

`void` \| `Promise`\<`void`\>

***

### name

> **name**: `string`

Defined in: [packages/stoma/src/policies/sdk/define-policy.ts:42](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/sdk/define-policy.ts#L42)

Unique policy name (e.g. `"my-auth"`, `"custom-cache"`).

***

### priority?

> `optional` **priority**: `number`

Defined in: [packages/stoma/src/policies/sdk/define-policy.ts:44](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/sdk/define-policy.ts#L44)

Execution priority. Use [Priority](/api/index/variables/priority/) constants. Default: `Priority.DEFAULT` (100).

***

### validate()?

> `optional` **validate**: (`config`) => `void`

Defined in: [packages/stoma/src/policies/sdk/define-policy.ts:54](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/sdk/define-policy.ts#L54)

Optional construction-time config validation.

Called once when the factory is invoked (before any requests).
Throw a [GatewayError](/api/index/classes/gatewayerror/) to reject invalid config eagerly
rather than failing on the first request.

#### Parameters

##### config

`TConfig`

#### Returns

`void`
