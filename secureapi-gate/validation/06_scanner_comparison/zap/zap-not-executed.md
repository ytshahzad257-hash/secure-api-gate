# OWASP ZAP Baseline Scan: Not Executed

Generated: 2026-05-03

## Intended Scope

- Target type: local SecureAPI-Gate demo API only
- Fixed-mode target: `http://localhost:3000`
- Vulnerable-mode target: `http://localhost:3000`
- Scanner intended: OWASP ZAP baseline scan through Docker
- Public or third-party targets: none

## Execution Status

OWASP ZAP was **not executed** because Docker is not available in this environment.

## Availability Check

Command attempted:

```powershell
docker --version
```

Observed result:

```text
docker : The term 'docker' is not recognized as the name of a cmdlet, function, script file, or operable program.
```

## Reason Results Are Absent

The requested ZAP workflow depends on Docker to run the ZAP container. Because the `docker` executable is not installed or not available on `PATH`, no ZAP container was started and no ZAP scan was run.

## Manuscript Use

This artifact may be cited only as an environment limitation and tool-availability record. It must not be used as evidence of ZAP findings, absence of ZAP findings, or comparative scanner effectiveness.
