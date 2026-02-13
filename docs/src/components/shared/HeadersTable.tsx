/**
 * HTTP headers table with optional highlighting for gateway-specific headers.
 *
 * Shared between the Playground and Editor components.
 */

export const HIGHLIGHT_HEADERS = new Set([
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
  "x-cache",
  "x-request-id",
  "retry-after",
  "x-response-time",
  "server-timing",
  "x-stoma-trace",
]);

export function HeadersTable({
  headers,
  highlight = false,
}: {
  headers: Record<string, string>;
  highlight?: boolean;
}) {
  return (
    <table className="pg-headers-table">
      <tbody>
        {Object.entries(headers).map(([name, value]) => (
          <tr
            key={name}
            className={
              highlight && HIGHLIGHT_HEADERS.has(name.toLowerCase())
                ? "pg-header--highlight"
                : undefined
            }
          >
            <td>{name}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
