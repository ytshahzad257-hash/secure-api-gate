# Experimental Design

This document describes a reproducible local experiment for evaluating SecureAPI-Gate as a CI/CD security regression gate. It intentionally avoids real-world company claims and fabricated benchmark results.

## Research Question

Can policy-driven security regression tests produce repeatable evidence and a CI/CD decision for REST API authorization, session, object-level, workflow, inventory, webhook, and error-handling drift?

## Subject System

The subject system is the local demo API under `examples/demo-api`. It includes:

- users
- profiles
- orders
- payments
- support tickets
- approval workflows
- admin inventory/version endpoints
- simulated payment webhook endpoints

The demo API supports:

- vulnerable mode
- fixed mode

Both modes use local fake tokens and in-memory seed data.

## Independent Variables

The main experimental variable is demo API mode:

- vulnerable mode: intended to expose safe local weaknesses
- fixed mode: intended to apply authorization and validation controls

Additional variables that can be controlled in future experiments:

- enabled scenario categories
- CI threshold
- severity overrides
- timeout and retry settings
- API specification quality
- object ownership fixture quality
- workflow state fixture quality

## Dependent Variables

Measured outputs are:

- generated scenario count
- pass count
- fail count
- SecureAPI risk score
- CI decision
- category breakdown
- failed critical/high scenario list
- generated JSON, CSV, and HTML evidence

## Procedure

Install and verify the repository:

```bash
npm ci
npm run build
npm run test
npm run lint
```

Run vulnerable mode in terminal 1:

```bash
npm run demo:api:vulnerable
```

Run the vulnerable scan in terminal 2:

```bash
npm run secureapi:scan:vulnerable
npm run secureapi:score
```

Archive or copy the generated `evidence/` directory if you want to compare runs.

Run fixed mode in terminal 1:

```bash
npm run demo:api:fixed
```

Run the fixed scan in terminal 2:

```bash
npm run secureapi:scan:fixed
npm run secureapi:score
```

Generate or refresh the report:

```bash
npm run secureapi:report
```

Open the dashboard:

```bash
npm run dashboard
```

## Evidence Package

The evidence package contains:

- `evidence/json/*.json`: scenario-level evidence
- `evidence/csv/results-summary.csv`: table-ready summary
- `evidence/html/report.html`: static report

The JSON files are best for audit and qualitative analysis. The CSV file is best for tables and quantitative summaries. The HTML report and dashboard are best for review meetings and portfolio demonstration.

## Analysis Plan

For each run, report:

- API mode
- scenario count
- score
- threshold
- CI decision
- failed categories
- failed critical/high scenarios
- any load or execution errors

Then compare vulnerable and fixed modes by category rather than only by overall score. This is important because a score of 0 can be produced by many failed high-severity scenarios, while a score near the threshold can still include individual failures worth reviewing.

## Current Implementation Caveat

The included demo fixtures are calibrated so vulnerable mode is expected to block and fixed mode is expected to pass the default threshold. This does not mean the tool is calibrated for arbitrary APIs. New targets still require project-specific role tokens, object IDs, workflow state fixtures, and expected-status review.

## Validity Considerations

Internal validity depends on:

- correct role tokens
- correct object IDs and state fixtures
- accurate expected statuses
- stable demo API seed data

External validity is limited because the included target is a local demo API. Generalization to real APIs requires additional case studies, permissions, representative specifications, and carefully reviewed policies.

Construct validity is limited because the score measures scenario conformance, not exploitability or business impact.

## Reporting Guidance

A research article should not claim:

- the tool was tested on real companies
- the tool detects all API vulnerabilities
- the demo results represent real-world prevalence
- standards mappings are compliance certification

A research article can claim:

- the artifact implements a policy-driven CI/CD regression gate
- the artifact generates repeatable evidence files
- the artifact maps scenarios to security categories and standards metadata
- the artifact provides a transparent scoring and blocking model
