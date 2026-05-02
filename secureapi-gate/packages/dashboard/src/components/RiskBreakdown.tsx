import type { EvidenceDashboardData } from "../lib/loadEvidence.js";

interface RiskBreakdownProps {
  data: EvidenceDashboardData;
}

export function RiskBreakdown({ data }: RiskBreakdownProps) {
  const failedHighImpact = data.rows
    .filter((row) => !row.passed && (row.severity === "critical" || row.severity === "high"))
    .slice(0, 5);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Risk Breakdown</h2>
          <p>CI decision, category score, and standards coverage.</p>
        </div>
      </div>

      <div className={`gate-card ${data.decision === "PASS" ? "gate-pass" : "gate-block"}`}>
        <span>CI/CD Gate</span>
        <strong>{data.decision}</strong>
        <small>
          Score {data.overallScore} / threshold {data.threshold}
        </small>
      </div>

      <div className="compact-table" aria-label="Category risk score breakdown">
        {data.categoryBreakdown.map((category) => (
          <div className="breakdown-row" key={category.category}>
            <span>{category.category}</span>
            <strong>{category.score}</strong>
            <small>
              {category.failed} failed, {category.deductions} deducted
            </small>
          </div>
        ))}
      </div>

      {failedHighImpact.length > 0 && (
        <div className="callout">
          <strong>Critical/high failures</strong>
          {failedHighImpact.map((row) => (
            <span key={row.scenarioId}>
              {row.scenarioId} · {row.title}
            </span>
          ))}
        </div>
      )}

      <h3 className="section-kicker">Standards Mapping</h3>
      <div className="standards-grid">
        {data.standardsCoverage.slice(0, 12).map((coverage) => (
          <span className="standard-chip" key={coverage.standard}>
            <span>{coverage.standard}</span>
            <strong>{coverage.count}</strong>
          </span>
        ))}
      </div>
    </section>
  );
}
