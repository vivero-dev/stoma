---
editUrl: false
next: false
prev: false
title: "postgresAdapter"
---

> **postgresAdapter**(`config`): [`GatewayAdapter`](/api/index/interfaces/gatewayadapter/)

Defined in: [packages/gateway/src/adapters/postgres.ts:387](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L387)

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
