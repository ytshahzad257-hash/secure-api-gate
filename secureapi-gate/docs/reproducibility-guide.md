# Reproducibility Guide

This guide provides exact commands for rebuilding SecureAPI-Gate, running the local demo API, generating evidence, scoring evidence, viewing reports, and reproducing the CI gate locally.

The demo uses fake tokens and local seed data only.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Docker with Docker Compose, optional

Check versions:

```bash
node --version
npm --version
```

## Fresh Workspace Setup

```bash
npm ci
npm run build
npm run test
npm run lint
npm run format:check
```

## Validate Configuration

```bash
npm run dev -w @secureapi-gate/cli -- validate-config --config ../../examples/configs/role-matrix.yml
npm run dev -w @secureapi-gate/cli -- validate-config --config ../../examples/configs/test-policy.yml
npm run dev -w @secureapi-gate/cli -- validate-config --config ../../examples/configs/ownership-rules.yml
npm run dev -w @secureapi-gate/cli -- validate-config --config ../../examples/configs/workflow-rules.yml
```

## Vulnerable Mode Run

Terminal 1:

```bash
npm run demo:api:vulnerable
```

Terminal 2:

```bash
npm run secureapi:scan:vulnerable
npm run secureapi:score
npm run secureapi:report
```

The CI check may exit non-zero if the score is below threshold:

```bash
npm run secureapi:ci
```

## Fixed Mode Run

Terminal 1:

```bash
npm run demo:api:fixed
```

Terminal 2:

```bash
npm run secureapi:scan:fixed
npm run secureapi:score
npm run secureapi:report
```

Run the CI check:

```bash
npm run secureapi:ci
```

Current implementation note: with the included demo fixtures, fixed mode is expected to pass the default threshold. Preserve generated evidence with any reported result so reviewers can inspect the exact scenario outcomes.

## Evidence Locations

After a scan:

- `evidence/json/*.json`
- `evidence/csv/results-summary.csv`
- `evidence/html/report.html`

The CSV file is the input for `secureapi score` and `secureapi ci`. The dashboard uses both the CSV and JSON evidence.

## Dashboard

```bash
npm run dashboard
```

Open the Vite URL printed by the command. The dashboard displays:

- overall SecureAPI risk score
- pass/fail count
- category-wise failures
- endpoint risk table
- evidence viewer
- standards mapping coverage
- CI gate status

## Docker Compose Workflow

Copy the example environment if overrides are needed:

```bash
cp .env.example .env
```

Start the demo API and dashboard:

```bash
docker compose up --build demo-api dashboard
```

Run the scanner as a one-shot container:

```bash
docker compose --profile scan run --rm secureapi-scan
```

Demonstrate vulnerable mode with Compose:

```bash
SECUREAPI_DEMO_MODE=vulnerable docker compose --profile scan run --rm secureapi-scan
```

PowerShell equivalent:

```powershell
$env:SECUREAPI_DEMO_MODE="vulnerable"
docker compose --profile scan run --rm secureapi-scan
```

Docker was not available in the local audit environment, so Compose syntax should be validated in an environment with Docker installed before publication.

## CI Reproduction

The GitHub workflows perform:

1. Checkout.
2. `npm ci`.
3. `npm run build`.
4. `npm run test`.
5. Lint and format checks in the main CI workflow.
6. Start the demo API.
7. Run `secureapi scan`.
8. Upload `evidence/`.
9. Run `secureapi ci` with threshold `85` or the manually provided threshold.

To reproduce locally without GitHub Actions, run the npm workflow above and archive the `evidence/` directory.

## Research Reproduction Checklist

Record these details:

- repository commit or archive hash
- operating system
- Node.js and npm versions
- command sequence
- API mode
- base URL
- config files
- evidence directory
- score and threshold
- CI decision
- known limitations observed during the run
