import type { RiskScoreResult } from "../types.js";
import { calculateRiskScore, type ScoreableSecurityResult } from "./risk-score.js";

export interface CiGateDecision {
  threshold: number;
  score: number;
  decision: "PASS" | "BLOCK";
  exitCode: 0 | 1;
  riskScore: RiskScoreResult;
}

export function decideCiGate(results: ScoreableSecurityResult[], threshold = 85): CiGateDecision {
  const riskScore = calculateRiskScore(results, { threshold });

  return {
    threshold,
    score: riskScore.overallScore,
    decision: riskScore.decision,
    exitCode: riskScore.decision === "PASS" ? 0 : 1,
    riskScore
  };
}
