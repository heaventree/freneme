#!/usr/bin/env node
// End-to-end MCP boundary check with a fake worker: no real provider accounts used.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PKG, NODE, talk, safeEnv } from './test-relay-kit.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frenemy-relay-access-'));
const project = path.join(root, 'allowed');
const other = path.join(root, 'outside');
fs.mkdirSync(project);
fs.mkdirSync(other);
const relayPath = pathToFileURL(path.join(PKG, 'tools', 'relay-core.mjs')).href;
const serverPath = path.join(root, 'fake-relay.mjs');
fs.writeFileSync(serverPath, `import { serve } from ${JSON.stringify(relayPath)};
serve({
 serverName:'frenemy-test',version:'1.0',
 tools:[{name:'ask_probe',description:'fake read',inputSchema:{type:'object',properties:{prompt:{type:'string'},working_directory:{type:'string'}},required:['prompt']}}],
 call: async()=>({ok:true,text:'consultation accepted'})
});\n`);
const session = talk(NODE, [serverPath], {
  env: safeEnv(root, { FRENEMY_REQUIRE_ROOTS: '1', FRENEMY_ALLOWED_ROOTS: project }),
});
let id = 0;
async function request(name, args) {
  const requestId = ++id;
  session.send({jsonrpc:'2.0',id:requestId,method:'tools/call',params:{name,arguments:args}});
  const reply = await session.receive(10000, 'relay policy did not answer');
  assert.equal(reply.id, requestId);
  return reply.result;
}
try {
  let r = await request('ask_probe', {prompt:'hello',working_directory:other});
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /outside the approved/);
  r = await request('ask_probe', {prompt:'hello',working_directory:project});
  assert.ok(!r.isError, JSON.stringify(r));
  assert.match(r.content[0].text, /consultation accepted/);
  r = await request('crew_job_status', {working_directory:other});
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /outside the approved/);
  console.log('Approved-project MCP boundary checks passed.');
} finally {
  await session.close();
  fs.rmSync(root, { recursive:true, force:true });
}
