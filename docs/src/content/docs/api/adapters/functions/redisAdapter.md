---
editUrl: false
next: false
prev: false
title: "redisAdapter"
---

> **redisAdapter**(`config`): [`GatewayAdapter`](/api/index/interfaces/gatewayadapter/)

Defined in: [src/adapters/redis.ts:367](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/adapters/redis.ts#L367)

Create a [GatewayAdapter](/api/index/interfaces/gatewayadapter/) using Redis-backed stores.

## Parameters

### config

[`RedisAdapterConfig`](/api/adapters/interfaces/redisadapterconfig/)

## Returns

[`GatewayAdapter`](/api/index/interfaces/gatewayadapter/)

## Examples

```ts
import Redis from "ioredis";
import { redisAdapter } from "@homegrower-club/stoma/adapters/redis";

const redis = new Redis();
const adapter = redisAdapter({ client: redis });

createGateway({ adapter, ... });
```

```ts
// node-redis v4 (different SET signature)
import { createClient } from "redis";
import { redisAdapter } from "@homegrower-club/stoma/adapters/redis";

const client = await createClient().connect();
const adapter = redisAdapter({
  client: client as any,
  setWithTTL: (c, k, v, ttl) => c.set(k, v, "EX", ttl),
});
```
