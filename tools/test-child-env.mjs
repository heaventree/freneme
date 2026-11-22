#!/usr/bin/env node
// Verify that relay wrappers do not inherit unrelated host credentials.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runWrapper } from './relay-core.mjs';

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'frenemy-child-env-'));
const child = path.join(temp, 'inspect.mjs');
const names = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GITHUB_TOKEN', 'AWS_SECRET_ACCESS_KEY'];
fs.writeFileSync(child, `console.log(JSON.stringify({secretNames:
  ['OPENAI_API_KEY','ANTHROPIC_API_KEY','GITHUB_TOKEN','AWS_SECRET_ACCESS_KEY']
  .filter(name => Object.hasOwn(process.env,name)),
  driver:process.env.FRENEMY_DRIVER
}));\n`);
const saved = Object.fromEntries(names.map(name => [name, process.env[name]]));
try {
  for (const name of names) process.env[name] = 'fictional-test-value';
  const result = await runWrapper({
    script: child,
    timeoutMs: 10000,
    maxOutput: 2048,
    exitMeaning: {},
    label: 'credential-boundary-test',
  }, 'check inherited variables');
  assert.equal(result.ok, true, result.text);
  const parsed = JSON.parse(result.text.trim());
  assert.deepEqual(parsed.secretNames, [], 'Unrelated host credentials entered the worker wrapper');
  console.log('Relay child environment does not include common host credential variables.');
} finally {
  for (const name of names) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
  fs.rmSync(temp, { recursive: true, force: true });
}
