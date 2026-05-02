import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse
} from "axios";
import type {
  GeneratedSecurityTestCase,
  HttpExecutionError,
  HttpMethod,
  RedactionConfig
} from "../types.js";
import { redactBody, redactHeaders, redactUrl } from "../utils/safe-redaction.js";

export interface PreparedSecurityRequest {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface HttpClientOptions {
  timeoutMs: number;
  retryCount: number;
  redaction?: Partial<RedactionConfig>;
  client?: AxiosInstance;
}

export interface HttpClientResult {
  request: {
    method: HttpMethod;
    url: string;
    headersRedacted: Record<string, string>;
    bodyRedacted?: unknown;
  };
  response: {
    status: number | null;
    headersRedacted: Record<string, string>;
    bodyRedacted?: unknown;
  };
  rawResponseBody?: unknown;
  error?: HttpExecutionError;
  attempts: number;
  durationMs: number;
}

export class SecureApiHttpClient {
  private readonly client: AxiosInstance;
  private readonly timeoutMs: number;
  private readonly retryCount: number;
  private readonly redaction?: Partial<RedactionConfig>;

  constructor(options: HttpClientOptions) {
    this.client =
      options.client ??
      axios.create({
        validateStatus: () => true
      });
    this.timeoutMs = options.timeoutMs;
    this.retryCount = options.retryCount;
    this.redaction = options.redaction;
  }

  async execute(request: PreparedSecurityRequest): Promise<HttpClientResult> {
    const startedAt = Date.now();
    let attempts = 0;
    let lastResult: HttpClientResult | undefined;

    while (attempts <= this.retryCount) {
      attempts += 1;
      lastResult = await this.executeOnce(request, attempts, startedAt);

      if (!shouldRetry(lastResult, attempts, this.retryCount)) {
        return lastResult;
      }
    }

    return lastResult ?? this.createUnexpectedEmptyResult(request, attempts, startedAt);
  }

  private async executeOnce(
    request: PreparedSecurityRequest,
    attempts: number,
    startedAt: number
  ): Promise<HttpClientResult> {
    const requestRecord = {
      method: request.method,
      url: redactUrl(request.url),
      headersRedacted: redactHeaders(request.headers, { redaction: this.redaction }),
      bodyRedacted: redactBody(request.body, { redaction: this.redaction })
    };

    try {
      const response = await this.client.request({
        method: request.method,
        url: request.url,
        headers: request.headers,
        data: request.body,
        timeout: this.timeoutMs
      } satisfies AxiosRequestConfig);

      return {
        request: requestRecord,
        response: {
          status: response.status,
          headersRedacted: redactHeaders(flattenResponseHeaders(response), {
            redaction: this.redaction
          }),
          bodyRedacted: redactBody(response.data, { redaction: this.redaction })
        },
        rawResponseBody: response.data,
        attempts,
        durationMs: Date.now() - startedAt
      };
    } catch (error) {
      const normalizedError = normalizeAxiosError(error);
      const response = isAxiosError(error) ? error.response : undefined;

      return {
        request: requestRecord,
        response: {
          status: response?.status ?? null,
          headersRedacted: response
            ? redactHeaders(flattenResponseHeaders(response), { redaction: this.redaction })
            : {},
          bodyRedacted: redactBody(response?.data, { redaction: this.redaction })
        },
        rawResponseBody: response?.data,
        error: normalizedError,
        attempts,
        durationMs: Date.now() - startedAt
      };
    }
  }

  private createUnexpectedEmptyResult(
    request: PreparedSecurityRequest,
    attempts: number,
    startedAt: number
  ): HttpClientResult {
    return {
      request: {
        method: request.method,
        url: redactUrl(request.url),
        headersRedacted: redactHeaders(request.headers, { redaction: this.redaction }),
        bodyRedacted: redactBody(request.body, { redaction: this.redaction })
      },
      response: {
        status: null,
        headersRedacted: {}
      },
      attempts,
      durationMs: Date.now() - startedAt,
      error: {
        type: "unexpected",
        message: "HTTP client exited without producing a result."
      }
    };
  }
}

export function buildSecurityRequest(
  baseUrl: string,
  testCase: GeneratedSecurityTestCase,
  authorizationHeader?: string
): PreparedSecurityRequest {
  const headers = readHeaders(testCase);

  if (authorizationHeader) {
    headers.authorization = authorizationHeader;
  }

  const url = buildUrl(
    baseUrl,
    testCase.endpoint,
    readPathParams(testCase),
    readQuery(testCase.testData)
  );

  return {
    method: testCase.method,
    url,
    headers,
    body: readBody(testCase)
  };
}

export function buildUrl(
  baseUrl: string,
  endpoint: string,
  pathParams: Record<string, string>,
  query: Record<string, string>
): string {
  const resolvedPath = Object.entries(pathParams).reduce(
    (path, [name, value]) => path.replaceAll(`{${name}}`, encodeURIComponent(value)),
    endpoint
  );
  const url = new URL(resolvedPath, normalizeBaseUrl(baseUrl));

  for (const [name, value] of Object.entries(query)) {
    url.searchParams.set(name, value);
  }

  return url.toString();
}

function shouldRetry(result: HttpClientResult, attempts: number, retryCount: number): boolean {
  if (attempts > retryCount) {
    return false;
  }

  return (
    result.error !== undefined || (result.response.status !== null && result.response.status >= 500)
  );
}

function normalizeAxiosError(error: unknown): HttpExecutionError {
  if (isAxiosError(error)) {
    const code = error.code;

    if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
      return {
        type: "timeout",
        message: `Request timed out after configured timeout.`,
        code
      };
    }

    return {
      type: "network",
      message: error.message,
      code
    };
  }

  return {
    type: "unexpected",
    message: error instanceof Error ? error.message : "Unexpected HTTP client error."
  };
}

function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error);
}

function flattenResponseHeaders(
  response: AxiosResponse
): Record<string, string | string[] | number | undefined> {
  return response.headers as Record<string, string | string[] | number | undefined>;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function readPathParams(testCase: GeneratedSecurityTestCase): Record<string, string> {
  return {
    ...inferPathParams(testCase),
    ...readStringRecord(testCase.testData.pathParams)
  };
}

function readQuery(testData: Record<string, unknown>): Record<string, string> {
  return readStringRecord(testData.query);
}

function readHeaders(testCase: GeneratedSecurityTestCase): Record<string, string> {
  return {
    ...inferHeaders(testCase),
    ...readStringRecord(testCase.testData.headers)
  };
}

function readBody(testCase: GeneratedSecurityTestCase): unknown {
  if (testCase.testData.body !== undefined) {
    return testCase.testData.body;
  }

  return inferBody(testCase);
}

function readStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, String(nestedValue)])
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inferPathParams(testCase: GeneratedSecurityTestCase): Record<string, string> {
  if (!testCase.endpoint.includes("{id}")) {
    return {};
  }

  const scenarioIds: Record<string, string> = {
    "SAG-SESS-004": "profile-owned-by-user-2",
    "SAG-WFLOW-001": "approval-draft",
    "SAG-WFLOW-002": "approval-rejected",
    "SAG-WFLOW-004": "approval-paid",
    "SAG-WFLOW-005": "approval-user-1",
    "SAG-ERR-003": "payment-user-1"
  };
  const scenarioId = scenarioIds[testCase.scenarioId];

  if (scenarioId) {
    return {
      id: scenarioId
    };
  }

  if (testCase.category === "ERROR_LEAKAGE") {
    return {};
  }

  const endpoint = testCase.endpoint.toLowerCase();

  if (endpoint.includes("profiles")) {
    return { id: "profile-user-1" };
  }

  if (endpoint.includes("orders")) {
    return { id: "order-user-1" };
  }

  if (endpoint.includes("payments")) {
    return { id: "payment-user-1" };
  }

  if (endpoint.includes("tickets")) {
    return { id: "ticket-user-1" };
  }

  if (endpoint.includes("approvals")) {
    return { id: "approval-user-1" };
  }

  if (endpoint.includes("users")) {
    return { id: "user-1" };
  }

  return {};
}

function inferHeaders(testCase: GeneratedSecurityTestCase): Record<string, string> {
  const webhookVariant = readStringValue(testCase.testData.webhookVariant);

  switch (webhookVariant) {
    case "replay":
      return {
        "x-demo-signature": "demo-signature",
        "x-demo-delivery-id": "demo-delivery-id"
      };
    case "malformed-payload":
      return {
        "x-demo-signature": "demo-signature",
        "x-demo-delivery-id": "demo-malformed-delivery"
      };
    case "tenant-mismatch":
      return {
        "x-demo-signature": "demo-signature",
        "x-demo-delivery-id": "demo-tenant-mismatch-delivery"
      };
    default:
      return {};
  }
}

function inferBody(testCase: GeneratedSecurityTestCase): unknown {
  const webhookVariant = readStringValue(testCase.testData.webhookVariant);

  switch (webhookVariant) {
    case "missing-signature":
      return {
        paymentId: "payment-user-1",
        tenantId: "tenant-a",
        paymentStatus: "paid"
      };
    case "replay":
      return {
        paymentId: "payment-user-1",
        tenantId: "tenant-a",
        paymentStatus: "paid"
      };
    case "malformed-payload":
      return {
        paymentId: "payment-user-1",
        tenantId: "tenant-a"
      };
    case "tenant-mismatch":
      return {
        paymentId: "payment-user-1",
        tenantId: "tenant-b",
        paymentStatus: "paid"
      };
  }

  const toState = readStringValue(testCase.testData.toState);

  if (toState) {
    return {
      transition: toState
    };
  }

  if (testCase.testData.replayKey) {
    return {
      transition: "submitted"
    };
  }

  if (testCase.testData.requestedTransition === "paid") {
    return {
      approvalId: "approval-user-1",
      amount: 42
    };
  }

  return undefined;
}

function readStringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
