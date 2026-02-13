/**
 * Interactive Stoma Playground — React component.
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
import {
  registerPlaygroundSW,
  sendPlaygroundRequest,
  resetPlayground,
  type PlaygroundResponse,
  type PlaygroundTrace,
  type PlaygroundTraceEntry,
} from "../playground/register";

import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';


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

interface TimingEntry {
  name: string;
  durMs: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HIGHLIGHT_HEADERS = new Set([
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
  "x-cache",
  "x-request-id",
  "retry-after",
  "x-response-time",
  "server-timing",
  "x-stoma-trace",
]);

const PRESETS: PresetButton[] = [
  { method: "GET", path: "/echo" },
  { method: "POST", path: "/echo", body: '{"hello":"world"}' },
  { method: "GET", path: "/protected" },
  { method: "GET", path: "/protected", headers: { "x-api-key": "demo-key" }, tag: "+ api key" },
  { method: "GET", path: "/slow" },
  { method: "GET", path: "/health" },
];

const STATUS_TEXT: Record<SwStatus, string> = {
  loading: "Registering service worker\u2026",
  ready: "Ready! Stoma gateway running in service worker \uD83C\uDF31",
  error: "Service worker failed",
};

const TIP_TEXT = "Open the browser's console logs to see real request logging from Stoma.";

// ---------------------------------------------------------------------------
// Server-Timing parser
// ---------------------------------------------------------------------------

/**
 * Parse a W3C `Server-Timing` header value into structured entries.
 *
 * Format: `name;dur=123.4;desc="optional", name2;dur=5.6`
 */
function parseServerTiming(header: string | undefined): TimingEntry[] {
  if (!header) return [];

  return header.split(",").reduce<TimingEntry[]>((entries, raw) => {
    const parts = raw.trim().split(";");
    const name = parts[0]?.trim();
    if (!name) return entries;

    const durPart = parts.find((p) => p.trim().startsWith("dur="));
    const durMs = durPart ? Number.parseFloat(durPart.trim().slice(4)) : 0;

    if (!Number.isNaN(durMs)) {
      entries.push({ name, durMs });
    }
    return entries;
  }, []);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TimingWaterfall({ entries }: { entries: TimingEntry[] }) {
  // Separate total from policy entries
  const total = entries.find((e) => e.name === "total");
  const policies = entries.filter((e) => e.name !== "total");

  // Scale bars relative to the longest policy (not total)
  const maxPolicyDur = policies.reduce((m, e) => Math.max(m, e.durMs), 0);
  const scale = maxPolicyDur > 0 ? maxPolicyDur : 1;

  return (
    <div className="pg-timing-waterfall">
      {total && (
        <div className="pg-timing-total">
          <span className="pg-timing-total-label">Gateway total</span>
          <span className="pg-timing-total-value">{total.durMs.toFixed(1)}ms</span>
        </div>
      )}
      {policies.length > 0 && (
        <div className="pg-timing-rows">
          {policies.map((entry) => {
            const pct = Math.max((entry.durMs / scale) * 100, 1);
            return (
              <div className="pg-timing-row" key={entry.name}>
                <span className="pg-timing-name">{entry.name}</span>
                <span className="pg-timing-bar-track">
                  <span
                    className="pg-timing-bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="pg-timing-dur">{entry.durMs.toFixed(1)}ms</span>
              </div>
            );
          })}
        </div>
      )}
      {!total && policies.length === 0 && (
        <div className="pg-timing-empty">No timing data</div>
      )}
    </div>
  );
}

function TracePanel({ trace }: { trace: PlaygroundTrace }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  return (
    <div className="pg-trace-panel">
      <table className="pg-trace-table">
        <thead>
          <tr>
            <th>Policy</th>
            <th>Self-time</th>
            <th>Next?</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {trace.entries.map((entry) => {
            const isExpanded = expandedRow === entry.name;
            const hasData = entry.detail?.data && Object.keys(entry.detail.data).length > 0;
            return (
              <tr key={entry.name} className="pg-trace-group">
                <td className="pg-trace-name">
                  {entry.name}
                  <span className="pg-trace-priority">p{entry.priority}</span>
                </td>
                <td className="pg-trace-dur">{entry.durationMs.toFixed(1)}ms</td>
                <td className="pg-trace-next">
                  {entry.calledNext ? (
                    <span className="pg-trace-check" title="Called next()">&#10003;</span>
                  ) : (
                    <span className="pg-trace-x" title="Short-circuited">&#10007;</span>
                  )}
                </td>
                <td className={`pg-trace-action${entry.error ? " pg-trace-action--error" : ""}`}>
                  {entry.error ? (
                    <span className="pg-trace-error">{entry.error}</span>
                  ) : entry.detail ? (
                    <span
                      className={hasData ? "pg-trace-action-text pg-trace-action-text--clickable" : "pg-trace-action-text"}
                      onClick={hasData ? () => setExpandedRow(isExpanded ? null : entry.name) : undefined}
                    >
                      {entry.detail.action}
                      {hasData && <span className="pg-trace-expand-icon">{isExpanded ? " \u25B4" : " \u25BE"}</span>}
                    </span>
                  ) : (
                    <span className="pg-trace-no-detail">-</span>
                  )}
                  {isExpanded && hasData && (
                    <pre className="pg-trace-data">
                      {JSON.stringify(entry.detail!.data, null, 2)}
                    </pre>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HeadersTable({
  headers,
  highlight = false,
}: {
  headers: Record<string, string>;
  highlight?: boolean;
}) {
  return (
    <table className="pg-headers-table">
      <tbody>
        {Object.entries(headers).map(([name, value]) => (
          <tr
            key={name}
            className={highlight && HIGHLIGHT_HEADERS.has(name.toLowerCase()) ? "pg-header--highlight" : undefined}
          >
            <td>{name}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

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

  const handlePreset = useCallback(async (preset: PresetButton) => {
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
        res: { status: 0, statusText: "Network Error", headers: {}, body: String(err), timingMs: 0 },
      });
    } finally {
      setBusy(false);
    }
  }, [busy]);

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
    [result],
  );

  const statusClass = result
    ? result.res.status < 300 ? "pg-badge--2xx" : result.res.status < 500 ? "pg-badge--4xx" : "pg-badge--5xx"
    : "";

  const buttonsDisabled = status !== "ready" || busy;

  return (
    <div className="pg-playground">
      <div className={`pg-status pg-status--${status}`}>
        <span className="pg-dot" />
        <span>{statusText}</span>
      </div>
      {status === "ready" && (
        <div className="pg-status-tip">{TIP_TEXT}</div>
      )}

      <div className="pg-buttons">
        {PRESETS.map((preset, i) => (
          <button
            key={i}
            className="pg-btn"
            disabled={buttonsDisabled}
            onClick={() => handlePreset(preset)}
          >
            <span className={preset.method === "POST" ? "pg-btn-method pg-btn-method--post" : "pg-btn-method"}>
              {preset.method}
            </span>
            <span className="pg-btn-path">{preset.path}</span>
            {preset.tag && <span className="pg-btn-tag">{preset.tag}</span>}
          </button>
        ))}
      </div>

      {/* Result panel — always visible, matches Astro version exactly */}
      <div className="pg-result">
        <div className="pg-topbar">
          <span className="pg-req-line">
            {result ? `${result.req.method} /playground/api${result.req.path}` : "Make a request"}
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
              {result?.req.headers && Object.keys(result.req.headers).length > 0 && (
                <HeadersTable headers={result.req.headers} />
              )}
            </div>
            <div className="pg-section">
              <div className="pg-section-label">Response</div>
              {result && <HeadersTable headers={result.res.headers} highlight />}
            </div>
          </div>

          <div className="pg-col-body">
            <div className="pg-section-label">Body</div>
            <JSONPretty id="json-pretty" data={bodyText}></JSONPretty>
          </div>
        </div>

        {/* Policy timing waterfall — full-width below the grid */}
        {result && timingEntries.length > 0 && (
          <div className="pg-timing-section">
            <div className="pg-section-label">Policy Timing</div>
            <TimingWaterfall entries={timingEntries} />
          </div>
        )}

        {/* Policy trace panel — shows what each policy did */}
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
