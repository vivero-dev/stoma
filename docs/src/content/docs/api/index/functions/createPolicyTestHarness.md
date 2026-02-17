---
editUrl: false
next: false
prev: false
title: "createPolicyTestHarness"
---

> **createPolicyTestHarness**(`policy`, `options?`): `object`

Defined in: [packages/gateway/src/policies/sdk/testing.ts:56](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/testing.ts#L56)

Create a minimal test app with a single policy, error handling,
gateway context injection, and a configurable upstream.

## Parameters

### policy

[`Policy`](/api/index/interfaces/policy/)

The policy instance to test.

### options?

[`PolicyTestHarnessOptions`](/api/index/interfaces/policytestharnessoptions/)

Optional upstream, path, and gateway name.

## Returns

An object with `request()`, `app`, and the `adapter` used.

### adapter

> **adapter**: [`TestAdapter`](/api/adapters/classes/testadapter/)

The adapter used by the harness. Call `adapter.waitAll()` to await background tasks.

### app

> **app**: `Hono`\<`BlankEnv`, `BlankSchema`, `"/"`\>

The underlying Hono app for advanced test scenarios.

### request()

> **request**: (`reqPath`, `init?`) => `Response` \| `Promise`\<`Response`\>

Make a test request through the policy pipeline.

#### Parameters

##### reqPath

`string`

##### init?

`RequestInit`\<`CfProperties`\<`unknown`\>\>

#### Returns

`Response` \| `Promise`\<`Response`\>

## Example

```ts
import { createPolicyTestHarness } from "@homegrower-club/stoma/policies";
import { myPolicy } from "./my-policy";

const { request, adapter } = createPolicyTestHarness(myPolicy({ max: 10 }));

it("should allow valid requests", async () => {
  const res = await request("/test");
  expect(res.status).toBe(200);
  // Await any background work (e.g. waitUntil)
  await adapter.waitAll();
});
```
