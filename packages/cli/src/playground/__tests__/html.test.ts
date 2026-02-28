import { describe, expect, it } from "vitest";
import { mockRegistry } from "../../__tests__/helpers/mock-gateway.js";
import { playgroundHtml } from "../html.js";

describe("playgroundHtml", () => {
  it("returns valid HTML with DOCTYPE", () => {
    const html = playgroundHtml(mockRegistry());
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("contains the gateway name in the title", () => {
    const html = playgroundHtml(mockRegistry({ gatewayName: "my-api" }));
    expect(html).toContain("my-api");
    expect(html).toContain("Stoma Playground");
  });

  it("embeds registry as JSON in a script", () => {
    const registry = mockRegistry();
    const html = playgroundHtml(registry);
    // The registry should be embedded as a JS variable
    expect(html).toContain("var registry =");
    // Route paths should be present
    expect(html).toContain("/api/hello");
    expect(html).toContain("/api/data");
  });

  it("escapes < in registry JSON to prevent XSS", () => {
    const registry = mockRegistry({
      gatewayName: "test<script>alert(1)</script>",
    });
    const html = playgroundHtml(registry);
    // The < should be escaped in the JSON blob
    expect(html).toContain("\\u003c");
    // But the raw <script> should NOT appear unescaped inside the registry JSON
    const registryMatch = html.match(/var registry = (.+?);/);
    expect(registryMatch).toBeTruthy();
    expect(registryMatch![1]).not.toContain("<script>");
  });

  it("contains route chip rendering logic", () => {
    const html = playgroundHtml(mockRegistry());
    // CSS class definition and JS route chip creation
    expect(html).toContain(".chip{");
    expect(html).toContain('id="routes"');
    expect(html).toContain('className = "chip"');
  });

  it("contains the form handler", () => {
    const html = playgroundHtml(mockRegistry());
    expect(html).toContain('id="form"');
    expect(html).toContain('id="send"');
    expect(html).toContain("__playground/send");
  });

  it("contains token store JS", () => {
    const html = playgroundHtml(mockRegistry());
    expect(html).toContain("stoma-playground-tokens");
    expect(html).toContain("localStorage");
  });

  it("escapes special characters in gateway name for HTML context", () => {
    const registry = mockRegistry({
      gatewayName: 'My "Gateway" & <Friends>',
    });
    const html = playgroundHtml(registry);
    // In the <title> the name goes through esc() which converts & < > "
    expect(html).toContain("&amp;");
    expect(html).toContain("&lt;");
    expect(html).toContain("&gt;");
  });
});
