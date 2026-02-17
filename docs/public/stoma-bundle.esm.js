class f extends Error {
  statusCode;
  code;
  /** Optional headers to include in the error response (e.g. rate-limit headers) */
  headers;
  constructor(t, r, s, n) {
    super(s), this.name = "GatewayError", this.statusCode = t, this.code = r, this.headers = n;
  }
}
function et(e, t) {
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
function qt(e, t = "An unexpected error occurred") {
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
var Pe = (e, t, r) => (s, n) => {
  let a = -1;
  return o(0);
  async function o(i) {
    if (i <= a)
      throw new Error("next() called multiple times");
    a = i;
    let c, l = !1, u;
    if (e[i] ? (u = e[i][0][0], s.req.routeIndex = i) : u = i === e.length && n || void 0, u)
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
}, Mt = /* @__PURE__ */ Symbol(), Ct = async (e, t = /* @__PURE__ */ Object.create(null)) => {
  const { all: r = !1, dot: s = !1 } = t, a = (e instanceof ot ? e.raw.headers : e.headers).get("Content-Type");
  return a?.startsWith("multipart/form-data") || a?.startsWith("application/x-www-form-urlencoded") ? Pt(e, { all: r, dot: s }) : {};
};
async function Pt(e, t) {
  const r = await e.formData();
  return r ? Nt(r, t) : {};
}
function Nt(e, t) {
  const r = /* @__PURE__ */ Object.create(null);
  return e.forEach((s, n) => {
    t.all || n.endsWith("[]") ? Dt(r, n, s) : r[n] = s;
  }), t.dot && Object.entries(r).forEach(([s, n]) => {
    s.includes(".") && (Ut(r, s, n), delete r[s]);
  }), r;
}
var Dt = (e, t, r) => {
  e[t] !== void 0 ? Array.isArray(e[t]) ? e[t].push(r) : e[t] = [e[t], r] : t.endsWith("[]") ? e[t] = [r] : e[t] = r;
}, Ut = (e, t, r) => {
  let s = e;
  const n = t.split(".");
  n.forEach((a, o) => {
    o === n.length - 1 ? s[a] = r : ((!s[a] || typeof s[a] != "object" || Array.isArray(s[a]) || s[a] instanceof File) && (s[a] = /* @__PURE__ */ Object.create(null)), s = s[a]);
  });
}, tt = (e) => {
  const t = e.split("/");
  return t[0] === "" && t.shift(), t;
}, Lt = (e) => {
  const { groups: t, path: r } = Bt(e), s = tt(r);
  return Kt(s, t);
}, Bt = (e) => {
  const t = [];
  return e = e.replace(/\{[^}]+\}/g, (r, s) => {
    const n = `@${s}`;
    return t.push([n, r]), n;
  }), { groups: t, path: e };
}, Kt = (e, t) => {
  for (let r = t.length - 1; r >= 0; r--) {
    const [s] = t[r];
    for (let n = e.length - 1; n >= 0; n--)
      if (e[n].includes(s)) {
        e[n] = e[n].replace(s, t[r][1]);
        break;
      }
  }
  return e;
}, X = {}, Jt = (e, t) => {
  if (e === "*")
    return "*";
  const r = e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (r) {
    const s = `${e}#${t}`;
    return X[s] || (r[2] ? X[s] = t && t[0] !== ":" && t[0] !== "*" ? [s, r[1], new RegExp(`^${r[2]}(?=/${t})`)] : [e, r[1], new RegExp(`^${r[2]}$`)] : X[s] = [e, r[1], !0]), X[s];
  }
  return null;
}, je = (e, t) => {
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
}, Ft = (e) => je(e, decodeURI), rt = (e) => {
  const t = e.url, r = t.indexOf("/", t.indexOf(":") + 4);
  let s = r;
  for (; s < t.length; s++) {
    const n = t.charCodeAt(s);
    if (n === 37) {
      const a = t.indexOf("?", s), o = t.indexOf("#", s), i = a === -1 ? o === -1 ? void 0 : o : o === -1 ? a : Math.min(a, o), c = t.slice(r, i);
      return Ft(c.includes("%25") ? c.replace(/%25/g, "%2525") : c);
    } else if (n === 63 || n === 35)
      break;
  }
  return t.slice(r, s);
}, zt = (e) => {
  const t = rt(e);
  return t.length > 1 && t.at(-1) === "/" ? t.slice(0, -1) : t;
}, L = (e, t, ...r) => (r.length && (t = L(t, ...r)), `${e?.[0] === "/" ? "" : "/"}${e}${t === "/" ? "" : `${e?.at(-1) === "/" ? "" : "/"}${t?.[0] === "/" ? t.slice(1) : t}`}`), st = (e) => {
  if (e.charCodeAt(e.length - 1) !== 63 || !e.includes(":"))
    return null;
  const t = e.split("/"), r = [];
  let s = "";
  return t.forEach((n) => {
    if (n !== "" && !/\:/.test(n))
      s += "/" + n;
    else if (/\:/.test(n))
      if (/\?/.test(n)) {
        r.length === 0 && s === "" ? r.push("/") : r.push(s);
        const a = n.replace("?", "");
        s += "/" + a, r.push(s);
      } else
        s += "/" + n;
  }), r.filter((n, a, o) => o.indexOf(n) === a);
}, de = (e) => /[%+]/.test(e) ? (e.indexOf("+") !== -1 && (e = e.replace(/\+/g, " ")), e.indexOf("%") !== -1 ? je(e, at) : e) : e, nt = (e, t, r) => {
  let s;
  if (!r && t && !/[%+]/.test(t)) {
    let o = e.indexOf("?", 8);
    if (o === -1)
      return;
    for (e.startsWith(t, o + 1) || (o = e.indexOf(`&${t}`, o + 1)); o !== -1; ) {
      const i = e.charCodeAt(o + t.length + 1);
      if (i === 61) {
        const c = o + t.length + 2, l = e.indexOf("&", c);
        return de(e.slice(c, l === -1 ? void 0 : l));
      } else if (i == 38 || isNaN(i))
        return "";
      o = e.indexOf(`&${t}`, o + 1);
    }
    if (s = /[%+]/.test(e), !s)
      return;
  }
  const n = {};
  s ??= /[%+]/.test(e);
  let a = e.indexOf("?", 8);
  for (; a !== -1; ) {
    const o = e.indexOf("&", a + 1);
    let i = e.indexOf("=", a);
    i > o && o !== -1 && (i = -1);
    let c = e.slice(
      a + 1,
      i === -1 ? o === -1 ? void 0 : o : i
    );
    if (s && (c = de(c)), a = o, c === "")
      continue;
    let l;
    i === -1 ? l = "" : (l = e.slice(i + 1, o === -1 ? void 0 : o), s && (l = de(l))), r ? (n[c] && Array.isArray(n[c]) || (n[c] = []), n[c].push(l)) : n[c] ??= l;
  }
  return t ? n[t] : n;
}, Wt = nt, Vt = (e, t) => nt(e, t, !0), at = decodeURIComponent, Ne = (e) => je(e, at), ot = class {
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
    return e ? this.#r(e) : this.#a();
  }
  #r(e) {
    const t = this.#e[0][this.routeIndex][1][e], r = this.#n(t);
    return r && /\%/.test(r) ? Ne(r) : r;
  }
  #a() {
    const e = {}, t = Object.keys(this.#e[0][this.routeIndex][1]);
    for (const r of t) {
      const s = this.#n(this.#e[0][this.routeIndex][1][r]);
      s !== void 0 && (e[r] = /\%/.test(s) ? Ne(s) : s);
    }
    return e;
  }
  #n(e) {
    return this.#e[1] ? this.#e[1][e] : e;
  }
  query(e) {
    return Wt(this.url, e);
  }
  queries(e) {
    return Vt(this.url, e);
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
    return this.bodyCache.parsedBody ??= await Ct(this, e);
  }
  #s = (e) => {
    const { bodyCache: t, raw: r } = this, s = t[e];
    if (s)
      return s;
    const n = Object.keys(t)[0];
    return n ? t[n].then((a) => (n === "json" && (a = JSON.stringify(a)), new Response(a)[e]())) : t[e] = r[e]();
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
  get [Mt]() {
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
}, Yt = {
  Stringify: 1
}, it = async (e, t, r, s, n) => {
  typeof e == "object" && !(e instanceof String) && (e instanceof Promise || (e = e.toString()), e instanceof Promise && (e = await e));
  const a = e.callbacks;
  return a?.length ? (n ? n[0] += e : n = [e], Promise.all(a.map((i) => i({ phase: t, buffer: n, context: s }))).then(
    (i) => Promise.all(
      i.filter(Boolean).map((c) => it(c, t, !1, s, n))
    ).then(() => n[0])
  )) : Promise.resolve(e);
}, Gt = "text/plain; charset=UTF-8", he = (e, t) => ({
  "Content-Type": e,
  ...t
}), Xt = class {
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
  #a;
  #n;
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
    this.#t = e, t && (this.#n = t.executionCtx, this.env = t.env, this.#l = t.notFoundHandler, this.#h = t.path, this.#d = t.matchResult);
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    return this.#e ??= new ot(this.#t, this.#h, this.#d), this.#e;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#n && "respondWith" in this.#n)
      return this.#n;
    throw Error("This context has no FetchEvent");
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#n)
      return this.#n;
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
            for (const n of s)
              e.headers.append("set-cookie", n);
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
    this.#a = e;
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
      const a = t.headers instanceof Headers ? t.headers : new Headers(t.headers);
      for (const [o, i] of a)
        o.toLowerCase() === "set-cookie" ? s.append(o, i) : s.set(o, i);
    }
    if (r)
      for (const [a, o] of Object.entries(r))
        if (typeof o == "string")
          s.set(a, o);
        else {
          s.delete(a);
          for (const i of o)
            s.append(a, i);
        }
    const n = typeof t == "number" ? t : t?.status ?? this.#a;
    return new Response(e, { status: n, headers: s });
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
  text = (e, t, r) => !this.#i && !this.#a && !t && !r && !this.finalized ? new Response(e) : this.#o(
    e,
    t,
    he(Gt, r)
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
    he("application/json", r)
  );
  html = (e, t, r) => {
    const s = (n) => this.#o(n, t, he("text/html; charset=UTF-8", r));
    return typeof e == "object" ? it(e, Yt.Stringify, !1, {}).then(s) : s(e);
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
}, A = "ALL", Qt = "all", Zt = ["get", "post", "put", "delete", "options", "patch"], ct = "Can not add a route since the matcher is already built.", lt = class extends Error {
}, er = "__COMPOSED_HANDLER", tr = (e) => e.text("404 Not Found", 404), De = (e, t) => {
  if ("getResponse" in e) {
    const r = e.getResponse();
    return t.newResponse(r.body, r);
  }
  return console.error(e), t.text("Internal Server Error", 500);
}, rr = class ut {
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
    [...Zt, Qt].forEach((a) => {
      this[a] = (o, ...i) => (typeof o == "string" ? this.#t = o : this.#a(a, this.#t, o), i.forEach((c) => {
        this.#a(a, this.#t, c);
      }), this);
    }), this.on = (a, o, ...i) => {
      for (const c of [o].flat()) {
        this.#t = c;
        for (const l of [a].flat())
          i.map((u) => {
            this.#a(l.toUpperCase(), this.#t, u);
          });
      }
      return this;
    }, this.use = (a, ...o) => (typeof a == "string" ? this.#t = a : (this.#t = "*", o.unshift(a)), o.forEach((i) => {
      this.#a(A, this.#t, i);
    }), this);
    const { strict: s, ...n } = t;
    Object.assign(this, n), this.getPath = s ?? !0 ? t.getPath ?? rt : zt;
  }
  #e() {
    const t = new ut({
      router: this.router,
      getPath: this.getPath
    });
    return t.errorHandler = this.errorHandler, t.#r = this.#r, t.routes = this.routes, t;
  }
  #r = tr;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = De;
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
    return r.routes.map((n) => {
      let a;
      r.errorHandler === De ? a = n.handler : (a = async (o, i) => (await Pe([], r.errorHandler)(o, () => n.handler(o, i))).res, a[er] = n.handler), s.#a(n.method, n.path, a);
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
    return r._basePath = L(this._basePath, t), r;
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
    let n, a;
    s && (typeof s == "function" ? a = s : (a = s.optionHandler, s.replaceRequest === !1 ? n = (c) => c : n = s.replaceRequest));
    const o = a ? (c) => {
      const l = a(c);
      return Array.isArray(l) ? l : [l];
    } : (c) => {
      let l;
      try {
        l = c.executionCtx;
      } catch {
      }
      return [c.env, l];
    };
    n ||= (() => {
      const c = L(this._basePath, t), l = c === "/" ? 0 : c.length;
      return (u) => {
        const d = new URL(u.url);
        return d.pathname = d.pathname.slice(l) || "/", new Request(d, u);
      };
    })();
    const i = async (c, l) => {
      const u = await r(n(c.req.raw), ...o(c));
      if (u)
        return u;
      await l();
    };
    return this.#a(A, L(t, "*"), i), this;
  }
  #a(t, r, s) {
    t = t.toUpperCase(), r = L(this._basePath, r);
    const n = { basePath: this._basePath, path: r, method: t, handler: s };
    this.router.add(t, r, [s, n]), this.routes.push(n);
  }
  #n(t, r) {
    if (t instanceof Error)
      return this.errorHandler(t, r);
    throw t;
  }
  #s(t, r, s, n) {
    if (n === "HEAD")
      return (async () => new Response(null, await this.#s(t, r, s, "GET")))();
    const a = this.getPath(t, { env: s }), o = this.router.match(n, a), i = new Xt(t, {
      path: a,
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
        return this.#n(u, i);
      }
      return l instanceof Promise ? l.then(
        (u) => u || (i.finalized ? i.res : this.#r(i))
      ).catch((u) => this.#n(u, i)) : l ?? this.#r(i);
    }
    const c = Pe(o[0], this.errorHandler, this.#r);
    return (async () => {
      try {
        const l = await c(i);
        if (!l.finalized)
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        return l.res;
      } catch (l) {
        return this.#n(l, i);
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
  request = (t, r, s, n) => t instanceof Request ? this.fetch(r ? new Request(t, r) : t, s, n) : (t = t.toString(), this.fetch(
    new Request(
      /^https?:\/\//.test(t) ? t : `http://localhost${L("/", t)}`,
      r
    ),
    s,
    n
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
}, dt = [];
function sr(e, t) {
  const r = this.buildAllMatchers(), s = ((n, a) => {
    const o = r[n] || r[A], i = o[2][a];
    if (i)
      return i;
    const c = a.match(o[0]);
    if (!c)
      return [[], dt];
    const l = c.indexOf("", 1);
    return [o[1][l], c];
  });
  return this.match = s, s(e, t);
}
var re = "[^/]+", Y = ".*", G = "(?:|/.*)", B = /* @__PURE__ */ Symbol(), nr = new Set(".\\+*[^]$()");
function ar(e, t) {
  return e.length === 1 ? t.length === 1 ? e < t ? -1 : 1 : -1 : t.length === 1 || e === Y || e === G ? 1 : t === Y || t === G ? -1 : e === re ? 1 : t === re ? -1 : e.length === t.length ? e < t ? -1 : 1 : t.length - e.length;
}
var or = class we {
  #t;
  #e;
  #r = /* @__PURE__ */ Object.create(null);
  insert(t, r, s, n, a) {
    if (t.length === 0) {
      if (this.#t !== void 0)
        throw B;
      if (a)
        return;
      this.#t = r;
      return;
    }
    const [o, ...i] = t, c = o === "*" ? i.length === 0 ? ["", "", Y] : ["", "", re] : o === "/*" ? ["", "", G] : o.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let l;
    if (c) {
      const u = c[1];
      let d = c[2] || re;
      if (u && c[2] && (d === ".*" || (d = d.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:"), /\((?!\?:)/.test(d))))
        throw B;
      if (l = this.#r[d], !l) {
        if (Object.keys(this.#r).some(
          (h) => h !== Y && h !== G
        ))
          throw B;
        if (a)
          return;
        l = this.#r[d] = new we(), u !== "" && (l.#e = n.varIndex++);
      }
      !a && u !== "" && s.push([u, l.#e]);
    } else if (l = this.#r[o], !l) {
      if (Object.keys(this.#r).some(
        (u) => u.length > 1 && u !== Y && u !== G
      ))
        throw B;
      if (a)
        return;
      l = this.#r[o] = new we();
    }
    l.insert(i, r, s, n, a);
  }
  buildRegExpStr() {
    const r = Object.keys(this.#r).sort(ar).map((s) => {
      const n = this.#r[s];
      return (typeof n.#e == "number" ? `(${s})@${n.#e}` : nr.has(s) ? `\\${s}` : s) + n.buildRegExpStr();
    });
    return typeof this.#t == "number" && r.unshift(`#${this.#t}`), r.length === 0 ? "" : r.length === 1 ? r[0] : "(?:" + r.join("|") + ")";
  }
}, ir = class {
  #t = { varIndex: 0 };
  #e = new or();
  insert(e, t, r) {
    const s = [], n = [];
    for (let o = 0; ; ) {
      let i = !1;
      if (e = e.replace(/\{[^}]+\}/g, (c) => {
        const l = `@\\${o}`;
        return n[o] = [l, c], o++, i = !0, l;
      }), !i)
        break;
    }
    const a = e.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let o = n.length - 1; o >= 0; o--) {
      const [i] = n[o];
      for (let c = a.length - 1; c >= 0; c--)
        if (a[c].indexOf(i) !== -1) {
          a[c] = a[c].replace(i, n[o][1]);
          break;
        }
    }
    return this.#e.insert(a, t, s, this.#t, r), s;
  }
  buildRegExp() {
    let e = this.#e.buildRegExpStr();
    if (e === "")
      return [/^$/, [], []];
    let t = 0;
    const r = [], s = [];
    return e = e.replace(/#(\d+)|@(\d+)|\.\*\$/g, (n, a, o) => a !== void 0 ? (r[++t] = Number(a), "$()") : (o !== void 0 && (s[Number(o)] = ++t), "")), [new RegExp(`^${e}`), r, s];
  }
}, cr = [/^$/, [], /* @__PURE__ */ Object.create(null)], ht = /* @__PURE__ */ Object.create(null);
function pt(e) {
  return ht[e] ??= new RegExp(
    e === "*" ? "" : `^${e.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (t, r) => r ? `\\${r}` : "(?:|/.*)"
    )}$`
  );
}
function lr() {
  ht = /* @__PURE__ */ Object.create(null);
}
function ur(e) {
  const t = new ir(), r = [];
  if (e.length === 0)
    return cr;
  const s = e.map(
    (l) => [!/\*|\/:/.test(l[0]), ...l]
  ).sort(
    ([l, u], [d, h]) => l ? 1 : d ? -1 : u.length - h.length
  ), n = /* @__PURE__ */ Object.create(null);
  for (let l = 0, u = -1, d = s.length; l < d; l++) {
    const [h, p, y] = s[l];
    h ? n[p] = [y.map(([g]) => [g, /* @__PURE__ */ Object.create(null)]), dt] : u++;
    let m;
    try {
      m = t.insert(p, u, h);
    } catch (g) {
      throw g === B ? new lt(p) : g;
    }
    h || (r[u] = y.map(([g, w]) => {
      const b = /* @__PURE__ */ Object.create(null);
      for (w -= 1; w >= 0; w--) {
        const [T, R] = m[w];
        b[T] = R;
      }
      return [g, b];
    }));
  }
  const [a, o, i] = t.buildRegExp();
  for (let l = 0, u = r.length; l < u; l++)
    for (let d = 0, h = r[l].length; d < h; d++) {
      const p = r[l][d]?.[1];
      if (!p)
        continue;
      const y = Object.keys(p);
      for (let m = 0, g = y.length; m < g; m++)
        p[y[m]] = i[p[y[m]]];
    }
  const c = [];
  for (const l in o)
    c[l] = r[o[l]];
  return [a, c, n];
}
function D(e, t) {
  if (e) {
    for (const r of Object.keys(e).sort((s, n) => n.length - s.length))
      if (pt(r).test(t))
        return [...e[r]];
  }
}
var dr = class {
  name = "RegExpRouter";
  #t;
  #e;
  constructor() {
    this.#t = { [A]: /* @__PURE__ */ Object.create(null) }, this.#e = { [A]: /* @__PURE__ */ Object.create(null) };
  }
  add(e, t, r) {
    const s = this.#t, n = this.#e;
    if (!s || !n)
      throw new Error(ct);
    s[e] || [s, n].forEach((i) => {
      i[e] = /* @__PURE__ */ Object.create(null), Object.keys(i[A]).forEach((c) => {
        i[e][c] = [...i[A][c]];
      });
    }), t === "/*" && (t = "*");
    const a = (t.match(/\/:/g) || []).length;
    if (/\*$/.test(t)) {
      const i = pt(t);
      e === A ? Object.keys(s).forEach((c) => {
        s[c][t] ||= D(s[c], t) || D(s[A], t) || [];
      }) : s[e][t] ||= D(s[e], t) || D(s[A], t) || [], Object.keys(s).forEach((c) => {
        (e === A || e === c) && Object.keys(s[c]).forEach((l) => {
          i.test(l) && s[c][l].push([r, a]);
        });
      }), Object.keys(n).forEach((c) => {
        (e === A || e === c) && Object.keys(n[c]).forEach(
          (l) => i.test(l) && n[c][l].push([r, a])
        );
      });
      return;
    }
    const o = st(t) || [t];
    for (let i = 0, c = o.length; i < c; i++) {
      const l = o[i];
      Object.keys(n).forEach((u) => {
        (e === A || e === u) && (n[u][l] ||= [
          ...D(s[u], l) || D(s[A], l) || []
        ], n[u][l].push([r, a - c + i + 1]));
      });
    }
  }
  match = sr;
  buildAllMatchers() {
    const e = /* @__PURE__ */ Object.create(null);
    return Object.keys(this.#e).concat(Object.keys(this.#t)).forEach((t) => {
      e[t] ||= this.#r(t);
    }), this.#t = this.#e = void 0, lr(), e;
  }
  #r(e) {
    const t = [];
    let r = e === A;
    return [this.#t, this.#e].forEach((s) => {
      const n = s[e] ? Object.keys(s[e]).map((a) => [a, s[e][a]]) : [];
      n.length !== 0 ? (r ||= !0, t.push(...n)) : e !== A && t.push(
        ...Object.keys(s[A]).map((a) => [a, s[A][a]])
      );
    }), r ? ur(t) : null;
  }
}, hr = class {
  name = "SmartRouter";
  #t = [];
  #e = [];
  constructor(e) {
    this.#t = e.routers;
  }
  add(e, t, r) {
    if (!this.#e)
      throw new Error(ct);
    this.#e.push([e, t, r]);
  }
  match(e, t) {
    if (!this.#e)
      throw new Error("Fatal error");
    const r = this.#t, s = this.#e, n = r.length;
    let a = 0, o;
    for (; a < n; a++) {
      const i = r[a];
      try {
        for (let c = 0, l = s.length; c < l; c++)
          i.add(...s[c]);
        o = i.match(e, t);
      } catch (c) {
        if (c instanceof lt)
          continue;
        throw c;
      }
      this.match = i.match.bind(i), this.#t = [i], this.#e = void 0;
      break;
    }
    if (a === n)
      throw new Error("Fatal error");
    return this.name = `SmartRouter + ${this.activeRouter.name}`, o;
  }
  get activeRouter() {
    if (this.#e || this.#t.length !== 1)
      throw new Error("No active router has been determined yet.");
    return this.#t[0];
  }
}, V = /* @__PURE__ */ Object.create(null), pr = class ft {
  #t;
  #e;
  #r;
  #a = 0;
  #n = V;
  constructor(t, r, s) {
    if (this.#e = s || /* @__PURE__ */ Object.create(null), this.#t = [], t && r) {
      const n = /* @__PURE__ */ Object.create(null);
      n[t] = { handler: r, possibleKeys: [], score: 0 }, this.#t = [n];
    }
    this.#r = [];
  }
  insert(t, r, s) {
    this.#a = ++this.#a;
    let n = this;
    const a = Lt(r), o = [];
    for (let i = 0, c = a.length; i < c; i++) {
      const l = a[i], u = a[i + 1], d = Jt(l, u), h = Array.isArray(d) ? d[0] : l;
      if (h in n.#e) {
        n = n.#e[h], d && o.push(d[1]);
        continue;
      }
      n.#e[h] = new ft(), d && (n.#r.push(d), o.push(d[1])), n = n.#e[h];
    }
    return n.#t.push({
      [t]: {
        handler: s,
        possibleKeys: o.filter((i, c, l) => l.indexOf(i) === c),
        score: this.#a
      }
    }), n;
  }
  #s(t, r, s, n) {
    const a = [];
    for (let o = 0, i = t.#t.length; o < i; o++) {
      const c = t.#t[o], l = c[r] || c[A], u = {};
      if (l !== void 0 && (l.params = /* @__PURE__ */ Object.create(null), a.push(l), s !== V || n && n !== V))
        for (let d = 0, h = l.possibleKeys.length; d < h; d++) {
          const p = l.possibleKeys[d], y = u[l.score];
          l.params[p] = n?.[p] && !y ? n[p] : s[p] ?? n?.[p], u[l.score] = !0;
        }
    }
    return a;
  }
  search(t, r) {
    const s = [];
    this.#n = V;
    let a = [this];
    const o = tt(r), i = [];
    for (let c = 0, l = o.length; c < l; c++) {
      const u = o[c], d = c === l - 1, h = [];
      for (let p = 0, y = a.length; p < y; p++) {
        const m = a[p], g = m.#e[u];
        g && (g.#n = m.#n, d ? (g.#e["*"] && s.push(
          ...this.#s(g.#e["*"], t, m.#n)
        ), s.push(...this.#s(g, t, m.#n))) : h.push(g));
        for (let w = 0, b = m.#r.length; w < b; w++) {
          const T = m.#r[w], R = m.#n === V ? {} : { ...m.#n };
          if (T === "*") {
            const q = m.#e["*"];
            q && (s.push(...this.#s(q, t, m.#n)), q.#n = R, h.push(q));
            continue;
          }
          const [O, C, x] = T;
          if (!u && !(x instanceof RegExp))
            continue;
          const _ = m.#e[O], It = o.slice(c).join("/");
          if (x instanceof RegExp) {
            const q = x.exec(It);
            if (q) {
              if (R[C] = q[0], s.push(...this.#s(_, t, m.#n, R)), Object.keys(_.#e).length) {
                _.#n = R;
                const Ht = q[0].match(/\//)?.length ?? 0;
                (i[Ht] ||= []).push(_);
              }
              continue;
            }
          }
          (x === !0 || x.test(u)) && (R[C] = u, d ? (s.push(...this.#s(_, t, R, m.#n)), _.#e["*"] && s.push(
            ...this.#s(_.#e["*"], t, R, m.#n)
          )) : (_.#n = R, h.push(_)));
        }
      }
      a = h.concat(i.shift() ?? []);
    }
    return s.length > 1 && s.sort((c, l) => c.score - l.score), [s.map(({ handler: c, params: l }) => [c, l])];
  }
}, fr = class {
  name = "TrieRouter";
  #t;
  constructor() {
    this.#t = new pr();
  }
  add(e, t, r) {
    const s = st(t);
    if (s) {
      for (let n = 0, a = s.length; n < a; n++)
        this.#t.insert(e, s[n], r);
      return;
    }
    this.#t.insert(e, t, r);
  }
  match(e, t) {
    return this.#t.search(e, t);
  }
}, mt = class extends rr {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(e = {}) {
    super(e), this.router = e.router ?? new hr({
      routers: [new dr(), new fr()]
    });
  }
};
function pe(e) {
  return !e || Object.keys(e).length === 0 ? "" : Object.entries(e).sort(([t], [r]) => t.localeCompare(r)).map(([t, r]) => `${t}=${r}`).join(",");
}
class js {
  counters = /* @__PURE__ */ new Map();
  histograms = /* @__PURE__ */ new Map();
  gauges = /* @__PURE__ */ new Map();
  increment(t, r = 1, s) {
    const n = pe(s);
    let a = this.counters.get(t);
    a || (a = /* @__PURE__ */ new Map(), this.counters.set(t, a));
    const o = a.get(n);
    o ? o.value += r : a.set(n, { value: r, tags: s });
  }
  histogram(t, r, s) {
    const n = pe(s);
    let a = this.histograms.get(t);
    a || (a = /* @__PURE__ */ new Map(), this.histograms.set(t, a));
    const o = a.get(n);
    o ? o.values.push(r) : a.set(n, { values: [r], tags: s });
  }
  gauge(t, r, s) {
    const n = pe(s);
    let a = this.gauges.get(t);
    a || (a = /* @__PURE__ */ new Map(), this.gauges.set(t, a)), a.set(n, { value: r, tags: s });
  }
  snapshot() {
    const t = {
      counters: {},
      histograms: {},
      gauges: {}
    };
    for (const [r, s] of this.counters)
      t.counters[r] = Array.from(s.values());
    for (const [r, s] of this.histograms)
      t.histograms[r] = Array.from(s.values());
    for (const [r, s] of this.gauges)
      t.gauges[r] = Array.from(s.values());
    return t;
  }
  reset() {
    this.counters.clear(), this.histograms.clear(), this.gauges.clear();
  }
}
function mr(e) {
  const t = [];
  for (const [r, s] of Object.entries(e.counters)) {
    t.push(`# TYPE ${r} counter`);
    for (const n of s)
      t.push(`${r}${fe(n.tags)} ${n.value}`);
  }
  for (const [r, s] of Object.entries(e.histograms)) {
    t.push(`# TYPE ${r} histogram`);
    for (const n of s) {
      const a = fe(n.tags), o = n.values.reduce((c, l) => c + l, 0), i = n.values.length;
      t.push(`${r}_sum${a} ${o}`), t.push(`${r}_count${a} ${i}`);
    }
  }
  for (const [r, s] of Object.entries(e.gauges)) {
    t.push(`# TYPE ${r} gauge`);
    for (const n of s)
      t.push(`${r}${fe(n.tags)} ${n.value}`);
  }
  return t.join(`
`);
}
function yr(e) {
  return e.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}
function fe(e) {
  return !e || Object.keys(e).length === 0 ? "" : `{${Object.entries(e).sort(([r], [s]) => r.localeCompare(s)).map(([r, s]) => `${r}="${yr(s)}"`).join(",")}}`;
}
const wr = ["secret", "key", "token", "password", "credential"];
function gr(e, t, r) {
  const s = `/${t.prefix ?? "___gateway"}`, n = async (a, o) => {
    if (t.auth && !await t.auth(a))
      return a.json(
        { error: "unauthorized", message: "Admin access denied" },
        403
      );
    await o();
  };
  e.get(`${s}/routes`, n, (a) => a.json({
    gateway: r.gatewayName,
    routes: r.routes
  })), e.get(`${s}/policies`, n, (a) => a.json({
    gateway: r.gatewayName,
    policies: r.policies
  })), e.get(`${s}/config`, n, (a) => a.json(
    ge({
      gateway: r.gatewayName,
      routes: r.routes,
      policies: r.policies
    })
  )), e.get(`${s}/metrics`, n, (a) => {
    if (!t.metrics)
      return a.json(
        {
          error: "not_configured",
          message: "No metrics collector configured. Pass a MetricsCollector to admin.metrics."
        },
        404
      );
    const o = t.metrics.snapshot(), i = mr(o);
    return a.text(i, 200, {
      "content-type": "text/plain; version=0.0.4; charset=utf-8"
    });
  }), e.get(`${s}/health`, n, (a) => a.json({
    status: "healthy",
    gateway: r.gatewayName,
    routeCount: r.routes.length,
    policyCount: r.policies.length,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }));
}
function ge(e) {
  if (typeof e != "object" || e === null) return e;
  if (Array.isArray(e)) return e.map(ge);
  const t = {};
  for (const [r, s] of Object.entries(e))
    wr.some((n) => r.toLowerCase().includes(n)) ? t[r] = "[REDACTED]" : typeof s == "function" ? t[r] = "[Function]" : typeof s == "object" && s !== null ? t[r] = ge(s) : t[r] = s;
  return t;
}
const k = {
  HTTP_METHOD: "http.request.method",
  HTTP_ROUTE: "http.route",
  HTTP_STATUS_CODE: "http.response.status_code",
  URL_PATH: "url.path",
  SERVER_ADDRESS: "server.address"
};
class ie {
  constructor(t, r, s, n, a, o = Date.now()) {
    this.name = t, this.kind = r, this.traceId = s, this.spanId = n, this.parentSpanId = a, this.startTimeMs = o;
  }
  _attributes = {};
  _events = [];
  _status = {
    code: "UNSET"
  };
  _endTimeMs;
  /** Set a single attribute. Chainable. */
  setAttribute(t, r) {
    return this._attributes[t] = r, this;
  }
  /** Record a timestamped event with optional attributes. Chainable. */
  addEvent(t, r) {
    return this._events.push({ name: t, timeMs: Date.now(), attributes: r }), this;
  }
  /** Set the span status. Chainable. */
  setStatus(t, r) {
    return this._status = { code: t, message: r }, this;
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
}
const Sr = {
  INTERNAL: 1,
  // SPAN_KIND_INTERNAL
  SERVER: 2,
  // SPAN_KIND_SERVER
  CLIENT: 3
  // SPAN_KIND_CLIENT
}, vr = {
  UNSET: 0,
  // STATUS_CODE_UNSET
  OK: 1,
  // STATUS_CODE_OK
  ERROR: 2
  // STATUS_CODE_ERROR
};
function Tr(e) {
  return typeof e == "string" ? { stringValue: e } : typeof e == "boolean" ? { boolValue: e } : Number.isInteger(e) ? { intValue: e } : { doubleValue: e };
}
function Ue(e) {
  return Object.entries(e).map(([t, r]) => ({
    key: t,
    value: Tr(r)
  }));
}
function me(e) {
  return String(e * 1e6);
}
function br(e, t, r) {
  const s = [{ key: "service.name", value: { stringValue: t } }];
  r && s.push({
    key: "service.version",
    value: { stringValue: r }
  });
  const n = e.map((a) => {
    const o = {
      traceId: a.traceId,
      spanId: a.spanId,
      name: a.name,
      kind: Sr[a.kind],
      startTimeUnixNano: me(a.startTimeMs),
      endTimeUnixNano: me(a.endTimeMs),
      attributes: Ue(a.attributes),
      status: {
        code: vr[a.status.code],
        ...a.status.message ? { message: a.status.message } : {}
      },
      events: a.events.map((i) => ({
        name: i.name,
        timeUnixNano: me(i.timeMs),
        ...i.attributes ? { attributes: Ue(i.attributes) } : {}
      }))
    };
    return a.parentSpanId && (o.parentSpanId = a.parentSpanId), o;
  });
  return {
    resourceSpans: [
      {
        resource: { attributes: s },
        scopeSpans: [
          {
            scope: { name: "stoma-gateway" },
            spans: n
          }
        ]
      }
    ]
  };
}
class Is {
  endpoint;
  headers;
  timeoutMs;
  serviceName;
  serviceVersion;
  constructor(t) {
    this.endpoint = t.endpoint, this.headers = t.headers ?? {}, this.timeoutMs = t.timeoutMs ?? 1e4, this.serviceName = t.serviceName ?? "stoma-gateway", this.serviceVersion = t.serviceVersion;
  }
  async export(t) {
    if (t.length === 0) return;
    const r = br(t, this.serviceName, this.serviceVersion);
    await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...this.headers
      },
      body: JSON.stringify(r),
      signal: AbortSignal.timeout(this.timeoutMs)
    });
  }
}
class Hs {
  async export(t) {
    for (const r of t)
      console.debug(
        `[trace] ${r.name} ${r.kind} ${r.endTimeMs - r.startTimeMs}ms trace=${r.traceId} span=${r.spanId}` + (r.parentSpanId ? ` parent=${r.parentSpanId}` : "") + ` status=${r.status.code}`
      );
  }
}
function xr(e) {
  return e >= 1 ? !0 : e <= 0 ? !1 : Math.random() < e;
}
function ce() {
  const e = new Uint8Array(8);
  return crypto.getRandomValues(e), Array.from(e, (t) => t.toString(16).padStart(2, "0")).join("");
}
const M = () => {
};
function Rr(e, t) {
  return !t || typeof t == "string" && !Ar(e, t) ? M : (r, ...s) => {
    const n = [`[${e}]`, r];
    for (const a of s)
      n.push(
        typeof a == "object" && a !== null ? JSON.stringify(a) : String(a)
      );
    console.debug(n.join(" "));
  };
}
function Ar(e, t) {
  return t.split(",").map((s) => s.trim()).some((s) => {
    if (s === "*") return !0;
    const n = s.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${n}$`).test(e);
  });
}
function Er(e) {
  if (!e) return () => M;
  const t = /* @__PURE__ */ new Map();
  return (r) => {
    const s = t.get(r);
    if (s) return s;
    const n = Rr(r, e);
    return t.set(r, n), n;
  };
}
function j(e) {
  return e.replace(/[\r\n\0]/g, "");
}
function Se(e) {
  return e.replace(/"/g, '\\"');
}
function Ie(e) {
  return new Headers(e.req.raw.headers);
}
function _r(e, t) {
  e.req.raw = new Request(e.req.raw, { headers: t });
}
function I(e, t) {
  const r = Ie(e);
  t(r), _r(e, r);
}
const $r = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;
function Or(e) {
  if (!e) return null;
  const t = e.trim().match($r);
  if (!t) return null;
  const [, r, s, n, a] = t;
  return r === "ff" || s === "00000000000000000000000000000000" || n === "0000000000000000" ? null : { version: r, traceId: s, parentId: n, flags: a };
}
function kr() {
  return {
    version: "00",
    traceId: yt(16),
    parentId: le(),
    flags: "01"
  };
}
function He(e) {
  return `${e.version}-${e.traceId}-${e.parentId}-${e.flags}`;
}
function le() {
  return yt(8);
}
function yt(e) {
  const t = new Uint8Array(e);
  return crypto.getRandomValues(t), Array.from(t, (r) => r.toString(16).padStart(2, "0")).join("");
}
const K = "_stomaTraceRequested", ve = "_stomaTraceEntries", Te = "_stomaTraceDetails", wt = () => {
};
function qe(e, t) {
  return e.get(K) ? (r, s) => {
    const n = e.get(Te) ?? /* @__PURE__ */ new Map();
    n.set(t, { action: r, data: s }), e.set(Te, n);
  } : wt;
}
function jr(e) {
  return e.get(K) === !0;
}
function F(e, t) {
  return t ? { ...e, ...t } : { ...e };
}
function z(e, t) {
  return W(e)?.debug(`stoma:policy:${t}`) ?? M;
}
function H(e, t) {
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
  } catch (n) {
    return r && s && r(
      `${s} failed: ${n instanceof Error ? n.message : String(n)}`
    ), t;
  }
}
const be = "_stomaDebugHeaders", Me = "_stomaDebugRequested";
function $(e, t, r) {
  const s = e.get(Me);
  if (!s || !(s.has(t) || s.has("*"))) return;
  const n = e.get(be) ?? /* @__PURE__ */ new Map();
  n.set(t, String(r)), e.set(be, n);
}
function gt(e, t, r) {
  const s = e.req.header(t);
  if (!s) return;
  const n = s.split(",").map((i) => i.trim().toLowerCase()).filter(Boolean);
  if (n.length === 0) return;
  const a = r ? new Set(r.map((i) => i.toLowerCase())) : null, o = /* @__PURE__ */ new Set();
  if (n.includes("*"))
    if (a)
      for (const i of a) o.add(i);
    else
      o.add("*");
  for (const i of n)
    i !== "*" && (!a || a.has(i)) && o.add(i);
  o.size > 0 && e.set(Me, o), (o.has("trace") || o.has("*")) && e.set(K, !0);
}
function St(e) {
  return e.get(be);
}
function vt(e) {
  const t = e.get(Me);
  return t !== void 0 && t.size > 0;
}
function Tt(e) {
  const t = e.map((r, s) => ({
    ...r,
    durationMs: s === 0 ? r.durationMs : Math.max(0, r.durationMs - e[s - 1].durationMs)
  }));
  return t.reverse(), t;
}
const Ir = () => M, bt = "gateway";
function Hr(e, t, r, s = 100) {
  const n = /* @__PURE__ */ new Map();
  for (const o of e)
    n.set(o.name, o);
  for (const o of t)
    n.has(o.name) && r?.(`policy "${o.name}" overridden by route-level policy`), n.set(o.name, o);
  const a = Array.from(n.values()).sort(
    (o, i) => (o.priority ?? s) - (i.priority ?? s)
  );
  return a.length > 0 && r?.(
    `chain: ${a.map((o) => `${o.name}:${o.priority ?? s}`).join(" -> ")}`
  ), a;
}
function qr(e) {
  return e.map((t) => {
    const r = t.handler, s = t.priority ?? 100;
    return async (a, o) => {
      const i = Date.now();
      if (a.get(K) !== !0 && a.get("_otelSpans") === void 0)
        try {
          return await r(a, o);
        } finally {
          const d = Date.now() - i, h = a.get("_policyTimings") ?? [];
          h.push({ name: t.name, durationMs: d }), a.set("_policyTimings", h);
        }
      let c = !1, l = null, u;
      try {
        u = await r(a, async () => {
          c = !0, await o();
        });
      } catch (d) {
        throw l = d instanceof Error ? d.message : String(d), d;
      } finally {
        const d = Date.now() - i, h = a.get("_policyTimings") ?? [];
        if (h.push({ name: t.name, durationMs: d }), a.set("_policyTimings", h), a.get(K) === !0) {
          const y = a.get(ve) ?? [];
          y.push({
            name: t.name,
            priority: s,
            durationMs: d,
            calledNext: c,
            error: l
          }), a.set(ve, y);
        }
        const p = a.get("_otelSpans");
        if (p !== void 0) {
          const y = a.get("_otelRootSpan"), m = new ie(
            `policy:${t.name}`,
            "INTERNAL",
            y.traceId,
            ce(),
            y.spanId,
            i
          );
          m.setAttribute("policy.name", t.name).setAttribute("policy.priority", s), l && m.setStatus("ERROR", l), p.push(m.end());
        }
      }
      return u;
    };
  });
}
function xt(e, t, r = Ir, s = "x-request-id", n, a, o) {
  const i = a === !0 ? {} : a || void 0, c = i?.requestHeader ?? "x-stoma-debug", l = i?.allow;
  return async (u, d) => {
    const h = u.req.header("traceparent") ?? null, p = Or(h), y = p?.traceId ?? kr().traceId, m = le(), g = {
      requestId: crypto.randomUUID(),
      startTime: Date.now(),
      gatewayName: e,
      routePath: t,
      traceId: y,
      spanId: m,
      debug: r,
      adapter: n
    };
    u.set(bt, g);
    let w;
    if (o && xr(o.sampleRate ?? 1)) {
      const b = ce();
      w = new ie(
        `${u.req.method} ${t}`,
        "SERVER",
        y,
        b,
        p?.parentId,
        g.startTime
      ), w.setAttribute(k.HTTP_METHOD, u.req.method).setAttribute(k.HTTP_ROUTE, t).setAttribute(k.URL_PATH, new URL(u.req.url).pathname).setAttribute("gateway.name", e), u.set("_otelRootSpan", w), u.set("_otelSpans", []);
    }
    if (i && gt(u, c, l), await d(), u.res.headers.set(s, g.requestId), u.res.headers.set(
      "traceparent",
      He({
        version: "00",
        traceId: g.traceId,
        parentId: g.spanId,
        flags: p?.flags ?? "01"
      })
    ), i) {
      const b = St(u);
      if (b)
        for (const [T, R] of b)
          u.res.headers.set(T, R);
    }
    if (u.get(K) === !0) {
      const b = u.get(ve);
      if (b && b.length > 0) {
        const T = u.get(Te), O = Tt(b).map((x) => {
          const _ = T?.get(x.name);
          return _ ? { ...x, detail: _ } : x;
        }), C = {
          requestId: g.requestId,
          traceId: g.traceId,
          route: t,
          totalMs: Date.now() - g.startTime,
          entries: O
        };
        u.res.headers.set("x-stoma-trace", JSON.stringify(C));
      }
    }
    if (w) {
      w.setAttribute(k.HTTP_STATUS_CODE, u.res.status).setStatus(
        u.res.status >= 500 ? "ERROR" : u.res.status >= 400 ? "UNSET" : "OK"
      );
      const b = w.end(), T = u.get("_otelSpans") ?? [], R = [b, ...T], O = o.exporter.export(R).catch(() => {
      });
      n?.waitUntil && n.waitUntil(O);
    }
  };
}
function W(e) {
  return e.get(bt);
}
function qs(e) {
  if (!e.routes || e.routes.length === 0)
    throw new f(
      500,
      "config_error",
      "Gateway requires at least one route"
    );
  const t = e.name ?? "edge-gateway", r = Er(e.debug), s = r("stoma:gateway"), n = r("stoma:pipeline"), a = r("stoma:upstream"), o = new mt();
  o.onError((d, h) => {
    if (e.onError)
      return e.onError(d, h);
    const p = W(h);
    return d instanceof f ? et(d, p?.requestId) : (console.error(
      `[${t}] Unhandled error on ${h.req.method} ${h.req.path}:`,
      d
    ), qt(p?.requestId, e.defaultErrorMessage));
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
    const h = Mr(e.basePath, d.path), p = xt(
      t,
      d.path,
      r,
      e.requestIdHeader,
      e.adapter,
      e.debugHeaders,
      e.tracing
    ), y = Hr(
      e.policies ?? [],
      d.pipeline.policies ?? [],
      n,
      e.defaultPolicyPriority
    ), m = qr(y), g = Cr(
      d,
      a,
      e.adapter
    ), w = [p, ...m, g], b = d.methods ?? e.defaultMethods ?? ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], T = b.map((x) => x.toUpperCase()), R = y.some((x) => x.name === "cors");
    if (R && !T.includes("OPTIONS")) {
      const x = [
        p,
        ...m,
        async (_) => _.body(null, 204)
      ];
      o.on("OPTIONS", h, ...x), i += 1;
    }
    o.on(T, h, ...w), i += b.length;
    const O = y.map((x) => x.name), C = R && !T.includes("OPTIONS") ? [...T, "OPTIONS"] : T;
    c.push({
      path: h,
      methods: C,
      policyNames: O,
      upstreamType: d.pipeline.upstream.type
    });
    for (const x of y)
      l.has(x.name) || l.set(x.name, {
        name: x.name,
        priority: x.priority ?? e.defaultPolicyPriority ?? 100
      });
    s(
      `route ${h} [${T.join(",")}]${O.length ? ` policies=[${O.join(", ")}]` : ""} upstream=${d.pipeline.upstream.type}`
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
    ), gr(o, d, u), s(
      `admin routes registered at /${d.prefix ?? "___gateway"}/*`
    ));
  }
  return s(`"${t}" started with ${i} route handlers`), { app: o, routeCount: i, name: t, _registry: u };
}
function Mr(e, t) {
  if (!e) return t;
  const r = e.endsWith("/") ? e.slice(0, -1) : e, s = t.startsWith("/") ? t : `/${t}`;
  return `${r}${s}`;
}
function Cr(e, t = M, r) {
  const s = e.pipeline.upstream;
  switch (s.type) {
    case "handler":
      return Pr(s);
    case "url":
      return Dr(s, t);
    case "service-binding":
      return Nr(s, t, r);
    default:
      throw new f(
        500,
        "config_error",
        `Unknown upstream type: ${s.type}`
      );
  }
}
function Pr(e) {
  return async (t) => e.handler(t);
}
const se = [
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
function Nr(e, t = M, r) {
  return async (s) => {
    if (!r?.dispatchBinding)
      throw new f(
        502,
        "config_error",
        `Service binding "${e.service}" requires adapter.dispatchBinding - pass "env" to cloudflareAdapter() or provide a custom dispatchBinding`
      );
    const n = new URL(s.req.url);
    let a = n.pathname;
    if (e.rewritePath) {
      const m = a;
      a = e.rewritePath(a), t(`path rewrite: ${m} -> ${a}`);
    }
    const o = new URL(a + n.search, s.req.url);
    t(
      `service-binding "${e.service}": ${s.req.method} ${o.pathname}${o.search}`
    );
    const i = Ie(s);
    for (const m of se)
      i.delete(m);
    const c = W(s);
    if (c) {
      const m = le();
      i.set(
        "traceparent",
        He({
          version: "00",
          traceId: c.traceId,
          parentId: m,
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
      const m = s.get("_otelRootSpan");
      d = new ie(
        `upstream:service-binding:${e.service}`,
        "CLIENT",
        m.traceId,
        ce(),
        m.spanId
      ), d.setAttribute(k.HTTP_METHOD, s.req.method).setAttribute(k.URL_PATH, o.pathname).setAttribute("rpc.service", e.service);
    }
    const h = Date.now(), p = await r.dispatchBinding(
      e.service,
      l
    );
    t(
      `service-binding responded: ${p.status} (${Date.now() - h}ms)`
    ), d && (d.setAttribute(k.HTTP_STATUS_CODE, p.status).setStatus(p.status >= 500 ? "ERROR" : "OK"), u.push(d.end()));
    const y = new Headers(p.headers);
    for (const m of se)
      y.delete(m);
    return new Response(p.body, {
      status: p.status,
      statusText: p.statusText,
      headers: y
    });
  };
}
function Dr(e, t = M) {
  const r = new URL(e.target);
  return async (s) => {
    const n = new URL(s.req.url);
    let a = n.pathname;
    if (e.rewritePath) {
      const w = a;
      a = e.rewritePath(a), t(`path rewrite: ${w} -> ${a}`);
    }
    const o = new URL(a + n.search, r);
    if (o.origin !== r.origin)
      throw t(
        `SSRF blocked: rewritten URL origin ${o.origin} != ${r.origin}`
      ), new f(
        502,
        "upstream_error",
        "Rewritten URL must not change the upstream origin"
      );
    t(`proxying ${s.req.method} ${s.req.path} -> ${o.toString()}`);
    const i = Ie(s);
    for (const w of se)
      i.delete(w);
    if (s.get("_preserveHost") === !0 || i.set("host", o.host), e.headers)
      for (const [w, b] of Object.entries(e.headers))
        i.set(w, b);
    const l = W(s);
    if (l) {
      const w = le();
      i.set(
        "traceparent",
        He({
          version: "00",
          traceId: l.traceId,
          parentId: w,
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
      const w = s.get("_otelRootSpan");
      p = new ie(
        `upstream:url:${o.host}`,
        "CLIENT",
        w.traceId,
        ce(),
        w.spanId
      ), p.setAttribute(k.HTTP_METHOD, s.req.method).setAttribute(k.URL_PATH, o.pathname).setAttribute(k.SERVER_ADDRESS, o.host);
    }
    const y = Date.now();
    let m;
    try {
      m = await fetch(
        u,
        d ? { signal: d } : void 0
      );
    } catch (w) {
      throw w instanceof DOMException && w.name === "AbortError" ? w : (t(
        `upstream fetch failed: ${w instanceof Error ? w.message : w}`
      ), new f(
        502,
        "upstream_error",
        `Upstream request to ${o.host} failed: ${w instanceof Error ? w.message : String(w)}`
      ));
    }
    t(
      `upstream responded: ${m.status} (${Date.now() - y}ms)`
    ), p && (p.setAttribute(k.HTTP_STATUS_CODE, m.status).setStatus(m.status >= 500 ? "ERROR" : "OK"), h.push(p.end()));
    const g = new Headers(m.headers);
    for (const w of se)
      g.delete(w);
    return new Response(m.body, {
      status: m.status,
      statusText: m.statusText,
      headers: g
    });
  };
}
function Ur(e) {
  let t = e;
  return t.startsWith("/") || (t = `/${t}`), t.length > 1 && t.endsWith("/") && (t = t.slice(0, -1)), t;
}
function Lr(e, t) {
  const r = t.startsWith("/") ? t : `/${t}`;
  return e.endsWith("/") && r.startsWith("/") ? `${e}${r.slice(1)}` : `${e}${r}`;
}
function Ms(e) {
  const t = Ur(e.prefix), r = e.policies ?? [], s = e.metadata ?? {};
  return e.routes.map((n) => {
    const a = Lr(t, n.path), o = n.pipeline.policies ?? [], i = r.length > 0 || o.length > 0 ? [...r, ...o] : void 0, c = Object.keys(s).length > 0 || n.metadata ? { ...s, ...n.metadata } : void 0;
    return {
      ...n,
      path: a,
      pipeline: {
        ...n.pipeline,
        ...i !== void 0 ? { policies: i } : {}
      },
      ...c !== void 0 ? { metadata: c } : {}
    };
  });
}
const S = {
  /** Observability policies (e.g. requestLog) - wraps everything */
  OBSERVABILITY: 0,
  /** IP filtering - runs before all other logic */
  IP_FILTER: 1,
  /** Metrics collection - just after observability */
  METRICS: 1,
  /** Early pipeline (e.g. cors) - before auth */
  EARLY: 5,
  /** Authentication (e.g. jwtAuth, apiKeyAuth, basicAuth) */
  AUTH: 10,
  /** Rate limiting - after auth */
  RATE_LIMIT: 20,
  /** Circuit breaker - protects upstream */
  CIRCUIT_BREAKER: 30,
  /** Caching - before upstream */
  CACHE: 40,
  /** Request header transforms - mid-pipeline */
  REQUEST_TRANSFORM: 50,
  /** Timeout - wraps upstream call */
  TIMEOUT: 85,
  /** Retry - wraps upstream fetch */
  RETRY: 90,
  /** Response header transforms - after upstream */
  RESPONSE_TRANSFORM: 92,
  /** Proxy header manipulation - just before upstream */
  PROXY: 95,
  /** Default priority for unspecified policies */
  DEFAULT: 100,
  /** Mock - terminal, replaces upstream */
  MOCK: 999
};
function v(e) {
  return ((t) => {
    const r = F(
      e.defaults ?? {},
      t
    );
    e.validate && e.validate(r);
    const s = async (o, i) => {
      const c = z(o, e.name), l = qe(o, e.name), u = W(o);
      await e.handler(o, i, { config: r, debug: c, trace: l, gateway: u });
    }, n = H(r.skip, s);
    let a;
    if (e.evaluate) {
      const o = e.evaluate;
      a = {
        onRequest: o.onRequest ? (i, c) => o.onRequest(i, { ...c, config: r }) : void 0,
        onResponse: o.onResponse ? (i, c) => o.onResponse(i, { ...c, config: r }) : void 0
      };
    }
    return {
      name: e.name,
      priority: e.priority ?? S.DEFAULT,
      handler: n,
      evaluate: a,
      phases: e.phases,
      httpOnly: e.httpOnly
    };
  });
}
class Br {
  promises = [];
  /**
   * Add a promise to the background work queue.
   */
  waitUntil = (t) => {
    this.promises.push(t);
  };
  /**
   * Await all pending background work collected via `waitUntil`.
   */
  async waitAll() {
    for (; this.promises.length > 0; ) {
      const t = [...this.promises];
      this.promises = [], await Promise.all(t);
    }
  }
  /**
   * Reset the collected promises.
   */
  reset() {
    this.promises = [];
  }
}
function Kr(e, t) {
  const r = t?.path ?? "/*", s = t?.gatewayName ?? "test-gateway", n = t?.adapter ?? new Br(), a = new mt();
  return a.use(
    r,
    xt(s, r, void 0, void 0, n)
  ), a.use(r, async (o, i) => {
    try {
      await e.handler(o, i);
    } catch (c) {
      if (c instanceof f)
        return et(c);
      throw c;
    }
  }), t?.upstream ? a.all(r, t.upstream) : a.all(r, (o) => o.json({ ok: !0 })), {
    /** The underlying Hono app for advanced test scenarios. */
    app: a,
    /** The adapter used by the harness. Call `adapter.waitAll()` to await background tasks. */
    adapter: n,
    /** Make a test request through the policy pipeline. */
    request: (o, i) => a.request(o, i)
  };
}
const Cs = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Priority: S,
  createPolicyTestHarness: Kr,
  definePolicy: v,
  getCollectedDebugHeaders: St,
  isDebugRequested: vt,
  isTraceRequested: jr,
  noopTraceReporter: wt,
  parseDebugRequest: gt,
  policyDebug: z,
  policyTrace: qe,
  resolveConfig: F,
  safeCall: E,
  setDebugHeader: $,
  withSkip: H
}, Symbol.toStringTag, { value: "Module" })), Ps = /* @__PURE__ */ v({
  name: "mock",
  priority: S.MOCK,
  httpOnly: !0,
  defaults: { status: 200, delayMs: 0 },
  validate: (e) => {
    e.allowInProduction || console.warn(
      "[stoma] mock policy active - intended for development/testing only"
    );
  },
  handler: async (e, t, { config: r }) => {
    r.delayMs > 0 && await new Promise((a) => setTimeout(a, r.delayMs));
    const s = r.body === void 0 ? null : typeof r.body == "string" ? r.body : JSON.stringify(r.body), n = new Headers(r.headers);
    typeof r.body == "object" && !n.has("content-type") && n.set("content-type", "application/json"), e.res = new Response(s, { status: r.status, headers: n });
  }
});
function Ns(e) {
  const t = e?.timeout ?? 3e4, r = async (s, n) => {
    if (e?.preserveHost && s.set("_preserveHost", !0), e?.stripHeaders || e?.headers) {
      const a = e?.stripHeaders, o = e?.headers;
      I(s, (i) => {
        if (a)
          for (const c of a)
            i.delete(c);
        if (o)
          for (const [c, l] of Object.entries(o))
            i.set(c, l);
      });
    }
    if (t > 0) {
      const a = new AbortController(), o = setTimeout(() => a.abort(), t);
      try {
        await n();
      } finally {
        clearTimeout(o);
      }
    } else
      await n();
  };
  return {
    name: "proxy",
    priority: S.PROXY,
    handler: H(e?.skip, r),
    httpOnly: !0
  };
}
const Ds = /* @__PURE__ */ v({
  name: "api-key-auth",
  priority: S.AUTH,
  defaults: { headerName: "x-api-key" },
  phases: ["request-headers"],
  handler: async (e, t, { config: r, debug: s, trace: n }) => {
    let a = e.req.header(r.headerName), o = "header";
    if (!a && r.queryParam && (a = new URL(e.req.url).searchParams.get(r.queryParam) ?? void 0, o = "query"), !a)
      throw n("rejected", { reason: "missing" }), new f(401, "unauthorized", "Missing API key");
    if (!await r.validate(a))
      throw n("rejected", { reason: "invalid" }), new f(403, "forbidden", "Invalid API key");
    if (n("authenticated", { source: o }), r.forwardKeyIdentity) {
      const c = r.forwardKeyIdentity, l = await c.identityFn(a);
      I(e, (u) => {
        u.set(c.headerName, j(l));
      }), s(
        `forwarded key identity as ${r.forwardKeyIdentity.headerName}`
      );
    }
    await t();
  },
  evaluate: {
    onRequest: async (e, { config: t, debug: r, trace: s }) => {
      let n = e.headers.get(t.headerName) ?? void 0, a = "header";
      if (!n && t.queryParam && (n = new URL(e.path, "http://localhost").searchParams.get(t.queryParam) ?? void 0, a = "query"), !n)
        return s("rejected", { reason: "missing" }), {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "Missing API key"
        };
      if (!await t.validate(n))
        return s("rejected", { reason: "invalid" }), {
          action: "reject",
          status: 403,
          code: "forbidden",
          message: "Invalid API key"
        };
      if (s("authenticated", { source: a }), t.forwardKeyIdentity) {
        const i = t.forwardKeyIdentity, c = await i.identityFn(n);
        return r(
          `forwarded key identity as ${t.forwardKeyIdentity.headerName}`
        ), {
          action: "continue",
          mutations: [
            {
              type: "header",
              op: "set",
              name: i.headerName,
              value: j(c)
            }
          ]
        };
      }
      return { action: "continue" };
    }
  }
}), Us = /* @__PURE__ */ v({
  name: "basic-auth",
  priority: S.AUTH,
  defaults: { realm: "Restricted" },
  phases: ["request-headers"],
  handler: async (e, t, { config: r }) => {
    const s = Se(
      j(r.realm ?? "Restricted")
    ), n = e.req.header("authorization");
    if (!n || !n.startsWith("Basic "))
      throw e.header("www-authenticate", `Basic realm="${s}"`), new f(
        401,
        "unauthorized",
        "Basic authentication required"
      );
    let a, o;
    try {
      const c = atob(n.slice(6)), l = c.indexOf(":");
      if (l === -1)
        throw new Error("Invalid format");
      a = c.slice(0, l), o = c.slice(l + 1);
    } catch {
      throw new f(
        401,
        "unauthorized",
        "Malformed Basic authentication header"
      );
    }
    if (!await r.validate(a, o, e))
      throw e.header("www-authenticate", `Basic realm="${s}"`), new f(403, "forbidden", "Invalid credentials");
    await t();
  },
  evaluate: {
    onRequest: async (e, { config: t }) => {
      const r = Se(
        j(t.realm ?? "Restricted")
      ), s = e.headers.get("authorization");
      if (!s || !s.startsWith("Basic "))
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "Basic authentication required",
          headers: { "www-authenticate": `Basic realm="${r}"` }
        };
      let n, a;
      try {
        const i = atob(s.slice(6)), c = i.indexOf(":");
        if (c === -1)
          throw new Error("Invalid format");
        n = i.slice(0, c), a = i.slice(c + 1);
      } catch {
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "Malformed Basic authentication header"
        };
      }
      return await t.validate(n, a, {}) ? { action: "continue" } : {
        action: "reject",
        status: 403,
        code: "forbidden",
        message: "Invalid credentials",
        headers: { "www-authenticate": `Basic realm="${r}"` }
      };
    }
  }
});
function P(e) {
  const t = e.replace(/-/g, "+").replace(/_/g, "/"), r = t + "=".repeat((4 - t.length % 4) % 4);
  return atob(r);
}
function ne(e) {
  const t = P(e), r = new Uint8Array(t.length);
  for (let s = 0; s < t.length; s++)
    r[s] = t.charCodeAt(s);
  return r;
}
function ee(e) {
  let t = "";
  for (let r = 0; r < e.length; r++)
    t += String.fromCharCode(e[r]);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function Le(e) {
  return btoa(e).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
const Jr = 3e5, Fr = 1e4, Ae = /* @__PURE__ */ new Map();
async function Ee(e, t, r) {
  const s = Ae.get(e);
  if (s && s.expiresAt > Date.now())
    return s.keys;
  const n = r ?? Fr;
  let a;
  try {
    a = await fetch(e, { signal: AbortSignal.timeout(n) });
  } catch (c) {
    throw c instanceof DOMException && c.name === "TimeoutError" ? new f(
      502,
      "jwks_error",
      `JWKS fetch timed out after ${n}ms: ${e}`
    ) : new f(
      502,
      "jwks_error",
      `Failed to fetch JWKS from ${e}: ${c instanceof Error ? c.message : String(c)}`
    );
  }
  if (!a.ok)
    throw new f(
      502,
      "jwks_error",
      `Failed to fetch JWKS from ${e}: ${a.status}`
    );
  const o = t ?? Jr, i = await a.json();
  return Ae.set(e, { keys: i.keys, expiresAt: Date.now() + o }), i.keys;
}
function Ls() {
  Ae.clear();
}
function zr(e, t) {
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
function Wr(e, t) {
  return e.startsWith("@") ? zr(e, t) : t.headers.get(e) ?? "";
}
function Rt(e, t, r) {
  const s = [];
  for (const n of e) {
    const a = Wr(n, r);
    s.push(`"${n}": ${a}`);
  }
  return s.push(`"@signature-params": ${t}`), s.join(`
`);
}
function Vr(e, t) {
  let s = `(${e.map((n) => `"${n}"`).join(" ")});created=${t.created};keyid="${t.keyId}"`;
  return t.algorithm && (s += `;alg="${t.algorithm}"`), t.expires !== void 0 && (s += `;expires=${t.expires}`), t.nonce !== void 0 && (s += `;nonce="${t.nonce}"`), s;
}
function Yr(e) {
  const t = e.match(/^\(([^)]*)\)/);
  if (!t)
    throw new Error("Invalid signature params: missing component list");
  const r = t[1], s = r ? r.match(/"([^"]+)"/g)?.map((c) => c.slice(1, -1)) ?? [] : [], n = e.slice(t[0].length), a = {}, o = /;(\w+)=("([^"]*)"|(\d+))/g;
  let i = o.exec(n);
  for (; i !== null; )
    a[i[1]] = i[3] ?? i[4], i = o.exec(n);
  return { components: s, params: a };
}
function ue(e) {
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
async function Gr(e, t, r) {
  const { importAlg: s } = ue(e);
  if (e.startsWith("hmac")) {
    if (!t) throw new Error("HMAC algorithm requires secret");
    const n = new TextEncoder();
    return crypto.subtle.importKey(
      "raw",
      n.encode(t),
      s,
      !1,
      ["sign"]
    );
  }
  if (!r) throw new Error("RSA algorithm requires privateKey");
  return crypto.subtle.importKey("jwk", r, s, !1, ["sign"]);
}
async function Xr(e, t, r) {
  const { importAlg: s } = ue(e);
  if (e.startsWith("hmac")) {
    if (!t) throw new Error("HMAC algorithm requires secret");
    const n = new TextEncoder();
    return crypto.subtle.importKey(
      "raw",
      n.encode(t),
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
function Qr(e) {
  return btoa(String.fromCharCode(...new Uint8Array(e)));
}
function Zr(e) {
  const t = atob(e), r = new Uint8Array(t.length);
  for (let s = 0; s < t.length; s++)
    r[s] = t.charCodeAt(s);
  return r;
}
const Bs = /* @__PURE__ */ v({
  name: "generate-http-signature",
  priority: S.PROXY,
  defaults: {
    components: ["@method", "@path", "@authority"],
    signatureHeaderName: "Signature",
    signatureInputHeaderName: "Signature-Input",
    label: "sig1",
    nonce: !1
  },
  handler: async (e, t, { config: r, debug: s }) => {
    if (!r.secret && !r.privateKey)
      throw new f(
        500,
        "config_error",
        "generateHttpSignature requires either 'secret' or 'privateKey'"
      );
    const n = r.components, a = r.label, o = Math.floor(Date.now() / 1e3), i = {
      created: o,
      keyId: r.keyId,
      algorithm: r.algorithm
    };
    r.expires !== void 0 && (i.expires = o + r.expires), r.nonce && (i.nonce = crypto.randomUUID().replace(/-/g, ""));
    const c = Vr(n, i), l = Rt(
      n,
      c,
      e.req.raw
    );
    s(
      `signing with ${r.algorithm}, components: ${n.join(", ")}`
    );
    const u = await Gr(
      r.algorithm,
      r.secret,
      r.privateKey
    ), { signAlg: d } = ue(r.algorithm), h = new TextEncoder(), p = await crypto.subtle.sign(
      d,
      u,
      h.encode(l)
    ), y = Qr(p);
    I(e, (m) => {
      m.set(
        r.signatureInputHeaderName,
        `${a}=${c}`
      ), m.set(r.signatureHeaderName, `${a}=:${y}:`);
    }), s("signature headers attached"), await t();
  }
});
function es(e) {
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
const Ks = /* @__PURE__ */ v({
  name: "generate-jwt",
  priority: S.REQUEST_TRANSFORM,
  defaults: {
    expiresIn: 3600,
    headerName: "Authorization",
    tokenPrefix: "Bearer"
  },
  handler: async (e, t, { config: r, debug: s }) => {
    if (Be(r.algorithm)) {
      if (!r.secret)
        throw new f(
          500,
          "config_error",
          "generateJwt with HMAC algorithm requires 'secret'"
        );
    } else if (!r.privateKey)
      throw new f(
        500,
        "config_error",
        "generateJwt with RSA algorithm requires 'privateKey'"
      );
    const n = { alg: r.algorithm, typ: "JWT" }, a = Le(JSON.stringify(n)), o = Math.floor(Date.now() / 1e3), i = {
      iat: o,
      exp: o + (r.expiresIn ?? 3600)
    };
    r.issuer && (i.iss = r.issuer), r.audience && (i.aud = r.audience);
    let c = {};
    r.claims && (c = typeof r.claims == "function" ? await r.claims(e) : r.claims);
    const l = { ...i, ...c }, u = Le(JSON.stringify(l)), d = `${a}.${u}`, h = new TextEncoder(), p = h.encode(d), y = es(r.algorithm);
    let m;
    if (Be(r.algorithm)) {
      const T = await crypto.subtle.importKey(
        "raw",
        h.encode(r.secret),
        { name: "HMAC", hash: y },
        !1,
        ["sign"]
      );
      m = await crypto.subtle.sign("HMAC", T, p);
    } else {
      const T = await crypto.subtle.importKey(
        "jwk",
        r.privateKey,
        { name: "RSASSA-PKCS1-v1_5", hash: y },
        !1,
        ["sign"]
      );
      m = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", T, p);
    }
    const g = ee(new Uint8Array(m)), w = `${d}.${g}`;
    s(`generated JWT (alg=${r.algorithm})`);
    const b = r.tokenPrefix ? `${r.tokenPrefix} ${w}` : w;
    I(e, (T) => {
      T.set(r.headerName, b);
    }), await t();
  }
}), Js = /* @__PURE__ */ v({
  name: "jws",
  priority: S.AUTH,
  defaults: {
    headerName: "X-JWS-Signature",
    payloadSource: "embedded",
    forwardPayload: !1,
    forwardHeaderName: "X-JWS-Payload"
  },
  validate: (e) => {
    if (!e.secret && !e.jwksUrl)
      throw new f(
        500,
        "config_error",
        "jws requires either 'secret' or 'jwksUrl'"
      );
  },
  handler: async (e, t, { config: r, debug: s }) => {
    const n = e.req.header(r.headerName);
    if (!n)
      throw new f(
        401,
        "jws_missing",
        `Missing JWS header: ${r.headerName}`
      );
    const a = n.split(".");
    if (a.length !== 3)
      throw new f(
        401,
        "jws_invalid",
        "Malformed JWS: expected 3 parts"
      );
    const [o, i, c] = a;
    let l;
    try {
      l = JSON.parse(P(o));
    } catch {
      throw new f(
        401,
        "jws_invalid",
        "Malformed JWS: invalid header encoding"
      );
    }
    if (l.alg.toLowerCase() === "none")
      throw new f(
        401,
        "jws_invalid",
        "JWS algorithm 'none' is not allowed"
      );
    let u;
    if (r.payloadSource === "body") {
      const y = await e.req.raw.clone().text(), m = new TextEncoder();
      u = ee(m.encode(y));
    } else {
      if (!i)
        throw new f(
          401,
          "jws_invalid",
          "JWS has empty payload but payloadSource is 'embedded'"
        );
      u = i;
    }
    const d = new TextEncoder(), h = d.encode(`${o}.${u}`), p = ne(c);
    if (r.secret) {
      const y = xe(l.alg);
      if (!y)
        throw new f(
          401,
          "jws_invalid",
          `Unsupported JWS algorithm: ${l.alg}`
        );
      s(`HMAC verification (alg=${l.alg})`);
      const m = await crypto.subtle.importKey(
        "raw",
        d.encode(r.secret),
        { name: "HMAC", hash: y },
        !1,
        ["verify"]
      );
      if (!await crypto.subtle.verify(
        "HMAC",
        m,
        p,
        h
      ))
        throw new f(401, "jws_invalid", "Invalid JWS signature");
    } else if (r.jwksUrl) {
      const y = Re(l.alg);
      if (!y)
        throw new f(
          401,
          "jws_invalid",
          `Unsupported JWS algorithm: ${l.alg}`
        );
      const m = await Ee(
        r.jwksUrl,
        r.jwksCacheTtlMs,
        r.jwksTimeoutMs
      ), g = l.kid ? m.find(
        (T) => T.kid === l.kid
      ) : m[0];
      if (!g)
        throw new f(
          401,
          "jws_invalid",
          "No matching JWKS key found"
        );
      s(
        `JWKS verification (alg=${l.alg}, kid=${l.kid ?? "none"})`
      );
      const w = await crypto.subtle.importKey(
        "jwk",
        g,
        y,
        !1,
        ["verify"]
      );
      if (!await crypto.subtle.verify(
        y,
        w,
        p,
        h
      ))
        throw new f(401, "jws_invalid", "Invalid JWS signature");
    }
    if (r.forwardPayload)
      try {
        const y = P(u);
        I(e, (m) => {
          m.set(
            r.forwardHeaderName,
            j(y)
          );
        });
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
      const n = s.split(".");
      if (n.length !== 3)
        return {
          action: "reject",
          status: 401,
          code: "jws_invalid",
          message: "Malformed JWS: expected 3 parts"
        };
      const [a, o, i] = n;
      let c;
      try {
        c = JSON.parse(P(a));
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
      const l = t.payloadSource === "body" && e.body ? typeof e.body == "string" ? ee(new TextEncoder().encode(e.body)) : ee(new Uint8Array(e.body)) : o, u = `${a}.${l}`, d = ne(i);
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
          (w) => w.kid === c.kid
        ) : p[0];
        if (!y)
          return {
            action: "reject",
            status: 401,
            code: "jws_invalid",
            message: "No matching JWKS key found"
          };
        const m = await crypto.subtle.importKey(
          "jwk",
          y,
          h,
          !1,
          ["verify"]
        );
        if (!await crypto.subtle.verify(
          h,
          m,
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
          const h = P(l);
          return {
            action: "continue",
            mutations: [
              {
                type: "header",
                op: "set",
                name: t.forwardHeaderName,
                value: j(h)
              }
            ]
          };
        } catch {
        }
      return r("JWS verified"), { action: "continue" };
    }
  }
});
async function Ke(e, t, r) {
  if (!e)
    return {
      ok: !1,
      status: 401,
      code: "unauthorized",
      message: "Missing authentication token"
    };
  let s;
  if (t.tokenPrefix) {
    if (!e.startsWith(`${t.tokenPrefix} `))
      return {
        ok: !1,
        status: 401,
        code: "unauthorized",
        message: `Expected ${t.tokenPrefix} token`
      };
    s = e.slice(t.tokenPrefix.length + 1);
  } else
    s = e;
  if (!s || !s.trim())
    return {
      ok: !1,
      status: 401,
      code: "unauthorized",
      message: "Empty authentication token"
    };
  const n = s.split(".");
  if (n.length !== 3)
    return {
      ok: !1,
      status: 401,
      code: "unauthorized",
      message: "Malformed JWT: expected 3 parts"
    };
  let a, o;
  try {
    a = JSON.parse(P(n[0])), o = JSON.parse(P(n[1]));
  } catch {
    return {
      ok: !1,
      status: 401,
      code: "unauthorized",
      message: "Malformed JWT: invalid base64 encoding"
    };
  }
  if (a.alg.toLowerCase() === "none")
    return {
      ok: !1,
      status: 401,
      code: "unauthorized",
      message: "JWT algorithm 'none' is not allowed"
    };
  t.secret ? (r(`HMAC verification (alg=${a.alg})`), await ts(t.secret, n[0], n[1], n[2], a.alg)) : t.jwksUrl && (r(
    `JWKS verification (alg=${a.alg}, kid=${a.kid ?? "none"})`
  ), await rs(
    t.jwksUrl,
    n[0],
    n[1],
    n[2],
    a,
    t.jwksCacheTtlMs,
    t.jwksTimeoutMs
  ));
  const i = Math.floor(Date.now() / 1e3);
  return t.requireExp && o.exp === void 0 ? {
    ok: !1,
    status: 401,
    code: "unauthorized",
    message: "JWT must contain an 'exp' claim"
  } : o.exp !== void 0 && o.exp < i - t.clockSkewSeconds ? {
    ok: !1,
    status: 401,
    code: "unauthorized",
    message: "JWT has expired"
  } : t.issuer && o.iss !== t.issuer ? {
    ok: !1,
    status: 401,
    code: "unauthorized",
    message: "JWT issuer mismatch"
  } : t.audience && !(Array.isArray(o.aud) ? o.aud : [o.aud]).includes(t.audience) ? {
    ok: !1,
    status: 401,
    code: "unauthorized",
    message: "JWT audience mismatch"
  } : (r(`verified (sub=${o.sub ?? "none"})`), { ok: !0, payload: o });
}
const Fs = /* @__PURE__ */ v({
  name: "jwt-auth",
  priority: S.AUTH,
  phases: ["request-headers"],
  defaults: {
    headerName: "authorization",
    tokenPrefix: "Bearer",
    clockSkewSeconds: 0,
    requireExp: !1
  },
  validate: (e) => {
    if (!e.secret && !e.jwksUrl)
      throw new f(
        500,
        "config_error",
        "jwtAuth requires either 'secret' or 'jwksUrl'"
      );
  },
  handler: async (e, t, { config: r, debug: s }) => {
    const n = await Ke(
      e.req.header(r.headerName),
      r,
      s
    );
    if (!n.ok)
      throw new f(n.status, n.code, n.message);
    if (r.forwardClaims) {
      const { payload: a } = n, o = r.forwardClaims;
      I(e, (i) => {
        for (const [c, l] of Object.entries(o)) {
          const u = a[c];
          u != null && i.set(l, j(String(u)));
        }
      });
    }
    await t();
  },
  evaluate: {
    onRequest: async (e, { config: t, debug: r }) => {
      const s = await Ke(
        e.headers.get(t.headerName),
        t,
        r
      );
      if (!s.ok)
        return {
          action: "reject",
          status: s.status,
          code: s.code,
          message: s.message
        };
      if (t.forwardClaims) {
        const { payload: n } = s, a = t.forwardClaims, o = [];
        for (const [i, c] of Object.entries(a)) {
          const l = n[i];
          l != null && o.push({
            type: "header",
            op: "set",
            name: c,
            value: j(String(l))
          });
        }
        if (o.length > 0)
          return { action: "continue", mutations: o };
      }
      return { action: "continue" };
    }
  }
});
async function ts(e, t, r, s, n) {
  const a = xe(n);
  if (!a)
    throw new f(
      401,
      "unauthorized",
      `Unsupported JWT algorithm: ${n}`
    );
  const o = new TextEncoder(), i = await crypto.subtle.importKey(
    "raw",
    o.encode(e),
    { name: "HMAC", hash: a },
    !1,
    ["verify"]
  ), c = o.encode(`${t}.${r}`), l = ne(s);
  if (!await crypto.subtle.verify("HMAC", i, l, c))
    throw new f(401, "unauthorized", "Invalid JWT signature");
}
async function rs(e, t, r, s, n, a, o) {
  const i = await Ee(e, a, o), c = n.kid ? i.find(
    (m) => m.kid === n.kid
  ) : i[0];
  if (!c)
    throw new f(401, "unauthorized", "No matching JWKS key found");
  const l = Re(n.alg);
  if (!l)
    throw new f(
      401,
      "unauthorized",
      `Unsupported JWT algorithm: ${n.alg}`
    );
  const u = await crypto.subtle.importKey(
    "jwk",
    c,
    l,
    !1,
    ["verify"]
  ), h = new TextEncoder().encode(`${t}.${r}`), p = ne(s);
  if (!await crypto.subtle.verify(l, u, p, h))
    throw new f(401, "unauthorized", "Invalid JWT signature");
}
const ss = 100, N = /* @__PURE__ */ new Map();
function ns(e) {
  if (N.size >= e) {
    const t = N.keys().next().value;
    t && N.delete(t);
  }
}
const zs = /* @__PURE__ */ v({
  name: "oauth2",
  priority: S.AUTH,
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
      throw new f(
        500,
        "config_error",
        "oauth2 requires either introspectionUrl or localValidate"
      );
  },
  handler: async (e, t, { config: r, debug: s }) => {
    let n;
    if (r.tokenLocation === "query")
      n = e.req.query(r.queryParam) ?? void 0;
    else {
      const a = e.req.header(r.headerName);
      if (a && r.headerPrefix) {
        const o = `${r.headerPrefix} `;
        a.startsWith(o) ? n = a.slice(o.length) : n = void 0;
      } else
        n = a ?? void 0;
    }
    if (!n || !n.trim())
      throw new f(401, "unauthorized", "Missing access token");
    if (r.localValidate) {
      if (s("local validation"), !await r.localValidate(n))
        throw new f(401, "unauthorized", "Token validation failed");
    } else if (r.introspectionUrl) {
      s("introspection validation");
      const a = await Je(
        n,
        r.introspectionUrl,
        r.clientId,
        r.clientSecret,
        r.cacheTtlSeconds ?? 0,
        r.introspectionTimeoutMs,
        r.cacheMaxEntries
      );
      if (!a.active)
        throw new f(401, "unauthorized", "Token is not active");
      if (r.requiredScopes && r.requiredScopes.length > 0) {
        const o = a.scope ? a.scope.split(" ") : [];
        if (r.requiredScopes.filter(
          (c) => !o.includes(c)
        ).length > 0)
          throw new f(403, "forbidden", "Insufficient scope");
      }
      if (r.forwardTokenInfo) {
        const o = r.forwardTokenInfo;
        I(e, (i) => {
          for (const [c, l] of Object.entries(o)) {
            const u = a[c];
            u != null && i.set(l, j(String(u)));
          }
        });
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
        const n = e.headers.get(t.headerName) ?? void 0;
        if (n && t.headerPrefix) {
          const a = `${t.headerPrefix} `;
          n.startsWith(a) && (s = n.slice(a.length));
        } else
          s = n;
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
        const n = await Je(
          s,
          t.introspectionUrl,
          t.clientId,
          t.clientSecret,
          t.cacheTtlSeconds ?? 0,
          t.introspectionTimeoutMs,
          t.cacheMaxEntries
        );
        if (!n.active)
          return {
            action: "reject",
            status: 401,
            code: "unauthorized",
            message: "Token is not active"
          };
        if (t.requiredScopes && t.requiredScopes.length > 0) {
          const a = n.scope ? n.scope.split(" ") : [];
          if (t.requiredScopes.filter(
            (i) => !a.includes(i)
          ).length > 0)
            return {
              action: "reject",
              status: 403,
              code: "forbidden",
              message: "Insufficient scope"
            };
        }
        if (t.forwardTokenInfo) {
          const a = t.forwardTokenInfo, o = [];
          for (const [i, c] of Object.entries(a)) {
            const l = n[i];
            l != null && o.push({
              type: "header",
              op: "set",
              name: c,
              value: j(String(l))
            });
          }
          if (o.length > 0)
            return { action: "continue", mutations: o };
        }
        return { action: "continue" };
      }
      return { action: "continue" };
    }
  }
}), as = 5e3;
async function Je(e, t, r, s, n = 0, a, o = ss) {
  if (n > 0) {
    const d = N.get(e);
    if (d && d.expiresAt > Date.now())
      return N.delete(e), N.set(e, d), d.result;
  }
  const i = {
    "content-type": "application/x-www-form-urlencoded"
  };
  r && s && (i.authorization = `Basic ${btoa(`${r}:${s}`)}`);
  const c = a ?? as;
  let l;
  try {
    l = await fetch(t, {
      method: "POST",
      headers: i,
      body: `token=${encodeURIComponent(e)}`,
      signal: AbortSignal.timeout(c)
    });
  } catch (d) {
    throw d instanceof DOMException && d.name === "TimeoutError" ? new f(
      502,
      "introspection_error",
      `Introspection endpoint timed out after ${c}ms`
    ) : new f(
      502,
      "introspection_error",
      `Introspection endpoint error: ${d instanceof Error ? d.message : String(d)}`
    );
  }
  if (!l.ok)
    throw new f(
      502,
      "introspection_error",
      `Introspection endpoint returned ${l.status}`
    );
  const u = await l.json();
  return n > 0 && (ns(o), N.set(e, {
    result: u,
    expiresAt: Date.now() + n * 1e3
  })), u;
}
const Ws = /* @__PURE__ */ v({
  name: "rbac",
  priority: S.AUTH,
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
    r.stripHeaders && I(e, (o) => {
      r.roleHeader && o.has(r.roleHeader) && (o.delete(r.roleHeader), s("stripped role header from incoming request")), r.permissionHeader && o.has(r.permissionHeader) && (o.delete(r.permissionHeader), s("stripped permission header from incoming request"));
    });
    const n = r.roles && r.roles.length > 0, a = r.permissions && r.permissions.length > 0;
    if (!n && !a) {
      s("no roles or permissions configured, passing through"), await t();
      return;
    }
    if (n) {
      const o = e.req.header(r.roleHeader) ?? "", i = o ? o.split(r.roleDelimiter).map((l) => l.trim()) : [];
      if (s(
        `checking roles: user=${i.join(",")} required=${r.roles.join(",")}`
      ), !r.roles.some(
        (l) => i.includes(l)
      ))
        throw new f(403, "forbidden", r.denyMessage);
    }
    if (a) {
      const o = e.req.header(r.permissionHeader) ?? "", i = o ? o.split(r.permissionDelimiter).map((l) => l.trim()) : [];
      if (s(
        `checking permissions: user=${i.join(",")} required=${r.permissions.join(",")}`
      ), !r.permissions.every(
        (l) => i.includes(l)
      ))
        throw new f(403, "forbidden", r.denyMessage);
    }
    await t();
  },
  evaluate: {
    onRequest: async (e, { config: t, debug: r }) => {
      const s = t.roles && t.roles.length > 0, n = t.permissions && t.permissions.length > 0;
      if (!s && !n)
        return r("no roles or permissions configured, passing through"), { action: "continue" };
      if (s) {
        const a = e.headers.get(t.roleHeader) ?? "", o = a ? a.split(t.roleDelimiter).map((c) => c.trim()) : [];
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
      if (n) {
        const a = e.headers.get(t.permissionHeader) ?? "", o = a ? a.split(t.permissionDelimiter).map((c) => c.trim()) : [];
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
}), Vs = /* @__PURE__ */ v({
  name: "verify-http-signature",
  priority: S.AUTH,
  defaults: {
    requiredComponents: ["@method"],
    maxAge: 300,
    signatureHeaderName: "Signature",
    signatureInputHeaderName: "Signature-Input",
    label: "sig1"
  },
  handler: async (e, t, { config: r, debug: s }) => {
    if (!r.keys || Object.keys(r.keys).length === 0)
      throw new f(
        500,
        "config_error",
        "verifyHttpSignature requires at least one key in 'keys'"
      );
    const n = r.label, a = e.req.header(
      r.signatureInputHeaderName
    );
    if (!a)
      throw new f(
        401,
        "signature_invalid",
        "Missing Signature-Input header"
      );
    const o = e.req.header(r.signatureHeaderName);
    if (!o)
      throw new f(
        401,
        "signature_invalid",
        "Missing Signature header"
      );
    const i = `${n}=`;
    if (!a.startsWith(i))
      throw new f(
        401,
        "signature_invalid",
        `Missing signature label "${n}" in Signature-Input header`
      );
    const c = a.slice(i.length), { components: l, params: u } = Yr(c);
    s(`verifying label=${n}, components=${l.join(",")}`);
    const d = `${n}=:`;
    if (!o.startsWith(d) || !o.endsWith(":"))
      throw new f(
        401,
        "signature_invalid",
        `Invalid Signature header format for label "${n}"`
      );
    const h = o.slice(d.length, -1), p = Math.floor(Date.now() / 1e3);
    if (u.created && Number.parseInt(u.created, 10) + r.maxAge < p)
      throw new f(
        401,
        "signature_invalid",
        "Signature has expired (maxAge exceeded)"
      );
    if (u.expires && Number.parseInt(u.expires, 10) < p)
      throw new f(
        401,
        "signature_invalid",
        "Signature has expired (expires parameter)"
      );
    for (const x of r.requiredComponents)
      if (!l.includes(x))
        throw new f(
          401,
          "signature_invalid",
          `Required component "${x}" not found in signature`
        );
    const y = u.keyid;
    if (!y)
      throw new f(
        401,
        "signature_invalid",
        "Missing keyid in signature parameters"
      );
    const m = r.keys[y];
    if (!m)
      throw new f(
        401,
        "signature_invalid",
        "Unknown key identifier"
      );
    const w = Rt(
      l,
      c,
      e.req.raw
    ), b = await Xr(
      m.algorithm,
      m.secret,
      m.publicKey
    ), { signAlg: T } = ue(m.algorithm), R = new TextEncoder(), O = Zr(h);
    if (!await crypto.subtle.verify(
      T,
      b,
      O,
      R.encode(w)
    ))
      throw new f(
        401,
        "signature_invalid",
        "Signature verification failed"
      );
    s("signature verified successfully"), await t();
  }
}), os = /* @__PURE__ */ new Set([204, 304]);
function _e(e, t) {
  return os.has(t) ? null : e ?? null;
}
class At {
  entries = /* @__PURE__ */ new Map();
  maxEntries;
  constructor(t) {
    this.maxEntries = t?.maxEntries;
  }
  async get(t) {
    const r = this.entries.get(t);
    return r ? Date.now() > r.expiresAt ? (this.entries.delete(t), null) : (this.entries.delete(t), this.entries.set(t, r), new Response(_e(r.body, r.status), {
      status: r.status,
      headers: r.headers
    })) : null;
  }
  async put(t, r, s) {
    const n = await r.arrayBuffer(), a = [];
    if (r.headers.forEach((o, i) => {
      a.push([i, o]);
    }), this.maxEntries && !this.entries.has(t) && this.entries.size >= this.maxEntries) {
      const o = this.entries.keys().next().value;
      o !== void 0 && this.entries.delete(o);
    }
    this.entries.set(t, {
      body: n,
      status: r.status,
      headers: a,
      expiresAt: Date.now() + s * 1e3
    });
  }
  async delete(t) {
    return this.entries.delete(t);
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
}
const ye = "x-stoma-internal-expires-at", is = /* @__PURE__ */ new Set(["POST", "PUT", "PATCH"]);
function cs(e) {
  return e ? e.split(",").map((t) => t.trim().split("=")[0].trim().toLowerCase()) : [];
}
function Ys(e) {
  const t = F(
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
  s || (s = new At());
  const n = s, a = t.cacheStatusHeader;
  async function o(c) {
    if (e?.cacheKeyFn) return await e.cacheKeyFn(c);
    let l = `${c.req.method}:${c.req.url}`;
    if (is.has(c.req.method.toUpperCase()))
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
    const u = z(c, "cache"), d = qe(c, "cache");
    if (!r.includes(c.req.method.toUpperCase())) {
      d("SKIP", { method: c.req.method }), await l(), c.res.headers.set(a, "SKIP");
      return;
    }
    const h = await o(c);
    $(c, "x-stoma-cache-key", h), $(c, "x-stoma-cache-ttl", t.ttlSeconds);
    const p = await E(
      () => n.get(h),
      null,
      u,
      "store.get()"
    );
    if (p) {
      u(`HIT ${h}`), $(c, "x-stoma-cache-status", "HIT"), d("HIT", { key: h });
      const w = p.headers.get(ye);
      if (w) {
        const R = Math.max(
          0,
          Math.ceil((Number(w) - Date.now()) / 1e3)
        );
        $(c, "x-stoma-cache-expires-in", R);
      }
      const b = await p.arrayBuffer(), T = new Response(_e(b, p.status), {
        status: p.status,
        headers: p.headers
      });
      T.headers.delete(ye), T.headers.set(a, "HIT"), c.res = T;
      return;
    }
    if (await l(), c.res.status >= 500) {
      u(`SKIP ${h} (status=${c.res.status})`), $(c, "x-stoma-cache-status", "SKIP"), c.res.headers.set(a, "SKIP");
      return;
    }
    if (t.cacheableStatuses && !t.cacheableStatuses.includes(c.res.status)) {
      u(`SKIP ${h} (status=${c.res.status} not in cacheableStatuses)`), $(c, "x-stoma-cache-status", "SKIP"), c.res.headers.set(a, "SKIP");
      return;
    }
    if (t.respectCacheControl) {
      const w = c.res.headers.get("cache-control") ?? "", b = cs(w);
      if (t.bypassDirectives.some(
        (T) => b.includes(T.toLowerCase())
      )) {
        u(`BYPASS ${h} (cache-control: ${w})`), $(c, "x-stoma-cache-status", "BYPASS"), d("BYPASS", { key: h, directive: w }), c.res.headers.set(a, "BYPASS");
        return;
      }
    }
    u(`MISS ${h} (ttl=${t.ttlSeconds}s)`), $(c, "x-stoma-cache-status", "MISS"), d("MISS", { key: h, ttl: t.ttlSeconds });
    const y = c.res.clone(), m = _e(
      await y.arrayBuffer(),
      y.status
    ), g = new Headers(y.headers);
    g.set(
      ye,
      String(Date.now() + t.ttlSeconds * 1e3)
    ), await E(
      () => n.put(
        h,
        new Response(m, {
          status: y.status,
          headers: g
        }),
        t.ttlSeconds
      ),
      void 0,
      u,
      "store.put()"
    ), c.res.headers.set(a, "MISS");
  };
  return {
    name: "cache",
    priority: S.CACHE,
    handler: H(e?.skip, i)
  };
}
const Gs = /* @__PURE__ */ v({
  name: "dynamic-routing",
  priority: S.REQUEST_TRANSFORM,
  httpOnly: !0,
  defaults: { fallthrough: !0 },
  handler: async (e, t, { config: r, debug: s }) => {
    for (const n of r.rules)
      if (await n.condition(e)) {
        s(
          `matched rule ${n.name ? `"${n.name}"` : "(unnamed)"} → target=${n.target}`
        ), e.set("_dynamicTarget", n.target), n.rewritePath && e.set("_dynamicRewrite", n.rewritePath), n.headers && e.set("_dynamicHeaders", n.headers), await t();
        return;
      }
    if (!r.fallthrough)
      throw new f(404, "no_route", "No routing rule matched");
    s("no rule matched, falling through"), await t();
  }
});
function Xs(e) {
  const t = F(
    { mode: "deny", countryHeader: "cf-ipcountry" },
    e
  ), r = new Set(
    (t.allow ?? []).map((a) => a.toUpperCase())
  ), s = new Set(
    (t.deny ?? []).map((a) => a.toUpperCase())
  ), n = async (a, o) => {
    const i = z(a, "geo-ip-filter"), c = a.req.header(t.countryHeader)?.toUpperCase(), l = t.mode;
    if (i(`country=${c ?? "unknown"} mode=${l}`), l === "allow") {
      if (!c || !r.has(c))
        throw new f(
          403,
          "geo_denied",
          "Access denied from this region"
        );
    } else if (c && s.has(c))
      throw new f(
        403,
        "geo_denied",
        "Access denied from this region"
      );
    await o();
  };
  return {
    name: "geo-ip-filter",
    priority: S.IP_FILTER,
    handler: H(e?.skip, n),
    phases: ["request-headers"],
    evaluate: {
      onRequest: async (a) => {
        const o = a.headers.get(t.countryHeader)?.toUpperCase();
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
const Qs = /* @__PURE__ */ v({
  name: "http-callout",
  priority: S.REQUEST_TRANSFORM,
  httpOnly: !0,
  defaults: { method: "GET", timeout: 5e3, abortOnFailure: !0 },
  handler: async (e, t, { config: r, debug: s }) => {
    const n = typeof r.url == "function" ? await r.url(e) : r.url, a = {};
    if (r.headers)
      for (const [c, l] of Object.entries(r.headers))
        a[c] = typeof l == "function" ? await l(e) : l;
    let o;
    if (r.body !== void 0) {
      const c = typeof r.body == "function" ? await r.body(e) : r.body;
      c != null && (o = typeof c == "string" ? c : JSON.stringify(c), typeof c != "string" && !a["content-type"] && (a["content-type"] = "application/json"));
    }
    s(`${r.method} ${n}`);
    let i;
    try {
      i = await fetch(n, {
        method: r.method,
        headers: a,
        body: o,
        signal: AbortSignal.timeout(r.timeout)
      });
    } catch (c) {
      if (r.onError) {
        await r.onError(c, e), await t();
        return;
      }
      throw new f(
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
      throw new f(
        502,
        "callout_failed",
        `External callout returned ${i.status}`
      );
    }
    await r.onResponse(i, e), await t();
  }
}), Zs = /* @__PURE__ */ v({
  name: "interrupt",
  priority: S.DEFAULT,
  httpOnly: !0,
  defaults: { statusCode: 200, headers: {} },
  handler: async (e, t, { config: r, debug: s }) => {
    if (!await r.condition(e)) {
      s("condition false, continuing pipeline"), await t();
      return;
    }
    s("condition true, short-circuiting");
    const a = new Headers(r.headers);
    let o = null;
    r.body === void 0 || r.body === null || (typeof r.body == "string" ? (o = r.body, a.has("content-type") || a.set("content-type", "text/plain")) : (o = JSON.stringify(r.body), a.has("content-type") || a.set("content-type", "application/json"))), e.res = new Response(o, {
      status: r.statusCode,
      headers: a
    });
  }
});
function Ce(e) {
  const t = e.split(".");
  if (t.length !== 4) return -1;
  let r = 0;
  for (const s of t) {
    const n = Number(s);
    if (Number.isNaN(n) || n < 0 || n > 255) return -1;
    r = r << 8 | n;
  }
  return r >>> 0;
}
function ls(e, t) {
  const r = Ce(e);
  if (r === -1 || t < 0 || t > 32) return null;
  const s = t === 0 ? 0 : -1 << 32 - t >>> 0;
  return { version: 4, network: (r & s) >>> 0, mask: s };
}
const Fe = (1n << 128n) - 1n;
function Et(e) {
  let t = e;
  const r = t.indexOf("%");
  r !== -1 && (t = t.slice(0, r)), t = t.toLowerCase();
  const s = t.indexOf("::");
  let n, a;
  if (s !== -1) {
    if (t.indexOf("::", s + 2) !== -1) return null;
    const i = t.slice(0, s), c = t.slice(s + 2);
    n = i === "" ? [] : i.split(":"), a = c === "" ? [] : c.split(":");
    const l = n.length + a.length;
    if (l > 8) return null;
    const u = 8 - l, d = [...n, ...Array(u).fill("0"), ...a];
    return ze(d);
  }
  const o = t.split(":");
  return o.length !== 8 ? null : ze(o);
}
function ze(e) {
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
function We(e, t) {
  const r = Et(e);
  if (r === null || t < 0 || t > 128) return null;
  const s = t === 0 ? 0n : Fe << BigInt(128 - t) & Fe;
  return { version: 6, network: r & s, mask: s };
}
function $e(e) {
  return e.includes(":");
}
function Oe(e) {
  const t = e.indexOf("/");
  if (t === -1) {
    if ($e(e))
      return We(e, 128);
    const n = Ce(e);
    return n === -1 ? null : { version: 4, network: n, mask: 4294967295 };
  }
  const r = e.slice(0, t), s = Number(e.slice(t + 1));
  return Number.isNaN(s) ? null : $e(r) ? We(r, s) : ls(r, s);
}
function ke(e, t) {
  if ($e(e)) {
    const s = Et(e);
    if (s === null) return !1;
    for (const n of t)
      if (n.version === 6 && (s & n.mask) === n.network)
        return !0;
    return !1;
  }
  const r = Ce(e);
  if (r === -1) return !1;
  for (const s of t)
    if (s.version === 4 && (r & s.mask) >>> 0 === s.network)
      return !0;
  return !1;
}
const us = ["cf-connecting-ip", "x-forwarded-for"];
function ae(e, t = {}) {
  const {
    ipHeaders: r = us,
    trustedProxies: s,
    useRightmostForwardedIp: n = !1
  } = t, a = s ? s.map((o) => Oe(o)).filter((o) => o !== null) : null;
  for (const o of r) {
    const i = e.get(o);
    if (!i) continue;
    const c = i.split(",").map((u) => u.trim()), l = n ? c[c.length - 1] : c[0];
    if (!(a && o.toLowerCase() === "x-forwarded-for" && !ke(l, a)))
      return l;
  }
  return "unknown";
}
function en(e) {
  const t = e.mode ?? "deny", r = e.ipHeaders ? { ipHeaders: e.ipHeaders } : {}, s = (e.allow ?? []).map(Oe).filter((i) => i !== null), n = (e.deny ?? []).map(Oe).filter((i) => i !== null);
  function a(i) {
    if (t === "allow") {
      if (!ke(i, s))
        return {
          action: "reject",
          status: 403,
          code: "ip_denied",
          message: "Access denied"
        };
    } else if (ke(i, n))
      return {
        action: "reject",
        status: 403,
        code: "ip_denied",
        message: "Access denied"
      };
    return { action: "continue" };
  }
  const o = async (i, c) => {
    const l = ae(i.req.raw.headers, r), u = a(l);
    if (u.action === "reject")
      throw new f(u.status, u.code, u.message);
    await c();
  };
  return {
    name: "ip-filter",
    priority: S.IP_FILTER,
    handler: H(e.skip, o),
    phases: ["request-headers"],
    // ── Protocol-agnostic evaluator ────────────────────────────────
    evaluate: {
      onRequest: async (i) => {
        const c = i.clientIp ?? ae(i.headers, r);
        return a(c);
      }
    }
  };
}
function oe(e, t, r = 0) {
  if (r > t.maxDepth)
    throw new f(400, "json_threat", "JSON exceeds maximum depth");
  if (typeof e == "string" && e.length > t.maxStringLength)
    throw new f(
      400,
      "json_threat",
      "String value exceeds maximum length"
    );
  if (Array.isArray(e)) {
    if (e.length > t.maxArraySize)
      throw new f(400, "json_threat", "Array exceeds maximum size");
    for (const s of e)
      oe(s, t, r + 1);
  } else if (e !== null && typeof e == "object") {
    const s = Object.keys(e);
    if (s.length > t.maxKeys)
      throw new f(
        400,
        "json_threat",
        "Object exceeds maximum key count"
      );
    for (const n of s) {
      if (n.length > t.maxStringLength)
        throw new f(
          400,
          "json_threat",
          "String value exceeds maximum length"
        );
      oe(
        e[n],
        t,
        r + 1
      );
    }
  }
}
const tn = /* @__PURE__ */ v({
  name: "json-threat-protection",
  priority: S.EARLY,
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
    const n = e.req.header("content-type") ?? "";
    if (!r.contentTypes.some(
      (u) => n.includes(u)
    )) {
      s("skipping - content type %s not inspected", n), await t();
      return;
    }
    const o = e.req.header("content-length");
    if (o !== void 0) {
      const u = Number.parseInt(o, 10);
      if (!Number.isNaN(u) && u > r.maxBodySize)
        throw s("body size %d exceeds max %d", u, r.maxBodySize), new f(
          413,
          "body_too_large",
          "Request body exceeds maximum size"
        );
    }
    const c = await e.req.raw.clone().text();
    if (!c) {
      s("empty body - passing through"), await t();
      return;
    }
    let l;
    try {
      l = JSON.parse(c);
    } catch {
      throw s("invalid JSON"), new f(
        400,
        "invalid_json",
        "Invalid JSON in request body"
      );
    }
    oe(l, {
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
        return r("skipping - content type %s not inspected", s), { action: "continue" };
      const a = e.headers.get("content-length");
      if (a) {
        const i = Number.parseInt(a, 10);
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
          return r("empty body - passing through"), { action: "continue" };
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
        oe(o, {
          maxDepth: t.maxDepth,
          maxKeys: t.maxKeys,
          maxStringLength: t.maxStringLength,
          maxArraySize: t.maxArraySize
        });
      } catch (i) {
        if (i instanceof f)
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
});
class _t {
  counters = /* @__PURE__ */ new Map();
  cleanupInterval = null;
  /** Maximum number of unique keys to prevent memory exhaustion */
  maxKeys;
  cleanupIntervalMs;
  constructor(t) {
    typeof t == "number" ? (this.maxKeys = t, this.cleanupIntervalMs = 6e4) : (this.maxKeys = t?.maxKeys ?? 1e5, this.cleanupIntervalMs = t?.cleanupIntervalMs ?? 6e4);
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
   * the cost of potentially rejecting legitimate requests - an intentional
   * security trade-off where memory safety takes priority over availability.
   */
  async increment(t, r) {
    this.ensureCleanupInterval();
    const s = Date.now(), n = this.counters.get(t);
    if (n && n.resetAt > s)
      return n.count++, { count: n.count, resetAt: n.resetAt };
    if (this.counters.size >= this.maxKeys && !n && (this.cleanup(), this.counters.size >= this.maxKeys)) {
      const i = s + r * 1e3;
      return { count: Number.MAX_SAFE_INTEGER, resetAt: i };
    }
    const a = s + r * 1e3, o = { count: 1, resetAt: a };
    return this.counters.set(t, o), { count: 1, resetAt: a };
  }
  cleanup() {
    const t = Date.now();
    for (const [r, s] of this.counters)
      s.resetAt <= t && this.counters.delete(r);
  }
  /** Stop the cleanup interval (for testing) */
  destroy() {
    this.cleanupInterval && (clearInterval(this.cleanupInterval), this.cleanupInterval = null);
  }
  /** Reset all counters (for testing) */
  reset() {
    this.counters.clear();
  }
}
const Ve = /* @__PURE__ */ new WeakMap();
function ds(e) {
  if (e.store) return e.store;
  let t = Ve.get(e);
  return t || (t = new _t(), Ve.set(e, t)), t;
}
const rn = /* @__PURE__ */ v({
  name: "rate-limit",
  priority: S.RATE_LIMIT,
  defaults: {
    windowSeconds: 60,
    statusCode: 429,
    message: "Rate limit exceeded"
  },
  handler: async (e, t, { config: r, debug: s, trace: n }) => {
    const a = ds(r);
    let o;
    r.keyBy ? o = await r.keyBy(e) : o = ae(e.req.raw.headers, { ipHeaders: r.ipHeaders });
    const i = await E(
      () => a.increment(o, r.windowSeconds),
      null,
      s,
      "store.increment()"
    );
    if (!i) {
      s(`store unavailable, failing open (key=${o})`), await t();
      return;
    }
    const { count: c, resetAt: l } = i, u = Math.max(0, r.max - c), d = Math.ceil((l - Date.now()) / 1e3);
    if ($(e, "x-stoma-ratelimit-key", o), $(e, "x-stoma-ratelimit-window", r.windowSeconds), c > r.max) {
      s(`limited (key=${o}, count=${c}, max=${r.max})`), n("rejected", { key: o, count: c, max: r.max });
      const h = String(d);
      throw new f(
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
    n("allowed", { key: o, count: c, max: r.max, remaining: u }), await t(), e.res.headers.set("x-ratelimit-limit", String(r.max)), e.res.headers.set("x-ratelimit-remaining", String(u)), e.res.headers.set("x-ratelimit-reset", String(d));
  }
}), Ye = /* @__PURE__ */ new WeakMap();
function hs(e, t) {
  let r = Ye.get(e);
  if (!r) {
    const s = t.replace(/g/g, "");
    s !== t && console.warn(
      "[stoma:regex-threat-protection] Stripped 'g' flag - not meaningful with .test()"
    ), r = e.map((n) => ({
      regex: new RegExp(n.regex, s),
      targets: n.targets,
      message: n.message ?? "Request blocked by threat protection"
    })), Ye.set(e, r);
  }
  return r;
}
const sn = /* @__PURE__ */ v({
  name: "regex-threat-protection",
  priority: S.EARLY,
  defaults: {
    patterns: [],
    flags: "i",
    contentTypes: ["application/json", "text/plain"],
    maxBodyScanLength: 65536
  },
  handler: async (e, t, { config: r, debug: s }) => {
    const n = hs(
      r.patterns,
      r.flags ?? "i"
    );
    if (n.length === 0) {
      s("no patterns configured - passing through"), await t();
      return;
    }
    const a = n.some((i) => i.targets.includes("body"));
    let o = null;
    if (a) {
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
            const m = await u.read();
            m.done ? p = !0 : d += y.decode(m.value, { stream: !0 });
          }
          u.cancel(), d.length > h && (d = d.slice(0, h)), o = d || null;
        }
      }
    }
    for (const i of n) {
      if (i.targets.includes("path") && i.regex.test(e.req.path))
        throw s("path matched pattern: %s", i.regex.source), new f(400, "threat_detected", i.message);
      if (i.targets.includes("query")) {
        const c = new URL(e.req.url), l = decodeURIComponent(c.search.slice(1));
        if (l && i.regex.test(l))
          throw s("query matched pattern: %s", i.regex.source), new f(400, "threat_detected", i.message);
      }
      if (i.targets.includes("headers")) {
        for (const [, c] of e.req.raw.headers.entries())
          if (i.regex.test(c))
            throw s("header matched pattern: %s", i.regex.source), new f(400, "threat_detected", i.message);
      }
      if (i.targets.includes("body") && o && i.regex.test(o))
        throw s("body matched pattern: %s", i.regex.source), new f(400, "threat_detected", i.message);
    }
    s("all patterns passed"), await t();
  }
}), nn = /* @__PURE__ */ v({
  name: "request-limit",
  priority: S.EARLY,
  phases: ["request-headers"],
  defaults: {
    message: "Request body too large"
  },
  handler: async (e, t, { config: r }) => {
    const s = e.req.header("content-length");
    if (s !== void 0) {
      const n = Number.parseInt(s, 10);
      if (!Number.isNaN(n) && n > r.maxBytes)
        throw new f(413, "request_too_large", r.message);
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
function ps(e, t) {
  const r = t.split(".");
  let s = e;
  for (let n = 0; n < r.length - 1; n++) {
    if (s == null || typeof s != "object") return;
    s = s[r[n]];
  }
  s != null && typeof s == "object" && delete s[r[r.length - 1]];
}
function fs(e, t) {
  const r = {};
  for (const s of t) {
    const n = s.split(".");
    let a = e, o = r;
    for (let i = 0; i < n.length && !(a == null || typeof a != "object"); i++)
      i === n.length - 1 ? n[i] in a && (o[n[i]] = a[n[i]]) : (n[i] in o || (o[n[i]] = {}), o = o[n[i]], a = a[n[i]]);
  }
  return r;
}
function Q(e, t, r) {
  if (t === "allow")
    return fs(e, r);
  const s = structuredClone(e);
  for (const n of r)
    ps(s, n);
  return s;
}
const an = /* @__PURE__ */ v({
  name: "resource-filter",
  priority: S.RESPONSE_TRANSFORM,
  phases: ["response-body"],
  defaults: {
    contentTypes: ["application/json"],
    applyToArrayItems: !0
  },
  handler: async (e, t, { config: r, debug: s }) => {
    if (await t(), r.fields.length === 0) {
      s("no fields configured - passing through");
      return;
    }
    const n = e.res.headers.get("content-type") ?? "";
    if (!r.contentTypes.some(
      (c) => n.includes(c)
    )) {
      s(
        "skipping - response content type %s not in %o",
        n,
        r.contentTypes
      );
      return;
    }
    let o;
    try {
      const c = await e.res.text();
      o = JSON.parse(c);
    } catch {
      s("response body is not valid JSON - passing through");
      return;
    }
    let i;
    Array.isArray(o) ? r.applyToArrayItems ? i = o.map(
      (c) => c != null && typeof c == "object" ? Q(
        c,
        r.mode,
        r.fields
      ) : c
    ) : i = o : o != null && typeof o == "object" ? i = Q(
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
        return r("no fields configured - passing through"), { action: "continue" };
      const s = e.headers.get("content-type") ?? "";
      if (!t.contentTypes.some(
        (i) => s.includes(i)
      ))
        return r(
          "skipping - response content type %s not in %o",
          s,
          t.contentTypes
        ), { action: "continue" };
      let a;
      try {
        if (!e.body)
          return { action: "continue" };
        const i = typeof e.body == "string" ? e.body : new TextDecoder().decode(e.body);
        a = JSON.parse(i);
      } catch {
        return r("response body is not valid JSON - passing through"), { action: "continue" };
      }
      let o;
      return Array.isArray(a) ? t.applyToArrayItems ? o = a.map(
        (i) => i != null && typeof i == "object" ? Q(
          i,
          t.mode,
          t.fields
        ) : i
      ) : o = a : a != null && typeof a == "object" ? o = Q(
        a,
        t.mode,
        t.fields
      ) : o = a, r(
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
}), on = /* @__PURE__ */ v({
  name: "ssl-enforce",
  priority: S.EARLY,
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
      throw new f(403, "ssl_required", "HTTPS is required");
    }
    await t();
    let a = `max-age=${r.hstsMaxAge}`;
    r.includeSubDomains && (a += "; includeSubDomains"), r.preload && (a += "; preload"), e.res.headers.set("Strict-Transport-Security", a);
  }
}), ms = /* @__PURE__ */ new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]), cn = /* @__PURE__ */ v({
  name: "traffic-shadow",
  priority: S.RESPONSE_TRANSFORM,
  httpOnly: !0,
  defaults: {
    target: "",
    percentage: 100,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    mirrorBody: !0,
    timeout: 5e3
  },
  handler: async (e, t, { config: r, debug: s }) => {
    let n = null;
    if (r.mirrorBody)
      try {
        n = await e.req.raw.clone().arrayBuffer(), n.byteLength === 0 && (n = null);
      } catch {
        n = null;
      }
    await t();
    const a = e.req.method.toUpperCase();
    if (!new Set(
      (r.methods ?? []).map((g) => g.toUpperCase())
    ).has(a)) {
      s("method %s not in shadow methods - skipping", a);
      return;
    }
    const i = Math.random() * 100;
    if (i >= (r.percentage ?? 100)) {
      s("rolled %.1f >= %d%% - skipping shadow", i, r.percentage);
      return;
    }
    const c = new URL(e.req.url), u = `${r.target.replace(/\/$/, "")}${c.pathname}${c.search}`, d = new Headers();
    for (const [g, w] of e.req.raw.headers.entries())
      ms.has(g.toLowerCase()) || d.set(g, w);
    s("shadowing %s %s → %s", a, c.pathname, u);
    const h = new AbortController(), p = setTimeout(
      () => h.abort(),
      r.timeout ?? 5e3
    ), y = fetch(u, {
      method: a,
      headers: d,
      body: r.mirrorBody && n ? n : void 0,
      signal: h.signal,
      redirect: "manual"
    }).catch((g) => {
      s("shadow request failed: %s", String(g)), r.onError?.(g);
    }).finally(() => {
      clearTimeout(p);
    }), m = W(e);
    m?.adapter?.waitUntil && m.adapter.waitUntil(y);
  }
});
function $t() {
  return {
    state: "closed",
    failureCount: 0,
    successCount: 0,
    lastFailureTime: 0,
    lastStateChange: Date.now()
  };
}
class Ot {
  circuits = /* @__PURE__ */ new Map();
  getOrCreate(t) {
    let r = this.circuits.get(t);
    return r || (r = $t(), this.circuits.set(t, r)), r;
  }
  async getState(t) {
    return { ...this.getOrCreate(t) };
  }
  async recordSuccess(t) {
    const r = this.getOrCreate(t);
    return r.successCount++, { ...r };
  }
  async recordFailure(t) {
    const r = this.getOrCreate(t);
    return r.failureCount++, r.lastFailureTime = Date.now(), { ...r };
  }
  async transition(t, r) {
    const s = this.getOrCreate(t);
    return s.state = r, s.lastStateChange = Date.now(), r === "closed" && (s.failureCount = 0, s.successCount = 0), r === "half-open" && (s.successCount = 0), { ...s };
  }
  async reset(t) {
    this.circuits.delete(t);
  }
  /** Remove all circuits (for testing) */
  clear() {
    this.circuits.clear();
  }
  /** Release all state. */
  destroy() {
    this.circuits.clear();
  }
}
async function U(e, t, r, s, n, a) {
  await E(
    () => e.transition(t, s),
    void 0,
    a,
    "store.transition()"
  ), n && await E(
    () => Promise.resolve(n(t, r, s)),
    void 0,
    a,
    "onStateChange()"
  );
}
function ln(e) {
  const t = F(
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
  r || (r = new Ot());
  const s = r, n = e?.onStateChange, a = /* @__PURE__ */ new Map(), o = async (i, c) => {
    const l = z(i, "circuit-breaker"), u = e?.key ? e.key(i) : new URL(i.req.url).pathname, d = await E(
      () => s.getState(u),
      $t(),
      l,
      "store.getState()"
    ), h = Date.now();
    if ($(i, "x-stoma-circuit-key", u), $(i, "x-stoma-circuit-state", d.state), $(i, "x-stoma-circuit-failures", d.failureCount), d.state === "open")
      if (h - d.lastStateChange >= t.resetTimeoutMs)
        l(`open -> half-open (key=${u})`), await U(
          s,
          u,
          "open",
          "half-open",
          n,
          l
        ), a.set(u, 0);
      else {
        const p = Math.ceil(
          (t.resetTimeoutMs - (h - d.lastStateChange)) / 1e3
        );
        throw new f(
          t.openStatusCode,
          "circuit_open",
          "Service temporarily unavailable",
          { "retry-after": String(p) }
        );
      }
    if (d.state === "half-open" || d.state === "open" && h - d.lastStateChange >= t.resetTimeoutMs) {
      const p = a.get(u) ?? 0;
      if (p >= t.halfOpenMax)
        throw new f(
          t.openStatusCode,
          "circuit_open",
          "Service temporarily unavailable",
          { "retry-after": String(Math.ceil(t.resetTimeoutMs / 1e3)) }
        );
      a.set(u, p + 1);
      try {
        await c(), t.failureOn.includes(i.res.status) ? (l(
          `half-open probe failed (key=${u}, status=${i.res.status}) -> open`
        ), await E(
          () => s.recordFailure(u),
          void 0,
          l,
          "store.recordFailure()"
        ), await U(
          s,
          u,
          "half-open",
          "open",
          n,
          l
        )) : (l(`half-open probe succeeded (key=${u}) -> closed`), await E(
          () => s.recordSuccess(u),
          void 0,
          l,
          "store.recordSuccess()"
        ), await U(
          s,
          u,
          "half-open",
          "closed",
          n,
          l
        ), a.delete(u));
      } catch (y) {
        throw l(`half-open probe threw (key=${u}) -> open`), await E(
          () => s.recordFailure(u),
          void 0,
          l,
          "store.recordFailure()"
        ), await U(
          s,
          u,
          "half-open",
          "open",
          n,
          l
        ), y;
      } finally {
        const y = a.get(u) ?? 1;
        y <= 1 ? a.delete(u) : a.set(u, y - 1);
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
      ), await U(
        s,
        u,
        "closed",
        "open",
        n,
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
      ), await U(
        s,
        u,
        "closed",
        "open",
        n,
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
    priority: S.CIRCUIT_BREAKER,
    handler: H(e?.skip, o),
    httpOnly: !0
  };
}
const un = /* @__PURE__ */ v({
  name: "latency-injection",
  priority: S.EARLY,
  httpOnly: !0,
  defaults: { jitter: 0, probability: 1 },
  handler: async (e, t, { config: r, debug: s }) => {
    if (Math.random() >= r.probability) {
      s("skipping injection (probability miss)"), await t();
      return;
    }
    let n = r.delayMs;
    r.jitter > 0 && (n += (Math.random() * 2 - 1) * r.jitter * r.delayMs), n = Math.max(0, n), s(`injecting ${n.toFixed(0)}ms latency`), await new Promise((a) => setTimeout(a, n)), await t();
  }
}), ys = ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"];
function ws(e) {
  return new Promise((t) => setTimeout(t, e));
}
function gs(e, t, r, s) {
  const n = Math.random() * r;
  return t === "fixed" ? r + n : Math.min(r * 2 ** e + n, s);
}
function dn(e) {
  const t = F(
    {
      maxRetries: 3,
      retryOn: [502, 503, 504],
      backoff: "exponential",
      baseDelayMs: 200,
      maxDelayMs: 5e3,
      retryMethods: ys,
      retryCountHeader: "x-retry-count"
    },
    e
  ), r = async (s, n) => {
    const a = z(s, "retry"), o = s.req.method.toUpperCase();
    if (!t.retryMethods.includes(o)) {
      await n();
      return;
    }
    await n();
    const i = s.get("_proxyRequest");
    if (!i)
      return;
    let c = 0;
    for (let l = 0; l < t.maxRetries && t.retryOn.includes(s.res.status); l++) {
      const u = gs(
        l,
        t.backoff,
        t.baseDelayMs,
        t.maxDelayMs
      );
      a(
        `attempt ${l + 1}/${t.maxRetries} failed (status=${s.res.status}), retrying in ${Math.round(u)}ms`
      ), await s.res.body?.cancel(), await ws(u);
      let d;
      try {
        d = await fetch(i.clone());
      } catch {
        a(`retry attempt ${l + 1} fetch error, synthesizing 502`), d = new Response(null, { status: 502 });
      }
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
    priority: S.RETRY,
    handler: H(e?.skip, r),
    httpOnly: !0
  };
}
const hn = /* @__PURE__ */ v({
  name: "timeout",
  priority: S.TIMEOUT,
  httpOnly: !0,
  defaults: { timeoutMs: 3e4, message: "Gateway timeout", statusCode: 504 },
  handler: async (e, t, { config: r, trace: s }) => {
    const n = new AbortController(), a = setTimeout(() => n.abort(), r.timeoutMs);
    e.set("_timeoutSignal", n.signal);
    try {
      const o = Date.now();
      await Promise.race([
        t(),
        new Promise((i, c) => {
          n.signal.addEventListener(
            "abort",
            () => c(
              new f(
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
      throw o instanceof f && o.code === "gateway_timeout" && s("fired", { budgetMs: r.timeoutMs }), o;
    } finally {
      clearTimeout(a);
    }
  }
}), pn = /* @__PURE__ */ v({
  name: "assign-attributes",
  priority: S.REQUEST_TRANSFORM,
  phases: ["request-headers"],
  handler: async (e, t, { config: r, debug: s }) => {
    for (const [n, a] of Object.entries(r.attributes))
      if (typeof a == "function") {
        const o = await a(e);
        e.set(n, o), s("set %s = %s (dynamic)", n, o);
      } else
        e.set(n, a), s("set %s = %s (static)", n, a);
    await t();
  },
  evaluate: {
    onRequest: async (e, { config: t, debug: r }) => {
      const s = [];
      for (const [n, a] of Object.entries(t.attributes)) {
        const o = typeof a == "function" ? a({}) : a;
        r("set %s = %s", n, o), s.push({
          type: "attribute",
          key: n,
          value: o
        });
      }
      return { action: "continue", mutations: s };
    }
  }
});
async function Ge(e, t) {
  const r = {};
  for (const [s, n] of Object.entries(t))
    typeof n == "function" ? r[s] = await n(e) : r[s] = n;
  return r;
}
function Z(e, t) {
  return e ? t.some((r) => e.includes(r)) : !1;
}
const fn = /* @__PURE__ */ v({
  name: "assign-content",
  priority: S.REQUEST_TRANSFORM,
  defaults: {
    contentTypes: ["application/json"]
  },
  handler: async (e, t, { config: r, debug: s }) => {
    if (r.request) {
      const n = e.req.header("content-type");
      if (Z(n, r.contentTypes)) {
        let a = {};
        try {
          const l = await e.req.raw.clone().text();
          l && (a = JSON.parse(l));
        } catch {
        }
        const o = await Ge(e, r.request);
        Object.assign(a, o), s(
          "assigned %d fields to request body",
          Object.keys(o).length
        );
        const i = new Request(e.req.url, {
          method: e.req.method,
          headers: e.req.raw.headers,
          body: JSON.stringify(a),
          // @ts-expect-error -- duplex required for streams in some runtimes
          duplex: "half"
        });
        Object.defineProperty(e.req, "raw", {
          value: i,
          configurable: !0
        });
      } else
        s(
          "request content-type %s not in allowed types - skipping request modification",
          n
        );
    }
    if (await t(), r.response) {
      const n = e.res.headers.get("content-type");
      if (Z(n ?? void 0, r.contentTypes)) {
        let a = {};
        try {
          const c = await e.res.text();
          c && (a = JSON.parse(c));
        } catch {
        }
        const o = await Ge(e, r.response);
        Object.assign(a, o), s(
          "assigned %d fields to response body",
          Object.keys(o).length
        );
        const i = new Response(JSON.stringify(a), {
          status: e.res.status,
          headers: e.res.headers
        });
        e.res = i;
      } else
        s(
          "response content-type %s not in allowed types - skipping response modification",
          n
        );
    }
  },
  evaluate: {
    onRequest: async (e, { config: t, debug: r }) => {
      if (!t.request)
        return { action: "continue" };
      const s = e.headers.get("content-type") ?? "";
      if (!Z(s, t.contentTypes))
        return r(
          "request content-type %s not in allowed types - skipping request modification",
          s
        ), { action: "continue" };
      let n = {};
      try {
        if (e.body) {
          const a = typeof e.body == "string" ? e.body : new TextDecoder().decode(e.body);
          a && (n = JSON.parse(a));
        }
      } catch {
      }
      for (const [a, o] of Object.entries(t.request))
        typeof o == "function" ? n[a] = o({}) : n[a] = o;
      return r(
        "assigned %d fields to request body",
        Object.keys(t.request).length
      ), {
        action: "continue",
        mutations: [
          {
            type: "body",
            op: "replace",
            content: JSON.stringify(n)
          }
        ]
      };
    },
    onResponse: async (e, { config: t, debug: r }) => {
      if (!t.response)
        return { action: "continue" };
      const s = e.headers.get("content-type") ?? "";
      if (!Z(s, t.contentTypes))
        return r(
          "response content-type %s not in allowed types - skipping response modification",
          s
        ), { action: "continue" };
      let n = {};
      try {
        if (e.body) {
          const a = typeof e.body == "string" ? e.body : new TextDecoder().decode(e.body);
          a && (n = JSON.parse(a));
        }
      } catch {
      }
      for (const [a, o] of Object.entries(t.response))
        typeof o == "function" ? n[a] = o({}) : n[a] = o;
      return r(
        "assigned %d fields to response body",
        Object.keys(t.response).length
      ), {
        action: "continue",
        mutations: [
          {
            type: "body",
            op: "replace",
            content: JSON.stringify(n)
          }
        ]
      };
    }
  }
});
var Ss = (e) => {
  const r = {
    ...{
      origin: "*",
      allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
      allowHeaders: [],
      exposeHeaders: []
    },
    ...e
  }, s = /* @__PURE__ */ ((a) => typeof a == "string" ? a === "*" ? () => a : (o) => a === o ? o : null : typeof a == "function" ? a : (o) => a.includes(o) ? o : null)(r.origin), n = ((a) => typeof a == "function" ? a : Array.isArray(a) ? () => a : () => [])(r.allowMethods);
  return async function(o, i) {
    function c(u, d) {
      o.res.headers.set(u, d);
    }
    const l = await s(o.req.header("origin") || "", o);
    if (l && c("Access-Control-Allow-Origin", l), r.credentials && c("Access-Control-Allow-Credentials", "true"), r.exposeHeaders?.length && c("Access-Control-Expose-Headers", r.exposeHeaders.join(",")), o.req.method === "OPTIONS") {
      r.origin !== "*" && c("Vary", "Origin"), r.maxAge != null && c("Access-Control-Max-Age", r.maxAge.toString());
      const u = await n(o.req.header("origin") || "", o);
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
};
function mn(e) {
  const t = e?.origins ?? "*", r = Ss({
    origin: typeof t == "function" ? (s) => t(s) ? s : "" : t,
    allowMethods: e?.methods,
    allowHeaders: e?.allowHeaders,
    exposeHeaders: e?.exposeHeaders,
    maxAge: e?.maxAge,
    credentials: e?.credentials
  });
  return {
    name: "cors",
    priority: S.EARLY,
    handler: H(e?.skip, r),
    httpOnly: !0
  };
}
const yn = /* @__PURE__ */ v({
  name: "json-validation",
  priority: S.AUTH,
  phases: ["request-body"],
  defaults: {
    contentTypes: ["application/json"],
    rejectStatus: 422,
    errorDetail: !0
  },
  handler: async (e, t, { config: r, debug: s }) => {
    const n = e.req.header("content-type") ?? "";
    if (!r.contentTypes.some(
      (c) => n.includes(c)
    )) {
      s(
        "skipping - content type %s not in %o",
        n,
        r.contentTypes
      ), await t();
      return;
    }
    let o;
    try {
      const l = await e.req.raw.clone().text();
      if (!l)
        throw s("empty body with JSON content type"), new f(
          r.rejectStatus,
          "validation_failed",
          "Request body is empty"
        );
      o = JSON.parse(l);
    } catch (c) {
      throw c instanceof f ? c : (s("body parse failed"), new f(
        r.rejectStatus,
        "validation_failed",
        "Request body is not valid JSON"
      ));
    }
    if (!r.validate) {
      s("no validator configured - JSON parsed successfully"), await t();
      return;
    }
    const i = await r.validate(o);
    if (!i.valid) {
      const c = r.errorDetail && i.errors && i.errors.length > 0 ? `Validation failed: ${i.errors.join("; ")}` : "Validation failed";
      throw s("validation failed: %s", c), new f(
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
          "skipping - content type %s not in %o",
          s,
          t.contentTypes
        ), { action: "continue" };
      let a;
      try {
        if (!e.body)
          return r("empty body with JSON content type"), {
            action: "reject",
            status: t.rejectStatus,
            code: "validation_failed",
            message: "Request body is empty"
          };
        const i = typeof e.body == "string" ? e.body : new TextDecoder().decode(e.body);
        a = JSON.parse(i);
      } catch {
        return r("body parse failed"), {
          action: "reject",
          status: t.rejectStatus,
          code: "validation_failed",
          message: "Request body is not valid JSON"
        };
      }
      if (!t.validate)
        return r("no validator configured - JSON parsed successfully"), { action: "continue" };
      const o = await t.validate(a);
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
}), wn = /* @__PURE__ */ v({
  name: "override-method",
  priority: S.EARLY,
  phases: ["request-headers"],
  defaults: {
    header: "X-HTTP-Method-Override",
    allowedMethods: ["GET", "PUT", "PATCH", "DELETE"]
  },
  handler: async (e, t, { config: r, debug: s }) => {
    const n = e.req.header(r.header);
    if (!n) {
      await t();
      return;
    }
    if (e.req.method !== "POST") {
      s(`ignoring override on ${e.req.method} request`), await t();
      return;
    }
    const a = n.toUpperCase();
    if (!new Set(
      (r.allowedMethods ?? []).map((c) => c.toUpperCase())
    ).has(a))
      throw new f(
        400,
        "invalid_method_override",
        `Method override not allowed: ${a}`
      );
    s(`overriding POST → ${a}`);
    const i = new Request(e.req.url, {
      method: a,
      headers: e.req.raw.headers,
      body: e.req.raw.body,
      // @ts-expect-error -- duplex is required for streams but not in all type definitions
      duplex: "half"
    });
    Object.defineProperty(e.req, "raw", { value: i, configurable: !0 }), await t();
  }
});
function Xe(e) {
  return typeof e == "boolean" ? { valid: e } : e;
}
const gn = /* @__PURE__ */ v({
  name: "request-validation",
  priority: S.AUTH,
  phases: ["request-body"],
  defaults: {
    contentTypes: ["application/json"],
    errorMessage: "Request validation failed"
  },
  handler: async (e, t, { config: r, debug: s }) => {
    const n = e.req.header("content-type") ?? "";
    if (!r.contentTypes.some(
      (u) => n.includes(u)
    )) {
      s(
        "skipping - content type %s not in %o",
        n,
        r.contentTypes
      ), await t();
      return;
    }
    let o;
    try {
      const d = await e.req.raw.clone().text();
      o = JSON.parse(d);
    } catch {
      throw s("body parse failed"), new f(
        400,
        "validation_failed",
        `${r.errorMessage}: invalid JSON`
      );
    }
    const i = r.validateAsync ?? r.validate;
    if (!i) {
      s("no validator configured - passing through"), await t();
      return;
    }
    const c = await i(o), l = Xe(c);
    if (!l.valid) {
      const u = l.errors && l.errors.length > 0 ? `${r.errorMessage}: ${l.errors.join("; ")}` : r.errorMessage;
      throw s("validation failed: %s", u), new f(400, "validation_failed", u);
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
          "skipping - content type %s not in %o",
          s,
          t.contentTypes
        ), { action: "continue" };
      let a;
      try {
        if (!e.body)
          return r("body parse failed"), {
            action: "reject",
            status: 400,
            code: "validation_failed",
            message: `${t.errorMessage}: invalid JSON`
          };
        const l = typeof e.body == "string" ? e.body : new TextDecoder().decode(e.body);
        a = JSON.parse(l);
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
        return r("no validator configured - passing through"), { action: "continue" };
      const i = await o(a), c = Xe(i);
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
}), Sn = /* @__PURE__ */ v({
  name: "request-transform",
  priority: S.REQUEST_TRANSFORM,
  phases: ["request-headers"],
  handler: async (e, t, { config: r }) => {
    const s = r.setHeaders, n = r.removeHeaders, a = r.renameHeaders;
    I(e, (o) => {
      if (a)
        for (const [i, c] of Object.entries(a)) {
          const l = o.get(i);
          l !== null && (o.set(c, l), o.delete(i));
        }
      if (s)
        for (const [i, c] of Object.entries(s))
          o.set(i, c);
      if (n)
        for (const i of n)
          o.delete(i);
    }), await t();
  },
  evaluate: {
    onRequest: async (e, { config: t }) => {
      const r = [];
      if (t.setHeaders)
        for (const [s, n] of Object.entries(t.setHeaders))
          r.push({
            type: "header",
            op: "set",
            name: s,
            value: n
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
}), vn = /* @__PURE__ */ v({
  name: "response-transform",
  priority: S.RESPONSE_TRANSFORM,
  phases: ["response-headers"],
  handler: async (e, t, { config: r }) => {
    if (await t(), r.renameHeaders)
      for (const [s, n] of Object.entries(r.renameHeaders)) {
        const a = e.res.headers.get(s);
        a !== null && (e.res.headers.set(n, a), e.res.headers.delete(s));
      }
    if (r.setHeaders)
      for (const [s, n] of Object.entries(r.setHeaders))
        e.res.headers.set(s, n);
    if (r.removeHeaders)
      for (const s of r.removeHeaders)
        e.res.headers.delete(s);
  },
  evaluate: {
    onResponse: async (e, { config: t }) => {
      const r = [];
      if (t.setHeaders)
        for (const [s, n] of Object.entries(t.setHeaders))
          r.push({
            type: "header",
            op: "set",
            name: s,
            value: n
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
function Tn(e) {
  const t = e?.path ?? "/health", r = e?.upstreamProbes ?? [], s = e?.includeUpstreamStatus ?? !1, n = e?.probeTimeoutMs ?? 5e3, a = e?.probeMethod ?? "HEAD", o = e?.unhealthyStatusCode ?? 503;
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
                const m = await fetch(p, {
                  method: a,
                  signal: AbortSignal.timeout(n)
                });
                return {
                  url: p,
                  status: m.ok ? "healthy" : "unhealthy",
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
const bn = /* @__PURE__ */ v({
  name: "assign-metrics",
  priority: S.OBSERVABILITY,
  httpOnly: !0,
  handler: async (e, t, { config: r, debug: s }) => {
    const n = {};
    for (const [a, o] of Object.entries(r.tags))
      typeof o == "function" ? (n[a] = await E(
        () => Promise.resolve(o(e)),
        "unknown",
        s,
        `tag resolver(${a})`
      ), s("tag %s = %s (dynamic)", a, n[a])) : (n[a] = o, s("tag %s = %s (static)", a, o));
    e.set("_metricsTags", n), await t();
  }
}), xn = /* @__PURE__ */ v({
  name: "metrics-reporter",
  priority: S.METRICS,
  httpOnly: !0,
  handler: async (e, t, { config: r, debug: s, gateway: n }) => {
    const a = Date.now();
    await t(), await E(
      async () => {
        const o = e.get("_metricsTags"), i = {};
        if (o)
          for (const [h, p] of Object.entries(o))
            typeof p == "string" && (i[h] = p);
        const c = new URL(e.req.url), l = {
          ...i,
          method: e.req.method,
          path: n?.routePath ?? c.pathname,
          status: String(e.res.status),
          gateway: n?.gatewayName ?? "unknown"
        };
        r.collector.increment("gateway_requests_total", 1, l);
        const u = Date.now() - a;
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
                gateway: n?.gatewayName ?? "unknown"
              }
            );
      },
      void 0,
      s,
      "collector"
    );
  }
});
function kt(e, t) {
  if (!jt(e) && !Array.isArray(e))
    return e;
  const r = t.replacement ?? "[REDACTED]", s = structuredClone(e);
  for (const n of t.paths)
    te(s, n.split("."), 0, r);
  return s;
}
function te(e, t, r, s) {
  if (r >= t.length || e == null) return;
  const n = t[r], a = r === t.length - 1;
  if (Array.isArray(e)) {
    for (const o of e)
      te(o, t, r, s);
    return;
  }
  if (jt(e))
    if (n === "*")
      for (const o of Object.keys(e))
        a ? e[o] = s : te(
          e[o],
          t,
          r + 1,
          s
        );
    else {
      const o = e;
      if (!(n in o)) return;
      a ? o[n] = s : te(o[n], t, r + 1, s);
    }
}
function jt(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
const vs = 8192, Rn = /* @__PURE__ */ v({
  name: "request-log",
  priority: S.OBSERVABILITY,
  httpOnly: !0,
  handler: async (e, t, { config: r, debug: s, gateway: n }) => {
    const a = r.sink ?? xs, o = r.maxBodyLength ?? vs, i = Date.now();
    let c;
    r.logRequestBody && (c = await Ts(
      e.req.raw,
      o,
      r.redactPaths
    )), await t();
    const l = new URL(e.req.url), u = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      requestId: n?.requestId ?? e.res.headers.get("x-request-id") ?? "unknown",
      method: e.req.method,
      path: l.pathname,
      statusCode: e.res.status,
      durationMs: Date.now() - i,
      clientIp: ae(e.req.raw.headers, {
        ipHeaders: r.ipHeaders
      }),
      userAgent: e.req.header("user-agent") ?? "unknown",
      gatewayName: n?.gatewayName ?? "unknown",
      routePath: n?.routePath ?? l.pathname,
      upstream: "unknown",
      // Enriched by proxy policy in future
      traceId: n?.traceId,
      spanId: n?.spanId
    };
    if (c !== void 0 && (u.requestBody = c), r.logResponseBody) {
      const d = await bs(
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
      () => Promise.resolve(a(u)),
      void 0,
      s,
      "sink()"
    );
  }
});
async function Ts(e, t, r) {
  try {
    const n = await e.clone().text();
    if (!n) return;
    const a = n.length > t ? `${n.slice(0, t)}...[truncated]` : n;
    if ((e.headers.get("content-type") ?? "").includes("application/json"))
      try {
        let i = JSON.parse(
          a.endsWith("...[truncated]") ? n.slice(0, t) : n
        );
        return r?.length && (i = kt(i, { paths: r })), i;
      } catch {
        return a;
      }
    return a;
  } catch {
    return;
  }
}
async function bs(e, t, r) {
  try {
    const n = await e.res.clone().text();
    if (!n) return;
    const a = n.length > t ? `${n.slice(0, t)}...[truncated]` : n;
    if ((e.res.headers.get("content-type") ?? "").includes("application/json"))
      try {
        let i = JSON.parse(
          a.endsWith("...[truncated]") ? n.slice(0, t) : n
        );
        return r?.length && (i = kt(i, { paths: r })), i;
      } catch {
        return a;
      }
    return a;
  } catch {
    return;
  }
}
function xs(e) {
  console.log(JSON.stringify(e));
}
function Rs(e) {
  return e.replace(/[^a-zA-Z0-9_-]/g, "_");
}
function Qe(e, t, r, s) {
  const n = Rs(e), a = t.toFixed(r), o = s?.(e);
  return o ? `${n};dur=${a};desc="${Se(o)}"` : `${n};dur=${a}`;
}
const An = /* @__PURE__ */ v({
  name: "server-timing",
  priority: S.METRICS,
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
      throw new f(
        500,
        "config-error",
        'serverTiming: visibility "conditional" requires a visibilityFn'
      );
  },
  handler: async (e, t, { config: r, debug: s }) => {
    const n = Date.now();
    await t();
    let a;
    switch (r.visibility) {
      case "always":
        a = !0;
        break;
      case "conditional":
        a = await r.visibilityFn(e);
        break;
      default:
        a = vt(e);
        break;
    }
    if (!a) {
      s("skipping - visibility check failed");
      return;
    }
    const o = Date.now() - n, i = r.precision, c = e.get("_policyTimings"), l = c ? Tt(c) : void 0;
    if (r.serverTimingHeader) {
      const u = [];
      if (r.includeTotal && u.push(
        Qe("total", o, i, r.descriptionFn)
      ), l)
        for (const d of l)
          u.push(
            Qe(d.name, d.durationMs, i, r.descriptionFn)
          );
      u.length > 0 && (e.res.headers.set("server-timing", u.join(", ")), s("Server-Timing: %s", u.join(", ")));
    }
    if (r.responseTimeHeader) {
      const u = `${o.toFixed(i)}ms`;
      e.res.headers.set("x-response-time", u), s("X-Response-Time: %s", u);
    }
  }
});
function En(e, t) {
  const r = new TextEncoder(), s = r.encode(e), n = r.encode(t), a = Math.max(s.length, n.length);
  let o = s.length !== n.length ? 1 : 0;
  for (let i = 0; i < a; i++) {
    const c = i < s.length ? s[i] : 0, l = i < n.length ? n[i] : 0;
    o |= c ^ l;
  }
  return o === 0;
}
const As = "https://stoma.internal";
class _n {
  cache;
  origin;
  /**
   * @param cache - A `Cache` instance (e.g. `caches.default`). Falls back to `caches.default` when omitted.
   * @param origin - Synthetic origin used to construct cache keys. Default: `"https://edge-gateway.internal"`.
   */
  constructor(t, r) {
    this.cache = t ?? caches.default, this.origin = r ?? As;
  }
  async get(t) {
    const r = new Request(`${this.origin}/${encodeURIComponent(t)}`);
    return await this.cache.match(r) ?? null;
  }
  async put(t, r, s) {
    const n = new Request(`${this.origin}/${encodeURIComponent(t)}`), a = new Headers(r.headers);
    a.set("Cache-Control", `s-maxage=${s}`);
    const o = await r.arrayBuffer(), i = new Response(o, {
      status: r.status,
      headers: a
    });
    await this.cache.put(n, i);
  }
  async delete(t) {
    const r = new Request(`${this.origin}/${encodeURIComponent(t)}`);
    return this.cache.delete(r);
  }
}
function $n() {
  return {
    rateLimitStore: new _t(),
    circuitBreakerStore: new Ot(),
    cacheStore: new At()
  };
}
const Es = "stoma-playground", J = "rate-limits", _s = 1;
function $s() {
  return new Promise((e, t) => {
    const r = indexedDB.open(Es, _s);
    r.onupgradeneeded = () => {
      const s = r.result;
      s.objectStoreNames.contains(J) || s.createObjectStore(J);
    }, r.onsuccess = () => e(r.result), r.onerror = () => t(r.error);
  });
}
function Os(e, t) {
  return new Promise((r, s) => {
    const o = e.transaction(J, "readonly").objectStore(J).get(t);
    o.onsuccess = () => r(o.result), o.onerror = () => s(o.error);
  });
}
function Ze(e, t, r) {
  return new Promise((s, n) => {
    const i = e.transaction(J, "readwrite").objectStore(J).put(r, t);
    i.onsuccess = () => s(), i.onerror = () => n(i.error);
  });
}
class On {
  db = null;
  async increment(t, r) {
    this.db || (this.db = await $s());
    const s = Date.now(), n = await Os(this.db, t);
    if (n && n.resetAt > s) {
      const o = {
        count: n.count + 1,
        resetAt: n.resetAt
      };
      return await Ze(this.db, t, o), o;
    }
    const a = {
      count: 1,
      resetAt: s + r * 1e3
    };
    return await Ze(this.db, t, a), a;
  }
  /** Close the database connection. */
  destroy() {
    this.db && (this.db.close(), this.db = null);
  }
}
export {
  _n as CacheApiCacheStore,
  Hs as ConsoleSpanExporter,
  us as DEFAULT_IP_HEADERS,
  f as GatewayError,
  On as IDBRateLimitStore,
  At as InMemoryCacheStore,
  Ot as InMemoryCircuitBreakerStore,
  js as InMemoryMetricsCollector,
  Is as OTLPSpanExporter,
  S as Priority,
  k as SemConv,
  ie as SpanBuilder,
  Ds as apiKeyAuth,
  pn as assignAttributes,
  fn as assignContent,
  bn as assignMetrics,
  Us as basicAuth,
  Ys as cache,
  ln as circuitBreaker,
  Ls as clearJwksCache,
  mn as cors,
  qs as createGateway,
  Kr as createPolicyTestHarness,
  qt as defaultErrorResponse,
  v as definePolicy,
  Gs as dynamicRouting,
  et as errorToResponse,
  ae as extractClientIp,
  Bs as generateHttpSignature,
  Ks as generateJwt,
  Xs as geoIpFilter,
  W as getGatewayContext,
  Tn as health,
  Qs as httpCallout,
  Zs as interrupt,
  en as ipFilter,
  vt as isDebugRequested,
  jr as isTraceRequested,
  tn as jsonThreatProtection,
  yn as jsonValidation,
  Js as jws,
  Fs as jwtAuth,
  un as latencyInjection,
  $n as memoryAdapter,
  xn as metricsReporter,
  Ps as mock,
  wt as noopTraceReporter,
  zs as oauth2,
  wn as overrideMethod,
  z as policyDebug,
  qe as policyTrace,
  Ns as proxy,
  rn as rateLimit,
  Ws as rbac,
  sn as regexThreatProtection,
  nn as requestLimit,
  Rn as requestLog,
  Sn as requestTransform,
  gn as requestValidation,
  F as resolveConfig,
  an as resourceFilter,
  vn as responseTransform,
  dn as retry,
  E as safeCall,
  Ms as scope,
  Cs as sdk,
  An as serverTiming,
  $ as setDebugHeader,
  on as sslEnforce,
  hn as timeout,
  En as timingSafeEqual,
  mr as toPrometheusText,
  cn as trafficShadow,
  Vs as verifyHttpSignature,
  H as withSkip
};
