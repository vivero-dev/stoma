---
editUrl: false
next: false
prev: false
title: "PolicyResult"
---

> **PolicyResult** = [`PolicyContinue`](/api/index/interfaces/policycontinue/) \| [`PolicyReject`](/api/index/interfaces/policyreject/) \| [`PolicyImmediateResponse`](/api/index/interfaces/policyimmediateresponse/)

Defined in: [src/core/protocol.ts:142](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/core/protocol.ts#L142)

The outcome of a policy evaluation. Discriminated on `action`.

- `"continue"` — Allow processing to continue, optionally with mutations.
- `"reject"` — Reject with a structured error response.
- `"immediate-response"` — Short-circuit with a complete non-error response.
