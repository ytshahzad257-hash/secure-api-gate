# Scanner Comparison Summary

Generated: 2026-05-03

## Scanner Tools Attempted

- OWASP ZAP baseline scan through Docker
- Schemathesis/OpenAPI scan through the `schemathesis` CLI

## Execution Status

| Tool | Executed | Reason |
| --- | --- | --- |
| OWASP ZAP baseline | No | Docker was not available. `docker --version` returned a command-not-recognized error. |
| Schemathesis | No | Schemathesis was not installed or available on `PATH`. `schemathesis --version` returned a command-not-recognized error. |

No public websites, third-party APIs, or real credentials were used. No scanner result was fabricated.

## Artifacts Generated

- `validation/06_scanner_comparison/zap/zap-not-executed.md`
- `validation/06_scanner_comparison/schemathesis/schemathesis-not-executed.md`
- `validation/06_scanner_comparison/comparison-table.md`
- `validation/06_scanner_comparison/scanner-comparison-summary.md`

No ZAP HTML, JSON, or Markdown scan reports were generated because ZAP did not run. No Schemathesis execution logs were generated because Schemathesis did not run.

## Key Differences From SecureAPI-Gate

SecureAPI-Gate is implemented as a policy-driven security regression gate. It uses OpenAPI/Postman parsing, a role matrix, fake local role tokens, ownership rules, workflow rules, and scenario fixtures to test expected authorization, session, object-level, workflow, mass-assignment, webhook, inventory, and error-leakage behavior.

ZAP and Schemathesis are complementary baseline tools. Depending on configuration, ZAP may check broader passive HTTP and web security conditions, while Schemathesis may check OpenAPI schema conformance, generated request robustness, and unexpected response behavior. Those scanner capabilities were not executed in this environment, so this package does not contain observed scanner findings.

## Manuscript-Safe Claims

- The scanner comparison was attempted only against the controlled local SecureAPI-Gate demo API.
- OWASP ZAP was not executed because Docker was unavailable in the validation environment.
- Schemathesis was not executed because the CLI was unavailable in the validation environment.
- SecureAPI-Gate evidence from earlier validation packages remains available for fixed and vulnerable local demo modes.
- The tools are complementary: ZAP/Schemathesis are baseline scanner candidates, while SecureAPI-Gate focuses on configured security regression expectations.

## Claims That Must Not Be Made

- Do not claim ZAP missed any SecureAPI-Gate finding; ZAP did not run.
- Do not claim Schemathesis missed any SecureAPI-Gate finding; Schemathesis did not run.
- Do not claim SecureAPI-Gate is better than ZAP or Schemathesis based on this package.
- Do not claim the vulnerable API was scanned by ZAP or Schemathesis in this validation.
- Do not claim absence of ZAP/Schemathesis findings.
- Do not generalize this local controlled demo into real-world scanner performance.

## Limitations

- Docker was not available, so OWASP ZAP baseline reports could not be generated.
- Schemathesis was not installed and was not force-installed during validation.
- The comparison table therefore records intended scanner scope and tool-availability outcomes, not executed scanner results.
- Any future manuscript comparison with ZAP or Schemathesis requires rerunning this validation in an environment where those tools are available and preserving their raw outputs.
- The only executed security regression evidence currently comes from SecureAPI-Gate against the local fixed and vulnerable demo API.
