---
editUrl: false
next: false
prev: false
title: "SslEnforceConfig"
---

Defined in: [packages/gateway/src/policies/traffic/ssl-enforce.ts:11](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/ssl-enforce.ts#L11)

Configuration for the sslEnforce policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### hstsMaxAge?

> `optional` **hstsMaxAge**: `number`

Defined in: [packages/gateway/src/policies/traffic/ssl-enforce.ts:15](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/ssl-enforce.ts#L15)

HSTS max-age in seconds. Default: 31536000 (1 year).

***

### includeSubDomains?

> `optional` **includeSubDomains**: `boolean`

Defined in: [packages/gateway/src/policies/traffic/ssl-enforce.ts:17](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/ssl-enforce.ts#L17)

Add includeSubDomains to HSTS header. Default: false.

***

### preload?

> `optional` **preload**: `boolean`

Defined in: [packages/gateway/src/policies/traffic/ssl-enforce.ts:19](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/ssl-enforce.ts#L19)

Add preload to HSTS header. Default: false.

***

### redirect?

> `optional` **redirect**: `boolean`

Defined in: [packages/gateway/src/policies/traffic/ssl-enforce.ts:13](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/ssl-enforce.ts#L13)

Redirect HTTP to HTTPS (301). If false, block with 403. Default: true.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L90)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)
