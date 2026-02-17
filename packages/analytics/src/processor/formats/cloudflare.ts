import { ANALYTICS_TYPE, type AnalyticsEntry } from "../../types.js";

/**
 * Shape of a Cloudflare Workers Trace Event as written by Logpush.
 *
 * Only the fields we need for extraction are typed here.
 */
interface TraceEvent {
  Event?: Record<string, unknown>;
  Logs?: Array<{
    Level?: string;
    Message?: unknown[];
    TimestampMs?: number;
  }>;
  Outcome?: string;
}

/**
 * Parse a single Cloudflare Workers Trace Event NDJSON line.
 *
 * A single trace event can contain multiple log lines, each of which
 * may be a stoma analytics entry. Returns all extracted entries.
 */
export function parseCloudflareEvent(line: string): AnalyticsEntry[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  let event: TraceEvent;
  try {
    event = JSON.parse(trimmed);
  } catch {
    return [];
  }

  const entries: AnalyticsEntry[] = [];

  if (!Array.isArray(event.Logs)) return entries;

  for (const log of event.Logs) {
    if (!Array.isArray(log.Message)) continue;

    for (const msg of log.Message) {
      // Workers console.log(JSON.stringify(entry)) produces a string message
      if (typeof msg === "string") {
        try {
          const obj = JSON.parse(msg);
          if (obj._type === ANALYTICS_TYPE && isValidEntry(obj)) {
            entries.push(obj as AnalyticsEntry);
          }
        } catch {
          // Not JSON — skip
        }
      } else if (typeof msg === "object" && msg !== null) {
        // Some log formats pass the object directly
        const obj = msg as Record<string, unknown>;
        if (obj._type === ANALYTICS_TYPE && isValidEntry(obj)) {
          entries.push(obj as unknown as AnalyticsEntry);
        }
      }
    }
  }

  return entries;
}

function isValidEntry(obj: Record<string, unknown>): boolean {
  return (
    typeof obj.timestamp === "string" &&
    typeof obj.gatewayName === "string" &&
    typeof obj.routePath === "string" &&
    typeof obj.method === "string" &&
    typeof obj.statusCode === "number" &&
    typeof obj.durationMs === "number" &&
    typeof obj.responseSize === "number"
  );
}
