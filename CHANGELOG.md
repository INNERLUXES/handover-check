# Changes

## 1.0.0

First release.

- Nine checks on a repository folder: how to run it, settings files, lock files, tests, build pipeline, runbook, environment as code, committed secrets and written decisions.
- Installed and built folders (node_modules, vendor, dist and similar) are skipped and listed; files over 1 MB are listed as not read for secrets.
- A secret is reported by file and kind, never repeated in the report.
- Reports as text, Markdown, JSON and CSV; `--fail-on problem|warning` for use in a pipeline.
- Release packages come with a CycloneDX SBOM, SHA-256 checksums and a build provenance attestation.
