import type { GeneratedSecurityTestCase, SecurityTestGenerationInput } from "../types.js";
import { createSecurityTestCases, standards, type ScenarioDefinition } from "./generator-utils.js";

const definitions: ScenarioDefinition[] = [
  {
    category: "WORKFLOW",
    idPrefix: "WFLOW",
    sequence: 1,
    title: "Skip approval step",
    description: "Attempts to move directly from draft to approved without submitting first.",
    endpoint: {
      method: "POST",
      fallbackPath: "/approvals/{id}/transition",
      pathIncludes: ["approval", "transition"]
    },
    actorRole: "admin",
    expectedBehavior: "The API rejects workflow transitions that skip required states.",
    expectedStatus: 409,
    severity: "high",
    standardsMapping: standards.workflow,
    testData: {
      fromState: "draft",
      toState: "approved"
    }
  },
  {
    category: "WORKFLOW",
    idPrefix: "WFLOW",
    sequence: 2,
    title: "Approve rejected request",
    description: "Attempts to approve a workflow object already in rejected state.",
    endpoint: {
      method: "POST",
      fallbackPath: "/approvals/{id}/transition",
      pathIncludes: ["approval", "transition"]
    },
    actorRole: "admin",
    expectedBehavior: "The API prevents transitions out of terminal rejected state.",
    expectedStatus: 409,
    severity: "high",
    standardsMapping: standards.workflow,
    testData: {
      fromState: "rejected",
      toState: "approved"
    }
  },
  {
    category: "WORKFLOW",
    idPrefix: "WFLOW",
    sequence: 3,
    title: "Submit payment before approval",
    description: "Attempts to create or submit payment before its approval workflow is complete.",
    endpoint: {
      method: "POST",
      fallbackPath: "/payments",
      pathIncludes: ["payment"]
    },
    actorRole: "user",
    expectedBehavior: "The API requires approval completion before payment submission.",
    expectedStatus: 409,
    severity: "high",
    standardsMapping: standards.workflow,
    testData: {
      approvalState: "submitted",
      requestedTransition: "paid"
    }
  },
  {
    category: "WORKFLOW",
    idPrefix: "WFLOW",
    sequence: 4,
    title: "Modify completed workflow",
    description: "Attempts to mutate a workflow object after it has reached a completed state.",
    endpoint: {
      method: "PATCH",
      fallbackPath: "/approvals/{id}",
      pathIncludes: ["approval"]
    },
    actorRole: "user",
    expectedBehavior: "The API blocks mutation of completed workflow objects.",
    expectedStatus: 409,
    severity: "medium",
    standardsMapping: standards.workflow,
    testData: {
      currentState: "paid",
      body: {
        amount: 1
      }
    }
  },
  {
    category: "WORKFLOW",
    idPrefix: "WFLOW",
    sequence: 5,
    title: "Replay workflow transition",
    description: "Replays an already accepted transition request.",
    endpoint: {
      method: "POST",
      fallbackPath: "/approvals/{id}/transition",
      pathIncludes: ["approval", "transition"]
    },
    actorRole: "user",
    expectedBehavior: "The API treats workflow transitions as idempotent or rejects replay.",
    expectedStatus: 409,
    severity: "medium",
    standardsMapping: standards.workflow,
    testData: {
      replayKey: "demo-transition-replay-key"
    }
  }
];

export function generateWorkflowTests(
  input: SecurityTestGenerationInput
): GeneratedSecurityTestCase[] {
  return createSecurityTestCases(definitions, input);
}
