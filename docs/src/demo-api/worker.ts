// Cloudflare Worker entry point for the Stoma docs site.
// Routes /demo-api/* to the Stoma demo gateway, everything else to static assets.

import { gateway } from "./gateway";

interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/demo-api/") || url.pathname === "/demo-api") {
      return gateway.app.fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};
