# Threat Model

SecureAPI-Gate models API security regressions that can be detected safely through authorized HTTP requests against a controlled target API. The project is designed for defensive validation in development, test, staging, or other explicitly approved environments.

## Assets

The modeled assets are:

- REST API endpoints and route inventory
- user, manager, and admin role boundaries
- object ownership boundaries such as `userId`, `ownerId`, and `customerId`
- tenant boundaries such as `tenantId`
- sensitive server-controlled fields such as `role`, `isAdmin`, `accountStatus`, `paymentStatus`, and `approvalState`
- workflow state machines such as approval transitions
- session and token state such as expiry, revocation, tenant binding, and subject binding
- error handling behavior
- generated evidence artifacts used in CI/CD decisions

## Adversary Model

The simulated actor is an authenticated or unauthenticated API client attempting to trigger regression-relevant behavior through ordinary HTTP requests. Scenarios include a normal user attempting another user's object, a normal user calling admin functionality, a stale or malformed token being reused, and a simulated third-party webhook caller sending unsafe callback data.

The model does not include malware, persistence, credential theft, network exploitation, exploit chains, denial-of-service, privilege escalation on hosts, evasion, or testing of systems without authorization.

## Trust Boundaries

SecureAPI-Gate checks behavior across these trust boundaries:

- anonymous client to authenticated endpoint
- user role to manager or admin endpoint
- user-owned object to another user's object
- tenant A token to tenant B object
- client-controlled request body to server-controlled fields
- workflow API to server-side state machine
- external webhook caller to internal payment state
- internal error details to external API response

## In Scope

The implemented scenarios cover:

- BOLA / IDOR-style object ownership checks
- BOPLA / mass assignment checks
- BFLA / role abuse checks
- broken authentication checks with fake demo token variants
- session misuse checks with fake revoked, stale, or mismatched token variants
- workflow transition abuse checks
- API inventory and internal route exposure checks
- simulated third-party webhook handling checks
- error leakage and exceptional-condition drift checks

## Out Of Scope

The current artifact does not attempt:

- real credential attacks
- brute force or password spraying
- exploit development
- fuzzing for memory corruption
- network scanning
- SSRF, SQL injection, XSS, or deserialization exploitation as primary goals
- production traffic capture
- testing of third-party systems without permission
- claims of complete OWASP API Top 10 coverage

## Assumptions

SecureAPI-Gate assumes:

- the tester has permission to test the target API
- the API base URL points to a safe environment
- role tokens are provided through environment variables and are not logged
- policy files reflect intended authorization behavior
- test data and ownership fixtures are valid for the target API
- the CI threshold is selected by the adopting team

## Safety Controls

The implementation includes several safety-oriented design choices:

- fake demo tokens in examples
- local-only demo API
- no destructive payloads
- request and response redaction
- configurable timeout and retry count
- deterministic scenario templates
- evidence written to local files for audit

## Residual Risks

A scan can still modify state if pointed at a mutable API because some scenarios use `PATCH` or `POST`. Teams should run SecureAPI-Gate against disposable test environments or seed data specifically prepared for security regression testing.

Misconfigured tokens, policies, or object IDs can produce false failures or false confidence. Evidence should be reviewed by engineers before being used as research data or deployment criteria.
