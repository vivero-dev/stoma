import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { geoIpFilter } from "../geo-ip-filter";

describe("geoIpFilter", () => {
  // --- Allow mode ---

  it("should allow requests from allowed countries in allow mode", async () => {
    const { request } = createPolicyTestHarness(
      geoIpFilter({ mode: "allow", allow: ["US", "CA", "GB"] })
    );

    const res = await request("/test", {
      headers: { "cf-ipcountry": "US" },
    });
    expect(res.status).toBe(200);
  });

  it("should block requests from non-allowed countries in allow mode", async () => {
    const { request } = createPolicyTestHarness(
      geoIpFilter({ mode: "allow", allow: ["US", "CA"] })
    );

    const res = await request("/test", {
      headers: { "cf-ipcountry": "RU" },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("geo_denied");
  });

  // --- Deny mode ---

  it("should block requests from denied countries in deny mode", async () => {
    const { request } = createPolicyTestHarness(
      geoIpFilter({ mode: "deny", deny: ["CN", "RU"] })
    );

    const res = await request("/test", {
      headers: { "cf-ipcountry": "CN" },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("geo_denied");
  });

  it("should allow requests from non-denied countries in deny mode", async () => {
    const { request } = createPolicyTestHarness(
      geoIpFilter({ mode: "deny", deny: ["CN", "RU"] })
    );

    const res = await request("/test", {
      headers: { "cf-ipcountry": "US" },
    });
    expect(res.status).toBe(200);
  });

  // --- Case insensitivity ---

  it("should match country codes case-insensitively", async () => {
    const { request } = createPolicyTestHarness(
      geoIpFilter({ mode: "deny", deny: ["cn", "ru"] })
    );

    const res = await request("/test", {
      headers: { "cf-ipcountry": "CN" },
    });
    expect(res.status).toBe(403);
  });

  it("should match lowercase header values against uppercase config", async () => {
    const { request } = createPolicyTestHarness(
      geoIpFilter({ mode: "allow", allow: ["US", "CA"] })
    );

    const res = await request("/test", {
      headers: { "cf-ipcountry": "us" },
    });
    expect(res.status).toBe(200);
  });

  // --- Missing header ---

  it("should deny when country header is missing in allow mode", async () => {
    const { request } = createPolicyTestHarness(
      geoIpFilter({ mode: "allow", allow: ["US"] })
    );

    const res = await request("/test");
    expect(res.status).toBe(403);
  });

  it("should allow when country header is missing in deny mode", async () => {
    const { request } = createPolicyTestHarness(
      geoIpFilter({ mode: "deny", deny: ["CN"] })
    );

    const res = await request("/test");
    expect(res.status).toBe(200);
  });

  // --- Custom header ---

  it("should read country from a custom header", async () => {
    const { request } = createPolicyTestHarness(
      geoIpFilter({
        mode: "deny",
        deny: ["DE"],
        countryHeader: "x-country-code",
      })
    );

    const res = await request("/test", {
      headers: { "x-country-code": "DE" },
    });
    expect(res.status).toBe(403);
  });

  // --- Skip logic ---

  it("should skip the policy when skip returns true", async () => {
    const { request } = createPolicyTestHarness(
      geoIpFilter({
        mode: "deny",
        deny: ["CN"],
        skip: () => true,
      })
    );

    const res = await request("/test", {
      headers: { "cf-ipcountry": "CN" },
    });
    expect(res.status).toBe(200);
  });

  // --- Defaults ---

  it("should default to deny mode", async () => {
    const { request } = createPolicyTestHarness(geoIpFilter({ deny: ["CN"] }));

    const res = await request("/test", {
      headers: { "cf-ipcountry": "CN" },
    });
    expect(res.status).toBe(403);
  });

  it("should have priority IP_FILTER (1)", () => {
    const policy = geoIpFilter({ deny: ["CN"] });
    expect(policy.priority).toBe(1);
  });
});
