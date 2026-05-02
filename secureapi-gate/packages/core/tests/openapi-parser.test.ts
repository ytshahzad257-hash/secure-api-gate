import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseOpenApiDocument, parseOpenApiFile } from "../src/index.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../");

describe("OpenAPI parser", () => {
  it("parses OpenAPI 3.x documents into normalized endpoints", () => {
    const parsed = parseOpenApiDocument({
      openapi: "3.0.3",
      info: {
        title: "Parser Test API",
        version: "1.0.0"
      },
      servers: [{ url: "http://localhost:3000" }],
      paths: {
        "/profiles/{id}": {
          parameters: [
            {
              name: "tenantId",
              in: "header",
              required: true,
              schema: {
                type: "string"
              }
            }
          ],
          get: {
            operationId: "getProfile",
            summary: "Read profile",
            tags: ["profiles"],
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: {
                  type: "string"
                }
              }
            ],
            security: [{ bearerAuth: [] }],
            responses: {
              "200": {
                description: "Profile",
                content: {
                  "application/json": {}
                }
              },
              "403": {
                description: "Forbidden"
              }
            }
          },
          patch: {
            operationId: "updateProfile",
            requestBody: {
              required: true,
              content: {
                "application/json": {}
              }
            },
            responses: {
              "204": {
                description: "Updated"
              }
            }
          }
        }
      }
    });

    expect(parsed).toMatchObject({
      format: "openapi",
      title: "Parser Test API",
      version: "1.0.0",
      baseUrls: ["http://localhost:3000"],
      warnings: []
    });
    expect(parsed.endpoints).toHaveLength(2);
    expect(parsed.endpoints[0]).toMatchObject({
      id: "get_profiles_id",
      method: "GET",
      path: "/profiles/{id}",
      routeKey: "GET /profiles/{id}",
      operationId: "getProfile",
      summary: "Read profile",
      tags: ["profiles"],
      security: ["bearerAuth"],
      deprecated: false
    });
    expect(parsed.endpoints[0]?.parameters).toEqual([
      {
        name: "id",
        in: "path",
        required: true,
        schemaType: "string"
      },
      {
        name: "tenantId",
        in: "header",
        required: true,
        schemaType: "string"
      }
    ]);
    expect(parsed.endpoints[1]?.requestBody).toEqual({
      required: true,
      contentTypes: ["application/json"]
    });
  });

  it("parses the checked-in OpenAPI demo spec", async () => {
    const parsed = await parseOpenApiFile(
      resolve(repositoryRoot, "examples/specs/openapi.demo.yaml")
    );

    expect(parsed.title).toBe("SecureAPI-Gate Demo API");
    expect(parsed.endpoints.map((endpoint) => endpoint.routeKey)).toEqual(
      expect.arrayContaining([
        "GET /health",
        "GET /profiles/{id}",
        "PATCH /profiles/{id}",
        "GET /admin/inventory",
        "POST /webhooks/payment"
      ])
    );
  });

  it("rejects non-OpenAPI 3.x documents", () => {
    expect(() =>
      parseOpenApiDocument({
        swagger: "2.0",
        paths: {}
      })
    ).toThrow(/Only OpenAPI 3.x/);
  });
});
