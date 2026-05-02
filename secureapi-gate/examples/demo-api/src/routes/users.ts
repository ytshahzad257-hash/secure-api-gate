import type { Express } from "express";
import { getDemoClaims, requireAnyRole, requireDemoAuth } from "../auth/middleware.js";
import type { DemoApiContext } from "../types.js";

export function registerUserRoutes(app: Express, context: DemoApiContext): void {
  app.get("/users/me", requireDemoAuth(context), (request, response) => {
    const claims = getDemoClaims(request, context);
    const user = context.store.users.find((candidate) => candidate.id === claims?.sub);

    if (!user) {
      response.status(404).json({ error: "user_not_found" });
      return;
    }

    response.json(user);
  });

  app.get("/admin/users", requireDemoAuth(context), (request, response) => {
    const claims = getDemoClaims(request, context);

    if (context.mode === "fixed" && !requireAnyRole(claims, ["admin"])) {
      response.status(403).json({ error: "forbidden" });
      return;
    }

    response.json({ users: context.store.users });
  });

  app.patch("/users/:id", requireDemoAuth(context), (request, response) => {
    const claims = getDemoClaims(request, context);
    const user = context.store.users.find((candidate) => candidate.id === request.params.id);

    if (!user) {
      response.status(404).json({ error: "user_not_found" });
      return;
    }

    if (context.mode === "fixed" && !requireAnyRole(claims, ["admin"]) && claims?.sub !== user.id) {
      response.status(403).json({ error: "forbidden" });
      return;
    }

    if (context.mode === "vulnerable") {
      Object.assign(user, request.body);
      response.json(user);
      return;
    }

    if ("role" in request.body || "isAdmin" in request.body || "accountStatus" in request.body) {
      response.status(400).json({ error: "sensitive_field_rejected" });
      return;
    }

    if (typeof request.body.displayName === "string") {
      user.displayName = request.body.displayName;
    }

    response.json(user);
  });
}
