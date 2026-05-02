export interface HtmlReportScenario {
  scenarioId: string;
  category: string;
  title: string;
  endpoint: string;
  method: string;
  actorRole: string;
  observedStatus: number | null;
  passed: boolean;
  severity: string;
}

export interface HtmlReportSummary {
  overallScore: number;
  decision: "PASS" | "BLOCK";
  passed: number;
  failed: number;
}

export interface HtmlReportInput {
  title?: string;
  summary?: HtmlReportSummary;
  scenarios?: HtmlReportScenario[];
}

export function renderHtmlReport(input: HtmlReportInput | string = {}): string {
  const reportInput = typeof input === "string" ? { title: input } : input;
  const title = reportInput.title ?? "SecureAPI-Gate Report";
  const summary = reportInput.summary;
  const scenarios = reportInput.scenarios ?? [];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    ${
      summary
        ? `<p>Score: ${summary.overallScore} | Decision: ${summary.decision} | Passed: ${summary.passed} | Failed: ${summary.failed}</p>`
        : "<p>No summary data provided.</p>"
    }
    <table>
      <thead><tr><th>Scenario</th><th>Category</th><th>Endpoint</th><th>Actor</th><th>Status</th><th>Result</th></tr></thead>
      <tbody>
        ${scenarios
          .map(
            (scenario) => `<tr>
          <td>${escapeHtml(scenario.scenarioId)} ${escapeHtml(scenario.title)}</td>
          <td>${escapeHtml(scenario.category)}</td>
          <td>${escapeHtml(`${scenario.method} ${scenario.endpoint}`)}</td>
          <td>${escapeHtml(scenario.actorRole)}</td>
          <td>${escapeHtml(String(scenario.observedStatus ?? "no response"))}</td>
          <td>${scenario.passed ? "PASS" : "FAIL"}</td>
        </tr>`
          )
          .join("\n")}
      </tbody>
    </table>
  </main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
