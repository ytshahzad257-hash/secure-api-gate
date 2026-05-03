# Schemathesis/OpenAPI Scan: Not Executed

Generated: 2026-05-03

## Intended Scope

- Target type: local SecureAPI-Gate demo API only
- OpenAPI input: `examples/specs/openapi.demo.yaml`
- Fixed-mode target: `http://localhost:3000`
- Vulnerable-mode target: `http://localhost:3000`
- Public or third-party targets: none

## Execution Status

Schemathesis was **not executed** because the `schemathesis` command is not available in this environment.

## Availability Check

Command attempted:

```powershell
schemathesis --version
```

Observed result:

```text
schemathesis : The term 'schemathesis' is not recognized as the name of a cmdlet, function, script file, or operable program.
```

## Reason Results Are Absent

Schemathesis is not a project dependency in the current Node.js workspace and is not installed on `PATH`. It was not installed during this validation because the requested rules said not to force installation unless project policy allows it.

## Manuscript Use

This artifact may be cited only as an environment limitation and tool-availability record. It must not be used as evidence of Schemathesis findings, absence of Schemathesis findings, or comparative scanner effectiveness.
