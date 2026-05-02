import type { Command } from "commander";
import {
  consoleLogger,
  handleCommandError,
  renderReportFromEvidenceDir,
  type CommandLogger
} from "./shared.js";

export interface ReportOptions {
  evidence: string;
  out: string;
  threshold?: string;
}

export async function runReportCommand(
  options: ReportOptions,
  logger: CommandLogger = consoleLogger
): Promise<void> {
  await renderReportFromEvidenceDir(
    options.evidence,
    options.out,
    options.threshold ? Number(options.threshold) : undefined
  );
  logger.log(`Wrote HTML report to ${options.out}`);
}

export function registerReportCommand(program: Command): void {
  program
    .command("report")
    .description("Generate an HTML report from evidence files")
    .requiredOption("--evidence <path>", "evidence JSON directory")
    .requiredOption("--out <path>", "HTML report output path")
    .option("--threshold <number>", "risk threshold for report decision")
    .action(async (options: ReportOptions) => {
      try {
        await runReportCommand(options);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
