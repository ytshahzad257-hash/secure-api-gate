export type GateDecision = "PASS" | "BLOCK";
export type Severity = "critical" | "high" | "medium" | "low";

export interface EvidenceCsvRow {
  scenarioId: string;
  category: string;
  title: string;
  endpoint: string;
  method: string;
  actorRole: string;
  expectedStatus: string;
  observedStatus: string;
  passed: boolean;
  severity: Severity;
  riskWeight: number;
  standards: string[];
  recommendation: string;
}

export interface EvidenceJsonRecord extends EvidenceCsvRow {
  description?: string;
  expectedBehavior?: string;
  observedBehavior?: string;
  targetResourceOwner?: string;
  request?: {
    method: string;
    url: string;
    headersRedacted: Record<string, string>;
    bodyRedacted?: unknown;
  };
  response?: {
    status: number | null;
    headersRedacted: Record<string, string>;
    bodyRedacted?: unknown;
  };
  standardsMapping?: {
    OWASP_API_Top_10_2023: string[];
    OWASP_ASVS: string[];
    NIST_SSDF: string[];
  };
  timestamp?: string;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  passed: number;
  failed: number;
  deductions: number;
  score: number;
}

export interface EndpointRisk {
  routeKey: string;
  endpoint: string;
  method: string;
  total: number;
  failed: number;
  maxSeverity: Severity;
  risk: number;
}

export interface StandardsCoverage {
  standard: string;
  count: number;
}

export interface EvidenceDashboardData {
  rows: EvidenceCsvRow[];
  records: EvidenceJsonRecord[];
  overallScore: number;
  decision: GateDecision;
  passed: number;
  failed: number;
  threshold: number;
  categoryBreakdown: CategoryBreakdown[];
  endpointRisks: EndpointRisk[];
  standardsCoverage: StandardsCoverage[];
  loadErrors: string[];
}

const DEFAULT_THRESHOLD = 85;
const severityDeductions: Record<Severity, number> = {
  critical: 15,
  high: 10,
  medium: 6,
  low: 3
};
const severityRank: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

export async function loadEvidence(): Promise<EvidenceDashboardData> {
  const loadErrors: string[] = [];
  const rows = await loadCsvRows(loadErrors);
  const records = await loadJsonRecords(rows, loadErrors);

  return buildDashboardData(rows, records, loadErrors);
}

export function buildDashboardData(
  rows: EvidenceCsvRow[],
  records: EvidenceJsonRecord[],
  loadErrors: string[] = []
): EvidenceDashboardData {
  const failedRows = rows.filter((row) => !row.passed);
  const deductions = failedRows.reduce((total, row) => total + severityDeductions[row.severity], 0);
  const overallScore = Math.max(0, 100 - deductions);

  return {
    rows,
    records,
    overallScore,
    decision: overallScore >= DEFAULT_THRESHOLD ? "PASS" : "BLOCK",
    passed: rows.length - failedRows.length,
    failed: failedRows.length,
    threshold: DEFAULT_THRESHOLD,
    categoryBreakdown: buildCategoryBreakdown(rows),
    endpointRisks: buildEndpointRisks(rows),
    standardsCoverage: buildStandardsCoverage(rows, records),
    loadErrors
  };
}

async function loadCsvRows(loadErrors: string[]): Promise<EvidenceCsvRow[]> {
  try {
    const response = await fetch("/evidence/csv/results-summary.csv", {
      cache: "no-store"
    });

    if (!response.ok) {
      loadErrors.push(`Unable to load evidence CSV: HTTP ${response.status}`);
      return [];
    }

    return parseCsvSummary(await response.text());
  } catch (error) {
    loadErrors.push(error instanceof Error ? error.message : "Unable to load evidence CSV.");
    return [];
  }
}

async function loadJsonRecords(
  rows: EvidenceCsvRow[],
  loadErrors: string[]
): Promise<EvidenceJsonRecord[]> {
  const settled = await Promise.allSettled(
    rows.map(async (row) => {
      const response = await fetch(`/evidence/json/${row.scenarioId}.json`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`${row.scenarioId}: HTTP ${response.status}`);
      }

      return normalizeEvidenceRecord((await response.json()) as Partial<EvidenceJsonRecord>, row);
    })
  );

  return settled.flatMap((result) => {
    if (result.status === "fulfilled") {
      return [result.value];
    }

    loadErrors.push(`Unable to load evidence JSON ${String(result.reason)}`);
    return [];
  });
}

export function parseCsvSummary(csv: string): EvidenceCsvRow[] {
  const rows = parseCsvRows(csv).filter((row) => row.some((cell) => cell.trim().length > 0));

  if (rows.length <= 1) {
    return [];
  }

  const [header, ...dataRows] = rows;
  const indexes = Object.fromEntries((header ?? []).map((column, index) => [column, index]));

  return dataRows.map((row) => ({
    scenarioId: readCell(row, indexes.scenarioId),
    category: readCell(row, indexes.category),
    title: readCell(row, indexes.title),
    endpoint: readCell(row, indexes.endpoint),
    method: readCell(row, indexes.method),
    actorRole: readCell(row, indexes.actorRole),
    expectedStatus: readCell(row, indexes.expectedStatus),
    observedStatus: readCell(row, indexes.observedStatus),
    passed: readCell(row, indexes.passed) === "true",
    severity: normalizeSeverity(readCell(row, indexes.severity)),
    riskWeight: Number(readCell(row, indexes.riskWeight)) || 0,
    standards: readCell(row, indexes.standards)
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean),
    recommendation: readCell(row, indexes.recommendation)
  }));
}

function buildCategoryBreakdown(rows: EvidenceCsvRow[]): CategoryBreakdown[] {
  const categories = [...new Set(rows.map((row) => row.category))].sort();

  return categories.map((category) => {
    const categoryRows = rows.filter((row) => row.category === category);
    const failedRows = categoryRows.filter((row) => !row.passed);
    const deductions = failedRows.reduce(
      (total, row) => total + severityDeductions[row.severity],
      0
    );

    return {
      category,
      total: categoryRows.length,
      passed: categoryRows.length - failedRows.length,
      failed: failedRows.length,
      deductions,
      score: Math.max(0, 100 - deductions)
    };
  });
}

function buildEndpointRisks(rows: EvidenceCsvRow[]): EndpointRisk[] {
  const routeKeys = [...new Set(rows.map((row) => `${row.method} ${row.endpoint}`))];

  return routeKeys
    .map((routeKey) => {
      const endpointRows = rows.filter((row) => `${row.method} ${row.endpoint}` === routeKey);
      const failedRows = endpointRows.filter((row) => !row.passed);
      const maxSeverity = endpointRows.reduce<Severity>(
        (max, row) => (severityRank[row.severity] > severityRank[max] ? row.severity : max),
        "low"
      );

      return {
        routeKey,
        endpoint: endpointRows[0]?.endpoint ?? "",
        method: endpointRows[0]?.method ?? "",
        total: endpointRows.length,
        failed: failedRows.length,
        maxSeverity,
        risk: failedRows.reduce((total, row) => total + severityDeductions[row.severity], 0)
      };
    })
    .sort((left, right) => right.risk - left.risk || right.failed - left.failed);
}

function buildStandardsCoverage(
  rows: EvidenceCsvRow[],
  records: EvidenceJsonRecord[]
): StandardsCoverage[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    for (const standard of row.standards) {
      counts.set(standard, (counts.get(standard) ?? 0) + 1);
    }
  }

  for (const record of records) {
    for (const standard of [
      ...(record.standardsMapping?.OWASP_API_Top_10_2023 ?? []),
      ...(record.standardsMapping?.OWASP_ASVS ?? []),
      ...(record.standardsMapping?.NIST_SSDF ?? [])
    ]) {
      if (!counts.has(standard)) {
        counts.set(standard, 1);
      }
    }
  }

  return [...counts.entries()]
    .map(([standard, count]) => ({ standard, count }))
    .sort((left, right) => right.count - left.count || left.standard.localeCompare(right.standard));
}

function normalizeEvidenceRecord(
  record: Partial<EvidenceJsonRecord>,
  fallback: EvidenceCsvRow
): EvidenceJsonRecord {
  return {
    ...fallback,
    ...record,
    passed: typeof record.passed === "boolean" ? record.passed : fallback.passed,
    riskWeight: typeof record.riskWeight === "number" ? record.riskWeight : fallback.riskWeight,
    severity: normalizeSeverity(record.severity ?? fallback.severity),
    standards: fallback.standards
  };
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const nextCharacter = csv[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function readCell(row: string[], index: number | undefined): string {
  return index === undefined ? "" : (row[index] ?? "");
}

function normalizeSeverity(value: string): Severity {
  if (value === "critical" || value === "high" || value === "medium" || value === "low") {
    return value;
  }

  return "low";
}
