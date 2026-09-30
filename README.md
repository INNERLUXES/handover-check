# handover-check

Checks whether another team could take a software product over from its repository.

Every outsourced product ends with a handover, to your own engineers or to another company. Before the last invoice is paid, the repository should answer the questions the next team will ask on its first day:

- How do I install and run it, and which settings does it need?
- Will it build the same way on my machine, with the same versions?
- Are there tests, and a pipeline that runs them?
- How is it deployed, watched and recovered?
- Is the environment described in code, or only in someone's head?
- Is any secret sitting in the files?

Plain JavaScript, no dependencies. It reads the folder you give it and fetches nothing; the code stays on your machine.

```
npm test
```

```
# tests 14
# pass 14
# fail 0
```

## Quick start

Requires Node 22 or newer. There is nothing to install.

```
git clone https://github.com/INNERLUXES/handover-check.git
cd handover-check
npm run example
```

```
Handover check: 6 files, 0 problems, 6 warnings

readme:
  warning  README.md  no section on how to install, build or run it
env:
  warning  the code reads settings from the environment but there is no .env.example listing them
lockfile:
  warning  package.json  no lock file next to it (package-lock.json or yarn.lock)
tests:
  warning  no test files found
ci:
  warning  no build pipeline configuration found
runbook:
  warning  no runbook: nothing says how to deploy, monitor and recover it
infra: ok (1 infrastructure file(s))
secrets: ok (no secrets matched)
decisions:
  info     no written design decisions (docs/decisions or ADR files)
```

The repository in `examples/booking-product` is made up.

## Your own repository

```
node bin/handover-check.js path/to/your/repository
```

[docs/checks.md](docs/checks.md) gives the exact rule behind each check and why the next team needs it.

## Options

| Option | What it does |
|---|---|
| `--skip <list>` | Checks to leave out: readme, env, lockfile, tests, ci, runbook, infra, secrets, decisions |
| `--format text\|markdown\|json\|csv` | CSV has one line per finding, ready to turn into tickets |
| `--output <file>` | Write the report to a file |
| `--fail-on problem\|warning` | Exit 1 when there is a finding at that level or above |

Exit codes: 0 done, 1 findings with `--fail-on`, 2 wrong usage or invalid input.

## Rules that keep the check honest

- A secret is reported by file and kind, never printed: the report travels further than the repository.
- Folders that were skipped and files too large to read are listed in every format, never reported as ok.
- Symbolic links are not followed, so the tool stays inside the folder it was given.
- A file check cannot tell whether the product really runs; [docs/limits.md](docs/limits.md) lists what to test by hand before a handover.

## As a library

```js
import { scan, review, toMarkdown } from './src/index.js';

const result = review(await scan('path/to/repository'), { skip: ['decisions'] });
console.log(toMarkdown(result));
```

## How this repository is kept

- No runtime dependencies, a committed lock file, `npm ci` in the pipeline.
- Tests on Linux, Windows and macOS with Node 22 and 24, CodeQL, and repository checks for syntax, exports, credentials and leftovers.
- Every workflow sets its token permissions and pins every action to a full commit hash; Dependabot keeps them current.
- The pipeline checks the repository against NIST SP 800-218 with [ssdf-repo-check](https://github.com/INNERLUXES/ssdf-repo-check).
- Releases come with a CycloneDX SBOM, SHA-256 checksums and a build provenance attestation.
- [SECURITY.md](SECURITY.md), [threat model](docs/threat-model.md), [secure defaults](docs/secure-defaults.md), [design decisions](docs/decisions).

## Related

Built by the team behind [outsourced product development at INNERLUXES](https://innerluxes.dev/software-development/outsourced-product-development).

## License

MIT
