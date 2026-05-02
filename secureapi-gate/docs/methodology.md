# Methodology

SecureAPI-Gate studies API security regressions as a CI/CD problem. The implemented artifact asks a practical question: given an API specification, role tokens, access-control policy, object ownership rules, workflow rules, and a risk threshold, can a pipeline generate repeatable evidence that indicates whether authorization and workflow behavior has drifted?

The current implementation is a local, controlled research artifact. It does not claim deployment on real companies, does not include external production data, and does not attempt general offensive automation.

## Research Motivation

Modern REST APIs change frequently. Access-control regressions can appear after feature releases, vulnerability fixes, policy refactors, AI-assisted code generation, or changes to role definitions. Manual regression testing often checks happy-path behavior but misses object-level authorization, function-level authorization, session state, workflow state, and exceptional-condition behavior.

SecureAPI-Gate treats those checks as structured CI evidence. A scan creates test cases from the API inventory and policy files, executes them, stores redacted request/response artifacts, scores the result, and returns a CI decision.

## Benchmark Design

The repository includes a local Express demo API under `examples/demo-api`. It has two modes:

- `vulnerable`: intentionally exposes safe local weaknesses for demonstration.
- `fixed`: applies ownership checks, stricter role checks, allowlisting, workflow validation, safer errors, protected internal routes, and webhook signature validation.

The demo API is not a real-world dataset. It is a controlled target for repeatable evaluation of the toolchain. Researchers can compare generated evidence between modes, but should not report those results as external prevalence or industry measurements.

## Input Artifacts

SecureAPI-Gate uses these inputs:

- `examples/specs/openapi.demo.yaml`: OpenAPI 3.x API inventory for the demo API.
- `examples/specs/postman.demo.json`: sample Postman collection parser fixture.
- `examples/configs/role-matrix.yml`: role token environment variables, ownership fields, sensitive fields, access rules, and workflow rules.
- `examples/configs/test-policy.yml`: enabled categories, severity overrides, CI threshold, redaction settings, timeout, retry count, and fail-fast behavior.
- `examples/configs/ownership-rules.yml`: ownership field model.
- `examples/configs/workflow-rules.yml`: workflow transition model.

The scanner can be pointed at other REST APIs when equivalent specifications, policies, role tokens, and permission to test are provided.

## Parsing Method

The OpenAPI parser supports OpenAPI 3.x documents. It validates the file through the OpenAPI parser dependency, then extracts title, version, servers, paths, methods, operation metadata, parameters, request bodies, responses, security schemes, deprecation flags, and warnings.

The Postman parser supports JSON collections. It flattens nested collection items, extracts request methods and URLs, normalizes Postman path variables, captures query and header parameters, records request body mode, and creates default response descriptors because Postman collections do not require response schemas.

The endpoint normalizer converts methods to uppercase, normalizes URL or path templates, strips query and hash components, converts `:id` and `{{id}}` style variables into `{id}`, extracts path parameters, creates route keys, and produces stable endpoint IDs.

## Policy-Driven Testing Method

Policy files are loaded from YAML and validated with Zod. Validation errors include readable field paths so configuration mistakes can be corrected before a scan runs.

The role matrix provides role names and token environment variables. The test policy selects enabled categories and can override scenario severity by scenario ID. Ownership and workflow rules describe the fields and state transitions that the generated tests should reason about.

The current generator uses deterministic scenario templates. It resolves endpoint paths from the parsed API inventory by exact fallback path or by path hints. It resolves actor roles from the configured role names and assigns standards mappings, severity, risk weight, and expected behavior.

## Scenario Generation Method

The default configuration generates 45 scenarios: five each for BOLA, BOPLA, BFLA, authentication, session misuse, workflow abuse, API inventory exposure, simulated third-party/webhook handling, and error leakage.

Each generated test contains:

- scenario ID such as `SAG-BOLA-001`
- category
- title and description
- endpoint and HTTP method
- actor role
- optional target resource owner label
- expected behavior and expected status
- severity and risk weight
- standards mapping
- test data such as path parameters, body fields, query fields, or scenario variants

## Execution Method

The runner builds HTTP requests from each generated test and the configured base URL. Role tokens are read from environment variables specified in `role-matrix.yml`. Requests and responses are redacted before evidence is written. The HTTP client supports configured timeout and retry count and normalizes network, timeout, and unexpected errors.

The assertion engine currently checks expected HTTP status and forbidden response body patterns. This makes results deterministic and easy to audit, but it is intentionally narrower than full semantic vulnerability detection.

## Evidence Generation Method

Each scan writes a reproducible evidence package:

- JSON evidence files in `evidence/json`
- CSV summary in `evidence/csv/results-summary.csv`
- HTML report in `evidence/html/report.html`

The JSON record is the primary scenario-level artifact. The CSV summary is designed for scoring, tables, and spreadsheet analysis. The HTML report and dashboard are human-readable views over the same evidence.

## Scoring Method

The score starts at 100. Failed scenarios deduct points by severity:

- critical: 15
- high: 10
- medium: 6
- low: 3

The score is capped at a minimum of 0. The CI decision is `PASS` when the score is equal to or greater than the configured threshold and `BLOCK` otherwise.

## Reproducibility Method

A reproducible run should record:

- repository commit or archive identifier
- Node.js and npm versions
- exact command sequence
- API mode and base URL
- specification and config files
- generated `evidence/` directory
- risk threshold
- CI decision

Use `docs/reproducibility-guide.md` for concrete command sequences.

## Current Artifact Boundary

The implemented artifact is sufficient to generate scenario evidence and evaluate the mechanics of a CI/CD security regression gate. It is not sufficient to claim real-world detection rates, generalized benchmark performance, or full coverage of API security vulnerabilities. Those claims require additional datasets, calibrated fixtures, semantic assertions, and external validation.
