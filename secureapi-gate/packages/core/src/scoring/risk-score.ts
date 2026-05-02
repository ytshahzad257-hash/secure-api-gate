import type {
  CategoryRiskBreakdown,
  EvidenceRecord,
  FailedHighRiskScenario,
  RiskScoreResult,
  SecurityCategory,
  SecurityTestRunResult
} from "../types.js";
import { getSeverityDeduction, isCriticalOrHigh } from "./severity-model.js";

export type ScoreableSecurityResult = Pick<
  SecurityTestRunResult | EvidenceRecord,
  "scenarioId" | "category" | "title" | "passed" | "severity" | "riskWeight"
>;

export interface RiskScoreOptions {
  threshold?: number;
}

export function calculateRiskScore(
  results: ScoreableSecurityResult[],
  options: RiskScoreOptions = {}
): RiskScoreResult {
  const threshold = options.threshold ?? 85;
  const deductions = results.reduce(
    (total, result) => total + (result.passed ? 0 : getSeverityDeduction(result.severity)),
    0
  );
  const overallScore = clampScore(100 - deductions);
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  return {
    overallScore,
    threshold,
    decision: overallScore >= threshold ? "PASS" : "BLOCK",
    total: results.length,
    passed,
    failed,
    deductions,
    categoryBreakdown: calculateCategoryBreakdown(results),
    failedCriticalHighScenarios: findFailedCriticalHighScenarios(results)
  };
}

export function calculateCategoryBreakdown(
  results: ScoreableSecurityResult[]
): CategoryRiskBreakdown[] {
  const categories = [...new Set(results.map((result) => result.category))].sort();

  return categories.map((category) => {
    const categoryResults = results.filter((result) => result.category === category);
    const deductions = categoryResults.reduce(
      (total, result) => total + (result.passed ? 0 : getSeverityDeduction(result.severity)),
      0
    );
    const passed = categoryResults.filter((result) => result.passed).length;

    return {
      category,
      total: categoryResults.length,
      passed,
      failed: categoryResults.length - passed,
      deductions,
      score: clampScore(100 - deductions)
    };
  });
}

function findFailedCriticalHighScenarios(
  results: ScoreableSecurityResult[]
): FailedHighRiskScenario[] {
  return results
    .filter((result) => !result.passed && isCriticalOrHigh(result.severity))
    .map((result) => ({
      scenarioId: result.scenarioId,
      category: result.category as SecurityCategory,
      title: result.title,
      severity: result.severity as "critical" | "high",
      riskWeight: result.riskWeight
    }));
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
