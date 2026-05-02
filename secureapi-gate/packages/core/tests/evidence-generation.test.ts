import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SecurityTestRunResult, StandardsMapping } from "../src/index.js";
import {
  createCsvSummary,
  renderHtmlSummary,
  toEvidenceRecord,
  writeEvidencePackage
} from "../src/index.js";

const standardsMapping: StandardsMapping = {
  OWASP_API_Top_10_2023: ["API1:2023", "API5:2023"],
  OWASP_ASVS: ["V4", "V5"],
  NIST_SSDF: ["PW.7", "RV.1"]
};

const timestamp = "2026-05-02T12:00:00.000Z";

describe("evidence generation", () => {
  let outputDir: string;

  beforeEach(async () => {
    outputDir = await mkdtemp(join(tmpdir(), "secureapi-gate-evidence-"));
  });

  afterEach(async () => {
    await rm(outputDir, {
      recursive: true,
      force: true
    });
  });

  it("converts runner results into deterministic JSON evidence records", () => {
    const record = toEvidenceRecord(makeResult("SAG-BOLA-001", true), { timestamp });

    expect(record).toEqual({
      scenarioId: "SAG-BOLA-001",
      category: "BOLA",
      title: "Cross-owner profile read",
      description: "Attempts to read another user's profile.",
      endpoint: "/profiles/{id}",
      method: "GET",
      actorRole: "user",
      targetResourceOwner: "other-user",
      request: {
        method: "GET",
        url: "http://127.0.0.1/profiles/profile-owned-by-user-2",
        headersRedacted: {
          authorization: "[REDACTED]"
        },
        bodyRedacted: {
          token: "[REDACTED]"
        }
      },
      response: {
        status: 403,
        headersRedacted: {},
        bodyRedacted: {
          error: "forbidden"
        }
      },
      expectedBehavior: "The API denies cross-owner profile access.",
      expectedStatus: 403,
      observedStatus: 403,
      observedBehavior: "Observed response matched expected security behavior.",
      passed: true,
      severity: "high",
      riskWeight: 10,
      standardsMapping,
      recommendation: "Enforce object ownership checks before returning or mutating resource data.",
      timestamp,
      toolVersion: "0.1.0"
    });
  });

  it("creates CSV summaries with the required columns", () => {
    const csv = createCsvSummary([
      toEvidenceRecord(makeResult("SAG-BOLA-001", true), { timestamp }),
      toEvidenceRecord(makeResult("SAG-AUTH-001", false, "AUTH"), { timestamp })
    ]);

    expect(csv.split("\n")[0]).toBe(
      "scenarioId,category,title,endpoint,method,actorRole,expectedStatus,observedStatus,passed,severity,riskWeight,standards,recommendation"
    );
    expect(csv).toContain(
      "SAG-BOLA-001,BOLA,Cross-owner profile read,/profiles/{id},GET,user,403,403,true,high,10,API1:2023; API5:2023; V4; V5; PW.7; RV.1,Enforce object ownership checks before returning or mutating resource data."
    );
  });

  it("renders an HTML report with risk score, category breakdown, and scenarios", () => {
    const html = renderHtmlSummary(
      [
        toEvidenceRecord(makeResult("SAG-BOLA-001", true), { timestamp }),
        toEvidenceRecord(makeResult("SAG-AUTH-001", false, "AUTH"), { timestamp })
      ],
      {
        threshold: 95
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("SecureAPI-Gate Report");
    expect(html).toContain("BLOCK");
    expect(html).toContain("SAG-BOLA-001");
    expect(html).toContain("Category Risk Breakdown");
  });

  it("writes JSON evidence files, CSV summary, and HTML report", async () => {
    const paths = await writeEvidencePackage(
      [makeResult("SAG-BOLA-001", true), makeResult("SAG-AUTH-001", false, "AUTH")],
      {
        outDir: outputDir,
        timestamp,
        threshold: 95
      }
    );

    expect(paths.jsonFiles).toHaveLength(2);
    expect(paths.csvSummary).toBe(join(outputDir, "csv", "results-summary.csv"));
    expect(paths.htmlReport).toBe(join(outputDir, "html", "report.html"));

    const evidenceJson = JSON.parse(await readFile(paths.jsonFiles[0]!, "utf8")) as unknown;
    const csv = await readFile(paths.csvSummary, "utf8");
    const html = await readFile(paths.htmlReport, "utf8");

    expect(evidenceJson).toMatchObject({
      scenarioId: "SAG-BOLA-001",
      timestamp,
      toolVersion: "0.1.0"
    });
    expect(csv).toContain("scenarioId,category,title");
    expect(csv).toContain("SAG-AUTH-001");
    expect(html).toContain("BLOCK");
  });
});

function makeResult(
  scenarioId: string,
  passed: boolean,
  category: SecurityTestRunResult["category"] = "BOLA"
): SecurityTestRunResult {
  return {
    scenarioId,
    category,
    title: category === "BOLA" ? "Cross-owner profile read" : "Missing token request",
    description:
      category === "BOLA"
        ? "Attempts to read another user's profile."
        : "Calls a protected endpoint without a token.",
    endpoint: "/profiles/{id}",
    method: "GET",
    actorRole: category === "AUTH" ? "anonymous" : "user",
    targetResourceOwner: category === "BOLA" ? "other-user" : undefined,
    expectedBehavior:
      category === "BOLA"
        ? "The API denies cross-owner profile access."
        : "The API rejects missing credentials.",
    expectedStatus: category === "AUTH" ? 401 : 403,
    observedStatus: passed ? (category === "AUTH" ? 401 : 403) : 200,
    observedBehavior: passed
      ? "Observed response matched expected security behavior."
      : "expected HTTP 401 but observed HTTP 200",
    passed,
    severity: "high",
    riskWeight: 10,
    standardsMapping,
    request: {
      method: "GET",
      url: "http://127.0.0.1/profiles/profile-owned-by-user-2",
      headersRedacted: {
        authorization: "[REDACTED]"
      },
      bodyRedacted: {
        token: "[REDACTED]"
      }
    },
    response: {
      status: passed ? (category === "AUTH" ? 401 : 403) : 200,
      headersRedacted: {},
      bodyRedacted: {
        error: passed ? "forbidden" : "ok"
      }
    },
    attempts: 1,
    durationMs: 3
  };
}
