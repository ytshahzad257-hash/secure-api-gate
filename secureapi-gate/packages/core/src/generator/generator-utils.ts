import type {
  GeneratedSecurityTestCase,
  HttpMethod,
  SecurityCategory,
  SecurityTestGenerationInput,
  Severity,
  StandardsMapping
} from "../types.js";

export interface ScenarioEndpointHint {
  method: HttpMethod;
  fallbackPath: string;
  pathIncludes?: string[];
}

export interface ScenarioDefinition {
  category: SecurityCategory;
  idPrefix: string;
  sequence: number;
  title: string;
  description: string;
  endpoint: ScenarioEndpointHint;
  actorRole: string;
  targetResourceOwner?: string;
  expectedBehavior: string;
  expectedStatus?: number;
  severity: Severity;
  standardsMapping: StandardsMapping;
  testData?: Record<string, unknown>;
}

export const SEVERITY_RISK_WEIGHTS: Record<Severity, number> = {
  critical: 15,
  high: 10,
  medium: 6,
  low: 3
};

export function createSecurityTestCase(
  definition: ScenarioDefinition,
  input: SecurityTestGenerationInput
): GeneratedSecurityTestCase {
  const endpoint = resolveEndpoint(definition.endpoint, input);
  const scenarioId = `SAG-${definition.idPrefix}-${String(definition.sequence).padStart(3, "0")}`;
  const severity = input.testPolicy?.severityOverrides[scenarioId] ?? definition.severity;

  return {
    scenarioId,
    category: definition.category,
    title: definition.title,
    description: definition.description,
    endpoint: endpoint.path,
    method: endpoint.method,
    actorRole: resolveActorRole(definition.actorRole, input),
    targetResourceOwner: definition.targetResourceOwner,
    expectedBehavior: definition.expectedBehavior,
    expectedStatus: definition.expectedStatus,
    severity,
    riskWeight: SEVERITY_RISK_WEIGHTS[severity],
    standardsMapping: definition.standardsMapping,
    testData: definition.testData ?? {}
  };
}

export function createSecurityTestCases(
  definitions: ScenarioDefinition[],
  input: SecurityTestGenerationInput
): GeneratedSecurityTestCase[] {
  return definitions.map((definition) => createSecurityTestCase(definition, input));
}

export function resolveActorRole(actorRole: string, input: SecurityTestGenerationInput): string {
  const roleNames = Object.keys(input.roleMatrix?.roles ?? {});

  if (roleNames.length === 0) {
    return actorRole;
  }

  if (roleNames.includes(actorRole)) {
    return actorRole;
  }

  if (actorRole === "anonymous") {
    return actorRole;
  }

  if (actorRole === "user") {
    return (
      roleNames.find((role) => role !== "admin" && role !== "manager") ?? roleNames[0] ?? actorRole
    );
  }

  if (actorRole === "manager") {
    return roleNames.find((role) => role === "manager") ?? roleNames[0] ?? actorRole;
  }

  return actorRole;
}

export function resolveEndpoint(
  hint: ScenarioEndpointHint,
  input: SecurityTestGenerationInput
): { method: HttpMethod; path: string } {
  const endpoints = input.apiSpec?.endpoints ?? [];
  const exactMatch = endpoints.find(
    (endpoint) => endpoint.method === hint.method && endpoint.path === hint.fallbackPath
  );

  if (exactMatch) {
    return {
      method: exactMatch.method,
      path: exactMatch.path
    };
  }

  const loweredHints = (hint.pathIncludes ?? []).map((pathHint) => pathHint.toLowerCase());
  const hintedMatch = endpoints.find((endpoint) => {
    if (endpoint.method !== hint.method) {
      return false;
    }

    const loweredPath = endpoint.path.toLowerCase();
    return loweredHints.some((pathHint) => loweredPath.includes(pathHint));
  });

  if (hintedMatch) {
    return {
      method: hintedMatch.method,
      path: hintedMatch.path
    };
  }

  return {
    method: hint.method,
    path: hint.fallbackPath
  };
}

export function isCategoryEnabled(
  category: SecurityCategory,
  input: SecurityTestGenerationInput
): boolean {
  const enabledCategories = input.testPolicy?.enabledCategories;
  return !enabledCategories || enabledCategories.includes(category);
}

export const standards = {
  bola: {
    OWASP_API_Top_10_2023: ["API1:2023", "API5:2023"],
    OWASP_ASVS: ["V4", "V5"],
    NIST_SSDF: ["PW.7", "RV.1"]
  },
  bopla: {
    OWASP_API_Top_10_2023: ["API3:2023", "API6:2023"],
    OWASP_ASVS: ["V4", "V5"],
    NIST_SSDF: ["PW.7", "RV.1"]
  },
  bfla: {
    OWASP_API_Top_10_2023: ["API5:2023"],
    OWASP_ASVS: ["V4"],
    NIST_SSDF: ["PW.7", "RV.1"]
  },
  auth: {
    OWASP_API_Top_10_2023: ["API2:2023"],
    OWASP_ASVS: ["V2", "V3"],
    NIST_SSDF: ["PW.7", "RV.1"]
  },
  session: {
    OWASP_API_Top_10_2023: ["API2:2023", "API5:2023"],
    OWASP_ASVS: ["V2", "V3", "V4"],
    NIST_SSDF: ["PW.7", "RV.1"]
  },
  workflow: {
    OWASP_API_Top_10_2023: ["API6:2023", "API5:2023"],
    OWASP_ASVS: ["V4", "V11"],
    NIST_SSDF: ["PW.7", "RV.1"]
  },
  inventory: {
    OWASP_API_Top_10_2023: ["API9:2023", "API8:2023"],
    OWASP_ASVS: ["V1", "V14"],
    NIST_SSDF: ["PO.5", "RV.1"]
  },
  thirdParty: {
    OWASP_API_Top_10_2023: ["API10:2023"],
    OWASP_ASVS: ["V10", "V13"],
    NIST_SSDF: ["PW.7", "RV.1"]
  },
  errorLeakage: {
    OWASP_API_Top_10_2023: ["API8:2023", "API1:2023"],
    OWASP_ASVS: ["V7", "V14"],
    NIST_SSDF: ["RV.1", "RV.3"]
  }
} satisfies Record<string, StandardsMapping>;
