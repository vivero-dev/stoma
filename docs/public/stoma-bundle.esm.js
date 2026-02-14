var m = class extends Error {
  statusCode;
  code;
  /** Optional headers to include in the error response (e.g. rate-limit headers) */
  headers;
  constructor(e, t, r, s) {
    super(r), this.name = "GatewayError", this.statusCode = e, this.code = t, this.headers = s;
  }
};
function Xe(e, t) {
  const r = {
    error: e.code,
    message: e.message,
    statusCode: e.statusCode,
    ...t ? { requestId: t } : {}
  }, s = {
    "content-type": "application/json",
    ...e.headers
  };
  return new Response(JSON.stringify(r), {
    status: e.statusCode,
    headers: s
  });
}
function Ot(e, t = "An unexpected error occurred") {
  const r = {
    error: "internal_error",
    message: t,
    statusCode: 500,
    ...e ? { requestId: e } : {}
  };
  return new Response(JSON.stringify(r), {
    status: 500,
    headers: { "content-type": "application/json" }
  });
}
var He = (e, t, r) => (s, a) => {
  let n = -1;
  return o(0);
  async function o(i) {
    if (i <= n)
      throw new Error("next() called multiple times");
    n = i;
    let c, l = !1, u;
    if (e[i] ? (u = e[i][0][0], s.req.routeIndex = i) : u = i === e.length && a || void 0, u)
      try {
        c = await u(s, () => o(i + 1));
      } catch (d) {
        if (d instanceof Error && t)
          s.error = d, c = await t(d, s), l = !0;
        else
          throw d;
      }
    else
      s.finalized === !1 && r && (c = await r(s));
    return c && (s.finalized === !1 || l) && (s.res = c), s;
  }
}, kt = /* @__PURE__ */ Symbol(), Ht = async (e, t = /* @__PURE__ */ Object.create(null)) => {
  const { all: r = !1, dot: s = !1 } = t, n = (e instanceof st ? e.raw.headers : e.headers).get("Content-Type");
  return n?.startsWith("multipart/form-data") || n?.startsWith("application/x-www-form-urlencoded") ? It(e, { all: r, dot: s }) : {};
};
async function It(e, t) {
  const r = await e.formData();
  return r ? Mt(r, t) : {};
}
function Mt(e, t) {
  const r = /* @__PURE__ */ Object.create(null);
  return e.forEach((s, a) => {
    t.all || a.endsWith("[]") ? Ct(r, a, s) : r[a] = s;
  }), t.dot && Object.entries(r).forEach(([s, a]) => {
    s.includes(".") && (Pt(r, s, a), delete r[s]);
  }), r;
}
var Ct = (e, t, r) => {
  e[t] !== void 0 ? Array.isArray(e[t]) ? e[t].push(r) : e[t] = [e[t], r] : t.endsWith("[]") ? e[t] = [r] : e[t] = r;
}, Pt = (e, t, r) => {
  let s = e;
  const a = t.split(".");
  a.forEach((n, o) => {
    o === a.length - 1 ? s[n] = r : ((!s[n] || typeof s[n] != "object" || Array.isArray(s[n]) || s[n] instanceof File) && (s[n] = /* @__PURE__ */ Object.create(null)), s = s[n]);
  });
}, Qe = (e) => {
  const t = e.split("/");
  return t[0] === "" && t.shift(), t;
}, Nt = (e) => {
  const { groups: t, path: r } = Dt(e), s = Qe(r);
  return Ut(s, t);
}, Dt = (e) => {
  const t = [];
  return e = e.replace(/\{[^}]+\}/g, (r, s) => {
    const a = `@${s}`;
    return t.push([a, r]), a;
  }), { groups: t, path: e };
}, Ut = (e, t) => {
  for (let r = t.length - 1; r >= 0; r--) {
    const [s] = t[r];
    for (let a = e.length - 1; a >= 0; a--)
      if (e[a].includes(s)) {
        e[a] = e[a].replace(s, t[r][1]);
        break;
      }
  }
  return e;
}, Y = {}, Lt = (e, t) => {
  if (e === "*")
    return "*";
  const r = e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (r) {
    const s = `${e}#${t}`;
    return Y[s] || (r[2] ? Y[s] = t && t[0] !== ":" && t[0] !== "*" ? [s, r[1], new RegExp(`^${r[2]}(?=/${t})`)] : [e, r[1], new RegExp(`^${r[2]}$`)] : Y[s] = [e, r[1], !0]), Y[s];
  }
  return null;
}, qe = (e, t) => {
  try {
    return t(e);
  } catch {
    return e.replace(/(?:%[0-9A-Fa-f]{2})+/g, (r) => {
      try {
        return t(r);
      } catch {
        return r;
      }
    });
  }
}, Bt = (e) => qe(e, decodeURI), Ze = (e) => {
  const t = e.url, r = t.indexOf("/", t.indexOf(":") + 4);
  let s = r;
  for (; s < t.length; s++) {
    const a = t.charCodeAt(s);
    if (a === 37) {
      const n = t.indexOf("?", s), o = t.indexOf("#", s), i = n === -1 ? o === -1 ? void 0 : o : o === -1 ? n : Math.min(n, o), c = t.slice(r, i);
      return Bt(c.includes("%25") ? c.replace(/%25/g, "%2525") : c);
    } else if (a === 63 || a === 35)
      break;
  }
  return t.slice(r, s);
}, Jt = (e) => {
  const t = Ze(e);
  return t.length > 1 && t.at(-1) === "/" ? t.slice(0, -1) : t;
}, N = (e, t, ...r) => (r.length && (t = N(t, ...r)), `${e?.[0] === "/" ? "" : "/"}${e}${t === "/" ? "" : `${e?.at(-1) === "/" ? "" : "/"}${t?.[0] === "/" ? t.slice(1) : t}`}`), et = (e) => {
  if (e.charCodeAt(e.length - 1) !== 63 || !e.includes(":"))
    return null;
  const t = e.split("/"), r = [];
  let s = "";
  return t.forEach((a) => {
    if (a !== "" && !/\:/.test(a))
      s += "/" + a;
    else if (/\:/.test(a))
      if (/\?/.test(a)) {
        r.length === 0 && s === "" ? r.push("/") : r.push(s);
        const n = a.replace("?", "");
        s += "/" + n, r.push(s);
      } else
        s += "/" + a;
  }), r.filter((a, n, o) => o.indexOf(a) === n);
}, ce = (e) => /[%+]/.test(e) ? (e.indexOf("+") !== -1 && (e = e.replace(/\+/g, " ")), e.indexOf("%") !== -1 ? qe(e, rt) : e) : e, tt = (e, t, r) => {
  let s;
  if (!r && t && !/[%+]/.test(t)) {
    let o = e.indexOf("?", 8);
    if (o === -1)
      return;
    for (e.startsWith(t, o + 1) || (o = e.indexOf(`&${t}`, o + 1)); o !== -1; ) {
      const i = e.charCodeAt(o + t.length + 1);
      if (i === 61) {
        const c = o + t.length + 2, l = e.indexOf("&", c);
        return ce(e.slice(c, l === -1 ? void 0 : l));
      } else if (i == 38 || isNaN(i))
        return "";
      o = e.indexOf(`&${t}`, o + 1);
    }
    if (s = /[%+]/.test(e), !s)
      return;
  }
  const a = {};
  s ??= /[%+]/.test(e);
  let n = e.indexOf("?", 8);
  for (; n !== -1; ) {
    const o = e.indexOf("&", n + 1);
    let i = e.indexOf("=", n);
    i > o && o !== -1 && (i = -1);
    let c = e.slice(
      n + 1,
      i === -1 ? o === -1 ? void 0 : o : i
    );
    if (s && (c = ce(c)), n = o, c === "")
      continue;
    let l;
    i === -1 ? l = "" : (l = e.slice(i + 1, o === -1 ? void 0 : o), s && (l = ce(l))), r ? (a[c] && Array.isArray(a[c]) || (a[c] = []), a[c].push(l)) : a[c] ??= l;
  }
  return t ? a[t] : a;
}, Kt = tt, zt = (e, t) => tt(e, t, !0), rt = decodeURIComponent, Ie = (e) => qe(e, rt), st = class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #t;
  // Short name of validatedData
  #e;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(e, t = "/", r = [[]]) {
    this.raw = e, this.path = t, this.#e = r, this.#t = {};
  }
  param(e) {
    return e ? this.#r(e) : this.#n();
  }
  #r(e) {
    const t = this.#e[0][this.routeIndex][1][e], r = this.#a(t);
    return r && /\%/.test(r) ? Ie(r) : r;
  }
  #n() {
    const e = {}, t = Object.keys(this.#e[0][this.routeIndex][1]);
    for (const r of t) {
      const s = this.#a(this.#e[0][this.routeIndex][1][r]);
      s !== void 0 && (e[r] = /\%/.test(s) ? Ie(s) : s);
    }
    return e;
  }
  #a(e) {
    return this.#e[1] ? this.#e[1][e] : e;
  }
  query(e) {
    return Kt(this.url, e);
  }
  queries(e) {
    return zt(this.url, e);
  }
  header(e) {
    if (e)
      return this.raw.headers.get(e) ?? void 0;
    const t = {};
    return this.raw.headers.forEach((r, s) => {
      t[s] = r;
    }), t;
  }
  async parseBody(e) {
    return this.bodyCache.parsedBody ??= await Ht(this, e);
  }
  #s = (e) => {
    const { bodyCache: t, raw: r } = this, s = t[e];
    if (s)
      return s;
    const a = Object.keys(t)[0];
    return a ? t[a].then((n) => (a === "json" && (n = JSON.stringify(n)), new Response(n)[e]())) : t[e] = r[e]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#s("text").then((e) => JSON.parse(e));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#s("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#s("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#s("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#s("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(e, t) {
    this.#t[e] = t;
  }
  valid(e) {
    return this.#t[e];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [kt]() {
    return this.#e;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#e[0].map(([[, e]]) => e);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#e[0].map(([[, e]]) => e)[this.routeIndex].path;
  }
}, Ft = {
  Stringify: 1
}, at = async (e, t, r, s, a) => {
  typeof e == "object" && !(e instanceof String) && (e instanceof Promise || (e = e.toString()), e instanceof Promise && (e = await e));
  const n = e.callbacks;
  return n?.length ? (a ? a[0] += e : a = [e], Promise.all(n.map((i) => i({ phase: t, buffer: a, context: s }))).then(
    (i) => Promise.all(
      i.filter(Boolean).map((c) => at(c, t, !1, s, a))
    ).then(() => a[0])
  )) : Promise.resolve(e);
}, Wt = "text/plain; charset=UTF-8", le = (e, t) => ({
  "Content-Type": e,
  ...t
}), Vt = class {
  #t;
  #e;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #r;
  finalized = !1;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #n;
  #a;
  #s;
  #u;
  #c;
  #l;
  #i;
  #d;
  #h;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(e, t) {
    this.#t = e, t && (this.#a = t.executionCtx, this.env = t.env, this.#l = t.notFoundHandler, this.#h = t.path, this.#d = t.matchResult);
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    return this.#e ??= new st(this.#t, this.#h, this.#d), this.#e;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#a && "respondWith" in this.#a)
      return this.#a;
    throw Error("This context has no FetchEvent");
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#a)
      return this.#a;
    throw Error("This context has no ExecutionContext");
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#s ||= new Response(null, {
      headers: this.#i ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(e) {
    if (this.#s && e) {
      e = new Response(e.body, e);
      for (const [t, r] of this.#s.headers.entries())
        if (t !== "content-type")
          if (t === "set-cookie") {
            const s = this.#s.headers.getSetCookie();
            e.headers.delete("set-cookie");
            for (const a of s)
              e.headers.append("set-cookie", a);
          } else
            e.headers.set(t, r);
    }
    this.#s = e, this.finalized = !0;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...e) => (this.#c ??= (t) => this.html(t), this.#c(...e));
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (e) => this.#u = e;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#u;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (e) => {
    this.#c = e;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (e, t, r) => {
    this.finalized && (this.#s = new Response(this.#s.body, this.#s));
    const s = this.#s ? this.#s.headers : this.#i ??= new Headers();
    t === void 0 ? s.delete(e) : r?.append ? s.append(e, t) : s.set(e, t);
  };
  status = (e) => {
    this.#n = e;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (e, t) => {
    this.#r ??= /* @__PURE__ */ new Map(), this.#r.set(e, t);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (e) => this.#r ? this.#r.get(e) : void 0;
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    return this.#r ? Object.fromEntries(this.#r) : {};
  }
  #o(e, t, r) {
    const s = this.#s ? new Headers(this.#s.headers) : this.#i ?? new Headers();
    if (typeof t == "object" && "headers" in t) {
      const n = t.headers instanceof Headers ? t.headers : new Headers(t.headers);
      for (const [o, i] of n)
        o.toLowerCase() === "set-cookie" ? s.append(o, i) : s.set(o, i);
    }
    if (r)
      for (const [n, o] of Object.entries(r))
        if (typeof o == "string")
          s.set(n, o);
        else {
          s.delete(n);
          for (const i of o)
            s.append(n, i);
        }
    const a = typeof t == "number" ? t : t?.status ?? this.#n;
    return new Response(e, { status: a, headers: s });
  }
  newResponse = (...e) => this.#o(...e);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (e, t, r) => this.#o(e, t, r);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (e, t, r) => !this.#i && !this.#n && !t && !r && !this.finalized ? new Response(e) : this.#o(
    e,
    t,
    le(Wt, r)
  );
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (e, t, r) => this.#o(
    JSON.stringify(e),
    t,
    le("application/json", r)
  );
  html = (e, t, r) => {
    const s = (a) => this.#o(a, t, le("text/html; charset=UTF-8", r));
    return typeof e == "object" ? at(e, Ft.Stringify, !1, {}).then(s) : s(e);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (e, t) => {
    const r = String(e);
    return this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      /[^\x00-\xFF]/.test(r) ? encodeURI(r) : r
    ), this.newResponse(null, t ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => (this.#l ??= () => new Response(), this.#l(this));
}, R = "ALL", Yt = "all", Gt = ["get", "post", "put", "delete", "options", "patch"], nt = "Can not add a route since the matcher is already built.", ot = class extends Error {
}, Xt = "__COMPOSED_HANDLER", Qt = (e) => e.text("404 Not Found", 404), Me = (e, t) => {
  if ("getResponse" in e) {
    const r = e.getResponse();
    return t.newResponse(r.body, r);
  }
  return console.error(e), t.text("Internal Server Error", 500);
}, Zt = class it {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #t = "/";
  routes = [];
  constructor(t = {}) {
    [...Gt, Yt].forEach((n) => {
      this[n] = (o, ...i) => (typeof o == "string" ? this.#t = o : this.#n(n, this.#t, o), i.forEach((c) => {
        this.#n(n, this.#t, c);
      }), this);
    }), this.on = (n, o, ...i) => {
      for (const c of [o].flat()) {
        this.#t = c;
        for (const l of [n].flat())
          i.map((u) => {
            this.#n(l.toUpperCase(), this.#t, u);
          });
      }
      return this;
    }, this.use = (n, ...o) => (typeof n == "string" ? this.#t = n : (this.#t = "*", o.unshift(n)), o.forEach((i) => {
      this.#n(R, this.#t, i);
    }), this);
    const { strict: s, ...a } = t;
    Object.assign(this, a), this.getPath = s ?? !0 ? t.getPath ?? Ze : Jt;
  }
  #e() {
    const t = new it({
      router: this.router,
      getPath: this.getPath
    });
    return t.errorHandler = this.errorHandler, t.#r = this.#r, t.routes = this.routes, t;
  }
  #r = Qt;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = Me;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(t, r) {
    const s = this.basePath(t);
    return r.routes.map((a) => {
      let n;
      r.errorHandler === Me ? n = a.handler : (n = async (o, i) => (await He([], r.errorHandler)(o, () => a.handler(o, i))).res, n[Xt] = a.handler), s.#n(a.method, a.path, n);
    }), this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(t) {
    const r = this.#e();
    return r._basePath = N(this._basePath, t), r;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (t) => (this.errorHandler = t, this);
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (t) => (this.#r = t, this);
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(t, r, s) {
    let a, n;
    s && (typeof s == "function" ? n = s : (n = s.optionHandler, s.replaceRequest === !1 ? a = (c) => c : a = s.replaceRequest));
    const o = n ? (c) => {
      const l = n(c);
      return Array.isArray(l) ? l : [l];
    } : (c) => {
      let l;
      try {
        l = c.executionCtx;
      } catch {
      }
      return [c.env, l];
    };
    a ||= (() => {
      const c = N(this._basePath, t), l = c === "/" ? 0 : c.length;
      return (u) => {
        const d = new URL(u.url);
        return d.pathname = d.pathname.slice(l) || "/", new Request(d, u);
      };
    })();
    const i = async (c, l) => {
      const u = await r(a(c.req.raw), ...o(c));
      if (u)
        return u;
      await l();
    };
    return this.#n(R, N(t, "*"), i), this;
  }
  #n(t, r, s) {
    t = t.toUpperCase(), r = N(this._basePath, r);
    const a = { basePath: this._basePath, path: r, method: t, handler: s };
    this.router.add(t, r, [s, a]), this.routes.push(a);
  }
  #a(t, r) {
    if (t instanceof Error)
      return this.errorHandler(t, r);
    throw t;
  }
  #s(t, r, s, a) {
    if (a === "HEAD")
      return (async () => new Response(null, await this.#s(t, r, s, "GET")))();
    const n = this.getPath(t, { env: s }), o = this.router.match(a, n), i = new Vt(t, {
      path: n,
      matchResult: o,
      env: s,
      executionCtx: r,
      notFoundHandler: this.#r
    });
    if (o[0].length === 1) {
      let l;
      try {
        l = o[0][0][0][0](i, async () => {
          i.res = await this.#r(i);
        });
      } catch (u) {
        return this.#a(u, i);
      }
      return l instanceof Promise ? l.then(
        (u) => u || (i.finalized ? i.res : this.#r(i))
      ).catch((u) => this.#a(u, i)) : l ?? this.#r(i);
    }
    const c = He(o[0], this.errorHandler, this.#r);
    return (async () => {
      try {
        const l = await c(i);
        if (!l.finalized)
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        return l.res;
      } catch (l) {
        return this.#a(l, i);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (t, ...r) => this.#s(t, r[1], r[0], t.method);
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (t, r, s, a) => t instanceof Request ? this.fetch(r ? new Request(t, r) : t, s, a) : (t = t.toString(), this.fetch(
    new Request(
      /^https?:\/\//.test(t) ? t : `http://localhost${N("/", t)}`,
      r
    ),
    s,
    a
  ));
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (t) => {
      t.respondWith(this.#s(t.request, t, void 0, t.request.method));
    });
  };
}, ct = [];
function er(e, t) {
  const r = this.buildAllMatchers(), s = ((a, n) => {
    const o = r[a] || r[R], i = o[2][n];
    if (i)
      return i;
    const c = n.match(o[0]);
    if (!c)
      return [[], ct];
    const l = c.indexOf("", 1);
    return [o[1][l], c];
  });
  return this.match = s, s(e, t);
}
var Z = "[^/]+", W = ".*", V = "(?:|/.*)", D = /* @__PURE__ */ Symbol(), tr = new Set(".\\+*[^]$()");
function rr(e, t) {
  return e.length === 1 ? t.length === 1 ? e < t ? -1 : 1 : -1 : t.length === 1 || e === W || e === V ? 1 : t === W || t === V ? -1 : e === Z ? 1 : t === Z ? -1 : e.length === t.length ? e < t ? -1 : 1 : t.length - e.length;
}
var sr = class fe {
  #t;
  #e;
  #r = /* @__PURE__ */ Object.create(null);
  insert(t, r, s, a, n) {
    if (t.length === 0) {
      if (this.#t !== void 0)
        throw D;
      if (n)
        return;
      this.#t = r;
      return;
    }
    const [o, ...i] = t, c = o === "*" ? i.length === 0 ? ["", "", W] : ["", "", Z] : o === "/*" ? ["", "", V] : o.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let l;
    if (c) {
      const u = c[1];
      let d = c[2] || Z;
      if (u && c[2] && (d === ".*" || (d = d.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:"), /\((?!\?:)/.test(d))))
        throw D;
      if (l = this.#r[d], !l) {
        if (Object.keys(this.#r).some(
          (h) => h !== W && h !== V
        ))
          throw D;
        if (n)
          return;
        l = this.#r[d] = new fe(), u !== "" && (l.#e = a.varIndex++);
      }
      !n && u !== "" && s.push([u, l.#e]);
    } else if (l = this.#r[o], !l) {
      if (Object.keys(this.#r).some(
        (u) => u.length > 1 && u !== W && u !== V
      ))
        throw D;
      if (n)
        return;
      l = this.#r[o] = new fe();
    }
    l.insert(i, r, s, a, n);
  }
  buildRegExpStr() {
    const r = Object.keys(this.#r).sort(rr).map((s) => {
      const a = this.#r[s];
      return (typeof a.#e == "number" ? `(${s})@${a.#e}` : tr.has(s) ? `\\${s}` : s) + a.buildRegExpStr();
    });
    return typeof this.#t == "number" && r.unshift(`#${this.#t}`), r.length === 0 ? "" : r.length === 1 ? r[0] : "(?:" + r.join("|") + ")";
  }
}, ar = class {
  #t = { varIndex: 0 };
  #e = new sr();
  insert(e, t, r) {
    const s = [], a = [];
    for (let o = 0; ; ) {
      let i = !1;
      if (e = e.replace(/\{[^}]+\}/g, (c) => {
        const l = `@\\${o}`;
        return a[o] = [l, c], o++, i = !0, l;
      }), !i)
        break;
    }
    const n = e.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let o = a.length - 1; o >= 0; o--) {
      const [i] = a[o];
      for (let c = n.length - 1; c >= 0; c--)
        if (n[c].indexOf(i) !== -1) {
          n[c] = n[c].replace(i, a[o][1]);
          break;
        }
    }
    return this.#e.insert(n, t, s, this.#t, r), s;
  }
  buildRegExp() {
    let e = this.#e.buildRegExpStr();
    if (e === "")
      return [/^$/, [], []];
    let t = 0;
    const r = [], s = [];
    return e = e.replace(/#(\d+)|@(\d+)|\.\*\$/g, (a, n, o) => n !== void 0 ? (r[++t] = Number(n), "$()") : (o !== void 0 && (s[Number(o)] = ++t), "")), [new RegExp(`^${e}`), r, s];
  }
}, nr = [/^$/, [], /* @__PURE__ */ Object.create(null)], lt = /* @__PURE__ */ Object.create(null);
function ut(e) {
  return lt[e] ??= new RegExp(
    e === "*" ? "" : `^${e.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (t, r) => r ? `\\${r}` : "(?:|/.*)"
    )}$`
  );
}
function or() {
  lt = /* @__PURE__ */ Object.create(null);
}
function ir(e) {
  const t = new ar(), r = [];
  if (e.length === 0)
    return nr;
  const s = e.map(
    (l) => [!/\*|\/:/.test(l[0]), ...l]
  ).sort(
    ([l, u], [d, h]) => l ? 1 : d ? -1 : u.length - h.length
  ), a = /* @__PURE__ */ Object.create(null);
  for (let l = 0, u = -1, d = s.length; l < d; l++) {
    const [h, p, y] = s[l];
    h ? a[p] = [y.map(([w]) => [w, /* @__PURE__ */ Object.create(null)]), ct] : u++;
    let f;
    try {
      f = t.insert(p, u, h);
    } catch (w) {
      throw w === D ? new ot(p) : w;
    }
    h || (r[u] = y.map(([w, g]) => {
      const T = /* @__PURE__ */ Object.create(null);
      for (g -= 1; g >= 0; g--) {
        const [b, x] = f[g];
        T[b] = x;
      }
      return [w, T];
    }));
  }
  const [n, o, i] = t.buildRegExp();
  for (let l = 0, u = r.length; l < u; l++)
    for (let d = 0, h = r[l].length; d < h; d++) {
      const p = r[l][d]?.[1];
      if (!p)
        continue;
      const y = Object.keys(p);
      for (let f = 0, w = y.length; f < w; f++)
        p[y[f]] = i[p[y[f]]];
    }
  const c = [];
  for (const l in o)
    c[l] = r[o[l]];
  return [n, c, a];
}
function C(e, t) {
  if (e) {
    for (const r of Object.keys(e).sort((s, a) => a.length - s.length))
      if (ut(r).test(t))
        return [...e[r]];
  }
}
var cr = class {
  name = "RegExpRouter";
  #t;
  #e;
  constructor() {
    this.#t = { [R]: /* @__PURE__ */ Object.create(null) }, this.#e = { [R]: /* @__PURE__ */ Object.create(null) };
  }
  add(e, t, r) {
    const s = this.#t, a = this.#e;
    if (!s || !a)
      throw new Error(nt);
    s[e] || [s, a].forEach((i) => {
      i[e] = /* @__PURE__ */ Object.create(null), Object.keys(i[R]).forEach((c) => {
        i[e][c] = [...i[R][c]];
      });
    }), t === "/*" && (t = "*");
    const n = (t.match(/\/:/g) || []).length;
    if (/\*$/.test(t)) {
      const i = ut(t);
      e === R ? Object.keys(s).forEach((c) => {
        s[c][t] ||= C(s[c], t) || C(s[R], t) || [];
      }) : s[e][t] ||= C(s[e], t) || C(s[R], t) || [], Object.keys(s).forEach((c) => {
        (e === R || e === c) && Object.keys(s[c]).forEach((l) => {
          i.test(l) && s[c][l].push([r, n]);
        });
      }), Object.keys(a).forEach((c) => {
        (e === R || e === c) && Object.keys(a[c]).forEach(
          (l) => i.test(l) && a[c][l].push([r, n])
        );
      });
      return;
    }
    const o = et(t) || [t];
    for (let i = 0, c = o.length; i < c; i++) {
      const l = o[i];
      Object.keys(a).forEach((u) => {
        (e === R || e === u) && (a[u][l] ||= [
          ...C(s[u], l) || C(s[R], l) || []
        ], a[u][l].push([r, n - c + i + 1]));
      });
    }
  }
  match = er;
  buildAllMatchers() {
    const e = /* @__PURE__ */ Object.create(null);
    return Object.keys(this.#e).concat(Object.keys(this.#t)).forEach((t) => {
      e[t] ||= this.#r(t);
    }), this.#t = this.#e = void 0, or(), e;
  }
  #r(e) {
    const t = [];
    let r = e === R;
    return [this.#t, this.#e].forEach((s) => {
      const a = s[e] ? Object.keys(s[e]).map((n) => [n, s[e][n]]) : [];
      a.length !== 0 ? (r ||= !0, t.push(...a)) : e !== R && t.push(
        ...Object.keys(s[R]).map((n) => [n, s[R][n]])
      );
    }), r ? ir(t) : null;
  }
}, lr = class {
  name = "SmartRouter";
  #t = [];
  #e = [];
  constructor(e) {
    this.#t = e.routers;
  }
  add(e, t, r) {
    if (!this.#e)
      throw new Error(nt);
    this.#e.push([e, t, r]);
  }
  match(e, t) {
    if (!this.#e)
      throw new Error("Fatal error");
    const r = this.#t, s = this.#e, a = r.length;
    let n = 0, o;
    for (; n < a; n++) {
      const i = r[n];
      try {
        for (let c = 0, l = s.length; c < l; c++)
          i.add(...s[c]);
        o = i.match(e, t);
      } catch (c) {
        if (c instanceof ot)
          continue;
        throw c;
      }
      this.match = i.match.bind(i), this.#t = [i], this.#e = void 0;
      break;
    }
    if (n === a)
      throw new Error("Fatal error");
    return this.name = `SmartRouter + ${this.activeRouter.name}`, o;
  }
  get activeRouter() {
    if (this.#e || this.#t.length !== 1)
      throw new Error("No active router has been determined yet.");
    return this.#t[0];
  }
}, F = /* @__PURE__ */ Object.create(null), ur = class dt {
  #t;
  #e;
  #r;
  #n = 0;
  #a = F;
  constructor(t, r, s) {
    if (this.#e = s || /* @__PURE__ */ Object.create(null), this.#t = [], t && r) {
      const a = /* @__PURE__ */ Object.create(null);
      a[t] = { handler: r, possibleKeys: [], score: 0 }, this.#t = [a];
    }
    this.#r = [];
  }
  insert(t, r, s) {
    this.#n = ++this.#n;
    let a = this;
    const n = Nt(r), o = [];
    for (let i = 0, c = n.length; i < c; i++) {
      const l = n[i], u = n[i + 1], d = Lt(l, u), h = Array.isArray(d) ? d[0] : l;
      if (h in a.#e) {
        a = a.#e[h], d && o.push(d[1]);
        continue;
      }
      a.#e[h] = new dt(), d && (a.#r.push(d), o.push(d[1])), a = a.#e[h];
    }
    return a.#t.push({
      [t]: {
        handler: s,
        possibleKeys: o.filter((i, c, l) => l.indexOf(i) === c),
        score: this.#n
      }
    }), a;
  }
  #s(t, r, s, a) {
    const n = [];
    for (let o = 0, i = t.#t.length; o < i; o++) {
      const c = t.#t[o], l = c[r] || c[R], u = {};
      if (l !== void 0 && (l.params = /* @__PURE__ */ Object.create(null), n.push(l), s !== F || a && a !== F))
        for (let d = 0, h = l.possibleKeys.length; d < h; d++) {
          const p = l.possibleKeys[d], y = u[l.score];
          l.params[p] = a?.[p] && !y ? a[p] : s[p] ?? a?.[p], u[l.score] = !0;
        }
    }
    return n;
  }
  search(t, r) {
    const s = [];
    this.#a = F;
    let n = [this];
    const o = Qe(r), i = [];
    for (let c = 0, l = o.length; c < l; c++) {
      const u = o[c], d = c === l - 1, h = [];
      for (let p = 0, y = n.length; p < y; p++) {
        const f = n[p], w = f.#e[u];
        w && (w.#a = f.#a, d ? (w.#e["*"] && s.push(
          ...this.#s(w.#e["*"], t, f.#a)
        ), s.push(...this.#s(w, t, f.#a))) : h.push(w));
        for (let g = 0, T = f.#r.length; g < T; g++) {
          const b = f.#r[g], x = f.#a === F ? {} : { ...f.#a };
          if (b === "*") {
            const H = f.#e["*"];
            H && (s.push(...this.#s(H, t, f.#a)), H.#a = x, h.push(H));
            continue;
          }
          const [A, z, _] = b;
          if (!u && !(_ instanceof RegExp))
            continue;
          const $ = f.#e[A], $t = o.slice(c).join("/");
          if (_ instanceof RegExp) {
            const H = _.exec($t);
            if (H) {
              if (x[z] = H[0], s.push(...this.#s($, t, f.#a, x)), Object.keys($.#e).length) {
                $.#a = x;
                const jt = H[0].match(/\//)?.length ?? 0;
                (i[jt] ||= []).push($);
              }
              continue;
            }
          }
          (_ === !0 || _.test(u)) && (x[z] = u, d ? (s.push(...this.#s($, t, x, f.#a)), $.#e["*"] && s.push(
            ...this.#s($.#e["*"], t, x, f.#a)
          )) : ($.#a = x, h.push($)));
        }
      }
      n = h.concat(i.shift() ?? []);
    }
    return s.length > 1 && s.sort((c, l) => c.score - l.score), [s.map(({ handler: c, params: l }) => [c, l])];
  }
}, dr = class {
  name = "TrieRouter";
  #t;
  constructor() {
    this.#t = new ur();
  }
  add(e, t, r) {
    const s = et(t);
    if (s) {
      for (let a = 0, n = s.length; a < n; a++)
        this.#t.insert(e, s[a], r);
      return;
    }
    this.#t.insert(e, t, r);
  }
  match(e, t) {
    return this.#t.search(e, t);
  }
}, ht = class extends Zt {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(e = {}) {
    super(e), this.router = e.router ?? new lr({
      routers: [new cr(), new dr()]
    });
  }
}, v = {
  /** Observability policies (e.g. requestLog) — wraps everything */
  OBSERVABILITY: 0,
  /** IP filtering — runs before all other logic */
  IP_FILTER: 1,
  /** Metrics collection — just after observability */
  METRICS: 1,
  /** Early pipeline (e.g. cors) — before auth */
  EARLY: 5,
  /** Authentication (e.g. jwtAuth, apiKeyAuth, basicAuth) */
  AUTH: 10,
  /** Rate limiting — after auth */
  RATE_LIMIT: 20,
  /** Circuit breaker — protects upstream */
  CIRCUIT_BREAKER: 30,
  /** Caching — before upstream */
  CACHE: 40,
  /** Request header transforms — mid-pipeline */
  REQUEST_TRANSFORM: 50,
  /** Timeout — wraps upstream call */
  TIMEOUT: 85,
  /** Retry — wraps upstream fetch */
  RETRY: 90,
  /** Response header transforms — after upstream */
  RESPONSE_TRANSFORM: 92,
  /** Proxy header manipulation — just before upstream */
  PROXY: 95,
  /** Default priority for unspecified policies */
  DEFAULT: 100,
  /** Mock — terminal, replaces upstream */
  MOCK: 999
}, j = {
  HTTP_METHOD: "http.request.method",
  HTTP_ROUTE: "http.route",
  HTTP_STATUS_CODE: "http.response.status_code",
  URL_PATH: "url.path",
  SERVER_ADDRESS: "server.address"
}, ae = class {
  constructor(e, t, r, s, a, n = Date.now()) {
    this.name = e, this.kind = t, this.traceId = r, this.spanId = s, this.parentSpanId = a, this.startTimeMs = n;
  }
  _attributes = {};
  _events = [];
  _status = {
    code: "UNSET"
  };
  _endTimeMs;
  /** Set a single attribute. Chainable. */
  setAttribute(e, t) {
    return this._attributes[e] = t, this;
  }
  /** Record a timestamped event with optional attributes. Chainable. */
  addEvent(e, t) {
    return this._events.push({ name: e, timeMs: Date.now(), attributes: t }), this;
  }
  /** Set the span status. Chainable. */
  setStatus(e, t) {
    return this._status = { code: e, message: t }, this;
  }
  /**
   * Finalize the span and return an immutable {@link ReadableSpan}.
   *
   * Sets `endTimeMs` on first call; subsequent calls return the same
   * snapshot with defensive copies of mutable fields.
   */
  end() {
    return this._endTimeMs = this._endTimeMs ?? Date.now(), {
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      name: this.name,
      kind: this.kind,
      startTimeMs: this.startTimeMs,
      endTimeMs: this._endTimeMs,
      attributes: { ...this._attributes },
      status: { ...this._status },
      events: [...this._events]
    };
  }
}, hr = {
  INTERNAL: 1,
  // SPAN_KIND_INTERNAL
  SERVER: 2,
  // SPAN_KIND_SERVER
  CLIENT: 3
  // SPAN_KIND_CLIENT
}, pr = {
  UNSET: 0,
  // STATUS_CODE_UNSET
  OK: 1,
  // STATUS_CODE_OK
  ERROR: 2
  // STATUS_CODE_ERROR
};
function mr(e) {
  return typeof e == "string" ? { stringValue: e } : typeof e == "boolean" ? { boolValue: e } : Number.isInteger(e) ? { intValue: e } : { doubleValue: e };
}
function Ce(e) {
  return Object.entries(e).map(([t, r]) => ({
    key: t,
    value: mr(r)
  }));
}
function ue(e) {
  return String(e * 1e6);
}
function fr(e, t, r) {
  const s = [{ key: "service.name", value: { stringValue: t } }];
  r && s.push({
    key: "service.version",
    value: { stringValue: r }
  });
  const a = e.map((n) => {
    const o = {
      traceId: n.traceId,
      spanId: n.spanId,
      name: n.name,
      kind: hr[n.kind],
      startTimeUnixNano: ue(n.startTimeMs),
      endTimeUnixNano: ue(n.endTimeMs),
      attributes: Ce(n.attributes),
      status: {
        code: pr[n.status.code],
        ...n.status.message ? { message: n.status.message } : {}
      },
      events: n.events.map((i) => ({
        name: i.name,
        timeUnixNano: ue(i.timeMs),
        ...i.attributes ? { attributes: Ce(i.attributes) } : {}
      }))
    };
    return n.parentSpanId && (o.parentSpanId = n.parentSpanId), o;
  });
  return {
    resourceSpans: [
      {
        resource: { attributes: s },
        scopeSpans: [
          {
            scope: { name: "stoma-gateway" },
            spans: a
          }
        ]
      }
    ]
  };
}
var Es = class {
  endpoint;
  headers;
  timeoutMs;
  serviceName;
  serviceVersion;
  constructor(e) {
    this.endpoint = e.endpoint, this.headers = e.headers ?? {}, this.timeoutMs = e.timeoutMs ?? 1e4, this.serviceName = e.serviceName ?? "stoma-gateway", this.serviceVersion = e.serviceVersion;
  }
  async export(e) {
    if (e.length === 0) return;
    const t = fr(e, this.serviceName, this.serviceVersion);
    await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...this.headers
      },
      body: JSON.stringify(t),
      signal: AbortSignal.timeout(this.timeoutMs)
    });
  }
}, _s = class {
  async export(e) {
    for (const t of e)
      console.debug(
        `[trace] ${t.name} ${t.kind} ${t.endTimeMs - t.startTimeMs}ms trace=${t.traceId} span=${t.spanId}` + (t.parentSpanId ? ` parent=${t.parentSpanId}` : "") + ` status=${t.status.code}`
      );
  }
};
function yr(e) {
  return e >= 1 ? !0 : e <= 0 ? !1 : Math.random() < e;
}
function ne() {
  const e = new Uint8Array(8);
  return crypto.getRandomValues(e), Array.from(e, (t) => t.toString(16).padStart(2, "0")).join("");
}
var U = "_stomaTraceRequested", ye = "_stomaTraceEntries", we = "_stomaTraceDetails", pt = () => {
};
function $e(e, t) {
  return e.get(U) ? (r, s) => {
    const a = e.get(we) ?? /* @__PURE__ */ new Map();
    a.set(t, { action: r, data: s }), e.set(we, a);
  } : pt;
}
function wr(e) {
  return e.get(U) === !0;
}
var I = () => {
};
function gr(e, t) {
  return !t || typeof t == "string" && !vr(e, t) ? I : (r, ...s) => {
    const a = [`[${e}]`, r];
    for (const n of s)
      a.push(
        typeof n == "object" && n !== null ? JSON.stringify(n) : String(n)
      );
    console.debug(a.join(" "));
  };
}
function vr(e, t) {
  return t.split(",").map((s) => s.trim()).some((s) => {
    if (s === "*") return !0;
    const a = s.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${a}$`).test(e);
  });
}
function Sr(e) {
  if (!e) return () => I;
  const t = /* @__PURE__ */ new Map();
  return (r) => {
    const s = t.get(r);
    if (s) return s;
    const a = gr(r, e);
    return t.set(r, a), a;
  };
}
function mt(e) {
  const t = e.map((r, s) => ({
    ...r,
    durationMs: s === 0 ? r.durationMs : Math.max(0, r.durationMs - e[s - 1].durationMs)
  }));
  return t.reverse(), t;
}
var Tr = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;
function br(e) {
  if (!e) return null;
  const t = e.trim().match(Tr);
  if (!t) return null;
  const [, r, s, a, n] = t;
  return r === "ff" || s === "00000000000000000000000000000000" || a === "0000000000000000" ? null : { version: r, traceId: s, parentId: a, flags: n };
}
function xr() {
  return {
    version: "00",
    traceId: ft(16),
    parentId: oe(),
    flags: "01"
  };
}
function je(e) {
  return `${e.version}-${e.traceId}-${e.parentId}-${e.flags}`;
}
function oe() {
  return ft(8);
}
function ft(e) {
  const t = new Uint8Array(e);
  return crypto.getRandomValues(t), Array.from(t, (r) => r.toString(16).padStart(2, "0")).join("");
}
var Rr = () => I, yt = "gateway";
function Ar(e, t, r, s = 100) {
  const a = /* @__PURE__ */ new Map();
  for (const o of e)
    a.set(o.name, o);
  for (const o of t)
    a.has(o.name) && r?.(`policy "${o.name}" overridden by route-level policy`), a.set(o.name, o);
  const n = Array.from(a.values()).sort(
    (o, i) => (o.priority ?? s) - (i.priority ?? s)
  );
  return n.length > 0 && r?.(
    `chain: ${n.map((o) => `${o.name}:${o.priority ?? s}`).join(" -> ")}`
  ), n;
}
function Er(e) {
  return e.map((t) => {
    const r = t.handler, s = t.priority ?? 100;
    return async (n, o) => {
      const i = Date.now();
      if (n.get(U) !== !0 && n.get("_otelSpans") === void 0) {
        try {
          await r(n, o);
        } finally {
          const u = Date.now() - i, d = n.get("_policyTimings") ?? [];
          d.push({ name: t.name, durationMs: u }), n.set("_policyTimings", d);
        }
        return;
      }
      let c = !1, l = null;
      try {
        await r(n, async () => {
          c = !0, await o();
        });
      } catch (u) {
        throw l = u instanceof Error ? u.message : String(u), u;
      } finally {
        const u = Date.now() - i, d = n.get("_policyTimings") ?? [];
        if (d.push({ name: t.name, durationMs: u }), n.set("_policyTimings", d), n.get(U) === !0) {
          const p = n.get(ye) ?? [];
          p.push({
            name: t.name,
            priority: s,
            durationMs: u,
            calledNext: c,
            error: l
          }), n.set(ye, p);
        }
        const h = n.get("_otelSpans");
        if (h !== void 0) {
          const p = n.get("_otelRootSpan"), y = new ae(
            `policy:${t.name}`,
            "INTERNAL",
            p.traceId,
            ne(),
            p.spanId,
            i
          );
          y.setAttribute("policy.name", t.name).setAttribute("policy.priority", s), l && y.setStatus("ERROR", l), h.push(y.end());
        }
      }
    };
  });
}
function wt(e, t, r = Rr, s = "x-request-id", a, n, o) {
  const i = n === !0 ? {} : n || void 0, c = i?.requestHeader ?? "x-stoma-debug", l = i?.allow;
  return async (u, d) => {
    const h = u.req.header("traceparent") ?? null, p = br(h), y = p?.traceId ?? xr().traceId, f = oe(), w = {
      requestId: crypto.randomUUID(),
      startTime: Date.now(),
      gatewayName: e,
      routePath: t,
      traceId: y,
      spanId: f,
      debug: r,
      adapter: a
    };
    u.set(yt, w);
    let g;
    if (o && yr(o.sampleRate ?? 1)) {
      const T = ne();
      g = new ae(
        `${u.req.method} ${t}`,
        "SERVER",
        y,
        T,
        p?.parentId,
        w.startTime
      ), g.setAttribute(j.HTTP_METHOD, u.req.method).setAttribute(j.HTTP_ROUTE, t).setAttribute(j.URL_PATH, new URL(u.req.url).pathname).setAttribute("gateway.name", e), u.set("_otelRootSpan", g), u.set("_otelSpans", []);
    }
    if (i && gt(u, c, l), await d(), u.res.headers.set(s, w.requestId), u.res.headers.set(
      "traceparent",
      je({
        version: "00",
        traceId: w.traceId,
        parentId: w.spanId,
        flags: p?.flags ?? "01"
      })
    ), i) {
      const T = vt(u);
      if (T)
        for (const [b, x] of T)
          u.res.headers.set(b, x);
    }
    if (u.get(U) === !0) {
      const T = u.get(ye);
      if (T && T.length > 0) {
        const b = u.get(we), A = mt(T).map((_) => {
          const $ = b?.get(_.name);
          return $ ? { ..._, detail: $ } : _;
        }), z = {
          requestId: w.requestId,
          traceId: w.traceId,
          route: t,
          totalMs: Date.now() - w.startTime,
          entries: A
        };
        u.res.headers.set("x-stoma-trace", JSON.stringify(z));
      }
    }
    if (g) {
      g.setAttribute(j.HTTP_STATUS_CODE, u.res.status).setStatus(
        u.res.status >= 500 ? "ERROR" : u.res.status >= 400 ? "UNSET" : "OK"
      );
      const T = g.end(), b = u.get("_otelSpans") ?? [], x = [T, ...b], A = o.exporter.export(x).catch(() => {
      });
      a?.waitUntil && a.waitUntil(A);
    }
  };
}
function B(e) {
  return e.get(yt);
}
function J(e, t) {
  return t ? { ...e, ...t } : { ...e };
}
function K(e, t) {
  return B(e)?.debug(`stoma:policy:${t}`) ?? I;
}
function k(e, t) {
  return e ? async (r, s) => {
    if (await e(r)) {
      await s();
      return;
    }
    await t(r, s);
  } : t;
}
async function E(e, t, r, s) {
  try {
    return await e();
  } catch (a) {
    return r && s && r(
      `${s} failed: ${a instanceof Error ? a.message : String(a)}`
    ), t;
  }
}
var ge = "_stomaDebugHeaders", Oe = "_stomaDebugRequested";
function q(e, t, r) {
  const s = e.get(Oe);
  if (!s || !(s.has(t) || s.has("*"))) return;
  const a = e.get(ge) ?? /* @__PURE__ */ new Map();
  a.set(t, String(r)), e.set(ge, a);
}
function gt(e, t, r) {
  const s = e.req.header(t);
  if (!s) return;
  const a = s.split(",").map((i) => i.trim().toLowerCase()).filter(Boolean);
  if (a.length === 0) return;
  const n = r ? new Set(r.map((i) => i.toLowerCase())) : null, o = /* @__PURE__ */ new Set();
  if (a.includes("*"))
    if (n)
      for (const i of n) o.add(i);
    else
      o.add("*");
  for (const i of a)
    i !== "*" && (!n || n.has(i)) && o.add(i);
  o.size > 0 && e.set(Oe, o), (o.has("trace") || o.has("*")) && e.set(U, !0);
}
function vt(e) {
  return e.get(ge);
}
function St(e) {
  const t = e.get(Oe);
  return t !== void 0 && t.size > 0;
}
function S(e) {
  return (t) => {
    const r = J(
      e.defaults ?? {},
      t
    );
    e.validate && e.validate(r);
    const s = async (o, i) => {
      const c = K(o, e.name), l = $e(o, e.name), u = B(o);
      await e.handler(o, i, { config: r, debug: c, trace: l, gateway: u });
    }, a = k(r.skip, s);
    let n;
    if (e.evaluate) {
      const o = e.evaluate;
      n = {
        onRequest: o.onRequest ? (i, c) => o.onRequest(i, { ...c, config: r }) : void 0,
        onResponse: o.onResponse ? (i, c) => o.onResponse(i, { ...c, config: r }) : void 0
      };
    }
    return {
      name: e.name,
      priority: e.priority ?? v.DEFAULT,
      handler: a,
      evaluate: n,
      phases: e.phases,
      httpOnly: e.httpOnly
    };
  };
}
var _r = class {
  promises = [];
  /**
   * Add a promise to the background work queue.
   */
  waitUntil = (e) => {
    this.promises.push(e);
  };
  /**
   * Await all pending background work collected via `waitUntil`.
   */
  async waitAll() {
    for (; this.promises.length > 0; ) {
      const e = [...this.promises];
      this.promises = [], await Promise.all(e);
    }
  }
  /**
   * Reset the collected promises.
   */
  reset() {
    this.promises = [];
  }
};
function qr(e, t) {
  const r = t?.path ?? "/*", s = t?.gatewayName ?? "test-gateway", a = t?.adapter ?? new _r(), n = new ht();
  return n.use(
    r,
    wt(s, r, void 0, void 0, a)
  ), n.use(r, async (o, i) => {
    try {
      await e.handler(o, i);
    } catch (c) {
      if (c instanceof m)
        return Xe(c);
      throw c;
    }
  }), t?.upstream ? n.all(r, t.upstream) : n.all(r, (o) => o.json({ ok: !0 })), {
    /** The underlying Hono app for advanced test scenarios. */
    app: n,
    /** The adapter used by the harness. Call `adapter.waitAll()` to await background tasks. */
    adapter: a,
    /** Make a test request through the policy pipeline. */
    request: (o, i) => n.request(o, i)
  };
}
var $r = /* @__PURE__ */ new Set([204, 304]);
function ve(e, t) {
  return $r.has(t) ? null : e ?? null;
}
var Tt = class {
  entries = /* @__PURE__ */ new Map();
  maxEntries;
  constructor(e) {
    this.maxEntries = e?.maxEntries;
  }
  async get(e) {
    const t = this.entries.get(e);
    return t ? Date.now() > t.expiresAt ? (this.entries.delete(e), null) : (this.entries.delete(e), this.entries.set(e, t), new Response(ve(t.body, t.status), {
      status: t.status,
      headers: t.headers
    })) : null;
  }
  async put(e, t, r) {
    const s = await t.arrayBuffer(), a = [];
    if (t.headers.forEach((n, o) => {
      a.push([o, n]);
    }), this.maxEntries && !this.entries.has(e) && this.entries.size >= this.maxEntries) {
      const n = this.entries.keys().next().value;
      n !== void 0 && this.entries.delete(n);
    }
    this.entries.set(e, {
      body: s,
      status: t.status,
      headers: a,
      expiresAt: Date.now() + r * 1e3
    });
  }
  async delete(e) {
    return this.entries.delete(e);
  }
  /** Remove all entries (for testing) */
  clear() {
    this.entries.clear();
  }
  /** Current number of entries (for testing/inspection) */
  get size() {
    return this.entries.size;
  }
  /** Release all cached entries. */
  destroy() {
    this.entries.clear();
  }
}, de = "x-stoma-internal-expires-at", jr = /* @__PURE__ */ new Set(["POST", "PUT", "PATCH"]);
function Or(e) {
  return e ? e.split(",").map((t) => t.trim().split("=")[0].trim().toLowerCase()) : [];
}
function qs(e) {
  const t = J(
    {
      ttlSeconds: 300,
      methods: ["GET"],
      respectCacheControl: !0,
      cacheStatusHeader: "x-cache",
      bypassDirectives: ["no-store", "no-cache"]
    },
    e
  ), r = t.methods.map((c) => c.toUpperCase());
  let s = e?.store;
  s || (s = new Tt());
  const a = s, n = t.cacheStatusHeader;
  async function o(c) {
    if (e?.cacheKeyFn) return await e.cacheKeyFn(c);
    let l = `${c.req.method}:${c.req.url}`;
    if (jr.has(c.req.method.toUpperCase()))
      try {
        const u = await c.req.raw.clone().text();
        if (u) {
          const d = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(u)
          ), h = new Uint8Array(d);
          let p = "";
          for (const y of h)
            p += y.toString(16).padStart(2, "0");
          l += `|body:${p}`;
        }
      } catch {
      }
    if (e?.varyHeaders) {
      const u = e.varyHeaders.map((d) => c.req.header(d) ?? "").join("|");
      l += `|vary:${u}`;
    }
    return l;
  }
  const i = async (c, l) => {
    const u = K(c, "cache"), d = $e(c, "cache");
    if (!r.includes(c.req.method.toUpperCase())) {
      d("SKIP", { method: c.req.method }), await l(), c.res.headers.set(n, "SKIP");
      return;
    }
    const h = await o(c);
    q(c, "x-stoma-cache-key", h), q(c, "x-stoma-cache-ttl", t.ttlSeconds);
    const p = await E(
      () => a.get(h),
      null,
      u,
      "store.get()"
    );
    if (p) {
      u(`HIT ${h}`), q(c, "x-stoma-cache-status", "HIT"), d("HIT", { key: h });
      const g = p.headers.get(de);
      if (g) {
        const x = Math.max(
          0,
          Math.ceil((Number(g) - Date.now()) / 1e3)
        );
        q(c, "x-stoma-cache-expires-in", x);
      }
      const T = await p.arrayBuffer(), b = new Response(ve(T, p.status), {
        status: p.status,
        headers: p.headers
      });
      b.headers.delete(de), b.headers.set(n, "HIT"), c.res = b;
      return;
    }
    if (await l(), c.res.status >= 500) {
      u(`SKIP ${h} (status=${c.res.status})`), q(c, "x-stoma-cache-status", "SKIP"), c.res.headers.set(n, "SKIP");
      return;
    }
    if (t.cacheableStatuses && !t.cacheableStatuses.includes(c.res.status)) {
      u(`SKIP ${h} (status=${c.res.status} not in cacheableStatuses)`), q(c, "x-stoma-cache-status", "SKIP"), c.res.headers.set(n, "SKIP");
      return;
    }
    if (t.respectCacheControl) {
      const g = c.res.headers.get("cache-control") ?? "", T = Or(g);
      if (t.bypassDirectives.some(
        (b) => T.includes(b.toLowerCase())
      )) {
        u(`BYPASS ${h} (cache-control: ${g})`), q(c, "x-stoma-cache-status", "BYPASS"), d("BYPASS", { key: h, directive: g }), c.res.headers.set(n, "BYPASS");
        return;
      }
    }
    u(`MISS ${h} (ttl=${t.ttlSeconds}s)`), q(c, "x-stoma-cache-status", "MISS"), d("MISS", { key: h, ttl: t.ttlSeconds });
    const y = c.res.clone(), f = ve(
      await y.arrayBuffer(),
      y.status
    ), w = new Headers(y.headers);
    w.set(
      de,
      String(Date.now() + t.ttlSeconds * 1e3)
    ), await E(
      () => a.put(
        h,
        new Response(f, {
          status: y.status,
          headers: w
        }),
        t.ttlSeconds
      ),
      void 0,
      u,
      "store.put()"
    ), c.res.headers.set(n, "MISS");
  };
  return {
    name: "cache",
    priority: v.CACHE,
    handler: k(e?.skip, i)
  };
}
function ke(e) {
  const t = e.split(".");
  if (t.length !== 4) return -1;
  let r = 0;
  for (const s of t) {
    const a = Number(s);
    if (Number.isNaN(a) || a < 0 || a > 255) return -1;
    r = r << 8 | a;
  }
  return r >>> 0;
}
function kr(e, t) {
  const r = ke(e);
  if (r === -1 || t < 0 || t > 32) return null;
  const s = t === 0 ? 0 : -1 << 32 - t >>> 0;
  return { version: 4, network: (r & s) >>> 0, mask: s };
}
var Pe = (1n << 128n) - 1n;
function bt(e) {
  let t = e;
  const r = t.indexOf("%");
  r !== -1 && (t = t.slice(0, r)), t = t.toLowerCase();
  const s = t.indexOf("::");
  let a, n;
  if (s !== -1) {
    if (t.indexOf("::", s + 2) !== -1) return null;
    const i = t.slice(0, s), c = t.slice(s + 2);
    a = i === "" ? [] : i.split(":"), n = c === "" ? [] : c.split(":");
    const l = a.length + n.length;
    if (l > 8) return null;
    const u = 8 - l, d = [...a, ...Array(u).fill("0"), ...n];
    return Ne(d);
  }
  const o = t.split(":");
  return o.length !== 8 ? null : Ne(o);
}
function Ne(e) {
  if (e.length !== 8) return null;
  let t = 0n;
  for (const r of e) {
    if (r.length === 0 || r.length > 4) return null;
    const s = Number.parseInt(r, 16);
    if (Number.isNaN(s) || s < 0 || s > 65535) return null;
    t = t << 16n | BigInt(s);
  }
  return t;
}
function De(e, t) {
  const r = bt(e);
  if (r === null || t < 0 || t > 128) return null;
  const s = t === 0 ? 0n : Pe << BigInt(128 - t) & Pe;
  return { version: 6, network: r & s, mask: s };
}
function Se(e) {
  return e.includes(":");
}
function Te(e) {
  const t = e.indexOf("/");
  if (t === -1) {
    if (Se(e))
      return De(e, 128);
    const a = ke(e);
    return a === -1 ? null : { version: 4, network: a, mask: 4294967295 };
  }
  const r = e.slice(0, t), s = Number(e.slice(t + 1));
  return Number.isNaN(s) ? null : Se(r) ? De(r, s) : kr(r, s);
}
function be(e, t) {
  if (Se(e)) {
    const s = bt(e);
    if (s === null) return !1;
    for (const a of t)
      if (a.version === 6 && (s & a.mask) === a.network)
        return !0;
    return !1;
  }
  const r = ke(e);
  if (r === -1) return !1;
  for (const s of t)
    if (s.version === 4 && (r & s.mask) >>> 0 === s.network)
      return !0;
  return !1;
}
var Hr = ["cf-connecting-ip", "x-forwarded-for"];
function ee(e, t = {}) {
  const {
    ipHeaders: r = Hr,
    trustedProxies: s,
    useRightmostForwardedIp: a = !1
  } = t, n = s ? s.map((o) => Te(o)).filter((o) => o !== null) : null;
  for (const o of r) {
    const i = e.get(o);
    if (!i) continue;
    const c = i.split(",").map((u) => u.trim()), l = a ? c[c.length - 1] : c[0];
    if (!(n && o.toLowerCase() === "x-forwarded-for" && !be(l, n)))
      return l;
  }
  return "unknown";
}
var xt = class {
  counters = /* @__PURE__ */ new Map();
  cleanupInterval = null;
  /** Maximum number of unique keys to prevent memory exhaustion */
  maxKeys;
  cleanupIntervalMs;
  constructor(e) {
    typeof e == "number" ? (this.maxKeys = e, this.cleanupIntervalMs = 6e4) : (this.maxKeys = e?.maxKeys ?? 1e5, this.cleanupIntervalMs = e?.cleanupIntervalMs ?? 6e4);
  }
  /** Start the periodic cleanup interval on first use (Workers-safe). */
  ensureCleanupInterval() {
    this.cleanupInterval || (this.cleanupInterval = setInterval(
      () => this.cleanup(),
      this.cleanupIntervalMs
    ));
  }
  /**
   * Increment the counter for a key within the given time window.
   *
   * When the store reaches `maxKeys` capacity and no expired entries can
   * be evicted, returns `{ count: MAX_SAFE_INTEGER, resetAt }` to trigger
   * rate limiting (fail-closed). This prevents unbounded memory growth at
   * the cost of potentially rejecting legitimate requests — an intentional
   * security trade-off where memory safety takes priority over availability.
   */
  async increment(e, t) {
    this.ensureCleanupInterval();
    const r = Date.now(), s = this.counters.get(e);
    if (s && s.resetAt > r)
      return s.count++, { count: s.count, resetAt: s.resetAt };
    if (this.counters.size >= this.maxKeys && !s && (this.cleanup(), this.counters.size >= this.maxKeys)) {
      const o = r + t * 1e3;
      return { count: Number.MAX_SAFE_INTEGER, resetAt: o };
    }
    const a = r + t * 1e3, n = { count: 1, resetAt: a };
    return this.counters.set(e, n), { count: 1, resetAt: a };
  }
  cleanup() {
    const e = Date.now();
    for (const [t, r] of this.counters)
      r.resetAt <= e && this.counters.delete(t);
  }
  /** Stop the cleanup interval (for testing) */
  destroy() {
    this.cleanupInterval && (clearInterval(this.cleanupInterval), this.cleanupInterval = null);
  }
  /** Reset all counters (for testing) */
  reset() {
    this.counters.clear();
  }
}, Ue = /* @__PURE__ */ new WeakMap();
function Ir(e) {
  if (e.store) return e.store;
  let t = Ue.get(e);
  return t || (t = new xt(), Ue.set(e, t)), t;
}
var $s = S({
  name: "rate-limit",
  priority: v.RATE_LIMIT,
  defaults: {
    windowSeconds: 60,
    statusCode: 429,
    message: "Rate limit exceeded"
  },
  handler: async (e, t, { config: r, debug: s, trace: a }) => {
    const n = Ir(r);
    let o;
    r.keyBy ? o = await r.keyBy(e) : o = ee(e.req.raw.headers, { ipHeaders: r.ipHeaders });
    const i = await E(
      () => n.increment(o, r.windowSeconds),
      null,
      s,
      "store.increment()"
    );
    if (!i) {
      s(`store unavailable, failing open (key=${o})`), await t();
      return;
    }
    const { count: c, resetAt: l } = i, u = Math.max(0, r.max - c), d = Math.ceil((l - Date.now()) / 1e3);
    if (q(e, "x-stoma-ratelimit-key", o), q(e, "x-stoma-ratelimit-window", r.windowSeconds), c > r.max) {
      s(`limited (key=${o}, count=${c}, max=${r.max})`), a("rejected", { key: o, count: c, max: r.max });
      const h = String(d);
      throw new m(
        r.statusCode,
        "rate_limited",
        r.message,
        {
          "x-ratelimit-limit": String(r.max),
          "x-ratelimit-remaining": "0",
          "x-ratelimit-reset": h,
          "retry-after": h
        }
      );
    }
    a("allowed", { key: o, count: c, max: r.max, remaining: u }), await t(), e.res.headers.set("x-ratelimit-limit", String(r.max)), e.res.headers.set("x-ratelimit-remaining", String(u)), e.res.headers.set("x-ratelimit-reset", String(d));
  }
}), Mr = (e) => {
  const r = {
    ...{
      origin: "*",
      allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
      allowHeaders: [],
      exposeHeaders: []
    },
    ...e
  }, s = /* @__PURE__ */ ((n) => typeof n == "string" ? n === "*" ? () => n : (o) => n === o ? o : null : typeof n == "function" ? n : (o) => n.includes(o) ? o : null)(r.origin), a = ((n) => typeof n == "function" ? n : Array.isArray(n) ? () => n : () => [])(r.allowMethods);
  return async function(o, i) {
    function c(u, d) {
      o.res.headers.set(u, d);
    }
    const l = await s(o.req.header("origin") || "", o);
    if (l && c("Access-Control-Allow-Origin", l), r.credentials && c("Access-Control-Allow-Credentials", "true"), r.exposeHeaders?.length && c("Access-Control-Expose-Headers", r.exposeHeaders.join(",")), o.req.method === "OPTIONS") {
      r.origin !== "*" && c("Vary", "Origin"), r.maxAge != null && c("Access-Control-Max-Age", r.maxAge.toString());
      const u = await a(o.req.header("origin") || "", o);
      u.length && c("Access-Control-Allow-Methods", u.join(","));
      let d = r.allowHeaders;
      if (!d?.length) {
        const h = o.req.header("Access-Control-Request-Headers");
        h && (d = h.split(/\s*,\s*/));
      }
      return d?.length && (c("Access-Control-Allow-Headers", d.join(",")), o.res.headers.append("Vary", "Access-Control-Request-Headers")), o.res.headers.delete("Content-Length"), o.res.headers.delete("Content-Type"), new Response(null, {
        headers: o.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await i(), r.origin !== "*" && o.header("Vary", "Origin", { append: !0 });
  };
}, js = S({
  name: "mock",
  priority: v.MOCK,
  httpOnly: !0,
  defaults: { status: 200, delayMs: 0 },
  validate: (e) => {
    e.allowInProduction || console.warn(
      "[stoma] mock policy active — intended for development/testing only"
    );
  },
  handler: async (e, t, { config: r }) => {
    r.delayMs > 0 && await new Promise((n) => setTimeout(n, r.delayMs));
    const s = r.body === void 0 ? null : typeof r.body == "string" ? r.body : JSON.stringify(r.body), a = new Headers(r.headers);
    typeof r.body == "object" && !a.has("content-type") && a.set("content-type", "application/json"), e.res = new Response(s, { status: r.status, headers: a });
  }
});
function Os(e) {
  const t = e?.timeout ?? 3e4, r = async (s, a) => {
    if (e?.preserveHost && s.set("_preserveHost", !0), e?.stripHeaders || e?.headers) {
      const n = new Headers(s.req.raw.headers);
      if (e.stripHeaders)
        for (const o of e.stripHeaders)
          n.delete(o);
      if (e.headers)
        for (const [o, i] of Object.entries(e.headers))
          n.set(o, i);
      s.req.raw = new Request(s.req.raw, { headers: n });
    }
    if (t > 0) {
      const n = new AbortController(), o = setTimeout(() => n.abort(), t);
      try {
        await a();
      } finally {
        clearTimeout(o);
      }
    } else
      await a();
  };
  return {
    name: "proxy",
    priority: v.PROXY,
    handler: k(e?.skip, r),
    httpOnly: !0
  };
}
var ks = S({
  name: "api-key-auth",
  priority: v.AUTH,
  defaults: { headerName: "x-api-key" },
  phases: ["request-headers"],
  handler: async (e, t, { config: r, debug: s, trace: a }) => {
    let n = e.req.header(r.headerName), o = "header";
    if (!n && r.queryParam && (n = new URL(e.req.url).searchParams.get(r.queryParam) ?? void 0, o = "query"), !n)
      throw a("rejected", { reason: "missing" }), new m(401, "unauthorized", "Missing API key");
    if (!await r.validate(n))
      throw a("rejected", { reason: "invalid" }), new m(403, "forbidden", "Invalid API key");
    if (a("authenticated", { source: o }), r.forwardKeyIdentity) {
      const l = (await r.forwardKeyIdentity.identityFn(n)).replace(/[\r\n\0]/g, ""), u = new Headers(e.req.raw.headers);
      u.set(r.forwardKeyIdentity.headerName, l), e.req.raw = new Request(e.req.raw, { headers: u }), s(
        `forwarded key identity as ${r.forwardKeyIdentity.headerName}`
      );
    }
    await t();
  },
  evaluate: {
    onRequest: async (e, { config: t, debug: r, trace: s }) => {
      let a = e.headers.get(t.headerName) ?? void 0, n = "header";
      if (!a && t.queryParam && (a = new URL(e.path, "http://localhost").searchParams.get(t.queryParam) ?? void 0, n = "query"), !a)
        return s("rejected", { reason: "missing" }), {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "Missing API key"
        };
      if (!await t.validate(a))
        return s("rejected", { reason: "invalid" }), {
          action: "reject",
          status: 403,
          code: "forbidden",
          message: "Invalid API key"
        };
      if (s("authenticated", { source: n }), t.forwardKeyIdentity) {
        const c = (await t.forwardKeyIdentity.identityFn(a)).replace(/[\r\n\0]/g, "");
        return r(
          `forwarded key identity as ${t.forwardKeyIdentity.headerName}`
        ), {
          action: "continue",
          mutations: [
            {
              type: "header",
              op: "set",
              name: t.forwardKeyIdentity.headerName,
              value: c
            }
          ]
        };
      }
      return { action: "continue" };
    }
  }
}), Hs = S({
  name: "basic-auth",
  priority: v.AUTH,
  defaults: { realm: "Restricted" },
  phases: ["request-headers"],
  handler: async (e, t, { config: r }) => {
    const s = (r.realm ?? "Restricted").replace(/[\r\n\0]/g, "").replace(/"/g, '\\"'), a = e.req.header("authorization");
    if (!a || !a.startsWith("Basic "))
      throw e.header("www-authenticate", `Basic realm="${s}"`), new m(
        401,
        "unauthorized",
        "Basic authentication required"
      );
    let n, o;
    try {
      const c = atob(a.slice(6)), l = c.indexOf(":");
      if (l === -1)
        throw new Error("Invalid format");
      n = c.slice(0, l), o = c.slice(l + 1);
    } catch {
      throw new m(
        401,
        "unauthorized",
        "Malformed Basic authentication header"
      );
    }
    if (!await r.validate(n, o, e))
      throw e.header("www-authenticate", `Basic realm="${s}"`), new m(403, "forbidden", "Invalid credentials");
    await t();
  },
  evaluate: {
    onRequest: async (e, { config: t }) => {
      const r = (t.realm ?? "Restricted").replace(/[\r\n\0]/g, "").replace(/"/g, '\\"'), s = e.headers.get("authorization");
      if (!s || !s.startsWith("Basic "))
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "Basic authentication required",
          headers: { "www-authenticate": `Basic realm="${r}"` }
        };
      let a, n;
      try {
        const i = atob(s.slice(6)), c = i.indexOf(":");
        if (c === -1)
          throw new Error("Invalid format");
        a = i.slice(0, c), n = i.slice(c + 1);
      } catch {
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "Malformed Basic authentication header"
        };
      }
      return await t.validate(a, n, {}) ? { action: "continue" } : {
        action: "reject",
        status: 403,
        code: "forbidden",
        message: "Invalid credentials",
        headers: { "www-authenticate": `Basic realm="${r}"` }
      };
    }
  }
});
function O(e) {
  const t = e.replace(/-/g, "+").replace(/_/g, "/"), r = t + "=".repeat((4 - t.length % 4) % 4);
  return atob(r);
}
function te(e) {
  const t = O(e), r = new Uint8Array(t.length);
  for (let s = 0; s < t.length; s++)
    r[s] = t.charCodeAt(s);
  return r;
}
function he(e) {
  let t = "";
  for (let r = 0; r < e.length; r++)
    t += String.fromCharCode(e[r]);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function xe(e) {
  switch (e) {
    case "HS256":
      return "SHA-256";
    case "HS384":
      return "SHA-384";
    case "HS512":
      return "SHA-512";
    default:
      return null;
  }
}
function Re(e) {
  switch (e) {
    case "RS256":
      return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
    case "RS384":
      return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-384" };
    case "RS512":
      return { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" };
    default:
      return null;
  }
}
var Cr = 3e5, Pr = 1e4, Ae = /* @__PURE__ */ new Map();
async function Ee(e, t, r) {
  const s = Ae.get(e);
  if (s && s.expiresAt > Date.now())
    return s.keys;
  const a = r ?? Pr;
  let n;
  try {
    n = await fetch(e, { signal: AbortSignal.timeout(a) });
  } catch (c) {
    throw c instanceof DOMException && c.name === "TimeoutError" ? new m(
      502,
      "jwks_error",
      `JWKS fetch timed out after ${a}ms: ${e}`
    ) : new m(
      502,
      "jwks_error",
      `Failed to fetch JWKS from ${e}: ${c instanceof Error ? c.message : String(c)}`
    );
  }
  if (!n.ok)
    throw new m(
      502,
      "jwks_error",
      `Failed to fetch JWKS from ${e}: ${n.status}`
    );
  const o = t ?? Cr, i = await n.json();
  return Ae.set(e, { keys: i.keys, expiresAt: Date.now() + o }), i.keys;
}
function Is() {
  Ae.clear();
}
function Nr(e, t) {
  const r = new URL(t.url);
  switch (e) {
    case "@method":
      return t.method.toUpperCase();
    case "@path":
      return r.pathname;
    case "@authority":
      return r.host;
    case "@scheme":
      return r.protocol.replace(":", "");
    case "@target-uri":
      return r.href;
    default:
      throw new Error(`Unknown derived component: ${e}`);
  }
}
function Dr(e, t) {
  return e.startsWith("@") ? Nr(e, t) : t.headers.get(e) ?? "";
}
function Rt(e, t, r) {
  const s = [];
  for (const a of e) {
    const n = Dr(a, r);
    s.push(`"${a}": ${n}`);
  }
  return s.push(`"@signature-params": ${t}`), s.join(`
`);
}
function Ur(e, t) {
  let s = `(${e.map((a) => `"${a}"`).join(" ")});created=${t.created};keyid="${t.keyId}"`;
  return t.algorithm && (s += `;alg="${t.algorithm}"`), t.expires !== void 0 && (s += `;expires=${t.expires}`), t.nonce !== void 0 && (s += `;nonce="${t.nonce}"`), s;
}
function Lr(e) {
  const t = e.match(/^\(([^)]*)\)/);
  if (!t)
    throw new Error("Invalid signature params: missing component list");
  const r = t[1], s = r ? r.match(/"([^"]+)"/g)?.map((c) => c.slice(1, -1)) ?? [] : [], a = e.slice(t[0].length), n = {}, o = /;(\w+)=("([^"]*)"|(\d+))/g;
  let i = o.exec(a);
  for (; i !== null; )
    n[i[1]] = i[3] ?? i[4], i = o.exec(a);
  return { components: s, params: n };
}
function ie(e) {
  switch (e) {
    case "hmac-sha256":
      return {
        importAlg: { name: "HMAC", hash: "SHA-256" },
        signAlg: "HMAC"
      };
    case "rsa-v1_5-sha256":
      return {
        importAlg: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        signAlg: "RSASSA-PKCS1-v1_5"
      };
    case "rsa-pss-sha512":
      return {
        importAlg: { name: "RSA-PSS", hash: "SHA-512" },
        signAlg: { name: "RSA-PSS", saltLength: 64 }
      };
    default:
      throw new Error(`Unsupported signature algorithm: ${e}`);
  }
}
async function Br(e, t, r) {
  const { importAlg: s } = ie(e);
  if (e.startsWith("hmac")) {
    if (!t) throw new Error("HMAC algorithm requires secret");
    const a = new TextEncoder();
    return crypto.subtle.importKey(
      "raw",
      a.encode(t),
      s,
      !1,
      ["sign"]
    );
  }
  if (!r) throw new Error("RSA algorithm requires privateKey");
  return crypto.subtle.importKey("jwk", r, s, !1, ["sign"]);
}
async function Jr(e, t, r) {
  const { importAlg: s } = ie(e);
  if (e.startsWith("hmac")) {
    if (!t) throw new Error("HMAC algorithm requires secret");
    const a = new TextEncoder();
    return crypto.subtle.importKey(
      "raw",
      a.encode(t),
      s,
      !1,
      ["verify"]
    );
  }
  if (!r) throw new Error("RSA algorithm requires publicKey");
  return crypto.subtle.importKey("jwk", r, s, !1, [
    "verify"
  ]);
}
function Kr(e) {
  return btoa(String.fromCharCode(...new Uint8Array(e)));
}
function zr(e) {
  const t = atob(e), r = new Uint8Array(t.length);
  for (let s = 0; s < t.length; s++)
    r[s] = t.charCodeAt(s);
  return r;
}
var Ms = S({
  name: "generate-http-signature",
  priority: v.PROXY,
  defaults: {
    components: ["@method", "@path", "@authority"],
    signatureHeaderName: "Signature",
    signatureInputHeaderName: "Signature-Input",
    label: "sig1",
    nonce: !1
  },
  handler: async (e, t, { config: r, debug: s }) => {
    if (!r.secret && !r.privateKey)
      throw new m(
        500,
        "config_error",
        "generateHttpSignature requires either 'secret' or 'privateKey'"
      );
    const a = r.components, n = r.label, o = Math.floor(Date.now() / 1e3), i = {
      created: o,
      keyId: r.keyId,
      algorithm: r.algorithm
    };
    r.expires !== void 0 && (i.expires = o + r.expires), r.nonce && (i.nonce = crypto.randomUUID().replace(/-/g, ""));
    const c = Ur(a, i), l = Rt(
      a,
      c,
      e.req.raw
    );
    s(
      `signing with ${r.algorithm}, components: ${a.join(", ")}`
    );
    const u = await Br(
      r.algorithm,
      r.secret,
      r.privateKey
    ), { signAlg: d } = ie(r.algorithm), h = new TextEncoder(), p = await crypto.subtle.sign(
      d,
      u,
      h.encode(l)
    ), y = Kr(p), f = new Headers(e.req.raw.headers);
    f.set(
      r.signatureInputHeaderName,
      `${n}=${c}`
    ), f.set(r.signatureHeaderName, `${n}=:${y}:`), e.req.raw = new Request(e.req.raw, { headers: f }), s("signature headers attached"), await t();
  }
});
function Fr(e) {
  let t = "";
  for (let r = 0; r < e.length; r++)
    t += String.fromCharCode(e[r]);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function Le(e) {
  return btoa(e).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function Wr(e) {
  switch (e) {
    case "HS256":
    case "RS256":
      return "SHA-256";
    case "HS384":
    case "RS384":
      return "SHA-384";
    case "HS512":
    case "RS512":
      return "SHA-512";
  }
}
function Be(e) {
  return e.startsWith("HS");
}
var Cs = S({
  name: "generate-jwt",
  priority: v.REQUEST_TRANSFORM,
  defaults: {
    expiresIn: 3600,
    headerName: "Authorization",
    tokenPrefix: "Bearer"
  },
  handler: async (e, t, { config: r, debug: s }) => {
    if (Be(r.algorithm)) {
      if (!r.secret)
        throw new m(
          500,
          "config_error",
          "generateJwt with HMAC algorithm requires 'secret'"
        );
    } else if (!r.privateKey)
      throw new m(
        500,
        "config_error",
        "generateJwt with RSA algorithm requires 'privateKey'"
      );
    const a = { alg: r.algorithm, typ: "JWT" }, n = Le(JSON.stringify(a)), o = Math.floor(Date.now() / 1e3), i = {
      iat: o,
      exp: o + (r.expiresIn ?? 3600)
    };
    r.issuer && (i.iss = r.issuer), r.audience && (i.aud = r.audience);
    let c = {};
    r.claims && (c = typeof r.claims == "function" ? await r.claims(e) : r.claims);
    const l = { ...i, ...c }, u = Le(JSON.stringify(l)), d = `${n}.${u}`, h = new TextEncoder(), p = h.encode(d), y = Wr(r.algorithm);
    let f;
    if (Be(r.algorithm)) {
      const x = await crypto.subtle.importKey(
        "raw",
        h.encode(r.secret),
        { name: "HMAC", hash: y },
        !1,
        ["sign"]
      );
      f = await crypto.subtle.sign("HMAC", x, p);
    } else {
      const x = await crypto.subtle.importKey(
        "jwk",
        r.privateKey,
        { name: "RSASSA-PKCS1-v1_5", hash: y },
        !1,
        ["sign"]
      );
      f = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", x, p);
    }
    const w = Fr(new Uint8Array(f)), g = `${d}.${w}`;
    s(`generated JWT (alg=${r.algorithm})`);
    const T = r.tokenPrefix ? `${r.tokenPrefix} ${g}` : g, b = new Headers(e.req.raw.headers);
    b.set(r.headerName, T), e.req.raw = new Request(e.req.raw, { headers: b }), await t();
  }
}), Ps = S({
  name: "jws",
  priority: v.AUTH,
  defaults: {
    headerName: "X-JWS-Signature",
    payloadSource: "embedded",
    forwardPayload: !1,
    forwardHeaderName: "X-JWS-Payload"
  },
  validate: (e) => {
    if (!e.secret && !e.jwksUrl)
      throw new m(
        500,
        "config_error",
        "jws requires either 'secret' or 'jwksUrl'"
      );
  },
  handler: async (e, t, { config: r, debug: s }) => {
    const a = e.req.header(r.headerName);
    if (!a)
      throw new m(
        401,
        "jws_missing",
        `Missing JWS header: ${r.headerName}`
      );
    const n = a.split(".");
    if (n.length !== 3)
      throw new m(
        401,
        "jws_invalid",
        "Malformed JWS: expected 3 parts"
      );
    const [o, i, c] = n;
    let l;
    try {
      l = JSON.parse(O(o));
    } catch {
      throw new m(
        401,
        "jws_invalid",
        "Malformed JWS: invalid header encoding"
      );
    }
    if (l.alg.toLowerCase() === "none")
      throw new m(
        401,
        "jws_invalid",
        "JWS algorithm 'none' is not allowed"
      );
    let u;
    if (r.payloadSource === "body") {
      const y = await e.req.raw.clone().text(), f = new TextEncoder();
      u = he(f.encode(y));
    } else {
      if (!i)
        throw new m(
          401,
          "jws_invalid",
          "JWS has empty payload but payloadSource is 'embedded'"
        );
      u = i;
    }
    const d = new TextEncoder(), h = d.encode(`${o}.${u}`), p = te(c);
    if (r.secret) {
      const y = xe(l.alg);
      if (!y)
        throw new m(
          401,
          "jws_invalid",
          `Unsupported JWS algorithm: ${l.alg}`
        );
      s(`HMAC verification (alg=${l.alg})`);
      const f = await crypto.subtle.importKey(
        "raw",
        d.encode(r.secret),
        { name: "HMAC", hash: y },
        !1,
        ["verify"]
      );
      if (!await crypto.subtle.verify(
        "HMAC",
        f,
        p,
        h
      ))
        throw new m(401, "jws_invalid", "Invalid JWS signature");
    } else if (r.jwksUrl) {
      const y = Re(l.alg);
      if (!y)
        throw new m(
          401,
          "jws_invalid",
          `Unsupported JWS algorithm: ${l.alg}`
        );
      const f = await Ee(
        r.jwksUrl,
        r.jwksCacheTtlMs,
        r.jwksTimeoutMs
      ), w = l.kid ? f.find(
        (b) => b.kid === l.kid
      ) : f[0];
      if (!w)
        throw new m(
          401,
          "jws_invalid",
          "No matching JWKS key found"
        );
      s(
        `JWKS verification (alg=${l.alg}, kid=${l.kid ?? "none"})`
      );
      const g = await crypto.subtle.importKey(
        "jwk",
        w,
        y,
        !1,
        ["verify"]
      );
      if (!await crypto.subtle.verify(
        y,
        g,
        p,
        h
      ))
        throw new m(401, "jws_invalid", "Invalid JWS signature");
    }
    if (r.forwardPayload)
      try {
        const y = O(u), f = new Headers(e.req.raw.headers), w = y.replace(/[\r\n\0]/g, "");
        f.set(r.forwardHeaderName, w), e.req.raw = new Request(e.req.raw, { headers: f });
      } catch {
      }
    s("JWS verified"), await t();
  },
  evaluate: {
    onRequest: async (e, { config: t, debug: r }) => {
      const s = e.headers.get(t.headerName);
      if (!s)
        return {
          action: "reject",
          status: 401,
          code: "jws_missing",
          message: `Missing JWS header: ${t.headerName}`
        };
      const a = s.split(".");
      if (a.length !== 3)
        return {
          action: "reject",
          status: 401,
          code: "jws_invalid",
          message: "Malformed JWS: expected 3 parts"
        };
      const [n, o, i] = a;
      let c;
      try {
        c = JSON.parse(O(n));
      } catch {
        return {
          action: "reject",
          status: 401,
          code: "jws_invalid",
          message: "Malformed JWS header: invalid base64"
        };
      }
      if (c.alg.toLowerCase() === "none")
        return {
          action: "reject",
          status: 401,
          code: "jws_invalid",
          message: "JWS algorithm 'none' is not allowed"
        };
      const l = t.payloadSource === "body" && e.body ? typeof e.body == "string" ? he(new TextEncoder().encode(e.body)) : he(new Uint8Array(e.body)) : o, u = `${n}.${l}`, d = te(i);
      if (t.secret) {
        const h = xe(c.alg);
        if (!h)
          return {
            action: "reject",
            status: 401,
            code: "jws_invalid",
            message: `Unsupported JWS algorithm: ${c.alg}`
          };
        const p = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(t.secret),
          { name: "HMAC", hash: h },
          !1,
          ["verify"]
        );
        if (!await crypto.subtle.verify(
          h,
          p,
          d,
          new TextEncoder().encode(u)
        ))
          return {
            action: "reject",
            status: 401,
            code: "jws_invalid",
            message: "Invalid JWS signature"
          };
      } else if (t.jwksUrl) {
        const h = Re(c.alg);
        if (!h)
          return {
            action: "reject",
            status: 401,
            code: "jws_invalid",
            message: `Unsupported JWS algorithm: ${c.alg}`
          };
        const p = await Ee(
          t.jwksUrl,
          t.jwksCacheTtlMs,
          t.jwksTimeoutMs
        ), y = c.kid ? p.find(
          (g) => g.kid === c.kid
        ) : p[0];
        if (!y)
          return {
            action: "reject",
            status: 401,
            code: "jws_invalid",
            message: "No matching JWKS key found"
          };
        const f = await crypto.subtle.importKey(
          "jwk",
          y,
          h,
          !1,
          ["verify"]
        );
        if (!await crypto.subtle.verify(
          h,
          f,
          d,
          new TextEncoder().encode(u)
        ))
          return {
            action: "reject",
            status: 401,
            code: "jws_invalid",
            message: "Invalid JWS signature"
          };
      }
      if (t.forwardPayload)
        try {
          const p = O(l).replace(/[\r\n\0]/g, "");
          return {
            action: "continue",
            mutations: [
              {
                type: "header",
                op: "set",
                name: t.forwardHeaderName,
                value: p
              }
            ]
          };
        } catch {
        }
      return r("JWS verified"), { action: "continue" };
    }
  }
}), Ns = S({
  name: "jwt-auth",
  priority: v.AUTH,
  phases: ["request-headers"],
  defaults: {
    headerName: "authorization",
    tokenPrefix: "Bearer",
    clockSkewSeconds: 0,
    requireExp: !1
  },
  validate: (e) => {
    if (!e.secret && !e.jwksUrl)
      throw new m(
        500,
        "config_error",
        "jwtAuth requires either 'secret' or 'jwksUrl'"
      );
  },
  handler: async (e, t, { config: r, debug: s }) => {
    const a = e.req.header(r.headerName);
    if (!a)
      throw new m(
        401,
        "unauthorized",
        "Missing authentication token"
      );
    let n;
    if (r.tokenPrefix) {
      if (!a.startsWith(`${r.tokenPrefix} `))
        throw new m(
          401,
          "unauthorized",
          `Expected ${r.tokenPrefix} token`
        );
      n = a.slice(r.tokenPrefix.length + 1);
    } else
      n = a;
    if (!n || !n.trim())
      throw new m(401, "unauthorized", "Empty authentication token");
    const o = n.split(".");
    if (o.length !== 3)
      throw new m(
        401,
        "unauthorized",
        "Malformed JWT: expected 3 parts"
      );
    let i, c;
    try {
      i = JSON.parse(O(o[0])), c = JSON.parse(O(o[1]));
    } catch {
      throw new m(
        401,
        "unauthorized",
        "Malformed JWT: invalid base64 encoding"
      );
    }
    if (i.alg.toLowerCase() === "none")
      throw new m(
        401,
        "unauthorized",
        "JWT algorithm 'none' is not allowed"
      );
    r.secret ? (s(`HMAC verification (alg=${i.alg})`), await Je(r.secret, o[0], o[1], o[2], i.alg)) : r.jwksUrl && (s(
      `JWKS verification (alg=${i.alg}, kid=${i.kid ?? "none"})`
    ), await Ke(
      r.jwksUrl,
      o[0],
      o[1],
      o[2],
      i,
      r.jwksCacheTtlMs,
      r.jwksTimeoutMs
    ));
    const l = Math.floor(Date.now() / 1e3);
    if (r.requireExp && c.exp === void 0)
      throw new m(
        401,
        "unauthorized",
        "JWT must contain an 'exp' claim"
      );
    if (c.exp !== void 0 && c.exp < l - r.clockSkewSeconds)
      throw new m(401, "unauthorized", "JWT has expired");
    if (r.issuer && c.iss !== r.issuer)
      throw new m(401, "unauthorized", "JWT issuer mismatch");
    if (r.audience && !(Array.isArray(c.aud) ? c.aud : [c.aud]).includes(r.audience))
      throw new m(401, "unauthorized", "JWT audience mismatch");
    if (s(`verified (sub=${c.sub ?? "none"})`), r.forwardClaims) {
      const u = new Headers(e.req.raw.headers);
      let d = !1;
      for (const [h, p] of Object.entries(r.forwardClaims)) {
        const y = c[h];
        if (y != null) {
          const f = String(y).replace(/[\r\n\0]/g, "");
          u.set(p, f), d = !0;
        }
      }
      d && (e.req.raw = new Request(e.req.raw, { headers: u }));
    }
    await t();
  },
  evaluate: {
    onRequest: async (e, { config: t }) => {
      const r = e.headers.get(t.headerName);
      if (!r)
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "Missing authentication token"
        };
      let s;
      if (t.tokenPrefix) {
        if (!r.startsWith(`${t.tokenPrefix} `))
          return {
            action: "reject",
            status: 401,
            code: "unauthorized",
            message: `Expected ${t.tokenPrefix} token`
          };
        s = r.slice(t.tokenPrefix.length + 1);
      } else
        s = r;
      if (!s || !s.trim())
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "Empty authentication token"
        };
      const a = s.split(".");
      if (a.length !== 3)
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "Malformed JWT: expected 3 parts"
        };
      let n, o;
      try {
        n = JSON.parse(O(a[0])), o = JSON.parse(O(a[1]));
      } catch {
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "Malformed JWT: invalid base64 encoding"
        };
      }
      if (n.alg.toLowerCase() === "none")
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "JWT algorithm 'none' is not allowed"
        };
      t.secret ? await Je(
        t.secret,
        a[0],
        a[1],
        a[2],
        n.alg
      ) : t.jwksUrl && await Ke(
        t.jwksUrl,
        a[0],
        a[1],
        a[2],
        n,
        t.jwksCacheTtlMs,
        t.jwksTimeoutMs
      );
      const i = Math.floor(Date.now() / 1e3);
      if (t.requireExp && o.exp === void 0)
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "JWT must contain an 'exp' claim"
        };
      if (o.exp !== void 0 && o.exp < i - t.clockSkewSeconds)
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "JWT has expired"
        };
      if (t.issuer && o.iss !== t.issuer)
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "JWT issuer mismatch"
        };
      if (t.audience && !(Array.isArray(o.aud) ? o.aud : [o.aud]).includes(t.audience))
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "JWT audience mismatch"
        };
      if (t.forwardClaims) {
        const c = [];
        for (const [l, u] of Object.entries(t.forwardClaims)) {
          const d = o[l];
          if (d != null) {
            const h = String(d).replace(/[\r\n\0]/g, "");
            c.push({
              type: "header",
              op: "set",
              name: u,
              value: h
            });
          }
        }
        if (c.length > 0)
          return { action: "continue", mutations: c };
      }
      return { action: "continue" };
    }
  }
});
async function Je(e, t, r, s, a) {
  const n = xe(a);
  if (!n)
    throw new m(
      401,
      "unauthorized",
      `Unsupported JWT algorithm: ${a}`
    );
  const o = new TextEncoder(), i = await crypto.subtle.importKey(
    "raw",
    o.encode(e),
    { name: "HMAC", hash: n },
    !1,
    ["verify"]
  ), c = o.encode(`${t}.${r}`), l = te(s);
  if (!await crypto.subtle.verify("HMAC", i, l, c))
    throw new m(401, "unauthorized", "Invalid JWT signature");
}
async function Ke(e, t, r, s, a, n, o) {
  const i = await Ee(e, n, o), c = a.kid ? i.find(
    (f) => f.kid === a.kid
  ) : i[0];
  if (!c)
    throw new m(401, "unauthorized", "No matching JWKS key found");
  const l = Re(a.alg);
  if (!l)
    throw new m(
      401,
      "unauthorized",
      `Unsupported JWT algorithm: ${a.alg}`
    );
  const u = await crypto.subtle.importKey(
    "jwk",
    c,
    l,
    !1,
    ["verify"]
  ), h = new TextEncoder().encode(`${t}.${r}`), p = te(s);
  if (!await crypto.subtle.verify(l, u, p, h))
    throw new m(401, "unauthorized", "Invalid JWT signature");
}
var Vr = 100, M = /* @__PURE__ */ new Map();
function Yr(e) {
  if (M.size >= e) {
    const t = M.keys().next().value;
    t && M.delete(t);
  }
}
var Ds = S({
  name: "oauth2",
  priority: v.AUTH,
  phases: ["request-headers"],
  defaults: {
    tokenLocation: "header",
    headerName: "authorization",
    headerPrefix: "Bearer",
    queryParam: "access_token",
    cacheTtlSeconds: 0
  },
  validate: (e) => {
    if (!e.introspectionUrl && !e.localValidate)
      throw new m(
        500,
        "config_error",
        "oauth2 requires either introspectionUrl or localValidate"
      );
  },
  handler: async (e, t, { config: r, debug: s }) => {
    let a;
    if (r.tokenLocation === "query")
      a = e.req.query(r.queryParam) ?? void 0;
    else {
      const n = e.req.header(r.headerName);
      if (n && r.headerPrefix) {
        const o = `${r.headerPrefix} `;
        n.startsWith(o) ? a = n.slice(o.length) : a = void 0;
      } else
        a = n ?? void 0;
    }
    if (!a || !a.trim())
      throw new m(401, "unauthorized", "Missing access token");
    if (r.localValidate) {
      if (s("local validation"), !await r.localValidate(a))
        throw new m(401, "unauthorized", "Token validation failed");
    } else if (r.introspectionUrl) {
      s("introspection validation");
      const n = await ze(
        a,
        r.introspectionUrl,
        r.clientId,
        r.clientSecret,
        r.cacheTtlSeconds ?? 0,
        r.introspectionTimeoutMs,
        r.cacheMaxEntries
      );
      if (!n.active)
        throw new m(401, "unauthorized", "Token is not active");
      if (r.requiredScopes && r.requiredScopes.length > 0) {
        const o = n.scope ? n.scope.split(" ") : [];
        if (r.requiredScopes.filter(
          (c) => !o.includes(c)
        ).length > 0)
          throw new m(403, "forbidden", "Insufficient scope");
      }
      if (r.forwardTokenInfo) {
        const o = new Headers(e.req.raw.headers);
        let i = !1;
        for (const [c, l] of Object.entries(
          r.forwardTokenInfo
        )) {
          const u = n[c];
          if (u != null) {
            const d = String(u).replace(/[\r\n\0]/g, "");
            o.set(l, d), i = !0;
          }
        }
        i && (e.req.raw = new Request(e.req.raw, { headers: o }));
      }
    }
    await t();
  },
  evaluate: {
    onRequest: async (e, { config: t, debug: r }) => {
      let s;
      if (t.tokenLocation === "query")
        s = new URL(e.path, "http://localhost").searchParams.get(t.queryParam) ?? void 0;
      else {
        const a = e.headers.get(t.headerName) ?? void 0;
        if (a && t.headerPrefix) {
          const n = `${t.headerPrefix} `;
          a.startsWith(n) && (s = a.slice(n.length));
        } else
          s = a;
      }
      if (!s || !s.trim())
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "Missing access token"
        };
      if (t.localValidate)
        return r("local validation"), await t.localValidate(s) ? { action: "continue" } : {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "Token validation failed"
        };
      if (t.introspectionUrl) {
        r("introspection validation");
        const a = await ze(
          s,
          t.introspectionUrl,
          t.clientId,
          t.clientSecret,
          t.cacheTtlSeconds ?? 0,
          t.introspectionTimeoutMs,
          t.cacheMaxEntries
        );
        if (!a.active)
          return {
            action: "reject",
            status: 401,
            code: "unauthorized",
            message: "Token is not active"
          };
        if (t.requiredScopes && t.requiredScopes.length > 0) {
          const n = a.scope ? a.scope.split(" ") : [];
          if (t.requiredScopes.filter(
            (i) => !n.includes(i)
          ).length > 0)
            return {
              action: "reject",
              status: 403,
              code: "forbidden",
              message: "Insufficient scope"
            };
        }
        if (t.forwardTokenInfo) {
          const n = [];
          for (const [o, i] of Object.entries(
            t.forwardTokenInfo
          )) {
            const c = a[o];
            if (c != null) {
              const l = String(c).replace(/[\r\n\0]/g, "");
              n.push({
                type: "header",
                op: "set",
                name: i,
                value: l
              });
            }
          }
          if (n.length > 0)
            return { action: "continue", mutations: n };
        }
        return { action: "continue" };
      }
      return { action: "continue" };
    }
  }
}), Gr = 5e3;
async function ze(e, t, r, s, a = 0, n, o = Vr) {
  if (a > 0) {
    const d = M.get(e);
    if (d && d.expiresAt > Date.now())
      return M.delete(e), M.set(e, d), d.result;
  }
  const i = {
    "content-type": "application/x-www-form-urlencoded"
  };
  r && s && (i.authorization = `Basic ${btoa(`${r}:${s}`)}`);
  const c = n ?? Gr;
  let l;
  try {
    l = await fetch(t, {
      method: "POST",
      headers: i,
      body: `token=${encodeURIComponent(e)}`,
      signal: AbortSignal.timeout(c)
    });
  } catch (d) {
    throw d instanceof DOMException && d.name === "TimeoutError" ? new m(
      502,
      "introspection_error",
      `Introspection endpoint timed out after ${c}ms`
    ) : new m(
      502,
      "introspection_error",
      `Introspection endpoint error: ${d instanceof Error ? d.message : String(d)}`
    );
  }
  if (!l.ok)
    throw new m(
      502,
      "introspection_error",
      `Introspection endpoint returned ${l.status}`
    );
  const u = await l.json();
  return a > 0 && (Yr(o), M.set(e, {
    result: u,
    expiresAt: Date.now() + a * 1e3
  })), u;
}
var Us = S({
  name: "rbac",
  priority: v.AUTH,
  defaults: {
    roleHeader: "x-user-role",
    permissionHeader: "x-user-permissions",
    permissionDelimiter: ",",
    roleDelimiter: ",",
    denyMessage: "Access denied: insufficient permissions",
    stripHeaders: !0
  },
  phases: ["request-headers"],
  handler: async (e, t, { config: r, debug: s }) => {
    if (r.stripHeaders) {
      const o = new Headers(e.req.raw.headers);
      let i = !1;
      r.roleHeader && o.has(r.roleHeader) && (o.delete(r.roleHeader), i = !0, s("stripped role header from incoming request")), r.permissionHeader && o.has(r.permissionHeader) && (o.delete(r.permissionHeader), i = !0, s("stripped permission header from incoming request")), i && (e.req.raw = new Request(e.req.raw, { headers: o }));
    }
    const a = r.roles && r.roles.length > 0, n = r.permissions && r.permissions.length > 0;
    if (!a && !n) {
      s("no roles or permissions configured, passing through"), await t();
      return;
    }
    if (a) {
      const o = e.req.header(r.roleHeader) ?? "", i = o ? o.split(r.roleDelimiter).map((l) => l.trim()) : [];
      if (s(
        `checking roles: user=${i.join(",")} required=${r.roles.join(",")}`
      ), !r.roles.some(
        (l) => i.includes(l)
      ))
        throw new m(403, "forbidden", r.denyMessage);
    }
    if (n) {
      const o = e.req.header(r.permissionHeader) ?? "", i = o ? o.split(r.permissionDelimiter).map((l) => l.trim()) : [];
      if (s(
        `checking permissions: user=${i.join(",")} required=${r.permissions.join(",")}`
      ), !r.permissions.every(
        (l) => i.includes(l)
      ))
        throw new m(403, "forbidden", r.denyMessage);
    }
    await t();
  },
  evaluate: {
    onRequest: async (e, { config: t, debug: r }) => {
      const s = t.roles && t.roles.length > 0, a = t.permissions && t.permissions.length > 0;
      if (!s && !a)
        return r("no roles or permissions configured, passing through"), { action: "continue" };
      if (s) {
        const n = e.headers.get(t.roleHeader) ?? "", o = n ? n.split(t.roleDelimiter).map((c) => c.trim()) : [];
        if (r(
          `checking roles: user=${o.join(",")} required=${t.roles.join(",")}`
        ), !t.roles.some(
          (c) => o.includes(c)
        ))
          return {
            action: "reject",
            status: 403,
            code: "forbidden",
            message: t.denyMessage
          };
      }
      if (a) {
        const n = e.headers.get(t.permissionHeader) ?? "", o = n ? n.split(t.permissionDelimiter).map((c) => c.trim()) : [];
        if (r(
          `checking permissions: user=${o.join(",")} required=${t.permissions.join(",")}`
        ), !t.permissions.every(
          (c) => o.includes(c)
        ))
          return {
            action: "reject",
            status: 403,
            code: "forbidden",
            message: t.denyMessage
          };
      }
      return { action: "continue" };
    }
  }
}), Ls = S({
  name: "verify-http-signature",
  priority: v.AUTH,
  defaults: {
    requiredComponents: ["@method"],
    maxAge: 300,
    signatureHeaderName: "Signature",
    signatureInputHeaderName: "Signature-Input",
    label: "sig1"
  },
  handler: async (e, t, { config: r, debug: s }) => {
    if (!r.keys || Object.keys(r.keys).length === 0)
      throw new m(
        500,
        "config_error",
        "verifyHttpSignature requires at least one key in 'keys'"
      );
    const a = r.label, n = e.req.header(r.signatureInputHeaderName);
    if (!n)
      throw new m(
        401,
        "signature_invalid",
        "Missing Signature-Input header"
      );
    const o = e.req.header(r.signatureHeaderName);
    if (!o)
      throw new m(
        401,
        "signature_invalid",
        "Missing Signature header"
      );
    const i = `${a}=`;
    if (!n.startsWith(i))
      throw new m(
        401,
        "signature_invalid",
        `Missing signature label "${a}" in Signature-Input header`
      );
    const c = n.slice(i.length), { components: l, params: u } = Lr(c);
    s(`verifying label=${a}, components=${l.join(",")}`);
    const d = `${a}=:`;
    if (!o.startsWith(d) || !o.endsWith(":"))
      throw new m(
        401,
        "signature_invalid",
        `Invalid Signature header format for label "${a}"`
      );
    const h = o.slice(d.length, -1), p = Math.floor(Date.now() / 1e3);
    if (u.created && Number.parseInt(u.created, 10) + r.maxAge < p)
      throw new m(
        401,
        "signature_invalid",
        "Signature has expired (maxAge exceeded)"
      );
    if (u.expires && Number.parseInt(u.expires, 10) < p)
      throw new m(
        401,
        "signature_invalid",
        "Signature has expired (expires parameter)"
      );
    for (const _ of r.requiredComponents)
      if (!l.includes(_))
        throw new m(
          401,
          "signature_invalid",
          `Required component "${_}" not found in signature`
        );
    const y = u.keyid;
    if (!y)
      throw new m(
        401,
        "signature_invalid",
        "Missing keyid in signature parameters"
      );
    const f = r.keys[y];
    if (!f)
      throw new m(
        401,
        "signature_invalid",
        "Unknown key identifier"
      );
    const g = Rt(
      l,
      c,
      e.req.raw
    ), T = await Jr(
      f.algorithm,
      f.secret,
      f.publicKey
    ), { signAlg: b } = ie(f.algorithm), x = new TextEncoder(), A = zr(h);
    if (!await crypto.subtle.verify(
      b,
      T,
      A,
      x.encode(g)
    ))
      throw new m(
        401,
        "signature_invalid",
        "Signature verification failed"
      );
    s("signature verified successfully"), await t();
  }
}), Bs = S({
  name: "dynamic-routing",
  priority: v.REQUEST_TRANSFORM,
  httpOnly: !0,
  defaults: { fallthrough: !0 },
  handler: async (e, t, { config: r, debug: s }) => {
    for (const a of r.rules)
      if (await a.condition(e)) {
        s(
          `matched rule ${a.name ? `"${a.name}"` : "(unnamed)"} → target=${a.target}`
        ), e.set("_dynamicTarget", a.target), a.rewritePath && e.set("_dynamicRewrite", a.rewritePath), a.headers && e.set("_dynamicHeaders", a.headers), await t();
        return;
      }
    if (!r.fallthrough)
      throw new m(404, "no_route", "No routing rule matched");
    s("no rule matched, falling through"), await t();
  }
});
function Js(e) {
  const t = J(
    { mode: "deny", countryHeader: "cf-ipcountry" },
    e
  ), r = new Set(
    (t.allow ?? []).map((n) => n.toUpperCase())
  ), s = new Set(
    (t.deny ?? []).map((n) => n.toUpperCase())
  ), a = async (n, o) => {
    const i = K(n, "geo-ip-filter"), c = n.req.header(t.countryHeader)?.toUpperCase(), l = t.mode;
    if (i(`country=${c ?? "unknown"} mode=${l}`), l === "allow") {
      if (!c || !r.has(c))
        throw new m(
          403,
          "geo_denied",
          "Access denied from this region"
        );
    } else if (c && s.has(c))
      throw new m(
        403,
        "geo_denied",
        "Access denied from this region"
      );
    await o();
  };
  return {
    name: "geo-ip-filter",
    priority: v.IP_FILTER,
    handler: k(e?.skip, a),
    phases: ["request-headers"],
    evaluate: {
      onRequest: async (n) => {
        const o = n.headers.get(t.countryHeader)?.toUpperCase();
        if (t.mode === "allow") {
          if (!o || !r.has(o))
            return {
              action: "reject",
              status: 403,
              code: "geo_denied",
              message: "Access denied from this region"
            };
        } else if (o && s.has(o))
          return {
            action: "reject",
            status: 403,
            code: "geo_denied",
            message: "Access denied from this region"
          };
        return { action: "continue" };
      }
    }
  };
}
var Ks = S({
  name: "http-callout",
  priority: v.REQUEST_TRANSFORM,
  httpOnly: !0,
  defaults: { method: "GET", timeout: 5e3, abortOnFailure: !0 },
  handler: async (e, t, { config: r, debug: s }) => {
    const a = typeof r.url == "function" ? await r.url(e) : r.url, n = {};
    if (r.headers)
      for (const [c, l] of Object.entries(r.headers))
        n[c] = typeof l == "function" ? await l(e) : l;
    let o;
    if (r.body !== void 0) {
      const c = typeof r.body == "function" ? await r.body(e) : r.body;
      c != null && (o = typeof c == "string" ? c : JSON.stringify(c), typeof c != "string" && !n["content-type"] && (n["content-type"] = "application/json"));
    }
    s(`${r.method} ${a}`);
    let i;
    try {
      i = await fetch(a, {
        method: r.method,
        headers: n,
        body: o,
        signal: AbortSignal.timeout(r.timeout)
      });
    } catch (c) {
      if (r.onError) {
        await r.onError(c, e), await t();
        return;
      }
      throw new m(
        502,
        "callout_failed",
        `External callout failed: ${c instanceof Error ? c.message : String(c)}`
      );
    }
    if (!i.ok && r.abortOnFailure) {
      if (r.onError) {
        await r.onError(
          new Error(`External callout returned ${i.status}`),
          e
        ), await t();
        return;
      }
      throw new m(
        502,
        "callout_failed",
        `External callout returned ${i.status}`
      );
    }
    await r.onResponse(i, e), await t();
  }
}), zs = S({
  name: "interrupt",
  priority: v.DEFAULT,
  httpOnly: !0,
  defaults: { statusCode: 200, headers: {} },
  handler: async (e, t, { config: r, debug: s }) => {
    if (!await r.condition(e)) {
      s("condition false, continuing pipeline"), await t();
      return;
    }
    s("condition true, short-circuiting");
    const n = new Headers(r.headers);
    let o = null;
    r.body === void 0 || r.body === null || (typeof r.body == "string" ? (o = r.body, n.has("content-type") || n.set("content-type", "text/plain")) : (o = JSON.stringify(r.body), n.has("content-type") || n.set("content-type", "application/json"))), e.res = new Response(o, {
      status: r.statusCode,
      headers: n
    });
  }
});
function Fs(e) {
  const t = e.mode ?? "deny", r = e.ipHeaders ? { ipHeaders: e.ipHeaders } : {}, s = (e.allow ?? []).map(Te).filter((i) => i !== null), a = (e.deny ?? []).map(Te).filter((i) => i !== null);
  function n(i) {
    if (t === "allow") {
      if (!be(i, s))
        return {
          action: "reject",
          status: 403,
          code: "ip_denied",
          message: "Access denied"
        };
    } else if (be(i, a))
      return {
        action: "reject",
        status: 403,
        code: "ip_denied",
        message: "Access denied"
      };
    return { action: "continue" };
  }
  const o = async (i, c) => {
    const l = ee(i.req.raw.headers, r), u = n(l);
    if (u.action === "reject")
      throw new m(u.status, u.code, u.message);
    await c();
  };
  return {
    name: "ip-filter",
    priority: v.IP_FILTER,
    handler: k(e.skip, o),
    phases: ["request-headers"],
    // ── Protocol-agnostic evaluator ────────────────────────────────
    evaluate: {
      onRequest: async (i) => {
        const c = i.clientIp ?? ee(i.headers, r);
        return n(c);
      }
    }
  };
}
function re(e, t, r = 0) {
  if (r > t.maxDepth)
    throw new m(400, "json_threat", "JSON exceeds maximum depth");
  if (typeof e == "string" && e.length > t.maxStringLength)
    throw new m(
      400,
      "json_threat",
      "String value exceeds maximum length"
    );
  if (Array.isArray(e)) {
    if (e.length > t.maxArraySize)
      throw new m(400, "json_threat", "Array exceeds maximum size");
    for (const s of e)
      re(s, t, r + 1);
  } else if (e !== null && typeof e == "object") {
    const s = Object.keys(e);
    if (s.length > t.maxKeys)
      throw new m(
        400,
        "json_threat",
        "Object exceeds maximum key count"
      );
    for (const a of s) {
      if (a.length > t.maxStringLength)
        throw new m(
          400,
          "json_threat",
          "String value exceeds maximum length"
        );
      re(
        e[a],
        t,
        r + 1
      );
    }
  }
}
var Ws = S({
  name: "json-threat-protection",
  priority: v.EARLY,
  phases: ["request-body"],
  defaults: {
    maxDepth: 20,
    maxKeys: 100,
    maxStringLength: 1e4,
    maxArraySize: 100,
    maxBodySize: 1048576,
    contentTypes: ["application/json"]
  },
  handler: async (e, t, { config: r, debug: s }) => {
    const a = e.req.header("content-type") ?? "";
    if (!r.contentTypes.some(
      (u) => a.includes(u)
    )) {
      s("skipping — content type %s not inspected", a), await t();
      return;
    }
    const o = e.req.header("content-length");
    if (o !== void 0) {
      const u = Number.parseInt(o, 10);
      if (!Number.isNaN(u) && u > r.maxBodySize)
        throw s("body size %d exceeds max %d", u, r.maxBodySize), new m(
          413,
          "body_too_large",
          "Request body exceeds maximum size"
        );
    }
    const c = await e.req.raw.clone().text();
    if (!c) {
      s("empty body — passing through"), await t();
      return;
    }
    let l;
    try {
      l = JSON.parse(c);
    } catch {
      throw s("invalid JSON"), new m(
        400,
        "invalid_json",
        "Invalid JSON in request body"
      );
    }
    re(l, {
      maxDepth: r.maxDepth,
      maxKeys: r.maxKeys,
      maxStringLength: r.maxStringLength,
      maxArraySize: r.maxArraySize
    }), s("JSON structure validated"), await t();
  },
  evaluate: {
    onRequest: async (e, { config: t, debug: r }) => {
      const s = e.headers.get("content-type") ?? "";
      if (!t.contentTypes.some(
        (i) => s.includes(i)
      ))
        return r("skipping — content type %s not inspected", s), { action: "continue" };
      const n = e.headers.get("content-length");
      if (n) {
        const i = Number.parseInt(n, 10);
        if (!Number.isNaN(i) && i > t.maxBodySize)
          return r("body size %d exceeds max %d", i, t.maxBodySize), {
            action: "reject",
            status: 413,
            code: "body_too_large",
            message: "Request body exceeds maximum size"
          };
      }
      let o;
      try {
        if (!e.body)
          return r("empty body — passing through"), { action: "continue" };
        const i = typeof e.body == "string" ? e.body : new TextDecoder().decode(e.body);
        o = JSON.parse(i);
      } catch {
        return r("invalid JSON"), {
          action: "reject",
          status: 400,
          code: "invalid_json",
          message: "Invalid JSON in request body"
        };
      }
      try {
        re(o, {
          maxDepth: t.maxDepth,
          maxKeys: t.maxKeys,
          maxStringLength: t.maxStringLength,
          maxArraySize: t.maxArraySize
        });
      } catch (i) {
        if (i instanceof m)
          return {
            action: "reject",
            status: i.statusCode,
            code: i.code,
            message: i.message
          };
        throw i;
      }
      return r("JSON structure validated"), { action: "continue" };
    }
  }
}), Fe = /* @__PURE__ */ new WeakMap();
function Xr(e, t) {
  let r = Fe.get(e);
  if (!r) {
    const s = t.replace(/g/g, "");
    s !== t && console.warn(
      "[stoma:regex-threat-protection] Stripped 'g' flag — not meaningful with .test()"
    ), r = e.map((a) => ({
      regex: new RegExp(a.regex, s),
      targets: a.targets,
      message: a.message ?? "Request blocked by threat protection"
    })), Fe.set(e, r);
  }
  return r;
}
var Vs = S({
  name: "regex-threat-protection",
  priority: v.EARLY,
  defaults: {
    patterns: [],
    flags: "i",
    contentTypes: ["application/json", "text/plain"],
    maxBodyScanLength: 65536
  },
  handler: async (e, t, { config: r, debug: s }) => {
    const a = Xr(r.patterns, r.flags ?? "i");
    if (a.length === 0) {
      s("no patterns configured — passing through"), await t();
      return;
    }
    const n = a.some((i) => i.targets.includes("body"));
    let o = null;
    if (n) {
      const i = e.req.header("content-type") ?? "";
      if (r.contentTypes.some(
        (l) => i.includes(l)
      )) {
        const u = e.req.raw.clone().body?.getReader();
        if (u) {
          let d = "";
          const h = r.maxBodyScanLength;
          let p = !1;
          const y = new TextDecoder();
          for (; !p && d.length < h; ) {
            const f = await u.read();
            f.done ? p = !0 : d += y.decode(f.value, { stream: !0 });
          }
          u.cancel(), d.length > h && (d = d.slice(0, h)), o = d || null;
        }
      }
    }
    for (const i of a) {
      if (i.targets.includes("path") && i.regex.test(e.req.path))
        throw s("path matched pattern: %s", i.regex.source), new m(400, "threat_detected", i.message);
      if (i.targets.includes("query")) {
        const c = new URL(e.req.url), l = decodeURIComponent(c.search.slice(1));
        if (l && i.regex.test(l))
          throw s("query matched pattern: %s", i.regex.source), new m(400, "threat_detected", i.message);
      }
      if (i.targets.includes("headers")) {
        for (const [, c] of e.req.raw.headers.entries())
          if (i.regex.test(c))
            throw s("header matched pattern: %s", i.regex.source), new m(400, "threat_detected", i.message);
      }
      if (i.targets.includes("body") && o && i.regex.test(o))
        throw s("body matched pattern: %s", i.regex.source), new m(400, "threat_detected", i.message);
    }
    s("all patterns passed"), await t();
  }
}), Ys = S({
  name: "request-limit",
  priority: v.EARLY,
  phases: ["request-headers"],
  defaults: {
    message: "Request body too large"
  },
  handler: async (e, t, { config: r }) => {
    const s = e.req.header("content-length");
    if (s !== void 0) {
      const a = Number.parseInt(s, 10);
      if (!Number.isNaN(a) && a > r.maxBytes)
        throw new m(413, "request_too_large", r.message);
    }
    await t();
  },
  evaluate: {
    onRequest: async (e, { config: t }) => {
      const r = e.headers.get("content-length");
      if (r) {
        const s = Number.parseInt(r, 10);
        if (!Number.isNaN(s) && s > t.maxBytes)
          return {
            action: "reject",
            status: 413,
            code: "request_too_large",
            message: t.message
          };
      }
      return { action: "continue" };
    }
  }
});
function Qr(e, t) {
  const r = t.split(".");
  let s = e;
  for (let a = 0; a < r.length - 1; a++) {
    if (s == null || typeof s != "object") return;
    s = s[r[a]];
  }
  s != null && typeof s == "object" && delete s[r[r.length - 1]];
}
function Zr(e, t) {
  const r = {};
  for (const s of t) {
    const a = s.split(".");
    let n = e, o = r;
    for (let i = 0; i < a.length && !(n == null || typeof n != "object"); i++)
      i === a.length - 1 ? a[i] in n && (o[a[i]] = n[a[i]]) : (a[i] in o || (o[a[i]] = {}), o = o[a[i]], n = n[a[i]]);
  }
  return r;
}
function G(e, t, r) {
  if (t === "allow")
    return Zr(e, r);
  const s = structuredClone(e);
  for (const a of r)
    Qr(s, a);
  return s;
}
var Gs = S({
  name: "resource-filter",
  priority: v.RESPONSE_TRANSFORM,
  phases: ["response-body"],
  defaults: {
    contentTypes: ["application/json"],
    applyToArrayItems: !0
  },
  handler: async (e, t, { config: r, debug: s }) => {
    if (await t(), r.fields.length === 0) {
      s("no fields configured — passing through");
      return;
    }
    const a = e.res.headers.get("content-type") ?? "";
    if (!r.contentTypes.some(
      (c) => a.includes(c)
    )) {
      s(
        "skipping — response content type %s not in %o",
        a,
        r.contentTypes
      );
      return;
    }
    let o;
    try {
      const c = await e.res.text();
      o = JSON.parse(c);
    } catch {
      s("response body is not valid JSON — passing through");
      return;
    }
    let i;
    Array.isArray(o) ? r.applyToArrayItems ? i = o.map(
      (c) => c != null && typeof c == "object" ? G(
        c,
        r.mode,
        r.fields
      ) : c
    ) : i = o : o != null && typeof o == "object" ? i = G(
      o,
      r.mode,
      r.fields
    ) : i = o, s(
      "filtered response with mode=%s fields=%o",
      r.mode,
      r.fields
    ), e.res = new Response(JSON.stringify(i), {
      status: e.res.status,
      headers: e.res.headers
    });
  },
  evaluate: {
    onResponse: async (e, { config: t, debug: r }) => {
      if (t.fields.length === 0)
        return r("no fields configured — passing through"), { action: "continue" };
      const s = e.headers.get("content-type") ?? "";
      if (!t.contentTypes.some(
        (i) => s.includes(i)
      ))
        return r(
          "skipping — response content type %s not in %o",
          s,
          t.contentTypes
        ), { action: "continue" };
      let n;
      try {
        if (!e.body)
          return { action: "continue" };
        const i = typeof e.body == "string" ? e.body : new TextDecoder().decode(e.body);
        n = JSON.parse(i);
      } catch {
        return r("response body is not valid JSON — passing through"), { action: "continue" };
      }
      let o;
      return Array.isArray(n) ? t.applyToArrayItems ? o = n.map(
        (i) => i != null && typeof i == "object" ? G(
          i,
          t.mode,
          t.fields
        ) : i
      ) : o = n : n != null && typeof n == "object" ? o = G(
        n,
        t.mode,
        t.fields
      ) : o = n, r(
        "filtered response with mode=%s fields=%o",
        t.mode,
        t.fields
      ), {
        action: "continue",
        mutations: [
          {
            type: "body",
            op: "replace",
            content: JSON.stringify(o)
          }
        ]
      };
    }
  }
}), Xs = S({
  name: "ssl-enforce",
  priority: v.EARLY,
  httpOnly: !0,
  defaults: {
    redirect: !0,
    hstsMaxAge: 31536e3,
    includeSubDomains: !1,
    preload: !1
  },
  handler: async (e, t, { config: r }) => {
    if (!((e.req.header("x-forwarded-proto") ?? new URL(e.req.url).protocol.replace(":", "")) === "https")) {
      if (r.redirect) {
        const o = new URL(e.req.url);
        o.protocol = "https:", e.res = new Response(null, {
          status: 301,
          headers: { Location: o.toString() }
        });
        return;
      }
      throw new m(403, "ssl_required", "HTTPS is required");
    }
    await t();
    let n = `max-age=${r.hstsMaxAge}`;
    r.includeSubDomains && (n += "; includeSubDomains"), r.preload && (n += "; preload"), e.res.headers.set("Strict-Transport-Security", n);
  }
}), es = /* @__PURE__ */ new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]), Qs = S({
  name: "traffic-shadow",
  priority: v.RESPONSE_TRANSFORM,
  httpOnly: !0,
  defaults: {
    target: "",
    percentage: 100,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    mirrorBody: !0,
    timeout: 5e3
  },
  handler: async (e, t, { config: r, debug: s }) => {
    let a = null;
    if (r.mirrorBody)
      try {
        a = await e.req.raw.clone().arrayBuffer(), a.byteLength === 0 && (a = null);
      } catch {
        a = null;
      }
    await t();
    const n = e.req.method.toUpperCase();
    if (!new Set(
      (r.methods ?? []).map((w) => w.toUpperCase())
    ).has(n)) {
      s("method %s not in shadow methods — skipping", n);
      return;
    }
    const i = Math.random() * 100;
    if (i >= (r.percentage ?? 100)) {
      s("rolled %.1f >= %d%% — skipping shadow", i, r.percentage);
      return;
    }
    const c = new URL(e.req.url), u = `${r.target.replace(/\/$/, "")}${c.pathname}${c.search}`, d = new Headers();
    for (const [w, g] of e.req.raw.headers.entries())
      es.has(w.toLowerCase()) || d.set(w, g);
    s("shadowing %s %s → %s", n, c.pathname, u);
    const h = new AbortController(), p = setTimeout(
      () => h.abort(),
      r.timeout ?? 5e3
    ), y = fetch(u, {
      method: n,
      headers: d,
      body: r.mirrorBody && a ? a : void 0,
      signal: h.signal,
      redirect: "manual"
    }).catch((w) => {
      s("shadow request failed: %s", String(w)), r.onError?.(w);
    }).finally(() => {
      clearTimeout(p);
    }), f = B(e);
    f?.adapter?.waitUntil && f.adapter.waitUntil(y);
  }
}), Zs = S({
  name: "latency-injection",
  priority: v.EARLY,
  httpOnly: !0,
  defaults: { jitter: 0, probability: 1 },
  handler: async (e, t, { config: r, debug: s }) => {
    if (Math.random() >= r.probability) {
      s("skipping injection (probability miss)"), await t();
      return;
    }
    let a = r.delayMs;
    r.jitter > 0 && (a += (Math.random() * 2 - 1) * r.jitter * r.delayMs), a = Math.max(0, a), s(`injecting ${a.toFixed(0)}ms latency`), await new Promise((n) => setTimeout(n, a)), await t();
  }
}), ts = ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"];
function rs(e) {
  return new Promise((t) => setTimeout(t, e));
}
function ss(e, t, r, s) {
  const a = Math.random() * r;
  return t === "fixed" ? r + a : Math.min(r * 2 ** e + a, s);
}
function ea(e) {
  const t = J(
    {
      maxRetries: 3,
      retryOn: [502, 503, 504],
      backoff: "exponential",
      baseDelayMs: 200,
      maxDelayMs: 5e3,
      retryMethods: ts,
      retryCountHeader: "x-retry-count"
    },
    e
  ), r = async (s, a) => {
    const n = K(s, "retry"), o = s.req.method.toUpperCase();
    if (!t.retryMethods.includes(o)) {
      await a();
      return;
    }
    await a();
    const i = s.get("_proxyRequest");
    if (!i)
      return;
    let c = 0;
    for (let l = 0; l < t.maxRetries && t.retryOn.includes(s.res.status); l++) {
      const u = ss(
        l,
        t.backoff,
        t.baseDelayMs,
        t.maxDelayMs
      );
      n(
        `attempt ${l + 1}/${t.maxRetries} failed (status=${s.res.status}), retrying in ${Math.round(u)}ms`
      ), await s.res.body?.cancel(), await rs(u);
      const d = await fetch(i.clone());
      c = l + 1, s.res = new Response(d.body, {
        status: d.status,
        statusText: d.statusText,
        headers: new Headers(d.headers)
      });
    }
    c > 0 && s.res.headers.set(t.retryCountHeader, String(c));
  };
  return {
    name: "retry",
    priority: v.RETRY,
    handler: k(e?.skip, r),
    httpOnly: !0
  };
}
var ta = S({
  name: "timeout",
  priority: v.TIMEOUT,
  httpOnly: !0,
  defaults: { timeoutMs: 3e4, message: "Gateway timeout", statusCode: 504 },
  handler: async (e, t, { config: r, trace: s }) => {
    const a = new AbortController(), n = setTimeout(() => a.abort(), r.timeoutMs);
    e.set("_timeoutSignal", a.signal);
    try {
      const o = Date.now();
      await Promise.race([
        t(),
        new Promise((i, c) => {
          a.signal.addEventListener(
            "abort",
            () => c(
              new m(
                r.statusCode,
                "gateway_timeout",
                r.message
              )
            )
          );
        })
      ]), s("passed", {
        budgetMs: r.timeoutMs,
        elapsed: Date.now() - o
      });
    } catch (o) {
      throw o instanceof m && o.code === "gateway_timeout" && s("fired", { budgetMs: r.timeoutMs }), o;
    } finally {
      clearTimeout(n);
    }
  }
}), ra = S({
  name: "assign-attributes",
  priority: v.REQUEST_TRANSFORM,
  phases: ["request-headers"],
  handler: async (e, t, { config: r, debug: s }) => {
    for (const [a, n] of Object.entries(r.attributes))
      if (typeof n == "function") {
        const o = await n(e);
        e.set(a, o), s("set %s = %s (dynamic)", a, o);
      } else
        e.set(a, n), s("set %s = %s (static)", a, n);
    await t();
  },
  evaluate: {
    onRequest: async (e, { config: t, debug: r }) => {
      const s = [];
      for (const [a, n] of Object.entries(t.attributes)) {
        const o = typeof n == "function" ? n({}) : n;
        r("set %s = %s", a, o), s.push({
          type: "attribute",
          key: a,
          value: o
        });
      }
      return { action: "continue", mutations: s };
    }
  }
});
async function We(e, t) {
  const r = {};
  for (const [s, a] of Object.entries(t))
    typeof a == "function" ? r[s] = await a(e) : r[s] = a;
  return r;
}
function X(e, t) {
  return e ? t.some((r) => e.includes(r)) : !1;
}
var sa = S({
  name: "assign-content",
  priority: v.REQUEST_TRANSFORM,
  defaults: {
    contentTypes: ["application/json"]
  },
  handler: async (e, t, { config: r, debug: s }) => {
    if (r.request) {
      const a = e.req.header("content-type");
      if (X(a, r.contentTypes)) {
        let n = {};
        try {
          const l = await e.req.raw.clone().text();
          l && (n = JSON.parse(l));
        } catch {
        }
        const o = await We(e, r.request);
        Object.assign(n, o), s(
          "assigned %d fields to request body",
          Object.keys(o).length
        );
        const i = new Request(e.req.url, {
          method: e.req.method,
          headers: e.req.raw.headers,
          body: JSON.stringify(n),
          // @ts-expect-error -- duplex required for streams in some runtimes
          duplex: "half"
        });
        Object.defineProperty(e.req, "raw", {
          value: i,
          configurable: !0
        });
      } else
        s(
          "request content-type %s not in allowed types — skipping request modification",
          a
        );
    }
    if (await t(), r.response) {
      const a = e.res.headers.get("content-type");
      if (X(a ?? void 0, r.contentTypes)) {
        let n = {};
        try {
          const c = await e.res.text();
          c && (n = JSON.parse(c));
        } catch {
        }
        const o = await We(e, r.response);
        Object.assign(n, o), s(
          "assigned %d fields to response body",
          Object.keys(o).length
        );
        const i = new Response(JSON.stringify(n), {
          status: e.res.status,
          headers: e.res.headers
        });
        e.res = i;
      } else
        s(
          "response content-type %s not in allowed types — skipping response modification",
          a
        );
    }
  },
  evaluate: {
    onRequest: async (e, { config: t, debug: r }) => {
      if (!t.request)
        return { action: "continue" };
      const s = e.headers.get("content-type") ?? "";
      if (!X(s, t.contentTypes))
        return r(
          "request content-type %s not in allowed types — skipping request modification",
          s
        ), { action: "continue" };
      let a = {};
      try {
        if (e.body) {
          const n = typeof e.body == "string" ? e.body : new TextDecoder().decode(e.body);
          n && (a = JSON.parse(n));
        }
      } catch {
      }
      for (const [n, o] of Object.entries(t.request))
        typeof o == "function" ? a[n] = o({}) : a[n] = o;
      return r(
        "assigned %d fields to request body",
        Object.keys(t.request).length
      ), {
        action: "continue",
        mutations: [
          {
            type: "body",
            op: "replace",
            content: JSON.stringify(a)
          }
        ]
      };
    },
    onResponse: async (e, { config: t, debug: r }) => {
      if (!t.response)
        return { action: "continue" };
      const s = e.headers.get("content-type") ?? "";
      if (!X(s, t.contentTypes))
        return r(
          "response content-type %s not in allowed types — skipping response modification",
          s
        ), { action: "continue" };
      let a = {};
      try {
        if (e.body) {
          const n = typeof e.body == "string" ? e.body : new TextDecoder().decode(e.body);
          n && (a = JSON.parse(n));
        }
      } catch {
      }
      for (const [n, o] of Object.entries(t.response))
        typeof o == "function" ? a[n] = o({}) : a[n] = o;
      return r(
        "assigned %d fields to response body",
        Object.keys(t.response).length
      ), {
        action: "continue",
        mutations: [
          {
            type: "body",
            op: "replace",
            content: JSON.stringify(a)
          }
        ]
      };
    }
  }
});
function aa(e) {
  const t = e?.origins ?? "*", r = Mr({
    origin: typeof t == "function" ? (s) => t(s) ? s : "" : t,
    allowMethods: e?.methods,
    allowHeaders: e?.allowHeaders,
    exposeHeaders: e?.exposeHeaders,
    maxAge: e?.maxAge,
    credentials: e?.credentials
  });
  return {
    name: "cors",
    priority: v.EARLY,
    handler: k(e?.skip, r),
    httpOnly: !0
  };
}
var na = S({
  name: "json-validation",
  priority: v.AUTH,
  phases: ["request-body"],
  defaults: {
    contentTypes: ["application/json"],
    rejectStatus: 422,
    errorDetail: !0
  },
  handler: async (e, t, { config: r, debug: s }) => {
    const a = e.req.header("content-type") ?? "";
    if (!r.contentTypes.some(
      (c) => a.includes(c)
    )) {
      s(
        "skipping — content type %s not in %o",
        a,
        r.contentTypes
      ), await t();
      return;
    }
    let o;
    try {
      const l = await e.req.raw.clone().text();
      if (!l)
        throw s("empty body with JSON content type"), new m(
          r.rejectStatus,
          "validation_failed",
          "Request body is empty"
        );
      o = JSON.parse(l);
    } catch (c) {
      throw c instanceof m ? c : (s("body parse failed"), new m(
        r.rejectStatus,
        "validation_failed",
        "Request body is not valid JSON"
      ));
    }
    if (!r.validate) {
      s("no validator configured — JSON parsed successfully"), await t();
      return;
    }
    const i = await r.validate(o);
    if (!i.valid) {
      const c = r.errorDetail && i.errors && i.errors.length > 0 ? `Validation failed: ${i.errors.join("; ")}` : "Validation failed";
      throw s("validation failed: %s", c), new m(
        r.rejectStatus,
        "validation_failed",
        c
      );
    }
    s("validation passed"), await t();
  },
  evaluate: {
    onRequest: async (e, { config: t, debug: r }) => {
      const s = e.headers.get("content-type") ?? "";
      if (!t.contentTypes.some(
        (i) => s.includes(i)
      ))
        return r(
          "skipping — content type %s not in %o",
          s,
          t.contentTypes
        ), { action: "continue" };
      let n;
      try {
        if (!e.body)
          return r("empty body with JSON content type"), {
            action: "reject",
            status: t.rejectStatus,
            code: "validation_failed",
            message: "Request body is empty"
          };
        const i = typeof e.body == "string" ? e.body : new TextDecoder().decode(e.body);
        n = JSON.parse(i);
      } catch {
        return r("body parse failed"), {
          action: "reject",
          status: t.rejectStatus,
          code: "validation_failed",
          message: "Request body is not valid JSON"
        };
      }
      if (!t.validate)
        return r("no validator configured — JSON parsed successfully"), { action: "continue" };
      const o = await t.validate(n);
      if (!o.valid) {
        const i = t.errorDetail && o.errors && o.errors.length > 0 ? `Validation failed: ${o.errors.join("; ")}` : "Validation failed";
        return r("validation failed: %s", i), {
          action: "reject",
          status: t.rejectStatus,
          code: "validation_failed",
          message: i
        };
      }
      return r("validation passed"), { action: "continue" };
    }
  }
}), oa = S({
  name: "override-method",
  priority: v.EARLY,
  phases: ["request-headers"],
  defaults: {
    header: "X-HTTP-Method-Override",
    allowedMethods: ["GET", "PUT", "PATCH", "DELETE"]
  },
  handler: async (e, t, { config: r, debug: s }) => {
    const a = e.req.header(r.header);
    if (!a) {
      await t();
      return;
    }
    if (e.req.method !== "POST") {
      s(`ignoring override on ${e.req.method} request`), await t();
      return;
    }
    const n = a.toUpperCase();
    if (!new Set(
      (r.allowedMethods ?? []).map((c) => c.toUpperCase())
    ).has(n))
      throw new m(
        400,
        "invalid_method_override",
        `Method override not allowed: ${n}`
      );
    s(`overriding POST → ${n}`);
    const i = new Request(e.req.url, {
      method: n,
      headers: e.req.raw.headers,
      body: e.req.raw.body,
      // @ts-expect-error -- duplex is required for streams but not in all type definitions
      duplex: "half"
    });
    Object.defineProperty(e.req, "raw", { value: i, configurable: !0 }), await t();
  }
});
function Ve(e) {
  return typeof e == "boolean" ? { valid: e } : e;
}
var ia = S({
  name: "request-validation",
  priority: v.AUTH,
  phases: ["request-body"],
  defaults: {
    contentTypes: ["application/json"],
    errorMessage: "Request validation failed"
  },
  handler: async (e, t, { config: r, debug: s }) => {
    const a = e.req.header("content-type") ?? "";
    if (!r.contentTypes.some(
      (u) => a.includes(u)
    )) {
      s(
        "skipping — content type %s not in %o",
        a,
        r.contentTypes
      ), await t();
      return;
    }
    let o;
    try {
      const d = await e.req.raw.clone().text();
      o = JSON.parse(d);
    } catch {
      throw s("body parse failed"), new m(
        400,
        "validation_failed",
        `${r.errorMessage}: invalid JSON`
      );
    }
    const i = r.validateAsync ?? r.validate;
    if (!i) {
      s("no validator configured — passing through"), await t();
      return;
    }
    const c = await i(o), l = Ve(c);
    if (!l.valid) {
      const u = l.errors && l.errors.length > 0 ? `${r.errorMessage}: ${l.errors.join("; ")}` : r.errorMessage;
      throw s("validation failed: %s", u), new m(400, "validation_failed", u);
    }
    s("validation passed"), await t();
  },
  evaluate: {
    onRequest: async (e, { config: t, debug: r }) => {
      const s = e.headers.get("content-type") ?? "";
      if (!t.contentTypes.some(
        (l) => s.includes(l)
      ))
        return r(
          "skipping — content type %s not in %o",
          s,
          t.contentTypes
        ), { action: "continue" };
      let n;
      try {
        if (!e.body)
          return r("body parse failed"), {
            action: "reject",
            status: 400,
            code: "validation_failed",
            message: `${t.errorMessage}: invalid JSON`
          };
        const l = typeof e.body == "string" ? e.body : new TextDecoder().decode(e.body);
        n = JSON.parse(l);
      } catch {
        return r("body parse failed"), {
          action: "reject",
          status: 400,
          code: "validation_failed",
          message: `${t.errorMessage}: invalid JSON`
        };
      }
      const o = t.validateAsync ?? t.validate;
      if (!o)
        return r("no validator configured — passing through"), { action: "continue" };
      const i = await o(n), c = Ve(i);
      if (!c.valid) {
        const l = c.errors && c.errors.length > 0 ? `${t.errorMessage}: ${c.errors.join("; ")}` : t.errorMessage;
        return r("validation failed: %s", l), {
          action: "reject",
          status: 400,
          code: "validation_failed",
          message: l
        };
      }
      return r("validation passed"), { action: "continue" };
    }
  }
}), ca = S({
  name: "request-transform",
  priority: v.REQUEST_TRANSFORM,
  phases: ["request-headers"],
  handler: async (e, t, { config: r }) => {
    const s = new Headers(e.req.raw.headers);
    if (r.renameHeaders)
      for (const [a, n] of Object.entries(r.renameHeaders)) {
        const o = s.get(a);
        o !== null && (s.set(n, o), s.delete(a));
      }
    if (r.setHeaders)
      for (const [a, n] of Object.entries(r.setHeaders))
        s.set(a, n);
    if (r.removeHeaders)
      for (const a of r.removeHeaders)
        s.delete(a);
    e.req.raw = new Request(e.req.raw, { headers: s }), await t();
  },
  evaluate: {
    onRequest: async (e, { config: t }) => {
      const r = [];
      if (t.setHeaders)
        for (const [s, a] of Object.entries(t.setHeaders))
          r.push({
            type: "header",
            op: "set",
            name: s,
            value: a
          });
      if (t.removeHeaders)
        for (const s of t.removeHeaders)
          r.push({
            type: "header",
            op: "remove",
            name: s
          });
      return r.length > 0 ? { action: "continue", mutations: r } : { action: "continue" };
    }
  }
}), la = S({
  name: "response-transform",
  priority: v.RESPONSE_TRANSFORM,
  phases: ["response-headers"],
  handler: async (e, t, { config: r }) => {
    if (await t(), r.renameHeaders)
      for (const [s, a] of Object.entries(r.renameHeaders)) {
        const n = e.res.headers.get(s);
        n !== null && (e.res.headers.set(a, n), e.res.headers.delete(s));
      }
    if (r.setHeaders)
      for (const [s, a] of Object.entries(r.setHeaders))
        e.res.headers.set(s, a);
    if (r.removeHeaders)
      for (const s of r.removeHeaders)
        e.res.headers.delete(s);
  },
  evaluate: {
    onResponse: async (e, { config: t }) => {
      const r = [];
      if (t.setHeaders)
        for (const [s, a] of Object.entries(t.setHeaders))
          r.push({
            type: "header",
            op: "set",
            name: s,
            value: a
          });
      if (t.removeHeaders)
        for (const s of t.removeHeaders)
          r.push({
            type: "header",
            op: "remove",
            name: s
          });
      return r.length > 0 ? { action: "continue", mutations: r } : { action: "continue" };
    }
  }
});
function ua(e) {
  const t = e?.path ?? "/health", r = e?.upstreamProbes ?? [], s = e?.includeUpstreamStatus ?? !1, a = e?.probeTimeoutMs ?? 5e3, n = e?.probeMethod ?? "HEAD", o = e?.unhealthyStatusCode ?? 503;
  return {
    path: t,
    methods: ["GET"],
    pipeline: {
      upstream: {
        type: "handler",
        handler: async (i) => {
          if (r.length === 0)
            return i.json({
              status: "healthy",
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
          const c = await Promise.all(
            r.map(async (p) => {
              const y = Date.now();
              try {
                const f = await fetch(p, {
                  method: n,
                  signal: AbortSignal.timeout(a)
                });
                return {
                  url: p,
                  status: f.ok ? "healthy" : "unhealthy",
                  latencyMs: Date.now() - y
                };
              } catch {
                return {
                  url: p,
                  status: "unhealthy",
                  latencyMs: Date.now() - y
                };
              }
            })
          ), l = c.every((p) => p.status === "healthy"), u = c.every((p) => p.status === "unhealthy"), d = l ? "healthy" : u ? "unhealthy" : "degraded", h = {
            status: d,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
          return s && (h.upstreams = c), i.json(
            h,
            d === "unhealthy" ? o : 200
          );
        }
      }
    }
  };
}
var da = S({
  name: "assign-metrics",
  priority: v.OBSERVABILITY,
  httpOnly: !0,
  handler: async (e, t, { config: r, debug: s }) => {
    const a = {};
    for (const [n, o] of Object.entries(r.tags))
      typeof o == "function" ? (a[n] = await E(
        () => Promise.resolve(o(e)),
        "unknown",
        s,
        `tag resolver(${n})`
      ), s("tag %s = %s (dynamic)", n, a[n])) : (a[n] = o, s("tag %s = %s (static)", n, o));
    e.set("_metricsTags", a), await t();
  }
}), ha = S({
  name: "metrics-reporter",
  priority: v.METRICS,
  httpOnly: !0,
  handler: async (e, t, { config: r, debug: s, gateway: a }) => {
    const n = Date.now();
    await t(), await E(
      async () => {
        const o = e.get("_metricsTags"), i = {};
        if (o)
          for (const [h, p] of Object.entries(o))
            typeof p == "string" && (i[h] = p);
        const c = new URL(e.req.url), l = {
          ...i,
          method: e.req.method,
          path: a?.routePath ?? c.pathname,
          status: String(e.res.status),
          gateway: a?.gatewayName ?? "unknown"
        };
        r.collector.increment("gateway_requests_total", 1, l);
        const u = Date.now() - n;
        r.collector.histogram(
          "gateway_request_duration_ms",
          u,
          l
        ), e.res.status >= 400 && r.collector.increment("gateway_request_errors_total", 1, l);
        const d = e.get("_policyTimings");
        if (d)
          for (const h of d)
            r.collector.histogram(
              "gateway_policy_duration_ms",
              h.durationMs,
              {
                ...i,
                policy: h.name,
                gateway: a?.gatewayName ?? "unknown"
              }
            );
      },
      void 0,
      s,
      "collector"
    );
  }
});
function At(e, t) {
  if (!Et(e) && !Array.isArray(e))
    return e;
  const r = t.replacement ?? "[REDACTED]", s = structuredClone(e);
  for (const a of t.paths)
    Q(s, a.split("."), 0, r);
  return s;
}
function Q(e, t, r, s) {
  if (r >= t.length || e == null) return;
  const a = t[r], n = r === t.length - 1;
  if (Array.isArray(e)) {
    for (const o of e)
      Q(o, t, r, s);
    return;
  }
  if (Et(e))
    if (a === "*")
      for (const o of Object.keys(e))
        n ? e[o] = s : Q(
          e[o],
          t,
          r + 1,
          s
        );
    else {
      const o = e;
      if (!(a in o)) return;
      n ? o[a] = s : Q(o[a], t, r + 1, s);
    }
}
function Et(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
var as = 8192, pa = S({
  name: "request-log",
  priority: v.OBSERVABILITY,
  httpOnly: !0,
  handler: async (e, t, { config: r, debug: s, gateway: a }) => {
    const n = r.sink ?? is, o = r.maxBodyLength ?? as, i = Date.now();
    let c;
    r.logRequestBody && (c = await ns(
      e.req.raw,
      o,
      r.redactPaths
    )), await t();
    const l = new URL(e.req.url), u = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      requestId: a?.requestId ?? e.res.headers.get("x-request-id") ?? "unknown",
      method: e.req.method,
      path: l.pathname,
      statusCode: e.res.status,
      durationMs: Date.now() - i,
      clientIp: ee(e.req.raw.headers, {
        ipHeaders: r.ipHeaders
      }),
      userAgent: e.req.header("user-agent") ?? "unknown",
      gatewayName: a?.gatewayName ?? "unknown",
      routePath: a?.routePath ?? l.pathname,
      upstream: "unknown",
      // Enriched by proxy policy in future
      traceId: a?.traceId,
      spanId: a?.spanId
    };
    if (c !== void 0 && (u.requestBody = c), r.logResponseBody) {
      const d = await os(
        e,
        o,
        r.redactPaths
      );
      d !== void 0 && (u.responseBody = d);
    }
    if (r.extractFields)
      try {
        u.extra = r.extractFields(e);
      } catch {
      }
    await E(
      () => Promise.resolve(n(u)),
      void 0,
      s,
      "sink()"
    );
  }
});
async function ns(e, t, r) {
  try {
    const a = await e.clone().text();
    if (!a) return;
    const n = a.length > t ? `${a.slice(0, t)}...[truncated]` : a;
    if ((e.headers.get("content-type") ?? "").includes("application/json"))
      try {
        let i = JSON.parse(
          n.endsWith("...[truncated]") ? a.slice(0, t) : a
        );
        return r?.length && (i = At(i, { paths: r })), i;
      } catch {
        return n;
      }
    return n;
  } catch {
    return;
  }
}
async function os(e, t, r) {
  try {
    const a = await e.res.clone().text();
    if (!a) return;
    const n = a.length > t ? `${a.slice(0, t)}...[truncated]` : a;
    if ((e.res.headers.get("content-type") ?? "").includes("application/json"))
      try {
        let i = JSON.parse(
          n.endsWith("...[truncated]") ? a.slice(0, t) : a
        );
        return r?.length && (i = At(i, { paths: r })), i;
      } catch {
        return n;
      }
    return n;
  } catch {
    return;
  }
}
function is(e) {
  console.log(JSON.stringify(e));
}
function cs(e) {
  return e.replace(/[^a-zA-Z0-9_-]/g, "_");
}
function Ye(e, t, r, s) {
  const a = cs(e), n = t.toFixed(r), o = s?.(e);
  if (o) {
    const i = o.replace(/"/g, '\\"');
    return `${a};dur=${n};desc="${i}"`;
  }
  return `${a};dur=${n}`;
}
var ma = S({
  name: "server-timing",
  priority: v.METRICS,
  httpOnly: !0,
  defaults: {
    serverTimingHeader: !0,
    responseTimeHeader: !0,
    precision: 1,
    includeTotal: !0,
    visibility: "debug-only"
  },
  validate: (e) => {
    if (e.visibility === "conditional" && typeof e.visibilityFn != "function")
      throw new m(
        500,
        "config-error",
        'serverTiming: visibility "conditional" requires a visibilityFn'
      );
  },
  handler: async (e, t, { config: r, debug: s }) => {
    const a = Date.now();
    await t();
    let n;
    switch (r.visibility) {
      case "always":
        n = !0;
        break;
      case "conditional":
        n = await r.visibilityFn(e);
        break;
      default:
        n = St(e);
        break;
    }
    if (!n) {
      s("skipping — visibility check failed");
      return;
    }
    const o = Date.now() - a, i = r.precision, c = e.get("_policyTimings"), l = c ? mt(c) : void 0;
    if (r.serverTimingHeader) {
      const u = [];
      if (r.includeTotal && u.push(
        Ye("total", o, i, r.descriptionFn)
      ), l)
        for (const d of l)
          u.push(
            Ye(d.name, d.durationMs, i, r.descriptionFn)
          );
      u.length > 0 && (e.res.headers.set("server-timing", u.join(", ")), s("Server-Timing: %s", u.join(", ")));
    }
    if (r.responseTimeHeader) {
      const u = `${o.toFixed(i)}ms`;
      e.res.headers.set("x-response-time", u), s("X-Response-Time: %s", u);
    }
  }
});
function _t() {
  return {
    state: "closed",
    failureCount: 0,
    successCount: 0,
    lastFailureTime: 0,
    lastStateChange: Date.now()
  };
}
var qt = class {
  circuits = /* @__PURE__ */ new Map();
  getOrCreate(e) {
    let t = this.circuits.get(e);
    return t || (t = _t(), this.circuits.set(e, t)), t;
  }
  async getState(e) {
    return { ...this.getOrCreate(e) };
  }
  async recordSuccess(e) {
    const t = this.getOrCreate(e);
    return t.successCount++, { ...t };
  }
  async recordFailure(e) {
    const t = this.getOrCreate(e);
    return t.failureCount++, t.lastFailureTime = Date.now(), { ...t };
  }
  async transition(e, t) {
    const r = this.getOrCreate(e);
    return r.state = t, r.lastStateChange = Date.now(), t === "closed" && (r.failureCount = 0, r.successCount = 0), t === "half-open" && (r.successCount = 0), { ...r };
  }
  async reset(e) {
    this.circuits.delete(e);
  }
  /** Remove all circuits (for testing) */
  clear() {
    this.circuits.clear();
  }
  /** Release all state. */
  destroy() {
    this.circuits.clear();
  }
};
async function P(e, t, r, s, a, n) {
  await E(
    () => e.transition(t, s),
    void 0,
    n,
    "store.transition()"
  ), a && await E(
    () => Promise.resolve(a(t, r, s)),
    void 0,
    n,
    "onStateChange()"
  );
}
function fa(e) {
  const t = J(
    {
      failureThreshold: 5,
      resetTimeoutMs: 3e4,
      halfOpenMax: 1,
      failureOn: [500, 502, 503, 504],
      openStatusCode: 503
    },
    e
  );
  let r = e?.store;
  r || (r = new qt());
  const s = r, a = e?.onStateChange, n = /* @__PURE__ */ new Map(), o = async (i, c) => {
    const l = K(i, "circuit-breaker"), u = e?.key ? e.key(i) : new URL(i.req.url).pathname, d = await E(
      () => s.getState(u),
      _t(),
      l,
      "store.getState()"
    ), h = Date.now();
    if (q(i, "x-stoma-circuit-key", u), q(i, "x-stoma-circuit-state", d.state), q(i, "x-stoma-circuit-failures", d.failureCount), d.state === "open")
      if (h - d.lastStateChange >= t.resetTimeoutMs)
        l(`open -> half-open (key=${u})`), await P(
          s,
          u,
          "open",
          "half-open",
          a,
          l
        ), n.set(u, 0);
      else {
        const p = Math.ceil(
          (t.resetTimeoutMs - (h - d.lastStateChange)) / 1e3
        );
        throw new m(
          t.openStatusCode,
          "circuit_open",
          "Service temporarily unavailable",
          { "retry-after": String(p) }
        );
      }
    if (d.state === "half-open" || d.state === "open" && h - d.lastStateChange >= t.resetTimeoutMs) {
      const p = n.get(u) ?? 0;
      if (p >= t.halfOpenMax)
        throw new m(
          t.openStatusCode,
          "circuit_open",
          "Service temporarily unavailable",
          { "retry-after": String(Math.ceil(t.resetTimeoutMs / 1e3)) }
        );
      n.set(u, p + 1);
      try {
        await c(), t.failureOn.includes(i.res.status) ? (l(
          `half-open probe failed (key=${u}, status=${i.res.status}) -> open`
        ), await E(
          () => s.recordFailure(u),
          void 0,
          l,
          "store.recordFailure()"
        ), await P(
          s,
          u,
          "half-open",
          "open",
          a,
          l
        )) : (l(`half-open probe succeeded (key=${u}) -> closed`), await E(
          () => s.recordSuccess(u),
          void 0,
          l,
          "store.recordSuccess()"
        ), await P(
          s,
          u,
          "half-open",
          "closed",
          a,
          l
        ), n.delete(u));
      } catch (y) {
        throw l(`half-open probe threw (key=${u}) -> open`), await E(
          () => s.recordFailure(u),
          void 0,
          l,
          "store.recordFailure()"
        ), await P(
          s,
          u,
          "half-open",
          "open",
          a,
          l
        ), y;
      } finally {
        const y = n.get(u) ?? 1;
        y <= 1 ? n.delete(u) : n.set(u, y - 1);
      }
      return;
    }
    try {
      await c();
    } catch (p) {
      const y = await E(
        () => s.recordFailure(u),
        null,
        l,
        "store.recordFailure()"
      );
      throw y && y.failureCount >= t.failureThreshold && (l(
        `closed -> open (key=${u}, failures=${y.failureCount}/${t.failureThreshold})`
      ), await P(
        s,
        u,
        "closed",
        "open",
        a,
        l
      )), p;
    }
    if (t.failureOn.includes(i.res.status)) {
      const p = await E(
        () => s.recordFailure(u),
        null,
        l,
        "store.recordFailure()"
      );
      p && p.failureCount >= t.failureThreshold && (l(
        `closed -> open (key=${u}, failures=${p.failureCount}/${t.failureThreshold})`
      ), await P(
        s,
        u,
        "closed",
        "open",
        a,
        l
      ));
    } else
      await E(
        () => s.recordSuccess(u),
        void 0,
        l,
        "store.recordSuccess()"
      );
  };
  return {
    name: "circuit-breaker",
    priority: v.CIRCUIT_BREAKER,
    handler: k(e?.skip, o),
    httpOnly: !0
  };
}
function pe(e) {
  return !e || Object.keys(e).length === 0 ? "" : Object.entries(e).sort(([t], [r]) => t.localeCompare(r)).map(([t, r]) => `${t}=${r}`).join(",");
}
var ya = class {
  counters = /* @__PURE__ */ new Map();
  histograms = /* @__PURE__ */ new Map();
  gauges = /* @__PURE__ */ new Map();
  increment(e, t = 1, r) {
    const s = pe(r);
    let a = this.counters.get(e);
    a || (a = /* @__PURE__ */ new Map(), this.counters.set(e, a));
    const n = a.get(s);
    n ? n.value += t : a.set(s, { value: t, tags: r });
  }
  histogram(e, t, r) {
    const s = pe(r);
    let a = this.histograms.get(e);
    a || (a = /* @__PURE__ */ new Map(), this.histograms.set(e, a));
    const n = a.get(s);
    n ? n.values.push(t) : a.set(s, { values: [t], tags: r });
  }
  gauge(e, t, r) {
    const s = pe(r);
    let a = this.gauges.get(e);
    a || (a = /* @__PURE__ */ new Map(), this.gauges.set(e, a)), a.set(s, { value: t, tags: r });
  }
  snapshot() {
    const e = {
      counters: {},
      histograms: {},
      gauges: {}
    };
    for (const [t, r] of this.counters)
      e.counters[t] = Array.from(r.values());
    for (const [t, r] of this.histograms)
      e.histograms[t] = Array.from(r.values());
    for (const [t, r] of this.gauges)
      e.gauges[t] = Array.from(r.values());
    return e;
  }
  reset() {
    this.counters.clear(), this.histograms.clear(), this.gauges.clear();
  }
};
function ls(e) {
  const t = [];
  for (const [r, s] of Object.entries(e.counters)) {
    t.push(`# TYPE ${r} counter`);
    for (const a of s)
      t.push(`${r}${me(a.tags)} ${a.value}`);
  }
  for (const [r, s] of Object.entries(e.histograms)) {
    t.push(`# TYPE ${r} histogram`);
    for (const a of s) {
      const n = me(a.tags), o = a.values.reduce((c, l) => c + l, 0), i = a.values.length;
      t.push(`${r}_sum${n} ${o}`), t.push(`${r}_count${n} ${i}`);
    }
  }
  for (const [r, s] of Object.entries(e.gauges)) {
    t.push(`# TYPE ${r} gauge`);
    for (const a of s)
      t.push(`${r}${me(a.tags)} ${a.value}`);
  }
  return t.join(`
`);
}
function us(e) {
  return e.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}
function me(e) {
  return !e || Object.keys(e).length === 0 ? "" : `{${Object.entries(e).sort(([r], [s]) => r.localeCompare(s)).map(([r, s]) => `${r}="${us(s)}"`).join(",")}}`;
}
var ds = ["secret", "key", "token", "password", "credential"];
function hs(e, t, r) {
  const s = `/${t.prefix ?? "___gateway"}`, a = async (n, o) => {
    if (t.auth && !await t.auth(n))
      return n.json(
        { error: "unauthorized", message: "Admin access denied" },
        403
      );
    await o();
  };
  e.get(`${s}/routes`, a, (n) => n.json({
    gateway: r.gatewayName,
    routes: r.routes
  })), e.get(`${s}/policies`, a, (n) => n.json({
    gateway: r.gatewayName,
    policies: r.policies
  })), e.get(`${s}/config`, a, (n) => n.json(
    _e({
      gateway: r.gatewayName,
      routes: r.routes,
      policies: r.policies
    })
  )), e.get(`${s}/metrics`, a, (n) => {
    if (!t.metrics)
      return n.json(
        {
          error: "not_configured",
          message: "No metrics collector configured. Pass a MetricsCollector to admin.metrics."
        },
        404
      );
    const o = t.metrics.snapshot(), i = ls(o);
    return n.text(i, 200, {
      "content-type": "text/plain; version=0.0.4; charset=utf-8"
    });
  }), e.get(`${s}/health`, a, (n) => n.json({
    status: "healthy",
    gateway: r.gatewayName,
    routeCount: r.routes.length,
    policyCount: r.policies.length,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }));
}
function _e(e) {
  if (typeof e != "object" || e === null) return e;
  if (Array.isArray(e)) return e.map(_e);
  const t = {};
  for (const [r, s] of Object.entries(e))
    ds.some((a) => r.toLowerCase().includes(a)) ? t[r] = "[REDACTED]" : typeof s == "function" ? t[r] = "[Function]" : typeof s == "object" && s !== null ? t[r] = _e(s) : t[r] = s;
  return t;
}
function wa(e) {
  if (!e.routes || e.routes.length === 0)
    throw new m(
      500,
      "config_error",
      "Gateway requires at least one route"
    );
  const t = e.name ?? "edge-gateway", r = Sr(e.debug), s = r("stoma:gateway"), a = r("stoma:pipeline"), n = r("stoma:upstream"), o = new ht();
  o.onError((d, h) => {
    if (e.onError)
      return e.onError(d, h);
    const p = B(h);
    return d instanceof m ? Xe(d, p?.requestId) : (console.error(
      `[${t}] Unhandled error on ${h.req.method} ${h.req.path}:`,
      d
    ), Ot(p?.requestId, e.defaultErrorMessage));
  }), o.notFound((d) => (s(`no route matches ${d.req.method} ${d.req.path}`), d.json(
    {
      error: "not_found",
      message: `No route matches ${d.req.method} ${d.req.path}`,
      statusCode: 404,
      gateway: t
    },
    404
  )));
  let i = 0;
  const c = [], l = /* @__PURE__ */ new Map();
  for (const d of e.routes) {
    const h = ps(e.basePath, d.path), p = wt(
      t,
      d.path,
      r,
      e.requestIdHeader,
      e.adapter,
      e.debugHeaders,
      e.tracing
    ), y = Ar(
      e.policies ?? [],
      d.pipeline.policies ?? [],
      a,
      e.defaultPolicyPriority
    ), f = Er(y), w = ms(
      d,
      n,
      e.adapter
    ), g = [p, ...f, w], T = d.methods ?? e.defaultMethods ?? ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], b = T.map((A) => A.toUpperCase());
    o.on(b, h, ...g), i += T.length;
    const x = y.map((A) => A.name);
    c.push({
      path: h,
      methods: b,
      policyNames: x,
      upstreamType: d.pipeline.upstream.type
    });
    for (const A of y)
      l.has(A.name) || l.set(A.name, {
        name: A.name,
        priority: A.priority ?? e.defaultPolicyPriority ?? 100
      });
    s(
      `route ${h} [${b.join(",")}]${x.length ? ` policies=[${x.join(", ")}]` : ""} upstream=${d.pipeline.upstream.type}`
    );
  }
  const u = {
    routes: c,
    policies: Array.from(l.values()).sort(
      (d, h) => d.priority - h.priority
    ),
    gatewayName: t
  };
  if (e.admin) {
    const d = typeof e.admin == "boolean" ? { enabled: !0 } : e.admin;
    d.enabled && (d.auth || console.warn(
      `[stoma:${t}] admin routes enabled without authentication`
    ), hs(o, d, u), s(
      `admin routes registered at /${d.prefix ?? "___gateway"}/*`
    ));
  }
  return s(`"${t}" started with ${i} route handlers`), { app: o, routeCount: i, name: t, _registry: u };
}
function ps(e, t) {
  if (!e) return t;
  const r = e.endsWith("/") ? e.slice(0, -1) : e, s = t.startsWith("/") ? t : `/${t}`;
  return `${r}${s}`;
}
function ms(e, t = I, r) {
  const s = e.pipeline.upstream;
  switch (s.type) {
    case "handler":
      return fs(s);
    case "url":
      return ws(s, t);
    case "service-binding":
      return ys(s, t, r);
    default:
      throw new m(
        500,
        "config_error",
        `Unknown upstream type: ${s.type}`
      );
  }
}
function fs(e) {
  return async (t) => e.handler(t);
}
var se = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
];
function ys(e, t = I, r) {
  return async (s) => {
    if (!r?.dispatchBinding)
      throw new m(
        502,
        "config_error",
        `Service binding "${e.service}" requires adapter.dispatchBinding — pass "env" to cloudflareAdapter() or provide a custom dispatchBinding`
      );
    const a = new URL(s.req.url);
    let n = a.pathname;
    if (e.rewritePath) {
      const f = n;
      n = e.rewritePath(n), t(`path rewrite: ${f} -> ${n}`);
    }
    const o = new URL(n + a.search, s.req.url);
    t(
      `service-binding "${e.service}": ${s.req.method} ${o.pathname}${o.search}`
    );
    const i = new Headers(s.req.raw.headers);
    for (const f of se)
      i.delete(f);
    const c = B(s);
    if (c) {
      const f = oe();
      i.set(
        "traceparent",
        je({
          version: "00",
          traceId: c.traceId,
          parentId: f,
          flags: "01"
        })
      );
    }
    const l = new Request(o.toString(), {
      method: s.req.method,
      headers: i,
      body: s.req.raw.body,
      // @ts-expect-error -- duplex is needed for streaming bodies
      duplex: s.req.raw.body ? "half" : void 0
    }), u = s.get("_otelSpans");
    let d;
    if (u !== void 0) {
      const f = s.get("_otelRootSpan");
      d = new ae(
        `upstream:service-binding:${e.service}`,
        "CLIENT",
        f.traceId,
        ne(),
        f.spanId
      ), d.setAttribute(j.HTTP_METHOD, s.req.method).setAttribute(j.URL_PATH, o.pathname).setAttribute("rpc.service", e.service);
    }
    const h = Date.now(), p = await r.dispatchBinding(
      e.service,
      l
    );
    t(
      `service-binding responded: ${p.status} (${Date.now() - h}ms)`
    ), d && (d.setAttribute(j.HTTP_STATUS_CODE, p.status).setStatus(p.status >= 500 ? "ERROR" : "OK"), u.push(d.end()));
    const y = new Headers(p.headers);
    for (const f of se)
      y.delete(f);
    return new Response(p.body, {
      status: p.status,
      statusText: p.statusText,
      headers: y
    });
  };
}
function ws(e, t = I) {
  const r = new URL(e.target);
  return async (s) => {
    const a = new URL(s.req.url);
    let n = a.pathname;
    if (e.rewritePath) {
      const g = n;
      n = e.rewritePath(n), t(`path rewrite: ${g} -> ${n}`);
    }
    const o = new URL(n + a.search, r);
    if (o.origin !== r.origin)
      throw t(
        `SSRF blocked: rewritten URL origin ${o.origin} != ${r.origin}`
      ), new m(
        502,
        "upstream_error",
        "Rewritten URL must not change the upstream origin"
      );
    t(`proxying ${s.req.method} ${s.req.path} -> ${o.toString()}`);
    const i = new Headers(s.req.raw.headers);
    for (const g of se)
      i.delete(g);
    if (s.get("_preserveHost") === !0 || i.set("host", o.host), e.headers)
      for (const [g, T] of Object.entries(e.headers))
        i.set(g, T);
    const l = B(s);
    if (l) {
      const g = oe();
      i.set(
        "traceparent",
        je({
          version: "00",
          traceId: l.traceId,
          parentId: g,
          flags: "01"
        })
      );
    }
    const u = new Request(o.toString(), {
      method: s.req.method,
      headers: i,
      body: s.req.raw.body,
      redirect: "manual",
      // Prevent SSRF via redirect to internal services
      // @ts-expect-error -- duplex is needed for streaming bodies
      duplex: s.req.raw.body ? "half" : void 0
    });
    s.set("_proxyRequest", u.clone());
    const d = s.get("_timeoutSignal"), h = s.get("_otelSpans");
    let p;
    if (h !== void 0) {
      const g = s.get("_otelRootSpan");
      p = new ae(
        `upstream:url:${o.host}`,
        "CLIENT",
        g.traceId,
        ne(),
        g.spanId
      ), p.setAttribute(j.HTTP_METHOD, s.req.method).setAttribute(j.URL_PATH, o.pathname).setAttribute(j.SERVER_ADDRESS, o.host);
    }
    const y = Date.now(), f = await fetch(
      u,
      d ? { signal: d } : void 0
    );
    t(
      `upstream responded: ${f.status} (${Date.now() - y}ms)`
    ), p && (p.setAttribute(j.HTTP_STATUS_CODE, f.status).setStatus(f.status >= 500 ? "ERROR" : "OK"), h.push(p.end()));
    const w = new Headers(f.headers);
    for (const g of se)
      w.delete(g);
    return new Response(f.body, {
      status: f.status,
      statusText: f.statusText,
      headers: w
    });
  };
}
function gs(e) {
  let t = e;
  return t.startsWith("/") || (t = `/${t}`), t.length > 1 && t.endsWith("/") && (t = t.slice(0, -1)), t;
}
function vs(e, t) {
  const r = t.startsWith("/") ? t : `/${t}`;
  return e.endsWith("/") && r.startsWith("/") ? `${e}${r.slice(1)}` : `${e}${r}`;
}
function ga(e) {
  const t = gs(e.prefix), r = e.policies ?? [], s = e.metadata ?? {};
  return e.routes.map((a) => {
    const n = vs(t, a.path), o = a.pipeline.policies ?? [], i = r.length > 0 || o.length > 0 ? [...r, ...o] : void 0, c = Object.keys(s).length > 0 || a.metadata ? { ...s, ...a.metadata } : void 0;
    return {
      ...a,
      path: n,
      pipeline: {
        ...a.pipeline,
        ...i !== void 0 ? { policies: i } : {}
      },
      ...c !== void 0 ? { metadata: c } : {}
    };
  });
}
function va(e, t) {
  const r = new TextEncoder(), s = r.encode(e), a = r.encode(t), n = Math.max(s.length, a.length);
  let o = s.length !== a.length ? 1 : 0;
  for (let i = 0; i < n; i++) {
    const c = i < s.length ? s[i] : 0, l = i < a.length ? a[i] : 0;
    o |= c ^ l;
  }
  return o === 0;
}
var Ss = "https://stoma.internal", Sa = class {
  cache;
  origin;
  /**
   * @param cache - A `Cache` instance (e.g. `caches.default`). Falls back to `caches.default` when omitted.
   * @param origin - Synthetic origin used to construct cache keys. Default: `"https://edge-gateway.internal"`.
   */
  constructor(e, t) {
    this.cache = e ?? caches.default, this.origin = t ?? Ss;
  }
  async get(e) {
    const t = new Request(`${this.origin}/${encodeURIComponent(e)}`);
    return await this.cache.match(t) ?? null;
  }
  async put(e, t, r) {
    const s = new Request(`${this.origin}/${encodeURIComponent(e)}`), a = new Headers(t.headers);
    a.set("Cache-Control", `s-maxage=${r}`);
    const n = await t.arrayBuffer(), o = new Response(n, {
      status: t.status,
      headers: a
    });
    await this.cache.put(s, o);
  }
  async delete(e) {
    const t = new Request(`${this.origin}/${encodeURIComponent(e)}`);
    return this.cache.delete(t);
  }
};
function Ta() {
  return {
    rateLimitStore: new xt(),
    circuitBreakerStore: new qt(),
    cacheStore: new Tt()
  };
}
const ba = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Priority: v,
  createPolicyTestHarness: qr,
  definePolicy: S,
  getCollectedDebugHeaders: vt,
  isDebugRequested: St,
  isTraceRequested: wr,
  noopTraceReporter: pt,
  parseDebugRequest: gt,
  policyDebug: K,
  policyTrace: $e,
  resolveConfig: J,
  safeCall: E,
  setDebugHeader: q,
  withSkip: k
}, Symbol.toStringTag, { value: "Module" })), Ts = "stoma-playground", L = "rate-limits", bs = 1;
function xs() {
  return new Promise((e, t) => {
    const r = indexedDB.open(Ts, bs);
    r.onupgradeneeded = () => {
      const s = r.result;
      s.objectStoreNames.contains(L) || s.createObjectStore(L);
    }, r.onsuccess = () => e(r.result), r.onerror = () => t(r.error);
  });
}
function Rs(e, t) {
  return new Promise((r, s) => {
    const o = e.transaction(L, "readonly").objectStore(L).get(t);
    o.onsuccess = () => r(o.result), o.onerror = () => s(o.error);
  });
}
function Ge(e, t, r) {
  return new Promise((s, a) => {
    const i = e.transaction(L, "readwrite").objectStore(L).put(r, t);
    i.onsuccess = () => s(), i.onerror = () => a(i.error);
  });
}
class xa {
  db = null;
  async increment(t, r) {
    this.db || (this.db = await xs());
    const s = Date.now(), a = await Rs(this.db, t);
    if (a && a.resetAt > s) {
      const o = {
        count: a.count + 1,
        resetAt: a.resetAt
      };
      return await Ge(this.db, t, o), o;
    }
    const n = {
      count: 1,
      resetAt: s + r * 1e3
    };
    return await Ge(this.db, t, n), n;
  }
  /** Close the database connection. */
  destroy() {
    this.db && (this.db.close(), this.db = null);
  }
}
export {
  Sa as CacheApiCacheStore,
  _s as ConsoleSpanExporter,
  Hr as DEFAULT_IP_HEADERS,
  m as GatewayError,
  xa as IDBRateLimitStore,
  Tt as InMemoryCacheStore,
  qt as InMemoryCircuitBreakerStore,
  ya as InMemoryMetricsCollector,
  Es as OTLPSpanExporter,
  v as Priority,
  j as SemConv,
  ae as SpanBuilder,
  ks as apiKeyAuth,
  ra as assignAttributes,
  sa as assignContent,
  da as assignMetrics,
  Hs as basicAuth,
  qs as cache,
  fa as circuitBreaker,
  Is as clearJwksCache,
  aa as cors,
  wa as createGateway,
  qr as createPolicyTestHarness,
  Ot as defaultErrorResponse,
  S as definePolicy,
  Bs as dynamicRouting,
  Xe as errorToResponse,
  ee as extractClientIp,
  Ms as generateHttpSignature,
  Cs as generateJwt,
  Js as geoIpFilter,
  B as getGatewayContext,
  ua as health,
  Ks as httpCallout,
  zs as interrupt,
  Fs as ipFilter,
  St as isDebugRequested,
  wr as isTraceRequested,
  Ws as jsonThreatProtection,
  na as jsonValidation,
  Ps as jws,
  Ns as jwtAuth,
  Zs as latencyInjection,
  Ta as memoryAdapter,
  ha as metricsReporter,
  js as mock,
  pt as noopTraceReporter,
  Ds as oauth2,
  oa as overrideMethod,
  K as policyDebug,
  $e as policyTrace,
  Os as proxy,
  $s as rateLimit,
  Us as rbac,
  Vs as regexThreatProtection,
  Ys as requestLimit,
  pa as requestLog,
  ca as requestTransform,
  ia as requestValidation,
  J as resolveConfig,
  Gs as resourceFilter,
  la as responseTransform,
  ea as retry,
  E as safeCall,
  ga as scope,
  ba as sdk,
  ma as serverTiming,
  q as setDebugHeader,
  Xs as sslEnforce,
  ta as timeout,
  va as timingSafeEqual,
  ls as toPrometheusText,
  Qs as trafficShadow,
  Ls as verifyHttpSignature,
  k as withSkip
};
