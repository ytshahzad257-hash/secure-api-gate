import type { Command } from "commander";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { consoleLogger, handleCommandError, type CommandLogger } from "./shared.js";

export interface InitOptions {
  out?: string;
  force?: boolean;
}

const sampleConfigs: Record<string, string> = {
  "role-matrix.yml": `roles:
  user:
    tokenEnv: USER_TOKEN
  manager:
    tokenEnv: MANAGER_TOKEN
  admin:
    tokenEnv: ADMIN_TOKEN

ownership:
  userIdFields:
    - userId
    - ownerId
    - customerId
  tenantFields:
    - tenantId

sensitiveFields:
  - role
  - isAdmin
  - accountStatus
  - paymentStatus
  - approvalState

accessRules:
  - id: RULE-001
    role: user
    method: GET
    path: /profiles/{id}
    ownershipRequired: true

workflowRules:
  - object: approvalRequest
    allowedTransitions:
      draft: [submitted]
      submitted: [approved, rejected]
      approved: [paid]
      rejected: []
      paid: []
`,
  "test-policy.yml": `enabledCategories:
  - BOLA
  - BOPLA
  - BFLA
  - AUTH
  - SESSION
  - WORKFLOW
  - INVENTORY
  - THIRD_PARTY
  - ERROR_LEAKAGE
severityOverrides: {}
ciThreshold: 85
output:
  directory: ./evidence
redaction:
  headers:
    - authorization
  bodyFields:
    - token
    - password
timeoutMs: 5000
retryCount: 0
failFast: false
`,
  "ownership-rules.yml": `ownership:
  userIdFields:
    - userId
    - ownerId
    - customerId
  tenantFields:
    - tenantId
    - organizationId
`,
  "workflow-rules.yml": `workflowRules:
  - object: approvalRequest
    allowedTransitions:
      draft: [submitted]
      submitted: [approved, rejected]
      approved: [paid]
      rejected: []
      paid: []
`
};

export async function runInitCommand(
  options: InitOptions = {},
  logger: CommandLogger = consoleLogger
): Promise<void> {
  const outDir = options.out ?? "./secureapi-config";
  const configDir = join(outDir, "configs");

  await Promise.all([
    mkdir(configDir, { recursive: true }),
    mkdir(join(outDir, "evidence", "json"), { recursive: true }),
    mkdir(join(outDir, "evidence", "csv"), { recursive: true }),
    mkdir(join(outDir, "evidence", "html"), { recursive: true })
  ]);

  for (const [fileName, contents] of Object.entries(sampleConfigs)) {
    const filePath = join(configDir, fileName);

    try {
      await writeFile(filePath, contents, { encoding: "utf8", flag: options.force ? "w" : "wx" });
      logger.log(`created ${filePath}`);
    } catch (error) {
      if (isAlreadyExistsError(error) && !options.force) {
        logger.log(`skipped ${filePath}`);
        continue;
      }

      throw error;
    }
  }

  logger.log(`initialized SecureAPI-Gate config at ${outDir}`);
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Create sample SecureAPI-Gate configuration files")
    .option("--out <path>", "output directory", "./secureapi-config")
    .option("--force", "overwrite existing sample config files", false)
    .action(async (options: InitOptions) => {
      try {
        await runInitCommand(options);
      } catch (error) {
        handleCommandError(error);
      }
    });
}

function isAlreadyExistsError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "EEXIST";
}
