import { readFile } from "node:fs/promises";
import { z } from "zod";
import type {
  EndpointParameter,
  ParsedApiSpec,
  RequestBodyDescriptor,
  ResponseDescriptor
} from "../types.js";
import { normalizeEndpoint, normalizePathTemplate } from "./endpoint-normalizer.js";

const postmanVariableSchema = z.object({
  key: z.string(),
  value: z.unknown().optional()
});

const postmanCollectionSchema = z
  .object({
    info: z.object({
      name: z.string().optional(),
      version: z.union([z.string(), z.object({ string: z.string().optional() })]).optional()
    }),
    item: z.array(z.unknown()).optional(),
    variable: z.array(postmanVariableSchema).optional()
  })
  .passthrough();

interface PostmanItem {
  name?: unknown;
  item?: unknown;
  request?: unknown;
}

interface PostmanRequest {
  method?: unknown;
  url?: unknown;
  header?: unknown;
  body?: unknown;
  description?: unknown;
}

interface PostmanUrlObject {
  raw?: unknown;
  protocol?: unknown;
  host?: unknown;
  path?: unknown;
  query?: unknown;
  variable?: unknown;
}

export async function parsePostmanCollectionFile(filePath: string): Promise<ParsedApiSpec> {
  const raw = await readFile(filePath, "utf8");
  const document = JSON.parse(raw) as unknown;

  return parsePostmanCollectionDocument(document, filePath);
}

export function parsePostmanCollectionDocument(
  document: unknown,
  sourcePath?: string
): ParsedApiSpec {
  const collection = postmanCollectionSchema.parse(document);
  const warnings: string[] = [];
  const baseUrls = extractBaseUrls(collection.variable);
  const endpoints = flattenItems(collection.item ?? [], warnings).flatMap((item) => {
    const request = readRequest(item.request);

    if (!request) {
      return [];
    }

    const method = stringOrUndefined(request.method) ?? "GET";
    const parsedUrl = parsePostmanUrl(request.url);

    if (!parsedUrl.path) {
      warnings.push(
        `Skipped Postman item "${String(item.name ?? "Unnamed")}" because it has no URL.`
      );
      return [];
    }

    const title = stringOrUndefined(item.name);

    return [
      normalizeEndpoint({
        method,
        path: parsedUrl.path,
        summary: title,
        description: stringOrUndefined(request.description),
        parameters: [
          ...parsedUrl.pathParameters,
          ...parsedUrl.queryParameters,
          ...parsePostmanHeaders(request.header)
        ],
        requestBody: parsePostmanRequestBody(request.body),
        responses: defaultPostmanResponses(),
        source: {
          format: "postman",
          sourcePath,
          collectionItemName: title
        }
      })
    ];
  });

  return {
    format: "postman",
    title: collection.info.name ?? "Untitled Postman Collection",
    version: parsePostmanVersion(collection.info.version),
    sourcePath,
    baseUrls,
    endpoints,
    warnings
  };
}

function flattenItems(items: unknown[], warnings: string[]): PostmanItem[] {
  const flattened: PostmanItem[] = [];

  for (const item of items) {
    if (!isRecord(item)) {
      warnings.push("Skipped malformed Postman item.");
      continue;
    }

    const postmanItem = item as PostmanItem;

    if (Array.isArray(postmanItem.item)) {
      flattened.push(...flattenItems(postmanItem.item, warnings));
      continue;
    }

    flattened.push(postmanItem);
  }

  return flattened;
}

function readRequest(request: unknown): PostmanRequest | undefined {
  if (typeof request === "string") {
    return {
      method: "GET",
      url: request
    };
  }

  return isRecord(request) ? (request as PostmanRequest) : undefined;
}

function parsePostmanUrl(url: unknown): {
  path?: string;
  pathParameters: EndpointParameter[];
  queryParameters: EndpointParameter[];
} {
  if (typeof url === "string") {
    return {
      path: normalizePathTemplate(url),
      pathParameters: [],
      queryParameters: []
    };
  }

  if (!isRecord(url)) {
    return {
      pathParameters: [],
      queryParameters: []
    };
  }

  const postmanUrl = url as PostmanUrlObject;
  const raw = stringOrUndefined(postmanUrl.raw);
  const path = raw
    ? normalizePathTemplate(raw)
    : normalizePathTemplate(readUrlPathParts(postmanUrl.path));

  return {
    path,
    pathParameters: parsePostmanUrlVariables(postmanUrl.variable),
    queryParameters: parsePostmanQueryParameters(postmanUrl.query)
  };
}

function readUrlPathParts(path: PostmanUrlObject["path"]): string {
  if (Array.isArray(path)) {
    return `/${path.map((part) => String(part)).join("/")}`;
  }

  if (typeof path === "string") {
    return path;
  }

  return "/";
}

function parsePostmanUrlVariables(variables: unknown): EndpointParameter[] {
  if (!Array.isArray(variables)) {
    return [];
  }

  return variables.flatMap((variable) => {
    if (!isRecord(variable) || !isString(variable.key)) {
      return [];
    }

    return [
      {
        name: variable.key,
        in: "path",
        required: true,
        description: stringOrUndefined(variable.description),
        schemaType: "string"
      }
    ];
  });
}

function parsePostmanQueryParameters(query: unknown): EndpointParameter[] {
  if (!Array.isArray(query)) {
    return [];
  }

  return query.flatMap((parameter) => {
    if (!isRecord(parameter) || !isString(parameter.key)) {
      return [];
    }

    return [
      {
        name: parameter.key,
        in: "query",
        required: parameter.disabled !== true,
        description: stringOrUndefined(parameter.description),
        schemaType: "string"
      }
    ];
  });
}

function parsePostmanHeaders(headers: PostmanRequest["header"]): EndpointParameter[] {
  if (!Array.isArray(headers)) {
    return [];
  }

  return headers.flatMap((header) => {
    if (!isRecord(header) || !isString(header.key)) {
      return [];
    }

    return [
      {
        name: header.key,
        in: "header",
        required: header.disabled !== true,
        description: stringOrUndefined(header.description),
        schemaType: "string"
      }
    ];
  });
}

function parsePostmanRequestBody(body: PostmanRequest["body"]): RequestBodyDescriptor | undefined {
  if (!isRecord(body)) {
    return undefined;
  }

  const mode = stringOrUndefined(body.mode);

  if (mode === "raw") {
    return {
      required: true,
      contentTypes: ["application/json"]
    };
  }

  if (mode === "urlencoded") {
    return {
      required: true,
      contentTypes: ["application/x-www-form-urlencoded"]
    };
  }

  if (mode === "formdata") {
    return {
      required: true,
      contentTypes: ["multipart/form-data"]
    };
  }

  return {
    required: true,
    contentTypes: []
  };
}

function defaultPostmanResponses(): ResponseDescriptor[] {
  return [
    {
      statusCode: "default",
      description: "Postman collections do not require response declarations.",
      contentTypes: []
    }
  ];
}

function extractBaseUrls(
  variables: Array<z.infer<typeof postmanVariableSchema>> | undefined
): string[] {
  if (!variables) {
    return [];
  }

  return variables
    .filter((variable) => variable.key.toLowerCase() === "baseurl")
    .map((variable) => variable.value)
    .filter(isString);
}

function parsePostmanVersion(version: unknown): string | undefined {
  if (typeof version === "string") {
    return version;
  }

  if (isRecord(version)) {
    return stringOrUndefined(version.string);
  }

  return undefined;
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
