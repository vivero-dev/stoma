let o = null, s = null;
self.onmessage = async (c) => {
  const e = c.data;
  if (e.type === "deploy") {
    try {
      s && (URL.revokeObjectURL(s), s = null);
      const t = new Blob([e.code], { type: "application/javascript" });
      s = URL.createObjectURL(t);
      const r = await import(
        /* @vite-ignore */
        s
      );
      if (typeof r.createPlaygroundGateway != "function")
        throw new Error(
          "Compiled code must export a `createPlaygroundGateway` function. Make sure your code has: export function createPlaygroundGateway() { ... }"
        );
      o = await r.createPlaygroundGateway(), self.postMessage({
        type: "deployed",
        registry: o._registry
      });
    } catch (t) {
      o = null, self.postMessage({
        type: "deploy-error",
        error: t instanceof Error ? t.message : String(t)
      });
    }
    return;
  }
  if (e.type === "request") {
    if (!o) {
      self.postMessage({
        type: "request-error",
        id: e.id,
        error: "No gateway deployed. Click 'Compile & Run' first."
      });
      return;
    }
    try {
      const t = `http://editor.local${e.path}`, r = {
        method: e.method,
        headers: {
          "x-stoma-debug": "trace",
          ...e.headers || {}
        }
      };
      e.body && !["GET", "HEAD"].includes(e.method) && (r.body = e.body);
      const i = new Request(t, r), d = performance.now(), a = await o.app.fetch(i), l = Math.round((performance.now() - d) * 100) / 100, n = {};
      a.headers.forEach((y, u) => {
        n[u] = y;
      });
      const p = await a.text();
      self.postMessage({
        type: "response",
        id: e.id,
        status: a.status,
        statusText: a.statusText,
        headers: n,
        body: p,
        timingMs: l
      });
    } catch (t) {
      self.postMessage({
        type: "request-error",
        id: e.id,
        error: t instanceof Error ? t.message : String(t)
      });
    }
  }
};
