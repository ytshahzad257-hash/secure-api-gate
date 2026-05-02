import type { Express } from "express";
import { getDemoClaims, requireAnyRole, requireDemoAuth } from "../auth/middleware.js";
import type { DemoApiContext } from "../types.js";

export function registerInventoryRoutes(app: Express, context: DemoApiContext): void {
  app.get("/admin/inventory", requireDemoAuth(context), (request, response) => {
    const claims = getDemoClaims(request, context);

    if (context.mode === "fixed" && !requireAnyRole(claims, ["admin"])) {
      response.status(403).json({ error: "forbidden" });
      return;
    }

    response.json({ items: context.store.inventory });
  });

  app.get("/admin/metrics", requireDemoAuth(context), (request, response) => {
    const claims = getDemoClaims(request, context);

    if (context.mode === "fixed" && !requireAnyRole(claims, ["admin"])) {
      response.status(403).json({ error: "forbidden" });
      return;
    }

    response.json({
      users: context.store.users.length,
      payments: context.store.payments.length,
      tickets: context.store.tickets.length
    });
  });

  app.get("/debug/version", (_request, response) => {
    if (context.mode === "fixed") {
      response.status(401).json({ error: "authentication_required" });
      return;
    }

    response.json({
      mode: context.mode,
      version: "0.1.0",
      internalBuild: "local-demo-build",
      database: "sqlite-demo"
    });
  });

  app.get("/debug/config", (_request, response) => {
    if (context.mode === "fixed") {
      response.status(404).json({ error: "not_found" });
      return;
    }

    response.json({
      tokenAudience: "secureapi-demo",
      webhookSecret: "demo-local-webhook-secret"
    });
  });

  app.get("/v1/legacy/users", requireDemoAuth(context), (_request, response) => {
    if (context.mode === "fixed") {
      response.status(404).json({ error: "not_found" });
      return;
    }

    response.json({ users: context.store.users });
  });

  app.get("/openapi.json", (_request, response) => {
    if (context.mode === "fixed") {
      response.status(401).json({ error: "authentication_required" });
      return;
    }

    response.json({
      openapi: "3.0.3",
      info: {
        title: "SecureAPI-Gate Demo API",
        version: "0.1.0"
      }
    });
  });
}
