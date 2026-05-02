import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import {
  calculateRiskScore,
  type ConfigValidationError,
  type EvidenceRecord,
  loadOwnershipRulesConfig,
  loadRoleMatrixConfig,
  loadTestPolicyConfig,
  loadWorkflowRulesConfig,
  parseCsvSummary,
  parseOpenApiFile,
  parsePostmanCollectionFile,
  renderHtmlSummary,
  type RiskScoreResult
} from "@secureapi-gate/core";

export interface CommandLogger {
  log: (message: string) => void;
  error: (message: string) => void;
}

export const consoleLogger: CommandLogger = {
  log: (message) => console.log(message),
  error: (message) => console.error(message)
};

export async function parseApiSpec(specPath: string) {
  const extension = extname(specPath).toLowerCase();

  if (extension === ".json") {
    const raw = await readFile(specPath, "utf8");
    const document = JSON.parse(raw) as { info?: { schema?: string }; item?: unknown };

    if (document.info?.schema?.includes("postman") || Array.isArray(document.item)) {
      return parsePostmanCollectionFile(specPath);
    }
  }

  return parseOpenApiFile(specPath);
}

export async function readEvidenceRecords(evidenceDir: string): Promise<EvidenceRecord[]> {
  const { readdir } = await import("node:fs/promises");
  const fileNames = (await readdir(evidenceDir))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();
  const records = await Promise.all(
    fileNames.map(
      async (fileName) =>
        JSON.parse(await readFile(join(evidenceDir, fileName), "utf8")) as EvidenceRecord
    )
  );

  return records;
}

export async function writeTextFile(filePath: string, contents: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
}

export async function loadScoreFromCsv(
  summaryPath: string,
  threshold: number
): Promise<RiskScoreResult> {
  const csv = await readFile(summaryPath, "utf8");
  return calculateRiskScore(parseCsvSummary(csv), { threshold });
}

export function printRiskScore(
  score: RiskScoreResult,
  logger: CommandLogger = consoleLogger
): void {
  logger.log(`SecureAPI Risk Score: ${score.overallScore}`);
  logger.log(`CI/CD decision: ${score.decision}`);
  logger.log(`Passed: ${score.passed}`);
  logger.log(`Failed: ${score.failed}`);

  if (score.failedCriticalHighScenarios.length > 0) {
    logger.log("Failed critical/high scenarios:");
    for (const scenario of score.failedCriticalHighScenarios) {
      logger.log(`- ${scenario.scenarioId} [${scenario.severity}] ${scenario.title}`);
    }
  }
}

export function handleCommandError(error: unknown, logger: CommandLogger = consoleLogger): void {
  if (isConfigValidationError(error)) {
    logger.error(error.message);
    process.exitCode = 1;
    return;
  }

  logger.error(error instanceof Error ? error.message : "Unexpected SecureAPI-Gate CLI error.");
  process.exitCode = 1;
}

export async function validateConfigByFileName(configPath: string): Promise<string> {
  const lowerPath = configPath.toLowerCase();

  if (lowerPath.includes("test-policy")) {
    await loadTestPolicyConfig(configPath);
    return "test-policy.yml";
  }

  if (lowerPath.includes("ownership-rules")) {
    await loadOwnershipRulesConfig(configPath);
    return "ownership-rules.yml";
  }

  if (lowerPath.includes("workflow-rules")) {
    await loadWorkflowRulesConfig(configPath);
    return "workflow-rules.yml";
  }

  await loadRoleMatrixConfig(configPath);
  return "role-matrix.yml";
}

export function resolveDefaultSummaryPath(summaryPath?: string): string {
  return resolve(summaryPath ?? "./evidence/csv/results-summary.csv");
}

export async function renderReportFromEvidenceDir(
  evidenceDir: string,
  outPath: string,
  threshold?: number
): Promise<void> {
  const records = await readEvidenceRecords(evidenceDir);
  await writeTextFile(outPath, renderHtmlSummary(records, { threshold }));
}

function isConfigValidationError(error: unknown): error is ConfigValidationError {
  return error instanceof Error && error.name === "ConfigValidationError";
}
