import type { Express } from "express";
import { canAccessOwnedResource, getDemoClaims, requireDemoAuth } from "../auth/middleware.js";
import type { DemoApiContext } from "../types.js";

export function registerTicketRoutes(app: Express, context: DemoApiContext): void {
  app.patch("/tickets/:id", requireDemoAuth(context), (request, response) => {
    const ticket = context.store.tickets.find((candidate) => candidate.id === request.params.id);

    if (!ticket) {
      response.status(404).json({ error: "not_found" });
      return;
    }

    const claims = getDemoClaims(request, context);

    if (
      context.mode === "fixed" &&
      !canAccessOwnedResource(claims, ticket.ownerId, ticket.tenantId)
    ) {
      response.status(403).json({ error: "forbidden" });
      return;
    }

    if (
      typeof request.body.status === "string" &&
      ["open", "closed"].includes(request.body.status)
    ) {
      ticket.status = request.body.status;
    }

    response.json(ticket);
  });
}
