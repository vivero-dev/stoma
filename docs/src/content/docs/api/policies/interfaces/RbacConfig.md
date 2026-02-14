---
editUrl: false
next: false
prev: false
title: "RbacConfig"
---

Defined in: [src/policies/auth/rbac.ts:14](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/rbac.ts#L14)

Configuration for the rbac policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### denyMessage?

> `optional` **denyMessage**: `string`

Defined in: [src/policies/auth/rbac.ts:28](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/rbac.ts#L28)

Custom deny message. Default: "Access denied: insufficient permissions".

***

### permissionDelimiter?

> `optional` **permissionDelimiter**: `string`

Defined in: [src/policies/auth/rbac.ts:24](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/rbac.ts#L24)

Delimiter for permission string. Default: ",".

***

### permissionHeader?

> `optional` **permissionHeader**: `string`

Defined in: [src/policies/auth/rbac.ts:22](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/rbac.ts#L22)

Header containing permissions. Default: "x-user-permissions".

***

### permissions?

> `optional` **permissions**: `string`[]

Defined in: [src/policies/auth/rbac.ts:20](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/rbac.ts#L20)

Required permissions — pass if user has ALL of these.

***

### roleDelimiter?

> `optional` **roleDelimiter**: `string`

Defined in: [src/policies/auth/rbac.ts:26](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/rbac.ts#L26)

Delimiter for role string. Default: ",".

***

### roleHeader?

> `optional` **roleHeader**: `string`

Defined in: [src/policies/auth/rbac.ts:16](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/rbac.ts#L16)

Header name containing the user's role(s). Default: "x-user-role".

***

### roles?

> `optional` **roles**: `string`[]

Defined in: [src/policies/auth/rbac.ts:18](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/auth/rbac.ts#L18)

Allowed roles — pass if user has ANY of these.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:69](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L69)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)
