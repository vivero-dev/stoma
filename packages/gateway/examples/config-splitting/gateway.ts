// Configuration splitting: organize a large gateway config across
// multiple files using mergeConfigs(). Each team owns their routes
// in a separate module; the entrypoint composes them together.

import { createGateway, health, cors, requestLog, rateLimit } from "@homegrower-club/stoma";
import { mergeConfigs } from "@homegrower-club/stoma/config";
import type { GatewayConfig } from "@homegrower-club/stoma";
import { authRoutes } from "./routes/auth";
import { apiRoutes } from "./routes/api";

// Shared base config — gateway-wide settings
const baseConfig: Partial<GatewayConfig> = {
  name: "platform-api",
  basePath: "/api",
  policies: [
    cors({ origins: ["https://app.example.com"] }),
    requestLog(),
    rateLimit({ max: 500, windowSeconds: 60 }),
  ],
};

// Compose all configs together
const gateway = createGateway(
  mergeConfigs(
    baseConfig,
    { routes: [health({ path: "/health" })] },
    authRoutes,
    apiRoutes,
  ),
);

export default gateway;
