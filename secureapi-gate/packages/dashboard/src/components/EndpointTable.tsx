import type { EndpointRisk } from "../lib/loadEvidence.js";

interface EndpointTableProps {
  rows: EndpointRisk[];
}

export function EndpointTable({ rows }: EndpointTableProps) {
  const visibleRows = rows.slice(0, 30);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Endpoint Risk Table</h2>
          <p>Endpoints sorted by accumulated failed-scenario deductions.</p>
        </div>
        <span className="small-count">{rows.length} endpoints</span>
      </div>

      {visibleRows.length === 0 ? (
        <div className="empty-inline">No endpoint risk rows available.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Method</th>
                <th>Failures</th>
                <th>Max Severity</th>
                <th>Risk Deduction</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.routeKey}>
                  <td className="mono">{row.endpoint}</td>
                  <td>
                    <span className="method-chip">{row.method}</span>
                  </td>
                  <td>
                    {row.failed} / {row.total}
                  </td>
                  <td>
                    <span className={`severity severity-${row.maxSeverity}`}>
                      {row.maxSeverity}
                    </span>
                  </td>
                  <td>{row.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
