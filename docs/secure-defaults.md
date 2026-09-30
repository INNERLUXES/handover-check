# Secure defaults

| Setting | Default | Why |
|---|---|---|
| Secrets found | Reported by file and kind, never printed | A report is shared more widely than the repository; it must not spread the secret further. |
| Committed settings file | Problem | Production values in a repository reach everyone who ever gets a copy. |
| Symbolic links | Not followed | A link could lead the tool out of the folder it was given. |
| Installed and built folders | Skipped and listed | They are not the product's own code, and a skipped folder must never read as checked. |
| Files over 1 MB | Listed as not read for secrets | Reading them costs memory; saying so keeps the report honest. |
| Exit code | 0, unless `--fail-on` is given | The tool reports by default; a pipeline decides whether findings block it. |
| CSV cells | Formula characters prefixed with an apostrophe | File names are free text and must not run in a spreadsheet. |
| Network | Never used | The repository may hold code that is not public. |
| Output | Terminal | Nothing is written to disk unless `--output` is given. |
