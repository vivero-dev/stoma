---
editUrl: false
next: false
prev: false
title: "HttpCalloutConfig"
---

Defined in: [src/policies/traffic/http-callout.ts:14](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/http-callout.ts#L14)

Configuration for the httpCallout policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### abortOnFailure?

> `optional` **abortOnFailure**: `boolean`

Defined in: [src/policies/traffic/http-callout.ts:30](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/http-callout.ts#L30)

If true, throw on non-2xx response. Default: true.

***

### body?

> `optional` **body**: `unknown`

Defined in: [src/policies/traffic/http-callout.ts:22](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/http-callout.ts#L22)

Request body — static or dynamic. JSON-serialized if object.

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string` \| (`c`) => `string` \| `Promise`\<`string`\>\>

Defined in: [src/policies/traffic/http-callout.ts:20](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/http-callout.ts#L20)

Request headers — static values or dynamic functions.

***

### method?

> `optional` **method**: `string`

Defined in: [src/policies/traffic/http-callout.ts:18](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/http-callout.ts#L18)

HTTP method. Default: "GET".

***

### onError()?

> `optional` **onError**: (`error`, `c`) => `void` \| `Promise`\<`void`\>

Defined in: [src/policies/traffic/http-callout.ts:28](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/http-callout.ts#L28)

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

Defined in: [src/policies/traffic/http-callout.ts:26](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/http-callout.ts#L26)

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

Defined in: [src/policies/types.ts:69](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/types.ts#L69)

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

Defined in: [src/policies/traffic/http-callout.ts:24](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/http-callout.ts#L24)

Timeout in ms. Default: 5000.

***

### url

> **url**: `string` \| (`c`) => `string` \| `Promise`\<`string`\>

Defined in: [src/policies/traffic/http-callout.ts:16](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/http-callout.ts#L16)

Target URL — static string or dynamic function. Required.
