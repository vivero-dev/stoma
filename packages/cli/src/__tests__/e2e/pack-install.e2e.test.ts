/**
 * Pack-and-install E2E tests.
 *
 * Tests the actual published package experience for each package runner:
 *
 * 1. `yarn pack` both @vivero/stoma and @vivero/stoma-cli into tarballs
 * 2. For each runner (npm, yarn, pnpm, bun): create an isolated temp dir,
 *    install from tarballs using that runner's install command, run the
 *    installed binary, verify it starts and responds to a health check
 *
 * This catches: missing files in `files`, broken `publishConfig.exports`,
 * undeclared dependencies, tsup bundling issues, and runner-specific
 * resolution failures (Yarn PnP, pnpm symlinks, etc.).
 *
 * Deep behavioral assertions (header stripping, response shapes, etc.)
 * are covered by unit tests and the binary-smoke canary.
 *
 * Runners that aren't installed on the machine are automatically skipped.
 */
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execa, type ResultPromise } from "execa";
import getPort from "get-port";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(__dirname, "../../..");
const gatewayRoot = path.resolve(cliRoot, "../gateway");
const fixturePath = path.join(
  cliRoot,
  "src/__tests__/fixtures/test-gateway.ts"
);

// Stable tarball paths — cleaned up in afterAll
const gatewayTarball = path.join(gatewayRoot, "stoma-e2e.tgz");
const cliTarball = path.join(cliRoot, "stoma-cli-e2e.tgz");

// Peers that must be installed alongside the tarballs
const PEERS = ["hono@^4", "esbuild@^0.25"];

// ── Helpers ───────────────────────────────────────────────────────

async function isAvailable(bin: string): Promise<boolean> {
  try {
    await execa(bin, ["--version"], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

function waitForOutput(
  proc: ResultPromise,
  substring: string,
  timeoutMs = 15_000
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
      resolve(output);
    });
  });
}

interface RunnerEnv {
  tmpDir: string;
  binPath: string;
}

/**
 * Install from tarballs using a specific package manager, return the
 * path to the installed `stoma` binary.
 */
async function installWith(
  runner: "npm" | "yarn" | "pnpm" | "bun"
): Promise<RunnerEnv> {
  const tmpDir = mkdtempSync(path.join(tmpdir(), `stoma-e2e-${runner}-`));

  if (runner === "npm") {
    writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "stoma-e2e-npm", private: true, type: "module" })
    );
    await execa(
      "npm",
      ["install", "--no-package-lock", gatewayTarball, cliTarball, ...PEERS],
      { cwd: tmpDir, timeout: 60_000 }
    );
  } else if (runner === "yarn") {
    // Yarn 4: use node-modules linker so native deps (esbuild) work
    writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "stoma-e2e-yarn", private: true, type: "module" })
    );
    writeFileSync(
      path.join(tmpDir, ".yarnrc.yml"),
      "nodeLinker: node-modules\n"
    );
    await execa("yarn", ["init", "-p"], {
      cwd: tmpDir,
      timeout: 10_000,
      input: "\n",
    }).catch(() => {});
    await execa("yarn", ["add", gatewayTarball, cliTarball, ...PEERS], {
      cwd: tmpDir,
      timeout: 60_000,
    });
  } else if (runner === "pnpm") {
    writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "stoma-e2e-pnpm", private: true, type: "module" })
    );
    // --shamefully-hoist so transitive deps (e.g. hono used by @hono/node-server) resolve
    await execa(
      "pnpm",
      [
        "add",
        "--no-lockfile",
        "--shamefully-hoist",
        gatewayTarball,
        cliTarball,
        ...PEERS,
      ],
      { cwd: tmpDir, timeout: 60_000 }
    );
  } else if (runner === "bun") {
    writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "stoma-e2e-bun", private: true, type: "module" })
    );
    // Bun requires each tarball as a separate add call to avoid duplicates
    await execa("bun", ["add", ...PEERS], {
      cwd: tmpDir,
      timeout: 60_000,
    });
    await execa("bun", ["add", gatewayTarball], {
      cwd: tmpDir,
      timeout: 60_000,
    });
    await execa("bun", ["add", cliTarball], {
      cwd: tmpDir,
      timeout: 60_000,
    });
  }

  const binPath = path.join(tmpDir, "node_modules/.bin/stoma");
  if (!existsSync(binPath)) {
    throw new Error(`Binary not found at ${binPath} after ${runner} install`);
  }

  return { tmpDir, binPath };
}

/**
 * Wiring-only smoke test for an installed binary.
 *
 * Verifies that the package manager resolved all dependencies correctly
 * and the binary can start a server. Deep behavioral assertions (header
 * stripping, response shapes, etc.) belong in unit tests (wrap.test.ts)
 * and the built-binary canary (binary-smoke.e2e.test.ts).
 */
async function assertInstalledBinaryWorks(env: RunnerEnv) {
  const { tmpDir, binPath } = env;

  // 1. --version parses and exits cleanly
  const versionResult = await execa(binPath, ["--version"], {
    cwd: tmpDir,
    reject: false,
  });
  expect(versionResult.exitCode).toBe(0);
  expect(versionResult.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);

  // 2. Server starts and responds to a health check
  // Use the bin path directly (shebang handles execution) — do NOT prefix
  // with `node` because pnpm creates a shell wrapper at .bin/stoma
  const port = await getPort();
  const proc = execa(binPath, ["run", fixturePath, "--port", String(port)], {
    cwd: tmpDir,
    reject: false,
  });

  try {
    const startOutput = await waitForOutput(proc, "listening on");
    if (!startOutput.includes("listening on")) {
      throw new Error(`Server failed to start.\nOutput: ${startOutput}`);
    }

    const healthRes = await fetch(`http://localhost:${port}/health`);
    expect(healthRes.status).toBe(200);
  } finally {
    if (!proc.killed) {
      proc.kill("SIGTERM");
      try {
        await proc;
      } catch {
        // may have already exited
      }
    }
  }
}

// ── Setup & teardown ──────────────────────────────────────────────

const tmpDirs: string[] = [];

beforeAll(async () => {
  // Pack both packages into tarballs (shared across all runners)
  await Promise.all([
    execa("yarn", ["pack", "--out", "stoma-e2e.tgz"], { cwd: gatewayRoot }),
    execa("yarn", ["pack", "--out", "stoma-cli-e2e.tgz"], { cwd: cliRoot }),
  ]);
}, 30_000);

afterAll(() => {
  for (const dir of tmpDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  rmSync(gatewayTarball, { force: true });
  rmSync(cliTarball, { force: true });
});

// ── Runner-specific test suites ───────────────────────────────────

describe("npm install (simulates npx)", () => {
  let env: RunnerEnv;

  beforeAll(async () => {
    env = await installWith("npm");
    tmpDirs.push(env.tmpDir);
  }, 120_000);

  it("installed binary works end-to-end", async () => {
    await assertInstalledBinaryWorks(env);
  });
});

describe("yarn add (simulates yarn dlx)", async () => {
  const available = await isAvailable("yarn");
  let env: RunnerEnv;

  beforeAll(async () => {
    env = await installWith("yarn");
    tmpDirs.push(env.tmpDir);
  }, 120_000);

  it.skipIf(!available)("installed binary works end-to-end", async () => {
    await assertInstalledBinaryWorks(env);
  });
});

describe("pnpm add (simulates pnpm dlx)", async () => {
  const available = await isAvailable("pnpm");
  let env: RunnerEnv;

  beforeAll(async () => {
    if (!available) return;
    env = await installWith("pnpm");
    tmpDirs.push(env.tmpDir);
  }, 120_000);

  it.skipIf(!available)("installed binary works end-to-end", async () => {
    await assertInstalledBinaryWorks(env);
  });
});

describe("bun add (simulates bunx)", async () => {
  const available = await isAvailable("bun");
  let env: RunnerEnv;

  beforeAll(async () => {
    if (!available) return;
    env = await installWith("bun");
    tmpDirs.push(env.tmpDir);
  }, 120_000);

  it.skipIf(!available)("installed binary works end-to-end", async () => {
    await assertInstalledBinaryWorks(env);
  });
});
