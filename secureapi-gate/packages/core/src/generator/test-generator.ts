import type {
  GeneratedSecurityTestCase,
  SecurityCategory,
  SecurityTestGenerationInput
} from "../types.js";
import { generateAuthTests } from "./auth-generator.js";
import { generateBflaTests } from "./bfla-generator.js";
import { generateBolaTests } from "./bola-generator.js";
import { generateBoplaTests } from "./bopla-generator.js";
import { generateErrorLeakageTests } from "./error-leakage-generator.js";
import { isCategoryEnabled } from "./generator-utils.js";
import { generateInventoryTests } from "./inventory-generator.js";
import { generateSessionTests } from "./session-generator.js";
import { generateThirdPartyTests } from "./third-party-generator.js";
import { generateWorkflowTests } from "./workflow-generator.js";

type CategoryGenerator = (input: SecurityTestGenerationInput) => GeneratedSecurityTestCase[];

const categoryGenerators: Array<{
  category: SecurityCategory;
  generate: CategoryGenerator;
}> = [
  {
    category: "BOLA",
    generate: generateBolaTests
  },
  {
    category: "BOPLA",
    generate: generateBoplaTests
  },
  {
    category: "BFLA",
    generate: generateBflaTests
  },
  {
    category: "AUTH",
    generate: generateAuthTests
  },
  {
    category: "SESSION",
    generate: generateSessionTests
  },
  {
    category: "WORKFLOW",
    generate: generateWorkflowTests
  },
  {
    category: "INVENTORY",
    generate: generateInventoryTests
  },
  {
    category: "THIRD_PARTY",
    generate: generateThirdPartyTests
  },
  {
    category: "ERROR_LEAKAGE",
    generate: generateErrorLeakageTests
  }
];

export function generateSecurityTestCases(
  input: SecurityTestGenerationInput = {}
): GeneratedSecurityTestCase[] {
  return categoryGenerators.flatMap(({ category, generate }) =>
    isCategoryEnabled(category, input) ? generate(input) : []
  );
}
