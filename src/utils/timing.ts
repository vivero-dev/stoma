/**
 * Shared timing utilities.
 *
 * @module timing
 */

/**
 * Convert inclusive (onion-model) timings to self-time and reverse to
 * execution order.
 *
 * `policiesToMiddleware()` records inclusive wall-clock time for each
 * policy - meaning an outer policy's duration includes all inner
 * policies plus the upstream. The timings array is ordered
 * innermost-first (the innermost middleware finishes first and pushes
 * its timing before outer ones).
 *
 * Self-time is computed as:
 *   self[0] = inclusive[0]               (innermost, includes upstream)
 *   self[i] = inclusive[i] - inclusive[i-1]   for i > 0
 *
 * The result is reversed so entries are in execution order (outermost
 * policy first), which is the natural reading order for a waterfall.
 */
export function toSelfTimes<T extends { durationMs: number }>(
  timings: T[]
): T[] {
  const selfTimes = timings.map((entry, i) => ({
    ...entry,
    durationMs:
      i === 0
        ? entry.durationMs
        : Math.max(0, entry.durationMs - timings[i - 1].durationMs),
  }));

  // Reverse: innermost-first → outermost-first (execution order)
  selfTimes.reverse();
  return selfTimes;
}
