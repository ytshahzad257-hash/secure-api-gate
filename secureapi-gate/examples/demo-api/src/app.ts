import express from "express";
import { createSeedData } from "./data/seed-data.js";
import { registerApprovalRoutes } from "./routes/approvals.js";
import { registerInventoryRoutes } from "./routes/inventory.js";
import { registerOrderRoutes } from "./routes/orders.js";
import { registerPaymentRoutes } from "./routes/payments.js";
import { registerProfileRoutes } from "./routes/profiles.js";
import { registerTicketRoutes } from "./routes/tickets.js";
import { registerUserRoutes } from "./routes/users.js";
import { registerWebhookRoutes } from "./routes/webhooks.js";
import { registerFixedRoutes } from "./fixed/fixed-routes.js";
import { registerVulnerableRoutes } from "./vulnerable/vulnerable-routes.js";
import type { DemoApiContext } from "./types.js";

export interface DemoApiOptions {
  mode: "vulnerable" | "fixed";
}

export function createApp(options: DemoApiOptions) {
  const app = express();
  const context: DemoApiContext = {
    mode: options.mode,
    store: createSeedData()
  };

  app.use(express.json());
  app.get("/health", (_request, response) => {
    response.json({ ok: true, mode: options.mode });
  });

  registerUserRoutes(app, context);
  registerProfileRoutes(app, context);
  registerOrderRoutes(app, context);
  registerPaymentRoutes(app, context);
  registerTicketRoutes(app, context);
  registerApprovalRoutes(app, context);
  registerInventoryRoutes(app, context);
  registerWebhookRoutes(app, context);

  if (options.mode === "fixed") {
    registerFixedRoutes(app);
  } else {
    registerVulnerableRoutes(app);
  }

  return app;
}
