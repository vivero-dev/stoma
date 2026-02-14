---
editUrl: false
next: false
prev: false
title: "PolicyFactory"
---

> **PolicyFactory**\<`TConfig`\> = `RequiredKeys`\<`TConfig`\> *extends* `never` ? (`config?`) => [`Policy`](/api/index/interfaces/policy/) : (`config`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/sdk/define-policy.ts:167](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/policies/sdk/define-policy.ts#L167)

Conditional policy factory type.

When `TConfig` has at least one required key, the factory requires
a config argument. When all keys are optional (or TConfig is the
base `PolicyConfig`), config is optional.

This closes the gap between "type-safe config" and the runtime
`validate` callback — the editor catches missing required fields
at compile time.

## Type Parameters

### TConfig

`TConfig` *extends* [`PolicyConfig`](/api/index/interfaces/policyconfig/)
