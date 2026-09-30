# 2. Not read is never reported as ok

## Context

A handover check that skips `node_modules` or a 200 MB database dump is sensible. A report that then says "secrets: ok" is not, because part of the repository was never looked at.

## Decision

- Every folder skipped and every file too large to read is listed, in every format, under "not read".
- A check left out with `--skip` is listed as "not checked".

## Consequences

- A report can be longer than the reader would like. That is the price of a clean result meaning what it says.
