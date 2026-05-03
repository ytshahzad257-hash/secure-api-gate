# Evidence Artifact Audit

Generated: 2026-05-03T12:26:50.3100966+05:00

- Fixed JSON count: 45
- Vulnerable JSON count: 45
- Fixed CSV path: <PROJECT_ROOT>\validation\02_fixed_mode_scan\evidence-fixed\csv\results-summary.csv
- Vulnerable CSV path: <PROJECT_ROOT>\validation\03_vulnerable_mode_scan\evidence-vulnerable\csv\results-summary.csv
- Fixed HTML path: <PROJECT_ROOT>\validation\02_fixed_mode_scan\evidence-fixed\html\report.html
- Vulnerable HTML path: <PROJECT_ROOT>\validation\03_vulnerable_mode_scan\evidence-vulnerable\html\report.html

## Field Completeness Check
PASS: all evidence JSON files were checked for scenarioId, category, endpoint, expectedStatus, observedStatus, passed, severity, and standardsMapping.

### Missing Field Details
- None

## Redaction And Secrets Check
PASS: archived evidence was scanned for common secret patterns, Bearer token values, demo role token values, and demo webhook signature values. Header names such as x-demo-signature are allowed when their values are redacted.

### Secret Finding Details
- None

## Missing Evidence
- None
