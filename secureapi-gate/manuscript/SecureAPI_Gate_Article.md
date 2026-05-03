# SecureAPI-Gate: A CI/CD Security Regression Gate for Detecting Authorization, Session, Object-Level, and Workflow Drift in REST APIs

## Abstract

SecureAPI-Gate is a local, policy-driven DevSecOps tool for detecting REST API security regressions before deployment. The tool parses API specifications, loads role and policy configuration, generates security regression scenarios, executes those scenarios against a configured target API, writes JSON/CSV/HTML evidence, calculates a risk score, and supports CI/CD blocking decisions. This manuscript reports a controlled validation package based on the local SecureAPI-Gate demo API, not production systems or third-party services. Five validation checks were archived: build/test/lint validation, fixed-mode scenario validation, vulnerable-mode blocking validation, CI gate validation, and evidence artifact validation. In fixed mode, the archived evidence contains 45 scenario records with 45 passing checks and a SecureAPI risk score of 100. In vulnerable mode, the archived evidence contains 45 scenario records with 8 passing checks, 37 failing checks, a risk score of 0, and a CI decision of BLOCK. The results support a narrow claim: SecureAPI-Gate can reproducibly exercise configured authorization, session, object-level, workflow, webhook, inventory, and error-leakage regression scenarios against a controlled local API. They do not establish production effectiveness, statistical significance, or superiority over general-purpose security scanners.

## 1. Introduction

REST API security regressions can appear after bug fixes, feature changes, policy updates, framework migrations, or AI-assisted code changes. Authorization, session handling, object ownership, workflow state, and request-body allowlisting are especially regression-prone because their expected behavior often depends on application-specific roles and business rules. Generic endpoint reachability or schema validation alone does not capture whether a user should be able to access another user's object, replay a workflow transition, or submit a payment before approval.

SecureAPI-Gate addresses this gap as a CI/CD security regression gate. It is designed to be reusable for REST APIs when supplied with an OpenAPI or Postman specification, base URL, role tokens, access-control policy, object ownership rules, workflow rules, and a risk threshold. The present validation uses only the local demo API included with the project. No public website, third-party API, real credential, or production deployment was tested.

## 2. Contributions

This work contributes:

- A reusable TypeScript toolchain that parses API specifications, loads policy configuration, generates security regression scenarios, runs local API checks, writes evidence, and computes a CI/CD risk decision.
- A scenario taxonomy covering BOLA, BOPLA, BFLA, broken authentication, session misuse, workflow abuse, API inventory exposure, unsafe simulated webhook handling, and error leakage.
- A reproducible validation package under `validation/` containing build/test/lint logs, fixed-mode evidence, vulnerable-mode blocking evidence, CI gate logs, and evidence artifact audit results.
- Archived fixed and vulnerable evidence sets with JSON, CSV, and HTML artifacts suitable for conversion into research tables.
- A CI gate validation showing PASS behavior for fixed evidence and expected BLOCK behavior for vulnerable evidence using the configured threshold.

Baseline scanner comparison was attempted as a complementary validation activity, but OWASP ZAP and Schemathesis were not executed in this environment because Docker and the Schemathesis CLI were unavailable. Therefore, scanner findings are not claimed as a contribution.

## 3. System Overview

SecureAPI-Gate consists of a core library, CLI, reporter, dashboard, and local demo API. The core library includes OpenAPI/Postman parsers, endpoint normalization, policy loading and validation, scenario generation, HTTP execution, assertions, token management, redaction, evidence writing, and scoring. The CLI exposes `init`, `validate-config`, `scan`, `report`, `score`, and `ci` commands. The demo API provides fixed and vulnerable modes for controlled local validation.

The tool's primary workflow is:

1. Parse an API specification.
2. Load role, policy, ownership, workflow, timeout, retry, and redaction configuration.
3. Generate regression scenarios from endpoint and policy information.
4. Execute generated scenarios against a target base URL.
5. Redact sensitive request and response content.
6. Write JSON evidence, CSV summaries, and HTML reports.
7. Calculate a SecureAPI risk score and CI/CD PASS or BLOCK decision.

## 4. Methodology

SecureAPI-Gate uses policy-driven testing rather than unauthenticated crawling alone. The validation configuration supplies fake local role tokens, role expectations, sensitive-field names, ownership fields, tenant fields, workflow transitions, timeout settings, retry settings, and redaction rules. Generated scenarios encode expected defensive behavior such as `403` for cross-user object access, `400` for mass-assignment attempts, `409` for invalid workflow transitions, and `401` for invalid or missing credentials.

### Validation Protocol

The validation protocol is archived under `validation/` and uses only the local demo API.

**Build/Test/Lint validation.** The project was validated with `npm ci`, `npm run build`, `npm run test`, `npm run lint`, and `npm run format:check`. The archived result is PASS.

**Fixed-mode scenario validation.** The fixed demo API was started with `npm run demo:api:fixed`. The scanner was run with `npm run secureapi:scan:fixed`, followed by `npm run secureapi:score` and `npm run secureapi:report`. The archived result is 45 passing scenarios, 0 failing scenarios, score 100, and CI decision PASS.

**Vulnerable-mode blocking validation.** The vulnerable demo API was started with `npm run demo:api:vulnerable`. The scanner was run with `npm run secureapi:scan:vulnerable`, followed by `npm run secureapi:score` and `npm run secureapi:ci`. The archived result is 8 passing scenarios, 37 failing scenarios, score 0, and CI decision BLOCK. The `secureapi:ci` command exits non-zero by design when the threshold is not met; this is interpreted as expected blocking behavior.

**CI gate validation.** The `ci` command was executed separately against the archived fixed and vulnerable CSV summaries. Fixed evidence produced PASS at threshold 85. Vulnerable evidence produced BLOCK at threshold 85.

**Evidence artifact validation.** The artifact audit counted JSON evidence files, checked CSV and HTML report existence, verified required JSON fields, and scanned archived evidence for common secret patterns, Bearer token values, demo role token values, and demo webhook signature values. The audit passed with 45 fixed JSON files and 45 vulnerable JSON files.

**Baseline scanner comparison.** OWASP ZAP and Schemathesis were checked as complementary baseline tools. They were not executed because Docker and the Schemathesis CLI were unavailable in the validation environment. The comparison package records this as non-execution rather than scanner results.

## 5. Evaluation and Results

### Table 1. Validation Evidence Summary

| Validation ID | Validation type | Command/tool used | Expected outcome | Observed outcome | Evidence path | Manuscript interpretation | Limitation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V1 | Build/Test/Lint | `npm ci`; `npm run build`; `npm run test`; `npm run lint`; `npm run format:check` | Dependencies install, TypeScript builds, tests pass, lint and formatting checks pass | PASS | `validation/01_build_test_lint/build-test-lint-log.txt` | The implementation is reproducible in the local Node/npm environment used for validation | Local environment and npm cache can affect install timing |
| V2 | Fixed-mode scenario validation | `npm run demo:api:fixed`; `npm run secureapi:scan:fixed`; `npm run secureapi:score`; `npm run secureapi:report` | Fixed API satisfies configured security regression expectations | PASS: 45 passed, 0 failed, score 100, CI decision PASS | `validation/02_fixed_mode_scan/evidence-fixed` | The fixed local demo mode conforms to the configured scenario expectations | Controlled local demo API only |
| V3 | Vulnerable-mode blocking validation | `npm run demo:api:vulnerable`; `npm run secureapi:scan:vulnerable`; `npm run secureapi:score`; `npm run secureapi:ci` | Vulnerable API produces failed evidence and CI BLOCK | PASS as blocking validation: 8 passed, 37 failed, score 0, CI decision BLOCK | `validation/03_vulnerable_mode_scan/evidence-vulnerable` | The tool can produce blocking regression evidence against the controlled vulnerable demo mode | Controlled local vulnerable fixture only |
| V4 | CI gate validation | CLI `ci` command against archived fixed and vulnerable CSV summaries | Fixed evidence passes threshold 85; vulnerable evidence blocks below threshold 85 | PASS: fixed PASS, vulnerable BLOCK | `validation/04_ci_gate_validation` | The CI gate decision is reproducible from archived CSV summaries | Does not prove behavior in every CI provider |
| V5 | Evidence artifact validation | JSON count, CSV/HTML existence, JSON field completeness, redaction/secrets audit | Evidence files exist, required fields are present, no obvious secret/token values are exposed | PASS: 45 fixed JSON files, 45 vulnerable JSON files, required fields present, no secret finding details | `validation/05_evidence_artifact_validation/evidence-artifact-audit.md` | The archived evidence is structured enough for research tables and redacts tested token/signature values | Secret scan checks common patterns, not full enterprise DLP |
| V6 | Baseline scanner comparison | `docker --version`; `schemathesis --version` | If available, run ZAP and Schemathesis against localhost only; if unavailable, document non-execution | Not executed: Docker unavailable, Schemathesis unavailable | `validation/06_scanner_comparison` | Scanner comparison is documented as an environment-limited complementary baseline attempt | No ZAP or Schemathesis findings exist in this package |

### Vulnerable vs Fixed Results

| Mode | Scenario count | Passed | Failed | Score | CI decision | Evidence path | Interpretation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Fixed local demo API | 45 | 45 | 0 | 100 | PASS | `validation/02_fixed_mode_scan/evidence-fixed` | The fixed mode satisfied all configured regression expectations in the controlled local scenario set |
| Vulnerable local demo API | 45 | 8 | 37 | 0 | BLOCK | `validation/03_vulnerable_mode_scan/evidence-vulnerable` | The vulnerable mode produced blocking evidence across configured authorization, object-level, workflow, inventory, webhook, and error-leakage scenarios |

The vulnerable-mode result should be interpreted as controlled benchmark evidence. It does not imply prevalence in real systems or general vulnerability detection performance.

### Baseline Scanner Comparison

Scanner comparison was used as a complementary baseline, not as a superiority benchmark. The attempted scanner validation did not execute ZAP or Schemathesis because the required executables were unavailable. Therefore, the manuscript cannot claim comparative scanner advantage, replacement of these tools, or findings missed by these tools.

| Tool | Target | Input | Output artifact | Findings summary | Overlap with SecureAPI-Gate | Difference from SecureAPI-Gate | Limitation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OWASP ZAP baseline | Intended fixed and vulnerable local demo API at `http://localhost:3000` | Intended URL-only baseline scan | `validation/06_scanner_comparison/zap/zap-not-executed.md` | Not executed; Docker was unavailable | Intended to provide a general baseline web/API scan, but no overlap was observed because no scan ran | ZAP may check broader HTTP, passive security, cookie, header, and configuration issues depending on configuration | No ZAP report was generated |
| Schemathesis | Intended fixed and vulnerable local demo API at `http://localhost:3000` | Intended OpenAPI spec `examples/specs/openapi.demo.yaml` | `validation/06_scanner_comparison/schemathesis/schemathesis-not-executed.md` | Not executed; Schemathesis CLI was unavailable | Intended to provide OpenAPI-driven generated request/schema checks, but no overlap was observed because no scan ran | Schemathesis may check schema conformance, unexpected status codes, response validation, and robustness depending on settings | No Schemathesis log was generated |
| SecureAPI-Gate | Fixed and vulnerable local demo API | OpenAPI demo spec, role matrix, policy, ownership/workflow rules, fake local role tokens | `validation/02_fixed_mode_scan/evidence-fixed`; `validation/03_vulnerable_mode_scan/evidence-vulnerable` | Executed: fixed PASS with score 100; vulnerable BLOCK with score 0 | Directly tests configured role, ownership, session, workflow, webhook, inventory, and error-leakage expectations | Does not replace baseline scanners for broad HTTP/configuration/schema exploration | Controlled local demo only |

## 6. Discussion

The validation package strengthens the artifact claim that SecureAPI-Gate is reproducible and evidence-producing in a controlled local setting. The fixed/vulnerable contrast is especially useful for research exposition because the same tool, policy inputs, and scenario set produce a clean PASS in fixed mode and a BLOCK in vulnerable mode. The evidence also records expected CI behavior from archived CSV summaries, which supports discussion of the tool as a regression gate rather than only a manual scanner.

The validation does not establish general effectiveness against real-world APIs. The scenario set is curated and policy-driven, so coverage depends on the quality of the API specification, role tokens, role matrix, ownership rules, workflow rules, and expected statuses. The scanner comparison currently contributes only an availability and non-execution record, not empirical scanner findings.

## 7. Limitations

The current evidence has the following limitations:

- All API validation used the controlled local SecureAPI-Gate demo API.
- No production API, public website, third-party API, customer system, or real credential was used.
- Scanner comparison is limited to local intended scope and did not execute because Docker and Schemathesis were unavailable.
- No commercial scanner comparison was performed.
- No expert validation, user study, or independent reviewer assessment was performed.
- No statistical significance claim can be made because the evaluation uses one controlled demo API in two modes.
- The evidence artifact audit checks common secret/token patterns and required fields; it is not a full data-loss-prevention or formal privacy audit.
- The vulnerable mode is an intentionally controlled fixture and should not be treated as a real-world vulnerability prevalence dataset.
- SecureAPI-Gate does not detect all vulnerabilities; it verifies configured regression expectations and scenario classes.

## 8. Data and Code Availability

The repository remote configured for this project is:

`https://github.com/ytshahzad257-hash/secure-api-gate.git`

Validation artifacts are archived under:

- `validation/validation-summary.md`
- `validation/01_build_test_lint/build-test-lint-log.txt`
- `validation/02_fixed_mode_scan/evidence-fixed`
- `validation/03_vulnerable_mode_scan/evidence-vulnerable`
- `validation/04_ci_gate_validation`
- `validation/05_evidence_artifact_validation/evidence-artifact-audit.md`
- `validation/06_scanner_comparison`

Primary generated evidence paths include:

- Fixed JSON evidence: `validation/02_fixed_mode_scan/evidence-fixed/json`
- Fixed CSV summary: `validation/02_fixed_mode_scan/evidence-fixed/csv/results-summary.csv`
- Fixed HTML report: `validation/02_fixed_mode_scan/evidence-fixed/html/report.html`
- Vulnerable JSON evidence: `validation/03_vulnerable_mode_scan/evidence-vulnerable/json`
- Vulnerable CSV summary: `validation/03_vulnerable_mode_scan/evidence-vulnerable/csv/results-summary.csv`
- Vulnerable HTML report: `validation/03_vulnerable_mode_scan/evidence-vulnerable/html/report.html`

## 9. References

No new bibliographic citations are invented in this manuscript revision. If the scanner-comparison section is retained in a submitted version, add verified official references:

- [REF: OWASP ZAP official documentation]
- [REF: Schemathesis official documentation]

## 10. Final Checklist and Readiness Score

| Item | Current status |
| --- | --- |
| Reproducible local build/test/lint evidence | Present |
| Fixed-mode scenario evidence | Present |
| Vulnerable-mode blocking evidence | Present |
| CI gate validation evidence | Present |
| Evidence artifact completeness/redaction audit | Present |
| Baseline scanner executed results | Not present |
| Production API validation | Not present |
| Commercial scanner comparison | Not present |
| Expert validation | Not present |
| Statistical significance analysis | Not present |

Journal-readiness score after adding validation evidence: **72/100**.

This score reflects a stronger reproducible artifact package and clearer local evaluation, while preserving the main remaining gaps: no production deployment, no executed baseline scanner comparison, no independent expert validation, and no statistically powered study.
