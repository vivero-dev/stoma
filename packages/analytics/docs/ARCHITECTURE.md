---
title: Architecture
description: Design principles and module structure for the stoma-analytics pipeline.
sidebar:
  order: 10
---

# stoma-analytics Architecture

## Purpose

`@homegrower-club/stoma-analytics` is the observability data pipeline for Stoma API gateways. It turns structured metric log lines emitted from the analytics policy into compressed, query-ready Parquet files — without requiring any always-on infrastructure.

The pipeline:

```
Gateway request
  → analyticsLog policy emits a JSON line via console.log
  → Cloudflare Logpush (or stdout) captures the line
  → Raw NDJSON lands in S3/R2 (or local filesystem)
  → Scheduled worker: processor reads NDJSON, extracts metrics, writes Parquet fragments
  → Scheduled worker: compactor merges fragments into partition-level Parquet files
  → DuckDB queries Parquet directly from S3/R2
```

Every stage runs on shared, serverless infrastructure. Nothing is always-on. When there are no logs to process, resource consumption is zero.

## Design principles

### 1. Zero idle infrastructure

This is the foundational principle, inherited from Stoma's [sustainability principles](/about/sustainability/).

Traditional analytics pipelines run dedicated ingest servers, streaming processors, and database clusters 24/7. Multiply across an analytics stack and the waste compounds.

stoma-analytics eliminates every always-on component:

- **Emission**: `analyticsLog` runs inside the same edge Worker/container that handles the request. No sidecar, no agent, no collector.
- **Capture**: Cloudflare Logpush (or other appropriate adapter) writes to S3/R2 as a platform service — no Kafka, no Fluentd, no log shipper.
- **Processing**: A scheduled Worker runs on a cron trigger. Between triggers, it consumes nothing.
- **Compaction**: Same — a scheduled job, not a daemon.
- **Querying**: DuckDB reads Parquet directly from R2. No warehouse server to keep warm.

The entire pipeline exists only when there is work to do.

### 2. Lean data schema

Analytics entries carry only fields that are meaningful for aggregation — things you would `GROUP BY`, `SUM`, `AVG`, or `COUNT` in a DuckDB query. High-cardinality debug data belongs in request logs, not analytics.

```
Analytics entry (low cardinality, aggregatable):
  timestamp, gatewayName, routePath, method, statusCode,
  durationMs, responseSize, traceId, dimensions

Request log entry (high cardinality, debug-oriented):
  requestId, path, clientIp, userAgent, spanId,
  requestBody, responseBody
```

This separation matters for efficiency:

- **Smaller Parquet files**: Fewer columns and lower cardinality means better compression. ZSTD-compressed Parquet with only aggregatable fields is dramatically smaller than logging everything.
- **Faster queries**: DuckDB scans less data when columns are tight. A `GROUP BY routePath, statusCode` over lean analytics entries is orders of magnitude faster than scanning full request logs.
- **Less storage, less transfer, less energy**: Every byte stored in R2 and every byte transferred during queries has an environmental cost. A lean schema minimizes both.

The `traceId` field is the bridge — when a dashboard shows an anomaly, you drill down from the analytics `traceId` to the corresponding request log entry for full debug context.

See the [analytics policy documentation](/analytics/policy/) for the complete field-level data boundary justification.

### 3. Bounded memory, streaming processing

The processor does not accumulate all entries into memory before writing. It streams entries per-file with a bounded buffer (`maxEntriesPerFile`, default 100K). When the buffer fills, it flushes to the Parquet writer immediately.

This means:

- Memory usage is proportional to `maxEntriesPerFile`, not to the total log volume.
- A Worker with 128MB of memory can process gigabytes of logs across many files.
- The processor never needs to hold the entire dataset — it works file-by-file, buffer-by-buffer.

This is particularly important on edge runtimes where memory is constrained and expensive. Every megabyte of memory reserved is a megabyte that can't be shared with other tenants on the same machine.

### 4. Columnar compression via DuckDB WASM

Parquet with ZSTD compression is the output format because it minimizes storage and query cost:

- **Columnar layout**: DuckDB only reads the columns a query touches. A `SELECT AVG(durationMs) GROUP BY routePath` reads two columns, not ten.
- **ZSTD compression**: Typically 5-10x compression over raw NDJSON for structured data with repetitive string values (gateway names, route patterns, HTTP methods).
- **Native bulk loading**: The DuckDB WASM writer uses `read_ndjson()` to bulk-load entries in vectorized column batches instead of row-by-row inserts. This is ~100x faster for large batches and reduces CPU time per entry.

The `dimensions` field is pre-serialized to a JSON string (`VARCHAR` in the Parquet schema) before writing. This avoids complex nested Parquet schemas while preserving extensibility — dimensions can be queried via DuckDB's `json_extract()`.

When DuckDB WASM is not available, an NDJSON passthrough writer provides a zero-dependency fallback. Same interface, no Parquet — useful for development or environments without WASM support.

### 5. Two-stage pipeline: ingest then compact

The pipeline is split into two jobs rather than one because each has different characteristics:

**Ingest** (processor): Runs frequently (e.g., every 5 minutes). Reads raw NDJSON, extracts analytics entries, writes small Parquet fragment files. Optimized for latency — data becomes queryable quickly.

**Compact** (compactor): Runs less frequently (e.g., hourly or daily). Merges small fragments into a single file per time partition. Optimized for query efficiency — fewer files means faster DuckDB scans.

This separation means:

- Ingest can run on a tight schedule without worrying about producing too many small files — compaction cleans up later.
- Compaction only touches "cold" partitions (configurable `before` cutoff, default 24h ago), so it never interferes with active ingest.
- Each job can fail independently. A compaction failure doesn't block new data from being ingested.

Partitioning is time-based at configurable granularity (`"hour"`, `"day"`, or `"month"`). The path structure `{prefix}/{YYYY}/{MM}/{DD}/{HH}/{filename}.parquet` maps directly to DuckDB's `read_parquet()` with glob patterns for partition pruning.

Compaction is idempotent: if a partition already has a `compacted.parquet` with no new fragments alongside it, the compactor skips it. If new fragments appear next to an existing compacted file (from a later ingest run), it re-merges everything.

### 6. Interface-driven, injectable everything

Every external dependency is behind an interface:

| Interface | Purpose | Implementations |
|-----------|---------|-----------------|
| `StorageReader` | Read raw log files | `r2Storage`, `localStorageAdapter` |
| `StorageWriter` | Write Parquet output | `r2Storage`, `localStorageAdapter` |
| `CompactorStorage` | Read/write/delete Parquet files | `r2Storage`, `localStorageAdapter` |
| `ParquetWriter` | Convert entries to Parquet bytes | `duckdbWasmParquetWriter`, `ndjsonPassthroughWriter` |
| `ParquetMerger` | Merge Parquet fragments | `duckdbWasmParquetMerger` |

This isn't abstraction for abstraction's sake. It serves three concrete purposes:

1. **Testability**: All 58 tests run with mock implementations, no R2, no DuckDB, no filesystem. Tests complete in <1 second.
2. **Runtime portability**: The same processor code runs on Cloudflare Workers (R2 storage, DuckDB WASM) and Node/Bun (local filesystem, optional DuckDB).
3. **Zero mandatory heavy dependencies**: DuckDB WASM is loaded via dynamic import — it's not in `dependencies` or `peerDependencies`. Users install it only if they want Parquet output. The package itself has zero runtime dependencies beyond its Stoma and Hono peer deps.

### 7. Fail silently, never break the request

The `analyticsLog` policy wraps its entire post-response logic in a `try/catch`. If the sink throws, the dimensions extractor throws, or anything else goes wrong — the request pipeline is unaffected. The user gets their response. Analytics are best-effort.

This is the same principle as Stoma's `requestLog` policy: observability must never degrade the thing being observed.

### 8. No build-time dependencies on the gateway

The analytics package imports only from `@homegrower-club/stoma/sdk` (the policy authoring SDK) and the `PolicyConfig` type. It does not import gateway internals, pipeline implementation details, or specific policy implementations.

This means the gateway and analytics packages version independently. A gateway upgrade doesn't force an analytics upgrade, and vice versa. The coupling surface is the `definePolicy()` contract and the `PolicyContext` shape — both stable public API.

## Module structure

```
src/
├── types.ts                    # All interfaces and type definitions
├── index.ts                    # Barrel exports
├── policy/
│   └── analytics.ts            # analyticsLog policy (emits entries at the edge)
├── processor/
│   ├── index.ts                # createProcessor() — NDJSON → Parquet ingest
│   └── formats/
│       ├── standard.ts         # Plain NDJSON line parser
│       └── cloudflare.ts       # Workers Trace Event unwrapper
├── compactor/
│   └── index.ts                # createCompactor() — fragment merging
├── storage/
│   ├── r2.ts                   # Cloudflare R2 adapter
│   └── local.ts                # Node/Bun filesystem adapter
├── parquet/
│   ├── duckdb-wasm.ts          # DuckDB WASM writer + merger
│   └── ndjson-passthrough.ts   # Zero-dep NDJSON fallback
└── worker/
    ├── scheduled.ts            # Cloudflare scheduled handler factory
    └── standalone.ts           # Node/Bun CLI runner
```

## Subpath exports

| Import | What you get |
|--------|-------------|
| `@homegrower-club/stoma-analytics` | Everything |
| `@homegrower-club/stoma-analytics/policy` | `analyticsLog` policy only |
| `@homegrower-club/stoma-analytics/processor` | Processor + format parsers |
| `@homegrower-club/stoma-analytics/compactor` | Compactor |
| `@homegrower-club/stoma-analytics/storage/r2` | R2 adapter |
| `@homegrower-club/stoma-analytics/storage/local` | Local filesystem adapter |
| `@homegrower-club/stoma-analytics/parquet/duckdb-wasm` | DuckDB WASM writer + merger |
| `@homegrower-club/stoma-analytics/worker` | Worker templates |

Every subpath is tree-shakeable. If you only need the policy (to emit analytics from your gateway), you import `@homegrower-club/stoma-analytics/policy` — no processor code, no DuckDB, no storage adapters are bundled.

## Runtime cost

The analytics policy adds a single `Date.now()` call before and after `next()`, reads the response `Content-Length` header, and serializes one small JSON object via `console.log`. On Cloudflare Workers, this is sub-microsecond overhead per request.

The processor and compactor run as scheduled jobs. Their cost is proportional to the volume of logs — and when there are no logs, the cost is zero.

There is no persistent connection, no background thread, no polling loop, no heartbeat. The entire analytics pipeline is event-driven and ephemeral.
