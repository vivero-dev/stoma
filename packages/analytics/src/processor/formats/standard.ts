import { ANALYTICS_TYPE, type AnalyticsEntry } from "../../types.js";

/**
 * Parse a single NDJSON line into an AnalyticsEntry.
 *
 * Returns `null` if the line is not a valid analytics entry
 * (wrong `_type`, malformed JSON, or missing required fields).
 */
export function parseStandardLine(line: string): AnalyticsEntry | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  try {
    const obj = JSON.parse(trimmed);

    if (obj._type !== ANALYTICS_TYPE) return null;

    // Validate required fields (lean analytics schema — no requestId, path, clientIp)
    if (
      typeof obj.timestamp !== "string" ||
      typeof obj.gatewayName !== "string" ||
      typeof obj.routePath !== "string" ||
      typeof obj.method !== "string" ||
      typeof obj.statusCode !== "number" ||
      typeof obj.durationMs !== "number" ||
      typeof obj.responseSize !== "number"
    ) {
      return null;
    }

    return obj as AnalyticsEntry;
  } catch {
    return null;
  }
}
