/**
 * Response panel for the Stoma editor.
 *
 * Displays the response from a gateway request: status, headers, JSON body,
 * timing waterfall, and policy trace table. Reuses shared components from
 * the Playground.
 */
import { useMemo } from "react";
import JSONPretty from "react-json-pretty";
import type { PlaygroundTrace } from "../../playground/register";
import { HeadersTable } from "../shared/HeadersTable";
import { parseServerTiming, TimingWaterfall } from "../shared/TimingWaterfall";
import { TracePanel } from "../shared/TracePanel";
import type { ResponseData } from "./useGatewayWorker";
import "react-json-pretty/themes/monikai.css";

interface ResponsePanelProps {
  response: ResponseData | null;
  error: string | null;
}

export function ResponsePanel({ response, error }: ResponsePanelProps) {
  const timingEntries = useMemo(
    () => parseServerTiming(response?.headers["server-timing"]),
    [response]
  );

  const trace = useMemo<PlaygroundTrace | null>(() => {
    if (!response) return null;
    const traceHeader = response.headers["x-stoma-trace"];
    if (!traceHeader) return null;
    try {
      return JSON.parse(traceHeader) as PlaygroundTrace;
    } catch {
      return null;
    }
  }, [response]);

  const statusClass = response
    ? response.status < 300
      ? "pg-badge--2xx"
      : response.status < 500
        ? "pg-badge--4xx"
        : "pg-badge--5xx"
    : "";

  if (error && !response) {
    return (
      <div className="ed-response ed-response--error">
        <div className="ed-response-error">{error}</div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="ed-response ed-response--empty">
        <div className="ed-response-placeholder">
          Send a request to see the response here.
        </div>
      </div>
    );
  }

  let bodyContent = response.body;
  try {
    bodyContent = JSON.stringify(JSON.parse(response.body), null, 2);
  } catch {
    // Not JSON, use raw text
  }

  return (
    <div className="ed-response">
      {/* Status bar */}
      <div className="pg-topbar">
        <span className={`pg-badge ${statusClass}`}>
          {response.status} {response.statusText}
        </span>
        <span className="pg-timing">{response.timingMs}ms</span>
      </div>

      {/* Headers */}
      <div className="ed-response-section">
        <div className="pg-section-label">Response Headers</div>
        <HeadersTable headers={response.headers} highlight />
      </div>

      {/* Body */}
      <div className="ed-response-section">
        <div className="pg-section-label">Body</div>
        <div className="ed-response-body">
          <JSONPretty data={bodyContent} />
        </div>
      </div>

      {/* Timing waterfall */}
      {timingEntries.length > 0 && (
        <div className="ed-response-section">
          <div className="pg-section-label">Policy Timing</div>
          <TimingWaterfall entries={timingEntries} />
        </div>
      )}

      {/* Policy trace */}
      {trace && (
        <div className="ed-response-section">
          <div className="pg-section-label">Policy Trace</div>
          <TracePanel trace={trace} />
        </div>
      )}
    </div>
  );
}
