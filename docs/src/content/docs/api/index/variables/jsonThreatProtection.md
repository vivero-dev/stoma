---
editUrl: false
next: false
prev: false
title: "jsonThreatProtection"
---

> `const` **jsonThreatProtection**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/traffic/json-threat-protection.ts:119](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/json-threat-protection.ts#L119)

JSON threat protection policy.

Enforces structural limits on JSON request bodies to prevent abuse
from deeply nested objects, excessively large arrays, long strings,
or oversized payloads. Runs at EARLY priority to reject malicious
payloads before they reach business logic.

## Parameters

### config?

[`JsonThreatProtectionConfig`](/api/policies/interfaces/jsonthreatprotectionconfig/)

## Returns

[`Policy`](/api/index/interfaces/policy/)

## Example

```ts
import { jsonThreatProtection } from "@homegrower-club/stoma";

// Default limits (20 depth, 100 keys, 10K string, 100 array, 1MB body)
jsonThreatProtection();

// Strict limits for a public API
jsonThreatProtection({
  maxDepth: 5,
  maxKeys: 20,
  maxStringLength: 1000,
  maxArraySize: 50,
  maxBodySize: 102400, // 100KB
});
```
