#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { TOOL_VERSION } from "@secureapi-gate/core";
import { registerCiCommand } from "./commands/ci.js";
import { registerInitCommand } from "./commands/init.js";
import { registerReportCommand } from "./commands/report.js";
import { registerScanCommand } from "./commands/scan.js";
import { registerScoreCommand } from "./commands/score.js";
import { registerValidateConfigCommand } from "./commands/validate-config.js";

export function buildProgram(): Command {
  const program = new Command();

  program
    .name("secureapi")
    .description("SecureAPI-Gate security regression testing CLI")
    .version(TOOL_VERSION);

  registerInitCommand(program);
  registerValidateConfigCommand(program);
  registerScanCommand(program);
  registerReportCommand(program);
  registerScoreCommand(program);
  registerCiCommand(program);

  return program;
}

const currentFile = fileURLToPath(import.meta.url);

if (process.argv[1] === currentFile) {
  buildProgram().parse(process.argv);
}
