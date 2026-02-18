// Traffic shadow recipe: mirror production traffic to a new upstream
// version without affecting user responses. Shadow requests are
// fire-and-forget — failures never impact the primary response.
// Demo API: https://stoma.vivero.dev/demo-api

import { createGateway, trafficShadow } from "@vivero/stoma";

const gateway = createGateway({
  name: "shadow-release",
  routes: [
    {
      path: "/v1/orders/*",
      methods: ["GET", "POST", "PUT"],
      pipeline: {
        policies: [
          trafficShadow({
            // Mirror 10% of write traffic to v2 for verification
            target: "https://stoma.vivero.dev/demo-api",
            percentage: 10,
            methods: ["POST", "PUT"],
            timeout: 3000,
          }),
        ],
        upstream: {
          // Primary responses still come from stable v1
          type: "url",
          target: "https://stoma.vivero.dev/demo-api",
        },
      },
    },
  ],
});

export default gateway;
