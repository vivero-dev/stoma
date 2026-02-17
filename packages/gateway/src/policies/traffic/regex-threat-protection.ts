/**
 * Regex-based threat protection policy.
 *
 * Blocks requests matching dangerous patterns (SQL injection, XSS, etc.)
 * in the path, query string, headers, or body. Patterns are compiled once
 * per config object and cached via WeakMap.
 *
 * @module regex-threat-protection
 */

import { GatewayError } from "../../core/errors";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

/** A single pattern rule with target areas and optional custom message. */
export interface RegexPatternRule {
  /** Regular expression pattern string. */
  regex: string;
  /** Which parts of the request to scan. */
  targets: Array<"path" | "headers" | "body" | "query">;
  /** Custom error message when this pattern matches. */
  message?: string;
}

export interface RegexThreatProtectionConfig extends PolicyConfig {
  /** Pattern rules to evaluate against request data. */
  patterns: RegexPatternRule[];
  /** Regex flags applied to all patterns. Default: `"i"` (case-insensitive). */
  flags?: string;
  /** Only inspect body for these content types. Default: `["application/json", "text/plain"]`. */
  contentTypes?: string[];
  /** Maximum body bytes to scan. Default: `65536` (64KB). */
  maxBodyScanLength?: number;
}

/** Compiled pattern with pre-built RegExp for efficient matching. */
interface CompiledPattern {
  regex: RegExp;
  targets: Array<"path" | "headers" | "body" | "query">;
  message: string;
}

const patternCache = new WeakMap<RegexPatternRule[], CompiledPattern[]>();

function getCompiledPatterns(
  patterns: RegexPatternRule[],
  flags: string
): CompiledPattern[] {
  let compiled = patternCache.get(patterns);
  if (!compiled) {
    // Strip 'g' flag - not meaningful with .test() and can cause
    // stateful lastIndex issues across calls.
    const sanitizedFlags = flags.replace(/g/g, "");
    if (sanitizedFlags !== flags) {
      console.warn(
        "[stoma:regex-threat-protection] Stripped 'g' flag - not meaningful with .test()"
      );
    }
    compiled = patterns.map((p) => ({
      regex: new RegExp(p.regex, sanitizedFlags),
      targets: p.targets,
      message: p.message ?? "Request blocked by threat protection",
    }));
    patternCache.set(patterns, compiled);
  }
  return compiled;
}

/**
 * Regex threat protection policy.
 *
 * Scans request path, query string, headers, and/or body against
 * configurable regex patterns. Throws a 400 GatewayError on first match.
 *
 * @security User-provided regex patterns can cause catastrophic backtracking
 * (ReDoS) if they contain nested quantifiers or overlapping alternations
 * (e.g. `(a+)+`, `(a|a)*b`). A crafted input string can cause the regex
 * engine to run in exponential time, blocking the worker thread and
 * effectively denying service. All patterns should be reviewed for
 * super-linear time complexity before deployment. Consider using atomic
 * patterns, possessive quantifiers (where supported), or testing patterns
 * with a ReDoS detection tool.
 *
 * @example
 * ```ts
 * import { regexThreatProtection } from "@homegrower-club/stoma";
 *
 * regexThreatProtection({
 *   patterns: [
 *     { regex: "(union|select|insert|delete|drop)\\s", targets: ["path", "query", "body"], message: "SQL injection detected" },
 *     { regex: "<script[^>]*>", targets: ["body", "headers"], message: "XSS detected" },
 *   ],
 * });
 * ```
 */
export const regexThreatProtection =
  /*#__PURE__*/ definePolicy<RegexThreatProtectionConfig>({
    name: "regex-threat-protection",
    priority: Priority.EARLY,
    defaults: {
      patterns: [],
      flags: "i",
      contentTypes: ["application/json", "text/plain"],
      maxBodyScanLength: 65536,
    },
    handler: async (c, next, { config, debug }) => {
      const compiled = getCompiledPatterns(
        config.patterns,
        config.flags ?? "i"
      );

      if (compiled.length === 0) {
        debug("no patterns configured - passing through");
        await next();
        return;
      }

      // Pre-compute whether any pattern targets body so we only read it once
      const anyTargetsBody = compiled.some((p) => p.targets.includes("body"));
      let bodyText: string | null = null;

      if (anyTargetsBody) {
        const contentType = c.req.header("content-type") ?? "";
        const matchedType = config.contentTypes!.some((ct) =>
          contentType.includes(ct)
        );

        if (matchedType) {
          const cloned = c.req.raw.clone();
          const reader = cloned.body?.getReader();
          if (reader) {
            let text = "";
            const maxLen = config.maxBodyScanLength!;
            let done = false;
            const decoder = new TextDecoder();

            while (!done && text.length < maxLen) {
              const result = await reader.read();
              if (result.done) {
                done = true;
              } else {
                text += decoder.decode(result.value, { stream: true });
              }
            }
            reader.cancel();

            if (text.length > maxLen) {
              text = text.slice(0, maxLen);
            }

            bodyText = text || null;
          }
        }
      }

      for (const pattern of compiled) {
        // Check path
        if (pattern.targets.includes("path")) {
          if (pattern.regex.test(c.req.path)) {
            debug("path matched pattern: %s", pattern.regex.source);
            throw new GatewayError(400, "threat_detected", pattern.message);
          }
        }

        // Check query string (decoded so URL-encoded payloads are caught)
        if (pattern.targets.includes("query")) {
          const url = new URL(c.req.url);
          const queryString = decodeURIComponent(url.search.slice(1));
          if (queryString && pattern.regex.test(queryString)) {
            debug("query matched pattern: %s", pattern.regex.source);
            throw new GatewayError(400, "threat_detected", pattern.message);
          }
        }

        // Check headers
        if (pattern.targets.includes("headers")) {
          for (const [, value] of c.req.raw.headers.entries()) {
            if (pattern.regex.test(value)) {
              debug("header matched pattern: %s", pattern.regex.source);
              throw new GatewayError(400, "threat_detected", pattern.message);
            }
          }
        }

        // Check body (using the pre-read body text)
        if (pattern.targets.includes("body") && bodyText) {
          if (pattern.regex.test(bodyText)) {
            debug("body matched pattern: %s", pattern.regex.source);
            throw new GatewayError(400, "threat_detected", pattern.message);
          }
        }
      }

      debug("all patterns passed");
      await next();
    },
  });
