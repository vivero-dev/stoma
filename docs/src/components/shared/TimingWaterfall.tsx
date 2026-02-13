/**
 * Server-Timing waterfall visualization.
 *
 * Parses W3C Server-Timing headers and renders horizontal bar charts
 * showing per-policy execution times with a total summary line.
 *
 * Shared between the Playground and Editor components.
 */

export interface TimingEntry {
  name: string;
  durMs: number;
}

/**
 * Parse a W3C `Server-Timing` header value into structured entries.
 *
 * Format: `name;dur=123.4;desc="optional", name2;dur=5.6`
 */
export function parseServerTiming(header: string | undefined): TimingEntry[] {
  if (!header) return [];

  return header.split(",").reduce<TimingEntry[]>((entries, raw) => {
    const parts = raw.trim().split(";");
    const name = parts[0]?.trim();
    if (!name) return entries;

    const durPart = parts.find((p) => p.trim().startsWith("dur="));
    const durMs = durPart ? Number.parseFloat(durPart.trim().slice(4)) : 0;

    if (!Number.isNaN(durMs)) {
      entries.push({ name, durMs });
    }
    return entries;
  }, []);
}

export function TimingWaterfall({ entries }: { entries: TimingEntry[] }) {
  const total = entries.find((e) => e.name === "total");
  const policies = entries.filter((e) => e.name !== "total");

  const maxPolicyDur = policies.reduce((m, e) => Math.max(m, e.durMs), 0);
  const scale = maxPolicyDur > 0 ? maxPolicyDur : 1;

  return (
    <div className="pg-timing-waterfall">
      {total && (
        <div className="pg-timing-total">
          <span className="pg-timing-total-label">Gateway total</span>
          <span className="pg-timing-total-value">
            {total.durMs.toFixed(1)}ms
          </span>
        </div>
      )}
      {policies.length > 0 && (
        <div className="pg-timing-rows">
          {policies.map((entry) => {
            const pct = Math.max((entry.durMs / scale) * 100, 1);
            return (
              <div className="pg-timing-row" key={entry.name}>
                <span className="pg-timing-name">{entry.name}</span>
                <span className="pg-timing-bar-track">
                  <span
                    className="pg-timing-bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="pg-timing-dur">
                  {entry.durMs.toFixed(1)}ms
                </span>
              </div>
            );
          })}
        </div>
      )}
      {!total && policies.length === 0 && (
        <div className="pg-timing-empty">No timing data</div>
      )}
    </div>
  );
}
