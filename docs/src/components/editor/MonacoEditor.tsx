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

      // Fetch and register Stoma + Hono type declarations (single self-contained bundle).
      // Registered at the main entry AND at each subpath so imports like
      // `@vivero/stoma/sdk` resolve in Monaco.
      fetch("/stoma-bundle.d.ts")
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status}`);
          return res.text();
        })
        .then((types) => {
          const ts = monaco.languages.typescript.typescriptDefaults;
          const paths = [
            "file:///node_modules/@vivero/stoma/index.d.ts",
            "file:///node_modules/@vivero/stoma/sdk/index.d.ts",
            "file:///node_modules/@vivero/stoma/config/index.d.ts",
            "file:///node_modules/@vivero/stoma/adapters/index.d.ts",
            "file:///node_modules/@vivero/stoma/adapters/cloudflare/index.d.ts",
            "file:///node_modules/@vivero/stoma/adapters/memory/index.d.ts",
          ];
          for (const p of paths) {
            ts.addExtraLib(types, p);
          }
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
