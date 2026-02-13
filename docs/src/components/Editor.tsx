/**
 * Top-level Stoma Editor component.
 *
 * Full-viewport split-pane layout:
 *   Left:  Monaco code editor with Stoma IntelliSense
 *   Right: Route shortcuts, request builder, response panel
 *
 * Hydrated client-only via Astro's `client:only="react"` directive.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_CODE } from "../editor/default-code";
import { MonacoEditor } from "./editor/MonacoEditor";
import { RequestBuilder } from "./editor/RequestBuilder";
import { ResponsePanel } from "./editor/ResponsePanel";
import { type ResponseData, useGatewayWorker } from "./editor/useGatewayWorker";
import "./Editor.css";

const STATUS_LABELS: Record<string, string> = {
  idle: "Not compiled",
  compiling: "Compiling\u2026",
  deploying: "Deploying\u2026",
  ready: "Ready",
  error: "Error",
};

function getInitialParams() {
  if (typeof window === "undefined")
    return { code: DEFAULT_CODE, autorun: false, title: null as string | null };
  const params = new URLSearchParams(window.location.search);
  const urlCode = params.get("code");
  let code = DEFAULT_CODE;
  if (urlCode) {
    try {
      code = atob(urlCode);
    } catch {
      /* ignore invalid base64 */
    }
  }
  return {
    code,
    autorun: params.get("autorun") === "true",
    title: params.get("title"),
  };
}

export default function Editor() {
  const initial = useRef(getInitialParams());
  const codeRef = useRef(initial.current.code);
  const { status, error, routes, gatewayName, deploy, sendRequest } =
    useGatewayWorker();
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleCodeChange = useCallback((value: string) => {
    codeRef.current = value;
  }, []);

  const handleCompile = useCallback(() => {
    deploy(codeRef.current);
    setResponse(null);
    setRequestError(null);
  }, [deploy]);

  const handleSendRequest = useCallback(
    async (req: {
      method: string;
      path: string;
      headers?: Record<string, string>;
      body?: string;
    }) => {
      setBusy(true);
      setRequestError(null);
      try {
        const res = await sendRequest(req);
        setResponse(res);
      } catch (err) {
        setRequestError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    },
    [sendRequest]
  );

  const isCompiling = status === "compiling" || status === "deploying";

  // Auto-compile on mount when ?autorun=true
  const autorunDone = useRef(false);
  useEffect(() => {
    if (initial.current.autorun && !autorunDone.current && status === "idle") {
      autorunDone.current = true;
      deploy(codeRef.current);
    }
  }, [status, deploy]);

  return (
    <div className="ed-root">
      {/* Header bar */}
      <header className="ed-header">
        <div className="ed-header-left">
          <a href="/" className="ed-logo">
            Stoma
          </a>
          <span className="ed-header-divider">/</span>
          <span className="ed-header-title">
            {initial.current.title ?? "Editor"}
          </span>
        </div>
        <div className="ed-header-right">
          <button
            className="ed-compile-btn"
            onClick={handleCompile}
            disabled={isCompiling}
          >
            {isCompiling ? STATUS_LABELS[status] : "Compile & Run"}
          </button>
          <a href="/" className="ed-back-link">
            Back to Docs
          </a>
        </div>
      </header>

      {/* Split pane */}
      <div className="ed-panes">
        {/* Left: Monaco editor */}
        <div className="ed-pane-left">
          <MonacoEditor
            defaultValue={initial.current.code}
            onChange={handleCodeChange}
          />
          {/* Status bar below editor */}
          <div className={`ed-statusbar ed-statusbar--${status}`}>
            <span className="ed-status-dot" />
            <span className="ed-status-text">
              {error && status === "error"
                ? error
                : STATUS_LABELS[status] || status}
            </span>
            {status === "ready" && (
              <span className="ed-status-meta">
                {gatewayName ? `${gatewayName} \u00B7 ` : ""}
                {routes.length} route{routes.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Right: Request builder + Response */}
        <div className="ed-pane-right">
          <RequestBuilder
            routes={routes}
            busy={busy || isCompiling || status !== "ready"}
            onSend={handleSendRequest}
          />
          <ResponsePanel response={response} error={requestError} />
        </div>
      </div>
    </div>
  );
}
