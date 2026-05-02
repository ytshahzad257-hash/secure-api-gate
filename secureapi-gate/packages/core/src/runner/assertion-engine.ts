import type { AssertionResult, GeneratedSecurityTestCase, HttpExecutionError } from "../types.js";

export interface AssertionInput {
  testCase: GeneratedSecurityTestCase;
  observedStatus: number | null;
  responseBody: unknown;
  error?: HttpExecutionError;
}

export function assertSecurityTestResult(input: AssertionInput): AssertionResult {
  const failures: string[] = [];

  if (input.error) {
    failures.push(`${input.error.type}: ${input.error.message}`);
  }

  if (typeof input.testCase.expectedStatus === "number") {
    if (input.observedStatus !== input.testCase.expectedStatus) {
      failures.push(
        `expected HTTP ${input.testCase.expectedStatus} but observed ${formatObservedStatus(input.observedStatus)}`
      );
    }
  } else if (input.observedStatus === null || input.observedStatus >= 500) {
    failures.push(
      `expected a non-5xx response but observed ${formatObservedStatus(input.observedStatus)}`
    );
  }

  const forbiddenPatterns = readForbiddenResponsePatterns(input.testCase.testData);
  const responseText = stringifyForPatternCheck(input.responseBody);

  for (const pattern of forbiddenPatterns) {
    if (responseText.toLowerCase().includes(pattern.toLowerCase())) {
      failures.push(`response body contained forbidden pattern "${pattern}"`);
    }
  }

  return {
    passed: failures.length === 0,
    observedBehavior:
      failures.length === 0
        ? "Observed response matched expected security behavior."
        : failures.join("; "),
    failures
  };
}

function readForbiddenResponsePatterns(testData: Record<string, unknown>): string[] {
  const value = testData.forbiddenResponsePatterns;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function stringifyForPatternCheck(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return "";
  }
}

function formatObservedStatus(status: number | null): string {
  return status === null ? "no HTTP response" : `HTTP ${status}`;
}
