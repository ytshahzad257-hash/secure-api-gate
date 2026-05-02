import type { Command } from "commander";
import {
  consoleLogger,
  handleCommandError,
  loadScoreFromCsv,
  printRiskScore,
  resolveDefaultSummaryPath,
  type CommandLogger
} from "./shared.js";

export interface CiOptions {
  threshold: string;
  summary?: string;
}

export async function runCiCommand(
  options: CiOptions,
  logger: CommandLogger = consoleLogger
): Promise<void> {
  const threshold = Number(options.threshold);
  const summaryPath = resolveDefaultSummaryPath(options.summary);
  const score = await loadScoreFromCsv(summaryPath, threshold);

  printRiskScore(score, logger);
  process.exitCode = score.decision === "PASS" ? 0 : 1;
}

export function registerCiCommand(program: Command): void {
  program
    .command("ci")
    .description("Run the CI/CD risk gate")
    .requiredOption("--threshold <number>", "minimum passing SecureAPI risk score")
    .option("--summary <path>", "CSV summary path", "./evidence/csv/results-summary.csv")
    .action(async (options: CiOptions) => {
      try {
        await runCiCommand(options);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
