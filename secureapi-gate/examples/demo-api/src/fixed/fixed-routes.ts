import type { Express } from "express";

export function registerFixedRoutes(app: Express): void {
  app.get("/vulnerable/stacktrace", (_request, response) => {
    response.status(404).json({ error: "not_found" });
  });
}
