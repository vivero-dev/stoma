import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { createCli } from "../cli.js";

function runCli(args: string[]) {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  let stdoutData = "";
  let stderrData = "";

  stdout.on("data", (chunk) => {
    stdoutData += chunk.toString();
  });
  stderr.on("data", (chunk) => {
    stderrData += chunk.toString();
  });

  const cli = createCli();
  const exitCode = cli.run(args, { stdout, stderr });

  return exitCode.then((code) => ({
    code,
    stdout: stdoutData,
    stderr: stderrData,
  }));
}

describe("CLI integration (Clipanion run() with stream capture)", () => {
  it("--version outputs a version string", async () => {
    const { code, stdout } = await runCli(["--version"]);
    expect(code).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("--help outputs usage information", async () => {
    const { code, stdout } = await runCli(["--help"]);
    expect(code).toBe(0);
    expect(stdout).toContain("stoma");
  });

  it("run --help shows run command usage", async () => {
    const { code, stdout } = await runCli(["run", "--help"]);
    expect(code).toBe(0);
    expect(stdout).toContain("Start a local HTTP server");
  });

  it("unknown command outputs error", async () => {
    const { code } = await runCli(["nonexistent-command"]);
    expect(code).toBe(1);
  });

  it("run without file outputs error", async () => {
    const { code } = await runCli(["run"]);
    expect(code).toBe(1);
  });

  it("outputs help text containing available commands", async () => {
    const { stdout } = await runCli(["--help"]);
    expect(stdout).toContain("run");
  });
});
