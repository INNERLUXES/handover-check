// The review in four formats. Every format carries the same facts: skipped checks, folders that were not read and files
// too large to read are never left out of one of them.

import { CHECKS, count } from './checks.js';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const LEVELS = ['problem', 'warning', 'info'];

function summary(r) {
  return `Handover check: ${plural(r.files, 'file')}, ${plural(count(r, 'problem'), 'problem')}, ${plural(count(r, 'warning'), 'warning')}`;
}

function notes(r) {
  const out = [];
  if (r.skipped.length) out.push(`Not checked (skipped on request): ${r.skipped.join(', ')}`);
  if (r.notRead.dirs.length) out.push(`Folders not read (installed or built files): ${r.notRead.dirs.join(', ')}`);
  if (r.notRead.large.length) out.push(`Files too large to read for secrets: ${r.notRead.large.join(', ')}`);
  return out;
}

export function toText(r) {
  const lines = [summary(r), ''];
  for (const c of CHECKS.filter((x) => r.checked.includes(x))) {
    const items = r.findings.filter((f) => f.check === c).sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level));
    if (!items.length) { lines.push(`${c}: ok${r.found[c].length ? ` (${r.found[c].join('; ')})` : ''}`); continue; }
    lines.push(`${c}:`);
    for (const f of items) lines.push(`  ${f.level.padEnd(7)}  ${f.file ? `${f.file}  ` : ''}${f.message}`);
  }
  const n = notes(r);
  if (n.length) lines.push('', ...n);
  return lines.join('\n');
}

const md = (s) => String(s).replace(/[|\\`*_[\]<>]/g, (c) => `\\${c}`);

export function toMarkdown(r) {
  const lines = ['# Handover check', '', summary(r), '', '| Check | Level | File | Finding |', '|---|---|---|---|'];
  for (const c of CHECKS.filter((x) => r.checked.includes(x))) {
    const items = r.findings.filter((f) => f.check === c);
    if (!items.length) lines.push(`| ${c} | ok |  | ${md(r.found[c].join('; '))} |`);
    for (const f of items) lines.push(`| ${c} | ${f.level} | ${md(f.file)} | ${md(f.message)} |`);
  }
  const n = notes(r);
  if (n.length) lines.push('', '## Notes', '', ...n.map((x) => `- ${md(x)}`));
  return lines.join('\n');
}

export function toJson(r) {
  return JSON.stringify({ ...r, counts: Object.fromEntries(LEVELS.map((l) => [l, count(r, l)])), notes: notes(r) }, null, 2);
}

const cell = (v) => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// One line per finding, ready to turn into tickets. Skipped checks and unread folders get a line each.
export function toCsv(r) {
  const out = ['check,level,file,message'];
  for (const f of r.findings) out.push([f.check, f.level, f.file, f.message].map(cell).join(','));
  for (const c of r.skipped) out.push([c, 'not checked', '', 'skipped on request'].map(cell).join(','));
  for (const d of r.notRead.dirs) out.push(['scan', 'not read', d, 'installed or built files'].map(cell).join(','));
  for (const d of r.notRead.large) out.push(['secrets', 'not read', d, 'too large to read'].map(cell).join(','));
  return out.join('\n');
}
