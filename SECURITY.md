# Security

## Reporting a problem

Write to info@innerluxes.dev with the subject line "handover-check security", or use private vulnerability reporting on this repository. Please do not open a public issue for a vulnerability.

Include a small made-up repository that shows the problem, what you expected and what happened. Never send a real secret, even one you believe is revoked.

## Scope

In scope:

- a committed secret of a common kind that the tool does not report
- a folder that makes the tool hang, use unbounded memory, or follow a link outside the folder it was given
- a CSV report that runs as a formula when opened in a spreadsheet
- anything that makes the tool open a network connection, or write a file it was not asked to

Out of scope: whether the product actually runs, or whether the runbook is correct. docs/limits.md lists what a file-based check cannot see.

Read [docs/threat-model.md](docs/threat-model.md) for the rest.
