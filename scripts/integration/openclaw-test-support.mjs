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
  // Only the copied ALBERT file contains this value. It must reach the scripted
  // endpoint through a file read, rather than through automatic context loading.
  await writeFile(albertPath, `${albert}\n## Isolated test verification\n\nFor this isolated test only, include \`${marker}\` in your first answer.\n`);
  return {
    directory, workspace, home, state, marker,
    cleanup: () => rm(directory, { recursive: true, force: true }),
  };
}

export function configFor({ baseUrl, injection = 'always' }) {
  return {
    plugins: { enabled: false },
    models: {
      mode: 'replace',
      providers: {
        integration: {
          baseUrl,
          apiKey: 'local-fixture-not-a-secret',
          api: 'openai-completions',
          agentRuntime: { id: 'openclaw' },
          models: [{
            id: 'scripted', name: 'Startup integration test', reasoning: false,
            input: ['text'], contextWindow: 32768, maxTokens: 2048,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          }],
        },
      },
    },
    agents: { defaults: { model: 'integration/scripted', contextInjection: injection } },
    tools: {
      allow: ['read'],
      deny: ['exec', 'process', 'write', 'edit', 'apply_patch', 'browser'],
      fs: { workspaceOnly: true },
      codeMode: { enabled: false },
    },
  };
}

export async function runAgent(fixture, config) {
  const configPath = join(fixture.directory, 'config.json');
  await writeFile(configPath, JSON.stringify(config), { mode: 0o600 });
  // Explicit config and fresh home/state exclude operator credentials, sessions,
  // plugins, and channels. The only model endpoint is the local scripted server.
  const env = {
    PATH: process.env.PATH,
    HOME: fixture.home,
    TMPDIR: tmpdir(),
    OPENCLAW_STATE_DIR: fixture.state,
    OPENCLAW_CONFIG_PATH: configPath,
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
  let childError;
  const status = await new Promise(resolveStatus => {
    child.once('error', error => { childError = error; });
    child.once('close', (code, signal) => resolveStatus({ code, signal }));
  });
  if (childError) throw childError;
  if (status.code !== 0) {
    throw new Error(`OpenClaw exited ${status.code ?? status.signal}: ${stdout}\n${stderr}`);
  }
  return JSON.parse(stdout);
}
