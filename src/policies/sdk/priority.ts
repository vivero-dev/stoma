/**
 * Named priority constants for policy ordering.
 *
 * Lower numbers execute first. These replace magic numbers throughout
 * the built-in policies and are exported for custom policy authors.
 *
 * @module priority
 */

export const Priority = {
  /** Observability policies (e.g. requestLog) - wraps everything */
  OBSERVABILITY: 0,
  /** IP filtering - runs before all other logic */
  IP_FILTER: 1,
  /** Metrics collection - just after observability */
  METRICS: 1,
  /** Early pipeline (e.g. cors) - before auth */
  EARLY: 5,
  /** Authentication (e.g. jwtAuth, apiKeyAuth, basicAuth) */
  AUTH: 10,
  /** Rate limiting - after auth */
  RATE_LIMIT: 20,
  /** Circuit breaker - protects upstream */
  CIRCUIT_BREAKER: 30,
  /** Caching - before upstream */
  CACHE: 40,
  /** Request header transforms - mid-pipeline */
  REQUEST_TRANSFORM: 50,
  /** Timeout - wraps upstream call */
  TIMEOUT: 85,
  /** Retry - wraps upstream fetch */
  RETRY: 90,
  /** Response header transforms - after upstream */
  RESPONSE_TRANSFORM: 92,
  /** Proxy header manipulation - just before upstream */
  PROXY: 95,
  /** Default priority for unspecified policies */
  DEFAULT: 100,
  /** Mock - terminal, replaces upstream */
  MOCK: 999,
} as const;

/** Union of all named priority levels. */
export type PriorityLevel = (typeof Priority)[keyof typeof Priority];
