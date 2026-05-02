import { useMemo, useState } from "react";
import type { EvidenceCsvRow, EvidenceJsonRecord } from "../lib/loadEvidence.js";

type EvidenceRecord = EvidenceCsvRow | EvidenceJsonRecord;

interface EvidenceViewerProps {
  records: EvidenceRecord[];
}

function isJsonEvidence(record: EvidenceRecord): record is EvidenceJsonRecord {
  return "request" in record || "response" in record || "observedBehavior" in record;
}

export function EvidenceViewer({ records }: EvidenceViewerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.scenarioId ?? null);
  const selected = useMemo(
    () => records.find((record) => record.scenarioId === selectedId) ?? records[0],
    [records, selectedId]
  );

  if (!selected) {
    return (
      <section className="panel">
        <h2>Evidence Viewer</h2>
        <div className="empty-inline">No evidence records available.</div>
      </section>
    );
  }

  const detailRows: Array<[string, string]> = [
    ["Scenario", selected.scenarioId],
    ["Category", selected.category],
    ["Actor", selected.actorRole],
    ["Endpoint", `${selected.method} ${selected.endpoint}`],
    ["Expected", selected.expectedStatus],
    ["Observed", selected.observedStatus],
    ["Severity", selected.severity],
    ["Result", selected.passed ? "Passed" : "Failed"]
  ];

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Evidence Viewer</h2>
          <p>Scenario-level request, response, and recommendation details.</p>
        </div>
        <span className="small-count">{records.length} records</span>
      </div>

      <div className="viewer-layout">
        <div className="scenario-list" aria-label="Evidence scenarios">
          {records.map((record) => (
            <button
              className={`scenario-button ${record.scenarioId === selected.scenarioId ? "active" : ""}`}
              key={record.scenarioId}
              onClick={() => setSelectedId(record.scenarioId)}
              type="button"
            >
              <span className="scenario-id">{record.scenarioId}</span>
              <span className="scenario-title">{record.title}</span>
              <span className={record.passed ? "scenario-pass" : "scenario-fail"}>
                {record.passed ? "PASS" : "FAIL"}
              </span>
            </button>
          ))}
        </div>

        <article className="evidence-detail">
          <div className="detail-title-row">
            <div>
              <h3>{selected.title}</h3>
              <p>{isJsonEvidence(selected) ? selected.description : selected.recommendation}</p>
            </div>
            <span className={`severity severity-${selected.severity}`}>{selected.severity}</span>
          </div>

          <dl className="detail-grid">
            {detailRows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          {isJsonEvidence(selected) && (
            <div className="behavior-grid">
              <div>
                <strong>Expected behavior</strong>
                <p>{selected.expectedBehavior ?? selected.expectedStatus}</p>
              </div>
              <div>
                <strong>Observed behavior</strong>
                <p>{selected.observedBehavior ?? selected.observedStatus}</p>
              </div>
            </div>
          )}

          <div className="recommendation-box">
            <strong>Recommendation</strong>
            <p>{selected.recommendation}</p>
          </div>

          <pre className="json-box">
            <code>{JSON.stringify(selected, null, 2)}</code>
          </pre>
        </article>
      </div>
    </section>
  );
}
