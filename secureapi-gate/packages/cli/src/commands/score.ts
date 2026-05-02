import type { Command } from "commander";
import {
  consoleLogger,
  handleCommandError,
  loadScoreFromCsv,
  printRiskScore,
  type CommandLogger
} from "./shared.js";

export interface ScoreOptions {
  summary: string;
  threshold?: string;
}

export async function runScoreCommand(
  options: ScoreOptions,
  logger: CommandLogger = consoleLogger
): Promise<void> {
  const threshold = options.threshold ? Number(options.threshold) : 85;
  const score = await loadScoreFromCsv(options.summary, threshold);
  printRiskScore(score, logger);
}

export function registerScoreCommand(program: Command): void {
  program
    .command("score")
    .description("Calculate the SecureAPI risk score from a CSV summary")
    .requiredOption("--summary <path>", "CSV summary path")
    .option("--threshold <number>", "risk threshold used for PASS/BLOCK decision", "85")
    .action(async (options: ScoreOptions) => {
      try {
        await runScoreCommand(options);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
