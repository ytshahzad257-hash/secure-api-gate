import type { EvidenceRecord, SecurityCategory, SecurityTestRunResult, Severity } from "../types.js";
import type { ScoreableSecurityResult } from "../scoring/risk-score.js";
import { toEvidenceRecords } from "./json-evidence.js";

export const CSV_SUMMARY_COLUMNS = [
  "scenarioId",
  "category",
  "title",
  "endpoint",
  "method",
  "actorRole",
  "expectedStatus",
  "observedStatus",
  "passed",
  "severity",
  "riskWeight",
  "standards",
  "recommendation"
] as const;

export function createCsvSummary(records: EvidenceRecord[]): string {
  const rows = records.map((record) =>
    [
      record.scenarioId,
      record.category,
      record.title,
      record.endpoint,
      record.method,
      record.actorRole,
      record.expectedStatus ?? "",
      record.observedStatus ?? "",
      record.passed,
      record.severity,
      record.riskWeight,
      formatStandards(record),
      record.recommendation
    ].map(escapeCsvValue)
  );

  return `${CSV_SUMMARY_COLUMNS.join(",")}\n${rows.map((row) => row.join(",")).join("\n")}\n`;
}

export function createCsvSummaryFromRunResults(
  results: SecurityTestRunResult[],
  timestamp?: string
): string {
  return createCsvSummary(toEvidenceRecords(results, { timestamp }));
}

export function parseCsvSummary(csv: string): ScoreableSecurityResult[] {
  const rows = parseCsvRows(csv).filter((row) => row.some((cell) => cell.trim().length > 0));

  if (rows.length === 0) {
    return [];
  }

  const [header, ...dataRows] = rows;

  if (!header) {
    return [];
  }

  const indexes: Record<string, number | undefined> = Object.fromEntries(
    header.map((column, index) => [column, index])
  );

  for (const column of ["scenarioId", "category", "title", "passed", "severity", "riskWeight"]) {
    if (indexes[column] === undefined) {
      throw new Error(`CSV summary is missing required column "${column}".`);
    }
  }

  return dataRows.map((row, index) => ({
    scenarioId: getRequiredCell(row, indexes.scenarioId!, index, "scenarioId"),
    category: getRequiredCell(row, indexes.category!, index, "category") as SecurityCategory,
    title: getRequiredCell(row, indexes.title!, index, "title"),
    passed: parseBooleanCell(getRequiredCell(row, indexes.passed!, index, "passed"), index),
    severity: getRequiredCell(row, indexes.severity!, index, "severity") as Severity,
    riskWeight: parseNumberCell(getRequiredCell(row, indexes.riskWeight!, index, "riskWeight"), index)
  }));
}

function formatStandards(record: EvidenceRecord): string {
  return [
    ...record.standardsMapping.OWASP_API_Top_10_2023,
    ...record.standardsMapping.OWASP_ASVS,
    ...record.standardsMapping.NIST_SSDF
  ].join("; ");
}

function escapeCsvValue(value: unknown): string {
  const text = String(value);

  if (!/[",\n\r]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
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

function getRequiredCell(row: string[], index: number, rowIndex: number, column: string): string {
  const value = row[index];

  if (value === undefined || value.length === 0) {
    throw new Error(`CSV summary row ${rowIndex + 2} is missing "${column}".`);
  }

  return value;
}

function parseBooleanCell(value: string, rowIndex: number): boolean {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`CSV summary row ${rowIndex + 2} has invalid boolean value "${value}".`);
}

function parseNumberCell(value: string, rowIndex: number): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`CSV summary row ${rowIndex + 2} has invalid numeric value "${value}".`);
  }

  return parsed;
}
