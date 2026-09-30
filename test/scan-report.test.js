import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scan, MAX_TEXT, fromObject, review, toText, toMarkdown, toJson, toCsv } from '../src/index.js';

test('scan: reads text, skips installed folders and binaries, records large files', async (t) => {
  const d = await mkdtemp(join(tmpdir(), 'hc-'));
  t.after(() => rm(d, { recursive: true, force: true }));
  await mkdir(join(d, 'node_modules', 'x'), { recursive: true });
  await mkdir(join(d, 'src'));
  await writeFile(join(d, 'node_modules', 'x', 'i.js'), 'x');
  await writeFile(join(d, 'src', 'a.js'), 'const a = 1;');
  await writeFile(join(d, 'logo.png'), 'not really a png');
  await writeFile(join(d, 'dump.sql'), 'x'.repeat(MAX_TEXT + 1));
  const r = await scan(d);
  assert.deepEqual(r.files.map((f) => f.path).sort(), ['dump.sql', 'logo.png', 'src/a.js']);
  assert.equal(r.text.get('src/a.js'), 'const a = 1;');
  assert.ok(!r.text.has('logo.png'));
  assert.deepEqual(r.skipped, { dirs: ['node_modules'], large: ['dump.sql'] });
  await assert.rejects(scan(join(d, 'nope')), /is not a folder/);
});

const sample = () => {
  const repo = fromObject({ 'README.md': '# A\n', '.env': 'A=1', 'package.json': '{}', '=cmd.js': 'x' });
  repo.skipped = { dirs: ['node_modules'], large: [] };
  return review(repo, { skip: ['decisions'] });
};

test('text: summary, ok lines with what was found, findings, notes', () => {
  const t = toText(sample());
  assert.match(t, /^Handover check: 4 files, 1 problem, 5 warnings/);
  assert.match(t, /env:\n  problem  \.env  settings file committed/);
  assert.match(t, /secrets: ok \(no secrets matched\)/);
  assert.match(t, /Not checked \(skipped on request\): decisions/);
  assert.match(t, /Folders not read \(installed or built files\): node_modules/);
});

test('every format carries skipped checks and folders not read', () => {
  const r = sample();
  assert.match(toMarkdown(r), /Not checked \(skipped on request\): decisions/);
  const j = JSON.parse(toJson(r));
  assert.deepEqual(j.skipped, ['decisions']);
  assert.deepEqual(j.counts, { problem: 1, warning: 5, info: 1 });
  assert.match(toCsv(r), /^decisions,not checked,,skipped on request$/m);
  assert.match(toCsv(r), /^scan,not read,node_modules,installed or built files$/m);
});

test('markdown escapes, csv defuses formulas', () => {
  const r = { ...sample(), findings: [{ check: 'env', level: 'problem', file: '=cmd|x', message: '@m' }] };
  assert.match(toMarkdown(r), /=cmd\\\|x/);
  assert.match(toCsv(r), /^env,problem,'=cmd\|x,'@m$/m);
});
