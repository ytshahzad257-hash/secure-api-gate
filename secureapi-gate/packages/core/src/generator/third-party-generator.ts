import type { GeneratedSecurityTestCase, SecurityTestGenerationInput } from "../types.js";
import { createSecurityTestCases, standards, type ScenarioDefinition } from "./generator-utils.js";

const definitions: ScenarioDefinition[] = [
  {
    category: "THIRD_PARTY",
    idPrefix: "3P",
    sequence: 1,
    title: "External payment callback without signature",
    description: "Sends a simulated payment webhook without a signature header.",
    endpoint: {
      method: "POST",
      fallbackPath: "/webhooks/payment",
      pathIncludes: ["webhook", "payment", "callback"]
    },
    actorRole: "external-service",
    expectedBehavior: "The API rejects unsigned webhook callbacks.",
    expectedStatus: 401,
    severity: "high",
    standardsMapping: standards.thirdParty,
    testData: {
      webhookVariant: "missing-signature"
    }
  },
  {
    category: "THIRD_PARTY",
    idPrefix: "3P",
    sequence: 2,
    title: "Simulated webhook replay",
    description: "Replays a previously accepted webhook delivery identifier.",
    endpoint: {
      method: "POST",
      fallbackPath: "/webhooks/payment",
      pathIncludes: ["webhook", "payment", "callback"]
    },
    actorRole: "external-service",
    expectedBehavior: "The API rejects replayed webhook events.",
    expectedStatus: 409,
    severity: "high",
    standardsMapping: standards.thirdParty,
    testData: {
      webhookVariant: "replay",
      deliveryId: "demo-delivery-id"
    }
  },
  {
    category: "THIRD_PARTY",
    idPrefix: "3P",
    sequence: 3,
    title: "Simulated malformed external response",
    description: "Sends a malformed external payload shape to validate defensive parsing.",
    endpoint: {
      method: "POST",
      fallbackPath: "/webhooks/payment",
      pathIncludes: ["webhook", "payment", "callback"]
    },
    actorRole: "external-service",
    expectedBehavior: "The API rejects malformed third-party payloads without leaking internals.",
    expectedStatus: 400,
    severity: "medium",
    standardsMapping: standards.thirdParty,
    testData: {
      webhookVariant: "malformed-payload"
    }
  },
  {
    category: "THIRD_PARTY",
    idPrefix: "3P",
    sequence: 4,
    title: "Webhook tenant mismatch",
    description: "Sends a valid-looking webhook for a tenant that does not own the target payment.",
    endpoint: {
      method: "POST",
      fallbackPath: "/webhooks/payment",
      pathIncludes: ["webhook", "payment", "callback"]
    },
    actorRole: "external-service",
    targetResourceOwner: "other-tenant",
    expectedBehavior:
      "The API validates webhook tenant and object ownership before applying changes.",
    expectedStatus: 403,
    severity: "high",
    standardsMapping: standards.thirdParty,
    testData: {
      webhookVariant: "tenant-mismatch"
    }
  },
  {
    category: "THIRD_PARTY",
    idPrefix: "3P",
    sequence: 5,
    title: "Missing timeout or fallback handling",
    description: "Exercises a simulated slow third-party dependency response.",
    endpoint: {
      method: "POST",
      fallbackPath: "/webhooks/payment/slow",
      pathIncludes: ["webhook", "slow"]
    },
    actorRole: "external-service",
    expectedBehavior:
      "The API uses bounded timeout/fallback behavior for external dependency handling.",
    expectedStatus: 504,
    severity: "medium",
    standardsMapping: standards.thirdParty,
    testData: {
      webhookVariant: "slow-upstream"
    }
  }
];

export function generateThirdPartyTests(
  input: SecurityTestGenerationInput
): GeneratedSecurityTestCase[] {
  return createSecurityTestCases(definitions, input);
}
