// Opt-in behavioral check. The task does not name ALBERT.md or its marker.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  cli, codexConfigFor, configFor, createFixture, fixtureEnv, root, runAgent, writeConfig,
} from './openclaw-test-support.mjs';

async function signIn(fixture, config, signal) {
  if (!process.stdin.isTTY) throw new Error('The isolated Codex sign-in needs an interactive terminal.');
  await writeConfig(fixture, config);
  console.log('Sign in for this temporary test. The test deletes its credentials and state afterward.');
  const child = spawn(process.execPath, [
    cli, 'models', 'auth', 'login', '--provider', 'openai', '--device-code',
  ], { cwd: fixture.workspace, env: fixtureEnv(fixture), stdio: 'inherit', signal, timeout: 16 * 60_000 });
  let childError;
  const code = await new Promise(resolve => {
    child.once('error', error => { childError = error; });
    child.once('close', resolve);
  });
  if (childError) throw childError;
  if (code !== 0) throw new Error('The isolated Codex sign-in did not complete.');
}

const auth = process.env.ALBERT_TEST_AUTH ?? 'api';
const model = process.env.ALBERT_TEST_MODEL;
const baseUrl = process.env.ALBERT_TEST_BASE_URL;
if (!['api', 'codex'].includes(auth)) {
  console.error('ALBERT_TEST_AUTH must be api or codex.');
  process.exitCode = 1;
} else if (!model || (auth === 'api' && !baseUrl)) {
  console.error('Set ALBERT_TEST_MODEL and choose ALBERT_TEST_AUTH=codex for an isolated subscription sign-in.');
  console.error('For API access, set ALBERT_TEST_BASE_URL and ALBERT_TEST_API_KEY if required.');
  process.exitCode = 1;
} else {
  const fixture = await createFixture();
  const cancellation = new AbortController();
  const cancel = () => cancellation.abort();
  process.once('SIGINT', cancel);
  process.once('SIGTERM', cancel);
  try {
    let config;
    if (auth === 'codex') {
      config = codexConfigFor(model);
      await signIn(fixture, config, cancellation.signal);
    } else {
      config = configFor({ baseUrl, model, api: process.env.ALBERT_TEST_API ?? 'openai-completions' });
      // Do not invent prices for real endpoints.
      delete config.models.providers.integration.models[0].cost;
    }
    const result = await runAgent(fixture, config, {
      apiKey: auth === 'api' ? process.env.ALBERT_TEST_API_KEY : undefined,
      timeoutSeconds: 120,
      thinking: 'low',
      signal: cancellation.signal,
    });
    assert.equal(result.ok, true, result.error?.message);
    assert.equal(result.model, model, 'the runtime used a different model');
    assert.equal(result.provider, auth === 'codex' ? 'openai' : 'integration');
    assert.ok(result.toolSummary?.tools.includes('read'), 'the model did not use the read tool');
    assert.deepEqual(result.toolSummary.tools, ['read'], 'unexpected tool activity');
    assert.ok(result.final.includes(fixture.marker), 'the model did not return the marker stored only in ALBERT.md');
    const { version } = JSON.parse(await readFile(join(root, 'node_modules/openclaw/package.json'), 'utf8'));
    console.log(JSON.stringify({
      startupVerified: true,
      openclawVersion: version,
      auth,
      model: result.model,
      provider: result.provider,
      toolSummary: result.toolSummary,
      usage: result.usage ? { input: result.usage.input, output: result.usage.output, total: result.usage.total } : undefined,
    }, null, 2));
  } catch (error) {
    console.error(`Live startup check failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await fixture.cleanup();
    process.removeListener('SIGINT', cancel);
    process.removeListener('SIGTERM', cancel);
  }
}
