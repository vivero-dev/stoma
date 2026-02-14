---
editUrl: false
next: false
prev: false
title: "HealthConfig"
---

Defined in: [src/core/health.ts:8](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/core/health.ts#L8)

Configuration for the health route factory.

## Properties

### includeUpstreamStatus?

> `optional` **includeUpstreamStatus**: `boolean`

Defined in: [src/core/health.ts:14](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/core/health.ts#L14)

Include individual upstream statuses in response. Default: false.

***

### path?

> `optional` **path**: `string`

Defined in: [src/core/health.ts:10](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/core/health.ts#L10)

Health endpoint path. Default: "/health".

***

### probeMethod?

> `optional` **probeMethod**: `string`

Defined in: [src/core/health.ts:18](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/core/health.ts#L18)

HTTP method for upstream probes. Default: `"HEAD"`.

***

### probeTimeoutMs?

> `optional` **probeTimeoutMs**: `number`

Defined in: [src/core/health.ts:16](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/core/health.ts#L16)

Timeout in ms for each upstream probe. Default: 5000.

***

### unhealthyStatusCode?

> `optional` **unhealthyStatusCode**: `number`

Defined in: [src/core/health.ts:20](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/core/health.ts#L20)

Status code returned when all probes are unhealthy. Default: 503.

***

### upstreamProbes?

> `optional` **upstreamProbes**: `string`[]

Defined in: [src/core/health.ts:12](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/core/health.ts#L12)

URLs to probe for upstream health.
