import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { DemoApiMode } from "../src/types.js";

describe("SecureAPI-Gate demo API modes", () => {
  let server: Server | undefined;

  afterEach(async () => {
    if (server) {
      await closeServer(server);
      server = undefined;
    }
  });

  it("vulnerable mode allows cross-owner profile reads while fixed mode denies them", async () => {
    const vulnerable = await startDemoApi("vulnerable");
    server = vulnerable.server;
    const vulnerableResponse = await request(
      vulnerable.baseUrl,
      "/profiles/profile-owned-by-user-2"
    );

    expect(vulnerableResponse.status).toBe(200);
    expect(vulnerableResponse.body).toMatchObject({ ownerId: "user-2" });

    await closeServer(server);
    const fixed = await startDemoApi("fixed");
    server = fixed.server;
    const fixedResponse = await request(fixed.baseUrl, "/profiles/profile-owned-by-user-2");

    expect(fixedResponse.status).toBe(403);
    expect(fixedResponse.body).toEqual({ error: "forbidden" });
  });

  it("vulnerable mode accepts mass assignment while fixed mode rejects sensitive fields", async () => {
    const vulnerable = await startDemoApi("vulnerable");
    server = vulnerable.server;
    const vulnerableResponse = await request(vulnerable.baseUrl, "/profiles/profile-user-1", {
      method: "PATCH",
      body: {
        role: "admin",
        isAdmin: true
      }
    });

    expect(vulnerableResponse.status).toBe(200);
    expect(vulnerableResponse.body).toMatchObject({ role: "admin", isAdmin: true });

    await closeServer(server);
    const fixed = await startDemoApi("fixed");
    server = fixed.server;
    const fixedResponse = await request(fixed.baseUrl, "/profiles/profile-user-1", {
      method: "PATCH",
      body: {
        role: "admin",
        isAdmin: true
      }
    });

    expect(fixedResponse.status).toBe(400);
    expect(fixedResponse.body).toEqual({ error: "sensitive_field_rejected" });
  });

  it("fixed mode enforces role checks on admin inventory", async () => {
    const vulnerable = await startDemoApi("vulnerable");
    server = vulnerable.server;
    expect((await request(vulnerable.baseUrl, "/admin/inventory")).status).toBe(200);

    await closeServer(server);
    const fixed = await startDemoApi("fixed");
    server = fixed.server;
    expect((await request(fixed.baseUrl, "/admin/inventory")).status).toBe(403);
    expect(
      (await request(fixed.baseUrl, "/admin/inventory", { token: "demo-admin-token" })).status
    ).toBe(200);
  });

  it("fixed mode validates workflow transitions", async () => {
    const vulnerable = await startDemoApi("vulnerable");
    server = vulnerable.server;
    const vulnerableResponse = await request(
      vulnerable.baseUrl,
      "/approvals/approval-user-1/transition",
      {
        method: "POST",
        body: {
          transition: "paid"
        }
      }
    );

    expect(vulnerableResponse.status).toBe(200);
    expect(vulnerableResponse.body).toMatchObject({ approvalState: "paid" });

    await closeServer(server);
    const fixed = await startDemoApi("fixed");
    server = fixed.server;
    const fixedResponse = await request(fixed.baseUrl, "/approvals/approval-user-1/transition", {
      method: "POST",
      body: {
        transition: "paid"
      }
    });

    expect(fixedResponse.status).toBe(409);
    expect(fixedResponse.body).toEqual({ error: "invalid_workflow_transition" });
  });

  it("fixed mode protects internal version and webhook endpoints", async () => {
    const vulnerable = await startDemoApi("vulnerable");
    server = vulnerable.server;

    expect((await request(vulnerable.baseUrl, "/debug/version", { token: undefined })).status).toBe(
      200
    );
    expect(
      (
        await request(vulnerable.baseUrl, "/webhooks/payment", {
          token: undefined,
          method: "POST",
          body: {
            paymentId: "payment-user-1",
            paymentStatus: "paid"
          }
        })
      ).status
    ).toBe(202);

    await closeServer(server);
    const fixed = await startDemoApi("fixed");
    server = fixed.server;

    expect((await request(fixed.baseUrl, "/debug/version", { token: undefined })).status).toBe(401);
    expect(
      (
        await request(fixed.baseUrl, "/webhooks/payment", {
          token: undefined,
          method: "POST",
          body: {
            paymentId: "payment-user-1",
            paymentStatus: "paid"
          }
        })
      ).status
    ).toBe(401);
  });
});

async function startDemoApi(mode: DemoApiMode): Promise<{ server: Server; baseUrl: string }> {
  const app = createApp({ mode });
  const server = app.listen(0, "127.0.0.1");

  await new Promise<void>((resolve) => {
    server.once("listening", resolve);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Unable to start demo API test server.");
  }

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`
  };
}

async function request(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: Record<string, unknown>;
  } = {}
): Promise<{ status: number; body: unknown }> {
  const token = options.token === undefined ? "demo-user-token" : options.token;
  const headers: Record<string, string> = {
    "content-type": "application/json"
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  return {
    status: response.status,
    body: (await response.json()) as unknown
  };
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
