import type { Command } from "commander";
import {
  consoleLogger,
  handleCommandError,
  validateConfigByFileName,
  type CommandLogger
} from "./shared.js";

export interface ValidateConfigOptions {
  config: string;
}

export async function runValidateConfigCommand(
  options: ValidateConfigOptions,
  logger: CommandLogger = consoleLogger
): Promise<void> {
  const configType = await validateConfigByFileName(options.config);
  logger.log(`valid ${configType}: ${options.config}`);
}

export function registerValidateConfigCommand(program: Command): void {
  program
    .command("validate-config")
    .description("Validate a SecureAPI-Gate YAML configuration file")
    .requiredOption("--config <path>", "configuration file path")
    .action(async (options: ValidateConfigOptions) => {
      try {
        await runValidateConfigCommand(options);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
