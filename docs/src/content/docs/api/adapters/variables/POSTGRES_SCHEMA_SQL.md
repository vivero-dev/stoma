---
editUrl: false
next: false
prev: false
title: "POSTGRES_SCHEMA_SQL"
---

> `const` **POSTGRES\_SCHEMA\_SQL**: "\nCREATE TABLE IF NOT EXISTS stoma\_rate\_limits (\n  key TEXT PRIMARY KEY,\n  count INTEGER NOT NULL DEFAULT 0,\n  reset\_at BIGINT NOT NULL DEFAULT 0\n);\nCREATE INDEX IF NOT EXISTS idx\_stoma\_rate\_limits\_reset\_at ON stoma\_rate\_limits (reset\_at);\n\nCREATE TABLE IF NOT EXISTS stoma\_circuit\_breakers (\n  key TEXT PRIMARY KEY,\n  state TEXT NOT NULL DEFAULT 'closed',\n  failure\_count INTEGER NOT NULL DEFAULT 0,\n  success\_count INTEGER NOT NULL DEFAULT 0,\n  last\_failure\_time BIGINT NOT NULL DEFAULT 0,\n  last\_state\_change BIGINT NOT NULL DEFAULT 0\n);\n\nCREATE TABLE IF NOT EXISTS stoma\_cache (\n  key TEXT PRIMARY KEY,\n  status INTEGER NOT NULL,\n  headers JSONB NOT NULL DEFAULT '\[\]',\n  body TEXT NOT NULL DEFAULT '',\n  expires\_at BIGINT NOT NULL DEFAULT 0\n);\nCREATE INDEX IF NOT EXISTS idx\_stoma\_cache\_expires\_at ON stoma\_cache (expires\_at);\n"

Defined in: [src/adapters/postgres.ts:67](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/adapters/postgres.ts#L67)

SQL to create the three stoma tables. Run this once against your database
before using the Postgres adapter. All statements use `IF NOT EXISTS` so
they're safe to re-run.

## Example

```ts
import { POSTGRES_SCHEMA_SQL } from "@homegrower-club/stoma/adapters/postgres";
await pool.query(POSTGRES_SCHEMA_SQL);
```
