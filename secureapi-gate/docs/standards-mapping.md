# Standards Mapping

SecureAPI-Gate attaches standards mappings to each generated scenario. The mapping is used for evidence context and dashboard coverage views. It is not a certification claim and does not mean the tool fully verifies the referenced standard.

## Mapped Standards

The implemented scenario metadata references:

- OWASP API Security Top 10 2023
- OWASP Application Security Verification Standard (ASVS)
- NIST Secure Software Development Framework (SSDF)

The code stores these mappings in the scenario generator utilities and serializes them into JSON evidence and CSV summaries.

## Category Mapping

| SecureAPI-Gate Category | OWASP API Top 10 2023 | OWASP ASVS | NIST SSDF  |
| ----------------------- | --------------------- | ---------- | ---------- |
| BOLA                    | API1:2023, API5:2023  | V4, V5     | PW.7, RV.1 |
| BOPLA                   | API3:2023, API6:2023  | V4, V5     | PW.7, RV.1 |
| BFLA                    | API5:2023             | V4         | PW.7, RV.1 |
| AUTH                    | API2:2023             | V2, V3     | PW.7, RV.1 |
| SESSION                 | API2:2023, API5:2023  | V2, V3, V4 | PW.7, RV.1 |
| WORKFLOW                | API6:2023, API5:2023  | V4, V11    | PW.7, RV.1 |
| INVENTORY               | API9:2023, API8:2023  | V1, V14    | PO.5, RV.1 |
| THIRD_PARTY             | API10:2023            | V10, V13   | PW.7, RV.1 |
| ERROR_LEAKAGE           | API8:2023, API1:2023  | V7, V14    | RV.1, RV.3 |

## Scenario-Level Use

Each JSON evidence record includes:

```json
{
  "standardsMapping": {
    "OWASP_API_Top_10_2023": ["API1:2023", "API5:2023"],
    "OWASP_ASVS": ["V4", "V5"],
    "NIST_SSDF": ["PW.7", "RV.1"]
  }
}
```

The CSV summary flattens the standards into a semicolon-separated field for spreadsheet use.

## How To Interpret The Mapping

The mapping answers: "Which broad standard themes does this scenario relate to?"

It does not answer:

- whether the API complies with OWASP ASVS
- whether the organization complies with NIST SSDF
- whether all controls in a standard category were tested
- whether the scenario proves exploitability

For research writing, describe the mapping as traceability metadata for scenario interpretation, not as formal compliance evidence.

## Dashboard Coverage

The dashboard counts how many loaded evidence rows reference each standard identifier. This helps reviewers see whether a generated evidence package emphasizes object authorization, authentication, inventory, third-party handling, or error leakage. The count is coverage of generated scenarios, not coverage of every control requirement in the referenced standards.
