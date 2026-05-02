import type { Express } from "express";
import type { DemoApiContext } from "../types.js";

const requiredSignature = "demo-signature";

export function registerWebhookRoutes(app: Express, context: DemoApiContext): void {
  app.post("/webhooks/payment", (request, response) => {
    const deliveryId = String(request.header("x-demo-delivery-id") ?? "missing-delivery-id");
    const signature = request.header("x-demo-signature");
    const paymentId = String(request.body.paymentId ?? "payment-user-1");
    const payment = context.store.payments.find((candidate) => candidate.id === paymentId);

    if (!payment) {
      response.status(404).json({ error: "payment_not_found" });
      return;
    }

    if (context.mode === "fixed") {
      if (signature !== requiredSignature) {
        response.status(401).json({ error: "invalid_webhook_signature" });
        return;
      }

      if (context.store.webhookDeliveries.has(deliveryId)) {
        response.status(409).json({ error: "webhook_replay_detected" });
        return;
      }

      if (request.body.tenantId && request.body.tenantId !== payment.tenantId) {
        response.status(403).json({ error: "tenant_mismatch" });
        return;
      }

      if (typeof request.body.paymentStatus !== "string") {
        response.status(400).json({ error: "malformed_webhook_payload" });
        return;
      }
    }

    context.store.webhookDeliveries.add(deliveryId);

    if (request.body.paymentStatus === "paid" || request.body.paymentStatus === "failed") {
      payment.paymentStatus = request.body.paymentStatus;
    }

    response.status(202).json({ accepted: true, payment });
  });

  app.post("/webhooks/payment/slow", (_request, response) => {
    setTimeout(() => {
      response.status(context.mode === "fixed" ? 504 : 202).json({
        error: context.mode === "fixed" ? "upstream_timeout" : undefined,
        accepted: context.mode === "vulnerable"
      });
    }, 100);
  });
}
