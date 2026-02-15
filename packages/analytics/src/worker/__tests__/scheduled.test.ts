import { vi, describe, it, expect, beforeEach } from "vitest";
import type { ProcessorResult } from "../../types.js";

vi.mock("../../processor/index.js", () => ({
  createProcessor: vi.fn(),
}));
vi.mock("../../storage/r2.js", () => ({
  r2Storage: vi.fn(() => ({})),
}));
vi.mock("../../parquet/duckdb-wasm.js", () => ({
  duckdbWasmParquetWriter: vi.fn(() => ({})),
}));

import { createAnalyticsHandler } from "../scheduled.js";
import { createProcessor } from "../../processor/index.js";

const mockCreateProcessor = vi.mocked(createProcessor);

function makeMockResult(overrides?: Partial<ProcessorResult>): ProcessorResult {
  return {
    filesProcessed: 1,
    entriesExtracted: 10,
    parquetFilesWritten: 1,
    filesDeleted: 0,
    durationMs: 42,
    errors: [],
    ...overrides,
  };
}

function createMockCtx() {
  let captured: Promise<unknown> | undefined;
  return {
    ctx: {
      waitUntil(p: Promise<unknown>) {
        captured = p;
      },
    } as unknown as ExecutionContext,
    getPromise() {
      return captured;
    },
  };
}

const mockEvent = {} as ScheduledEvent;
const mockEnv = {
  LOGS: {} as R2Bucket,
  OUTPUT: {} as R2Bucket,
};

describe("createAnalyticsHandler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a function (backward compat, no args)", () => {
    mockCreateProcessor.mockReturnValue({
      run: vi.fn(async () => makeMockResult()),
    });

    const handler = createAnalyticsHandler();
    expect(typeof handler).toBe("function");
  });

  it("calls onResult callback when processor succeeds", async () => {
    const result = makeMockResult({ filesProcessed: 3 });
    mockCreateProcessor.mockReturnValue({
      run: vi.fn(async () => result),
    });

    const onResult = vi.fn();
    const handler = createAnalyticsHandler({ onResult });
    const { ctx, getPromise } = createMockCtx();

    await handler(mockEvent, mockEnv, ctx);
    await getPromise();

    expect(onResult).toHaveBeenCalledOnce();
    expect(onResult).toHaveBeenCalledWith(result);
  });

  it("calls onError callback when processor throws", async () => {
    const error = new Error("boom");
    mockCreateProcessor.mockReturnValue({
      run: vi.fn(async () => {
        throw error;
      }),
    });

    const onError = vi.fn();
    const handler = createAnalyticsHandler({ onError });
    const { ctx, getPromise } = createMockCtx();

    await handler(mockEvent, mockEnv, ctx);
    await getPromise();

    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("default onError logs structured JSON to console.error", async () => {
    const error = new Error("processor exploded");
    mockCreateProcessor.mockReturnValue({
      run: vi.fn(async () => {
        throw error;
      }),
    });

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = createAnalyticsHandler();
    const { ctx, getPromise } = createMockCtx();

    await handler(mockEvent, mockEnv, ctx);
    await getPromise();

    expect(spy).toHaveBeenCalledOnce();
    const logged = JSON.parse(spy.mock.calls[0][0] as string);
    expect(logged._type).toBe("stoma_analytics_processor_error");
    expect(logged.error).toBe("processor exploded");
    expect(logged.timestamp).toBeDefined();

    spy.mockRestore();
  });

  it("default onResult logs structured JSON to console.log", async () => {
    const result = makeMockResult();
    mockCreateProcessor.mockReturnValue({
      run: vi.fn(async () => result),
    });

    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const handler = createAnalyticsHandler();
    const { ctx, getPromise } = createMockCtx();

    await handler(mockEvent, mockEnv, ctx);
    await getPromise();

    expect(spy).toHaveBeenCalledOnce();
    const logged = JSON.parse(spy.mock.calls[0][0] as string);
    expect(logged._type).toBe("stoma_analytics_processor");
    expect(logged.filesProcessed).toBe(1);

    spy.mockRestore();
  });

  it("default onError handles non-Error objects", async () => {
    mockCreateProcessor.mockReturnValue({
      run: vi.fn(async () => {
        throw "string error";
      }),
    });

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = createAnalyticsHandler();
    const { ctx, getPromise } = createMockCtx();

    await handler(mockEvent, mockEnv, ctx);
    await getPromise();

    const logged = JSON.parse(spy.mock.calls[0][0] as string);
    expect(logged.error).toBe("string error");

    spy.mockRestore();
  });
});
