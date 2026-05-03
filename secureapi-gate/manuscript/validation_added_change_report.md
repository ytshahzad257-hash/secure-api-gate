# Validation Added Change Report

Generated: 2026-05-03

## Sections Updated

Because no existing `manuscript/` directory or `SecureAPI_Gate_Article.docx` file was present in the repository, a new manuscript draft was created at `manuscript/SecureAPI_Gate_Article.md`.

The draft includes updates to:

- Abstract
- Contributions
- Methodology
- Validation Protocol
- Evaluation and Results
- Vulnerable vs Fixed Results
- Baseline Scanner Comparison
- Limitations
- Data and Code Availability
- References placeholders
- Final Checklist and Readiness Score

## Validations Integrated

- Validation 1: Build/Test/Lint validation from `validation/01_build_test_lint/build-test-lint-log.txt`
- Validation 2: Fixed-mode scenario validation from `validation/02_fixed_mode_scan/evidence-fixed`
- Validation 3: Vulnerable-mode blocking validation from `validation/03_vulnerable_mode_scan/evidence-vulnerable`
- Validation 4: CI gate validation from `validation/04_ci_gate_validation`
- Validation 5: Evidence artifact validation from `validation/05_evidence_artifact_validation/evidence-artifact-audit.md`
- Validation 6: Scanner comparison attempt from `validation/06_scanner_comparison`

## Scanner Comparison Status

The scanner comparison was documented but not executed:

- OWASP ZAP baseline was not executed because Docker was unavailable.
- Schemathesis was not executed because the `schemathesis` CLI was unavailable.

The manuscript therefore does not claim ZAP findings, Schemathesis findings, scanner misses, comparative scanner advantage, or absence of scanner findings.

## Claims Strengthened

- The project has archived build/test/lint evidence.
- The fixed local demo API produced 45 passing scenario records, score 100, and CI PASS.
- The vulnerable local demo API produced 8 passing and 37 failing scenario records, score 0, and CI BLOCK.
- The CI gate decision was reproduced from archived CSV summaries.
- The evidence artifact audit found required JSON fields present and no scanned token/signature value leaks.

## Claims Still Limited

- The evaluation is local and controlled.
- The demo API is not a production system.
- The vulnerable mode is a deliberately constructed fixture.
- The scanner comparison did not execute ZAP or Schemathesis.
- No commercial scanner comparison was performed.
- No expert validation was performed.
- No statistical significance can be claimed.

## Evidence Still Needed Before Strong Journal Submission

- Executed baseline scanner comparison in an environment with Docker/ZAP and Schemathesis available.
- Independent expert review of scenario taxonomy and policy assumptions.
- Additional APIs or controlled benchmark applications to support broader claims.
- Repeated runs or statistical treatment if making empirical performance claims.
- Clear external references for OWASP ZAP, Schemathesis, OWASP API Security Top 10, OWASP ASVS, and NIST SSDF.
- A final formatted manuscript in the target journal template.
