import type { WorkflowRulesConfig } from "../types.js";
import { loadAndValidateYamlConfig } from "./policy-loader.js";
import { validateWorkflowRulesConfig } from "./policy-validator.js";

export async function loadWorkflowRulesConfig(filePath: string): Promise<WorkflowRulesConfig> {
  return loadAndValidateYamlConfig(filePath, validateWorkflowRulesConfig);
}
