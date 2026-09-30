import test from 'node:test';
import assert from 'node:assert/strict';
import { fromObject, checkReadme, checkEnv, checkLocks, checkTests, checkCi, checkRunbook, checkInfra, checkSecrets, checkDecisions, review, count } from '../src/index.js';

const levels = (r) => r.findings.map((f) => `${f.level} ${f.file}`.trim());

test('readme: missing is a problem, no run section is a warning, a setup heading passes', () => {
  assert.deepEqual(levels(checkReadme(fromObject({ 'a.js': '' }))), ['problem']);
  assert.deepEqual(levels(checkReadme(fromObject({ 'README.md': '# App\n\n## Features\n' }))), ['warning README.md']);
  assert.deepEqual(levels(checkReadme(fromObject({ 'readme.md': '# App\n\n## Getting started\nnpm ci\n' }))), []);
  assert.deepEqual(checkReadme(fromObject({ 'README.rst': 'App\n===\n\n## How to run\n' })).found, ['README.rst explains how to run it']);
});

test('env: committed settings are a problem; examples are fine; code that reads settings needs an example', () => {
  const r = checkEnv(fromObject({ '.env': 'A=1', 'api/.env.production': 'B=2', '.env.example': 'A=', 'src/a.js': 'process.env.A' }));
  assert.deepEqual(levels(r), ['problem .env', 'problem api/.env.production']);
  assert.deepEqual(r.found, ['.env.example lists the settings']);
  assert.deepEqual(levels(checkEnv(fromObject({ 'app.py': 'import os\nos.getenv("X")' }))), ['warning']);
  assert.deepEqual(levels(checkEnv(fromObject({ 'app.py': 'print(1)' }))), []);
});

test('lockfile: each manifest in each folder needs its own lock', () => {
  const r = checkLocks(fromObject({ 'package.json': '{}', 'package-lock.json': '{}', 'web/package.json': '{}', 'svc/go.mod': '', 'svc/go.sum': '', 'py/pyproject.toml': '' }));
  assert.deepEqual(levels(r), ['warning web/package.json', 'warning py/pyproject.toml']);
  assert.deepEqual(r.found.sort(), ['package.json has package-lock.json', 'svc/go.mod has go.sum']);
});

test('tests, ci, runbook, infra and decisions are found by their usual names', () => {
  assert.deepEqual(levels(checkTests(fromObject({ 'src/a.js': '' }))), ['warning']);
  for (const p of ['test/a.js', 'src/a.test.ts', 'pkg/a_test.go', 'tests/test_a.py', 'App.Tests/UserTests.cs', 'src/__tests__/x.js']) {
    assert.deepEqual(levels(checkTests(fromObject({ [p]: '' }))), [], p);
  }
  assert.deepEqual(levels(checkCi(fromObject({ '.github/workflows/ci.yml': '' }))), []);
  assert.deepEqual(levels(checkCi(fromObject({ '.gitlab-ci.yml': '' }))), []);
  assert.deepEqual(levels(checkCi(fromObject({ 'ci.yml': '' }))), ['warning']);
  assert.deepEqual(levels(checkRunbook(fromObject({ 'docs/RUNBOOK.md': '' }))), []);
  assert.deepEqual(levels(checkRunbook(fromObject({ 'docs/deployment.md': '' }))), []);
  assert.deepEqual(levels(checkRunbook(fromObject({ 'docs/intro.md': '' }))), ['warning']);
  assert.deepEqual(levels(checkInfra(fromObject({ 'infra/main.tf': '' }))), []);
  assert.deepEqual(levels(checkInfra(fromObject({ 'docker-compose.yml': '' }))), []);
  assert.deepEqual(levels(checkInfra(fromObject({ 'src/a.js': '' }))), ['info']);
  assert.deepEqual(levels(checkDecisions(fromObject({ 'docs/decisions/0001-x.md': '' }))), []);
  assert.deepEqual(levels(checkDecisions(fromObject({ 'docs/adr/ADR-7.md': '' }))), []);
  assert.deepEqual(levels(checkDecisions(fromObject({ 'docs/x.md': '' }))), ['info']);
});

test('secrets: keys and tokens are problems; examples and test fixtures are left alone', () => {
  const gh = 'ghp' + '_' + 'a'.repeat(36);
  const aws = 'AKIA' + 'ABCDEFGHIJKLMNOP';
  const key = '-----BEGIN ' + 'PRIVATE KEY-----';
  const pw = 'const password = "' + 'correct-horse-battery' + '";';
  const r = checkSecrets(fromObject({ 'a.js': gh, 'b.py': aws, 'c.pem': key, 'd.js': pw, 'e.js': 'const password = process.env.PW;', 'test/f.js': gh, 'g.env.example': gh }));
  assert.deepEqual(levels(r), ['problem a.js', 'problem b.py', 'problem c.pem', 'problem d.js']);
  assert.match(r.findings[0].message, /GitHub token/);
  assert.deepEqual(checkSecrets(fromObject({ 'a.js': 'ok' })).found, ['no secrets matched']);
});

test('review: skipped checks, counts and what was not read', () => {
  const repo = fromObject({ 'README.md': '# A\n## Setup\n', '.env': 'A=1' });
  repo.skipped = { dirs: ['node_modules'], large: ['big.sql'] };
  const r = review(repo, { skip: ['secrets', 'decisions'] });
  assert.deepEqual(r.skipped, ['secrets', 'decisions']);
  assert.ok(!r.checked.includes('secrets'));
  assert.equal(count(r, 'problem'), 1);
  assert.deepEqual(r.notRead, { dirs: ['node_modules'], large: ['big.sql'] });
});
