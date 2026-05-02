import { TOOL_VERSION, type EvidenceRecord, type SecurityCategory, type SecurityTestRunResult } from "../types.js";

export interface EvidenceRecordOptions {
  timestamp?: string;
}

export function toEvidenceRecord(
  result: SecurityTestRunResult,
  options: EvidenceRecordOptions = {}
): EvidenceRecord {
  return {
    scenarioId: result.scenarioId,
    category: result.category,
    title: result.title,
    description: result.description ?? result.expectedBehavior,
    endpoint: result.endpoint,
    method: result.method,
    actorRole: result.actorRole,
    targetResourceOwner: result.targetResourceOwner,
    request: result.request,
    response: result.response,
    expectedBehavior: result.expectedBehavior,
    expectedStatus: result.expectedStatus,
    observedStatus: result.observedStatus,
    observedBehavior: result.observedBehavior,
    passed: result.passed,
    severity: result.severity,
    riskWeight: result.riskWeight,
    standardsMapping: result.standardsMapping,
    recommendation: getRecommendation(result.category),
    timestamp: options.timestamp ?? new Date().toISOString(),
    toolVersion: TOOL_VERSION
  };
}

export function toEvidenceRecords(
  results: SecurityTestRunResult[],
  options: EvidenceRecordOptions = {}
): EvidenceRecord[] {
  return results.map((result) => toEvidenceRecord(result, options));
}

export function serializeEvidenceRecord(record: EvidenceRecord): string {
  return `${JSON.stringify(record, null, 2)}\n`;
}

export function getEvidenceFileName(record: Pick<EvidenceRecord, "scenarioId">): string {
  return `${record.scenarioId}.json`;
}

function getRecommendation(category: SecurityCategory): string {
  const recommendations: Record<SecurityCategory, string> = {
    BOLA: "Enforce object ownership checks before returning or mutating resource data.",
    BOPLA: "Apply request body allowlisting and ignore or reject server-controlled fields.",
    BFLA: "Verify role and function-level authorization on every privileged endpoint.",
    AUTH: "Validate token signature, expiry, audience, issuer, and trusted claims consistently.",
    SESSION: "Bind sessions to current user, role, tenant, revocation, and logout state.",
    WORKFLOW: "Validate workflow transitions against server-side state machines.",
    INVENTORY: "Remove or protect debug, deprecated, internal, and unlisted API endpoints.",
    THIRD_PARTY: "Validate webhook signatures, replay identifiers, tenant binding, and payload schemas.",
    ERROR_LEAKAGE: "Return sanitized errors and avoid exposing internals or object existence signals."
  };

  return recommendations[category];
}
