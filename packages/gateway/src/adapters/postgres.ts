/**
 * PostgreSQL-backed adapter for stoma - production-ready stores for Node.js, Bun, and Deno.
 *
 * Zero dependencies: define a minimal {@link PostgresClient} interface that any Postgres
 * library (pg, postgres.js, etc.) satisfies, then pass it to {@link postgresAdapter}.
 *
 * @module adapters/postgres
 */
import type {
  CircuitBreakerSnapshot,
  CircuitBreakerStore,
  CircuitState,
} from "../policies/resilience/circuit-breaker";
import type { CacheStore } from "../policies/traffic/cache";
import type { RateLimitStore } from "../policies/traffic/rate-limit";
import type { GatewayAdapter } from "./types";

// ---------------------------------------------------------------------------
// Client interface
// ---------------------------------------------------------------------------

/**
 * Minimal PostgreSQL client interface - satisfied by `pg`, `postgres.js`, and most
 * Postgres libraries. Only a single `query` method is required.
 */
export interface PostgresClient {
  query(
    text: string,
    params?: unknown[]
  ): Promise<{ rows: Record<string, unknown>[] }>;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface PostgresAdapterConfig {
  /** PostgreSQL client instance (pg Pool, postgres.js, etc.). */
  client: PostgresClient;
  /** Table name prefix. Default: `"stoma_"`. */
  tablePrefix?: string;
  /** Selectively enable/disable individual stores. All enabled by default. */
  stores?: {
    rateLimit?: boolean;
    circuitBreaker?: boolean;
    cache?: boolean;
  };
  /** Schedule background work that outlives the response. */
  waitUntil?: (promise: Promise<unknown>) => void;
}

// ---------------------------------------------------------------------------
// Schema SQL
// ---------------------------------------------------------------------------

/**
 * SQL to create the three stoma tables. Run this once against your database
 * before using the Postgres adapter. All statements use `IF NOT EXISTS` so
 * they're safe to re-run.
 *
 * @example
 * ```ts
 * import { POSTGRES_SCHEMA_SQL } from "@homegrower-club/stoma/adapters/postgres";
 * await pool.query(POSTGRES_SCHEMA_SQL);
 * ```
 */
export const POSTGRES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS stoma_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_stoma_rate_limits_reset_at ON stoma_rate_limits (reset_at);

CREATE TABLE IF NOT EXISTS stoma_circuit_breakers (
  key TEXT PRIMARY KEY,
  state TEXT NOT NULL DEFAULT 'closed',
  failure_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  last_failure_time BIGINT NOT NULL DEFAULT 0,
  last_state_change BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stoma_cache (
  key TEXT PRIMARY KEY,
  status INTEGER NOT NULL,
  headers JSONB NOT NULL DEFAULT '[]',
  body TEXT NOT NULL DEFAULT '',
  expires_at BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_stoma_cache_expires_at ON stoma_cache (expires_at);
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Per HTTP spec, 204 and 304 responses must not carry a body.
const NULL_BODY_STATUSES = new Set([204, 304]);
function safeBody(
  body: BodyInit | null | undefined,
  status: number
): BodyInit | null {
  return NULL_BODY_STATUSES.has(status) ? null : (body ?? null);
}

/** Encode a Uint8Array to base64 string (no Node Buffer dependency). */
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Decode a base64 string to Uint8Array (no Node Buffer dependency). */
function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Rate Limit Store
// ---------------------------------------------------------------------------

/**
 * Rate limit store backed by PostgreSQL using atomic upsert.
 *
 * Uses `INSERT ... ON CONFLICT DO UPDATE` with a `CASE` expression to
 * atomically reset or increment the counter in a single query.
 */
export class PostgresRateLimitStore implements RateLimitStore {
  constructor(
    private client: PostgresClient,
    private table: string
  ) {}

  async increment(
    key: string,
    windowSeconds: number
  ): Promise<{ count: number; resetAt: number }> {
    const now = Date.now();
    const resetAt = now + windowSeconds * 1000;

    // Atomic upsert: insert new row or update existing.
    // If the existing row has expired (reset_at <= now), reset counter to 1.
    // Otherwise, increment the existing counter.
    const result = await this.client.query(
      `INSERT INTO ${this.table} (key, count, reset_at)
       VALUES ($1, 1, $2)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE
           WHEN ${this.table}.reset_at <= $3 THEN 1
           ELSE ${this.table}.count + 1
         END,
         reset_at = CASE
           WHEN ${this.table}.reset_at <= $3 THEN $2
           ELSE ${this.table}.reset_at
         END
       RETURNING count, reset_at`,
      [key, resetAt, now]
    );

    const row = result.rows[0];
    return {
      count: Number(row.count),
      resetAt: Number(row.reset_at),
    };
  }

  /** Remove expired entries. Call periodically (e.g. via cron or waitUntil). */
  async cleanup(): Promise<void> {
    await this.client.query(`DELETE FROM ${this.table} WHERE reset_at <= $1`, [
      Date.now(),
    ]);
  }
}

// ---------------------------------------------------------------------------
// Circuit Breaker Store
// ---------------------------------------------------------------------------

function rowToSnapshot(row: Record<string, unknown>): CircuitBreakerSnapshot {
  return {
    state: (row.state as CircuitState) ?? "closed",
    failureCount: Number(row.failure_count ?? 0),
    successCount: Number(row.success_count ?? 0),
    lastFailureTime: Number(row.last_failure_time ?? 0),
    lastStateChange: Number(row.last_state_change ?? Date.now()),
  };
}

function defaultSnapshot(): CircuitBreakerSnapshot {
  return {
    state: "closed",
    failureCount: 0,
    successCount: 0,
    lastFailureTime: 0,
    lastStateChange: Date.now(),
  };
}

/** Circuit breaker state store backed by PostgreSQL. */
export class PostgresCircuitBreakerStore implements CircuitBreakerStore {
  constructor(
    private client: PostgresClient,
    private table: string
  ) {}

  async getState(key: string): Promise<CircuitBreakerSnapshot> {
    const result = await this.client.query(
      `SELECT state, failure_count, success_count, last_failure_time, last_state_change
       FROM ${this.table} WHERE key = $1`,
      [key]
    );
    if (result.rows.length === 0) return defaultSnapshot();
    return rowToSnapshot(result.rows[0]);
  }

  async recordSuccess(key: string): Promise<CircuitBreakerSnapshot> {
    const now = Date.now();
    const result = await this.client.query(
      `INSERT INTO ${this.table} (key, state, failure_count, success_count, last_failure_time, last_state_change)
       VALUES ($1, 'closed', 0, 1, 0, $2)
       ON CONFLICT (key) DO UPDATE SET
         success_count = ${this.table}.success_count + 1
       RETURNING state, failure_count, success_count, last_failure_time, last_state_change`,
      [key, now]
    );
    return rowToSnapshot(result.rows[0]);
  }

  async recordFailure(key: string): Promise<CircuitBreakerSnapshot> {
    const now = Date.now();
    const result = await this.client.query(
      `INSERT INTO ${this.table} (key, state, failure_count, success_count, last_failure_time, last_state_change)
       VALUES ($1, 'closed', 1, 0, $2, $2)
       ON CONFLICT (key) DO UPDATE SET
         failure_count = ${this.table}.failure_count + 1,
         last_failure_time = $2
       RETURNING state, failure_count, success_count, last_failure_time, last_state_change`,
      [key, now]
    );
    return rowToSnapshot(result.rows[0]);
  }

  async transition(
    key: string,
    to: CircuitState
  ): Promise<CircuitBreakerSnapshot> {
    const now = Date.now();

    // Reset counters on state transitions matching in-memory behavior
    let failureCount = "failure_count";
    let successCount = "success_count";
    if (to === "closed") {
      failureCount = "0";
      successCount = "0";
    } else if (to === "half-open") {
      successCount = "0";
    }

    const result = await this.client.query(
      `INSERT INTO ${this.table} (key, state, failure_count, success_count, last_failure_time, last_state_change)
       VALUES ($1, $2, 0, 0, 0, $3)
       ON CONFLICT (key) DO UPDATE SET
         state = $2,
         failure_count = ${failureCount},
         success_count = ${successCount},
         last_state_change = $3
       RETURNING state, failure_count, success_count, last_failure_time, last_state_change`,
      [key, to, now]
    );
    return rowToSnapshot(result.rows[0]);
  }

  async reset(key: string): Promise<void> {
    await this.client.query(`DELETE FROM ${this.table} WHERE key = $1`, [key]);
  }
}

// ---------------------------------------------------------------------------
// Cache Store
// ---------------------------------------------------------------------------

/** Response cache backed by PostgreSQL with base64-encoded body and expiry timestamp. */
export class PostgresCacheStore implements CacheStore {
  constructor(
    private client: PostgresClient,
    private table: string
  ) {}

  async get(key: string): Promise<Response | null> {
    const now = Date.now();
    const result = await this.client.query(
      `SELECT status, headers, body FROM ${this.table}
       WHERE key = $1 AND expires_at > $2`,
      [key, now]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const status = Number(row.status);
    // JSONB columns are auto-parsed by most Postgres drivers (pg, postgres.js),
    // but some may return a string. Handle both cases.
    const rawHeaders = row.headers;
    const headers: [string, string][] =
      typeof rawHeaders === "string"
        ? JSON.parse(rawHeaders)
        : (rawHeaders as [string, string][]);
    const body = base64ToUint8(row.body as string);

    return new Response(safeBody(body, status), { status, headers });
  }

  async put(
    key: string,
    response: Response,
    ttlSeconds: number
  ): Promise<void> {
    const body = new Uint8Array(await response.arrayBuffer());
    const headers: [string, string][] = [];
    response.headers.forEach((value, name) => {
      headers.push([name, value]);
    });
    const expiresAt = Date.now() + ttlSeconds * 1000;

    await this.client.query(
      `INSERT INTO ${this.table} (key, status, headers, body, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (key) DO UPDATE SET
         status = $2, headers = $3, body = $4, expires_at = $5`,
      [
        key,
        response.status,
        JSON.stringify(headers),
        uint8ToBase64(body),
        expiresAt,
      ]
    );
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.client.query(
      `DELETE FROM ${this.table} WHERE key = $1 RETURNING key`,
      [key]
    );
    return result.rows.length > 0;
  }

  /** Remove expired entries. Call periodically (e.g. via cron or waitUntil). */
  async cleanup(): Promise<void> {
    await this.client.query(
      `DELETE FROM ${this.table} WHERE expires_at <= $1`,
      [Date.now()]
    );
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a {@link GatewayAdapter} using PostgreSQL-backed stores.
 *
 * Before using, create the required tables by running {@link POSTGRES_SCHEMA_SQL}
 * against your database.
 *
 * @example
 * ```ts
 * import { Pool } from "pg";
 * import { postgresAdapter, POSTGRES_SCHEMA_SQL } from "@homegrower-club/stoma/adapters/postgres";
 *
 * const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 * await pool.query(POSTGRES_SCHEMA_SQL); // one-time setup
 *
 * const adapter = postgresAdapter({ client: pool });
 * createGateway({ adapter, ... });
 * ```
 */
export function postgresAdapter(config: PostgresAdapterConfig): GatewayAdapter {
  const prefix = config.tablePrefix ?? "stoma_";
  const stores = config.stores ?? {};

  return {
    rateLimitStore:
      stores.rateLimit !== false
        ? new PostgresRateLimitStore(config.client, `${prefix}rate_limits`)
        : undefined,
    circuitBreakerStore:
      stores.circuitBreaker !== false
        ? new PostgresCircuitBreakerStore(
            config.client,
            `${prefix}circuit_breakers`
          )
        : undefined,
    cacheStore:
      stores.cache !== false
        ? new PostgresCacheStore(config.client, `${prefix}cache`)
        : undefined,
    waitUntil: config.waitUntil,
  };
}
