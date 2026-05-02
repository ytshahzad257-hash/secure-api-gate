import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { EvidenceRecord, SecurityTestRunResult } from "../types.js";
import { createCsvSummary } from "./csv-summary.js";
import { getEvidenceFileName, serializeEvidenceRecord, toEvidenceRecords } from "./json-evidence.js";
import { renderHtmlSummary } from "./html-summary.js";

export interface EvidencePackageOptions {
  outDir: string;
  timestamp?: string;
  threshold?: number;
}

export interface EvidencePackagePaths {
  jsonDir: string;
  csvDir: string;
  htmlDir: string;
  jsonFiles: string[];
  csvSummary: string;
  htmlReport: string;
}

export async function writeEvidencePackage(
  results: SecurityTestRunResult[],
  options: EvidencePackageOptions
): Promise<EvidencePackagePaths> {
  const records = toEvidenceRecords(results, { timestamp: options.timestamp });
  const jsonDir = join(options.outDir, "json");
  const csvDir = join(options.outDir, "csv");
  const htmlDir = join(options.outDir, "html");

  await Promise.all([mkdir(jsonDir, { recursive: true }), mkdir(csvDir, { recursive: true }), mkdir(htmlDir, { recursive: true })]);

  const jsonFiles = await writeJsonEvidenceFiles(records, jsonDir);
  const csvSummary = join(csvDir, "results-summary.csv");
  const htmlReport = join(htmlDir, "report.html");

  await Promise.all([
    writeFile(csvSummary, createCsvSummary(records), "utf8"),
    writeFile(htmlReport, renderHtmlSummary(records, { threshold: options.threshold }), "utf8")
  ]);

  return {
    jsonDir,
    csvDir,
    htmlDir,
    jsonFiles,
    csvSummary,
    htmlReport
  };
}

export async function writeJsonEvidenceFiles(
  records: EvidenceRecord[],
  jsonDir: string
): Promise<string[]> {
  await mkdir(jsonDir, { recursive: true });

  const filePaths = records.map((record) => join(jsonDir, getEvidenceFileName(record)));

  await Promise.all(
    records.map((record, index) => writeFile(filePaths[index]!, serializeEvidenceRecord(record), "utf8"))
  );

  return filePaths;
}
