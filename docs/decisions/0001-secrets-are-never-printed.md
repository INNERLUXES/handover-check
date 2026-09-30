# 1. Secrets are never printed

## Context

A tool that finds a secret is tempted to show it, so the reader can confirm the match. But a handover report is read by more people than the repository: the buyer, the new team, sometimes an investor's advisers. Printing the secret spreads it to all of them.

## Decision

- A finding names the file and the kind of secret ("looks like a GitHub token"), never the value or the line.
- The advice is always the same: rotate it and remove it from the history, because a copy of the repository may already exist elsewhere.

## Consequences

- To see the match, the reader opens the file in the repository they already have access to.
