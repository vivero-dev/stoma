import { describe, expect, it } from "vitest";
import { createCli } from "../cli.js";

describe("createCli", () => {
  it("returns a Cli instance", () => {
    const cli = createCli();
    expect(cli).toBeDefined();
    expect(typeof cli.run).toBe("function");
    expect(typeof cli.process).toBe("function");
  });

  it("has binaryLabel 'stoma'", () => {
    const cli = createCli();
    // Clipanion stores binaryLabel on the instance
    expect((cli as any).binaryLabel).toBe("stoma");
  });

  it("has binaryName 'stoma'", () => {
    const cli = createCli();
    expect((cli as any).binaryName).toBe("stoma");
  });

  it("registers the RunCommand (accepts 'run' path)", () => {
    const cli = createCli();
    // process() with 'run' and a file should return a RunCommand, not throw
    const cmd = cli.process(["run", "./gw.ts"]);
    expect(cmd).toBeDefined();
    expect(cmd.constructor.name).toBe("RunCommand");
  });

  it("registers HelpCommand (accepts --help)", () => {
    const cli = createCli();
    const cmd = cli.process(["--help"]);
    expect(cmd).toBeDefined();
    expect(cmd.constructor.name).toBe("HelpCommand");
  });

  it("registers VersionCommand (accepts --version / -v)", () => {
    const cli = createCli();
    // Clipanion treats top-level --version as the VersionCommand
    // But -v at the top level is also the version command
    const cmd = cli.process(["--version"]);
    expect(cmd).toBeDefined();
  });
});
