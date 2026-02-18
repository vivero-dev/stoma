---
editUrl: false
next: false
prev: false
title: "regexThreatProtection"
---

> `const` **regexThreatProtection**: (`config`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/traffic/regex-threat-protection.ts:96](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/traffic/regex-threat-protection.ts#L96)

Regex threat protection policy.

Scans request path, query string, headers, and/or body against
configurable regex patterns. Throws a 400 GatewayError on first match.

## Parameters

### config

[`RegexThreatProtectionConfig`](/api/policies/interfaces/regexthreatprotectionconfig/)

## Returns

[`Policy`](/api/index/interfaces/policy/)

## Security

User-provided regex patterns can cause catastrophic backtracking
(ReDoS) if they contain nested quantifiers or overlapping alternations
(e.g. `(a+)+`, `(a|a)*b`). A crafted input string can cause the regex
engine to run in exponential time, blocking the worker thread and
effectively denying service. All patterns should be reviewed for
super-linear time complexity before deployment. Consider using atomic
patterns, possessive quantifiers (where supported), or testing patterns
with a ReDoS detection tool.

## Example

```ts
import { regexThreatProtection } from "@vivero/stoma";

regexThreatProtection({
  patterns: [
    { regex: "(union|select|insert|delete|drop)\\s", targets: ["path", "query", "body"], message: "SQL injection detected" },
    { regex: "<script[^>]*>", targets: ["body", "headers"], message: "XSS detected" },
  ],
});
```
