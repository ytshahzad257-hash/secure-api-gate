# Future Work

SecureAPI-Gate has a working baseline for policy-driven API security regression evidence. The next improvements fall into engineering, research, and productization tracks.

## Runner And Scenario Execution

High-priority future work:

- support richer custom scenario variants beyond the included demo fixtures
- support per-scenario fixture configuration
- add multi-step setup and teardown flows
- support stateful workflow tests
- support webhook replay setup before replay assertions
- support current-role lookup or simulated role-change hooks
- compare paired responses for existence-oracle scenarios
- verify server-side state after mutating requests

These improvements would reduce false failures on new target APIs and make the gate more useful on real test environments.

## Specification And Schema Awareness

Future parser and generator improvements:

- use OpenAPI schemas to generate request bodies
- infer path parameter fixtures from config files
- support OpenAPI examples
- support Postman example responses
- detect undocumented endpoints when paired with traffic inventory
- enrich endpoint selection beyond path substring hints
- support multiple base URLs and server variables

## Policy Model

Potential policy extensions:

- explicit object fixture maps
- tenant fixture maps
- role hierarchy definitions
- expected status overrides per scenario
- per-endpoint scenario inclusion or exclusion
- richer workflow state models
- sensitive field allowlist/denylist per endpoint
- custom scenario definitions in YAML

## Assertions

Future assertion capabilities:

- JSONPath assertions
- schema assertions
- negative body assertions
- response equivalence checks
- state-diff assertions
- latency and timeout assertions
- custom assertion plugins
- baseline comparison between previous and current evidence

## Evidence And Reporting

Future evidence improvements:

- SARIF export for code-scanning integrations
- JUnit XML export for CI systems
- trend reports across commits
- signed evidence bundles
- deterministic timestamps for fixture tests
- dashboard import from archived evidence bundles
- severity and category filters in the dashboard
- report templates for academic tables

## CI/CD And DevSecOps Integration

Productization work:

- GitHub Action wrapper
- GitLab CI examples
- Azure DevOps examples
- threshold policies by branch
- evidence upload to artifact storage
- PR comments with score summaries
- Docker image publishing
- secure secret handling guidance for real role tokens

## Research Extensions

Research work should avoid unsupported claims and focus on measured artifact behavior. Possible studies:

- compare vulnerable and fixed local modes after fixture maturation
- evaluate false positives caused by incomplete policy files
- evaluate scenario generation quality across public toy APIs with permission
- study how policy completeness affects score stability
- compare evidence usability for developers and security reviewers
- measure CI runtime impact of different category sets

## Product Hardening

Before use as a real product, the tool would need:

- stronger configuration ergonomics
- robust fixture management
- plugin architecture for custom auth
- secret handling review
- concurrency controls
- rate limiting and safety controls
- clearer exit code contracts
- versioned evidence schemas
- documentation for onboarding real APIs

## Academic Artifact Improvements

For a stronger reproducibility package:

- pin toolchain versions in a container image
- include generated example evidence snapshots
- include fixture tests for evidence schema stability
- publish exact run scripts
- document known mismatches and expected failures
- add a results notebook that reads the CSV summary
- add a changelog for scenario taxonomy changes
