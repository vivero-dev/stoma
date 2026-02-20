/**
 * Request builder panel for the Stoma editor.
 *
 * Shows auto-populated route shortcuts from the gateway registry and
 * a manual form for method/path/headers/body.
 */
import { useCallback, useEffect, useState } from "react";
import type { RegisteredRoute } from "./useGatewayWorker";

interface RequestBuilderProps {
  routes: RegisteredRoute[];
  busy: boolean;
  onSend: (req: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: string;
  }) => void;
  prefill?: { method: string; path: string } | null;
  onPrefillApplied?: () => void;
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export function RequestBuilder({ routes, busy, onSend, prefill, onPrefillApplied }: RequestBuilderProps) {
  const [method, setMethod] = useState<string>("GET");
  const [path, setPath] = useState("/api/echo");
  const [headersText, setHeadersText] = useState("");
  const [body, setBody] = useState("");

  // Apply prefill from OAuth callback or other external sources
  useEffect(() => {
    if (prefill) {
      setMethod(prefill.method);
      setPath(prefill.path);
      onPrefillApplied?.();
    }
  }, [prefill, onPrefillApplied]);

  const handleRouteClick = useCallback(
    (route: RegisteredRoute, routeMethod: string) => {
      setMethod(routeMethod);
      // Registry paths already include basePath (e.g. "/api/echo")
      setPath(route.path);
      onSend({ method: routeMethod, path: route.path });
    },
    [onSend]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (busy) return;

      // Parse headers from key:value lines
      const headers: Record<string, string> = {};
      for (const line of headersText.split("\n")) {
        const idx = line.indexOf(":");
        if (idx > 0) {
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).trim();
          if (key) headers[key] = val;
        }
      }

      onSend({
        method,
        path,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        body: body || undefined,
      });
    },
    [method, path, headersText, body, busy, onSend]
  );

  return (
    <div className="ed-request">
      {/* Route shortcuts */}
      {routes.length > 0 && (
        <div className="ed-routes">
          <div className="ed-label">Routes</div>
          <div className="ed-route-chips">
            {routes.map((route) =>
              route.methods.map((m) => (
                <button
                  key={`${m}-${route.path}`}
                  className="ed-route-chip"
                  disabled={busy}
                  onClick={() => handleRouteClick(route, m)}
                  type="button"
                >
                  <span className={`ed-method ed-method--${m.toLowerCase()}`}>
                    {m}
                  </span>
                  <span className="ed-route-path">{route.path}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Manual request form */}
      <form className="ed-form" onSubmit={handleSubmit}>
        <div className="ed-form-row">
          <select
            className="ed-select"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            className="ed-input"
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/api/echo"
          />
          <button className="ed-send-btn" type="submit" disabled={busy}>
            Send
          </button>
        </div>

        <div className="ed-form-extra">
          <div className="ed-field">
            <label className="ed-label">
              Headers{" "}
              <span className="ed-hint">(key: value, one per line)</span>
            </label>
            <textarea
              className="ed-textarea"
              rows={2}
              value={headersText}
              onChange={(e) => setHeadersText(e.target.value)}
              placeholder="x-api-key: demo-key"
            />
          </div>
          <div className="ed-field">
            <label className="ed-label">Body</label>
            <textarea
              className="ed-textarea"
              rows={2}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"hello": "world"}'
            />
          </div>
        </div>
      </form>
    </div>
  );
}
