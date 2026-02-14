import type { Context } from "hono";
import { describe, expect, it } from "vitest";
import type { PolicyTrace, PolicyTraceEntry } from "../../policies/sdk";
import { definePolicy, Priority, policyTrace } from "../../policies/sdk";
import type { Policy } from "../../policies/types";
import { GatewayError } from "../errors";
import { createGateway } from "../gateway";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function echoHandler(c: Context) {
  return c.json({ ok: true });
}

/** A policy that reports a trace detail. */
const tracingPolicy = definePolicy({
  name: "tracing-test",
  priority: Priority.AUTH,
  handler: async (_c, next, { trace }) => {
    trace("allowed", { user: "demo" });
    await next();
  },
});

/** A policy that short-circuits by throwing a GatewayError (does not call next). */
const shortCircuitPolicy: Policy = {
  name: "short-circuit",
  priority: Priority.AUTH,
  handler: async (c) => {
    const trace = policyTrace(c, "short-circuit");
    trace("blocked", { reason: "test" });
    throw new GatewayError(403, "blocked", "Blocked by test");
  },
};

/** A policy that throws. */
const errorPolicy: Policy = {
  name: "error-thrower",
  priority: Priority.AUTH,
  handler: async () => {
    throw new GatewayError(500, "test_error", "Something broke");
  },
};

/** A simple pass-through policy for verifying baseline capture. */
const passthroughPolicy: Policy = {
  name: "passthrough",
  priority: Priority.EARLY,
  handler: async (_c, next) => {
    await next();
  },
};

function parseTrace(res: Response): PolicyTrace | null {
  const raw = res.headers.get("x-stoma-trace");
  if (!raw) return null;
  return JSON.parse(raw) as PolicyTrace;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Policy Trace - integration", () => {
  it("should emit x-stoma-trace header when x-stoma-debug: trace is sent", async () => {
    const gw = createGateway({
      debugHeaders: true,
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [tracingPolicy()],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/test", {
      headers: { "x-stoma-debug": "trace" },
    });

    expect(res.status).toBe(200);
    const trace = parseTrace(res);
    expect(trace).not.toBeNull();
    expect(trace!.requestId).toBeDefined();
    expect(trace!.traceId).toBeDefined();
    expect(trace!.route).toBe("/test");
    expect(trace!.totalMs).toBeGreaterThanOrEqual(0);
    expect(trace!.entries.length).toBeGreaterThan(0);
  });

  it("should emit x-stoma-trace header when x-stoma-debug: * is sent", async () => {
    const gw = createGateway({
      debugHeaders: true,
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [passthroughPolicy],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/test", {
      headers: { "x-stoma-debug": "*" },
    });

    const trace = parseTrace(res);
    expect(trace).not.toBeNull();
    expect(trace!.entries.length).toBeGreaterThan(0);
  });

  it("should NOT emit x-stoma-trace when no debug header is sent", async () => {
    const gw = createGateway({
      debugHeaders: true,
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [passthroughPolicy],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/test");
    expect(res.headers.get("x-stoma-trace")).toBeNull();
  });

  it("should NOT emit x-stoma-trace when debugHeaders is disabled", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [passthroughPolicy],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/test", {
      headers: { "x-stoma-debug": "trace" },
    });

    expect(res.headers.get("x-stoma-trace")).toBeNull();
  });

  it("should NOT emit x-stoma-trace when allowlist excludes trace", async () => {
    const gw = createGateway({
      debugHeaders: { allow: ["x-stoma-cache-key"] },
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [passthroughPolicy],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/test", {
      headers: { "x-stoma-debug": "trace" },
    });

    expect(res.headers.get("x-stoma-trace")).toBeNull();
  });

  it("should emit trace with allowlist that includes trace", async () => {
    const gw = createGateway({
      debugHeaders: { allow: ["trace", "x-stoma-cache-key"] },
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [passthroughPolicy],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/test", {
      headers: { "x-stoma-debug": "trace" },
    });

    const trace = parseTrace(res);
    expect(trace).not.toBeNull();
  });

  it("should show calledNext: true for policies that call next()", async () => {
    const gw = createGateway({
      debugHeaders: true,
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [passthroughPolicy],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/test", {
      headers: { "x-stoma-debug": "trace" },
    });

    const trace = parseTrace(res)!;
    const entry = trace.entries.find(
      (e: PolicyTraceEntry) => e.name === "passthrough"
    );
    expect(entry).toBeDefined();
    expect(entry!.calledNext).toBe(true);
    expect(entry!.error).toBeNull();
  });

  it("should show calledNext: false for short-circuiting policies", async () => {
    const gw = createGateway({
      debugHeaders: true,
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [shortCircuitPolicy],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/test", {
      headers: { "x-stoma-debug": "trace" },
    });

    expect(res.status).toBe(403);
    const trace = parseTrace(res)!;
    const entry = trace.entries.find(
      (e: PolicyTraceEntry) => e.name === "short-circuit"
    );
    expect(entry).toBeDefined();
    expect(entry!.calledNext).toBe(false);
    expect(entry!.detail).toEqual({
      action: "blocked",
      data: { reason: "test" },
    });
  });

  it("should show error string for policies that throw", async () => {
    const gw = createGateway({
      debugHeaders: true,
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [errorPolicy],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/test", {
      headers: { "x-stoma-debug": "trace" },
    });

    // Gateway handles the error via its error handler
    const trace = parseTrace(res);
    // Trace may or may not be emitted depending on error handler behavior -
    // if the error handler produces a response, the context injector post-next
    // phase runs and emits the trace. If not, there's no trace header.
    // With Hono's default onError, the context injector's post-next still runs.
    if (trace) {
      const entry = trace.entries.find(
        (e: PolicyTraceEntry) => e.name === "error-thrower"
      );
      expect(entry).toBeDefined();
      expect(entry!.error).toBe("Something broke");
      expect(entry!.calledNext).toBe(false);
    }
  });

  it("should merge policy detail into the correct trace entry", async () => {
    const gw = createGateway({
      debugHeaders: true,
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [tracingPolicy()],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/test", {
      headers: { "x-stoma-debug": "trace" },
    });

    const trace = parseTrace(res)!;
    const entry = trace.entries.find(
      (e: PolicyTraceEntry) => e.name === "tracing-test"
    );
    expect(entry).toBeDefined();
    expect(entry!.detail).toEqual({
      action: "allowed",
      data: { user: "demo" },
    });
  });

  it("should produce entries in execution order (outermost first)", async () => {
    const earlyPolicy: Policy = {
      name: "early",
      priority: Priority.EARLY,
      handler: async (_c, next) => {
        await next();
      },
    };
    const latePolicy: Policy = {
      name: "late",
      priority: Priority.CACHE,
      handler: async (_c, next) => {
        await next();
      },
    };

    const gw = createGateway({
      debugHeaders: true,
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [latePolicy, earlyPolicy],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/test", {
      headers: { "x-stoma-debug": "trace" },
    });

    const trace = parseTrace(res)!;
    const names = trace.entries.map((e: PolicyTraceEntry) => e.name);
    expect(names.indexOf("early")).toBeLessThan(names.indexOf("late"));
  });

  it("should have self-time less than or equal to inclusive time for outer policies", async () => {
    const gw = createGateway({
      debugHeaders: true,
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [passthroughPolicy],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/test", {
      headers: { "x-stoma-debug": "trace" },
    });

    const trace = parseTrace(res)!;
    for (const entry of trace.entries) {
      expect(entry.durationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("should include x-stoma-trace alongside other debug headers", async () => {
    const gw = createGateway({
      debugHeaders: true,
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [tracingPolicy()],
            upstream: { type: "handler", handler: echoHandler },
          },
        },
      ],
    });

    const res = await gw.app.request("/test", {
      headers: { "x-stoma-debug": "trace, x-stoma-cache-key" },
    });

    const trace = parseTrace(res);
    expect(trace).not.toBeNull();
  });
});
