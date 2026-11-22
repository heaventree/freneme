// Optional policy gate for work assigned to other AI CLIs.
// Set FRENEMY_REQUIRE_ROOTS=1 for a fail-closed pilot configuration, and supply
// FRENEMY_ALLOWED_ROOTS as path.delimiter-separated absolute project directories.
// This authorises projects at the relay boundary; it is NOT process isolation.
import fs from 'node:fs';
import path from 'node:path';

export function checkProjectAccess(dir, env = process.env) {
  const strict = env.FRENEMY_REQUIRE_ROOTS === '1';
  const config = env.FRENEMY_ALLOWED_ROOTS || '';
  if (!strict && !config) return { ok: true };
  if (typeof dir !== 'string' || !path.isAbsolute(dir)) {
    return { ok: false, reason: 'An absolute working_directory is required by the project access policy.' };
  }
  let target;
  try {
    target = fs.realpathSync(dir);
    if (!fs.statSync(target).isDirectory()) throw new Error('not a directory');
  } catch {
    return { ok: false, reason: 'The requested working_directory does not exist or is not accessible.' };
  }
  const roots = config.split(path.delimiter).filter(Boolean);
  if (!roots.length) {
    return { ok: false, reason: 'FRENEMY_ALLOWED_ROOTS must contain at least one approved directory.' };
  }
  for (const entry of roots) {
    if (!path.isAbsolute(entry)) continue; // never resolve relative roots against arbitrary cwd
    let root;
    try {
      root = fs.realpathSync(entry);
      if (!fs.statSync(root).isDirectory()) continue;
    } catch { continue; }
    // On Windows, filesystem paths are commonly case-insensitive.
    const normal = p => process.platform === 'win32' ? p.toLowerCase() : p;
    const relative = path.relative(normal(root), normal(target));
    if (relative === '' || (relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative))) {
      return { ok: true };
    }
  }
  return { ok: false, reason: 'This working_directory is outside the approved Frenemy project directories.' };
}
