import type { GatewayInstance } from "@homegrower-club/stoma";
import { describe, expect, it } from "vitest";

import basic from "../basic/gateway";
import cacheResilience from "../cache-resilience/gateway";
import cachingAdvanced from "../caching/advanced";
import cachingBasic from "../caching/basic";
import configSplitting from "../config-splitting/gateway";
import hmac from "../jwt-auth/hmac";
import jwks from "../jwt-auth/jwks";
import oauthSupabase from "../oauth-supabase/gateway";
import postgresAdapterExample from "../postgres-adapter/gateway";
import realWorld from "../real-world/gateway";
import redisAdapterExample from "../redis-adapter/gateway";
import routeScopes from "../route-scopes/gateway";
import serviceBinding from "../service-binding/gateway";
import shadowRelease from "../shadow-release/gateway";
import webhookFirewall from "../webhook-firewall/gateway";

const examples: Record<string, GatewayInstance> = {
  "basic/gateway": basic,
  "jwt-auth/hmac": hmac,
  "jwt-auth/jwks": jwks,
  "caching/basic": cachingBasic,
  "caching/advanced": cachingAdvanced,
  "oauth-supabase/gateway": oauthSupabase,
  "real-world/gateway": realWorld,
  "webhook-firewall/gateway": webhookFirewall,
  "cache-resilience/gateway": cacheResilience,
  "shadow-release/gateway": shadowRelease,
  "config-splitting/gateway": configSplitting,
  "route-scopes/gateway": routeScopes,
  "service-binding/gateway": serviceBinding,
  "redis-adapter/gateway": redisAdapterExample,
  "postgres-adapter/gateway": postgresAdapterExample,
};

describe("examples", () => {
  for (const [name, mod] of Object.entries(examples)) {
    it(`${name} exports a valid gateway`, () => {
      expect(mod).toBeDefined();
      expect(mod.app).toBeDefined();
      expect(typeof mod.app.fetch).toBe("function");
    });
  }
});
