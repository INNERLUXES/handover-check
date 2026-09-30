# The checks

The tool walks the folder it is given. Folders that hold installed or built files (`.git`, `node_modules`, `vendor`, `dist`, `build`, `.venv`, `venv`, `target`, `__pycache__`, `.next`, `.nuxt`, `coverage`, `obj`) are skipped and listed. Symbolic links are not followed. Text files up to 1 MB are read; larger ones are listed as not read for secrets.

| Check | Level | Finding |
|---|---|---|
| `readme` | problem | No README at the top of the repository. |
| `readme` | warning | The README has no heading about installing, setting up, getting started, running, building, developing or usage. |
| `env` | problem | A settings file (`.env`, `.env.production` and similar) is committed. Files ending in `.example`, `.sample`, `.template`, `.dist` or `.default` are fine. |
| `env` | warning | Code reads settings from the environment (`process.env`, `os.environ`, `getenv` and similar) but no `.env.example` lists them. |
| `lockfile` | warning | A `package.json`, `pyproject.toml`, `Pipfile`, `go.mod`, `Gemfile`, `composer.json` or `Cargo.toml` has no lock file in the same folder. |
| `tests` | warning | No test files: nothing in `test/`, `tests/`, `__tests__/`, `spec/`, and no `*.test.*`, `*.spec.*`, `test_*.py`, `*_test.go` or `*Tests.cs`. |
| `ci` | warning | No build pipeline: GitHub Actions, GitLab CI, Azure Pipelines, Jenkins, Bitbucket Pipelines, CircleCI, Buildkite or Drone. |
| `runbook` | warning | No document named runbook, operations, deploy or deployment, playbook or on-call. |
| `infra` | info | The environment is not described in code: no Terraform, Dockerfile, compose file, Serverless, CDK, Pulumi, Bicep, CloudFormation template, or Kubernetes or Helm folder. |
| `secrets` | problem | A file holds what looks like a private key, an AWS access key id, a GitHub, Slack or Stripe live key, a Google API key, or a password or key written into the code. Example files and test fixtures are left alone. |
| `decisions` | info | No written design decisions: nothing in `docs/decisions`, `adr/` or `architecture/`, and no `ADR-` files. |

## Why each one matters to the next team

- **readme**: the first hour of a new team is spent finding out how to run the product.
- **env**: a committed settings file hands production values to everyone who ever gets a copy; a missing example file leaves the next team guessing which settings exist.
- **lockfile**: without it, the next install pulls different versions, and the product that worked yesterday does not build.
- **tests**: without them, every change the next team makes is a guess.
- **ci**: the pipeline is the written, runnable answer to "how is this built and checked".
- **runbook**: deploys, alerts and recovery are what a new team needs on its first bad night.
- **infra**: servers described in code can be rebuilt by someone who never saw them.
- **secrets**: a secret in the files travels with every copy of the repository and stays in its history.
- **decisions**: without the reasons, the next team undoes choices it does not understand.
