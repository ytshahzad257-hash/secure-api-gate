import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ConfigValidationError,
  loadOwnershipRulesConfig,
  loadRoleMatrixConfig,
  loadTestPolicyConfig,
  loadWorkflowRulesConfig,
  validateRoleMatrixConfig
} from "../src/index.js";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const fixturesDirectory = resolve(testDirectory, "fixtures/configs");
const repositoryRoot = resolve(testDirectory, "../../../");

function fixturePath(name: string): string {
  return resolve(fixturesDirectory, name);
}

describe("configuration loaders", () => {
  it("loads and validates role-matrix.yml files", async () => {
    const config = await loadRoleMatrixConfig(fixturePath("role-matrix.valid.yml"));

    expect(config.roles.user).toEqual({
      tokenEnv: "USER_TOKEN",
      allowedEndpoints: [
        {
          method: "GET",
          path: "/profiles/{id}"
        }
      ],
      forbiddenEndpoints: [
        {
          method: "GET",
          path: "/admin/users"
        }
      ]
    });
    expect(config.roles.admin?.allowedEndpoints).toEqual([]);
    expect(config.accessRules[0]).toMatchObject({
      id: "RULE-USER-PROFILE",
      role: "user",
      method: "GET",
      path: "/profiles/{id}",
      ownershipRequired: true,
      expectedStatus: 403
    });
    expect(config.workflowRules[0]?.allowedTransitions.approved).toEqual(["paid"]);
  });

  it("loads the checked-in example role matrix", async () => {
    const config = await loadRoleMatrixConfig(
      resolve(repositoryRoot, "examples/configs/role-matrix.yml")
    );

    expect(Object.keys(config.roles)).toEqual(["user", "manager", "admin"]);
    expect(config.ownership.tenantFields).toEqual(["tenantId"]);
    expect(config.accessRules.map((rule) => rule.id)).toEqual([
      "RULE-001",
      "RULE-002",
      "RULE-003",
      "RULE-004",
      "RULE-005",
      "RULE-006",
      "RULE-007"
    ]);
  });

  it("loads and validates test-policy.yml files", async () => {
    const config = await loadTestPolicyConfig(fixturePath("test-policy.valid.yml"));

    expect(config.enabledCategories).toEqual(["BOLA", "BOPLA", "ERROR_LEAKAGE"]);
    expect(config.severityOverrides).toEqual({
      "SAG-BOLA-001": "high"
    });
    expect(config.redaction).toEqual({
      headers: ["authorization"],
      bodyFields: ["token"]
    });
    expect(config.retryCount).toBe(1);
  });

  it("loads and validates ownership-rules.yml files", async () => {
    const config = await loadOwnershipRulesConfig(fixturePath("ownership-rules.valid.yml"));

    expect(config.ownership).toEqual({
      userIdFields: ["userId", "customerId"],
      tenantFields: ["tenantId", "organizationId"]
    });
  });

  it("loads and validates workflow-rules.yml files", async () => {
    const config = await loadWorkflowRulesConfig(fixturePath("workflow-rules.valid.yml"));

    expect(config.workflowRules).toHaveLength(1);
    expect(config.workflowRules[0]?.allowedTransitions.rejected).toEqual([]);
  });

  it("formats role matrix validation errors with readable field paths", async () => {
    await expect(loadRoleMatrixConfig(fixturePath("role-matrix.invalid.yml"))).rejects.toThrow(
      ConfigValidationError
    );

    await expect(loadRoleMatrixConfig(fixturePath("role-matrix.invalid.yml"))).rejects.toThrow(
      /roles.user.tokenEnv: must not be empty/
    );
    await expect(loadRoleMatrixConfig(fixturePath("role-matrix.invalid.yml"))).rejects.toThrow(
      /ownership.userIdFields: must contain at least one ownership field/
    );
    await expect(loadRoleMatrixConfig(fixturePath("role-matrix.invalid.yml"))).rejects.toThrow(
      /accessRules\[0\].method: Invalid enum value/
    );
    await expect(loadRoleMatrixConfig(fixturePath("role-matrix.invalid.yml"))).rejects.toThrow(
      /accessRules\[0\].path: must start with \//
    );
  });

  it("formats test policy validation errors with readable field paths", async () => {
    await expect(loadTestPolicyConfig(fixturePath("test-policy.invalid.yml"))).rejects.toThrow(
      /enabledCategories: must enable at least one security category/
    );
    await expect(loadTestPolicyConfig(fixturePath("test-policy.invalid.yml"))).rejects.toThrow(
      /severityOverrides.SAG-BOLA-001: Invalid enum value/
    );
    await expect(loadTestPolicyConfig(fixturePath("test-policy.invalid.yml"))).rejects.toThrow(
      /ciThreshold: Number must be less than or equal to 100/
    );
  });

  it("formats workflow validation errors for undeclared transition targets", async () => {
    await expect(
      loadWorkflowRulesConfig(fixturePath("workflow-rules.invalid.yml"))
    ).rejects.toThrow(
      /workflowRules\[0\].allowedTransitions.submitted: transition target "archived" must be declared as a workflow state/
    );
  });

  it("validates unknown access-rule roles after base schema parsing succeeds", () => {
    expect(() =>
      validateRoleMatrixConfig({
        roles: {
          user: {
            tokenEnv: "USER_TOKEN"
          }
        },
        ownership: {
          userIdFields: ["userId"]
        },
        accessRules: [
          {
            id: "RULE-UNKNOWN",
            role: "auditor",
            method: "GET",
            path: "/audit/events",
            ownershipRequired: false
          }
        ]
      })
    ).toThrow(/accessRules\[0\].role: role "auditor" is not defined in roles/);
  });
});
