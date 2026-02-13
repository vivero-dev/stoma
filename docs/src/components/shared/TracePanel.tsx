/**
 * Policy trace table visualization.
 *
 * Shows what each policy did during request processing: self-time,
 * whether it called next(), and any action details with expandable data.
 *
 * Shared between the Playground and Editor components.
 */
import { useState } from "react";
import type { PlaygroundTrace } from "../../playground/register";

export function TracePanel({ trace }: { trace: PlaygroundTrace }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  return (
    <div className="pg-trace-panel">
      <table className="pg-trace-table">
        <thead>
          <tr>
            <th>Policy</th>
            <th>Self-time</th>
            <th>Next?</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {trace.entries.map((entry) => {
            const isExpanded = expandedRow === entry.name;
            const hasData =
              entry.detail?.data && Object.keys(entry.detail.data).length > 0;
            return (
              <tr key={entry.name} className="pg-trace-group">
                <td className="pg-trace-name">
                  {entry.name}
                  <span className="pg-trace-priority">p{entry.priority}</span>
                </td>
                <td className="pg-trace-dur">
                  {entry.durationMs.toFixed(1)}ms
                </td>
                <td className="pg-trace-next">
                  {entry.calledNext ? (
                    <span className="pg-trace-check" title="Called next()">
                      &#10003;
                    </span>
                  ) : (
                    <span className="pg-trace-x" title="Short-circuited">
                      &#10007;
                    </span>
                  )}
                </td>
                <td
                  className={`pg-trace-action${entry.error ? " pg-trace-action--error" : ""}`}
                >
                  {entry.error ? (
                    <span className="pg-trace-error">{entry.error}</span>
                  ) : entry.detail ? (
                    <span
                      className={
                        hasData
                          ? "pg-trace-action-text pg-trace-action-text--clickable"
                          : "pg-trace-action-text"
                      }
                      onClick={
                        hasData
                          ? () => setExpandedRow(isExpanded ? null : entry.name)
                          : undefined
                      }
                    >
                      {entry.detail.action}
                      {hasData && (
                        <span className="pg-trace-expand-icon">
                          {isExpanded ? " \u25B4" : " \u25BE"}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="pg-trace-no-detail">-</span>
                  )}
                  {isExpanded && hasData && (
                    <pre className="pg-trace-data">
                      {JSON.stringify(entry.detail!.data, null, 2)}
                    </pre>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
