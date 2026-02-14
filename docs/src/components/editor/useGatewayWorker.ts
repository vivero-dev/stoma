/**
 * React hook for managing the editor's gateway Web Worker lifecycle.
 *
 * Handles: esbuild compilation → deploy to Worker → send requests → parse responses.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { compileGatewayCode } from "../../editor/compiler";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegisteredRoute {
  path: string;
  methods: string[];
  policyNames: string[];
  upstreamType: string;
}

export interface GatewayRegistry {
  routes: RegisteredRoute[];
  policies: Array<{ name: string; priority: number }>;
  gatewayName: string;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  requestHeaders: Record<string, string>;
  body: string;
  timingMs: number;
}

export type EditorStatus =
  | "idle"
  | "compiling"
  | "deploying"
  | "ready"
  | "error";

export interface UseGatewayWorkerReturn {
  status: EditorStatus;
  error: string | null;
  routes: RegisteredRoute[];
  gatewayName: string;
  deploy: (code: string) => void;
  sendRequest: (req: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: string;
  }) => Promise<ResponseData>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGatewayWorker(): UseGatewayWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<
    Map<
      string,
      {
        resolve: (data: ResponseData) => void;
        reject: (err: Error) => void;
      }
    >
  >(new Map());

  const [status, setStatus] = useState<EditorStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<RegisteredRoute[]>([]);
  const [gatewayName, setGatewayName] = useState("");

  // Initialize worker on mount
  useEffect(() => {
    const worker = new Worker("/editor-worker.js", { type: "module" });

    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data;

      if (msg.type === "deployed") {
        setStatus("ready");
        setError(null);
        setRoutes(msg.registry.routes || []);
        setGatewayName(msg.registry.gatewayName || "");
      }

      if (msg.type === "deploy-error") {
        setStatus("error");
        setError(msg.error);
        setRoutes([]);
        setGatewayName("");
      }

      if (msg.type === "response") {
        const pending = pendingRequests.current.get(msg.id);
        if (pending) {
          pendingRequests.current.delete(msg.id);
          pending.resolve({
            status: msg.status,
            statusText: msg.statusText,
            headers: msg.headers,
            requestHeaders: msg.requestHeaders || {},
            body: msg.body,
            timingMs: msg.timingMs,
          });
        }
      }

      if (msg.type === "request-error") {
        const pending = pendingRequests.current.get(msg.id);
        if (pending) {
          pendingRequests.current.delete(msg.id);
          pending.reject(new Error(msg.error));
        }
      }
    };

    worker.onerror = (event) => {
      setStatus("error");
      setError(`Worker error: ${event.message}`);
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      // Reject any pending requests
      for (const [, pending] of pendingRequests.current) {
        pending.reject(new Error("Worker terminated"));
      }
      pendingRequests.current.clear();
    };
  }, []);

  const deploy = useCallback(async (code: string) => {
    if (!workerRef.current) return;

    setStatus("compiling");
    setError(null);

    try {
      const compiled = await compileGatewayCode(code);
      setStatus("deploying");
      workerRef.current.postMessage({ type: "deploy", code: compiled });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const sendRequest = useCallback(
    (req: {
      method: string;
      path: string;
      headers?: Record<string, string>;
      body?: string;
    }): Promise<ResponseData> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error("Worker not initialized"));
          return;
        }

        const id = crypto.randomUUID();
        pendingRequests.current.set(id, { resolve, reject });

        workerRef.current.postMessage({
          type: "request",
          id,
          method: req.method,
          path: req.path,
          headers: req.headers,
          body: req.body,
        });

        // Timeout after 30s
        setTimeout(() => {
          if (pendingRequests.current.has(id)) {
            pendingRequests.current.delete(id);
            reject(new Error("Request timed out after 30s"));
          }
        }, 30_000);
      });
    },
    []
  );

  return { status, error, routes, gatewayName, deploy, sendRequest };
}
