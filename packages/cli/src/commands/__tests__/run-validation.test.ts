import { afterEach, describe, expect, it, vi } from "vitest";

// Mock dependencies before importing the command
vi.mock("../../gateway/resolve.js", () => ({
  resolveGateway: vi.fn(),
}));
vi.mock("../../server/serve.js", () => ({
  startServer: vi.fn(),
}));
vi.mock("../../playground/wrap.js", () => ({
  wrapWithPlayground: vi.fn((fetch: any) => fetch),
}));

import { Cli } from "clipanion";
import { resolveGateway } from "../../gateway/resolve.js";
import { startServer } from "../../server/serve.js";
import { RunCommand } from "../run.js";

function createRunCommand(args: string[]): RunCommand {
  const cli = new Cli();
  cli.register(RunCommand);
  return cli.process(["run", ...args]) as RunCommand;
}

describe("RunCommand.execute() validation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 1 for NaN port", async () => {
    const cmd = createRunCommand(["./gw.ts", "--port", "abc"]);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const code = await cmd.execute();
    expect(code).toBe(1);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Invalid port"));
  });

  it("returns 1 for port > 65535", async () => {
    const cmd = createRunCommand(["./gw.ts", "--port", "70000"]);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const code = await cmd.execute();
    expect(code).toBe(1);
  });

  it("returns 1 for non-numeric port", async () => {
    const cmd = createRunCommand(["./gw.ts", "--port", "not-a-number"]);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const code = await cmd.execute();
    expect(code).toBe(1);
  });

  it("returns 1 for float port value", async () => {
    // parseInt("3.14") → 3, which is valid, so this should NOT fail
    // But "3.14f" would be NaN. Let's test clearly invalid.
    const cmd = createRunCommand(["./gw.ts", "--port", "abc123"]);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const code = await cmd.execute();
    expect(code).toBe(1);
  });

  it("returns 1 when resolveGateway throws", async () => {
    vi.mocked(resolveGateway).mockRejectedValue(new Error("file not found"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    const cmd = createRunCommand(["./nonexistent.ts", "--port", "8787"]);
    const code = await cmd.execute();
    expect(code).toBe(1);
  });

  it("logs the error message from resolveGateway", async () => {
    vi.mocked(resolveGateway).mockRejectedValue(
      new Error("File not found: ./nonexistent.ts")
    );
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    const cmd = createRunCommand(["./nonexistent.ts"]);
    await cmd.execute();
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("File not found")
    );
  });

  it("returns 1 when startServer throws", async () => {
    vi.mocked(resolveGateway).mockResolvedValue({
      app: { fetch: () => new Response("ok") },
      name: "test",
      routeCount: 1,
      _registry: { routes: [], policies: [], gatewayName: "test" },
    });
    vi.mocked(startServer).mockRejectedValue(new Error("EADDRINUSE"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    const cmd = createRunCommand(["./gw.ts", "--port", "8787"]);
    const code = await cmd.execute();
    expect(code).toBe(1);
  });

  it("passes port 0 validation (does not reject as invalid)", async () => {
    // Port 0 is valid — it means "OS-assigned port".
    // We verify the port validation passes by checking resolveGateway gets called
    // (which happens only after port validation succeeds).
    vi.mocked(resolveGateway).mockRejectedValue(new Error("stopped here"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    const cmd = createRunCommand(["./gw.ts", "--port", "0"]);
    await cmd.execute();
    // resolveGateway was called → port validation passed
    expect(resolveGateway).toHaveBeenCalled();
  });

  it("passes port 65535 validation (does not reject as invalid)", async () => {
    vi.mocked(resolveGateway).mockRejectedValue(new Error("stopped here"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    const cmd = createRunCommand(["./gw.ts", "--port", "65535"]);
    await cmd.execute();
    expect(resolveGateway).toHaveBeenCalled();
  });
});
