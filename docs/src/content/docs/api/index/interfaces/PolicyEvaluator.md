---
editUrl: false
next: false
prev: false
title: "PolicyEvaluator"
---

Defined in: [src/core/protocol.ts:305](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/core/protocol.ts#L305)

Protocol-agnostic policy evaluation entry point.

Implement this on a [Policy](/api/index/interfaces/policy/) to make it work across all runtimes
(HTTP, ext_proc, WebSocket). The HTTP runtime uses [Policy.handler](/api/index/interfaces/policy/#handler)
directly — `evaluate` is consumed by non-HTTP runtimes.

Runtimes call `onRequest` for request-phase processing and `onResponse`
for response-phase processing. A policy can implement one or both.

## Example

```ts
// Protocol-agnostic JWT verification
const evaluator: PolicyEvaluator = {
  onRequest: async (input, ctx) => {
    const auth = input.headers.get("authorization");
    if (!auth) return { action: "reject", status: 401, code: "unauthorized", message: "Missing token" };
    // ... verify token ...
    return { action: "continue", mutations: [
      { type: "header", op: "set", name: "x-user-id", value: claims.sub },
    ]};
  },
};
```

## Properties

### onRequest()?

> `optional` **onRequest**: (`input`, `ctx`) => `Promise`\<[`PolicyResult`](/api/index/type-aliases/policyresult/)\>

Defined in: [src/core/protocol.ts:311](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/core/protocol.ts#L311)

Evaluate during request processing phases.

Called for: `request-headers`, `request-body`, `request-trailers`.

#### Parameters

##### input

[`PolicyInput`](/api/index/interfaces/policyinput/)

##### ctx

[`PolicyEvalContext`](/api/index/interfaces/policyevalcontext/)

#### Returns

`Promise`\<[`PolicyResult`](/api/index/type-aliases/policyresult/)\>

***

### onResponse()?

> `optional` **onResponse**: (`input`, `ctx`) => `Promise`\<[`PolicyResult`](/api/index/type-aliases/policyresult/)\>

Defined in: [src/core/protocol.ts:321](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/core/protocol.ts#L321)

Evaluate during response processing phases.

Called for: `response-headers`, `response-body`, `response-trailers`.

#### Parameters

##### input

[`PolicyInput`](/api/index/interfaces/policyinput/)

##### ctx

[`PolicyEvalContext`](/api/index/interfaces/policyevalcontext/)

#### Returns

`Promise`\<[`PolicyResult`](/api/index/type-aliases/policyresult/)\>
