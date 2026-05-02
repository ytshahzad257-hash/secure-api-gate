# Scoring Model

SecureAPI-Gate uses a simple deterministic scoring model intended for CI/CD gating and research reproducibility. The model is intentionally transparent so reviewers can reproduce the score from the CSV summary.

## Formula

The score starts at 100:

```text
score = max(0, 100 - sum(deductions for failed scenarios))
```

Passed scenarios deduct 0 points. Failed scenarios deduct points based on severity:

| Severity | Deduction |
| -------- | --------: |
| critical |        15 |
| high     |        10 |
| medium   |         6 |
| low      |         3 |

The score is capped at a minimum of 0 and a maximum of 100.

## Inputs

The score can be calculated from either in-memory run results or the CSV summary. The CSV scoring path reads:

- `scenarioId`
- `category`
- `title`
- `passed`
- `severity`
- `riskWeight`

The CSV file also contains endpoint, method, actor role, observed status, standards, and recommendation fields for analysis, but the implemented score calculation only requires the fields above.

## CI Threshold

The threshold is configured in `test-policy.yml` for scans and can also be passed to the CI command:

```bash
npm run dev -w @secureapi-gate/cli -- ci --summary ../../evidence/csv/results-summary.csv --threshold 85
```

Decision logic:

```text
PASS  when score >= threshold
BLOCK when score < threshold
```

The root script uses threshold `85`:

```bash
npm run secureapi:ci
```

## Category Breakdown

The implementation also calculates category-level breakdowns. For each category, it reports:

- total scenarios
- passed scenarios
- failed scenarios
- total deductions
- category score using the same 100 minus deductions model

The dashboard displays this information for quick triage. The score is not weighted by category; category breakdown is diagnostic.

## Failed Critical/High Scenarios

The CLI prints failed critical and high scenarios as a priority list. This helps CI users distinguish a low-score run caused by many low-severity findings from a run that includes high-impact authorization failures.

## Interpretation

Suggested interpretation:

- `90-100`: low regression signal, assuming policy and fixtures are correct
- `85-89`: acceptable under the default threshold, but review failures if any exist
- `60-84`: elevated regression risk
- `1-59`: high regression risk
- `0`: severe mismatch or many failed scenarios

These bands are guidance only. The project does not claim calibrated probability of exploitation.

## Research Use

For research tables, report:

- threshold
- total scenarios
- passed and failed counts
- score
- category breakdown
- failed critical/high scenario IDs
- exact configuration files

Do not compare scores across unrelated APIs without explaining differences in policy, token roles, fixture quality, and scenario applicability.
