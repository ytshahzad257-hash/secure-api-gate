import type { EvidenceDashboardData } from "../lib/loadEvidence.js";

interface ScoreCardProps {
  data: EvidenceDashboardData;
}

export function ScoreCard({ data }: ScoreCardProps) {
  const total = data.rows.length;
  const passRate = total === 0 ? 0 : Math.round((data.passed / total) * 100);
  const failedHighImpact = data.rows.filter(
    (row) => !row.passed && (row.severity === "critical" || row.severity === "high")
  ).length;

  return (
    <section className="metric-grid" aria-label="SecureAPI-Gate score summary">
      <article className="panel metric-card">
        <div className="metric-label">SecureAPI Risk Score</div>
        <div className={`metric-value ${data.decision === "PASS" ? "score-good" : "score-risk"}`}>
          {data.overallScore}
        </div>
        <div className="metric-note">
          Threshold {data.threshold}; CI gate {data.decision}
        </div>
      </article>

      <article className="panel metric-card">
        <div className="metric-label">Pass Rate</div>
        <div className="metric-value">{passRate}%</div>
        <div className="metric-note">
          {data.passed} passed of {total} scenarios
        </div>
      </article>

      <article className="panel metric-card">
        <div className="metric-label">Failures</div>
        <div className="metric-value score-risk">{data.failed}</div>
        <div className="metric-note">{failedHighImpact} critical or high impact</div>
      </article>

      <article className="panel metric-card">
        <div className="metric-label">Evidence Files</div>
        <div className="metric-value">{data.records.length}</div>
        <div className="metric-note">JSON records loaded for inspection</div>
      </article>
    </section>
  );
}
