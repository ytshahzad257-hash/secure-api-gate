import { useEffect, useState } from "react";
import { CategoryChart } from "./components/CategoryChart.js";
import { EndpointTable } from "./components/EndpointTable.js";
import { EvidenceViewer } from "./components/EvidenceViewer.js";
import { RiskBreakdown } from "./components/RiskBreakdown.js";
import { ScoreCard } from "./components/ScoreCard.js";
import { loadEvidence, type EvidenceDashboardData } from "./lib/loadEvidence.js";
import "./App.css";

export function App() {
  const [data, setData] = useState<EvidenceDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    loadEvidence()
      .then((loadedData) => {
        if (active) {
          setData(loadedData);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load evidence.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <main className="app-shell">
        <div className="load-errors">{error}</div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="app-shell">
        <div className="empty-state">Loading evidence...</div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>SecureAPI-Gate Dashboard</h1>
          <p>{data.rows.length} scenarios loaded from generated evidence.</p>
        </div>
        <span
          className={`status-pill ${data.decision === "PASS" ? "status-pass" : "status-block"}`}
        >
          {data.decision}
        </span>
      </header>

      {data.loadErrors.length > 0 && (
        <section className="load-errors">
          {data.loadErrors.slice(0, 3).map((message) => (
            <div key={message}>{message}</div>
          ))}
        </section>
      )}

      {data.rows.length === 0 ? (
        <section className="empty-state">
          No evidence rows were found in{" "}
          <span className="mono">evidence/csv/results-summary.csv</span>.
        </section>
      ) : (
        <div className="dashboard-grid">
          <ScoreCard data={data} />
          <div className="two-column">
            <CategoryChart data={data.categoryBreakdown} />
            <RiskBreakdown data={data} />
          </div>
          <EndpointTable rows={data.endpointRisks} />
          <EvidenceViewer records={data.records.length > 0 ? data.records : data.rows} />
        </div>
      )}
    </main>
  );
}
