import { createServer, type Server } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createCsvSummary,
  toEvidenceRecord,
  type SecurityTestRunResult
} from "@secureapi-gate/core";
import { runCiCommand } from "../src/commands/ci.js";
import { runInitCommand } from "../src/commands/init.js";
import { runReportCommand } from "../src/commands/report.js";
import { runScanCommand } from "../src/commands/scan.js";
import { runScoreCommand } from "../src/commands/score.js";
import { runValidateConfigCommand } from "../src/commands/validate-config.js";
import { buildProgram } from "../src/index.js";

describe("secureapi CLI", () => {
  it("registers the required top-level commands", () => {
    const commandNames = buildProgram().commands.map((command) => command.name());

    expect(commandNames).toEqual(
      expect.arrayContaining(["init", "validate-config", "scan", "report", "score", "ci"])
    );
  });
});

describe("CLI command actions", () => {
  let workDir: string;
  const logger = createTestLogger();

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), "secureapi-cli-"));
    logger.clear();
    process.exitCode = undefined;
  });

  afterEach(async () => {
    process.exitCode = undefined;
    await rm(workDir, {
      recursive: true,
      force: true
    });
  });

  it("initializes sample configs and evidence directories", async () => {
    await runInitCommand({ out: workDir }, logger);

    await expect(readFile(join(workDir, "configs", "role-matrix.yml"), "utf8")).resolves.toContain(
      "roles:"
    );
    await expect(readFile(join(workDir, "configs", "test-policy.yml"), "utf8")).resolves.toContain(
      "enabledCategories:"
    );
    expect(logger.lines.at(-1)).toBe(`initialized SecureAPI-Gate config at ${workDir}`);
  });

  it("validates config files with readable success output", async () => {
    await writeConfigFiles(workDir);

    await runValidateConfigCommand({ config: join(workDir, "role-matrix.yml") }, logger);

    expect(logger.lines).toContain(`valid role-matrix.yml: ${join(workDir, "role-matrix.yml")}`);
  });

  it("scores CSV summaries and sets CI exit code for block decisions", async () => {
    const summaryPath = join(workDir, "results-summary.csv");
    await writeFile(
      summaryPath,
      createCsvSummary([
        toEvidenceRecord(makeResult("SAG-BOLA-001", false)),
        toEvidenceRecord(makeResult("SAG-BOLA-002", true))
      ]),
      "utf8"
    );

    await runScoreCommand({ summary: summaryPath, threshold: "95" }, logger);
    expect(logger.lines).toContain("SecureAPI Risk Score: 90");
    expect(logger.lines).toContain("CI/CD decision: BLOCK");

    await runCiCommand({ summary: summaryPath, threshold: "95" }, logger);
    expect(process.exitCode).toBe(1);
  });

  it("generates an HTML report from evidence JSON files", async () => {
    const evidenceDir = join(workDir, "json");
    const outPath = join(workDir, "html", "report.html");
    await writeFileTree(
      join(evidenceDir, "SAG-BOLA-001.json"),
      JSON.stringify(toEvidenceRecord(makeResult("SAG-BOLA-001", true)), null, 2)
    );

    await runReportCommand({ evidence: evidenceDir, out: outPath, threshold: "85" }, logger);

    await expect(readFile(outPath, "utf8")).resolves.toContain("SecureAPI-Gate Report");
    expect(logger.lines).toContain(`Wrote HTML report to ${outPath}`);
  });

  it("runs scan end-to-end against a controlled local fixture API", async () => {
    await writeConfigFiles(workDir);
    const specPath = join(workDir, "openapi.yml");
    const outDir = join(workDir, "evidence");
    await writeFile(
      specPath,
      `openapi: 3.0.3
info:
  title: CLI Scan Fixture
  version: 1.0.0
paths:
  /profiles/{id}:
    get:
      responses:
        "403":
          description: forbidden
  /orders/{id}:
    get:
      responses:
        "403":
          description: forbidden
  /payments/{id}:
    get:
      responses:
        "403":
          description: forbidden
  /tickets/{id}:
    patch:
      responses:
        "403":
          description: forbidden
  /approvals/{id}/transition:
    post:
      responses:
        "403":
          description: forbidden
`,
      "utf8"
    );
    const server = await createForbiddenServer();

    try {
      await runScanCommand(
        {
          spec: specPath,
          config: join(workDir, "role-matrix.yml"),
          policy: join(workDir, "test-policy.yml"),
          baseUrl: server.baseUrl,
          out: outDir
        },
        logger
      );
    } finally {
      await server.close();
    }

    await expect(readFile(join(outDir, "json", "SAG-BOLA-001.json"), "utf8")).resolves.toContain(
      '"scenarioId": "SAG-BOLA-001"'
    );
    await expect(readFile(join(outDir, "csv", "results-summary.csv"), "utf8")).resolves.toContain(
      "SAG-BOLA-001"
    );
    await expect(readFile(join(outDir, "html", "report.html"), "utf8")).resolves.toContain(
      "SecureAPI-Gate Report"
    );
    expect(logger.lines).toContain("Generated 5 security test cases.");
  });
});

function createTestLogger() {
  const lines: string[] = [];
  const errors: string[] = [];

  return {
    lines,
    errors,
    log: (message: string) => lines.push(message),
    error: (message: string) => errors.push(message),
    clear: () => {
      lines.length = 0;
      errors.length = 0;
    }
  };
}

async function writeConfigFiles(directory: string): Promise<void> {
  await writeFile(
    join(directory, "role-matrix.yml"),
    `roles:
  user:
    tokenEnv: USER_TOKEN
  admin:
    tokenEnv: ADMIN_TOKEN
ownership:
  userIdFields:
    - userId
sensitiveFields:
  - role
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
      submitted: []
`,
    "utf8"
  );
  await writeFile(
    join(directory, "test-policy.yml"),
    `enabledCategories:
  - BOLA
severityOverrides: {}
ciThreshold: 85
output:
  directory: ./evidence
redaction:
  headers:
    - authorization
  bodyFields:
    - token
timeoutMs: 500
retryCount: 0
failFast: false
`,
    "utf8"
  );
}

async function writeFileTree(filePath: string, contents: string): Promise<void> {
  const { mkdir } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
}

function makeResult(scenarioId: string, passed: boolean): SecurityTestRunResult {
  return {
    scenarioId,
    category: "BOLA",
    title: `${scenarioId} title`,
    description: `${scenarioId} description`,
    endpoint: "/profiles/{id}",
    method: "GET",
    actorRole: "user",
    expectedBehavior: "The API denies cross-owner profile access.",
    expectedStatus: 403,
    observedStatus: passed ? 403 : 200,
    observedBehavior: passed
      ? "Observed response matched expected security behavior."
      : "expected 403",
    passed,
    severity: "high",
    riskWeight: 10,
    standardsMapping: {
      OWASP_API_Top_10_2023: ["API1:2023"],
      OWASP_ASVS: ["V4"],
      NIST_SSDF: ["RV.1"]
    },
    request: {
      method: "GET",
      url: "http://127.0.0.1/profiles/profile-owned-by-user-2",
      headersRedacted: {}
    },
    response: {
      status: passed ? 403 : 200,
      headersRedacted: {},
      bodyRedacted: {}
    },
    attempts: 1,
    durationMs: 1
  };
}

async function createForbiddenServer(): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const server = createServer((_request, response) => {
    response.writeHead(403, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "forbidden" }));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Unable to start CLI fixture server.");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => closeServer(server)
  };
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
