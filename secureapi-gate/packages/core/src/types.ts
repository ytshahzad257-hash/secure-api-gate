export const TOOL_VERSION = "0.1.0" as const;

export type Severity = "critical" | "high" | "medium" | "low";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "TRACE";

export type SecurityCategory =
  | "BOLA"
  | "BOPLA"
  | "BFLA"
  | "AUTH"
  | "SESSION"
  | "WORKFLOW"
  | "INVENTORY"
  | "THIRD_PARTY"
  | "ERROR_LEAKAGE";

export type ApiSpecFormat = "openapi" | "postman";

export type ParameterLocation = "path" | "query" | "header" | "cookie" | "body";

export interface EndpointParameter {
  name: string;
  in: ParameterLocation;
  required: boolean;
  description?: string;
  schemaType?: string;
}

export interface RequestBodyDescriptor {
  required: boolean;
  contentTypes: string[];
}

export interface ResponseDescriptor {
  statusCode: string;
  description?: string;
  contentTypes: string[];
}

export interface EndpointSource {
  format: ApiSpecFormat;
  sourcePath?: string;
  collectionItemName?: string;
}

export interface ApiEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  routeKey: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags: string[];
  parameters: EndpointParameter[];
  requestBody?: RequestBodyDescriptor;
  responses: ResponseDescriptor[];
  security: string[];
  deprecated: boolean;
  source: EndpointSource;
}

export interface ParsedApiSpec {
  format: ApiSpecFormat;
  title: string;
  version?: string;
  sourcePath?: string;
  baseUrls: string[];
  endpoints: ApiEndpoint[];
  warnings: string[];
}

export interface EndpointNormalizerInput {
  method: string;
  path: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: EndpointParameter[];
  requestBody?: RequestBodyDescriptor;
  responses?: ResponseDescriptor[];
  security?: string[];
  deprecated?: boolean;
  source: EndpointSource;
}

export interface EndpointSelector {
  method?: HttpMethod;
  path: string;
}

export interface RoleTokenConfig {
  tokenEnv: string;
  allowedEndpoints: EndpointSelector[];
  forbiddenEndpoints: EndpointSelector[];
}

export interface OwnershipConfig {
  userIdFields: string[];
  tenantFields: string[];
}

export interface AccessControlRule {
  id: string;
  role: string;
  method: HttpMethod;
  path: string;
  ownershipRequired: boolean;
  expectedStatus?: number;
}

export interface WorkflowRule {
  object: string;
  allowedTransitions: Record<string, string[]>;
}

export interface RoleMatrixConfig {
  roles: Record<string, RoleTokenConfig>;
  ownership: OwnershipConfig;
  sensitiveFields: string[];
  accessRules: AccessControlRule[];
  workflowRules: WorkflowRule[];
}

export interface TestPolicyOutputConfig {
  directory: string;
}

export interface RedactionConfig {
  headers: string[];
  bodyFields: string[];
}

export interface TestPolicyConfig {
  enabledCategories: SecurityCategory[];
  severityOverrides: Record<string, Severity>;
  ciThreshold: number;
  output: TestPolicyOutputConfig;
  redaction: RedactionConfig;
  timeoutMs: number;
  retryCount: number;
  failFast: boolean;
}

export interface OwnershipRulesConfig {
  ownership: OwnershipConfig;
}

export interface WorkflowRulesConfig {
  workflowRules: WorkflowRule[];
}

export interface StandardsMapping {
  OWASP_API_Top_10_2023: string[];
  OWASP_ASVS: string[];
  NIST_SSDF: string[];
}

export interface GeneratedSecurityTestCase {
  scenarioId: string;
  category: SecurityCategory;
  title: string;
  description: string;
  endpoint: string;
  method: HttpMethod;
  actorRole: string;
  targetResourceOwner?: string;
  expectedBehavior: string;
  expectedStatus?: number;
  severity: Severity;
  riskWeight: number;
  standardsMapping: StandardsMapping;
  testData: Record<string, unknown>;
}

export interface HttpRequestRecord {
  method: HttpMethod;
  url: string;
  headersRedacted: Record<string, string>;
  bodyRedacted?: unknown;
}

export interface HttpResponseRecord {
  status: number | null;
  headersRedacted: Record<string, string>;
  bodyRedacted?: unknown;
}

export interface HttpExecutionError {
  type: "timeout" | "network" | "unexpected";
  message: string;
  code?: string;
}

export interface AssertionResult {
  passed: boolean;
  observedBehavior: string;
  failures: string[];
}

export interface SecurityTestRunResult {
  scenarioId: string;
  category: SecurityCategory;
  title: string;
  description?: string;
  endpoint: string;
  method: HttpMethod;
  actorRole: string;
  targetResourceOwner?: string;
  expectedBehavior: string;
  expectedStatus?: number;
  observedStatus: number | null;
  observedBehavior: string;
  passed: boolean;
  severity: Severity;
  riskWeight: number;
  standardsMapping: StandardsMapping;
  request: HttpRequestRecord;
  response: HttpResponseRecord;
  attempts: number;
  durationMs: number;
  error?: HttpExecutionError;
}

export interface EvidenceRecord {
  scenarioId: string;
  category: SecurityCategory;
  title: string;
  description: string;
  endpoint: string;
  method: HttpMethod;
  actorRole: string;
  targetResourceOwner?: string;
  request: HttpRequestRecord;
  response?: HttpResponseRecord;
  expectedBehavior: string;
  expectedStatus?: number;
  observedStatus: number | null;
  observedBehavior: string;
  passed: boolean;
  severity: Severity;
  riskWeight: number;
  standardsMapping: StandardsMapping;
  recommendation: string;
  timestamp: string;
  toolVersion: typeof TOOL_VERSION;
}

export interface CategoryRiskBreakdown {
  category: SecurityCategory;
  total: number;
  passed: number;
  failed: number;
  deductions: number;
  score: number;
}

export interface FailedHighRiskScenario {
  scenarioId: string;
  category: SecurityCategory;
  title: string;
  severity: Extract<Severity, "critical" | "high">;
  riskWeight: number;
}

export interface RiskScoreResult {
  overallScore: number;
  threshold: number;
  decision: "PASS" | "BLOCK";
  total: number;
  passed: number;
  failed: number;
  deductions: number;
  categoryBreakdown: CategoryRiskBreakdown[];
  failedCriticalHighScenarios: FailedHighRiskScenario[];
}

export interface TokenManagerOptions {
  roleMatrix?: RoleMatrixConfig;
  env?: Record<string, string | undefined>;
  staticTokens?: Record<string, string>;
}

export interface RunnerOptions {
  baseUrl: string;
  roleMatrix?: RoleMatrixConfig;
  testPolicy?: Pick<TestPolicyConfig, "timeoutMs" | "retryCount" | "redaction" | "failFast">;
  env?: Record<string, string | undefined>;
  staticTokens?: Record<string, string>;
}

export interface SecurityTestGenerationInput {
  apiSpec?: ParsedApiSpec;
  roleMatrix?: RoleMatrixConfig;
  testPolicy?: Pick<TestPolicyConfig, "enabledCategories" | "severityOverrides">;
  ownershipRules?: OwnershipRulesConfig;
  workflowRules?: WorkflowRulesConfig;
}

export interface SecureApiGateProject {
  name: "SecureAPI-Gate";
  title: string;
  version: typeof TOOL_VERSION;
}

export const PROJECT_INFO: SecureApiGateProject = {
  name: "SecureAPI-Gate",
  title:
    "SecureAPI-Gate: A CI/CD Security Regression Gate for Detecting Authorization, Session, Object-Level, and Workflow Drift in REST APIs",
  version: TOOL_VERSION
};
