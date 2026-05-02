import type { GeneratedSecurityTestCase, SecurityTestGenerationInput } from "../types.js";
import { createSecurityTestCases, standards, type ScenarioDefinition } from "./generator-utils.js";

const definitions: ScenarioDefinition[] = [
  {
    category: "SESSION",
    idPrefix: "SESS",
    sequence: 1,
    title: "Reuse revoked token",
    description: "Calls a protected endpoint with a token that has been revoked.",
    endpoint: {
      method: "GET",
      fallbackPath: "/profiles/{id}",
      pathIncludes: ["profile"]
    },
    actorRole: "user",
    expectedBehavior: "The API rejects revoked tokens with 401.",
    expectedStatus: 401,
    severity: "high",
    standardsMapping: standards.session,
    testData: {
      sessionVariant: "revoked-token"
    }
  },
  {
    category: "SESSION",
    idPrefix: "SESS",
    sequence: 2,
    title: "Use token after role change",
    description: "Uses an old token after the actor's role has been downgraded.",
    endpoint: {
      method: "GET",
      fallbackPath: "/admin/users",
      pathIncludes: ["admin", "users"]
    },
    actorRole: "user",
    expectedBehavior: "The API evaluates current authorization state and denies stale privilege.",
    expectedStatus: 403,
    severity: "high",
    standardsMapping: standards.session,
    testData: {
      sessionVariant: "role-changed-token"
    }
  },
  {
    category: "SESSION",
    idPrefix: "SESS",
    sequence: 3,
    title: "Use token for different tenant",
    description: "Uses a token whose tenant does not match the target resource tenant.",
    endpoint: {
      method: "GET",
      fallbackPath: "/orders/{id}",
      pathIncludes: ["order"]
    },
    actorRole: "user",
    targetResourceOwner: "other-tenant",
    expectedBehavior: "The API denies cross-tenant token/resource mismatches.",
    expectedStatus: 403,
    severity: "high",
    standardsMapping: standards.session,
    testData: {
      sessionVariant: "tenant-mismatch"
    }
  },
  {
    category: "SESSION",
    idPrefix: "SESS",
    sequence: 4,
    title: "Use token with mismatched subject",
    description: "Uses a token whose subject claim differs from the request actor context.",
    endpoint: {
      method: "GET",
      fallbackPath: "/profiles/{id}",
      pathIncludes: ["profile"]
    },
    actorRole: "user",
    expectedBehavior:
      "The API rejects subject mismatches instead of trusting client-selected identities.",
    expectedStatus: 403,
    severity: "medium",
    standardsMapping: standards.session,
    testData: {
      sessionVariant: "subject-mismatch"
    }
  },
  {
    category: "SESSION",
    idPrefix: "SESS",
    sequence: 5,
    title: "Replay token after logout",
    description: "Reuses a token after the session has been terminated.",
    endpoint: {
      method: "GET",
      fallbackPath: "/payments/{id}",
      pathIncludes: ["payment"]
    },
    actorRole: "user",
    expectedBehavior: "The API rejects replayed post-logout tokens.",
    expectedStatus: 401,
    severity: "medium",
    standardsMapping: standards.session,
    testData: {
      sessionVariant: "post-logout-replay"
    }
  }
];

export function generateSessionTests(
  input: SecurityTestGenerationInput
): GeneratedSecurityTestCase[] {
  return createSecurityTestCases(definitions, input);
}
