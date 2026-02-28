import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveGateway } from "../resolve.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "../../__tests__/fixtures");

describe("resolveGateway integration (real esbuild + filesystem)", () => {
  it("loads test-gateway.ts fixture with working fetch handler", async () => {
    const fixturePath = path.join(fixturesDir, "test-gateway.ts");
    const gw = await resolveGateway(fixturePath);

    expect(gw.name).toBe("test-ts-gateway");
    expect(gw.routeCount).toBeGreaterThan(0);
    expect(gw._registry).toBeDefined();

    const res = await gw.app.fetch(new Request("http://localhost/health"));
    expect(res.status).toBe(200);
  });

  it("loads bare-hono-app.ts and wraps as unnamed-gateway", async () => {
    const fixturePath = path.join(fixturesDir, "bare-hono-app.ts");
    const gw = await resolveGateway(fixturePath);

    expect(gw.name).toBe("unnamed-gateway");
    expect(gw.routeCount).toBe(0);
    expect(gw.app.fetch).toBeDefined();

    const res = await gw.app.fetch(new Request("http://localhost/hello"));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("hello from bare hono");
  });

  it("loads factory-gateway.ts (async factory function)", async () => {
    const fixturePath = path.join(fixturesDir, "factory-gateway.ts");
    const gw = await resolveGateway(fixturePath);

    expect(gw.name).toBe("factory-gateway");
    expect(gw._registry).toBeDefined();
  });

  it("loads js-gateway.mjs without esbuild transpilation", async () => {
    const fixturePath = path.join(fixturesDir, "js-gateway.mjs");
    const gw = await resolveGateway(fixturePath);

    expect(gw.name).toBe("unnamed-gateway");

    const res = await gw.app.fetch(new Request("http://localhost/health"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });

  it("throws descriptive error for syntax-error.ts", async () => {
    const fixturePath = path.join(fixturesDir, "syntax-error.ts");
    await expect(resolveGateway(fixturePath)).rejects.toThrow(
      /Failed to transpile TypeScript/
    );
  });

  it("throws descriptive error for invalid-gateway.ts", async () => {
    const fixturePath = path.join(fixturesDir, "invalid-gateway.ts");
    await expect(resolveGateway(fixturePath)).rejects.toThrow(
      /Could not resolve a gateway/
    );
  });

  it("cleans up temp files after TypeScript transpilation", async () => {
    const { readdir } = await import("node:fs/promises");

    const fixturePath = path.join(fixturesDir, "test-gateway.ts");
    const dirBefore = await readdir(fixturesDir);

    await resolveGateway(fixturePath);

    // Allow filesystem to settle (Linux CI can lag behind unlink)
    let tmpFiles: string[] = [];
    for (let i = 0; i < 10; i++) {
      const dirAfter = await readdir(fixturesDir);
      tmpFiles = dirAfter.filter(
        (f) => f.includes("stoma-tmp") && !dirBefore.includes(f)
      );
      if (tmpFiles.length === 0) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    expect(tmpFiles).toHaveLength(0);
  });

  it("throws for non-existent file", async () => {
    await expect(
      resolveGateway("/tmp/absolutely-does-not-exist-gateway.ts")
    ).rejects.toThrow("File not found");
  });

  it("produces a gateway with functioning routes from the TS file", async () => {
    const fixturePath = path.join(fixturesDir, "test-gateway.ts");
    const gw = await resolveGateway(fixturePath);

    const res = await gw.app.fetch(new Request("http://localhost/echo"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("registry contains expected routes", async () => {
    const fixturePath = path.join(fixturesDir, "test-gateway.ts");
    const gw = await resolveGateway(fixturePath);

    const paths = gw._registry.routes.map((r) => r.path);
    expect(paths).toContain("/health");
    expect(paths).toContain("/echo");
  });
});
