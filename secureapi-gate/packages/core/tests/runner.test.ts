import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
  GeneratedSecurityTestCase,
  RoleMatrixConfig,
  RunnerOptions,
  StandardsMapping
} from "../src/index.js";
import { assertSecurityTestResult, runSecurityTests, SecurityTestRunner } from "../src/index.js";
import {
  createIntegrationTestServer,
  type IntegrationTestServer
} from "./fixtures/integration-test-server.js";

const standardsMapping: StandardsMapping = {
  OWASP_API_Top_10_2023: ["API1:2023"],
  OWASP_ASVS: ["V4"],
  NIST_SSDF: ["RV.1"]
};

const roleMatrix: RoleMatrixConfig = {
  roles: {
    user: {
      tokenEnv: "USER_TOKEN",
      allowedEndpoints: [],
      forbiddenEndpoints: []
    }
  },
  ownership: {
    userIdFields: ["userId"],
    tenantFields: []
  },
  sensitiveFields: ["token", "password"],
  accessRules: [],
  workflowRules: []
};

describe("security test runner", () => {
  let server: IntegrationTestServer;

  beforeEach(async () => {
    server = await createIntegrationTestServer();
  });

  afterEach(async () => {
    await server.close();
  });

  it("runs a security test with role token injection and redacted request/response records", async () => {
    const runner = new SecurityTestRunner(makeRunnerOptions(server));
    const result = await runner.runOne(
      makeTestCase({
        scenarioId: "SAG-BOLA-001",
        endpoint: "/profiles/{id}",
        method: "GET",
        actorRole: "user",
        expectedStatus: 403,
        testData: {
          pathParams: {
            id: "profile-owned-by-user-2"
          },
          query: {
            token: "query-secret"
          },
          body: {
            token: "body-secret",
            nested: {
              password: "body-password"
            }
          }
        }
      })
    );

    expect(result).toMatchObject({
      scenarioId: "SAG-BOLA-001",
      observedStatus: 403,
      passed: true,
      attempts: 1
    });
    expect(result.request.url).toContain("/profiles/profile-owned-by-user-2");
    expect(result.request.url).toContain("token=%5BREDACTED%5D");
    expect(result.request.headersRedacted.authorization).toBe("[REDACTED]");
    expect(result.request.bodyRedacted).toEqual({
      token: "[REDACTED]",
      nested: {
        password: "[REDACTED]"
      }
    });
    expect(result.response.headersRedacted["x-demo-token"]).toBe("server-response-token");
    expect(result.response.bodyRedacted).toEqual({
      error: "forbidden",
      token: "[REDACTED]",
      nested: {
        password: "[REDACTED]"
      }
    });
  });

  it("retries retryable 5xx responses and returns the final assertion result", async () => {
    const results = await runSecurityTests(
      [
        makeTestCase({
          scenarioId: "SAG-SESS-001",
          endpoint: "/unstable",
          expectedStatus: 403
        })
      ],
      makeRunnerOptions(server, {
        testPolicy: {
          timeoutMs: 500,
          retryCount: 1,
          redaction: {
            headers: ["authorization"],
            bodyFields: ["token", "password"]
          },
          failFast: false
        }
      })
    );

    expect(results[0]).toMatchObject({
      observedStatus: 403,
      passed: true,
      attempts: 2
    });
    expect(server.counters.unstableRequests).toBe(2);
  });

  it("handles timeouts safely without throwing raw HTTP client errors", async () => {
    const runner = new SecurityTestRunner(
      makeRunnerOptions(server, {
        testPolicy: {
          timeoutMs: 20,
          retryCount: 0,
          redaction: {
            headers: ["authorization"],
            bodyFields: ["token", "password"]
          },
          failFast: false
        }
      })
    );
    const result = await runner.runOne(
      makeTestCase({
        scenarioId: "SAG-AUTH-001",
        endpoint: "/slow",
        expectedStatus: 403
      })
    );

    expect(result.observedStatus).toBeNull();
    expect(result.passed).toBe(false);
    expect(result.error).toMatchObject({
      type: "timeout"
    });
    expect(result.observedBehavior).toContain("timeout");
  });

  it("supports fail-fast execution when a test fails", async () => {
    const results = await runSecurityTests(
      [
        makeTestCase({
          scenarioId: "SAG-ERR-001",
          endpoint: "/leaky",
          expectedStatus: 403,
          testData: {
            forbiddenResponsePatterns: ["requiredRole"]
          }
        }),
        makeTestCase({
          scenarioId: "SAG-BOLA-001",
          endpoint: "/profiles/{id}",
          expectedStatus: 403,
          testData: {
            pathParams: {
              id: "profile-owned-by-user-2"
            }
          }
        })
      ],
      makeRunnerOptions(server, {
        testPolicy: {
          timeoutMs: 500,
          retryCount: 0,
          redaction: {
            headers: ["authorization"],
            bodyFields: ["token", "password"]
          },
          failFast: true
        }
      })
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.passed).toBe(false);
    expect(results[0]?.observedBehavior).toContain('forbidden pattern "requiredRole"');
  });
});

describe("assertion engine", () => {
  it("fails when forbidden response leakage patterns are observed", () => {
    const assertion = assertSecurityTestResult({
      testCase: makeTestCase({
        scenarioId: "SAG-ERR-004",
        expectedStatus: 403,
        testData: {
          forbiddenResponsePatterns: ["requiredRole"]
        }
      }),
      observedStatus: 403,
      responseBody: {
        error: "forbidden",
        detail: "requiredRole admin"
      }
    });

    expect(assertion).toEqual({
      passed: false,
      observedBehavior: 'response body contained forbidden pattern "requiredRole"',
      failures: ['response body contained forbidden pattern "requiredRole"']
    });
  });
});

function makeRunnerOptions(
  server: IntegrationTestServer,
  overrides: Partial<RunnerOptions> = {}
): RunnerOptions {
  return {
    baseUrl: server.baseUrl,
    roleMatrix,
    env: {
      USER_TOKEN: "user-token"
    },
    testPolicy: {
      timeoutMs: 500,
      retryCount: 0,
      redaction: {
        headers: ["authorization"],
        bodyFields: ["token", "password"]
      },
      failFast: false
    },
    ...overrides
  };
}

function makeTestCase(
  overrides: Partial<GeneratedSecurityTestCase> = {}
): GeneratedSecurityTestCase {
  return {
    scenarioId: "SAG-BOLA-001",
    category: "BOLA",
    title: "Runner test case",
    description: "Runner test fixture.",
    endpoint: "/profiles/{id}",
    method: "GET",
    actorRole: "user",
    expectedBehavior: "The API returns the expected defensive status.",
    expectedStatus: 403,
    severity: "high",
    riskWeight: 10,
    standardsMapping,
    testData: {
      pathParams: {
        id: "profile-owned-by-user-2"
      }
    },
    ...overrides
  };
}
