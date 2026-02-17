---
editUrl: false
next: false
prev: false
title: "safeValidateConfig"
---

> **safeValidateConfig**(`config`): \{ `data`: [`GatewayConfig`](/api/index/interfaces/gatewayconfig/); `success`: `true`; \} \| \{ `error`: `ZodError`; `success`: `false`; \}

Defined in: [packages/gateway/src/config/schema.ts:168](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/config/schema.ts#L168)

Safely validate a gateway config, returning success/error without throwing.

## Parameters

### config

`unknown`

## Returns

\{ `data`: [`GatewayConfig`](/api/index/interfaces/gatewayconfig/); `success`: `true`; \} \| \{ `error`: `ZodError`; `success`: `false`; \}
