import type { EvidenceRecord, RiskScoreResult, SecurityTestRunResult } from "../types.js";
import { calculateRiskScore } from "../scoring/risk-score.js";
import { toEvidenceRecords } from "./json-evidence.js";

export interface HtmlReportOptions {
  title?: string;
  threshold?: number;
}

export function renderHtmlSummary(records: EvidenceRecord[], options: HtmlReportOptions = {}): string {
  const riskScore = calculateRiskScore(records, { threshold: options.threshold });
  const title = options.title ?? "SecureAPI-Gate Report";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #18212f; background: #f7f8fb; }
    main { max-width: 1180px; margin: 0 auto; }
    h1, h2 { margin-bottom: 8px; }
    .summary { display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); gap: 12px; margin: 24px 0; }
    .tile, table { background: #fff; border: 1px solid #d9deea; border-radius: 8px; }
    .tile { padding: 16px; }
    .label { color: #566274; font-size: 12px; text-transform: uppercase; }
    .value { font-size: 28px; font-weight: 700; margin-top: 6px; }
    .pass { color: #157347; }
    .block { color: #b42318; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0 28px; overflow: hidden; }
    th, td { border-bottom: 1px solid #e8ebf2; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #eef2f8; font-size: 13px; }
    tr:last-child td { border-bottom: 0; }
    code { background: #eef2f8; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body>
<main>
  <h1>${escapeHtml(title)}</h1>
  ${renderRiskSummary(riskScore)}
  <h2>Category Risk Breakdown</h2>
  ${renderCategoryTable(riskScore)}
  <h2>Scenario Evidence Summary</h2>
  ${renderScenarioTable(records)}
</main>
</body>
</html>
`;
}

export function renderHtmlSummaryFromRunResults(
  results: SecurityTestRunResult[],
  options: HtmlReportOptions = {}
): string {
  return renderHtmlSummary(toEvidenceRecords(results), options);
}

function renderRiskSummary(riskScore: RiskScoreResult): string {
  const decisionClass = riskScore.decision === "PASS" ? "pass" : "block";

  return `<section class="summary">
    <div class="tile"><div class="label">Overall Score</div><div class="value">${riskScore.overallScore}</div></div>
    <div class="tile"><div class="label">CI/CD Gate</div><div class="value ${decisionClass}">${riskScore.decision}</div></div>
    <div class="tile"><div class="label">Passed</div><div class="value pass">${riskScore.passed}</div></div>
    <div class="tile"><div class="label">Failed</div><div class="value block">${riskScore.failed}</div></div>
  </section>`;
}

function renderCategoryTable(riskScore: RiskScoreResult): string {
  return `<table>
    <thead><tr><th>Category</th><th>Total</th><th>Passed</th><th>Failed</th><th>Deductions</th><th>Score</th></tr></thead>
    <tbody>
      ${riskScore.categoryBreakdown
        .map(
          (category) => `<tr>
        <td>${escapeHtml(category.category)}</td>
        <td>${category.total}</td>
        <td>${category.passed}</td>
        <td>${category.failed}</td>
        <td>${category.deductions}</td>
        <td>${category.score}</td>
      </tr>`
        )
        .join("\n")}
    </tbody>
  </table>`;
}

function renderScenarioTable(records: EvidenceRecord[]): string {
  return `<table>
    <thead><tr><th>Scenario</th><th>Category</th><th>Endpoint</th><th>Actor</th><th>Status</th><th>Severity</th><th>Result</th></tr></thead>
    <tbody>
      ${records
        .map(
          (record) => `<tr>
        <td><code>${escapeHtml(record.scenarioId)}</code><br>${escapeHtml(record.title)}</td>
        <td>${escapeHtml(record.category)}</td>
        <td><code>${escapeHtml(`${record.method} ${record.endpoint}`)}</code></td>
        <td>${escapeHtml(record.actorRole)}</td>
        <td>${escapeHtml(String(record.observedStatus ?? "no response"))}</td>
        <td>${escapeHtml(record.severity)}</td>
        <td class="${record.passed ? "pass" : "block"}">${record.passed ? "PASS" : "FAIL"}</td>
      </tr>`
        )
        .join("\n")}
    </tbody>
  </table>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
