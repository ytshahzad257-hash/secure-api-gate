import type {
  ApiEndpoint,
  EndpointNormalizerInput,
  EndpointParameter,
  HttpMethod
} from "../types.js";

const HTTP_METHODS = new Set<HttpMethod>([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
  "TRACE"
]);

export function normalizeHttpMethod(method: string): HttpMethod {
  const normalized = method.trim().toUpperCase();

  if (!HTTP_METHODS.has(normalized as HttpMethod)) {
    throw new Error(`Unsupported HTTP method "${method}".`);
  }

  return normalized as HttpMethod;
}

export function normalizePathTemplate(inputPath: string): string {
  const trimmed = inputPath.trim();

  if (!trimmed) {
    throw new Error("Endpoint path cannot be empty.");
  }

  const withoutQuery = stripQueryAndHash(stripTemplateBaseUrl(stripBaseUrl(trimmed)));
  const withLeadingSlash = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, "/");
  const normalizedVariables = collapsed
    .replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, "{$1}")
    .replace(/\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}/g, "{$1}");

  if (normalizedVariables.length > 1 && normalizedVariables.endsWith("/")) {
    return normalizedVariables.slice(0, -1);
  }

  return normalizedVariables;
}

export function extractPathParameters(pathTemplate: string): EndpointParameter[] {
  const seen = new Set<string>();
  const parameters: EndpointParameter[] = [];
  const parameterPattern = /\{([^}/]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = parameterPattern.exec(pathTemplate)) !== null) {
    const name = match[1]?.trim();

    if (!name || seen.has(name)) {
      continue;
    }

    seen.add(name);
    parameters.push({
      name,
      in: "path",
      required: true,
      schemaType: "string"
    });
  }

  return parameters;
}

export function createRouteKey(method: HttpMethod, pathTemplate: string): string {
  return `${method} ${pathTemplate}`;
}

export function createEndpointId(method: HttpMethod, pathTemplate: string): string {
  const stablePath = pathTemplate
    .replace(/[{}]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  return stablePath ? `${method.toLowerCase()}_${stablePath}` : method.toLowerCase();
}

export function mergeEndpointParameters(
  explicitParameters: EndpointParameter[] = [],
  pathParameters: EndpointParameter[] = []
): EndpointParameter[] {
  const merged = new Map<string, EndpointParameter>();

  for (const parameter of [...pathParameters, ...explicitParameters]) {
    const key = `${parameter.in}:${parameter.name}`;
    const current = merged.get(key);

    merged.set(key, {
      ...current,
      ...parameter,
      required: current?.required || parameter.required
    });
  }

  return [...merged.values()].sort((left, right) => {
    if (left.in === right.in) {
      return left.name.localeCompare(right.name);
    }

    return parameterLocationRank(left.in) - parameterLocationRank(right.in);
  });
}

export function normalizeEndpoint(input: EndpointNormalizerInput): ApiEndpoint {
  const method = normalizeHttpMethod(input.method);
  const path = normalizePathTemplate(input.path);
  const routeKey = createRouteKey(method, path);
  const parameters = mergeEndpointParameters(input.parameters, extractPathParameters(path));

  return {
    id: createEndpointId(method, path),
    method,
    path,
    routeKey,
    operationId: input.operationId,
    summary: input.summary,
    description: input.description,
    tags: input.tags ?? [],
    parameters,
    requestBody: input.requestBody,
    responses: input.responses ?? [],
    security: input.security ?? [],
    deprecated: input.deprecated ?? false,
    source: input.source
  };
}

function stripBaseUrl(pathOrUrl: string): string {
  try {
    const parsed = new URL(pathOrUrl);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return pathOrUrl.replace(/^[A-Za-z][A-Za-z0-9+.-]*:\/\/[^/]+/, "");
  }
}

function stripTemplateBaseUrl(pathOrUrl: string): string {
  return pathOrUrl.replace(/^\{\{[A-Za-z_][A-Za-z0-9_]*\}\}/, "");
}

function stripQueryAndHash(path: string): string {
  const queryIndex = path.search(/[?#]/);
  return queryIndex >= 0 ? path.slice(0, queryIndex) : path;
}

function parameterLocationRank(location: EndpointParameter["in"]): number {
  const ranks: Record<EndpointParameter["in"], number> = {
    path: 0,
    query: 1,
    header: 2,
    cookie: 3,
    body: 4
  };

  return ranks[location];
}
