---
editUrl: false
next: false
prev: false
title: "InterruptConfig"
---

Defined in: src/policies/traffic/interrupt.ts:10

Configuration for the interrupt policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### body?

> `optional` **body**: `unknown`

Defined in: src/policies/traffic/interrupt.ts:16

Response body. String → text/plain, object → application/json, undefined → empty.

***

### condition()

> **condition**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: src/policies/traffic/interrupt.ts:12

Predicate that determines whether to short-circuit. Required.

#### Parameters

##### c

`Context`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: src/policies/traffic/interrupt.ts:18

Additional response headers.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: src/policies/types.ts:33

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)

***

### statusCode?

> `optional` **statusCode**: `number`

Defined in: src/policies/traffic/interrupt.ts:14

HTTP status code for the interrupt response. Default: 200.
