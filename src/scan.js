// Reading the repository: every file path, and the text of files small enough to read. Folders that hold installed or
// built things are skipped, and every skip is recorded so the report can say what was not looked at.

import { readdir, stat, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

export const SKIP_DIRS = new Set(['.git', 'node_modules', 'vendor', 'dist', 'build', '.venv', 'venv', 'target', '__pycache__', '.next', '.nuxt', 'coverage', 'obj']);
export const MAX_TEXT = 1024 * 1024;
const BINARY = /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|tgz|jar|war|exe|dll|so|dylib|woff2?|ttf|eot|mp4|mov|mp3|wav|class|pyc|o|a|lib|bin|sqlite|db)$/i;

// { files: [{ path, size }], text: Map(path -> content), skipped: { dirs: [...], large: [...] } }
export async function scan(root) {
  const info = await stat(root).catch(() => null);
  if (!info || !info.isDirectory()) throw new Error(`${root} is not a folder`);
  const files = [];
  const text = new Map();
  const skipped = { dirs: [], large: [] };
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      const full = join(dir, e.name);
      const rel = relative(root, full).split(sep).join('/');
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) { skipped.dirs.push(rel); continue; }
        await walk(full);
      } else if (e.isFile()) {
        const { size } = await stat(full);
        files.push({ path: rel, size });
        if (BINARY.test(e.name)) continue;
        if (size > MAX_TEXT) { skipped.large.push(rel); continue; }
        text.set(rel, await readFile(full, 'utf8'));
      }
    }
  }
  await walk(root);
  return { files, text, skipped };
}

// The same shape from a plain object { "path": "content" }, for tests and for use as a library.
export function fromObject(obj) {
  const files = Object.keys(obj).sort().map((path) => ({ path, size: Buffer.byteLength(obj[path]) }));
  return { files, text: new Map(Object.entries(obj)), skipped: { dirs: [], large: [] } };
}
