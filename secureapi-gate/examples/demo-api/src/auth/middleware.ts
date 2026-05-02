import type { NextFunction, Request, Response } from "express";
import type { DemoApiContext } from "../types.js";
import type { DemoTokenClaims } from "./jwt.js";
import { decodeDemoToken } from "./jwt.js";

export function getDemoClaims(request: Request, context: DemoApiContext): DemoTokenClaims | null {
  const token = request.header("authorization")?.replace(/^Bearer\s+/i, "");
  return decodeDemoToken(token, context.mode).claims;
}

export function requireDemoAuth(context: DemoApiContext) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const token = request.header("authorization")?.replace(/^Bearer\s+/i, "");
    const result = decodeDemoToken(token, context.mode);

    if (!result.claims) {
      response.status(401).json({ error: result.error ?? "invalid_demo_token" });
      return;
    }

    response.locals.claims = result.claims;
    next();
  };
}

export function requireAnyRole(
  claims: DemoTokenClaims | null,
  roles: DemoTokenClaims["role"][]
): boolean {
  return Boolean(claims && roles.includes(claims.role));
}

export function canAccessOwnedResource(
  claims: DemoTokenClaims | null,
  ownerId: string,
  tenantId: string
): boolean {
  if (!claims) {
    return false;
  }

  if (claims.role === "admin") {
    return true;
  }

  return claims.sub === ownerId && claims.tenantId === tenantId;
}
