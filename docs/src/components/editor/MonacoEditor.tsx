/**
 * Monaco editor wrapper for the Stoma gateway editor.
 *
 * Loads Monaco via CDN through @monaco-editor/react, configures the
 * TypeScript language service with Stoma type declarations, and reports
 * code changes to the parent component.
 */
import MonacoReact from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useCallback, useRef } from "react";

/**
 * Minimal Hono type stubs for Monaco IntelliSense.
 *
 * The stoma type bundle (`stoma-bundle.d.ts`) has `import { Context, ... } from 'hono'`
 * at the top. Monaco can't resolve bare-specifier imports, so we register these stubs
 * at the expected node_modules path so the TS language service can follow the import.
 */
const HONO_TYPE_STUBS = `
declare module "hono" {
  export interface Context<E = any, P extends string = any, I = any> {
    req: {
      method: string;
      url: string;
      path: string;
      header(name: string): string | undefined;
      query(key: string): string | undefined;
      raw: Request;
      text(): Promise<string>;
      json<T = any>(): Promise<T>;
      param(key: string): string | undefined;
    };
    json<T = {}>(data: T, status?: number): Response;
    text(data: string, status?: number): Response;
    html(data: string, status?: number): Response;
    body(data: string | ArrayBuffer | ReadableStream | null, status?: number): Response;
    redirect(url: string, status?: number): Response;
    header(name: string, value: string): void;
    status(code: number): void;
    set(key: string, value: unknown): void;
    get(key: string): unknown;
  }
  export type Next = () => Promise<void>;
  export type MiddlewareHandler<E = any, P extends string = string, I = {}> =
    (c: Context<E, P, I>, next: Next) => Response | Promise<Response | void>;
  export class Hono<E = any> {
    fetch(request: Request, ...rest: unknown[]): Response | Promise<Response>;
    request(path: string, init?: RequestInit): Response | Promise<Response>;
    on(method: string | string[], path: string, ...handlers: MiddlewareHandler[]): Hono<E>;
  }
}
`;

interface MonacoEditorProps {
  defaultValue: string;
  onChange: (value: string) => void;
}

export function MonacoEditor({ defaultValue, onChange }: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleMount = useCallback(
    (
      editorInstance: editor.IStandaloneCodeEditor,
      monaco: typeof import("monaco-editor")
    ) => {
      editorRef.current = editorInstance;

      // Configure TypeScript compiler options
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2022,
        lib: ["es2022", "dom", "dom.iterable"],
        module: monaco.languages.typescript.ModuleKind.ESNext,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        strict: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        allowNonTsExtensions: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        noEmit: true,
      });

      // Register minimal Hono type stubs so the stoma bundle's
      // `import { Context, ... } from 'hono'` resolves in Monaco.
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        HONO_TYPE_STUBS,
        "file:///node_modules/hono/index.d.ts"
      );

      // Fetch and register Stoma type declarations
      fetch("/stoma-bundle.d.ts")
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status}`);
          return res.text();
        })
        .then((types) => {
          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            types,
            "file:///node_modules/@homegrower-club/stoma/index.d.ts"
          );
        })
        .catch((err) => {
          console.warn("Failed to load Stoma types for IntelliSense:", err);
        });
    },
    []
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) onChange(value);
    },
    [onChange]
  );

  return (
    <MonacoReact
      height="100%"
      language="typescript"
      theme="vs-dark"
      path="file:///gateway-config.ts"
      defaultValue={defaultValue}
      onChange={handleChange}
      onMount={handleMount}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineHeight: 20,
        tabSize: 2,
        wordWrap: "on",
        scrollBeyondLastLine: false,
        padding: { top: 12 },
        automaticLayout: true,
        fixedOverflowWidgets: true,
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
      }}
    />
  );
}
