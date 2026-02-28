import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { startServer } from "../serve.js";

describe("startServer", () => {
  let server: Server | undefined;

  afterEach(async () => {
    if (server) {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = undefined;
    }
  });

  it("starts on port 0 and resolves with a Server instance", async () => {
    server = await startServer({
      fetch: () => new Response("ok"),
      port: 0,
      hostname: "127.0.0.1",
    });
    expect(server).toBeDefined();
    expect(typeof server.close).toBe("function");
  });

  it("responds to HTTP requests via the fetch function", async () => {
    server = await startServer({
      fetch: () =>
        new Response(JSON.stringify({ hello: "world" }), {
          headers: { "content-type": "application/json" },
        }),
      port: 0,
      hostname: "127.0.0.1",
    });

    const address = server.address();
    const port =
      typeof address === "object" && address ? address.port : undefined;
    expect(port).toBeDefined();

    const res = await fetch(`http://127.0.0.1:${port}/test`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ hello: "world" });
  });

  it("uses the specified hostname", async () => {
    server = await startServer({
      fetch: () => new Response("ok"),
      port: 0,
      hostname: "127.0.0.1",
    });

    const address = server.address();
    expect(typeof address === "object" && address?.address).toBe("127.0.0.1");
  });

  it("rejects with descriptive message for EADDRINUSE", async () => {
    // Start first server to occupy a port
    server = await startServer({
      fetch: () => new Response("first"),
      port: 0,
      hostname: "127.0.0.1",
    });

    const address = server.address();
    const port =
      typeof address === "object" && address ? address.port : 0;

    // Try to start second server on the same port
    await expect(
      startServer({
        fetch: () => new Response("second"),
        port,
        hostname: "127.0.0.1",
      })
    ).rejects.toThrow(/already in use/);
  });

  it("server can be closed", async () => {
    server = await startServer({
      fetch: () => new Response("ok"),
      port: 0,
      hostname: "127.0.0.1",
    });

    const address = server.address();
    const port =
      typeof address === "object" && address ? address.port : 0;

    // Close the server
    server.closeAllConnections();
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;

    // Requests should now fail
    await expect(
      fetch(`http://127.0.0.1:${port}/test`)
    ).rejects.toThrow();
  });
});
