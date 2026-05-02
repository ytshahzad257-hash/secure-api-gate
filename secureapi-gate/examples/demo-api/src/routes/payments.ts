import type { Express } from "express";
import {
  canAccessOwnedResource,
  getDemoClaims,
  requireAnyRole,
  requireDemoAuth
} from "../auth/middleware.js";
import type { DemoApiContext } from "../types.js";

export function registerPaymentRoutes(app: Express, context: DemoApiContext): void {
  app.get("/payments/:id", requireDemoAuth(context), (request, response) => {
    if (request.query.forceError === "orm") {
      response.status(context.mode === "fixed" ? 400 : 500).json({
        error:
          context.mode === "fixed"
            ? "invalid_request"
            : "PrismaClientKnownRequestError: sqlite constraint failed"
      });
      return;
    }

    const payment = context.store.payments.find((candidate) => candidate.id === request.params.id);

    if (!payment) {
      response.status(404).json({ error: "not_found" });
      return;
    }

    const claims = getDemoClaims(request, context);

    if (
      context.mode === "fixed" &&
      !canAccessOwnedResource(claims, payment.userId, payment.tenantId)
    ) {
      response.status(403).json({ error: "forbidden" });
      return;
    }

    response.json(payment);
  });

  app.patch("/payments/:id", requireDemoAuth(context), (request, response) => {
    const payment = context.store.payments.find((candidate) => candidate.id === request.params.id);

    if (!payment) {
      response.status(404).json({ error: "not_found" });
      return;
    }

    const claims = getDemoClaims(request, context);

    if (
      context.mode === "fixed" &&
      !canAccessOwnedResource(claims, payment.userId, payment.tenantId)
    ) {
      response.status(403).json({ error: "forbidden" });
      return;
    }

    if (context.mode === "vulnerable") {
      Object.assign(payment, request.body);
      response.json(payment);
      return;
    }

    if ("paymentStatus" in request.body) {
      response.status(400).json({ error: "sensitive_field_rejected" });
      return;
    }

    response.json(payment);
  });

  app.post("/payments", requireDemoAuth(context), (request, response) => {
    const approvalId = String(request.body.approvalId ?? "approval-user-1");
    const approval = context.store.approvals.find((candidate) => candidate.id === approvalId);
    const claims = getDemoClaims(request, context);

    if (!approval) {
      response.status(404).json({ error: "approval_not_found" });
      return;
    }

    if (
      context.mode === "fixed" &&
      !canAccessOwnedResource(claims, approval.ownerId, approval.tenantId)
    ) {
      response.status(403).json({ error: "forbidden" });
      return;
    }

    if (context.mode === "fixed" && approval.approvalState !== "approved") {
      response.status(409).json({ error: "approval_required" });
      return;
    }

    const payment = {
      id: `payment-${context.store.payments.length + 1}`,
      userId: approval.ownerId,
      customerId: approval.ownerId,
      tenantId: approval.tenantId,
      amount: Number(request.body.amount ?? approval.amount),
      paymentStatus: "pending" as const,
      approvalId
    };
    context.store.payments.push(payment);
    response.status(201).json(payment);
  });

  app.get("/admin/payments/export", requireDemoAuth(context), (request, response) => {
    const claims = getDemoClaims(request, context);

    if (context.mode === "fixed" && !requireAnyRole(claims, ["admin"])) {
      response.status(403).json({ error: "forbidden" });
      return;
    }

    response.json({ payments: context.store.payments });
  });
}
