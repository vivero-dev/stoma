---
editUrl: false
next: false
prev: false
title: "definePolicy"
---

> **definePolicy**\<`TConfig`\>(`definition`): [`PolicyFactory`](/api/index/type-aliases/policyfactory/)\<`TConfig`\>

Defined in: [src/policies/sdk/define-policy.ts:204](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/policies/sdk/define-policy.ts#L204)

Create a policy factory from a declarative definition.

The returned factory function accepts user config, merges it with
defaults, wires up skip logic, and injects a debug logger at
request time.

When `TConfig` has required keys, the factory requires a config
argument. When all keys are optional, config is optional.

## Type Parameters

### TConfig

`TConfig` *extends* [`PolicyConfig`](/api/index/interfaces/policyconfig/) = [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Parameters

### definition

[`PolicyDefinition`](/api/index/interfaces/policydefinition/)\<`TConfig`\>

Policy name, priority, defaults, and handler.

## Returns

[`PolicyFactory`](/api/index/type-aliases/policyfactory/)\<`TConfig`\>

A factory function whose config parameter is required or optional based on TConfig.

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
