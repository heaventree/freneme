#!/usr/bin/env node
// Assert sensitive prompt text never becomes a Snitch argv or persisted note.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'frenemy-snitch-privacy-'));
const log = path.join(tmp, 'fleet-log.jsonl');
const fleet = path.join(tmp, 'fake-fleet.mjs');
const runner = path.join(tmp, 'run.mjs');
const reporter = pathToFileURL(path.resolve('tools/fleet-report.mjs')).href;
try {
  fs.writeFileSync(fleet, `import fs from 'node:fs';
fs.appendFileSync(process.env.FRENEMY_TEST_FLEET_LOG,
  JSON.stringify(process.argv.slice(2)) + '\\n');\n`);
  fs.writeFileSync(runner, `import { fleetJob } from ${JSON.stringify(reporter)};
const job = fleetJob({agent:'codex',driver:'claude',title:'security review',
  prompt:'TOP_SECRET_DO_NOT_LOG',cwd:process.cwd()});
job.done('completed');\n`);
  const result = spawnSync(process.execPath, [runner], {
    cwd: path.resolve('.'), encoding: 'utf8', timeout: 15000,
    env: {...process.env, FLEET_BIN:fleet, FRENEMY_TEST_FLEET_LOG:log},
  });
  assert.equal(result.status, 0, result.stderr);
  const text = fs.readFileSync(log, 'utf8');
  assert.doesNotMatch(text, /TOP_SECRET_DO_NOT_LOG/);
  assert.match(text, /Prompt omitted for privacy/);
  console.log('Snitch worker job metadata excludes sensitive prompt content.');
} finally {
  fs.rmSync(tmp,{recursive:true,force:true});
}
