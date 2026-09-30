// Command line: handover-check <folder> [--skip check,check] [--format text|markdown|json|csv] [--output file]
//               [--fail-on problem|warning]

import { writeFile } from 'node:fs/promises';
import { scan } from './scan.js';
import { review, count, CHECKS } from './checks.js';
import { toText, toMarkdown, toJson, toCsv } from './report.js';

export const USAGE = `handover-check <folder> [options]

Checks whether another team could take a software product over from its repository: how to run it, settings,
lock files, tests, a build pipeline, a runbook, the environment as code, committed secrets and written decisions.
It reads the folder you give it and fetches nothing.

Options
  --skip <list>           checks to leave out: ${CHECKS.join(', ')}
  --format <f>            text (default), markdown, json or csv
  --output <file>         write the report to a file
  --fail-on <level>       exit 1 when there is a finding at this level or above: problem or warning
  --help                  this text

Exit codes: 0 done, 1 findings with --fail-on, 2 wrong usage or invalid input.`;

export function parseArgs(argv) {
  const o = { format: 'text', skip: [] };
  const dirs = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { o.help = true; continue; }
    if (!a.startsWith('--')) { dirs.push(a); continue; }
    if (!['--skip', '--format', '--output', '--fail-on'].includes(a)) throw new Error(`unknown option: ${a}`);
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error(`${a} needs a value`);
    const v = argv[++i];
    if (a === '--skip') o.skip = v.split(',').map((x) => x.trim()).filter(Boolean);
    else if (a === '--fail-on') o.failOn = v;
    else o[a.slice(2)] = v;
  }
  if (o.help) return o;
  if (dirs.length !== 1) throw new Error('give exactly one folder');
  o.dir = dirs[0];
  if (!['text', 'markdown', 'json', 'csv'].includes(o.format)) throw new Error(`unknown format: ${o.format}`);
  const bad = o.skip.filter((c) => !CHECKS.includes(c));
  if (bad.length) throw new Error(`unknown check(s) in --skip: ${bad.join(', ')}`);
  if (o.failOn !== undefined && !['problem', 'warning'].includes(o.failOn)) throw new Error('--fail-on takes problem or warning');
  return o;
}

export async function main(argv, { stdout = process.stdout, stderr = process.stderr } = {}) {
  let o, result;
  try {
    o = parseArgs(argv);
    if (o.help) { stdout.write(`${USAGE}\n`); return 0; }
    result = review(await scan(o.dir), { skip: o.skip });
  } catch (err) {
    stderr.write(`${err.message}\n\n${USAGE}\n`);
    return 2;
  }
  const out = o.format === 'json' ? toJson(result) : o.format === 'csv' ? toCsv(result)
    : o.format === 'markdown' ? toMarkdown(result) : toText(result);
  if (o.output) await writeFile(o.output, `${out}\n`);
  else stdout.write(`${out}\n`);
  if (o.failOn) {
    const n = count(result, 'problem') + (o.failOn === 'warning' ? count(result, 'warning') : 0);
    if (n) {
      stderr.write(`${n} finding(s) at ${o.failOn} level or above\n`);
      return 1;
    }
  }
  return 0;
}
