import { describe, expect, it } from "vitest";
import type { SecurityTestRunResult, StandardsMapping } from "../src/index.js";
import { calculateRiskScore, decideCiGate } from "../src/index.js";

const standardsMapping: StandardsMapping = {
  OWASP_API_Top_10_2023: ["API1:2023"],
  OWASP_ASVS: ["V4"],
  NIST_SSDF: ["RV.1"]
};

describe("risk scoring", () => {
  it("deducts failed scenario points by severity and caps the score at zero", () => {
    const results = [
      makeResult("SAG-BFLA-001", "BFLA", "critical", false),
      makeResult("SAG-BOLA-001", "BOLA", "high", false),
      makeResult("SAG-ERR-001", "ERROR_LEAKAGE", "medium", false),
      makeResult("SAG-INV-001", "INVENTORY", "low", false),
      makeResult("SAG-AUTH-001", "AUTH", "high", true)
    ];

    const score = calculateRiskScore(results, { threshold: 85 });

    expect(score).toMatchObject({
      overallScore: 66,
      threshold: 85,
      decision: "BLOCK",
      total: 5,
      passed: 1,
      failed: 4,
      deductions: 34
    });
    expect(score.failedCriticalHighScenarios).toEqual([
      {
        scenarioId: "SAG-BFLA-001",
        category: "BFLA",
        title: "SAG-BFLA-001 title",
        severity: "critical",
        riskWeight: 15
      },
      {
        scenarioId: "SAG-BOLA-001",
        category: "BOLA",
        title: "SAG-BOLA-001 title",
        severity: "high",
        riskWeight: 10
      }
    ]);
  });

  it("calculates category score breakdowns", () => {
    const score = calculateRiskScore([
      makeResult("SAG-BOLA-001", "BOLA", "high", false),
      makeResult("SAG-BOLA-002", "BOLA", "high", true),
      makeResult("SAG-AUTH-001", "AUTH", "medium", false)
    ]);

    expect(score.categoryBreakdown).toEqual([
      {
        category: "AUTH",
        total: 1,
        passed: 0,
        failed: 1,
        deductions: 6,
        score: 94
      },
      {
        category: "BOLA",
        total: 2,
        passed: 1,
        failed: 1,
        deductions: 10,
        score: 90
      }
    ]);
  });

  it("returns CI pass and block decisions with exit codes", () => {
    expect(decideCiGate([makeResult("SAG-BOLA-001", "BOLA", "high", true)], 85)).toMatchObject({
      score: 100,
      decision: "PASS",
      exitCode: 0
    });

    expect(decideCiGate([makeResult("SAG-BOLA-001", "BOLA", "high", false)], 95)).toMatchObject({
      score: 90,
      decision: "BLOCK",
      exitCode: 1
    });
  });
});

function makeResult(
  scenarioId: string,
  category: SecurityTestRunResult["category"],
  severity: SecurityTestRunResult["severity"],
  passed: boolean
): SecurityTestRunResult {
  const riskWeights: Record<SecurityTestRunResult["severity"], number> = {
    critical: 15,
    high: 10,
    medium: 6,
    low: 3
  };

  return {
    scenarioId,
    category,
    title: `${scenarioId} title`,
    description: `${scenarioId} description`,
    endpoint: "/profiles/{id}",
    method: "GET",
    actorRole: "user",
    expectedBehavior: "The API denies unsafe behavior.",
    expectedStatus: 403,
    observedStatus: passed ? 403 : 200,
    observedBehavior: passed ? "Matched expected behavior." : "Expected 403 but observed 200.",
    passed,
    severity,
    riskWeight: riskWeights[severity],
    standardsMapping,
    request: {
      method: "GET",
      url: "http://127.0.0.1/profiles/profile-owned-by-user-2",
      headersRedacted: {
        authorization: "[REDACTED]"
      }
    },
    response: {
      status: passed ? 403 : 200,
      headersRedacted: {},
      bodyRedacted: {
        error: passed ? "forbidden" : "ok"
      }
    },
    attempts: 1,
    durationMs: 2
  };
}
