import { Cli } from "clipanion";
import { describe, expect, it } from "vitest";
import { RunCommand } from "../run.js";

function parseRunArgs(args: string[]): RunCommand {
  const cli = new Cli();
  cli.register(RunCommand);
  return cli.process(["run", ...args]) as RunCommand;
}

describe("RunCommand option parsing", () => {
  describe("positional file argument", () => {
    it("captures the file argument", () => {
      const cmd = parseRunArgs(["./gateway.ts"]);
      expect(cmd.file).toBe("./gateway.ts");
    });

    it("captures absolute paths", () => {
      const cmd = parseRunArgs(["/home/user/gw.ts"]);
      expect(cmd.file).toBe("/home/user/gw.ts");
    });

    it("captures remote URLs", () => {
      const cmd = parseRunArgs(["https://example.com/gw.ts"]);
      expect(cmd.file).toBe("https://example.com/gw.ts");
    });
  });

  describe("--port / -p", () => {
    it("defaults to 8787", () => {
      const cmd = parseRunArgs(["./gw.ts"]);
      expect(cmd.port).toBe("8787");
    });

    it("accepts custom value with --port", () => {
      const cmd = parseRunArgs(["./gw.ts", "--port", "3000"]);
      expect(cmd.port).toBe("3000");
    });

    it("accepts short -p flag", () => {
      const cmd = parseRunArgs(["./gw.ts", "-p", "4000"]);
      expect(cmd.port).toBe("4000");
    });
  });

  describe("--host / -H", () => {
    it("defaults to localhost", () => {
      const cmd = parseRunArgs(["./gw.ts"]);
      expect(cmd.host).toBe("localhost");
    });

    it("accepts custom hostname", () => {
      const cmd = parseRunArgs(["./gw.ts", "--host", "0.0.0.0"]);
      expect(cmd.host).toBe("0.0.0.0");
    });

    it("accepts short -H flag", () => {
      const cmd = parseRunArgs(["./gw.ts", "-H", "127.0.0.1"]);
      expect(cmd.host).toBe("127.0.0.1");
    });
  });

  describe("boolean flags", () => {
    it("--debug defaults to false", () => {
      const cmd = parseRunArgs(["./gw.ts"]);
      expect(cmd.debug).toBe(false);
    });

    it("--debug sets to true", () => {
      const cmd = parseRunArgs(["./gw.ts", "--debug"]);
      expect(cmd.debug).toBe(true);
    });

    it("-d sets debug to true", () => {
      const cmd = parseRunArgs(["./gw.ts", "-d"]);
      expect(cmd.debug).toBe(true);
    });

    it("--verbose defaults to false", () => {
      const cmd = parseRunArgs(["./gw.ts"]);
      expect(cmd.verbose).toBe(false);
    });

    it("--verbose / -v sets to true", () => {
      const cmd = parseRunArgs(["./gw.ts", "-v"]);
      expect(cmd.verbose).toBe(true);
    });

    it("--playground defaults to false", () => {
      const cmd = parseRunArgs(["./gw.ts"]);
      expect(cmd.playground).toBe(false);
    });

    it("--playground sets to true", () => {
      const cmd = parseRunArgs(["./gw.ts", "--playground"]);
      expect(cmd.playground).toBe(true);
    });

    it("--trust-remote defaults to false", () => {
      const cmd = parseRunArgs(["./gw.ts"]);
      expect(cmd.trustRemote).toBe(false);
    });

    it("--trust-remote sets to true", () => {
      const cmd = parseRunArgs(["./gw.ts", "--trust-remote"]);
      expect(cmd.trustRemote).toBe(true);
    });
  });
});
