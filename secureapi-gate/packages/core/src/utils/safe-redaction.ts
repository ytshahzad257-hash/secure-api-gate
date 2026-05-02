import type { RedactionConfig } from "../types.js";

const REDACTED = "[REDACTED]";
const DEFAULT_REDACTED_HEADERS = ["authorization", "cookie", "set-cookie", "x-api-key"];
const DEFAULT_REDACTED_BODY_FIELDS = ["token", "accessToken", "refreshToken", "password", "secret"];

export interface RedactionOptions {
  redaction?: Partial<RedactionConfig>;
}

export function redactHeaders(
  headers: Record<string, string | string[] | number | undefined>,
  options: RedactionOptions = {}
): Record<string, string> {
  const redactedHeaderNames = new Set(
    [...DEFAULT_REDACTED_HEADERS, ...(options.redaction?.headers ?? [])].map((header) =>
      header.toLowerCase()
    )
  );
  const redacted: Record<string, string> = {};

  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) {
      continue;
    }

    redacted[name] = redactedHeaderNames.has(name.toLowerCase())
      ? REDACTED
      : Array.isArray(value)
        ? value.join(", ")
        : String(value);
  }

  return redacted;
}

export function redactBody<T>(body: T, options: RedactionOptions = {}): T | string {
  if (body === undefined || body === null) {
    return body;
  }

  const redactedFieldNames = new Set(
    [...DEFAULT_REDACTED_BODY_FIELDS, ...(options.redaction?.bodyFields ?? [])].map((field) =>
      field.toLowerCase()
    )
  );

  return redactValue(body, redactedFieldNames) as T | string;
}

export function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);

    for (const key of [...parsed.searchParams.keys()]) {
      if (DEFAULT_REDACTED_BODY_FIELDS.includes(key) || key.toLowerCase().includes("token")) {
        parsed.searchParams.set(key, REDACTED);
      }
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

function redactValue(value: unknown, redactedFieldNames: Set<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, redactedFieldNames));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      redactedFieldNames.has(key.toLowerCase())
        ? REDACTED
        : redactValue(nestedValue, redactedFieldNames)
    ])
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
