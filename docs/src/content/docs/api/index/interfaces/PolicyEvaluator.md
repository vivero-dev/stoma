---
editUrl: false
next: false
prev: false
title: "PolicyEvaluator"
---

Defined in: [src/core/protocol.ts:317](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/core/protocol.ts#L317)

Current `evaluate` coverage across policy categories:
- auth: 6/9 (jwt-auth, api-key-auth, basic-auth, oauth2, rbac, jws)
- traffic: 5/13 (rate-limit, ip-filter, cache, geo-ip-filter, ssl-enforce)
- transform: 5/7 (cors, assign-attributes, assign-content, request-transform, response-transform)
- observability: 0/4
- resilience: 0/4

Total: 16/38 policies have evaluate support. The remaining policies
will gain evaluate implementations as non-HTTP runtimes (ext_proc, WebSocket)
are built out. See PLAN.md Phase 5 for the ext_proc roadmap.

## Properties

### onRequest()?

> `optional` **onRequest**: (`input`, `ctx`) => `Promise`\<[`PolicyResult`](/api/index/type-aliases/policyresult/)\>

Defined in: [src/core/protocol.ts:323](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/core/protocol.ts#L323)

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

Defined in: [src/core/protocol.ts:333](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/core/protocol.ts#L333)

Evaluate during response processing phases.

Called for: `response-headers`, `response-body`, `response-trailers`.

#### Parameters

##### input

[`PolicyInput`](/api/index/interfaces/policyinput/)

##### ctx

[`PolicyEvalContext`](/api/index/interfaces/policyevalcontext/)

#### Returns

`Promise`\<[`PolicyResult`](/api/index/type-aliases/policyresult/)\>
