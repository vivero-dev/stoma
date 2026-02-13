---
editUrl: false
next: false
prev: false
title: "RequestLogConfig"
---

Defined in: [packages/stoma/src/policies/observability/request-log.ts:11](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/observability/request-log.ts#L11)

Configuration for the requestLog policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### extractFields()?

> `optional` **extractFields**: (`c`) => `Record`\<`string`, `unknown`\>

Defined in: [packages/stoma/src/policies/observability/request-log.ts:13](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/observability/request-log.ts#L13)

Additional fields to extract from the request

#### Parameters

##### c

`unknown`

#### Returns

`Record`\<`string`, `unknown`\>

***

### ipHeaders?

> `optional` **ipHeaders**: `string`[]

Defined in: [packages/stoma/src/policies/observability/request-log.ts:17](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/observability/request-log.ts#L17)

Ordered list of headers to inspect for the client IP. Default: `["cf-connecting-ip", "x-forwarded-for"]`.

***

### logRequestBody?

> `optional` **logRequestBody**: `boolean`

Defined in: [packages/stoma/src/policies/observability/request-log.ts:19](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/observability/request-log.ts#L19)

Log request body (opt-in). Default: `false`.

***

### logResponseBody?

> `optional` **logResponseBody**: `boolean`

Defined in: [packages/stoma/src/policies/observability/request-log.ts:21](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/observability/request-log.ts#L21)

Log response body (opt-in). Default: `false`.

***

### maxBodyLength?

> `optional` **maxBodyLength**: `number`

Defined in: [packages/stoma/src/policies/observability/request-log.ts:23](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/observability/request-log.ts#L23)

Maximum body size in bytes to capture. Default: `8192`.

***

### redactPaths?

> `optional` **redactPaths**: `string`[]

Defined in: [packages/stoma/src/policies/observability/request-log.ts:25](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/observability/request-log.ts#L25)

JSON field paths to redact from logged bodies (e.g., `["password", "*.secret"]`).

***

### sink()?

> `optional` **sink**: (`entry`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/stoma/src/policies/observability/request-log.ts:15](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/observability/request-log.ts#L15)

Custom log sink — defaults to console.log with structured JSON

#### Parameters

##### entry

[`LogEntry`](/api/policies/interfaces/logentry/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/stoma/src/policies/types.ts:33](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/types.ts#L33)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)
