/**
 * Protocol-agnostic types for multi-runtime policy evaluation.
 *
 * These types define the contract between policy logic and protocol runtimes.
 * The HTTP runtime (Hono-based) uses {@link Policy.handler} directly.
 * Non-HTTP runtimes (ext_proc, WebSocket) use {@link Policy.evaluate}.
 *
 * **Architecture:**
 * ```
 *                    ┌─────────────────────────────┐
 *                    │      Policy Definitions      │
 *                    │  name, priority, evaluate()  │
 *                    │    (protocol-agnostic)       │
 *                    └──────────┬──────────────────┘
 *                               │
 *              ┌────────────────┼────────────────┐
 *              │                │                │
 *    ┌─────────▼──────┐ ┌──────▼──────┐ ┌──────▼───────┐
 *    │  HTTP Runtime   │ │  ext_proc   │ │  WebSocket   │
 *    │  (Hono-based)   │ │  (gRPC)     │ │  Runtime     │
 *    │ createGateway() │ │             │ │              │
 *    └────────────────┘ └─────────────┘ └──────────────┘
 * ```
 *
 * Hono powers the HTTP runtime. Other runtimes (ext_proc via gRPC,
 * WebSocket) are peer implementations - same policy definitions,
 * different wire protocols.
 *
 * @module protocol
 */
import type { GatewayAdapter } from "../adapters/types";
import type { TraceReporter } from "../policies/sdk/trace";
import type { DebugLogger } from "../utils/debug";

// ─── Processing Phases ─────────────────────────────────────────────────

/**
 * Lifecycle phases a policy can participate in.
 *
 * Maps to:
 * - **HTTP**: `request-headers` → `request-body` → `response-headers` → `response-body`
 *   (trailers are N/A for HTTP/1.1; available in HTTP/2)
 * - **ext_proc**: All 6 phases - Envoy sends each as a `ProcessingRequest`
 * - **WebSocket**: `request-headers` (upgrade) → `request-body` (per-message)
 */
export type ProcessingPhase =
  | "request-headers"
  | "request-body"
  | "request-trailers"
  | "response-headers"
  | "response-body"
  | "response-trailers";

// ─── Protocol Type ─────────────────────────────────────────────────────

/** Identifies the protocol runtime invoking a policy. */
export type ProtocolType = "http" | "grpc" | "websocket";

// ─── Policy Input ──────────────────────────────────────────────────────

/**
 * Protocol-agnostic view of what's being processed.
 *
 * Constructed by each runtime from its native message type:
 * - HTTP runtime builds it from Hono's `Context`
 * - ext_proc runtime builds it from gRPC `ProcessingRequest`
 * - WebSocket runtime builds it from the upgrade request or message frame
 */
export interface PolicyInput {
  /** Current processing phase. */
  phase: ProcessingPhase;

  /**
   * Request method or action.
   *
   * - HTTP: `"GET"`, `"POST"`, etc.
   * - gRPC: Full method name, e.g. `"users.UserService/GetUser"`
   */
  method: string;

  /**
   * Request path or resource identifier.
   *
   * - HTTP: URL path, e.g. `"/users/123"`
   * - gRPC: Service path, e.g. `"/users.UserService/GetUser"`
   */
  path: string;

  /**
   * Headers (HTTP) or metadata (gRPC).
   *
   * Treat as read-only - express modifications via
   * {@link PolicyResult} mutations, not by mutating this object.
   */
  headers: Headers;

  /**
   * Client IP address, extracted by the runtime from protocol-specific
   * sources (e.g. `CF-Connecting-IP`, `X-Forwarded-For`, gRPC peer address).
   */
  clientIp?: string;

  /**
   * Message body, present only during body phases.
   *
   * May be the full buffered body or a streaming chunk, depending on
   * the runtime's buffering mode.
   */
  body?: ArrayBuffer | string;

  /**
   * Trailers, present only during trailer phases.
   *
   * Relevant for gRPC (which uses trailers for status codes and error
   * details) and HTTP/2.
   */
  trailers?: Headers;

  /**
   * Cross-policy attribute bag.
   *
   * Policies read attributes set by upstream policies and set
   * attributes for downstream policies via {@link AttributeMutation}.
   * Runtime-populated attributes use the `runtime.*` namespace
   * (e.g. `runtime.matched_route`, `runtime.upstream_name`).
   */
  attributes: Map<string, unknown>;

  /** The protocol runtime that constructed this input. */
  protocol: ProtocolType;
}

// ─── Policy Result ─────────────────────────────────────────────────────

/**
 * The outcome of a policy evaluation. Discriminated on `action`.
 *
 * - `"continue"` - Allow processing to continue, optionally with mutations.
 * - `"reject"` - Reject with a structured error response.
 * - `"immediate-response"` - Short-circuit with a complete non-error response.
 */
export type PolicyResult =
  | PolicyContinue
  | PolicyReject
  | PolicyImmediateResponse;

/**
 * Allow processing to continue, optionally with mutations.
 *
 * Equivalent to `await next()` in HTTP middleware, or ext_proc
 * `CommonResponse` with header/body mutations.
 */
export interface PolicyContinue {
  action: "continue";
  /** Mutations to apply before continuing to the next policy or upstream. */
  mutations?: Mutation[];
}

/**
 * Reject the request with a structured error.
 *
 * Equivalent to `throw new GatewayError(...)` in HTTP middleware, or
 * ext_proc `ImmediateResponse` with an error status code.
 */
export interface PolicyReject {
  action: "reject";
  /** HTTP status code (or gRPC status equivalent). */
  status: number;
  /** Machine-readable error code (e.g. `"rate_limited"`, `"unauthorized"`). */
  code: string;
  /** Human-readable error message. */
  message: string;
  /** Additional headers to include on the error response. */
  headers?: Record<string, string>;
}

/**
 * Short-circuit with a complete non-error response.
 *
 * Used for cache hits, mock responses, redirects - cases where the
 * policy provides the full response and upstream should not be called.
 *
 * Equivalent to returning a `Response` without calling `next()` in
 * HTTP middleware, or ext_proc `ImmediateResponse` with a success status.
 */
export interface PolicyImmediateResponse {
  action: "immediate-response";
  /** HTTP status code for the response. */
  status: number;
  /** Response headers. */
  headers?: Record<string, string>;
  /** Response body. */
  body?: string | ArrayBuffer;
}

// ─── Mutations ─────────────────────────────────────────────────────────

/**
 * A discrete modification to apply to the request or response.
 * Discriminated on `type`.
 *
 * Designed to map cleanly to ext_proc `HeaderMutation`, `BodyMutation`,
 * and Envoy dynamic metadata.
 */
export type Mutation =
  | HeaderMutation
  | BodyMutation
  | StatusMutation
  | AttributeMutation;

/** Add, remove, or append a header value. */
export interface HeaderMutation {
  type: "header";
  /** `"set"` replaces, `"remove"` deletes, `"append"` adds without replacing. */
  op: "set" | "remove" | "append";
  /** Header name (case-insensitive). */
  name: string;
  /** Header value. Required for `"set"` and `"append"`, ignored for `"remove"`. */
  value?: string;
}

/** Replace or clear the message body. */
export interface BodyMutation {
  type: "body";
  /** `"replace"` substitutes the body, `"clear"` removes it entirely. */
  op: "replace" | "clear";
  /** New body content. Required for `"replace"`, ignored for `"clear"`. */
  content?: string | ArrayBuffer;
}

/**
 * Modify the response status code.
 *
 * Only meaningful during response processing phases. Ignored during
 * request phases.
 */
export interface StatusMutation {
  type: "status";
  /** New HTTP status code. */
  code: number;
}

/**
 * Set a cross-policy attribute.
 *
 * Downstream policies see this value in {@link PolicyInput.attributes}.
 * In ext_proc, this maps to Envoy dynamic metadata.
 */
export interface AttributeMutation {
  type: "attribute";
  /** Attribute key. Use namespaced keys (e.g. `"auth.user_id"`) to avoid collisions. */
  key: string;
  /** Attribute value. */
  value: unknown;
}

// ─── Policy Evaluator ──────────────────────────────────────────────────

/**
 * Runtime-facing evaluation context provided to policy evaluators.
 *
 * This is the base context without typed config - runtimes construct
 * this from their native request representation. The policy SDK
 * ({@link definePolicy}) extends this with a typed `config` field
 * via `PolicyEvalHandlerContext`.
 */
export interface PolicyEvalContext {
  /** Debug logger pre-namespaced to `stoma:policy:{name}`. Always callable. */
  debug: DebugLogger;
  /** Trace reporter - always callable, no-op when tracing is not active. */
  trace: TraceReporter;
  /** Unique request ID for correlation. */
  requestId: string;
  /** W3C trace ID (32-hex). */
  traceId: string;
  /** Runtime adapter (stores, waitUntil, etc.). */
  adapter?: GatewayAdapter;
}

/**
 * Protocol-agnostic policy evaluation entry point.
 *
 * Implement this on a {@link Policy} to make it work across all runtimes
 * (HTTP, ext_proc, WebSocket). The HTTP runtime uses {@link Policy.handler}
 * directly - `evaluate` is consumed by non-HTTP runtimes.
 *
 * Runtimes call `onRequest` for request-phase processing and `onResponse`
 * for response-phase processing. A policy can implement one or both.
 *
 * @example
 * ```ts
 * // Protocol-agnostic JWT verification
 * const evaluator: PolicyEvaluator = {
 *   onRequest: async (input, ctx) => {
 *     const auth = input.headers.get("authorization");
 *     if (!auth) return { action: "reject", status: 401, code: "unauthorized", message: "Missing token" };
 *     // ... verify token ...
 *     return { action: "continue", mutations: [
 *       { type: "header", op: "set", name: "x-user-id", value: claims.sub },
 *     ]};
 *   },
 * };
 * ```
 */
/**
 * Current `evaluate` coverage across policy categories:
 * - auth: 6/9 (jwt-auth, api-key-auth, basic-auth, oauth2, rbac, jws)
 * - traffic: 5/13 (rate-limit, ip-filter, cache, geo-ip-filter, ssl-enforce)
 * - transform: 5/7 (cors, assign-attributes, assign-content, request-transform, response-transform)
 * - observability: 0/4
 * - resilience: 0/4
 *
 * Total: 16/38 policies have evaluate support. The remaining policies
 * will gain evaluate implementations as non-HTTP runtimes (ext_proc, WebSocket)
 * are built out. See PLAN.md Phase 5 for the ext_proc roadmap.
 */
export interface PolicyEvaluator {
  /**
   * Evaluate during request processing phases.
   *
   * Called for: `request-headers`, `request-body`, `request-trailers`.
   */
  onRequest?: (
    input: PolicyInput,
    ctx: PolicyEvalContext
  ) => Promise<PolicyResult>;

  /**
   * Evaluate during response processing phases.
   *
   * Called for: `response-headers`, `response-body`, `response-trailers`.
   */
  onResponse?: (
    input: PolicyInput,
    ctx: PolicyEvalContext
  ) => Promise<PolicyResult>;
}
