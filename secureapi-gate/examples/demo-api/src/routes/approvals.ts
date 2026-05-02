import type { Express } from "express";
import {
  canAccessOwnedResource,
  getDemoClaims,
  requireAnyRole,
  requireDemoAuth
} from "../auth/middleware.js";
import type { DemoApiContext } from "../types.js";

const allowedTransitions: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["approved", "rejected"],
  approved: ["paid"],
  rejected: [],
  paid: []
};

export function registerApprovalRoutes(app: Express, context: DemoApiContext): void {
  app.get("/manager/approvals", requireDemoAuth(context), (request, response) => {
    const claims = getDemoClaims(request, context);

    if (context.mode === "fixed" && !requireAnyRole(claims, ["manager", "admin"])) {
      response.status(403).json({ error: "forbidden" });
      return;
    }

    response.json({ approvals: context.store.approvals });
  });

  app.patch("/approvals/:id", requireDemoAuth(context), (request, response) => {
    const approval = context.store.approvals.find(
      (candidate) => candidate.id === request.params.id
    );

    if (!approval) {
      response.status(404).json({ error: "not_found" });
      return;
    }

    const claims = getDemoClaims(request, context);

    if (
      context.mode === "fixed" &&
      !canAccessOwnedResource(claims, approval.ownerId, approval.tenantId)
    ) {
      response.status(403).json({ error: "forbidden" });
      return;
    }

    if (context.mode === "vulnerable") {
      Object.assign(approval, request.body);
      response.json(approval);
      return;
    }

    if ("approvalState" in request.body) {
      response.status(400).json({ error: "direct_state_update_rejected" });
      return;
    }

    if (approval.approvalState === "paid") {
      response.status(409).json({ error: "completed_workflow_locked" });
      return;
    }

    if (typeof request.body.amount === "number") {
      approval.amount = request.body.amount;
    }

    response.json(approval);
  });

  app.post("/approvals/:id/transition", requireDemoAuth(context), (request, response) => {
    const approval = context.store.approvals.find(
      (candidate) => candidate.id === request.params.id
    );

    if (!approval) {
      response.status(404).json({ error: "not_found" });
      return;
    }

    const claims = getDemoClaims(request, context);

    if (
      context.mode === "fixed" &&
      !canAccessOwnedResource(claims, approval.ownerId, approval.tenantId)
    ) {
      response.status(403).json({ error: "forbidden" });
      return;
    }

    const transition = String(request.body.transition ?? "submitted");

    if (context.mode === "vulnerable") {
      approval.approvalState = transition as typeof approval.approvalState;
      response.json(approval);
      return;
    }

    if (
      (transition === "approved" || transition === "rejected") &&
      !requireAnyRole(claims, ["manager", "admin"])
    ) {
      response.status(403).json({ error: "manager_required" });
      return;
    }

    if (!allowedTransitions[approval.approvalState]?.includes(transition)) {
      response.status(409).json({ error: "invalid_workflow_transition" });
      return;
    }

    approval.approvalState = transition as typeof approval.approvalState;
    response.json(approval);
  });
}
