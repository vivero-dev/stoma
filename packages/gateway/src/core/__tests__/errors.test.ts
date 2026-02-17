import { describe, expect, it } from "vitest";
import { defaultErrorResponse, errorToResponse, GatewayError } from "../errors";

describe("GatewayError", () => {
  it("should create GatewayError with statusCode, code, message", () => {
    const err = new GatewayError(403, "forbidden", "Access denied");
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("forbidden");
    expect(err.message).toBe("Access denied");
  });

  it("should have name 'GatewayError'", () => {
    const err = new GatewayError(500, "internal", "Something broke");
    expect(err.name).toBe("GatewayError");
  });

  it("should be instanceof Error", () => {
    const err = new GatewayError(400, "bad_request", "Invalid input");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("errorToResponse", () => {
  it("should create JSON response from GatewayError", async () => {
    const err = new GatewayError(429, "rate_limited", "Too many requests");
    const res = errorToResponse(err);
    const body = (await res.json()) as Record<string, unknown>;

    expect(body.error).toBe("rate_limited");
    expect(body.message).toBe("Too many requests");
    expect(body.statusCode).toBe(429);
  });

  it("should include requestId in response when provided", async () => {
    const err = new GatewayError(401, "unauthorized", "Bad token");
    const res = errorToResponse(err, "req-abc-123");
    const body = (await res.json()) as Record<string, unknown>;

    expect(body.requestId).toBe("req-abc-123");
  });

  it("should omit requestId when not provided", async () => {
    const err = new GatewayError(404, "not_found", "Route not found");
    const res = errorToResponse(err);
    const body = (await res.json()) as Record<string, unknown>;

    expect(body.requestId).toBeUndefined();
  });

  it("should set correct status code on response", () => {
    const err = new GatewayError(503, "unavailable", "Service down");
    const res = errorToResponse(err);

    expect(res.status).toBe(503);
  });

  it("should set content-type to application/json", () => {
    const err = new GatewayError(400, "bad_request", "Bad");
    const res = errorToResponse(err);

    expect(res.headers.get("content-type")).toBe("application/json");
  });
});

describe("defaultErrorResponse", () => {
  it("should return 500 for defaultErrorResponse", async () => {
    const res = defaultErrorResponse();

    expect(res.status).toBe(500);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("internal_error");
    expect(body.message).toBe("An unexpected error occurred");
    expect(body.statusCode).toBe(500);
  });

  it("should include requestId in default error response", async () => {
    const res = defaultErrorResponse("req-xyz-789");
    const body = (await res.json()) as Record<string, unknown>;

    expect(body.requestId).toBe("req-xyz-789");
  });
});
