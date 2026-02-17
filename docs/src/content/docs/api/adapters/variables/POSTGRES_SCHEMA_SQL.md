---
editUrl: false
next: false
prev: false
title: "POSTGRES_SCHEMA_SQL"
---

> `const` **POSTGRES\_SCHEMA\_SQL**: "\nCREATE TABLE IF NOT EXISTS stoma\_rate\_limits (\n  key TEXT PRIMARY KEY,\n  count INTEGER NOT NULL DEFAULT 0,\n  reset\_at BIGINT NOT NULL DEFAULT 0\n);\nCREATE INDEX IF NOT EXISTS idx\_stoma\_rate\_limits\_reset\_at ON stoma\_rate\_limits (reset\_at);\n\nCREATE TABLE IF NOT EXISTS stoma\_circuit\_breakers (\n  key TEXT PRIMARY KEY,\n  state TEXT NOT NULL DEFAULT 'closed',\n  failure\_count INTEGER NOT NULL DEFAULT 0,\n  success\_count INTEGER NOT NULL DEFAULT 0,\n  last\_failure\_time BIGINT NOT NULL DEFAULT 0,\n  last\_state\_change BIGINT NOT NULL DEFAULT 0\n);\n\nCREATE TABLE IF NOT EXISTS stoma\_cache (\n  key TEXT PRIMARY KEY,\n  status INTEGER NOT NULL,\n  headers JSONB NOT NULL DEFAULT '\[\]',\n  body TEXT NOT NULL DEFAULT '',\n  expires\_at BIGINT NOT NULL DEFAULT 0\n);\nCREATE INDEX IF NOT EXISTS idx\_stoma\_cache\_expires\_at ON stoma\_cache (expires\_at);\n"

Defined in: [packages/gateway/src/adapters/postgres.ts:67](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L67)

SQL to create the three stoma tables. Run this once against your database
before using the Postgres adapter. All statements use `IF NOT EXISTS` so
they're safe to re-run.

## Example

```ts
import { POSTGRES_SCHEMA_SQL } from "@homegrower-club/stoma/adapters/postgres";
await pool.query(POSTGRES_SCHEMA_SQL);
```
