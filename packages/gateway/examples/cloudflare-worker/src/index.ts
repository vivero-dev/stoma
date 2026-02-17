import {
  cache,
  circuitBreaker,
  cors,
  createGateway,
  health,
  InMemoryMetricsCollector,
  metricsReporter,
  rateLimit,
  requestValidation,
  requestLog,
  requestTransform,
  responseTransform,
  retry,
  timeout,
} from "@homegrower-club/stoma";
import puppeteer from "@cloudflare/puppeteer";
import { memoryAdapter } from "@homegrower-club/stoma/adapters";

const stores = memoryAdapter();
const metrics = new InMemoryMetricsCollector();
const BROWSER_RENDER_TIMEOUT_MS = 20_000;
const MAX_MARKDOWN_CHARS = 120_000;

interface BrowserRenderingEnv {
  MYBROWSER?: Fetcher;
}

function validateHttpUrl(input: string): URL | null {
  try {
    const parsed = new URL(input);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function renderMarkdownFromUrl(browserBinding: Fetcher, url: string): Promise<string> {
  const browser = await puppeteer.launch(browserBinding);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: BROWSER_RENDER_TIMEOUT_MS });

    const markdown = await page.evaluate(() => {
      const doc = (globalThis as { document?: any }).document;
      if (!doc) return "";

      const contentRoot = doc.querySelector("main, article, [role='main']") ?? doc.body;
      const title = String(doc.title ?? "").trim();
      const lines: string[] = [];

      const normalize = (value: string) =>
        value.replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

      const blocks = Array.from(
        contentRoot.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,pre,blockquote"),
      ) as Array<any>;

      for (const block of blocks) {
        if (block.closest("script, style, noscript, nav, footer, header, form")) {
          continue;
        }

        const tag = String(block.tagName ?? "").toLowerCase();
        const text = normalize(String(block.innerText ?? ""));
        if (!text) continue;

        switch (tag) {
          case "h1":
            lines.push(`# ${text}`);
            break;
          case "h2":
            lines.push(`## ${text}`);
            break;
          case "h3":
            lines.push(`### ${text}`);
            break;
          case "h4":
            lines.push(`#### ${text}`);
            break;
          case "h5":
            lines.push(`##### ${text}`);
            break;
          case "h6":
            lines.push(`###### ${text}`);
            break;
          case "li":
            lines.push(`- ${text}`);
            break;
          case "blockquote":
            lines.push(text.split("\n").map((line) => `> ${line}`).join("\n"));
            break;
          case "pre":
            lines.push(`\`\`\`\n${String(block.textContent ?? "").trim()}\n\`\`\``);
            break;
          default:
            lines.push(text);
        }
      }

      if (lines.length === 0) {
        const fallback = normalize(String(contentRoot.innerText ?? ""));
        if (fallback) {
          lines.push(fallback);
        }
      }

      if (title && !lines.some((line) => line.startsWith("# "))) {
        lines.unshift(`# ${title}`);
      }

      return lines.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
    });

    return markdown.slice(0, MAX_MARKDOWN_CHARS);
  } finally {
    await browser.close();
  }
}

const gateway = createGateway({
  name: "weather-gateway",
  basePath: "/api",
  admin: { enabled: true, metrics },
  debugHeaders: true,
  policies: [
    requestLog(),
    metricsReporter({ collector: metrics }),
    cors(),
    timeout({ timeoutMs: 10_000 }),
    requestTransform({ setHeaders: { "x-gateway": "weather-gateway" } }),
    responseTransform({ setHeaders: { "x-powered-by": "edge-gateway" } }),
  ],
  routes: [
    {
      path: "/v1/forecast/*",
      methods: ["GET"],
      pipeline: {
        policies: [
          rateLimit({ max: 60, store: stores.rateLimitStore }),
          circuitBreaker({
            failureThreshold: 5,
            store: stores.circuitBreakerStore,
          }),
          cache({ ttlSeconds: 60, store: stores.cacheStore }),
          retry({ maxRetries: 2 }),
        ],
        upstream: {
          type: "url",
          target: "https://api.open-meteo.com",
          rewritePath: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    {
      path: "/v1/geocoding/*",
      methods: ["GET"],
      pipeline: {
        policies: [rateLimit({ max: 60, store: stores.rateLimitStore })],
        upstream: {
          type: "url",
          target: "https://geocoding-api.open-meteo.com",
          rewritePath: (path) =>
            path.replace(/^\/api\/v1\/geocoding/, "/v1/search"),
        },
      },
    },
    {
      path: "/v1/render/markdown",
      methods: ["POST"],
      pipeline: {
        policies: [
          rateLimit({ max: 10, store: stores.rateLimitStore }),
          requestValidation({
            validate: (body) => {
              if (!body || typeof body !== "object") {
                return { valid: false, errors: ["Body must be a JSON object"] };
              }
              const candidate = (body as { url?: unknown }).url;
              if (typeof candidate !== "string") {
                return { valid: false, errors: ["Body must include a string 'url' field"] };
              }
              const parsed = validateHttpUrl(candidate);
              if (!parsed) {
                return { valid: false, errors: ["url must be a valid http(s) URL"] };
              }
              return { valid: true };
            },
          }),
          cache({ ttlSeconds: 60, store: stores.cacheStore, methods: ['POST'] }),
          timeout({ timeoutMs: 30_000 }),
        ],
        upstream: {
          type: "handler",
          handler: async (c) => {
            const browserBinding = ((c as { env?: BrowserRenderingEnv }).env?.MYBROWSER);
            if (!browserBinding) {
              return c.json(
                {
                  error: "config_error",
                  message: "Browser Rendering binding missing. Configure [browser].binding = \"MYBROWSER\"",
                },
                500,
              );
            }

            const body = (await c.req.json()) as { url: string };
            const targetUrl = validateHttpUrl(body.url);
            if (!targetUrl) {
              return c.json({ error: "invalid_url", message: "Invalid URL" }, 400);
            }

            try {
              const markdown = await renderMarkdownFromUrl(browserBinding, targetUrl.toString());
              return new Response(markdown, {
                status: 200,
                headers: {
                  "content-type": "text/markdown; charset=utf-8",
                  "x-rendered-url": targetUrl.toString(),
                },
              });
            } catch (error) {
              return c.json(
                {
                  error: "browser_render_failed",
                  message: error instanceof Error ? error.message : "Browser rendering failed",
                },
                502,
              );
            }
          },
        },
      },
    },
    health({ path: "/health" }),
  ],
});

export default gateway.app;
