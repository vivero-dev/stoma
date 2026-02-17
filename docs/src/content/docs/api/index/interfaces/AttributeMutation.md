---
editUrl: false
next: false
prev: false
title: "AttributeMutation"
---

Defined in: [packages/gateway/src/core/protocol.ts:249](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L249)

Set a cross-policy attribute.

Downstream policies see this value in [PolicyInput.attributes](/api/index/interfaces/policyinput/#attributes).
In ext_proc, this maps to Envoy dynamic metadata.

## Properties

### key

> **key**: `string`

Defined in: [packages/gateway/src/core/protocol.ts:252](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L252)

Attribute key. Use namespaced keys (e.g. `"auth.user_id"`) to avoid collisions.

***

### type

> **type**: `"attribute"`

Defined in: [packages/gateway/src/core/protocol.ts:250](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L250)

***

### value

> **value**: `unknown`

Defined in: [packages/gateway/src/core/protocol.ts:254](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L254)

Attribute value.
