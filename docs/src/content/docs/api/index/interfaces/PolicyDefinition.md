---
editUrl: false
next: false
prev: false
title: "PolicyDefinition"
---

Defined in: [packages/gateway/src/policies/sdk/define-policy.ts:60](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/define-policy.ts#L60)

Declarative policy definition passed to [definePolicy](/api/index/functions/definepolicy/).

## Type Parameters

### TConfig

`TConfig` *extends* [`PolicyConfig`](/api/index/interfaces/policyconfig/) = [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### defaults?

> `optional` **defaults**: `Partial`\<`TConfig`\>

Defined in: [packages/gateway/src/policies/sdk/define-policy.ts:66](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/define-policy.ts#L66)

Default values for optional config fields.

***

### evaluate?

> `optional` **evaluate**: `object`

Defined in: [packages/gateway/src/policies/sdk/define-policy.ts:114](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/define-policy.ts#L114)

Protocol-agnostic evaluator for multi-runtime policies.

Used by non-HTTP runtimes (ext_proc, WebSocket). The HTTP runtime
uses [handler](/api/index/interfaces/policydefinition/#handler) and ignores this field.

Implement this alongside `handler` to make a policy work across
all runtimes. The `config` is pre-merged and injected into
[PolicyEvalHandlerContext](/api/index/interfaces/policyevalhandlercontext/).

#### onRequest()?

> `optional` **onRequest**: (`input`, `ctx`) => `Promise`\<[`PolicyResult`](/api/index/type-aliases/policyresult/)\>

##### Parameters

###### input

[`PolicyInput`](/api/index/interfaces/policyinput/)

###### ctx

[`PolicyEvalHandlerContext`](/api/index/interfaces/policyevalhandlercontext/)\<`TConfig`\>

##### Returns

`Promise`\<[`PolicyResult`](/api/index/type-aliases/policyresult/)\>

#### onResponse()?

> `optional` **onResponse**: (`input`, `ctx`) => `Promise`\<[`PolicyResult`](/api/index/type-aliases/policyresult/)\>

##### Parameters

###### input

[`PolicyInput`](/api/index/interfaces/policyinput/)

###### ctx

[`PolicyEvalHandlerContext`](/api/index/interfaces/policyevalhandlercontext/)\<`TConfig`\>

##### Returns

`Promise`\<[`PolicyResult`](/api/index/type-aliases/policyresult/)\>

#### Example

```ts
const myPolicy = definePolicy<MyConfig>({
  name: "my-policy",
  priority: Priority.AUTH,
  phases: ["request-headers"],
  handler: async (c, next, { config }) => { ... },
  evaluate: {
    onRequest: async (input, { config }) => {
      const token = input.headers.get("authorization");
      if (!token) return { action: "reject", status: 401, code: "unauthorized", message: "Missing" };
      return { action: "continue" };
    },
  },
});
```

***

### handler()

> **handler**: (`c`, `next`, `ctx`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/gateway/src/policies/sdk/define-policy.ts:81](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/define-policy.ts#L81)

The HTTP policy handler. Receives the Hono context, `next`, and a
[PolicyHandlerContext](/api/index/interfaces/policyhandlercontext/) with config, debug, and gateway context.

Used by the HTTP runtime ([createGateway](/api/index/functions/creategateway/)).

#### Parameters

##### c

`Context`

##### next

`Next`

##### ctx

[`PolicyHandlerContext`](/api/index/interfaces/policyhandlercontext/)\<`TConfig`\>

#### Returns

`void` \| `Promise`\<`void`\>

***

### httpOnly?

> `optional` **httpOnly**: `true`

Defined in: [packages/gateway/src/policies/sdk/define-policy.ts:145](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/define-policy.ts#L145)

Set to `true` for policies that only work with the HTTP protocol.

These policies rely on HTTP-specific concepts (Request/Response objects,
specific headers, HTTP status codes, etc.) and cannot be meaningfully
evaluated in other protocols like ext_proc or WebSocket.

When set, this is passed through to the returned Policy's `httpOnly` property.

***

### name

> **name**: `string`

Defined in: [packages/gateway/src/policies/sdk/define-policy.ts:62](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/define-policy.ts#L62)

Unique policy name (e.g. `"my-auth"`, `"custom-cache"`).

***

### phases?

> `optional` **phases**: [`ProcessingPhase`](/api/index/type-aliases/processingphase/)[]

Defined in: [packages/gateway/src/policies/sdk/define-policy.ts:134](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/define-policy.ts#L134)

Processing phases this policy participates in.

Used by phase-based runtimes (ext_proc) to skip policies that
don't apply to the current phase. Passed through to the
returned [Policy.phases](/api/index/interfaces/policy/#phases).

Default: `["request-headers"]`.

***

### priority?

> `optional` **priority**: `number`

Defined in: [packages/gateway/src/policies/sdk/define-policy.ts:64](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/define-policy.ts#L64)

Execution priority. Use [Priority](/api/index/variables/priority/) constants. Default: `Priority.DEFAULT` (100).

***

### validate()?

> `optional` **validate**: (`config`) => `void`

Defined in: [packages/gateway/src/policies/sdk/define-policy.ts:74](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/define-policy.ts#L74)

Optional construction-time config validation.

Called once when the factory is invoked (before any requests).
Throw a [GatewayError](/api/index/classes/gatewayerror/) to reject invalid config eagerly
rather than failing on the first request.

#### Parameters

##### config

`TConfig`

#### Returns

`void`
