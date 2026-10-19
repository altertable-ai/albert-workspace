// Opt-in behavioral check. Unlike the scripted tests, the model must choose its
// own tools. No task text mentions ALBERT.md or its private verification marker.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { configFor, createFixture, root, runAgent } from './openclaw-test-support.mjs';

const model = process.env.ALBERT_TEST_MODEL;
const baseUrl = process.env.ALBERT_TEST_BASE_URL;
if (!model || !baseUrl) {
  console.error('Set ALBERT_TEST_MODEL and ALBERT_TEST_BASE_URL before running the live check.');
  console.error('Set ALBERT_TEST_API_KEY too if the endpoint requires authentication. No stored credentials are used.');
  process.exitCode = 1;
} else {
  const fixture = await createFixture();
  try {
    const config = configFor({ baseUrl, model, api: process.env.ALBERT_TEST_API ?? 'openai-completions' });
    // Do not invent pricing for a real endpoint. The provider may still report
    // usage; this test makes no USD cost claim.
    delete config.models.providers.integration.models[0].cost;
    const result = await runAgent(fixture, config, { apiKey: process.env.ALBERT_TEST_API_KEY });
    assert.equal(result.ok, true);
    assert.ok(result.toolSummary?.tools.includes('read'), 'the model did not use the read tool');
    assert.ok(result.final.includes(fixture.marker), 'the model did not return the marker stored only in ALBERT.md');
    const { version } = JSON.parse(await readFile(join(root, 'node_modules/openclaw/package.json'), 'utf8'));
    console.log(JSON.stringify({
      startupVerified: true,
      openclawVersion: version,
      model,
      toolSummary: result.toolSummary,
      usage: result.usage ? { input: result.usage.input, output: result.usage.output, total: result.usage.total } : undefined,
    }, null, 2));
  } catch (error) {
    console.error(`Live startup check failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await fixture.cleanup();
  }
}
