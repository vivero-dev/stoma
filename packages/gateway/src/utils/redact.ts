/**
 * Field redaction utility for safe logging of request/response bodies.
 *
 * Supports dot-notation paths (`auth.token`) and single-level wildcards
 * (`*.password`) to match fields at any nesting level. Always deep-clones
 * before mutating - the original object is never modified.
 *
 * @module redact
 */

/** Configuration for field redaction. */
export interface RedactConfig {
  /** JSON field paths to redact (e.g., `"password"`, `"*.secret"`, `"auth.token"`). */
  paths: string[];
  /** Replacement text. Default: `"[REDACTED]"`. */
  replacement?: string;
}

/**
 * Redact sensitive fields from an object for safe logging.
 *
 * Deep-clones the input, then replaces values at the specified paths
 * with the replacement string. Non-object/non-array input passes
 * through unchanged.
 *
 * @param obj - The value to redact (typically a parsed JSON body).
 * @param config - Paths to redact and optional replacement text.
 * @returns A deep-cloned copy with specified fields redacted.
 */
export function redactFields(obj: unknown, config: RedactConfig): unknown {
  if (!isPlainObject(obj) && !Array.isArray(obj)) {
    return obj;
  }

  const replacement = config.replacement ?? "[REDACTED]";
  const cloned = structuredClone(obj);

  for (const path of config.paths) {
    applyRedaction(cloned, path.split("."), 0, replacement);
  }

  return cloned;
}

function applyRedaction(
  obj: unknown,
  segments: string[],
  depth: number,
  replacement: string
): void {
  if (depth >= segments.length || obj == null) return;

  const segment = segments[depth];
  const isLast = depth === segments.length - 1;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      applyRedaction(item, segments, depth, replacement);
    }
    return;
  }

  if (!isPlainObject(obj)) return;

  if (segment === "*") {
    // Wildcard: apply to all keys at this level
    for (const key of Object.keys(obj)) {
      if (isLast) {
        (obj as Record<string, unknown>)[key] = replacement;
      } else {
        applyRedaction(
          (obj as Record<string, unknown>)[key],
          segments,
          depth + 1,
          replacement
        );
      }
    }
  } else {
    const record = obj as Record<string, unknown>;
    if (!(segment in record)) return;

    if (isLast) {
      record[segment] = replacement;
    } else {
      applyRedaction(record[segment], segments, depth + 1, replacement);
    }
  }
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}
