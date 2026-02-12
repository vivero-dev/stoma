---
editUrl: false
next: false
prev: false
title: "definePolicy"
---

> **definePolicy**\<`TConfig`\>(`definition`): (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: src/policies/sdk/define-policy.ts:92

Create a policy factory from a declarative definition.

The returned factory function accepts optional user config, merges it
with defaults, wires up skip logic, and injects a debug logger at
request time.

## Type Parameters

### TConfig

`TConfig` *extends* [`PolicyConfig`](/api/index/interfaces/policyconfig/) = [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Parameters

### definition

[`PolicyDefinition`](/api/index/interfaces/policydefinition/)\<`TConfig`\>

Policy name, priority, defaults, and handler.

## Returns

A factory function: `(config?) => Policy`.

> (`config?`): [`Policy`](/api/index/interfaces/policy/)

### Parameters

#### config?

`TConfig`

### Returns

[`Policy`](/api/index/interfaces/policy/)

## Example

```ts
import { definePolicy, Priority } from "@homegrower-club/stoma";

const myPolicy = definePolicy<MyConfig>({
  name: "my-policy",
  priority: Priority.AUTH,
  defaults: { headerName: "x-custom" },
  handler: async (c, next, { config, debug }) => {
    debug("checking header");
    const value = c.req.header(config.headerName!);
    if (!value) throw new GatewayError(401, "unauthorized", "Missing header");
    await next();
  },
});

// Usage: myPolicy({ headerName: "x-api-key" })
```
