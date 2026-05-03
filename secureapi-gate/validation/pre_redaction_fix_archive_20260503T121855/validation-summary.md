# SecureAPI-Gate Validation Summary

Generated: 2026-05-03T12:11:56.7484429+05:00

| Validation | Commands run | Result | Evidence path | Limitation | Citable in manuscript |
| --- | --- | --- | --- | --- | --- |
| 1. Build/Test/Lint | ; ; ; ; ; ; ; npm ci; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; npm run build; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; npm run test; ; ; ; ; npm run lint; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; npm run format:check | FAIL | <PROJECT_ROOT>\validation\01_build_test_lint\build-test-lint-log.txt | Local environment and npm cache dependent. | Yes |
| 2. Fixed Mode Scan | npm run demo:api:fixed; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; npm run secureapi:scan:fixed; ; ; ; ; ; ; ; ; ; ; ; ; npm run secureapi:score; ; ; ; ; ; ; ; ; ; npm run secureapi:report | PASS | <PROJECT_ROOT>\validation\02_fixed_mode_scan\evidence-fixed | Local demo API only; not a real-world target. | Yes |
| 3. Vulnerable Mode Scan | npm run demo:api:vulnerable; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; npm run secureapi:scan:vulnerable; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; npm run secureapi:score; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; ; npm run secureapi:ci | PASS | <PROJECT_ROOT>\validation\03_vulnerable_mode_scan\evidence-vulnerable | BLOCK is expected; local vulnerable fixture only. | Yes |
| 4. CI Gate Validation | npm run dev -w @secureapi-gate/cli -- ci --summary ../../validation/02_fixed_mode_scan/evidence-fixed/csv/results-summary.csv --threshold 85; npm run dev -w @secureapi-gate/cli -- ci --summary ../../validation/03_vulnerable_mode_scan/evidence-vulnerable/csv/results-summary.csv --threshold 85 | PASS | <PROJECT_ROOT>\validation\04_ci_gate_validation | Vulnerable command exits 1 by design and is counted as expected PASS. | Yes |
| 5. Evidence Artifact Validation | JSON/CSV/HTML/file-field/redaction checks | FAIL | <PROJECT_ROOT>\validation\05_evidence_artifact_validation\evidence-artifact-audit.md | Checks artifact shape and obvious secret patterns, not full semantic correctness. | Yes |

## Notes
- Existing root evidence was copied before validation scans to avoid overwriting without archival.
- Preexisting evidence archive: <PROJECT_ROOT>\validation\preexisting_evidence_before_validation
- All API testing used the local demo API with fake demo tokens.
