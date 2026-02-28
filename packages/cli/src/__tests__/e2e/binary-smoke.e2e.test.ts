import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execaNode } from "execa";
import getPort from "get-port";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(__dirname, "../../..");
const binPath = path.join(cliRoot, "dist/bin.js");
const fixturesDir = path.join(cliRoot, "src/__tests__/fixtures");

/**
 * Wait for a substring to appear in the process stdout.
 * Resolves with the accumulated output, rejects on timeout.
 */
function waitForOutput(
  proc: ReturnType<typeof execaNode>,
  substring: string,
  timeoutMs = 10_000
): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => {
      reject(
        new Error(
          `Timed out waiting for "${substring}" in output.\nGot: ${output}`
        )
      );
    }, timeoutMs);

    proc.stdout?.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      if (output.includes(substring)) {
        clearTimeout(timeout);
        resolve(output);
      }
    });

    proc.stderr?.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      if (output.includes(substring)) {
        clearTimeout(timeout);
        resolve(output);
      }
    });

    proc.on("exit", () => {
      clearTimeout(timeout);
      // If the process exits before we find the substring, resolve with what we have
      resolve(output);
    });
  });
}

beforeAll(() => {
  if (!existsSync(binPath)) {
    throw new Error(
      `Built binary not found at ${binPath}. Run "yarn build" before E2E tests.`
    );
  }
});

describe("stoma binary (subprocess via execa)", () => {
  let childProc: ReturnType<typeof execaNode> | undefined;

  afterEach(async () => {
    if (childProc && !childProc.killed) {
      childProc.kill("SIGTERM");
      try {
        await childProc;
      } catch {
        // Process may have already exited
      }
      childProc = undefined;
    }
  });

  it("--version exits 0 and outputs version", async () => {
    const result = await execaNode(binPath, ["--version"], { cwd: cliRoot });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("--help exits 0 and outputs usage", async () => {
    const result = await execaNode(binPath, ["--help"], { cwd: cliRoot });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("stoma");
  });

  it("run --help shows run-specific help", async () => {
    const result = await execaNode(binPath, ["run", "--help"], {
      cwd: cliRoot,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Start a local HTTP server");
  });

  it("run fixture starts server and responds to requests", async () => {
    const port = await getPort();
    const fixturePath = path.join(fixturesDir, "test-gateway.ts");

    childProc = execaNode(
      binPath,
      ["run", fixturePath, "--port", String(port)],
      { cwd: cliRoot, reject: false }
    );

    // Wait for the server to start
    await waitForOutput(childProc, "listening on");

    // Test that the gateway responds
    const res = await fetch(`http://localhost:${port}/health`);
    expect(res.status).toBe(200);

    // Shutdown
    childProc.kill("SIGTERM");
    await childProc;
  });

  it("non-existent file exits non-zero", async () => {
    const result = await execaNode(
      binPath,
      ["run", "/tmp/no-such-file-e2e.ts"],
      { cwd: cliRoot, reject: false }
    );
    expect(result.exitCode).not.toBe(0);
  });

  it("invalid port exits non-zero", async () => {
    const fixturePath = path.join(fixturesDir, "test-gateway.ts");
    const result = await execaNode(
      binPath,
      ["run", fixturePath, "--port", "99999"],
      { cwd: cliRoot, reject: false }
    );
    expect(result.exitCode).not.toBe(0);
  });

  it("remote URL without --trust-remote exits non-zero", async () => {
    const result = await execaNode(
      binPath,
      ["run", "https://example.com/gw.ts"],
      { cwd: cliRoot, reject: false }
    );
    expect(result.exitCode).not.toBe(0);
    const combined = result.stdout + result.stderr;
    expect(combined).toContain("--trust-remote");
  });

  it("--playground shows playground endpoint in output", async () => {
    const port = await getPort();
    const fixturePath = path.join(fixturesDir, "test-gateway.ts");

    childProc = execaNode(
      binPath,
      ["run", fixturePath, "--port", String(port), "--playground"],
      { cwd: cliRoot, reject: false }
    );

    const output = await waitForOutput(childProc, "Playground:");
    expect(output).toContain("__playground");

    // Verify playground endpoint responds
    const res = await fetch(`http://localhost:${port}/__playground`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    childProc.kill("SIGTERM");
    await childProc;
  });

  it("--playground /registry returns routes JSON", async () => {
    const port = await getPort();
    const fixturePath = path.join(fixturesDir, "test-gateway.ts");

    childProc = execaNode(
      binPath,
      ["run", fixturePath, "--port", String(port), "--playground"],
      { cwd: cliRoot, reject: false }
    );

    await waitForOutput(childProc, "Playground:");

    const res = await fetch(`http://localhost:${port}/__playground/registry`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { routes: unknown[] };
    expect(Array.isArray(data.routes)).toBe(true);
    expect(data.routes.length).toBeGreaterThan(0);

    childProc.kill("SIGTERM");
    await childProc;
  });

  it("--playground /send proxies requests and returns response shape", async () => {
    const port = await getPort();
    const fixturePath = path.join(fixturesDir, "test-gateway.ts");

    childProc = execaNode(
      binPath,
      ["run", fixturePath, "--port", String(port), "--playground"],
      { cwd: cliRoot, reject: false }
    );

    await waitForOutput(childProc, "Playground:");

    const res = await fetch(`http://localhost:${port}/__playground/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method: "GET", path: "/echo" }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data.status).toBe(200);
    expect(data.body).toBe('{"ok":true}');
    expect(typeof data.elapsed).toBe("number");

    childProc.kill("SIGTERM");
    await childProc;
  });

  it("--playground /send does not leak encoding headers", async () => {
    const port = await getPort();
    const fixturePath = path.join(fixturesDir, "test-gateway.ts");

    childProc = execaNode(
      binPath,
      ["run", fixturePath, "--port", String(port), "--playground"],
      { cwd: cliRoot, reject: false }
    );

    await waitForOutput(childProc, "Playground:");

    const res = await fetch(`http://localhost:${port}/__playground/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method: "GET", path: "/echo" }),
    });

    const data = (await res.json()) as { headers: Record<string, string> };
    expect(data.headers).not.toHaveProperty("content-encoding");
    expect(data.headers).not.toHaveProperty("content-length");
    expect(data.headers).not.toHaveProperty("transfer-encoding");

    childProc.kill("SIGTERM");
    await childProc;
  });

  it("--verbose shows route table in output", async () => {
    const port = await getPort();
    const fixturePath = path.join(fixturesDir, "test-gateway.ts");

    childProc = execaNode(
      binPath,
      ["run", fixturePath, "--port", String(port), "--verbose"],
      { cwd: cliRoot, reject: false }
    );

    const output = await waitForOutput(childProc, "/echo");
    expect(output).toContain("/health");
    expect(output).toContain("/echo");

    childProc.kill("SIGTERM");
    await childProc;
  });
});
