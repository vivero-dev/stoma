let o = null, s = null;
self.onmessage = async (p) => {
  const e = p.data;
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
          accept: "application/json",
          "x-stoma-debug": "trace",
          ...e.headers || {}
        }
      };
      e.body && !["GET", "HEAD"].includes(e.method) && (r.body = e.body);
      const i = new Request(t, r), d = {};
      i.headers.forEach((n, c) => {
        d[c] = n;
      });
      const y = performance.now(), a = await o.app.fetch(i), u = Math.round((performance.now() - y) * 100) / 100, l = {};
      a.headers.forEach((n, c) => {
        l[c] = n;
      });
      const f = await a.text();
      self.postMessage({
        type: "response",
        id: e.id,
        status: a.status,
        statusText: a.statusText,
        headers: l,
        requestHeaders: d,
        body: f,
        timingMs: u
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
