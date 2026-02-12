---
editUrl: false
next: false
prev: false
title: "PolicyTestHarnessOptions"
---

Defined in: src/policies/sdk/testing.ts:18

## Properties

### adapter?

> `optional` **adapter**: [`TestAdapter`](/api/adapters/classes/testadapter/)

Defined in: src/policies/sdk/testing.ts:29

Custom adapter to use. If not provided, a [TestAdapter](/api/adapters/classes/testadapter/) is created.

***

### gatewayName?

> `optional` **gatewayName**: `string`

Defined in: src/policies/sdk/testing.ts:27

Gateway name injected into context. Default: `"test-gateway"`.

***

### path?

> `optional` **path**: `string`

Defined in: src/policies/sdk/testing.ts:25

Route path pattern for the test app. Default: `"/*"`.

***

### upstream?

> `optional` **upstream**: `MiddlewareHandler`

Defined in: src/policies/sdk/testing.ts:23

Custom upstream handler. Receives the Hono context after the policy
runs. Default: returns `{ ok: true }` with status 200.
