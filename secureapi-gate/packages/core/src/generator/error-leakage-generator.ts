import type { GeneratedSecurityTestCase, SecurityTestGenerationInput } from "../types.js";
import { createSecurityTestCases, standards, type ScenarioDefinition } from "./generator-utils.js";

const definitions: ScenarioDefinition[] = [
  {
    category: "ERROR_LEAKAGE",
    idPrefix: "ERR",
    sequence: 1,
    title: "Stack trace leaked",
    description: "Sends malformed input that may trigger an exceptional path.",
    endpoint: {
      method: "GET",
      fallbackPath: "/profiles/{id}",
      pathIncludes: ["profile"]
    },
    actorRole: "user",
    expectedBehavior: "The API returns sanitized errors without stack traces.",
    expectedStatus: 400,
    severity: "medium",
    standardsMapping: standards.errorLeakage,
    testData: {
      pathParams: {
        id: "../../../invalid"
      },
      forbiddenResponsePatterns: ["stack", "at ", "TypeError", "ReferenceError"]
    }
  },
  {
    category: "ERROR_LEAKAGE",
    idPrefix: "ERR",
    sequence: 2,
    title: "Internal object ID leaked",
    description: "Requests an object in a way that might expose internal database identifiers.",
    endpoint: {
      method: "GET",
      fallbackPath: "/orders/{id}",
      pathIncludes: ["order"]
    },
    actorRole: "user",
    expectedBehavior: "The API avoids leaking internal object identifiers in error responses.",
    expectedStatus: 404,
    severity: "medium",
    standardsMapping: standards.errorLeakage,
    testData: {
      forbiddenResponsePatterns: ["ObjectId", "rowid", "internalId"]
    }
  },
  {
    category: "ERROR_LEAKAGE",
    idPrefix: "ERR",
    sequence: 3,
    title: "SQL or ORM error leaked",
    description: "Sends malformed query data that may surface raw SQL or ORM errors.",
    endpoint: {
      method: "GET",
      fallbackPath: "/payments/{id}",
      pathIncludes: ["payment"]
    },
    actorRole: "user",
    expectedBehavior: "The API maps SQL/ORM exceptions to safe generic error responses.",
    expectedStatus: 400,
    severity: "high",
    standardsMapping: standards.errorLeakage,
    testData: {
      query: {
        forceError: "orm"
      },
      forbiddenResponsePatterns: ["SQL", "Prisma", "Sequelize", "sqlite"]
    }
  },
  {
    category: "ERROR_LEAKAGE",
    idPrefix: "ERR",
    sequence: 4,
    title: "Authorization failure returns excessive details",
    description:
      "Calls a forbidden endpoint and checks for verbose policy details in the response.",
    endpoint: {
      method: "GET",
      fallbackPath: "/admin/users",
      pathIncludes: ["admin", "users"]
    },
    actorRole: "user",
    expectedBehavior: "The API denies authorization without revealing internal policy structure.",
    expectedStatus: 403,
    severity: "medium",
    standardsMapping: standards.errorLeakage,
    testData: {
      forbiddenResponsePatterns: ["policy", "rule", "requiredRole", "ownerId"]
    }
  },
  {
    category: "ERROR_LEAKAGE",
    idPrefix: "ERR",
    sequence: 5,
    title: "Different errors reveal object existence",
    description:
      "Compares unauthorized and nonexistent object responses for existence oracle behavior.",
    endpoint: {
      method: "GET",
      fallbackPath: "/profiles/{id}",
      pathIncludes: ["profile"]
    },
    actorRole: "user",
    targetResourceOwner: "other-user",
    expectedBehavior:
      "The API returns indistinguishable denial responses for unauthorized and missing objects.",
    expectedStatus: 404,
    severity: "high",
    standardsMapping: standards.errorLeakage,
    testData: {
      comparison: {
        unauthorizedObjectId: "profile-owned-by-user-2",
        missingObjectId: "profile-does-not-exist"
      }
    }
  }
];

export function generateErrorLeakageTests(
  input: SecurityTestGenerationInput
): GeneratedSecurityTestCase[] {
  return createSecurityTestCases(definitions, input);
}
