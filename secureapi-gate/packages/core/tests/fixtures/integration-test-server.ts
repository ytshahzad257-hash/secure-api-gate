import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

export interface IntegrationTestServer {
  baseUrl: string;
  close: () => Promise<void>;
  counters: {
    unstableRequests: number;
  };
}

export async function createIntegrationTestServer(): Promise<IntegrationTestServer> {
  const counters = {
    unstableRequests: 0
  };
  const server = createServer((request, response) => {
    handleRequest(request, response, counters);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Unable to resolve integration test server address.");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => closeServer(server),
    counters
  };
}

function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  counters: IntegrationTestServer["counters"]
): void {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const authorization = request.headers.authorization;

  if (url.pathname === "/profiles/profile-owned-by-user-2") {
    if (authorization !== "Bearer user-token") {
      sendJson(response, 401, {
        error: "missing_or_invalid_token",
        token: "server-secret"
      });
      return;
    }

    sendJson(response, 403, {
      error: "forbidden",
      token: "server-secret",
      nested: {
        password: "server-password"
      }
    });
    return;
  }

  if (url.pathname === "/leaky") {
    sendJson(response, 403, {
      error: "forbidden",
      detail: "requiredRole admin"
    });
    return;
  }

  if (url.pathname === "/unstable") {
    counters.unstableRequests += 1;

    if (counters.unstableRequests === 1) {
      sendJson(response, 500, {
        error: "temporary_failure"
      });
      return;
    }

    sendJson(response, 403, {
      error: "forbidden"
    });
    return;
  }

  if (url.pathname === "/slow") {
    setTimeout(() => {
      sendJson(response, 403, {
        error: "slow_forbidden"
      });
    }, 150);
    return;
  }

  sendJson(response, 404, {
    error: "not_found"
  });
}

function sendJson(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.writeHead(status, {
    "content-type": "application/json",
    "x-demo-token": "server-response-token"
  });
  response.end(JSON.stringify(body));
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
