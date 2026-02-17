---
editUrl: false
next: false
prev: false
title: "RbacConfig"
---

Defined in: [packages/gateway/src/policies/auth/rbac.ts:15](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/rbac.ts#L15)

Configuration for the rbac policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### denyMessage?

> `optional` **denyMessage**: `string`

Defined in: [packages/gateway/src/policies/auth/rbac.ts:29](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/rbac.ts#L29)

Custom deny message. Default: "Access denied: insufficient permissions".

***

### permissionDelimiter?

> `optional` **permissionDelimiter**: `string`

Defined in: [packages/gateway/src/policies/auth/rbac.ts:25](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/rbac.ts#L25)

Delimiter for permission string. Default: ",".

***

### permissionHeader?

> `optional` **permissionHeader**: `string`

Defined in: [packages/gateway/src/policies/auth/rbac.ts:23](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/rbac.ts#L23)

Header containing permissions. Default: "x-user-permissions".

***

### permissions?

> `optional` **permissions**: `string`[]

Defined in: [packages/gateway/src/policies/auth/rbac.ts:21](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/rbac.ts#L21)

Required permissions - pass if user has ALL of these.

***

### roleDelimiter?

> `optional` **roleDelimiter**: `string`

Defined in: [packages/gateway/src/policies/auth/rbac.ts:27](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/rbac.ts#L27)

Delimiter for role string. Default: ",".

***

### roleHeader?

> `optional` **roleHeader**: `string`

Defined in: [packages/gateway/src/policies/auth/rbac.ts:17](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/rbac.ts#L17)

Header name containing the user's role(s). Default: "x-user-role".

***

### roles?

> `optional` **roles**: `string`[]

Defined in: [packages/gateway/src/policies/auth/rbac.ts:19](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/rbac.ts#L19)

Allowed roles - pass if user has ANY of these.

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

***

### stripHeaders?

> `optional` **stripHeaders**: `boolean`

Defined in: [packages/gateway/src/policies/auth/rbac.ts:35](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/auth/rbac.ts#L35)

Strip role/permission headers from incoming requests for security.
These headers should only be set by trusted upstream auth policies,
not by external clients. Default: true.
