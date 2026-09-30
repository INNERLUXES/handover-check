// The checks. docs/checks.md says the same in words; a change here changes that page too.
// Each finding: { check, level, file, message }. Levels: problem, warning, info. A check that passes adds a "found" note.

const base = (p) => p.split('/').pop();
const has = (repo, re) => repo.files.filter((f) => re.test(f.path)).map((f) => f.path);

// 1. How to run it: a README with a section that says how to install, build or start the product.
export function checkReadme(repo) {
  const readmes = has(repo, /^readme(\.[a-z]+)?$/i);
  if (!readmes.length) return { findings: [{ check: 'readme', level: 'problem', file: '', message: 'no README at the top of the repository' }], found: [] };
  const text = repo.text.get(readmes[0]) || '';
  const run = /^\s{0,3}(#{1,6}\s.*|.+\n[=-]{3,})$/im.test(text) && /^\s{0,3}#{1,6}\s*.*\b(install|installation|setup|set up|getting started|run|running|start|build|develop|development|quick ?start|usage)\b/im.test(text);
  if (!run) return { findings: [{ check: 'readme', level: 'warning', file: readmes[0], message: 'no section on how to install, build or run it' }], found: [] };
  return { findings: [], found: [`${readmes[0]} explains how to run it`] };
}

// 2. Settings: a committed .env file carries real values; code that reads settings needs an example file to copy.
export function checkEnv(repo) {
  const findings = [];
  const envs = has(repo, /(^|\/)\.env(\.[^/]+)?$/).filter((p) => !/\.(example|sample|template|dist|defaults?)$/i.test(p));
  for (const p of envs) findings.push({ check: 'env', level: 'problem', file: p, message: 'settings file committed; move the values to a secret store and commit an example instead' });
  const examples = has(repo, /(^|\/)\.env\.(example|sample|template|dist)$|(^|\/)(example|sample)\.env$/i);
  const reads = [...repo.text].some(([p, t]) => /\.(js|mjs|cjs|ts|tsx|py|go|rb|php|java|kt|cs|rs)$/.test(p) && /process\.env\.|os\.environ|os\.getenv|getenv\(|ENV\[|System\.getenv|Environment\.GetEnvironmentVariable|std::env::var/.test(t));
  if (reads && !examples.length) findings.push({ check: 'env', level: 'warning', file: '', message: 'the code reads settings from the environment but there is no .env.example listing them' });
  return { findings, found: examples.map((p) => `${p} lists the settings`) };
}

const LOCKS = [
  { manifest: 'package.json', locks: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'npm-shrinkwrap.json', 'bun.lockb', 'bun.lock'] },
  { manifest: 'pyproject.toml', locks: ['poetry.lock', 'uv.lock', 'pdm.lock', 'Pipfile.lock', 'requirements.txt'] },
  { manifest: 'Pipfile', locks: ['Pipfile.lock'] },
  { manifest: 'go.mod', locks: ['go.sum'] },
  { manifest: 'Gemfile', locks: ['Gemfile.lock'] },
  { manifest: 'composer.json', locks: ['composer.lock'] },
  { manifest: 'Cargo.toml', locks: ['Cargo.lock'] }
];

// 3. Dependencies: a manifest without its lock file installs different versions on the next team's machine.
export function checkLocks(repo) {
  const findings = [];
  const found = [];
  const paths = new Set(repo.files.map((f) => f.path));
  for (const { manifest, locks } of LOCKS) {
    for (const m of has(repo, new RegExp(`(^|/)${manifest.replace('.', '\\.')}$`))) {
      const dir = m.includes('/') ? m.slice(0, m.lastIndexOf('/') + 1) : '';
      const lock = locks.map((l) => dir + l).find((l) => paths.has(l));
      if (lock) found.push(`${m} has ${base(lock)}`);
      else findings.push({ check: 'lockfile', level: 'warning', file: m, message: `no lock file next to it (${locks.slice(0, 2).join(' or ')})` });
    }
  }
  return { findings, found };
}

// 4. Tests: without them the next team cannot change anything safely.
export function checkTests(repo) {
  const tests = has(repo, /(^|\/)(tests?|__tests__|spec|specs)\/|[._-](test|spec)\.[a-z]+$|(^|\/)test_[^/]+\.py$|_test\.go$|Tests?\.(cs|java|kt)$/);
  if (!tests.length) return { findings: [{ check: 'tests', level: 'warning', file: '', message: 'no test files found' }], found: [] };
  return { findings: [], found: [`${tests.length} test file(s)`] };
}

// 5. Pipeline: how the product is built and checked, written down where a machine runs it.
export function checkCi(repo) {
  const ci = has(repo, /^\.github\/workflows\/[^/]+\.ya?ml$|^\.gitlab-ci\.ya?ml$|^azure-pipelines\.ya?ml$|^Jenkinsfile$|^bitbucket-pipelines\.ya?ml$|^\.circleci\/config\.ya?ml$|^\.buildkite\/|^\.drone\.ya?ml$/);
  if (!ci.length) return { findings: [{ check: 'ci', level: 'warning', file: '', message: 'no build pipeline configuration found' }], found: [] };
  return { findings: [], found: ci.map((p) => `${p} builds it`) };
}

// 6. Runbook: how to deploy, watch and recover the product, which a new team needs on its first bad night.
export function checkRunbook(repo) {
  const rb = has(repo, /(^|\/)(runbook|operations|operating|ops|deploy(ment)?|playbook|on-?call)[^/]*\.(md|txt|rst|adoc)$/i);
  if (!rb.length) return { findings: [{ check: 'runbook', level: 'warning', file: '', message: 'no runbook: nothing says how to deploy, monitor and recover it' }], found: [] };
  return { findings: [], found: rb.map((p) => `${p} is a runbook`) };
}

// 7. Environment as code: servers and services described in files can be rebuilt by someone else.
export function checkInfra(repo) {
  const infra = has(repo, /\.tf$|(^|\/)Dockerfile[^/]*$|(^|\/)(docker-)?compose[^/]*\.ya?ml$|(^|\/)serverless\.ya?ml$|(^|\/)cdk\.json$|(^|\/)Pulumi\.ya?ml$|\.bicep$|(^|\/)(k8s|kubernetes|helm|charts)\/|(^|\/)template\.ya?ml$/i);
  if (!infra.length) return { findings: [{ check: 'infra', level: 'info', file: '', message: 'the environment is not described in code (no Terraform, Dockerfile, compose or similar)' }], found: [] };
  return { findings: [], found: [`${infra.length} infrastructure file(s)`] };
}

const SECRETS = [
  [/-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY( BLOCK)?-----/, 'a private key'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'an AWS access key id'],
  [/\b(?:ghp|gho|ghs|ghu|github_pat)_[A-Za-z0-9_]{20,}/, 'a GitHub token'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/, 'a Slack token'],
  [/\bsk_live_[A-Za-z0-9]{16,}/, 'a Stripe live key'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, 'a Google API key'],
  [/(?:password|passwd|secret|api[_-]?key|client[_-]?secret|token)\s*[:=]\s*['"][^'"\s$<{]{12,}['"]/i, 'a password or key in the code']
];

// 8. Secrets in the files: they travel with every copy of the repository, to every team that ever gets it.
export function checkSecrets(repo) {
  const findings = [];
  for (const [p, t] of repo.text) {
    if (/\.(example|sample|template)$|(^|\/)(test|tests|__tests__|fixtures?)\//i.test(p)) continue;
    for (const [re, what] of SECRETS) {
      if (re.test(t)) { findings.push({ check: 'secrets', level: 'problem', file: p, message: `looks like ${what}; rotate it and remove it from the history` }); break; }
    }
  }
  return { findings, found: findings.length ? [] : ['no secrets matched'] };
}

// 9. Decisions: why the product is built the way it is, so the next team does not undo it by accident.
export function checkDecisions(repo) {
  const adr = has(repo, /(^|\/)(adr|adrs|decisions|architecture)\/[^/]+\.(md|txt|rst|adoc)$|(^|\/)ADR[-_ ]?\d+/i);
  if (!adr.length) return { findings: [{ check: 'decisions', level: 'info', file: '', message: 'no written design decisions (docs/decisions or ADR files)' }], found: [] };
  return { findings: [], found: [`${adr.length} decision record(s)`] };
}

export const CHECKS = ['readme', 'env', 'lockfile', 'tests', 'ci', 'runbook', 'infra', 'secrets', 'decisions'];
const RUN = { readme: checkReadme, env: checkEnv, lockfile: checkLocks, tests: checkTests, ci: checkCi, runbook: checkRunbook, infra: checkInfra, secrets: checkSecrets, decisions: checkDecisions };

export function review(repo, { skip = [] } = {}) {
  const findings = [];
  const found = {};
  const checked = [];
  for (const c of CHECKS) {
    if (skip.includes(c)) continue;
    checked.push(c);
    const r = RUN[c](repo);
    findings.push(...r.findings);
    found[c] = r.found;
  }
  return { files: repo.files.length, checked, skipped: CHECKS.filter((c) => skip.includes(c)), notRead: repo.skipped, findings, found };
}

export function count(result, level) {
  return result.findings.filter((f) => f.level === level).length;
}
