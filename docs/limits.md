# What a file check cannot see

- **Whether the product runs.** A README with a setup section can still be wrong. Follow it on a clean machine before a handover.
- **Whether the runbook is right.** The check finds a runbook by its name, not by its content.
- **Secrets outside the patterns.** The tool knows common kinds of keys and tokens. A password with no label, or a secret in a binary file, is not found. The history of the repository is not read: a secret removed in a later commit is still there. Use a dedicated secret scanner on the full history as well.
- **Access.** Who holds the cloud accounts, the domain, the app store accounts and the admin rights of the repository is not in the files. List them in the handover.
- **Monorepos with unusual layouts.** Lock files are looked for next to each manifest; a tool that keeps them elsewhere is reported as missing.
