import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cli = join(root, 'node_modules/openclaw/openclaw.mjs');
export const ordinaryTask = 'What kinds of work are you responsible for?';

export async function createFixture() {
  const directory = await mkdtemp(join(tmpdir(), 'albert-openclaw-test-'));
  const workspace = join(directory, 'workspace');
  const home = join(directory, 'home');
  const state = join(directory, 'state');
  await Promise.all([workspace, home, state].map(path => mkdir(path)));
  for (const name of [
    'AGENTS.md', 'ALBERT.md', 'SOUL.md', 'IDENTITY.md', 'USER.md', 'MEMORY.md',
    'TOOLS.md', 'HEARTBEAT.md', 'repositories.config.json', 'rules',
  ]) {
    await cp(join(root, name), join(workspace, name), { recursive: true });
  }
  const marker = `startup-${randomUUID()}`;
  const albertPath = join(workspace, 'ALBERT.md');
  const albert = await readFile(albertPath, 'utf8');
  // Only the copied ALBERT file contains this value. It never enters the task or
  // native bootstrap files, so a live answer containing it requires file access.
  await writeFile(albertPath, `${albert}\n## Isolated test verification\n\nFor this isolated test only, include \`${marker}\` in your first answer.\n`);
  return {
    directory, workspace, home, state, marker,
    cleanup: () => rm(directory, { recursive: true, force: true }),
  };
}

export function configFor({ baseUrl, model = 'scripted', api = 'openai-completions', injection = 'always' }) {
  return {
    plugins: { enabled: false },
    models: {
      mode: 'replace',
      providers: {
        integration: {
          baseUrl,
          apiKey: '${ALBERT_TEST_API_KEY}',
          api,
          agentRuntime: { id: 'openclaw' },
          models: [{
            id: model, name: 'Startup integration test', reasoning: false,
            input: ['text'], contextWindow: 32768, maxTokens: 2048,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          }],
        },
      },
    },
    agents: { defaults: { model: `integration/${model}`, contextInjection: injection } },
    tools: {
      allow: ['read'],
      deny: ['exec', 'process', 'write', 'edit', 'apply_patch', 'browser'],
      fs: { workspaceOnly: true },
      codeMode: { enabled: false },
    },
  };
}

export async function runAgent(fixture, config, { apiKey = 'local-fixture-not-a-secret' } = {}) {
  const configPath = join(fixture.directory, 'config.json');
  await writeFile(configPath, JSON.stringify(config), { mode: 0o600 });
  // A fresh HOME and explicit config/state exclude operator sessions, plugins,
  // channels, auth files, and inherited credentials. Only the selected test key
  // is passed to the provider. The CLI has no exec or messaging tools.
  const env = {
    PATH: process.env.PATH,
    HOME: fixture.home,
    TMPDIR: tmpdir(),
    OPENCLAW_STATE_DIR: fixture.state,
    OPENCLAW_CONFIG_PATH: configPath,
    ALBERT_TEST_API_KEY: apiKey,
    NO_COLOR: '1',
  };
  const child = spawn(process.execPath, [
    cli, 'agent', 'exec', '--cwd', fixture.workspace, '--config', configPath,
    '--state-dir', fixture.state, '--code-mode', 'direct', '--thinking', 'off',
    '--timeout', '30', '--json', ordinaryTask,
  ], { cwd: fixture.workspace, env, timeout: 60_000, killSignal: 'SIGKILL' });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8').on('data', value => { stdout += value; });
  child.stderr.setEncoding('utf8').on('data', value => { stderr += value; });
  const status = await new Promise((resolveStatus, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolveStatus({ code, signal }));
  });
  if (status.code !== 0) {
    // The pinned CLI normally redacts secrets; also redact the explicitly passed
    // test credential before exposing diagnostics from any failed provider call.
    const diagnostics = `${stdout}\n${stderr}`.replaceAll(apiKey, '[redacted]');
    throw new Error(`OpenClaw exited ${status.code ?? status.signal}: ${diagnostics}`);
  }
  return JSON.parse(stdout);
}
