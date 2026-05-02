import type { TokenManagerOptions } from "../types.js";

export class TokenManager {
  private readonly env: Record<string, string | undefined>;
  private readonly staticTokens: Record<string, string>;
  private readonly roleTokenEnv: Record<string, string>;

  constructor(options: TokenManagerOptions = {}) {
    this.env = options.env ?? process.env;
    this.staticTokens = options.staticTokens ?? {};
    this.roleTokenEnv = Object.fromEntries(
      Object.entries(options.roleMatrix?.roles ?? {}).map(([role, config]) => [
        role,
        config.tokenEnv
      ])
    );
  }

  getTokenForRole(role: string): string | undefined {
    if (role === "anonymous" || role === "external-service") {
      return undefined;
    }

    const staticToken = this.staticTokens[role];

    if (staticToken) {
      return staticToken;
    }

    const tokenEnv = this.roleTokenEnv[role];

    if (!tokenEnv) {
      return undefined;
    }

    return this.env[tokenEnv];
  }

  getAuthorizationHeader(role: string): string | undefined {
    const token = this.getTokenForRole(role);
    return token ? `Bearer ${token}` : undefined;
  }
}
