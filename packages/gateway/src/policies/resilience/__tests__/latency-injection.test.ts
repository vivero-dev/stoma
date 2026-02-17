import { describe, expect, it, vi } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { latencyInjection } from "../latency-injection";

describe("latencyInjection", () => {
  // --- Basic delay ---

  it("should add delay to request processing", async () => {
    const { request } = createPolicyTestHarness(
      latencyInjection({ delayMs: 50 })
    );

    const start = Date.now();
    const res = await request("/test");
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    expect(elapsed).toBeGreaterThanOrEqual(40); // tolerance
  });

  // --- Jitter ---

  it("should vary delay with jitter", async () => {
    const delays: number[] = [];

    for (let i = 0; i < 10; i++) {
      const { request } = createPolicyTestHarness(
        latencyInjection({ delayMs: 50, jitter: 0.5 })
      );
      const start = Date.now();
      await request("/test");
      delays.push(Date.now() - start);
    }

    // With jitter=0.5 and delayMs=50, range is 25-75ms
    // At least some variation should exist across 10 runs
    const min = Math.min(...delays);
    const max = Math.max(...delays);
    expect(max - min).toBeGreaterThan(0);
  });

  it("should give exact delay when jitter is 0 (default)", async () => {
    const { request } = createPolicyTestHarness(
      latencyInjection({ delayMs: 50 })
    );

    const start = Date.now();
    await request("/test");
    const elapsed = Date.now() - start;

    // Without jitter, delay should be close to 50ms
    expect(elapsed).toBeGreaterThanOrEqual(40);
    expect(elapsed).toBeLessThan(150);
  });

  // --- Probability ---

  it("should never inject when probability is 0", async () => {
    const { request } = createPolicyTestHarness(
      latencyInjection({ delayMs: 500, probability: 0 })
    );

    const start = Date.now();
    const res = await request("/test");
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    // Should be very fast (no 500ms delay)
    expect(elapsed).toBeLessThan(100);
  });

  it("should always inject when probability is 1 (default)", async () => {
    const { request } = createPolicyTestHarness(
      latencyInjection({ delayMs: 50 })
    );

    const start = Date.now();
    await request("/test");
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  // --- Minimum delay clamping ---

  it("should clamp delay to minimum 0 (jitter cannot make it negative)", async () => {
    // delayMs=10, jitter=1.0 means range is 0-20ms - never negative
    // We mock Math.random to return 0 (which produces -1 * jitter * delay = -10, clamped to 0)
    const randomSpy = vi.spyOn(Math, "random");
    // First call: probability check (need < 1 to proceed) → 0.5
    // Second call: jitter calculation → 0 produces (0*2-1) = -1 → delay = 10 + (-1 * 1.0 * 10) = 0
    randomSpy.mockReturnValueOnce(0.5).mockReturnValueOnce(0);

    const { request } = createPolicyTestHarness(
      latencyInjection({ delayMs: 10, jitter: 1.0 })
    );

    const start = Date.now();
    const res = await request("/test");
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    // Delay should be ~0 (clamped), so request should be fast
    expect(elapsed).toBeLessThan(100);

    randomSpy.mockRestore();
  });

  // --- Policy metadata ---

  it("should have priority EARLY (5)", () => {
    const policy = latencyInjection({ delayMs: 100 });
    expect(policy.priority).toBe(5);
    expect(policy.name).toBe("latency-injection");
  });

  // --- Skip logic ---

  it("should bypass injection when skip returns true", async () => {
    const { request } = createPolicyTestHarness(
      latencyInjection({ delayMs: 500, skip: () => true })
    );

    const start = Date.now();
    const res = await request("/test");
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    expect(elapsed).toBeLessThan(100);
  });
});
