import { z, type ZodIssue } from "zod";
import type {
  AccessControlRule,
  EndpointSelector,
  HttpMethod,
  OwnershipConfig,
  OwnershipRulesConfig,
  RedactionConfig,
  RoleTokenConfig,
  RoleMatrixConfig,
  SecurityCategory,
  Severity,
  TestPolicyConfig,
  TestPolicyOutputConfig,
  WorkflowRule,
  WorkflowRulesConfig
} from "../types.js";

const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE"] as const;
const securityCategories = [
  "BOLA",
  "BOPLA",
  "BFLA",
  "AUTH",
  "SESSION",
  "WORKFLOW",
  "INVENTORY",
  "THIRD_PARTY",
  "ERROR_LEAKAGE"
] as const;
const severities = ["critical", "high", "medium", "low"] as const;

const nonEmptyStringSchema = z.string().trim().min(1, "must not be empty");
const pathTemplateSchema = nonEmptyStringSchema.refine((path) => path.startsWith("/"), {
  message: "must start with /"
});

export class ConfigValidationError extends Error {
  constructor(
    readonly label: string,
    readonly issues: string[],
    readonly sourcePath?: string
  ) {
    super(formatConfigErrorMessage(label, issues, sourcePath));
    this.name = "ConfigValidationError";
  }
}

const httpMethodSchema: z.ZodType<HttpMethod, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
  z.enum(httpMethods)
) as z.ZodType<HttpMethod, z.ZodTypeDef, unknown>;

const securityCategorySchema: z.ZodType<SecurityCategory, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
  z.enum(securityCategories)
) as z.ZodType<SecurityCategory, z.ZodTypeDef, unknown>;

const severitySchema: z.ZodType<Severity, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.enum(severities)
) as z.ZodType<Severity, z.ZodTypeDef, unknown>;

const endpointSelectorSchema: z.ZodType<EndpointSelector, z.ZodTypeDef, unknown> = z.object({
  method: httpMethodSchema.optional(),
  path: pathTemplateSchema
});

const roleTokenConfigSchema: z.ZodType<RoleTokenConfig, z.ZodTypeDef, unknown> = z
  .object({
    tokenEnv: nonEmptyStringSchema,
    allowedEndpoints: z.array(endpointSelectorSchema).default([]),
    forbiddenEndpoints: z.array(endpointSelectorSchema).default([])
  })
  .transform((role) => ({
    tokenEnv: role.tokenEnv,
    allowedEndpoints: role.allowedEndpoints ?? [],
    forbiddenEndpoints: role.forbiddenEndpoints ?? []
  }));

export const ownershipConfigSchema: z.ZodType<OwnershipConfig, z.ZodTypeDef, unknown> = z
  .object({
    userIdFields: z.array(nonEmptyStringSchema).min(1, "must contain at least one ownership field"),
    tenantFields: z.array(nonEmptyStringSchema).default([])
  })
  .transform((ownership) => ({
    userIdFields: ownership.userIdFields,
    tenantFields: ownership.tenantFields ?? []
  }));

export const accessControlRuleSchema: z.ZodType<AccessControlRule, z.ZodTypeDef, unknown> =
  z.object({
    id: nonEmptyStringSchema,
    role: nonEmptyStringSchema,
    method: httpMethodSchema,
    path: pathTemplateSchema,
    ownershipRequired: z.boolean(),
    expectedStatus: z.number().int().min(100).max(599).optional()
  });

export const workflowRuleSchema: z.ZodType<WorkflowRule, z.ZodTypeDef, unknown> = z
  .object({
    object: nonEmptyStringSchema,
    allowedTransitions: z.record(z.array(nonEmptyStringSchema))
  })
  .superRefine((rule, context) => {
    const states = new Set(Object.keys(rule.allowedTransitions));

    for (const [state, nextStates] of Object.entries(rule.allowedTransitions)) {
      for (const nextState of nextStates) {
        if (!states.has(nextState)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["allowedTransitions", state],
            message: `transition target "${nextState}" must be declared as a workflow state`
          });
        }
      }
    }
  });

export const roleMatrixConfigSchema: z.ZodType<RoleMatrixConfig, z.ZodTypeDef, unknown> = z
  .object({
    roles: z.record(roleTokenConfigSchema).refine((roles) => Object.keys(roles).length > 0, {
      message: "must define at least one role"
    }),
    ownership: ownershipConfigSchema,
    sensitiveFields: z.array(nonEmptyStringSchema).default([]),
    accessRules: z.array(accessControlRuleSchema).default([]),
    workflowRules: z.array(workflowRuleSchema).default([])
  })
  .superRefine((config, context) => {
    const roleNames = new Set(Object.keys(config.roles));

    (config.accessRules ?? []).forEach((rule, index) => {
      if (!roleNames.has(rule.role)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["accessRules", index, "role"],
          message: `role "${rule.role}" is not defined in roles`
        });
      }
    });
  })
  .transform((config) => ({
    roles: config.roles,
    ownership: config.ownership,
    sensitiveFields: config.sensitiveFields ?? [],
    accessRules: config.accessRules ?? [],
    workflowRules: config.workflowRules ?? []
  }));

const testPolicyOutputSchema: z.ZodType<TestPolicyOutputConfig, z.ZodTypeDef, unknown> = z.object({
  directory: nonEmptyStringSchema
});

const redactionConfigSchema: z.ZodType<RedactionConfig, z.ZodTypeDef, unknown> = z
  .object({
    headers: z.array(nonEmptyStringSchema).default([]),
    bodyFields: z.array(nonEmptyStringSchema).default([])
  })
  .default({
    headers: [],
    bodyFields: []
  })
  .transform((redaction) => ({
    headers: redaction.headers ?? [],
    bodyFields: redaction.bodyFields ?? []
  }));

export const testPolicyConfigSchema: z.ZodType<TestPolicyConfig, z.ZodTypeDef, unknown> = z
  .object({
    enabledCategories: z
      .array(securityCategorySchema)
      .min(1, "must enable at least one security category"),
    severityOverrides: z.record(severitySchema).default({}),
    ciThreshold: z.number().min(0).max(100),
    output: testPolicyOutputSchema,
    redaction: redactionConfigSchema,
    timeoutMs: z.number().int().positive(),
    retryCount: z.number().int().min(0),
    failFast: z.boolean()
  })
  .transform((policy) => ({
    enabledCategories: policy.enabledCategories,
    severityOverrides: policy.severityOverrides ?? {},
    ciThreshold: policy.ciThreshold,
    output: policy.output,
    redaction: policy.redaction,
    timeoutMs: policy.timeoutMs,
    retryCount: policy.retryCount,
    failFast: policy.failFast
  }));

export const ownershipRulesConfigSchema: z.ZodType<OwnershipRulesConfig, z.ZodTypeDef, unknown> =
  z.object({
    ownership: ownershipConfigSchema
  });

export const workflowRulesConfigSchema: z.ZodType<WorkflowRulesConfig, z.ZodTypeDef, unknown> =
  z.object({
    workflowRules: z.array(workflowRuleSchema).min(1, "must define at least one workflow rule")
  });

export function validateRoleMatrixConfig(document: unknown, sourcePath?: string): RoleMatrixConfig {
  return parseConfig(roleMatrixConfigSchema, document, "role-matrix.yml", sourcePath);
}

export function validateTestPolicyConfig(document: unknown, sourcePath?: string): TestPolicyConfig {
  return parseConfig(testPolicyConfigSchema, document, "test-policy.yml", sourcePath);
}

export function validateOwnershipRulesConfig(
  document: unknown,
  sourcePath?: string
): OwnershipRulesConfig {
  return parseConfig(ownershipRulesConfigSchema, document, "ownership-rules.yml", sourcePath);
}

export function validateWorkflowRulesConfig(
  document: unknown,
  sourcePath?: string
): WorkflowRulesConfig {
  return parseConfig(workflowRulesConfigSchema, document, "workflow-rules.yml", sourcePath);
}

export function formatConfigIssues(issues: ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = formatIssuePath(issue.path);
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

export function formatConfigErrorMessage(
  label: string,
  issues: string[],
  sourcePath?: string
): string {
  const heading = sourcePath ? `Invalid ${label} at ${sourcePath}` : `Invalid ${label}`;
  const details = issues.map((issue) => `- ${issue}`).join("\n");

  return `${heading}\n${details}`;
}

function parseConfig<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  document: unknown,
  label: string,
  sourcePath?: string
): T {
  const result = schema.safeParse(document);

  if (!result.success) {
    throw new ConfigValidationError(label, formatConfigIssues(result.error.issues), sourcePath);
  }

  return result.data;
}

function formatIssuePath(path: Array<string | number>): string {
  return path.reduce<string>((formatted, segment) => {
    if (typeof segment === "number") {
      return `${formatted}[${segment}]`;
    }

    return formatted ? `${formatted}.${segment}` : segment;
  }, "");
}
