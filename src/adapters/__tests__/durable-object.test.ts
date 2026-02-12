import { describe, expect, it, vi, beforeEach } from "vitest";
import { RateLimiterDO, DurableObjectRateLimitStore } from "../durable-object";

// ---------------------------------------------------------------------------
// Mock DurableObjectStorage
// ---------------------------------------------------------------------------

function createMockStorage() {
  const data = new Map<string, unknown>();
  let alarm: number | null = null;

  return {
    get: vi.fn((key: string) => Promise.resolve(data.get(key) ?? null)),
    put: vi.fn((key: string, value: unknown) => {
      data.set(key, value);
      return Promise.resolve();
    }),
    delete: vi.fn((key: string) => {
      const existed = data.has(key);
      data.delete(key);
      return Promise.resolve(existed);
    }),
    setAlarm: vi.fn((time: number) => {
      alarm = time;
      return Promise.resolve();
    }),
    getAlarm: vi.fn(() => Promise.resolve(alarm)),
    // Expose internals for test assertions
    _data: data,
    _getAlarm: () => alarm,
  };
}

function createMockState(storage: ReturnType<typeof createMockStorage>) {
  return { storage } as unknown as DurableObjectState;
}

// ---------------------------------------------------------------------------
// RateLimiterDO tests
// ---------------------------------------------------------------------------

describe("RateLimiterDO", () => {
  let storage: ReturnType<typeof createMockStorage>;
  let state: DurableObjectState;
  let dobj: RateLimiterDO;

  beforeEach(() => {
    storage = createMockStorage();
    state = createMockState(storage);
    dobj = new RateLimiterDO(state);
  });

  it("should start a new counter on first request", async () => {
    const res = await dobj.fetch(
      new Request("https://internal/increment?window=60"),
    );
    const body = (await res.json()) as { count: number; resetAt: number };

    expect(body.count).toBe(1);
    expect(body.resetAt).toBeGreaterThan(Date.now());
    expect(storage.put).toHaveBeenCalledWith("counter", expect.objectContaining({ count: 1 }));
    expect(storage.setAlarm).toHaveBeenCalledOnce();
  });

  it("should increment existing counter within the window", async () => {
    // Seed an existing counter
    const resetAt = Date.now() + 60_000;
    storage._data.set("counter", { count: 5, resetAt });

    const res = await dobj.fetch(
      new Request("https://internal/increment?window=60"),
    );
    const body = (await res.json()) as { count: number; resetAt: number };

    expect(body.count).toBe(6);
    expect(body.resetAt).toBe(resetAt);
  });

  it("should start a new window when counter is expired", async () => {
    // Seed an expired counter
    storage._data.set("counter", { count: 99, resetAt: Date.now() - 1000 });

    const res = await dobj.fetch(
      new Request("https://internal/increment?window=30"),
    );
    const body = (await res.json()) as { count: number; resetAt: number };

    expect(body.count).toBe(1);
    // New window: ~30 seconds from now
    expect(body.resetAt).toBeGreaterThan(Date.now() + 29_000);
    expect(storage.setAlarm).toHaveBeenCalled();
  });

  it("should use default 60s window when not specified", async () => {
    const res = await dobj.fetch(
      new Request("https://internal/increment"),
    );
    const body = (await res.json()) as { count: number; resetAt: number };

    expect(body.count).toBe(1);
    expect(body.resetAt).toBeGreaterThan(Date.now() + 59_000);
  });

  it("should delete counter on alarm", async () => {
    storage._data.set("counter", { count: 10, resetAt: Date.now() - 1 });

    await dobj.alarm();

    expect(storage.delete).toHaveBeenCalledWith("counter");
    expect(storage._data.has("counter")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DurableObjectRateLimitStore tests
// ---------------------------------------------------------------------------

describe("DurableObjectRateLimitStore", () => {
  it("should call the DO stub with the correct window parameter", async () => {
    const mockStub = {
      fetch: vi.fn(() =>
        Promise.resolve(Response.json({ count: 3, resetAt: Date.now() + 60_000 })),
      ),
    };

    const mockNamespace = {
      idFromName: vi.fn(() => "mock-id"),
      get: vi.fn(() => mockStub),
    } as unknown as DurableObjectNamespace;

    const store = new DurableObjectRateLimitStore(mockNamespace);
    const result = await store.increment("user:123", 120);

    expect(result.count).toBe(3);
    expect(mockNamespace.idFromName).toHaveBeenCalledWith("user:123");
    expect(mockNamespace.get).toHaveBeenCalledWith("mock-id");
    expect(mockStub.fetch).toHaveBeenCalledOnce();

    // Verify the URL contains the window parameter
    const calls = mockStub.fetch.mock.calls as unknown as [[Request]];
    const url = new URL(calls[0][0].url);
    expect(url.searchParams.get("window")).toBe("120");
  });

  it("should map different keys to different DO instances", async () => {
    const stubA = { fetch: vi.fn(() => Promise.resolve(Response.json({ count: 1, resetAt: 0 }))) };
    const stubB = { fetch: vi.fn(() => Promise.resolve(Response.json({ count: 1, resetAt: 0 }))) };

    let callCount = 0;
    const mockNamespace = {
      idFromName: vi.fn((name: string) => `id-${name}`),
      get: vi.fn(() => {
        callCount++;
        return callCount === 1 ? stubA : stubB;
      }),
    } as unknown as DurableObjectNamespace;

    const store = new DurableObjectRateLimitStore(mockNamespace);
    await store.increment("ip:1.2.3.4", 60);
    await store.increment("ip:5.6.7.8", 60);

    expect(mockNamespace.idFromName).toHaveBeenCalledWith("ip:1.2.3.4");
    expect(mockNamespace.idFromName).toHaveBeenCalledWith("ip:5.6.7.8");
    expect(stubA.fetch).toHaveBeenCalledOnce();
    expect(stubB.fetch).toHaveBeenCalledOnce();
  });
});
