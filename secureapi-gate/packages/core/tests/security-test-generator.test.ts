import { describe, expect, it } from "vitest";
import type { RoleMatrixConfig, SecurityCategory, TestPolicyConfig } from "../src/index.js";
import {
  generateBolaTests,
  generateSecurityTestCases,
  parseOpenApiDocument
} from "../src/index.js";

const apiSpec = parseOpenApiDocument({
  openapi: "3.0.3",
  info: {
    title: "Generator Test API",
    version: "1.0.0"
  },
  paths: {
    "/profiles/{id}": {
      get: {
        responses: {
          "200": {
            description: "OK"
          }
        }
      },
      patch: {
        responses: {
          "204": {
            description: "Updated"
          }
        }
      }
    },
    "/orders/{id}": {
      get: {
        responses: {
          "200": {
            description: "OK"
          }
        }
      }
    },
    "/payments/{id}": {
      get: {
        responses: {
          "200": {
            description: "OK"
          }
        }
      },
      patch: {
        responses: {
          "204": {
            description: "Updated"
          }
        }
      }
    },
    "/payments": {
      post: {
        responses: {
          "201": {
            description: "Created"
          }
        }
      }
    },
    "/tickets/{id}": {
      patch: {
        responses: {
          "204": {
            description: "Updated"
          }
        }
      }
    },
    "/approvals/{id}": {
      patch: {
        responses: {
          "204": {
            description: "Updated"
          }
        }
      }
    },
    "/approvals/{id}/transition": {
      post: {
        responses: {
          "200": {
            description: "Transitioned"
          }
        }
      }
    },
    "/admin/users": {
      get: {
        responses: {
          "200": {
            description: "OK"
          }
        }
      }
    },
    "/admin/inventory": {
      get: {
        responses: {
          "200": {
            description: "OK"
          }
        }
      }
    },
    "/manager/approvals": {
      get: {
        responses: {
          "200": {
            description: "OK"
          }
        }
      }
    },
    "/debug/version": {
      get: {
        responses: {
          "200": {
            description: "OK"
          }
        }
      }
    },
    "/webhooks/payment": {
      post: {
        responses: {
          "202": {
            description: "Accepted"
          }
        }
      }
    }
  }
});

const roleMatrix: RoleMatrixConfig = {
  roles: {
    user: {
      tokenEnv: "USER_TOKEN",
      allowedEndpoints: [],
      forbiddenEndpoints: []
    },
    manager: {
      tokenEnv: "MANAGER_TOKEN",
      allowedEndpoints: [],
      forbiddenEndpoints: []
    },
    admin: {
      tokenEnv: "ADMIN_TOKEN",
      allowedEndpoints: [],
      forbiddenEndpoints: []
    }
  },
  ownership: {
    userIdFields: ["userId", "ownerId"],
    tenantFields: ["tenantId"]
  },
  sensitiveFields: ["role", "isAdmin", "accountStatus", "paymentStatus", "approvalState"],
  accessRules: [],
  workflowRules: []
};

const allCategories: SecurityCategory[] = [
  "BOLA",
  "BOPLA",
  "BFLA",
  "AUTH",
  "SESSION",
  "WORKFLOW",
  "INVENTORY",
  "THIRD_PARTY",
  "ERROR_LEAKAGE"
];

function makePolicy(overrides: Partial<TestPolicyConfig> = {}): TestPolicyConfig {
  return {
    enabledCategories: allCategories,
    severityOverrides: {},
    ciThreshold: 85,
    output: {
      directory: "./evidence"
    },
    redaction: {
      headers: ["authorization"],
      bodyFields: ["token"]
    },
    timeoutMs: 5000,
    retryCount: 0,
    failFast: false,
    ...overrides
  };
}

describe("security test generation", () => {
  it("generates five deterministic scenarios for each required category", () => {
    const tests = generateSecurityTestCases({
      apiSpec,
      roleMatrix,
      testPolicy: makePolicy()
    });

    expect(tests).toHaveLength(45);
    expect(new Set(tests.map((test) => test.scenarioId)).size).toBe(45);
    expect(countByCategory(tests)).toEqual({
      BOLA: 5,
      BOPLA: 5,
      BFLA: 5,
      AUTH: 5,
      SESSION: 5,
      WORKFLOW: 5,
      INVENTORY: 5,
      THIRD_PARTY: 5,
      ERROR_LEAKAGE: 5
    });
  });

  it("includes the required scenario fields on every generated test", () => {
    const tests = generateSecurityTestCases({
      apiSpec,
      roleMatrix,
      testPolicy: makePolicy()
    });

    for (const test of tests) {
      expect(test.scenarioId).toMatch(/^SAG-(BOLA|BOPLA|BFLA|AUTH|SESS|WFLOW|INV|3P|ERR)-\d{3}$/);
      expect(test.title).toEqual(expect.any(String));
      expect(test.endpoint).toMatch(/^\//);
      expect(test.method).toMatch(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|TRACE)$/);
      expect(test.actorRole).toEqual(expect.any(String));
      expect(test.expectedBehavior).toEqual(expect.any(String));
      expect(["critical", "high", "medium", "low"]).toContain(test.severity);
      expect(test.riskWeight).toBeGreaterThan(0);
      expect(test.standardsMapping.OWASP_API_Top_10_2023.length).toBeGreaterThan(0);
      expect(test.standardsMapping.OWASP_ASVS.length).toBeGreaterThan(0);
      expect(test.standardsMapping.NIST_SSDF.length).toBeGreaterThan(0);
    }
  });

  it("uses enabled categories and severity overrides from the test policy", () => {
    const tests = generateSecurityTestCases({
      apiSpec,
      roleMatrix,
      testPolicy: makePolicy({
        enabledCategories: ["BOLA", "AUTH"],
        severityOverrides: {
          "SAG-BOLA-001": "critical"
        }
      })
    });

    expect(tests).toHaveLength(10);
    expect(new Set(tests.map((test) => test.category))).toEqual(new Set(["BOLA", "AUTH"]));
    expect(tests[0]).toMatchObject({
      scenarioId: "SAG-BOLA-001",
      severity: "critical",
      riskWeight: 15
    });
  });

  it("adapts endpoints from the parsed API specification when matching routes exist", () => {
    const tests = generateSecurityTestCases({
      apiSpec,
      roleMatrix,
      testPolicy: makePolicy()
    });

    expect(findScenario(tests, "SAG-BOLA-001")).toMatchObject({
      endpoint: "/profiles/{id}",
      method: "GET"
    });
    expect(findScenario(tests, "SAG-WFLOW-001")).toMatchObject({
      endpoint: "/approvals/{id}/transition",
      method: "POST"
    });
    expect(findScenario(tests, "SAG-INV-001")).toMatchObject({
      endpoint: "/debug/version",
      method: "GET"
    });
    expect(findScenario(tests, "SAG-3P-001")).toMatchObject({
      endpoint: "/webhooks/payment",
      method: "POST"
    });
  });

  it("falls back to the first non-admin role when a user role is named differently", () => {
    const tests = generateBolaTests({
      roleMatrix: {
        ...roleMatrix,
        roles: {
          customer: {
            tokenEnv: "CUSTOMER_TOKEN",
            allowedEndpoints: [],
            forbiddenEndpoints: []
          },
          admin: {
            tokenEnv: "ADMIN_TOKEN",
            allowedEndpoints: [],
            forbiddenEndpoints: []
          }
        }
      }
    });

    expect(tests.map((test) => test.actorRole)).toEqual([
      "customer",
      "customer",
      "customer",
      "customer",
      "customer"
    ]);
  });
});

function countByCategory(
  tests: ReturnType<typeof generateSecurityTestCases>
): Record<SecurityCategory, number> {
  return tests.reduce(
    (counts, test) => ({
      ...counts,
      [test.category]: counts[test.category] + 1
    }),
    {
      BOLA: 0,
      BOPLA: 0,
      BFLA: 0,
      AUTH: 0,
      SESSION: 0,
      WORKFLOW: 0,
      INVENTORY: 0,
      THIRD_PARTY: 0,
      ERROR_LEAKAGE: 0
    }
  );
}

function findScenario(tests: ReturnType<typeof generateSecurityTestCases>, scenarioId: string) {
  const test = tests.find((candidate) => candidate.scenarioId === scenarioId);

  if (!test) {
    throw new Error(`Missing generated scenario ${scenarioId}.`);
  }

  return test;
}
