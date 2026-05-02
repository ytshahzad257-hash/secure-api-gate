import type { GeneratedSecurityTestCase, SecurityTestGenerationInput } from "../types.js";
import { createSecurityTestCases, standards, type ScenarioDefinition } from "./generator-utils.js";

const definitions: ScenarioDefinition[] = [
  {
    category: "BFLA",
    idPrefix: "BFLA",
    sequence: 1,
    title: "Normal user calls admin users endpoint",
    description: "A regular user attempts to access an admin-only user listing.",
    endpoint: {
      method: "GET",
      fallbackPath: "/admin/users",
      pathIncludes: ["admin/users"]
    },
    actorRole: "user",
    expectedBehavior: "The API denies admin-only functionality to regular users.",
    expectedStatus: 403,
    severity: "critical",
    standardsMapping: standards.bfla
  },
  {
    category: "BFLA",
    idPrefix: "BFLA",
    sequence: 2,
    title: "Normal user calls manager endpoint",
    description: "A regular user attempts to access manager-only approval queues.",
    endpoint: {
      method: "GET",
      fallbackPath: "/manager/approvals",
      pathIncludes: ["manager", "approval"]
    },
    actorRole: "user",
    expectedBehavior: "The API denies manager functionality to regular users.",
    expectedStatus: 403,
    severity: "high",
    standardsMapping: standards.bfla
  },
  {
    category: "BFLA",
    idPrefix: "BFLA",
    sequence: 3,
    title: "Manager calls admin inventory endpoint",
    description: "A manager attempts to access an admin-only inventory administration endpoint.",
    endpoint: {
      method: "GET",
      fallbackPath: "/admin/inventory",
      pathIncludes: ["admin", "inventory"]
    },
    actorRole: "manager",
    expectedBehavior: "The API enforces admin-only access and denies manager role abuse.",
    expectedStatus: 403,
    severity: "high",
    standardsMapping: standards.bfla
  },
  {
    category: "BFLA",
    idPrefix: "BFLA",
    sequence: 4,
    title: "User attempts to list all users",
    description: "A regular user attempts to enumerate all accounts.",
    endpoint: {
      method: "GET",
      fallbackPath: "/admin/users",
      pathIncludes: ["users"]
    },
    actorRole: "user",
    expectedBehavior: "The API blocks account enumeration for non-admin users.",
    expectedStatus: 403,
    severity: "high",
    standardsMapping: standards.bfla
  },
  {
    category: "BFLA",
    idPrefix: "BFLA",
    sequence: 5,
    title: "User attempts to export all payments",
    description: "A regular user attempts to call a bulk payment export function.",
    endpoint: {
      method: "GET",
      fallbackPath: "/admin/payments/export",
      pathIncludes: ["payment", "export"]
    },
    actorRole: "user",
    expectedBehavior: "The API denies bulk export functionality to non-admin users.",
    expectedStatus: 403,
    severity: "critical",
    standardsMapping: standards.bfla
  }
];

export function generateBflaTests(input: SecurityTestGenerationInput): GeneratedSecurityTestCase[] {
  return createSecurityTestCases(definitions, input);
}
