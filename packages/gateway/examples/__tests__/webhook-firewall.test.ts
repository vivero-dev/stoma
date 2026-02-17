import { describe, expect, it } from "vitest";
import webhookFirewall from "../webhook-firewall/gateway";

describe("webhook-firewall example", () => {
  it("should export a valid gateway", () => {
    expect(webhookFirewall).toBeDefined();
    expect(webhookFirewall.app).toBeDefined();
    expect(typeof webhookFirewall.app.fetch).toBe("function");
  });

  it("should reject requests without the signature header", async () => {
    const res = await webhookFirewall.app.fetch(
      new Request("http://localhost/webhooks/provider-a", {
        method: "POST",
        body: JSON.stringify({ test: "data" }),
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(res.status).toBe(401);
  });
});
