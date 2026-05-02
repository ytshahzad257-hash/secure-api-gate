# Scenario Taxonomy

SecureAPI-Gate implements a deterministic taxonomy of API security regression scenarios. The taxonomy is designed for CI/CD evidence generation, not for exhaustive vulnerability discovery.

## Scenario ID Format

Scenario IDs use this format:

```text
SAG-<CATEGORY>-<NUMBER>
```

Examples include `SAG-BOLA-001`, `SAG-BOPLA-001`, `SAG-BFLA-001`, `SAG-AUTH-001`, `SAG-SESS-001`, `SAG-WFLOW-001`, `SAG-INV-001`, `SAG-3P-001`, and `SAG-ERR-001`.

The default generator creates 45 scenarios, five per category.

## Category Definitions

**BOLA** means Broken Object Level Authorization. In SecureAPI-Gate, BOLA scenarios check whether an actor can access or mutate an object owned by another user.

**BOPLA** means Broken Object Property Level Authorization. In this project, BOPLA scenarios focus on mass assignment or unsafe client control of sensitive fields.

**BFLA** means Broken Function Level Authorization. These scenarios check whether users or managers can access endpoints intended for higher-privilege roles.

**AUTH** means broken authentication drift. These scenarios check missing, expired, invalid, wrong-audience, and weak-claim demo token behavior.

**SESSION** means session or token misuse drift. These scenarios check revoked tokens, stale role state, tenant mismatch, subject mismatch, and replay after logout.

**WORKFLOW** means workflow state drift. These scenarios check whether state transitions are enforced by the server-side workflow model.

**INVENTORY** means API inventory or version exposure. These scenarios check whether internal, deprecated, debug, unlisted, or documentation endpoints are exposed unexpectedly.

**THIRD_PARTY** means unsafe simulated third-party API handling. These scenarios check webhook signature, replay, malformed payload, tenant mismatch, and timeout behavior.

**ERROR_LEAKAGE** means exceptional-condition drift. These scenarios check whether errors expose stack traces, internals, raw ORM details, authorization policy internals, or object existence signals.

## Scenario Table

| ID            | Category      | Scenario                                     | Expected Behavior                                 | Regression Meaning                       |
| ------------- | ------------- | -------------------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| SAG-BOLA-001  | BOLA          | User reads another user's profile            | Deny cross-user profile access                    | Ownership check removed or bypassed      |
| SAG-BOLA-002  | BOLA          | User reads another user's order              | Deny cross-owner order access                     | Order ownership drift                    |
| SAG-BOLA-003  | BOLA          | User reads another user's payment            | Deny cross-owner payment access                   | Payment object exposure                  |
| SAG-BOLA-004  | BOLA          | User modifies another user's ticket          | Deny cross-owner mutation                         | Ticket mutation authorization drift      |
| SAG-BOLA-005  | BOLA          | User approves another user's workflow object | Deny workflow transition on another user's object | Workflow ownership drift                 |
| SAG-BOPLA-001 | BOPLA         | User mass-assigns `role`                     | Reject or ignore server-controlled role field     | Privilege field can be client controlled |
| SAG-BOPLA-002 | BOPLA         | User mass-assigns `isAdmin`                  | Reject or ignore admin flag                       | Admin flag binding regression            |
| SAG-BOPLA-003 | BOPLA         | User mass-assigns `accountStatus`            | Reject account state mutation                     | Account lifecycle field exposed          |
| SAG-BOPLA-004 | BOPLA         | User injects `paymentStatus`                 | Reject hidden payment status field                | Payment state can be client controlled   |
| SAG-BOPLA-005 | BOPLA         | User modifies `approvalState` directly       | Reject workflow state field mutation              | Workflow state bypass                    |
| SAG-BFLA-001  | BFLA          | User calls admin users endpoint              | Return forbidden                                  | Admin function exposed to user           |
| SAG-BFLA-002  | BFLA          | User calls manager endpoint                  | Return forbidden                                  | Manager function exposed to user         |
| SAG-BFLA-003  | BFLA          | Manager calls admin inventory endpoint       | Return forbidden                                  | Admin-only function exposed to manager   |
| SAG-BFLA-004  | BFLA          | User lists all users                         | Return forbidden                                  | Account enumeration exposed              |
| SAG-BFLA-005  | BFLA          | User exports all payments                    | Return forbidden                                  | Bulk sensitive export exposed            |
| SAG-AUTH-001  | AUTH          | Missing token                                | Return unauthorized                               | Authentication requirement missing       |
| SAG-AUTH-002  | AUTH          | Expired token                                | Return unauthorized                               | Expiry validation drift                  |
| SAG-AUTH-003  | AUTH          | Invalid signature token                      | Return unauthorized                               | Signature validation drift               |
| SAG-AUTH-004  | AUTH          | Wrong audience token                         | Return unauthorized                               | Audience validation drift                |
| SAG-AUTH-005  | AUTH          | Weak demo claim token                        | Return unauthorized                               | Untrusted claim accepted                 |
| SAG-SESS-001  | SESSION       | Revoked token reuse                          | Return unauthorized                               | Revocation list or session state ignored |
| SAG-SESS-002  | SESSION       | Token after role change                      | Return forbidden                                  | Current role state not enforced          |
| SAG-SESS-003  | SESSION       | Different tenant token                       | Return forbidden                                  | Tenant binding drift                     |
| SAG-SESS-004  | SESSION       | Mismatched subject token                     | Return forbidden                                  | Subject binding drift                    |
| SAG-SESS-005  | SESSION       | Token replay after logout                    | Return unauthorized                               | Logout/session termination ignored       |
| SAG-WFLOW-001 | WORKFLOW      | Skip approval step                           | Return conflict                                   | Required state transition skipped        |
| SAG-WFLOW-002 | WORKFLOW      | Approve rejected request                     | Return conflict                                   | Terminal rejected state not enforced     |
| SAG-WFLOW-003 | WORKFLOW      | Submit payment before approval               | Return conflict                                   | Workflow precondition ignored            |
| SAG-WFLOW-004 | WORKFLOW      | Modify completed workflow                    | Return conflict                                   | Completed state remains mutable          |
| SAG-WFLOW-005 | WORKFLOW      | Replay workflow transition                   | Return conflict                                   | Transition replay not rejected           |
| SAG-INV-001   | INVENTORY     | Internal version endpoint exposed            | Return unauthorized                               | Internal metadata exposed                |
| SAG-INV-002   | INVENTORY     | Deprecated endpoint accessible               | Return not found                                  | Legacy endpoint remains reachable        |
| SAG-INV-003   | INVENTORY     | Debug route exposed                          | Return not found                                  | Debug surface in deployed API            |
| SAG-INV-004   | INVENTORY     | Unlisted admin endpoint accessible           | Return forbidden                                  | Hidden privileged endpoint exposed       |
| SAG-INV-005   | INVENTORY     | API description exposed                      | Return unauthorized                               | Documentation exposure not controlled    |
| SAG-3P-001    | THIRD_PARTY   | Webhook without signature                    | Return unauthorized                               | Callback trust boundary missing          |
| SAG-3P-002    | THIRD_PARTY   | Webhook replay                               | Return conflict                                   | Replay protection missing                |
| SAG-3P-003    | THIRD_PARTY   | Malformed external payload                   | Return bad request                                | Payload validation missing               |
| SAG-3P-004    | THIRD_PARTY   | Webhook tenant mismatch                      | Return forbidden                                  | Webhook tenant binding missing           |
| SAG-3P-005    | THIRD_PARTY   | Slow upstream behavior                       | Return gateway timeout                            | Timeout or fallback missing              |
| SAG-ERR-001   | ERROR_LEAKAGE | Stack trace leaked                           | Return sanitized bad request                      | Stack trace or exception details exposed |
| SAG-ERR-002   | ERROR_LEAKAGE | Internal object ID leaked                    | Return sanitized not found                        | Internal ID exposed                      |
| SAG-ERR-003   | ERROR_LEAKAGE | SQL/ORM error leaked                         | Return sanitized bad request                      | ORM or database details exposed          |
| SAG-ERR-004   | ERROR_LEAKAGE | Verbose authorization failure                | Return forbidden without policy details           | Authorization policy leaks               |
| SAG-ERR-005   | ERROR_LEAKAGE | Object existence oracle                      | Return indistinguishable denial/missing behavior  | Errors reveal object existence           |

## Regression Meaning

A failed scenario does not automatically prove a real exploitable vulnerability. It means the observed behavior did not match the configured expected behavior for that regression scenario. Security engineers should inspect the JSON evidence, confirm the test data and policy assumptions, and then decide whether the failure is a true regression, a fixture mismatch, or a scenario that requires project-specific tuning.

## Current Implementation Note

The included demo scenarios are materialized with local fixture IDs, fake demo tokens, webhook headers, and workflow request bodies. For other APIs, equivalent fixture calibration is still required so failures reflect target behavior rather than missing test data. This limitation is documented in `docs/limitations.md`.
