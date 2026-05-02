import type { DemoApiMode } from "../types.js";

export interface DemoTokenClaims {
  sub: string;
  role: "user" | "manager" | "admin";
  tenantId: string;
}

export interface DemoTokenResult {
  claims: DemoTokenClaims | null;
  error?: string;
}

export function decodeDemoToken(
  token: string | undefined,
  mode: DemoApiMode = "fixed"
): DemoTokenResult {
  if (!token) {
    return {
      claims: null,
      error: "missing_demo_token"
    };
  }

  if (token === "demo-expired-token") {
    return {
      claims: null,
      error: "expired_demo_token"
    };
  }

  if (token === "demo-revoked-token") {
    return {
      claims: null,
      error: "revoked_demo_token"
    };
  }

  if (token === "demo-invalid-signature-token") {
    return {
      claims: null,
      error: "invalid_demo_signature"
    };
  }

  if (token === "demo-wrong-audience-token") {
    return {
      claims: null,
      error: "wrong_demo_audience"
    };
  }

  if (token === "demo-weak-claim-token" && mode === "fixed") {
    return {
      claims: null,
      error: "weak_demo_claim"
    };
  }

  if (token === "demo-weak-claim-token") {
    return {
      claims: { sub: "user-1", role: "user", tenantId: "tenant-a" }
    };
  }

  if (token === "demo-admin-token" || token.includes("admin")) {
    return {
      claims: { sub: "admin-1", role: "admin", tenantId: "tenant-a" }
    };
  }

  if (token === "demo-manager-token" || token.includes("manager")) {
    return {
      claims: { sub: "manager-1", role: "manager", tenantId: "tenant-a" }
    };
  }

  if (token === "demo-tenant-b-token") {
    return {
      claims: { sub: "tenant-b-user-1", role: "user", tenantId: "tenant-b" }
    };
  }

  if (token === "demo-user-token" || token.includes("user")) {
    return {
      claims: { sub: "user-1", role: "user", tenantId: "tenant-a" }
    };
  }

  return {
    claims: null,
    error: "unrecognized_demo_token"
  };
}
