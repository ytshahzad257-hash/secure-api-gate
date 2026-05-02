import type { GeneratedSecurityTestCase, RunnerOptions, SecurityTestRunResult } from "../types.js";
import { assertSecurityTestResult } from "./assertion-engine.js";
import {
  buildSecurityRequest,
  SecureApiHttpClient,
  type HttpClientOptions
} from "./http-client.js";
import { TokenManager } from "./token-manager.js";

export interface SecurityTestRunnerDependencies {
  httpClient?: SecureApiHttpClient;
  tokenManager?: TokenManager;
}

export class SecurityTestRunner {
  private readonly options: RunnerOptions;
  private readonly tokenManager: TokenManager;
  private readonly httpClient: SecureApiHttpClient;

  constructor(options: RunnerOptions, dependencies: SecurityTestRunnerDependencies = {}) {
    this.options = options;
    this.tokenManager =
      dependencies.tokenManager ??
      new TokenManager({
        roleMatrix: options.roleMatrix,
        env: options.env,
        staticTokens: options.staticTokens
      });
    this.httpClient =
      dependencies.httpClient ??
      new SecureApiHttpClient({
        timeoutMs: options.testPolicy?.timeoutMs ?? 5000,
        retryCount: options.testPolicy?.retryCount ?? 0,
        redaction: options.testPolicy?.redaction
      } satisfies HttpClientOptions);
  }

  async run(testCases: GeneratedSecurityTestCase[]): Promise<SecurityTestRunResult[]> {
    const results: SecurityTestRunResult[] = [];

    for (const testCase of testCases) {
      const result = await this.runOne(testCase);
      results.push(result);

      if (this.options.testPolicy?.failFast && !result.passed) {
        break;
      }
    }

    return results;
  }

  async runOne(testCase: GeneratedSecurityTestCase): Promise<SecurityTestRunResult> {
    const authorizationHeader = this.resolveAuthorizationHeader(testCase);
    const request = buildSecurityRequest(this.options.baseUrl, testCase, authorizationHeader);
    const httpResult = await this.httpClient.execute(request);
    const assertion = assertSecurityTestResult({
      testCase,
      observedStatus: httpResult.response.status,
      responseBody: httpResult.rawResponseBody,
      error: httpResult.error
    });

    return {
      scenarioId: testCase.scenarioId,
      category: testCase.category,
      title: testCase.title,
      description: testCase.description,
      endpoint: testCase.endpoint,
      method: testCase.method,
      actorRole: testCase.actorRole,
      targetResourceOwner: testCase.targetResourceOwner,
      expectedBehavior: testCase.expectedBehavior,
      expectedStatus: testCase.expectedStatus,
      observedStatus: httpResult.response.status,
      observedBehavior: assertion.observedBehavior,
      passed: assertion.passed,
      severity: testCase.severity,
      riskWeight: testCase.riskWeight,
      standardsMapping: testCase.standardsMapping,
      request: httpResult.request,
      response: httpResult.response,
      attempts: httpResult.attempts,
      durationMs: httpResult.durationMs,
      error: httpResult.error
    };
  }

  private resolveAuthorizationHeader(testCase: GeneratedSecurityTestCase): string | undefined {
    const scenarioToken = resolveScenarioToken(testCase.testData);

    if (scenarioToken !== undefined) {
      return scenarioToken ? `Bearer ${scenarioToken}` : undefined;
    }

    return this.tokenManager.getAuthorizationHeader(testCase.actorRole);
  }
}

export async function runSecurityTests(
  testCases: GeneratedSecurityTestCase[],
  options: RunnerOptions,
  dependencies: SecurityTestRunnerDependencies = {}
): Promise<SecurityTestRunResult[]> {
  return new SecurityTestRunner(options, dependencies).run(testCases);
}

function resolveScenarioToken(testData: Record<string, unknown>): string | undefined {
  const authVariant = readStringValue(testData.authVariant);
  const sessionVariant = readStringValue(testData.sessionVariant);

  switch (authVariant) {
    case "missing-token":
      return "";
    case "expired-token":
      return "demo-expired-token";
    case "invalid-signature":
      return "demo-invalid-signature-token";
    case "wrong-audience":
      return "demo-wrong-audience-token";
    case "weak-demo-claim":
      return "demo-weak-claim-token";
  }

  switch (sessionVariant) {
    case "revoked-token":
    case "post-logout-replay":
      return "demo-revoked-token";
    case "tenant-mismatch":
      return "demo-tenant-b-token";
  }

  return undefined;
}

function readStringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
