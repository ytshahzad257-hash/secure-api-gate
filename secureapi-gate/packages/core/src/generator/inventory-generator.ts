import type { GeneratedSecurityTestCase, SecurityTestGenerationInput } from "../types.js";
import { createSecurityTestCases, standards, type ScenarioDefinition } from "./generator-utils.js";

const definitions: ScenarioDefinition[] = [
  {
    category: "INVENTORY",
    idPrefix: "INV",
    sequence: 1,
    title: "Unauthenticated access to internal version endpoint",
    description: "Checks whether internal version metadata is exposed without authentication.",
    endpoint: {
      method: "GET",
      fallbackPath: "/debug/version",
      pathIncludes: ["version", "debug"]
    },
    actorRole: "anonymous",
    expectedBehavior:
      "The API protects internal version/debug metadata from unauthenticated access.",
    expectedStatus: 401,
    severity: "medium",
    standardsMapping: standards.inventory
  },
  {
    category: "INVENTORY",
    idPrefix: "INV",
    sequence: 2,
    title: "Deprecated endpoint still accessible",
    description: "Checks whether a deprecated legacy endpoint remains reachable.",
    endpoint: {
      method: "GET",
      fallbackPath: "/v1/legacy/users",
      pathIncludes: ["legacy", "deprecated"]
    },
    actorRole: "user",
    expectedBehavior:
      "The API disables deprecated endpoints or applies current authorization controls.",
    expectedStatus: 404,
    severity: "medium",
    standardsMapping: standards.inventory
  },
  {
    category: "INVENTORY",
    idPrefix: "INV",
    sequence: 3,
    title: "Debug route exposed",
    description: "Checks whether debug configuration routes are exposed outside local development.",
    endpoint: {
      method: "GET",
      fallbackPath: "/debug/config",
      pathIncludes: ["debug"]
    },
    actorRole: "anonymous",
    expectedBehavior: "The API denies debug routes or removes them from deployed builds.",
    expectedStatus: 404,
    severity: "high",
    standardsMapping: standards.inventory
  },
  {
    category: "INVENTORY",
    idPrefix: "INV",
    sequence: 4,
    title: "Unlisted admin endpoint accessible",
    description:
      "Checks for reachable admin metrics endpoints absent from the declared API specification.",
    endpoint: {
      method: "GET",
      fallbackPath: "/admin/metrics",
      pathIncludes: ["metrics"]
    },
    actorRole: "user",
    expectedBehavior: "The API denies unlisted privileged endpoints to non-admin users.",
    expectedStatus: 403,
    severity: "high",
    standardsMapping: standards.inventory
  },
  {
    category: "INVENTORY",
    idPrefix: "INV",
    sequence: 5,
    title: "Unauthenticated API description exposed",
    description: "Checks whether generated API descriptions are exposed without intended controls.",
    endpoint: {
      method: "GET",
      fallbackPath: "/openapi.json",
      pathIncludes: ["openapi", "swagger"]
    },
    actorRole: "anonymous",
    expectedBehavior:
      "The API exposes documentation only when intentionally configured and sanitized.",
    expectedStatus: 401,
    severity: "low",
    standardsMapping: standards.inventory
  }
];

export function generateInventoryTests(
  input: SecurityTestGenerationInput
): GeneratedSecurityTestCase[] {
  return createSecurityTestCases(definitions, input);
}
