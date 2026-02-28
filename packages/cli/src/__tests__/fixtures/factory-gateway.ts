import { createGateway, health } from "@vivero/stoma";
import { memoryAdapter } from "@vivero/stoma/adapters";

export default async () =>
  createGateway({
    name: "factory-gateway",
    adapter: memoryAdapter(),
    routes: [health({ path: "/health" })],
  });
