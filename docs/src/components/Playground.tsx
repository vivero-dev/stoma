/**
 * Interactive Stoma Playground - React component.
 *
 * Runs a real Stoma gateway inside a service worker. Users click preset
 * buttons to send requests and see the full HTTP exchange: request info
 * on the left, response body on the right.
 *
 * Hydrated client-side via Astro's `client:load` directive.
 * This file lives in docs/ only. It is NOT part of the Stoma library.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Playground.css";

import JSONPretty from "react-json-pretty";
import {
  type PlaygroundResponse,
  registerPlaygroundSW,
  resetPlayground,
  sendPlaygroundRequest,
} from "../playground/register";
import "react-json-pretty/themes/monikai.css";

import { HeadersTable } from "./shared/HeadersTable";
import { parseServerTiming, TimingWaterfall } from "./shared/TimingWaterfall";
import { TracePanel } from "./shared/TracePanel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SwStatus = "loading" | "ready" | "error";

interface RequestInfo {
  method: string;
  path: string;
  headers?: Record<string, string>;
}

interface Result {
  req: RequestInfo;
  res: PlaygroundResponse;
}

interface PresetButton {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: string;
  tag?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRESETS: PresetButton[] = [
  { method: "GET", path: "/echo" },
  { method: "POST", path: "/echo", body: '{"hello":"world"}' },
  { method: "GET", path: "/protected" },
  {
    method: "GET",
    path: "/protected",
    headers: { "x-api-key": "demo-key" },
    tag: "+ api key",
  },
  { method: "GET", path: "/slow" },
  { method: "GET", path: "/health" },
];

const STATUS_TEXT: Record<SwStatus, string> = {
  loading: "Registering service worker\u2026",
  ready: "Ready! Stoma gateway running in service worker \uD83C\uDF31",
  error: "Service worker failed",
};

const TIP_TEXT =
  "Open the browser's console logs to see real request logging from Stoma.";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Playground() {
  const [status, setStatus] = useState<SwStatus>("loading");
  const [statusText, setStatusText] = useState(STATUS_TEXT.loading);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [resetting, setResetting] = useState(false);

  const swReady = useRef(false);

  useEffect(() => {
    registerPlaygroundSW()
      .then(() => {
        swReady.current = true;
        setStatus("ready");
        setStatusText(STATUS_TEXT.ready);
      })
      .catch((err) => {
        swReady.current = false;
        setStatus("error");
        setStatusText(`Failed: ${err}`);
      });
  }, []);

  const handlePreset = useCallback(
    async (preset: PresetButton) => {
      if (!swReady.current || busy) return;

      const mergedHeaders = preset.body
        ? { "content-type": "application/json", ...preset.headers }
        : preset.headers;

      const reqInfo: RequestInfo = {
        method: preset.method,
        path: preset.path,
        headers: mergedHeaders,
      };

      setBusy(true);

      try {
        const res = await sendPlaygroundRequest(preset.method, preset.path, {
          headers: mergedHeaders,
          body: preset.body,
        });
        setResult({ req: reqInfo, res });
      } catch (err) {
        swReady.current = false;
        setStatus("error");
        setStatusText("Service worker lost - click Reset to recover");
        setResult({
          req: reqInfo,
          res: {
            status: 0,
            statusText: "Network Error",
            headers: {},
            body: String(err),
            timingMs: 0,
          },
        });
      } finally {
        setBusy(false);
      }
    },
    [busy]
  );

  const handleReset = useCallback(async () => {
    if (resetting) return;

    swReady.current = false;
    setResetting(true);
    setBusy(true);
    setStatus("loading");
    setStatusText("Resetting playground\u2026");
    setResult(null);

    try {
      await resetPlayground();
      swReady.current = true;
      setStatus("ready");
      setStatusText("Ready - playground state cleared");
    } catch (err) {
      setStatus("error");
      setStatusText(`Reset failed: ${err}`);
    } finally {
      setBusy(false);
      setResetting(false);
    }
  }, [resetting]);

  // Pretty-print JSON body
  let bodyText = "Click any button above to try a request.";
  if (result) {
    try {
      bodyText = JSON.stringify(JSON.parse(result.res.body), null, 2);
    } catch {
      bodyText = result.res.body;
    }
  }

  // Parse Server-Timing entries from response headers
  const timingEntries = useMemo(
    () => parseServerTiming(result?.res.headers["server-timing"]),
    [result]
  );

  const statusClass = result
    ? result.res.status < 300
      ? "pg-badge--2xx"
      : result.res.status < 500
        ? "pg-badge--4xx"
        : "pg-badge--5xx"
    : "";

  const buttonsDisabled = status !== "ready" || busy;

  return (
    <div className="pg-playground">
      <div className={`pg-status pg-status--${status}`}>
        <span className="pg-dot" />
        <span>{statusText}</span>
      </div>
      {status === "ready" && <div className="pg-status-tip">{TIP_TEXT}</div>}

      <div className="pg-buttons">
        {PRESETS.map((preset, i) => (
          <button
            key={i}
            className="pg-btn"
            disabled={buttonsDisabled}
            onClick={() => handlePreset(preset)}
          >
            <span
              className={
                preset.method === "POST"
                  ? "pg-btn-method pg-btn-method--post"
                  : "pg-btn-method"
              }
            >
              {preset.method}
            </span>
            <span className="pg-btn-path">{preset.path}</span>
            {preset.tag && <span className="pg-btn-tag">{preset.tag}</span>}
          </button>
        ))}
      </div>

      {/* Result panel - always visible, matches Astro version exactly */}
      <div className="pg-result">
        <div className="pg-topbar">
          <span className="pg-req-line">
            {result
              ? `${result.req.method} /playground/api${result.req.path}`
              : "Make a request"}
          </span>
          <span className="pg-topbar-right">
            {result && (
              <>
                <span className={`pg-badge ${statusClass}`}>
                  {result.res.status} {result.res.statusText}
                </span>
                <span className="pg-timing">{result.res.timingMs}ms</span>
              </>
            )}
          </span>
        </div>

        <div className="pg-grid">
          <div className="pg-col-headers">
            <div className="pg-section">
              <div className="pg-section-label">Request</div>
              {result?.req.headers &&
                Object.keys(result.req.headers).length > 0 && (
                  <HeadersTable headers={result.req.headers} />
                )}
            </div>
            <div className="pg-section">
              <div className="pg-section-label">Response</div>
              {result && (
                <HeadersTable headers={result.res.headers} highlight />
              )}
            </div>
          </div>

          <div className="pg-col-body">
            <div className="pg-section-label">Body</div>
            <JSONPretty id="json-pretty" data={bodyText}></JSONPretty>
          </div>
        </div>

        {/* Policy timing waterfall - full-width below the grid */}
        {result && timingEntries.length > 0 && (
          <div className="pg-timing-section">
            <div className="pg-section-label">Policy Timing</div>
            <TimingWaterfall entries={timingEntries} />
          </div>
        )}

        {/* Policy trace panel - shows what each policy did */}
        {result?.res.trace && (
          <div className="pg-trace-section">
            <div className="pg-section-label">Policy Trace</div>
            <TracePanel trace={result.res.trace} />
          </div>
        )}
      </div>

      <button
        className="pg-reset-btn"
        disabled={resetting}
        onClick={handleReset}
      >
        Reset Playground
      </button>
    </div>
  );
}
