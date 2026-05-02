import type { GeneratedSecurityTestCase, SecurityTestGenerationInput } from "../types.js";
import { createSecurityTestCases, standards, type ScenarioDefinition } from "./generator-utils.js";

const definitions: ScenarioDefinition[] = [
  {
    category: "AUTH",
    idPrefix: "AUTH",
    sequence: 1,
    title: "Missing token request",
    description: "Calls a protected endpoint without an Authorization token.",
    endpoint: {
      method: "GET",
      fallbackPath: "/profiles/{id}",
      pathIncludes: ["profile"]
    },
    actorRole: "anonymous",
    expectedBehavior: "The API rejects missing credentials with 401 and no sensitive details.",
    expectedStatus: 401,
    severity: "high",
    standardsMapping: standards.auth,
    testData: {
      authVariant: "missing-token"
    }
  },
  {
    category: "AUTH",
    idPrefix: "AUTH",
    sequence: 2,
    title: "Expired token request",
    description: "Calls a protected endpoint with an expired demo token.",
    endpoint: {
      method: "GET",
      fallbackPath: "/profiles/{id}",
      pathIncludes: ["profile"]
    },
    actorRole: "user",
    expectedBehavior: "The API rejects expired credentials with 401.",
    expectedStatus: 401,
    severity: "high",
    standardsMapping: standards.auth,
    testData: {
      authVariant: "expired-token"
    }
  },
  {
    category: "AUTH",
    idPrefix: "AUTH",
    sequence: 3,
    title: "Invalid signature token request",
    description: "Calls a protected endpoint with a token whose signature is invalid.",
    endpoint: {
      method: "GET",
      fallbackPath: "/profiles/{id}",
      pathIncludes: ["profile"]
    },
    actorRole: "user",
    expectedBehavior: "The API rejects tokens with invalid signatures.",
    expectedStatus: 401,
    severity: "high",
    standardsMapping: standards.auth,
    testData: {
      authVariant: "invalid-signature"
    }
  },
  {
    category: "AUTH",
    idPrefix: "AUTH",
    sequence: 4,
    title: "Token with wrong audience",
    description: "Calls a protected endpoint with a token issued for a different audience.",
    endpoint: {
      method: "GET",
      fallbackPath: "/profiles/{id}",
      pathIncludes: ["profile"]
    },
    actorRole: "user",
    expectedBehavior: "The API rejects tokens whose audience does not match the API.",
    expectedStatus: 401,
    severity: "medium",
    standardsMapping: standards.auth,
    testData: {
      authVariant: "wrong-audience"
    }
  },
  {
    category: "AUTH",
    idPrefix: "AUTH",
    sequence: 5,
    title: "Token with weak demo claim",
    description:
      "Calls a protected endpoint with a token that carries an intentionally weak claim.",
    endpoint: {
      method: "GET",
      fallbackPath: "/profiles/{id}",
      pathIncludes: ["profile"]
    },
    actorRole: "user",
    expectedBehavior: "The API rejects weak or untrusted token claims.",
    expectedStatus: 401,
    severity: "medium",
    standardsMapping: standards.auth,
    testData: {
      authVariant: "weak-demo-claim"
    }
  }
];

export function generateAuthTests(input: SecurityTestGenerationInput): GeneratedSecurityTestCase[] {
  return createSecurityTestCases(definitions, input);
}
