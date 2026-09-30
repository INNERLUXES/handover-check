# Threat model

The tool reads a product's repository, which may hold code and settings that are not public, and prints findings that decide whether a handover goes ahead. The risks are a missed finding, a report that leaks what it found, and the tool reading or sending more than it was given.

| Threat | Response |
|---|---|
| A committed secret is missed | Common key and token formats and labelled passwords are matched; the limits of this are written in docs/limits.md. |
| The report spreads the secret it found | A finding names the file and the kind of secret, never the value. |
| A folder that was not read looks clean | Skipped folders and files too large to read are listed in every format. |
| A symbolic link leads the tool outside the folder | Links are not followed. |
| A very large file exhausts memory | Files over 1 MB are not read, and are listed. |
| A file name runs as a formula when the CSV is opened | Cells that start with a formula character are prefixed with an apostrophe. |
| The code leaves the machine | The tool opens no network connection and writes a file only when `--output` is given. |

## Outside this model

- The history of the repository, and access rights held outside it; docs/limits.md says why.
- A modified copy of the tool. Install from a release and check the attestation and checksums.
