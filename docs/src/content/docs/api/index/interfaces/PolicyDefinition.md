---
editUrl: false
next: false
prev: false
title: "PolicyDefinition"
---

Defined in: src/policies/sdk/define-policy.ts:35

Declarative policy definition passed to [definePolicy](/api/index/functions/definepolicy/).

## Type Parameters

### TConfig

`TConfig` *extends* [`PolicyConfig`](/api/index/interfaces/policyconfig/) = [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### defaults?

> `optional` **defaults**: `Partial`\<`TConfig`\>

Defined in: src/policies/sdk/define-policy.ts:43

Default values for optional config fields.

***

### handler()

> **handler**: (`c`, `next`, `ctx`) => `void` \| `Promise`\<`void`\>

Defined in: src/policies/sdk/define-policy.ts:56

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

Defined in: src/policies/sdk/define-policy.ts:39

Unique policy name (e.g. `"my-auth"`, `"custom-cache"`).

***

### priority?

> `optional` **priority**: `number`

Defined in: src/policies/sdk/define-policy.ts:41

Execution priority. Use [Priority](/api/index/variables/priority/) constants. Default: `Priority.DEFAULT` (100).

***

### validate()?

> `optional` **validate**: (`config`) => `void`

Defined in: src/policies/sdk/define-policy.ts:51

Optional construction-time config validation.

Called once when the factory is invoked (before any requests).
Throw a [GatewayError](/api/index/classes/gatewayerror/) to reject invalid config eagerly
rather than failing on the first request.

#### Parameters

##### config

`TConfig`

#### Returns

`void`
