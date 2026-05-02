import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import type { TestPolicyConfig } from "../types.js";
import { validateTestPolicyConfig } from "./policy-validator.js";

export class ConfigFileLoadError extends Error {
  constructor(
    message: string,
    readonly filePath: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "ConfigFileLoadError";
  }
}

export async function loadYamlConfigFile(filePath: string): Promise<unknown> {
  let raw: string;

  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    throw new ConfigFileLoadError(`Unable to read config file: ${filePath}`, filePath, error);
  }

  try {
    return parseYaml(raw);
  } catch (error) {
    throw new ConfigFileLoadError(`Unable to parse YAML config file: ${filePath}`, filePath, error);
  }
}

export async function loadAndValidateYamlConfig<T>(
  filePath: string,
  validate: (document: unknown, sourcePath?: string) => T
): Promise<T> {
  return validate(await loadYamlConfigFile(filePath), filePath);
}

export async function loadTestPolicyConfig(filePath: string): Promise<TestPolicyConfig> {
  return loadAndValidateYamlConfig(filePath, validateTestPolicyConfig);
}
