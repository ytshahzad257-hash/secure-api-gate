import type { OwnershipRulesConfig } from "../types.js";
import { loadAndValidateYamlConfig } from "./policy-loader.js";
import { validateOwnershipRulesConfig } from "./policy-validator.js";

export async function loadOwnershipRulesConfig(filePath: string): Promise<OwnershipRulesConfig> {
  return loadAndValidateYamlConfig(filePath, validateOwnershipRulesConfig);
}
