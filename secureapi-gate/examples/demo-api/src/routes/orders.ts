import type { Express } from "express";
import { canAccessOwnedResource, getDemoClaims, requireDemoAuth } from "../auth/middleware.js";
import type { DemoApiContext } from "../types.js";

export function registerOrderRoutes(app: Express, context: DemoApiContext): void {
  app.get("/orders/:id", requireDemoAuth(context), (request, response) => {
    const order = context.store.orders.find((candidate) => candidate.id === request.params.id);

    if (!order) {
      response.status(404).json({ error: "not_found" });
      return;
    }

    const claims = getDemoClaims(request, context);

    if (context.mode === "fixed" && !canAccessOwnedResource(claims, order.userId, order.tenantId)) {
      response.status(403).json({ error: "forbidden" });
      return;
    }

    response.json(order);
  });
}
