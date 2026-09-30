import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, main } from '../src/cli.js';

const EX = join(fileURLToPath(import.meta.url), '..', '..', 'examples', 'booking-product');

function sink() {
  let data = '';
  return { write(s) { data += s; }, get text() { return data; } };
}

test('parseArgs', () => {
  const o = parseArgs(['repo', '--skip', 'infra, decisions', '--fail-on', 'problem', '--format', 'csv']);
  assert.equal(o.dir, 'repo');
  assert.deepEqual(o.skip, ['infra', 'decisions']);
  assert.throws(() => parseArgs([]), /exactly one folder/);
  assert.throws(() => parseArgs(['a', 'b']), /exactly one folder/);
  assert.throws(() => parseArgs(['a', '--skip', 'nope']), /unknown check\(s\) in --skip: nope/);
  assert.throws(() => parseArgs(['a', '--fail-on', 'info']), /problem or warning/);
  assert.throws(() => parseArgs(['a', '--format', 'xml']), /unknown format/);
  assert.throws(() => parseArgs(['a', '--output']), /needs a value/);
  assert.throws(() => parseArgs(['a', '--nope', 'x']), /unknown option/);
  assert.equal(parseArgs(['--help']).help, true);
});

test('help', async () => {
  const out = sink();
  assert.equal(await main(['--help'], { stdout: out, stderr: sink() }), 0);
  assert.match(out.text, /Exit codes/);
});

test('the example review and --fail-on', async () => {
  const out = sink();
  assert.equal(await main([EX], { stdout: out, stderr: sink() }), 0);
  assert.match(out.text, /Handover check: 6 files, 0 problems, 6 warnings/);
  assert.match(out.text, /warning  the code reads settings from the environment/);
  const err = sink();
  assert.equal(await main([EX, '--fail-on', 'warning'], { stdout: sink(), stderr: err }), 1);
  assert.match(err.text, /6 finding\(s\) at warning level/);
  assert.equal(await main([EX, '--fail-on', 'problem'], { stdout: sink(), stderr: sink() }), 0);
});

test('--output writes the file, a missing folder exits 2', async (t) => {
  const d = await mkdtemp(join(tmpdir(), 'hc-cli-'));
  t.after(() => rm(d, { recursive: true, force: true }));
  const file = join(d, 'r.json');
  assert.equal(await main([EX, '--format', 'json', '--output', file], { stdout: sink(), stderr: sink() }), 0);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).files, 6);
  const err = sink();
  assert.equal(await main([join(d, 'missing')], { stdout: sink(), stderr: err }), 2);
  assert.match(err.text, /is not a folder/);
});
