---
editUrl: false
next: false
prev: false
title: "RbacConfig"
---

Defined in: src/policies/auth/rbac.ts:13

Configuration for the rbac policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### denyMessage?

> `optional` **denyMessage**: `string`

Defined in: src/policies/auth/rbac.ts:27

Custom deny message. Default: "Access denied: insufficient permissions".

***

### permissionDelimiter?

> `optional` **permissionDelimiter**: `string`

Defined in: src/policies/auth/rbac.ts:23

Delimiter for permission string. Default: ",".

***

### permissionHeader?

> `optional` **permissionHeader**: `string`

Defined in: src/policies/auth/rbac.ts:21

Header containing permissions. Default: "x-user-permissions".

***

### permissions?

> `optional` **permissions**: `string`[]

Defined in: src/policies/auth/rbac.ts:19

Required permissions — pass if user has ALL of these.

***

### roleDelimiter?

> `optional` **roleDelimiter**: `string`

Defined in: src/policies/auth/rbac.ts:25

Delimiter for role string. Default: ",".

***

### roleHeader?

> `optional` **roleHeader**: `string`

Defined in: src/policies/auth/rbac.ts:15

Header name containing the user's role(s). Default: "x-user-role".

***

### roles?

> `optional` **roles**: `string`[]

Defined in: src/policies/auth/rbac.ts:17

Allowed roles — pass if user has ANY of these.

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
