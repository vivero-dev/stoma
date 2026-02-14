// Webhook firewall recipe: accept third-party webhooks safely by
// layering authentication, size limits, and threat checks before
// your internal handler sees the request.
// Demo API: https://stoma.opensource.homegrower.club/demo-api

import {
  createGateway,
  apiKeyAuth,
  requestLimit,
  jsonThreatProtection,
  regexThreatProtection,
  rateLimit,
} from "@homegrower-club/stoma";

const gateway = createGateway({
  name: "webhook-firewall",
  routes: [
    {
      path: "/webhooks/provider-a",
      methods: ["POST"],
      pipeline: {
        policies: [
          // Validate the provider's signature header
          apiKeyAuth({
            headerName: "x-provider-signature",
            validate: (sig) => sig.length > 0,
          }),
          // Reject oversized payloads before processing
          requestLimit({ maxBytes: 128_000 }),
          // Protect against deeply nested or oversized JSON
          jsonThreatProtection({ maxDepth: 10, maxArraySize: 50 }),
          // Block script injection attempts in the body
          regexThreatProtection({
            patterns: [
              { regex: "<script", targets: ["body"] },
            ],
          }),
          // Contain abuse with bounded request rate
          rateLimit({ max: 120 }),
        ],
        upstream: {
          type: "url",
          target: "https://stoma.opensource.homegrower.club/demo-api",
        },
      },
    },
  ],
});

export default gateway;
