import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import {
  cli, codexConfigFor, configFor, createFixture, fixtureEnv, ordinaryTask, root,
  runAgent, stageCodexPlugin, writeConfig,
} from './openclaw-test-support.mjs';

async function modelServer(t, respond) {
  const requests = [];
  const errors = [];
  const server = createServer(async (request, response) => {
    try {
      assert.equal(request.method, 'POST');
      assert.equal(request.url, '/v1/chat/completions');
      let raw = '';
      for await (const part of request) raw += part;
      const body = JSON.parse(raw);
      requests.push(body);
      assert.ok(requests.length <= 4, 'unexpected model retry/loop');
      const message = respond(body, requests.length);
      const finish = message.tool_calls ? 'tool_calls' : 'stop';
      if (!body.stream) {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ id: 'fixture', object: 'chat.completion',
          model: 'scripted', choices: [{ index: 0, message, finish_reason: finish }] }));
        return;
      }
      response.writeHead(200, { 'content-type': 'text/event-stream' });
      const toolCalls = message.tool_calls?.map((call, index) => ({ index, ...call }));
      const delta = { ...message, ...(toolCalls ? { tool_calls: toolCalls } : {}) };
      for (const choice of [
        { index: 0, delta, finish_reason: null },
        { index: 0, delta: {}, finish_reason: finish },
      ]) {
        response.write(`data: ${JSON.stringify({ id: 'fixture', object: 'chat.completion.chunk',
          created: 1, model: 'scripted', choices: [choice] })}\n\n`);
      }
      response.end('data: [DONE]\n\n');
    } catch (error) {
      errors.push(error);
      response.writeHead(500);
      response.end('Local test endpoint failed');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    assert.deepEqual(errors, [], 'fake model endpoint failed');
  });
  return { requests, baseUrl: `http://127.0.0.1:${server.address().port}/v1` };
}

const answer = text => ({ role: 'assistant', content: text });
const readCall = path => ({ role: 'assistant', content: null, tool_calls: [{
  id: 'read_fixture', type: 'function', function: { name: 'read', arguments: JSON.stringify({ path }) },
}] });

async function fixtureFor(t) {
  const fixture = await createFixture();
  t.after(fixture.cleanup);
  return fixture;
}

test('the official Codex plugin registers its runtime in isolated state', { timeout: 60_000 }, async t => {
  const fixture = await fixtureFor(t);
  await stageCodexPlugin(fixture);
  await writeConfig(fixture, codexConfigFor('gpt-6.1-sol'));
  const { stdout } = await promisify(execFile)(process.execPath, [
    cli, 'plugins', 'inspect', 'codex', '--runtime', '--json',
  ], { cwd: fixture.workspace, env: fixtureEnv(fixture), timeout: 45_000 });
  const inspected = JSON.parse(stdout);
  assert.ok(inspected.plugin.agentHarnessIds.includes('codex'), 'Codex runtime was not registered');
  assert.deepEqual(inspected.diagnostics.filter(item => item.level === 'error'), []);
});

// These are plumbing tests with scripted responses, not evidence that a real
// model independently chose to follow the startup instructions.
test('OpenClaw injects the actual repository instructions for an ordinary task', { timeout: 60_000 }, async t => {
  const fixture = await fixtureFor(t);
  const model = await modelServer(t, () => answer('Captured workspace context.'));
  const result = await runAgent(fixture, configFor(model));
  assert.equal(result.ok, true);
  assert.equal(model.requests.length, 1);
  const request = model.requests[0];
  const instructions = request.messages.filter(message => message.role === 'system')
    .map(message => message.content).join('\n');
  assert.ok(instructions.includes((await readFile(join(root, 'AGENTS.md'), 'utf8')).trim()));
  assert.ok(instructions.includes((await readFile(join(root, 'IDENTITY.md'), 'utf8')).trim()));
  assert.ok(!instructions.includes(fixture.marker), 'ALBERT.md must not be injected automatically');
  assert.ok(request.messages.some(message => message.role === 'user' && message.content.includes(ordinaryTask)));
  assert.ok(request.tools.some(tool => tool.function.name === 'read'));
  assert.ok(!request.tools.some(tool => ['exec', 'write', 'edit', 'apply_patch'].includes(tool.function.name)));
});

test('OpenClaw reads ALBERT.md and returns its real contents to a scripted model', { timeout: 60_000 }, async t => {
  const fixture = await fixtureFor(t);
  const model = await modelServer(t, (request, turn) => {
    if (turn === 1) return readCall('ALBERT.md');
    const content = request.messages.filter(message => message.role === 'tool')
      .map(message => message.content).join('\n');
    assert.ok(content.includes(fixture.marker), 'read result must contain the copied file marker');
    return answer(fixture.marker);
  });
  const result = await runAgent(fixture, configFor(model));
  assert.equal(result.ok, true);
  assert.equal(model.requests.length, 2);
  assert.ok(result.toolSummary, 'OpenClaw must report the executed tool call');
  assert.equal(result.toolSummary.calls, 1);
  assert.ok(result.toolSummary.tools.includes('read'));
  assert.equal(result.toolSummary.failures, 0);
  assert.equal(result.final, fixture.marker);
});

test('disabling context injection removes the workspace instruction marker', { timeout: 60_000 }, async t => {
  const fixture = await fixtureFor(t);
  const marker = 'workspace-injection-control-marker';
  await writeFile(join(fixture.workspace, 'AGENTS.md'), `${marker}\n`);
  const model = await modelServer(t, () => answer('Context control complete.'));
  const result = await runAgent(fixture, configFor({ ...model, injection: 'never' }));
  assert.equal(result.ok, true);
  assert.ok(!JSON.stringify(model.requests[0].messages).includes(marker));
});

test('the read tool cannot access files outside the temporary workspace', { timeout: 60_000 }, async t => {
  const fixture = await fixtureFor(t);
  const marker = 'outside-workspace-content-must-stay-private';
  const outside = join(fixture.directory, 'outside.txt');
  await writeFile(outside, marker);
  const model = await modelServer(t, (request, turn) => {
    if (turn === 1) return readCall(outside);
    const contents = JSON.stringify(request.messages.filter(message => message.role === 'tool'));
    assert.ok(!contents.includes(marker));
    return answer('Outside read refused.');
  });
  const result = await runAgent(fixture, configFor(model));
  assert.equal(result.ok, true);
  assert.equal(result.toolSummary.failures, 1);
});
