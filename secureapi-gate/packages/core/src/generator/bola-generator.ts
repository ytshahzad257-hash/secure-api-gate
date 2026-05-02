import type { GeneratedSecurityTestCase, SecurityTestGenerationInput } from "../types.js";
import { createSecurityTestCases, standards, type ScenarioDefinition } from "./generator-utils.js";

const definitions: ScenarioDefinition[] = [
  {
    category: "BOLA",
    idPrefix: "BOLA",
    sequence: 1,
    title: "User reads another user's profile",
    description: "Attempts to read a profile object whose owner is different from the actor.",
    endpoint: {
      method: "GET",
      fallbackPath: "/profiles/{id}",
      pathIncludes: ["profile"]
    },
    actorRole: "user",
    targetResourceOwner: "other-user",
    expectedBehavior: "The API denies cross-user profile access with 403 or 404.",
    expectedStatus: 403,
    severity: "high",
    standardsMapping: standards.bola,
    testData: {
      pathParams: {
        id: "profile-owned-by-user-2"
      }
    }
  },
  {
    category: "BOLA",
    idPrefix: "BOLA",
    sequence: 2,
    title: "User reads another user's order",
    description: "Attempts to fetch an order owned by a different account.",
    endpoint: {
      method: "GET",
      fallbackPath: "/orders/{id}",
      pathIncludes: ["order"]
    },
    actorRole: "user",
    targetResourceOwner: "other-user",
    expectedBehavior: "The API enforces object ownership before returning order data.",
    expectedStatus: 403,
    severity: "high",
    standardsMapping: standards.bola,
    testData: {
      pathParams: {
        id: "order-owned-by-user-2"
      }
    }
  },
  {
    category: "BOLA",
    idPrefix: "BOLA",
    sequence: 3,
    title: "User reads another user's payment",
    description: "Attempts to access payment details for another user.",
    endpoint: {
      method: "GET",
      fallbackPath: "/payments/{id}",
      pathIncludes: ["payment"]
    },
    actorRole: "user",
    targetResourceOwner: "other-user",
    expectedBehavior: "The API denies access to payment objects not owned by the actor.",
    expectedStatus: 403,
    severity: "high",
    standardsMapping: standards.bola,
    testData: {
      pathParams: {
        id: "payment-owned-by-user-2"
      }
    }
  },
  {
    category: "BOLA",
    idPrefix: "BOLA",
    sequence: 4,
    title: "User modifies another user's ticket",
    description: "Attempts to update a support ticket owned by another user.",
    endpoint: {
      method: "PATCH",
      fallbackPath: "/tickets/{id}",
      pathIncludes: ["ticket"]
    },
    actorRole: "user",
    targetResourceOwner: "other-user",
    expectedBehavior: "The API rejects cross-owner ticket modification.",
    expectedStatus: 403,
    severity: "high",
    standardsMapping: standards.bola,
    testData: {
      pathParams: {
        id: "ticket-owned-by-user-2"
      },
      body: {
        status: "closed"
      }
    }
  },
  {
    category: "BOLA",
    idPrefix: "BOLA",
    sequence: 5,
    title: "User approves another user's workflow object",
    description: "Attempts to transition an approval object owned by another account.",
    endpoint: {
      method: "POST",
      fallbackPath: "/approvals/{id}/transition",
      pathIncludes: ["approval"]
    },
    actorRole: "user",
    targetResourceOwner: "other-user",
    expectedBehavior: "The API checks ownership before accepting workflow transitions.",
    expectedStatus: 403,
    severity: "high",
    standardsMapping: standards.bola,
    testData: {
      pathParams: {
        id: "approval-owned-by-user-2"
      },
      body: {
        transition: "approved"
      }
    }
  }
];

export function generateBolaTests(input: SecurityTestGenerationInput): GeneratedSecurityTestCase[] {
  return createSecurityTestCases(definitions, input);
}
