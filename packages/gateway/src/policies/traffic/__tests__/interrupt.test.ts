import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { interrupt } from "../interrupt";

describe("interrupt", () => {
  // --- Short-circuit behavior ---

  it("should short-circuit when condition returns true", async () => {
    let upstreamCalled = false;
    const { request } = createPolicyTestHarness(
      interrupt({
        condition: () => true,
        statusCode: 503,
        body: { maintenance: true },
      }),
      {
        upstream: async (c) => {
          upstreamCalled = true;
          return c.json({ ok: true });
        },
      }
    );

    const res = await request("/test");

    expect(res.status).toBe(503);
    expect(upstreamCalled).toBe(false);
    expect(await res.json()).toEqual({ maintenance: true });
  });

  it("should pass through when condition returns false", async () => {
    let upstreamCalled = false;
    const { request } = createPolicyTestHarness(
      interrupt({ condition: () => false }),
      {
        upstream: async (c) => {
          upstreamCalled = true;
          return c.json({ ok: true });
        },
      }
    );

    const res = await request("/test");

    expect(res.status).toBe(200);
    expect(upstreamCalled).toBe(true);
    expect(await res.json()).toEqual({ ok: true });
  });

  // --- Status code ---

  it("should return configured status code", async () => {
    const { request } = createPolicyTestHarness(
      interrupt({ condition: () => true, statusCode: 418 })
    );

    const res = await request("/test");

    expect(res.status).toBe(418);
  });

  it("should default to status 200", async () => {
    const { request } = createPolicyTestHarness(
      interrupt({ condition: () => true })
    );

    const res = await request("/test");

    expect(res.status).toBe(200);
  });

  // --- Body handling ---

  it("should return JSON body when body is an object", async () => {
    const { request } = createPolicyTestHarness(
      interrupt({ condition: () => true, body: { key: "value", num: 42 } })
    );

    const res = await request("/test");

    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await res.json()).toEqual({ key: "value", num: 42 });
  });

  it("should return string body with text/plain content-type", async () => {
    const { request } = createPolicyTestHarness(
      interrupt({ condition: () => true, body: "maintenance mode" })
    );

    const res = await request("/test");

    expect(res.headers.get("content-type")).toBe("text/plain");
    expect(await res.text()).toBe("maintenance mode");
  });

  it("should return empty body when body is undefined", async () => {
    const { request } = createPolicyTestHarness(
      interrupt({ condition: () => true })
    );

    const res = await request("/test");

    expect(await res.text()).toBe("");
  });

  // --- Custom headers ---

  it("should set custom headers on interrupt response", async () => {
    const { request } = createPolicyTestHarness(
      interrupt({
        condition: () => true,
        statusCode: 503,
        headers: { "retry-after": "300", "x-reason": "maintenance" },
      })
    );

    const res = await request("/test");

    expect(res.status).toBe(503);
    expect(res.headers.get("retry-after")).toBe("300");
    expect(res.headers.get("x-reason")).toBe("maintenance");
  });

  // --- Async condition ---

  it("should handle async condition", async () => {
    const { request } = createPolicyTestHarness(
      interrupt({
        condition: async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return true;
        },
        statusCode: 202,
        body: "accepted",
      })
    );

    const res = await request("/test");

    expect(res.status).toBe(202);
    expect(await res.text()).toBe("accepted");
  });

  // --- Skip logic ---

  it("should bypass interrupt when skip returns true", async () => {
    let upstreamCalled = false;
    const { request } = createPolicyTestHarness(
      interrupt({
        condition: () => true,
        statusCode: 503,
        body: "down",
        skip: () => true,
      }),
      {
        upstream: async (c) => {
          upstreamCalled = true;
          return c.json({ ok: true });
        },
      }
    );

    const res = await request("/test");

    expect(res.status).toBe(200);
    expect(upstreamCalled).toBe(true);
  });
});
