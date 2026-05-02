import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parsePostmanCollectionDocument, parsePostmanCollectionFile } from "../src/index.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../");

describe("Postman collection parser", () => {
  it("parses nested Postman collection items into normalized endpoints", () => {
    const parsed = parsePostmanCollectionDocument({
      info: {
        name: "Postman Parser Test",
        version: "1.2.3"
      },
      variable: [
        {
          key: "baseUrl",
          value: "http://localhost:3000"
        }
      ],
      item: [
        {
          name: "Profiles",
          item: [
            {
              name: "Read profile",
              request: {
                method: "GET",
                url: "{{baseUrl}}/profiles/:id?includeOrders=true",
                header: [
                  {
                    key: "Authorization"
                  }
                ]
              }
            },
            {
              name: "Create ticket",
              request: {
                method: "POST",
                url: {
                  raw: "https://api.example.test/tickets",
                  query: [
                    {
                      key: "notify"
                    }
                  ]
                },
                body: {
                  mode: "raw",
                  raw: "{}"
                }
              }
            }
          ]
        }
      ]
    });

    expect(parsed).toMatchObject({
      format: "postman",
      title: "Postman Parser Test",
      version: "1.2.3",
      baseUrls: ["http://localhost:3000"],
      warnings: []
    });
    expect(parsed.endpoints).toHaveLength(2);
    expect(parsed.endpoints[0]).toMatchObject({
      id: "get_profiles_id",
      method: "GET",
      path: "/profiles/{id}",
      routeKey: "GET /profiles/{id}",
      summary: "Read profile",
      responses: [
        {
          statusCode: "default",
          description: "Postman collections do not require response declarations.",
          contentTypes: []
        }
      ]
    });
    expect(parsed.endpoints[0]?.parameters).toEqual([
      {
        name: "id",
        in: "path",
        required: true,
        schemaType: "string"
      },
      {
        name: "Authorization",
        in: "header",
        required: true,
        schemaType: "string"
      }
    ]);
    expect(parsed.endpoints[1]).toMatchObject({
      id: "post_tickets",
      method: "POST",
      path: "/tickets",
      requestBody: {
        required: true,
        contentTypes: ["application/json"]
      }
    });
  });

  it("parses the checked-in Postman demo collection", async () => {
    const parsed = await parsePostmanCollectionFile(
      resolve(repositoryRoot, "examples/specs/postman.demo.json")
    );

    expect(parsed.title).toBe("SecureAPI-Gate Demo API");
    expect(parsed.endpoints.map((endpoint) => endpoint.routeKey)).toEqual(["GET /health"]);
  });

  it("reports malformed items as warnings", () => {
    const parsed = parsePostmanCollectionDocument({
      info: {
        name: "Malformed Collection"
      },
      item: [null]
    });

    expect(parsed.endpoints).toEqual([]);
    expect(parsed.warnings).toEqual(["Skipped malformed Postman item."]);
  });
});
