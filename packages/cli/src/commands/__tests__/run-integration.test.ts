import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Cli } from "clipanion";
import { RunCommand } from "../run.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "../../__tests__/fixtures");

function createRunCommand(args: string[]): RunCommand {
  const cli = new Cli();
  cli.register(RunCommand);
  return cli.process(["run", ...args]) as RunCommand;
}

async function waitForLog(
  logSpy: any,
  substring: string,
  timeoutMs = 5000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const logCalls = logSpy.mock.calls.map((c: any) => c[0]);
    if (logCalls.some((msg: string) => msg && msg.includes(substring))) {
      return;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Timed out waiting for log containing "${substring}"`);
}

describe("RunCommand full flow", () => {
  let signalHandlers: Map<string, (...args: any[]) => void>;

  beforeEach(() => {
    signalHandlers = new Map();

    vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
    vi.spyOn(process, "on").mockImplementation(((
      event: string,
      handler: (...args: any[]) => void
    ) => {
      signalHandlers.set(event, handler);
      return process;
    }) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    signalHandlers.clear();
  });

  it("loads gateway and logs name + routes", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    const fixturePath = path.join(fixturesDir, "test-gateway.ts");
    const cmd = createRunCommand([fixturePath, "--port", "0"]);

    const executePromise = cmd.execute();

    // Wait for the server to log that it has started, then trigger shutdown
    await waitForLog(logSpy, "listening on");
    const sigterm = signalHandlers.get("SIGTERM");
    if (sigterm) sigterm();

    await executePromise;

    const logCalls = logSpy.mock.calls.map((c) => c[0]);
    expect(
      logCalls.some((msg: string) => msg.includes("test-ts-gateway"))
    ).toBe(true);
  });

  it(
    "--verbose shows route table after loading",
    async () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});

      const fixturePath = path.join(fixturesDir, "test-gateway.ts");
      const cmd = createRunCommand([
        fixturePath,
        "--port",
        "0",
        "--verbose",
      ]);

      const executePromise = cmd.execute();
      
      // Wait for the verbose logging to output routes, then trigger shutdown
      await waitForLog(logSpy, "/echo");
      const sigterm = signalHandlers.get("SIGTERM");
      if (sigterm) sigterm();
      await executePromise;

      const logCalls = logSpy.mock.calls.map((c) => c[0]);
      // Verbose mode should show individual routes
      expect(logCalls.some((msg: string) => msg.includes("/health"))).toBe(
        true
      );
      expect(logCalls.some((msg: string) => msg.includes("/echo"))).toBe(true);
    },
    10_000
  );

  it("rejects non-existent file", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const cmd = createRunCommand(["/tmp/no-such-file-gateway.ts"]);
    const code = await cmd.execute();
    expect(code).toBe(1);
    expect(
      errSpy.mock.calls.some((c) => c[0].includes("File not found"))
    ).toBe(true);
  });

  it("rejects invalid port", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const cmd = createRunCommand([
      path.join(fixturesDir, "test-gateway.ts"),
      "--port",
      "99999",
    ]);
    const code = await cmd.execute();
    expect(code).toBe(1);
    expect(
      errSpy.mock.calls.some((c) => c[0].includes("Invalid port"))
    ).toBe(true);
  });
});
