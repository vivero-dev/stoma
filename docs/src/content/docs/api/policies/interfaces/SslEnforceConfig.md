---
editUrl: false
next: false
prev: false
title: "SslEnforceConfig"
---

Defined in: src/policies/traffic/ssl-enforce.ts:10

Configuration for the sslEnforce policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### hstsMaxAge?

> `optional` **hstsMaxAge**: `number`

Defined in: src/policies/traffic/ssl-enforce.ts:14

HSTS max-age in seconds. Default: 31536000 (1 year).

***

### includeSubDomains?

> `optional` **includeSubDomains**: `boolean`

Defined in: src/policies/traffic/ssl-enforce.ts:16

Add includeSubDomains to HSTS header. Default: false.

***

### preload?

> `optional` **preload**: `boolean`

Defined in: src/policies/traffic/ssl-enforce.ts:18

Add preload to HSTS header. Default: false.

***

### redirect?

> `optional` **redirect**: `boolean`

Defined in: src/policies/traffic/ssl-enforce.ts:12

Redirect HTTP to HTTPS (301). If false, block with 403. Default: true.

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
