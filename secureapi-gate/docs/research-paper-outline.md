# Research Paper Outline

Title: **SecureAPI-Gate: A CI/CD Security Regression Gate for Detecting Authorization, Session, Object-Level, and Workflow Drift in REST APIs**

This outline is based on the implemented project. It is written as a guide for an academic cybersecurity article and should be paired with generated evidence, configuration files, and a clear limitations section.

## 1. Abstract

Summarize the problem of REST API security regressions in CI/CD. State that SecureAPI-Gate is a defensive tool that parses OpenAPI/Postman specifications, loads role and policy files, generates security regression scenarios, executes HTTP tests, writes evidence, calculates a risk score, and blocks deployments below threshold.

Include the scope: authorization, session handling, object ownership, workflow state, mass assignment, inventory exposure, simulated webhook handling, and error leakage. Avoid claiming real-world deployment or complete vulnerability detection.

## 2. Introduction

Introduce rapid API change, policy drift, and regression risk after fixes or feature updates. Explain why traditional unit tests and manual API tests often miss negative authorization paths.

Present SecureAPI-Gate as a CI/CD regression gate that converts policy expectations into reproducible evidence. State research goals: artifact construction, scenario taxonomy, scoring model, and reproducibility package.

## 3. Background

Define REST API specifications, OpenAPI, Postman collections, CI/CD gates, role-based access control, object-level authorization, function-level authorization, mass assignment, workflow state machines, session/token validation, webhook trust boundaries, and evidence-based security testing.

Briefly explain why authorization tests require roles, ownership data, and expected-denial behavior, not only endpoint discovery.

## 4. Related Work

Discuss categories of related tools and methods:

- API specification testing
- dynamic application security testing
- OWASP API Security Top 10 guidance
- policy-as-code
- CI security gates
- regression testing and security unit tests

Position SecureAPI-Gate as a focused research artifact for policy-driven API security regression evidence. Do not claim superiority without empirical comparison.

## 5. Problem Statement

State the problem: organizations need repeatable ways to detect authorization and workflow regressions before deployment, but API specifications alone do not encode all role, ownership, tenant, and workflow expectations.

Define inputs required by the implemented tool:

- API spec
- base URL
- role tokens
- access-control policy
- ownership rules
- workflow rules
- risk threshold

Define outputs:

- generated tests
- evidence files
- CSV summary
- HTML report
- dashboard view
- CI decision

## 6. SecureAPI-Gate Architecture

Describe the implemented packages:

- core parser and endpoint normalizer
- policy loader and Zod validators
- scenario generators
- HTTP runner and assertion engine
- evidence writers
- scoring model
- CLI
- dashboard
- demo API
- GitHub Actions and Docker Compose

Include the Mermaid architecture from the README or a refined version. Explain data flow from spec/config to evidence and CI gate.

## 7. Scenario Taxonomy

Use `docs/scenario-taxonomy.md` as the basis. Explain the nine categories:

- BOLA
- BOPLA
- BFLA
- AUTH
- SESSION
- WORKFLOW
- INVENTORY
- THIRD_PARTY
- ERROR_LEAKAGE

Provide the scenario table with IDs, expected behavior, and regression meaning. Explain that the default generator creates 45 scenarios.

## 8. Implementation

Describe implementation details based on the repository:

- Node.js and TypeScript workspaces
- Commander.js CLI
- OpenAPI parser and Postman parser
- YAML parsing and Zod validation
- Axios HTTP client
- timeout, retry, and redaction behavior
- deterministic scenario generation
- JSON/CSV/HTML evidence generation
- React + Vite dashboard
- Express demo API
- GitHub Actions and Docker Compose

Mention that assertions currently focus on expected status and forbidden response patterns.

## 9. Experimental Setup

Describe the local demo API subject system and both modes. List command sequences from `docs/reproducibility-guide.md`. State that all tokens are fake and all testing is local.

Define data collected:

- generated scenario count
- pass/fail counts
- score
- category breakdown
- failed critical/high scenarios
- evidence files

Do not include fabricated benchmark results.

## 10. Results

This section should be filled only after running the artifact and preserving evidence. Recommended tables:

- generated scenario counts by category
- vulnerable-mode pass/fail by category
- fixed-mode pass/fail by category
- score and CI decision by run
- selected evidence examples

If future target APIs produce failures from missing fixtures or policy mismatch, report that honestly as an artifact calibration issue rather than as a confirmed vulnerability.

## 11. Discussion

Discuss what evidence-based CI security gates can and cannot do. Explain the value of redacted evidence for code review, audit, and regression triage. Discuss false positives from fixture mismatch and false negatives from incomplete policies.

Address how the approach could be integrated into an organization's pipeline only after policies and test data are calibrated.

## 12. Threats To Validity

Internal validity threats:

- incomplete fixtures
- inaccurate expected statuses
- missing role tokens
- demo API implementation bugs

External validity threats:

- local demo target only
- no real-world company dataset
- limited API patterns
- no broad benchmark corpus

Construct validity threats:

- score measures scenario conformance, not exploitability
- standards mapping is traceability, not compliance

## 13. Reproducibility Package

List the package contents:

- source code
- demo API
- specs
- config files
- GitHub Actions workflows
- Docker Compose file
- generated evidence
- documentation

Include exact commands for reproduction and describe how to archive evidence for review.

## 14. Conclusion

Conclude that SecureAPI-Gate demonstrates a reusable, policy-driven CI/CD regression gate for REST API security behavior. Emphasize that the current artifact provides a scenario taxonomy, evidence model, scoring model, and reproducible local evaluation path. Identify future work needed before broad product or empirical claims.
