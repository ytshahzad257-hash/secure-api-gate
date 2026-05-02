import type { Express } from "express";
import { canAccessOwnedResource, getDemoClaims, requireDemoAuth } from "../auth/middleware.js";
import type { DemoApiContext } from "../types.js";

export function registerProfileRoutes(app: Express, context: DemoApiContext): void {
  app.get("/profiles/:id", requireDemoAuth(context), (request, response) => {
    const profileId = request.params.id ?? "";

    if (profileId.includes("..") || profileId.includes("/")) {
      response.status(context.mode === "fixed" ? 400 : 500).json(
        context.mode === "fixed"
          ? { error: "invalid_profile_id" }
          : {
              error: "TypeError: invalid profile id",
              stack: "TypeError: invalid profile id\n    at profiles.ts:8:11"
            }
      );
      return;
    }

    const profile = context.store.profiles.find((candidate) => candidate.id === profileId);

    if (!profile) {
      response
        .status(404)
        .json({ error: context.mode === "vulnerable" ? "missing profile id" : "not_found" });
      return;
    }

    const claims = getDemoClaims(request, context);

    if (
      context.mode === "fixed" &&
      !canAccessOwnedResource(claims, profile.ownerId, profile.tenantId)
    ) {
      response.status(403).json({ error: "forbidden" });
      return;
    }

    response.json(profile);
  });

  app.patch("/profiles/:id", requireDemoAuth(context), (request, response) => {
    const profile = context.store.profiles.find((candidate) => candidate.id === request.params.id);

    if (!profile) {
      response.status(404).json({ error: "not_found" });
      return;
    }

    const claims = getDemoClaims(request, context);

    if (
      context.mode === "fixed" &&
      !canAccessOwnedResource(claims, profile.ownerId, profile.tenantId)
    ) {
      response.status(403).json({ error: "forbidden" });
      return;
    }

    if (context.mode === "vulnerable") {
      Object.assign(profile, request.body);
      response.json(profile);
      return;
    }

    if ("role" in request.body || "isAdmin" in request.body || "accountStatus" in request.body) {
      response.status(400).json({ error: "sensitive_field_rejected" });
      return;
    }

    if (typeof request.body.displayName === "string") {
      profile.displayName = request.body.displayName;
    }

    if (typeof request.body.bio === "string") {
      profile.bio = request.body.bio;
    }

    response.json(profile);
  });
}
