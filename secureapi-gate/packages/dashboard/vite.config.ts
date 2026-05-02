import { readFile, stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), serveEvidencePlugin()]
});

function serveEvidencePlugin(): Plugin {
  const evidenceRoot = fileURLToPath(new URL("../../evidence/", import.meta.url));

  return {
    name: "secureapi-gate-evidence",
    configureServer(server) {
      server.middlewares.use(createEvidenceMiddleware(evidenceRoot));
    },
    configurePreviewServer(server) {
      server.middlewares.use(createEvidenceMiddleware(evidenceRoot));
    }
  };
}

function createEvidenceMiddleware(evidenceRoot: string) {
  return (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const pathname = getRequestPath(request.url);

    if (!pathname.startsWith("/evidence/")) {
      next();
      return;
    }

    void serveEvidenceFile(evidenceRoot, pathname, response);
  };
}

async function serveEvidenceFile(
  evidenceRoot: string,
  pathname: string,
  response: ServerResponse
): Promise<void> {
  const relativePath = pathname.slice("/evidence/".length);
  const resolvedPath = resolve(evidenceRoot, relativePath);

  if (!isInsideDirectory(evidenceRoot, resolvedPath)) {
    response.statusCode = 403;
    response.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(resolvedPath);

    if (!fileStat.isFile()) {
      response.statusCode = 404;
      response.end("Not found");
      return;
    }

    response.setHeader("content-type", contentTypeFor(resolvedPath));
    response.end(await readFile(resolvedPath));
  } catch {
    response.statusCode = 404;
    response.end("Not found");
  }
}

function getRequestPath(url: string | undefined): string {
  return new URL(url ?? "/", "http://localhost").pathname;
}

function isInsideDirectory(directory: string, target: string): boolean {
  const normalizedDirectory = resolve(directory);
  return target === normalizedDirectory || target.startsWith(`${normalizedDirectory}${sep}`);
}

function contentTypeFor(pathname: string): string {
  switch (extname(pathname)) {
    case ".csv":
      return "text/csv; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}
