#!/usr/bin/env node
// Project-boundary tests use disposable directories and no real AI clients.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkProjectAccess } from './project-policy.mjs';

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'frenemy-policy-'));
const allowed = path.join(temp, 'approved');
const nested = path.join(allowed, 'nested');
const sibling = path.join(temp, 'approved-neighbour');
const outside = path.join(temp, 'private');
for (const dir of [nested, sibling, outside]) fs.mkdirSync(dir, { recursive: true });
const strict = { FRENEMY_REQUIRE_ROOTS: '1', FRENEMY_ALLOWED_ROOTS: allowed };
const expect = (dir, env, approved, label) => {
  const decision = checkProjectAccess(dir, env);
  assert.equal(decision.ok, approved, label + ': ' + (decision.reason || ''));
};
try {
  expect(allowed, strict, true, 'approved directory');
  expect(nested, strict, true, 'approved descendant');
  expect(outside, strict, false, 'unapproved sibling');
  expect(sibling, strict, false, 'prefix collision');
  expect(undefined, strict, false, 'missing workdir');
  expect('relative', strict, false, 'relative workdir');
  expect(allowed, { FRENEMY_REQUIRE_ROOTS: '1' }, false, 'fail closed without approved roots');
  expect(outside, { FRENEMY_REQUIRE_ROOTS: '0' }, true, 'legacy no-policy behaviour');
  expect(outside, { FRENEMY_ALLOWED_ROOTS: allowed }, false, 'allowlist without strict flag still enforced');
  expect(outside, { FRENEMY_ALLOWED_ROOTS: allowed + path.delimiter + outside }, true, 'multiple approved roots');
  const symlink = path.join(allowed, 'redirect');
  try {
    fs.symlinkSync(outside, symlink, process.platform === 'win32' ? 'junction' : 'dir');
    expect(symlink, strict, false, 'symlink/junction escaping approved root');
  } catch (error) {
    if (error.code !== 'EPERM' && error.code !== 'EACCES') throw error;
    console.log('  skip Windows link check: insufficient permission');
  }
  console.log('Project policy checks passed.');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
