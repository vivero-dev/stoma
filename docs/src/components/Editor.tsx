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
import { buildShareUrl, compressCode, decompressCode } from "../editor/share";
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
  const hash = new URLSearchParams(window.location.hash.slice(1));

  let code = DEFAULT_CODE;
  let autorun = false;
  let title: string | null = null;

  // Priority: hash fragment (new share format) > query params (legacy EditorLink format)
  const hashCode = hash.get("code");
  const queryCode = params.get("code");

  if (hashCode) {
    const decompressed = decompressCode(hashCode);
    if (decompressed) code = decompressed;
    autorun = true;
    title = hash.get("title");
  } else if (queryCode) {
    try {
      code = atob(queryCode);
    } catch {
      /* ignore invalid base64 */
    }
    autorun = params.get("autorun") === "true";
    title = params.get("title");
  }

  return { code, autorun, title };
}

export default function Editor() {
  const initial = useRef(getInitialParams());
  const codeRef = useRef(initial.current.code);
  const { status, error, routes, gatewayName, deploy, sendRequest } =
    useGatewayWorker();
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [prefill, setPrefill] = useState<{
    method: string;
    path: string;
  } | null>(null);
  const popupRef = useRef<Window | null>(null);
  const hashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCodeChange = useCallback((value: string) => {
    codeRef.current = value;

    // Debounced hash update so refreshing preserves the current code
    if (hashTimerRef.current) clearTimeout(hashTimerRef.current);
    hashTimerRef.current = setTimeout(() => {
      const hash = new URLSearchParams();
      hash.set("code", compressCode(value));
      const title = initial.current.title;
      if (title) hash.set("title", title);
      history.replaceState(null, "", `#${hash.toString()}`);
    }, 1500);
  }, []);

  const handleCompile = useCallback(() => {
    deploy(codeRef.current);
    setResponse(null);
    setRequestError(null);
  }, [deploy]);

  const handleShare = useCallback(() => {
    const url = buildShareUrl(
      codeRef.current,
      initial.current.title ?? undefined
    );
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const handleDownload = useCallback(() => {
    const slug = (gatewayName || initial.current.title || "gateway")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const filename = `${slug}.ts`;
    const blob = new Blob([codeRef.current], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [gatewayName]);

  const handleOpenAuthPopup = useCallback((url: string) => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = window.open(url, "stoma-oauth", "width=600,height=700");
  }, []);

  // Listen for OAuth callback params from the popup
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "stoma-oauth-callback") return;

      const params = event.data.params as Record<string, string>;
      if (!params) return;

      // Find the callback route: look for a route whose path contains "callback"
      const callbackRoute = routes.find((r) =>
        r.path.toLowerCase().includes("callback")
      );
      const callbackPath = callbackRoute?.path ?? "/auth/callback";
      const qs = new URLSearchParams(params).toString();

      setPrefill({ method: "GET", path: `${callbackPath}?${qs}` });
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [routes]);

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
          <button className="ed-share-btn" onClick={handleShare}>
            {copied ? "Copied!" : "Share"}
          </button>
          <button className="ed-share-btn" onClick={handleDownload}>
            Download
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
            prefill={prefill}
            onPrefillApplied={() => setPrefill(null)}
          />
          <ResponsePanel
            response={response}
            error={requestError}
            onOpenAuthPopup={handleOpenAuthPopup}
          />
        </div>
      </div>
    </div>
  );
}
