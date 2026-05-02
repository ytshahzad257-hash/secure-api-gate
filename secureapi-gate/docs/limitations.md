# Limitations

SecureAPI-Gate is a research-grade defensive artifact, but it is not a complete API security product. This document states the current boundaries honestly so results can be interpreted correctly.

## Local Demo Scope

The included demo API is local and controlled. It is useful for demonstrating the scanner pipeline, evidence generation, and CI gate behavior, but it is not a real-world benchmark dataset.

The project does not include:

- real company API data
- production API traffic
- real credentials
- external target testing
- vulnerability prevalence measurements

## No Complete Vulnerability Detection Claim

SecureAPI-Gate checks a specific set of security regression scenarios. It does not attempt to detect every API vulnerability. For example, it is not a full DAST scanner, fuzzing engine, exploit framework, SAST tool, or compliance certification tool.

Current coverage focuses on:

- object-level authorization
- property-level authorization and mass assignment
- function-level authorization
- authentication and session drift
- workflow transitions
- inventory exposure
- simulated webhook handling
- error leakage

Other vulnerability classes require additional modules and should not be inferred from a passing SecureAPI-Gate run.

## Specification Dependence

The parser relies on the supplied OpenAPI or Postman document. Missing endpoints, inaccurate methods, absent path parameters, stale operation definitions, or ambiguous Postman URLs can reduce scenario quality.

Endpoint resolution currently uses exact fallback path matching and path hints. If a target API uses unusual route naming or if a specification is incomplete, generated scenarios may target fallback routes or require manual tuning.

## Policy And Fixture Dependence

The tool depends on policy quality. A weak or inaccurate `role-matrix.yml`, `test-policy.yml`, ownership rule file, or workflow rule file can produce misleading evidence.

The runner also depends on valid fixture data. Object IDs, tenant IDs, workflow states, and expected status codes must match the target API. Otherwise, a failed scenario may indicate fixture mismatch rather than application vulnerability.

## Current Runner Limitation

The current runner builds single HTTP requests and checks expected status plus forbidden response patterns. The included demo scenario variants are materialized into concrete demo tokens, path parameters, headers, and request bodies, but custom APIs still require target-specific fixture calibration.

Stateful behaviors are represented in a limited way. For example, webhook replay uses seeded replay data and workflow checks use seeded approval states. A more general product would need configurable multi-step setup and teardown flows.

## Assertion Limitations

The assertion engine currently checks:

- expected HTTP status
- presence of forbidden response patterns
- normalized network or timeout errors

It does not yet perform deep semantic checks such as verifying that a sensitive field was ignored after a `200`, comparing two response bodies for existence oracle behavior, or validating server-side state after a workflow transition.

## State Management Limitations

Some categories naturally require multi-step setup:

- creating revoked or replayed sessions
- changing a role after token issuance
- preparing workflow state
- accepting a webhook before replay
- comparing unauthorized and missing objects

The current implementation represents these as scenario metadata or request variants, but full state orchestration remains future work.

## Standards Mapping Limitation

Standards mappings are traceability metadata. They do not establish OWASP ASVS compliance, NIST SSDF compliance, or complete OWASP API Security Top 10 coverage.

## CI/CD Limitation

The CI gate is intentionally strict: it exits non-zero when the score is below threshold. This is useful for regression control, but teams should calibrate thresholds, scenario applicability, and fixtures before using it on protected branches.

## Docker Verification Limitation

The Dockerfile and Compose file are implemented, but Docker was not available in the local audit environment. Compose syntax should be validated in a Docker-capable environment before publication or release.

## Research Validity Limitation

The artifact can support a research article about tool design, scenario taxonomy, evidence generation, and reproducible local evaluation. It cannot support claims about industry-wide vulnerability rates, detection accuracy on real systems, or production readiness without additional experiments.
