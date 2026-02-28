import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveGateway } from "../resolve.js";

// Store the real fetch so we can restore it
const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("resolveGateway remote URLs", () => {
  describe("with --trust-remote", () => {
    it("fetches and resolves a TypeScript gateway from URL", async () => {
      const tsSource = `
        export default {
          fetch: (req: Request) => new Response("remote-ok"),
        };
      `;

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(tsSource, {
          status: 200,
          headers: { "content-type": "application/typescript" },
        })
      );

      const gw = await resolveGateway("https://example.com/gw.ts", {
        trustRemote: true,
      });

      expect(gw.name).toBe("unnamed-gateway");
      const res = await gw.app.fetch(new Request("http://localhost/test"));
      expect(await res.text()).toBe("remote-ok");
    });

    it("infers .mjs for javascript content-type", async () => {
      const jsSource = `
        export default {
          fetch: (req) => new Response("js-ok"),
        };
      `;

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(jsSource, {
          status: 200,
          headers: { "content-type": "application/javascript" },
        })
      );

      const gw = await resolveGateway("https://example.com/api/gateway", {
        trustRemote: true,
      });

      expect(gw.name).toBe("unnamed-gateway");
    });

    it("infers .ts for unknown content-type", async () => {
      const tsSource = `
        export default {
          fetch: (req: Request) => new Response("ts-inferred"),
        };
      `;

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(tsSource, {
          status: 200,
          headers: { "content-type": "text/plain" },
        })
      );

      const gw = await resolveGateway("https://example.com/gateway", {
        trustRemote: true,
      });

      expect(gw.name).toBe("unnamed-gateway");
    });

    it("cleans up temp directory after resolution", async () => {
      const { readdirSync } = await import("node:fs");
      const { tmpdir } = await import("node:os");

      const tsSource = `export default { fetch: () => new Response("ok") };`;
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(tsSource, {
          status: 200,
          headers: { "content-type": "application/typescript" },
        })
      );

      await resolveGateway("https://example.com/gw.ts", {
        trustRemote: true,
      });

      // Check no stoma-remote- dirs are left
      const tmpDirs = readdirSync(tmpdir()).filter((d) =>
        d.startsWith("stoma-remote-")
      );
      expect(tmpDirs).toHaveLength(0);
    });

    it("throws descriptive error for HTTP 404", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response("Not Found", { status: 404, statusText: "Not Found" })
      );

      await expect(
        resolveGateway("https://example.com/missing.ts", {
          trustRemote: true,
        })
      ).rejects.toThrow(/404/);
    });

    it("throws descriptive error for HTTP 500", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response("Internal Server Error", {
          status: 500,
          statusText: "Internal Server Error",
        })
      );

      await expect(
        resolveGateway("https://example.com/error.ts", {
          trustRemote: true,
        })
      ).rejects.toThrow(/500/);
    });

    it("throws descriptive error for network failure", async () => {
      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(new Error("getaddrinfo ENOTFOUND example.com"));

      await expect(
        resolveGateway("https://example.com/gw.ts", {
          trustRemote: true,
        })
      ).rejects.toThrow();
    });
  });

  describe("without --trust-remote", () => {
    it("rejects with security warning", async () => {
      await expect(
        resolveGateway("https://example.com/gw.ts")
      ).rejects.toThrow("--trust-remote");
    });
  });
});
