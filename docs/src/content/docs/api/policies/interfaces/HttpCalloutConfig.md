---
editUrl: false
next: false
prev: false
title: "HttpCalloutConfig"
---

Defined in: src/policies/traffic/http-callout.ts:14

Configuration for the httpCallout policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### abortOnFailure?

> `optional` **abortOnFailure**: `boolean`

Defined in: src/policies/traffic/http-callout.ts:30

If true, throw on non-2xx response. Default: true.

***

### body?

> `optional` **body**: `unknown`

Defined in: src/policies/traffic/http-callout.ts:22

Request body — static or dynamic. JSON-serialized if object.

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string` \| (`c`) => `string` \| `Promise`\<`string`\>\>

Defined in: src/policies/traffic/http-callout.ts:20

Request headers — static values or dynamic functions.

***

### method?

> `optional` **method**: `string`

Defined in: src/policies/traffic/http-callout.ts:18

HTTP method. Default: "GET".

***

### onError()?

> `optional` **onError**: (`error`, `c`) => `void` \| `Promise`\<`void`\>

Defined in: src/policies/traffic/http-callout.ts:28

Error handler. Default: throw GatewayError 502.

#### Parameters

##### error

`unknown`

##### c

`Context`

#### Returns

`void` \| `Promise`\<`void`\>

***

### onResponse()

> **onResponse**: (`response`, `c`) => `void` \| `Promise`\<`void`\>

Defined in: src/policies/traffic/http-callout.ts:26

Callback to process the callout response. Required.

#### Parameters

##### response

`Response`

##### c

`Context`

#### Returns

`void` \| `Promise`\<`void`\>

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

### timeout?

> `optional` **timeout**: `number`

Defined in: src/policies/traffic/http-callout.ts:24

Timeout in ms. Default: 5000.

***

### url

> **url**: `string` \| (`c`) => `string` \| `Promise`\<`string`\>

Defined in: src/policies/traffic/http-callout.ts:16

Target URL — static string or dynamic function. Required.
