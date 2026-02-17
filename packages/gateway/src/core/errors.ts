/**
 * Error handling utilities for the stoma gateway.
 *
 * {@link GatewayError} is thrown by policies and core code to produce
 * structured JSON error responses. The gateway's `onError` handler catches
 * these and converts them via {@link errorToResponse}. Unexpected errors
 * fall through to {@link defaultErrorResponse}.
 *
 * @module errors
 */

/**
 * Structured gateway error with HTTP status code, machine-readable code,
 * and optional response headers (e.g. `Retry-After`, `X-RateLimit-*`).
 *
 * Throw this from policies or handlers to produce a structured JSON error
 * response. The gateway error handler catches it automatically.
 *
 * @example
 * ```ts
 * throw new GatewayError(429, "rate_limited", "Too many requests", {
 *   "retry-after": "60",
 * });
 * // Produces: { "error": "rate_limited", "message": "Too many requests", "statusCode": 429 }
 * ```
 */
export class GatewayError extends Error {
  readonly statusCode: number;
  readonly code: string;
  /** Optional headers to include in the error response (e.g. rate-limit headers) */
  readonly headers?: Record<string, string>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    headers?: Record<string, string>
  ) {
    super(message);
    this.name = "GatewayError";
    this.statusCode = statusCode;
    this.code = code;
    this.headers = headers;
  }
}

/** Standard JSON error response shape returned by all gateway errors. */
export interface ErrorResponse {
  /** Machine-readable error code (e.g. `"rate_limited"`, `"unauthorized"`). */
  error: string;
  /** Human-readable error description. */
  message: string;
  /** HTTP status code (e.g. 401, 429, 503). */
  statusCode: number;
  /** Request ID for tracing, when available. */
  requestId?: string;
}

/**
 * Build a JSON {@link Response} from a {@link GatewayError}.
 *
 * Merges any custom headers from the error (e.g. `Retry-After`) into the
 * response. Includes the request ID when available for tracing.
 *
 * @param error - The gateway error to convert.
 * @param requestId - Optional request ID to include in the response body.
 * @returns A `Response` with JSON body and appropriate status code.
 */
export function errorToResponse(
  error: GatewayError,
  requestId?: string
): Response {
  const body: ErrorResponse = {
    error: error.code,
    message: error.message,
    statusCode: error.statusCode,
    ...(requestId ? { requestId } : {}),
  };
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...error.headers,
  };
  return new Response(JSON.stringify(body), {
    status: error.statusCode,
    headers,
  });
}

/**
 * Produce a generic 500 error response for unexpected (non-{@link GatewayError}) errors.
 *
 * Used by the global error handler when an unrecognized error reaches the
 * gateway boundary. Does not leak internal error details.
 *
 * @param requestId - Optional request ID to include in the response body.
 * @returns A 500 `Response` with a generic error message.
 */
export function defaultErrorResponse(
  requestId?: string,
  message = "An unexpected error occurred"
): Response {
  const body: ErrorResponse = {
    error: "internal_error",
    message,
    statusCode: 500,
    ...(requestId ? { requestId } : {}),
  };
  return new Response(JSON.stringify(body), {
    status: 500,
    headers: { "content-type": "application/json" },
  });
}
