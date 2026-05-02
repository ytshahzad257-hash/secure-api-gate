import { describe, expect, it } from "vitest";
import { renderHtmlReport } from "../src/html-report.js";

describe("reporter package", () => {
  it("renders a minimal HTML document", () => {
    expect(renderHtmlReport()).toContain("<!doctype html>");
  });
});
