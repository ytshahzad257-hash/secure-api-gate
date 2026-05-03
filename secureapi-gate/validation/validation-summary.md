# SecureAPI-Gate Validation Summary

Generated: 2026-05-03T12:26:50.3360075+05:00

| Validation | Commands run | Result | Evidence path | Limitation | Citable in manuscript |
| --- | --- | --- | --- | --- | --- |
| 1. Build/Test/Lint | npm ci; npm run build; npm run test; npm run lint; npm run format:check | PASS | <PROJECT_ROOT>\validation\01_build_test_lint\build-test-lint-log.txt | Local Node/npm version and npm cache can affect install timing; generated validation artifacts are excluded from Prettier by .prettierignore. | Yes |
| 2. Fixed Mode Scan | npm run demo:api:fixed; npm run secureapi:scan:fixed; npm run secureapi:score; npm run secureapi:report | PASS | <PROJECT_ROOT>\validation\02_fixed_mode_scan\evidence-fixed | Controlled local fixed demo API only; not a real-world target. | Yes |
| 3. Vulnerable Mode Scan | npm run demo:api:vulnerable; npm run secureapi:scan:vulnerable; npm run secureapi:score; npm run secureapi:ci | PASS | <PROJECT_ROOT>\validation\03_vulnerable_mode_scan\evidence-vulnerable | BLOCK is expected; local vulnerable fixture only. | Yes |
| 4. CI Gate Validation | fixed archived summary CI check; vulnerable archived summary CI check | PASS | <PROJECT_ROOT>\validation\04_ci_gate_validation | Vulnerable command exits 1 by design and is counted as expected PASS when it blocks. | Yes |
| 5. Evidence Artifact Validation | JSON count, CSV/HTML existence, JSON field completeness, redaction/secrets scan | PASS | <PROJECT_ROOT>\validation\05_evidence_artifact_validation\evidence-artifact-audit.md | Checks artifact shape and obvious secret patterns, not full semantic correctness. | Yes |

## Notes
- Existing root evidence and first validation outputs were copied before rerunning validations.
- Pre-rerun archive: <PROJECT_ROOT>\validation\pre_redaction_fix_archive_20260503T121855
- Preexisting evidence archive from the first run remains under validation/preexisting_evidence_before_validation.
- A narrow redaction bug was fixed before the final rerun so webhook signature header values are redacted in evidence.
- All API testing used the local demo API with fake demo tokens.
- Transient rerun failure log: validation/03_vulnerable_mode_scan/vulnerable-mode-port-conflict-failure-log.txt.
- Manuscript validation integration was added in `manuscript/SecureAPI_Gate_Article.md` and documented in `manuscript/validation_added_change_report.md`.

