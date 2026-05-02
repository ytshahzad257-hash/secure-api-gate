import type { Severity } from "../types.js";

export const SEVERITY_DEDUCTIONS: Record<Severity, number> = {
  critical: 15,
  high: 10,
  medium: 6,
  low: 3
};

export function getSeverityDeduction(severity: Severity): number {
  return SEVERITY_DEDUCTIONS[severity];
}

export function isCriticalOrHigh(severity: Severity): severity is "critical" | "high" {
  return severity === "critical" || severity === "high";
}
