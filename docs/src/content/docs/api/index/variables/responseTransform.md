---
editUrl: false
next: false
prev: false
title: "responseTransform"
---

> `const` **responseTransform**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/transform/transform.ts:150](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/policies/transform/transform.ts#L150)

Modify response headers after the upstream service returns.

Applies header transformations in order: rename → set → remove. Runs at
priority 92 (late in the pipeline) so it can modify headers set by the
upstream or earlier policies.

## Parameters

### config?

[`ResponseTransformConfig`](/api/policies/interfaces/responsetransformconfig/)

Header set/remove/rename operations. At least one should be provided.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 92 (runs late, after upstream responds).

## Example

```ts
import { responseTransform } from "@homegrower-club/stoma/policies";

// Add security headers and strip server info
responseTransform({
  setHeaders: {
    "strict-transport-security": "max-age=31536000; includeSubDomains",
    "x-content-type-options": "nosniff",
  },
  removeHeaders: ["server", "x-powered-by"],
});
```
