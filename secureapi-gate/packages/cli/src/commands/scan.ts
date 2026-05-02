import type { Command } from "commander";
import {
  calculateRiskScore,
  generateSecurityTestCases,
  loadRoleMatrixConfig,
  loadTestPolicyConfig,
  runSecurityTests,
  writeEvidencePackage
} from "@secureapi-gate/core";
import {
  consoleLogger,
  handleCommandError,
  parseApiSpec,
  printRiskScore,
  type CommandLogger
} from "./shared.js";

export interface ScanOptions {
  spec: string;
  config: string;
  policy: string;
  baseUrl: string;
  out: string;
}

export async function runScanCommand(
  options: ScanOptions,
  logger: CommandLogger = consoleLogger
): Promise<void> {
  const [apiSpec, roleMatrix, testPolicy] = await Promise.all([
    parseApiSpec(options.spec),
    loadRoleMatrixConfig(options.config),
    loadTestPolicyConfig(options.policy)
  ]);
  const testCases = generateSecurityTestCases({
    apiSpec,
    roleMatrix,
    testPolicy
  });
  const results = await runSecurityTests(testCases, {
    baseUrl: options.baseUrl,
    roleMatrix,
    testPolicy
  });
  const paths = await writeEvidencePackage(results, {
    outDir: options.out,
    threshold: testPolicy.ciThreshold
  });
  const score = calculateRiskScore(results, { threshold: testPolicy.ciThreshold });

  logger.log(`Generated ${testCases.length} security test cases.`);
  logger.log(`Wrote JSON evidence to ${paths.jsonDir}`);
  logger.log(`Wrote CSV summary to ${paths.csvSummary}`);
  logger.log(`Wrote HTML report to ${paths.htmlReport}`);
  printRiskScore(score, logger);
}

export function registerScanCommand(program: Command): void {
  program
    .command("scan")
    .description("Generate and run security regression tests against a REST API")
    .requiredOption("--spec <path>", "OpenAPI or Postman specification path")
    .requiredOption("--config <path>", "role matrix configuration path")
    .requiredOption("--policy <path>", "test policy path")
    .requiredOption("--base-url <url>", "target API base URL")
    .requiredOption("--out <path>", "evidence output directory")
    .action(async (options: ScanOptions) => {
      try {
        await runScanCommand(options);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
