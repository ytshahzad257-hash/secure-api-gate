import { describe, expect, it } from "vitest";
import { PROJECT_INFO, TOOL_VERSION } from "../src/index.js";

describe("core package metadata", () => {
  it("exports the package version", () => {
    expect(TOOL_VERSION).toBe("0.1.0");
    expect(PROJECT_INFO.name).toBe("SecureAPI-Gate");
  });
});
