import { describe, expect, it } from "vitest";
import {
  createEndpointId,
  extractPathParameters,
  normalizeEndpoint,
  normalizeHttpMethod,
  normalizePathTemplate
} from "../src/index.js";

describe("endpoint normalizer", () => {
  it("normalizes HTTP methods and rejects unsupported values", () => {
    expect(normalizeHttpMethod("get")).toBe("GET");
    expect(() => normalizeHttpMethod("connect")).toThrow(/Unsupported HTTP method/);
  });

  it("normalizes absolute URLs, Postman base URL variables, path variables, and query strings", () => {
    expect(normalizePathTemplate("https://api.example.test/v1/users/:id?expand=true")).toBe(
      "/v1/users/{id}"
    );
    expect(normalizePathTemplate("{{baseUrl}}/orders/:orderId/")).toBe("/orders/{orderId}");
  });

  it("extracts unique path parameters", () => {
    expect(extractPathParameters("/profiles/{id}/orders/{id}/{orderId}")).toEqual([
      {
        name: "id",
        in: "path",
        required: true,
        schemaType: "string"
      },
      {
        name: "orderId",
        in: "path",
        required: true,
        schemaType: "string"
      }
    ]);
  });

  it("creates deterministic endpoint identifiers", () => {
    expect(createEndpointId("GET", "/profiles/{id}")).toBe("get_profiles_id");
  });

  it("merges explicit and inferred path parameters", () => {
    const endpoint = normalizeEndpoint({
      method: "patch",
      path: "/tickets/:id",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schemaType: "uuid"
        },
        {
          name: "includeHistory",
          in: "query",
          required: false,
          schemaType: "boolean"
        }
      ],
      source: {
        format: "openapi"
      }
    });

    expect(endpoint.routeKey).toBe("PATCH /tickets/{id}");
    expect(endpoint.parameters).toEqual([
      {
        name: "id",
        in: "path",
        required: true,
        schemaType: "uuid"
      },
      {
        name: "includeHistory",
        in: "query",
        required: false,
        schemaType: "boolean"
      }
    ]);
  });
});
