---
editUrl: false
next: false
prev: false
title: "RbacConfig"
---

Defined in: [packages/stoma/src/policies/auth/rbac.ts:13](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/rbac.ts#L13)

Configuration for the rbac policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### denyMessage?

> `optional` **denyMessage**: `string`

Defined in: [packages/stoma/src/policies/auth/rbac.ts:27](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/rbac.ts#L27)

Custom deny message. Default: "Access denied: insufficient permissions".

***

### permissionDelimiter?

> `optional` **permissionDelimiter**: `string`

Defined in: [packages/stoma/src/policies/auth/rbac.ts:23](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/rbac.ts#L23)

Delimiter for permission string. Default: ",".

***

### permissionHeader?

> `optional` **permissionHeader**: `string`

Defined in: [packages/stoma/src/policies/auth/rbac.ts:21](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/rbac.ts#L21)

Header containing permissions. Default: "x-user-permissions".

***

### permissions?

> `optional` **permissions**: `string`[]

Defined in: [packages/stoma/src/policies/auth/rbac.ts:19](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/rbac.ts#L19)

Required permissions — pass if user has ALL of these.

***

### roleDelimiter?

> `optional` **roleDelimiter**: `string`

Defined in: [packages/stoma/src/policies/auth/rbac.ts:25](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/rbac.ts#L25)

Delimiter for role string. Default: ",".

***

### roleHeader?

> `optional` **roleHeader**: `string`

Defined in: [packages/stoma/src/policies/auth/rbac.ts:15](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/rbac.ts#L15)

Header name containing the user's role(s). Default: "x-user-role".

***

### roles?

> `optional` **roles**: `string`[]

Defined in: [packages/stoma/src/policies/auth/rbac.ts:17](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/rbac.ts#L17)

Allowed roles — pass if user has ANY of these.

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
