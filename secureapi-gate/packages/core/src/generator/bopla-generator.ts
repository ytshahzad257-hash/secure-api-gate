import type { GeneratedSecurityTestCase, SecurityTestGenerationInput } from "../types.js";
import { createSecurityTestCases, standards, type ScenarioDefinition } from "./generator-utils.js";

const definitions: ScenarioDefinition[] = [
  {
    category: "BOPLA",
    idPrefix: "BOPLA",
    sequence: 1,
    title: "User attempts to mass-assign role",
    description: "Submits a writable-looking role field that must not be accepted from user input.",
    endpoint: {
      method: "PATCH",
      fallbackPath: "/profiles/{id}",
      pathIncludes: ["profile", "user"]
    },
    actorRole: "user",
    expectedBehavior:
      "The API rejects or ignores the role field through request body allowlisting.",
    expectedStatus: 400,
    severity: "high",
    standardsMapping: standards.bopla,
    testData: {
      body: {
        role: "admin"
      }
    }
  },
  {
    category: "BOPLA",
    idPrefix: "BOPLA",
    sequence: 2,
    title: "User attempts to mass-assign isAdmin",
    description: "Submits an isAdmin flag to verify privileged fields cannot be set by clients.",
    endpoint: {
      method: "PATCH",
      fallbackPath: "/profiles/{id}",
      pathIncludes: ["profile", "user"]
    },
    actorRole: "user",
    expectedBehavior: "The API rejects or ignores the isAdmin field.",
    expectedStatus: 400,
    severity: "high",
    standardsMapping: standards.bopla,
    testData: {
      body: {
        isAdmin: true
      }
    }
  },
  {
    category: "BOPLA",
    idPrefix: "BOPLA",
    sequence: 3,
    title: "User attempts to mass-assign accountStatus",
    description:
      "Submits accountStatus directly to check for unsafe binding to account state fields.",
    endpoint: {
      method: "PATCH",
      fallbackPath: "/users/{id}",
      pathIncludes: ["user"]
    },
    actorRole: "user",
    expectedBehavior: "The API blocks direct accountStatus changes from regular user requests.",
    expectedStatus: 400,
    severity: "high",
    standardsMapping: standards.bopla,
    testData: {
      body: {
        accountStatus: "active"
      }
    }
  },
  {
    category: "BOPLA",
    idPrefix: "BOPLA",
    sequence: 4,
    title: "User injects hidden paymentStatus",
    description:
      "Submits paymentStatus in a payment update request where status is server-controlled.",
    endpoint: {
      method: "PATCH",
      fallbackPath: "/payments/{id}",
      pathIncludes: ["payment"]
    },
    actorRole: "user",
    expectedBehavior: "The API ignores or rejects hidden payment status fields.",
    expectedStatus: 400,
    severity: "high",
    standardsMapping: standards.bopla,
    testData: {
      body: {
        paymentStatus: "paid"
      }
    }
  },
  {
    category: "BOPLA",
    idPrefix: "BOPLA",
    sequence: 5,
    title: "User modifies approvalState directly",
    description: "Attempts to bypass transition handlers by directly setting approvalState.",
    endpoint: {
      method: "PATCH",
      fallbackPath: "/approvals/{id}",
      pathIncludes: ["approval"]
    },
    actorRole: "user",
    expectedBehavior:
      "The API rejects direct approvalState mutation outside the workflow transition API.",
    expectedStatus: 400,
    severity: "high",
    standardsMapping: standards.bopla,
    testData: {
      body: {
        approvalState: "approved"
      }
    }
  }
];

export function generateBoplaTests(
  input: SecurityTestGenerationInput
): GeneratedSecurityTestCase[] {
  return createSecurityTestCases(definitions, input);
}
