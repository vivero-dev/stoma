import { describe, expect, it } from "vitest";
import { filenameFromUrl } from "../resolve.js";

describe("filenameFromUrl", () => {
  describe("URLs with recognised extensions", () => {
    it("returns basename for .ts", () => {
      expect(filenameFromUrl("https://example.com/my-gateway.ts", null)).toBe(
        "my-gateway.ts"
      );
    });

    it("returns basename for .tsx", () => {
      expect(filenameFromUrl("https://example.com/app.tsx", null)).toBe(
        "app.tsx"
      );
    });

    it("returns basename for .mts", () => {
      expect(filenameFromUrl("https://example.com/gw.mts", null)).toBe(
        "gw.mts"
      );
    });

    it("returns basename for .js", () => {
      expect(filenameFromUrl("https://example.com/gateway.js", null)).toBe(
        "gateway.js"
      );
    });

    it("returns basename for .mjs", () => {
      expect(filenameFromUrl("https://example.com/gateway.mjs", null)).toBe(
        "gateway.mjs"
      );
    });

    it("returns basename for .cjs", () => {
      expect(filenameFromUrl("https://example.com/gateway.cjs", null)).toBe(
        "gateway.cjs"
      );
    });
  });

  describe("content-type fallback", () => {
    it("returns gateway.mjs for javascript content-type", () => {
      expect(
        filenameFromUrl("https://example.com/api/gateway", "application/javascript")
      ).toBe("gateway.mjs");
    });

    it("returns gateway.mjs for text/javascript content-type", () => {
      expect(
        filenameFromUrl("https://example.com/api/gw", "text/javascript")
      ).toBe("gateway.mjs");
    });

    it("returns gateway.ts for typescript content-type", () => {
      expect(
        filenameFromUrl(
          "https://example.com/api/gateway",
          "application/typescript"
        )
      ).toBe("gateway.ts");
    });
  });

  describe("no extension + no content-type", () => {
    it("appends .ts to the basename", () => {
      expect(filenameFromUrl("https://example.com/my-config", null)).toBe(
        "my-config.ts"
      );
    });

    it("returns gateway.ts for root path", () => {
      expect(filenameFromUrl("https://example.com/", null)).toBe("gateway.ts");
    });
  });

  describe("edge cases", () => {
    it("handles query strings", () => {
      expect(
        filenameFromUrl("https://example.com/gw.ts?v=2&token=abc", null)
      ).toBe("gw.ts");
    });

    it("handles fragments", () => {
      expect(
        filenameFromUrl("https://example.com/gw.ts#section", null)
      ).toBe("gw.ts");
    });
  });
});
