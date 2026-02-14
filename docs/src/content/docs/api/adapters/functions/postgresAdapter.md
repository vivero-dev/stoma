---
editUrl: false
next: false
prev: false
title: "postgresAdapter"
---

> **postgresAdapter**(`config`): [`GatewayAdapter`](/api/index/interfaces/gatewayadapter/)

Defined in: [src/adapters/postgres.ts:380](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/adapters/postgres.ts#L380)

Create a [GatewayAdapter](/api/index/interfaces/gatewayadapter/) using PostgreSQL-backed stores.

Before using, create the required tables by running [POSTGRES\_SCHEMA\_SQL](/api/adapters/variables/postgres_schema_sql/)
against your database.

## Parameters

### config

[`PostgresAdapterConfig`](/api/adapters/interfaces/postgresadapterconfig/)

## Returns

[`GatewayAdapter`](/api/index/interfaces/gatewayadapter/)

## Example

```ts
import { Pool } from "pg";
import { postgresAdapter, POSTGRES_SCHEMA_SQL } from "@homegrower-club/stoma/adapters/postgres";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await pool.query(POSTGRES_SCHEMA_SQL); // one-time setup

const adapter = postgresAdapter({ client: pool });
createGateway({ adapter, ... });
```
