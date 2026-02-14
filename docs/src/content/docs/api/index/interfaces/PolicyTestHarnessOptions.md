---
editUrl: false
next: false
prev: false
title: "PolicyTestHarnessOptions"
---

Defined in: [src/policies/sdk/testing.ts:19](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/sdk/testing.ts#L19)

## Properties

### adapter?

> `optional` **adapter**: [`TestAdapter`](/api/adapters/classes/testadapter/)

Defined in: [src/policies/sdk/testing.ts:30](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/sdk/testing.ts#L30)

Custom adapter to use. If not provided, a [TestAdapter](/api/adapters/classes/testadapter/) is created.

***

### gatewayName?

> `optional` **gatewayName**: `string`

Defined in: [src/policies/sdk/testing.ts:28](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/sdk/testing.ts#L28)

Gateway name injected into context. Default: `"test-gateway"`.

***

### path?

> `optional` **path**: `string`

Defined in: [src/policies/sdk/testing.ts:26](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/sdk/testing.ts#L26)

Route path pattern for the test app. Default: `"/*"`.

***

### upstream?

> `optional` **upstream**: `MiddlewareHandler`

Defined in: [src/policies/sdk/testing.ts:24](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/sdk/testing.ts#L24)

Custom upstream handler. Receives the Hono context after the policy
runs. Default: returns `{ ok: true }` with status 200.
