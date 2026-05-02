import type { Express } from "express";

export function registerVulnerableRoutes(app: Express): void {
  app.get("/vulnerable/stacktrace", (_request, response) => {
    response.status(500).json({
      error: "TypeError: Cannot read properties of undefined",
      stack: "TypeError: Cannot read properties of undefined\n    at vulnerable-routes.ts:7:11"
    });
  });
}
