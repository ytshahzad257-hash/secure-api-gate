import { readFile } from "node:fs/promises";
import SwaggerParser from "@apidevtools/swagger-parser";
import { parse as parseYaml } from "yaml";
import type {
  EndpointParameter,
  ParsedApiSpec,
  RequestBodyDescriptor,
  ResponseDescriptor
} from "../types.js";
import { normalizeEndpoint } from "./endpoint-normalizer.js";

const OPENAPI_OPERATION_METHODS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "trace"
]);

interface OpenApiDocument {
  openapi?: string;
  info?: {
    title?: string;
    version?: string;
  };
  servers?: Array<{
    url?: string;
  }>;
  paths?: Record<string, OpenApiPathItem>;
}

interface OpenApiPathItem {
  parameters?: unknown[];
  [method: string]: unknown;
}

interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: unknown[];
  requestBody?: unknown;
  responses?: Record<string, unknown>;
  security?: Array<Record<string, string[]>>;
  deprecated?: boolean;
}

export async function parseOpenApiFile(filePath: string): Promise<ParsedApiSpec> {
  const raw = await readFile(filePath, "utf8");
  const document = parseYaml(raw) as unknown;
  await SwaggerParser.validate(filePath);

  return parseOpenApiDocument(document, filePath);
}

export function parseOpenApiDocument(document: unknown, sourcePath?: string): ParsedApiSpec {
  const openApiDocument = assertOpenApiDocument(document);
  const warnings: string[] = [];
  const endpoints = [];

  for (const [path, pathItem] of Object.entries(openApiDocument.paths ?? {})) {
    if (!isRecord(pathItem)) {
      warnings.push(`Skipped non-object path item at ${path}.`);
      continue;
    }

    for (const [method, operationCandidate] of Object.entries(pathItem)) {
      if (!OPENAPI_OPERATION_METHODS.has(method)) {
        continue;
      }

      if (!isRecord(operationCandidate)) {
        warnings.push(`Skipped malformed ${method.toUpperCase()} operation at ${path}.`);
        continue;
      }

      const operation = operationCandidate as OpenApiOperation;
      const pathParameters = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
      const operationParameters = Array.isArray(operation.parameters) ? operation.parameters : [];

      endpoints.push(
        normalizeEndpoint({
          method,
          path,
          operationId: stringOrUndefined(operation.operationId),
          summary: stringOrUndefined(operation.summary),
          description: stringOrUndefined(operation.description),
          tags: Array.isArray(operation.tags) ? operation.tags.filter(isString) : [],
          parameters: parseOpenApiParameters([...pathParameters, ...operationParameters]),
          requestBody: parseOpenApiRequestBody(operation.requestBody),
          responses: parseOpenApiResponses(operation.responses),
          security: parseOpenApiSecurity(operation.security),
          deprecated: operation.deprecated === true,
          source: {
            format: "openapi",
            sourcePath
          }
        })
      );
    }
  }

  return {
    format: "openapi",
    title: openApiDocument.info?.title ?? "Untitled OpenAPI Specification",
    version: openApiDocument.info?.version,
    sourcePath,
    baseUrls: parseOpenApiServers(openApiDocument.servers),
    endpoints,
    warnings
  };
}

function assertOpenApiDocument(document: unknown): OpenApiDocument {
  if (!isRecord(document)) {
    throw new Error("OpenAPI document must be an object.");
  }

  const version = document.openapi;

  if (typeof version !== "string" || !version.startsWith("3.")) {
    throw new Error("Only OpenAPI 3.x specifications are supported.");
  }

  if (!isRecord(document.paths)) {
    throw new Error("OpenAPI document must include a paths object.");
  }

  return document as OpenApiDocument;
}

function parseOpenApiServers(servers: OpenApiDocument["servers"]): string[] {
  if (!Array.isArray(servers)) {
    return [];
  }

  return servers.map((server) => server.url).filter(isString);
}

function parseOpenApiParameters(parameters: unknown[]): EndpointParameter[] {
  return parameters.flatMap((parameter) => {
    if (!isRecord(parameter)) {
      return [];
    }

    const name = parameter.name;
    const location = parameter.in;

    if (!isString(name) || !isSupportedParameterLocation(location)) {
      return [];
    }

    return [
      {
        name,
        in: location,
        required: parameter.required === true || location === "path",
        description: stringOrUndefined(parameter.description),
        schemaType: readSchemaType(parameter.schema)
      }
    ];
  });
}

function parseOpenApiRequestBody(requestBody: unknown): RequestBodyDescriptor | undefined {
  if (!isRecord(requestBody)) {
    return undefined;
  }

  return {
    required: requestBody.required === true,
    contentTypes: readContentTypes(requestBody.content)
  };
}

function parseOpenApiResponses(responses: OpenApiOperation["responses"]): ResponseDescriptor[] {
  if (!isRecord(responses)) {
    return [];
  }

  return Object.entries(responses).flatMap(([statusCode, response]) => {
    if (!isRecord(response)) {
      return [];
    }

    return [
      {
        statusCode,
        description: stringOrUndefined(response.description),
        contentTypes: readContentTypes(response.content)
      }
    ];
  });
}

function parseOpenApiSecurity(security: OpenApiOperation["security"]): string[] {
  if (!Array.isArray(security)) {
    return [];
  }

  return security.flatMap((requirement) => {
    if (!isRecord(requirement)) {
      return [];
    }

    return Object.keys(requirement);
  });
}

function readContentTypes(content: unknown): string[] {
  if (!isRecord(content)) {
    return [];
  }

  return Object.keys(content).sort();
}

function readSchemaType(schema: unknown): string | undefined {
  if (!isRecord(schema)) {
    return undefined;
  }

  return stringOrUndefined(schema.type);
}

function isSupportedParameterLocation(value: unknown): value is EndpointParameter["in"] {
  return value === "path" || value === "query" || value === "header" || value === "cookie";
}

function stringOrUndefined(value: unknown): string | undefined {
  return isString(value) ? value : undefined;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
