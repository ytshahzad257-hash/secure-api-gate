import type { RoleMatrixConfig } from "../types.js";
import { loadAndValidateYamlConfig } from "./policy-loader.js";
import { validateRoleMatrixConfig } from "./policy-validator.js";

export async function loadRoleMatrixConfig(filePath: string): Promise<RoleMatrixConfig> {
  return loadAndValidateYamlConfig(filePath, validateRoleMatrixConfig);
}
