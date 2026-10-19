import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, delimiter, dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const cli = join(root, 'node_modules/openclaw/openclaw.mjs');
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

function readOnlyTools() {
  return {
    allow: ['read'],
    deny: ['exec', 'process', 'write', 'edit', 'apply_patch', 'browser'],
    fs: { workspaceOnly: true },
    codeMode: { enabled: false },
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
    tools: readOnlyTools(),
  };
}

export async function stageCodexPlugin(fixture) {
  // Codex must be discovered as an installed official plugin. Loading it from
  // plugins.load.paths cannot register its reserved runtime capabilities.
  const extensions = join(fixture.state, 'extensions');
  await mkdir(extensions, { recursive: true });
  await symlink(join(root, 'node_modules/@openclaw/codex'), join(extensions, 'codex'), 'dir');
}

export function codexConfigFor(model, { nativeLogin = false, codexBin = 'codex' } = {}) {
  return {
    plugins: {
      allow: ['openai', 'codex'],
      entries: { openai: { enabled: true }, codex: { enabled: true, config: {
        codexDynamicToolsLoading: 'direct',
        sessionCatalog: { enabled: false },
        supervision: { enabled: false },
        appServer: {
          homeScope: nativeLogin ? 'user' : 'agent',
          command: nativeLogin ? codexBin : join(root, 'node_modules/@openai/codex/bin/codex.js'),
          sandbox: 'read-only',
          approvalPolicy: 'never',
          clearEnv: ['CODEX_API_KEY', 'OPENAI_API_KEY'],
          cyberFailover: { mode: 'off' },
        },
      } } },
    },
    agents: { defaults: {
      model: `openai/${model}`,
      models: { [`openai/${model}`]: { agentRuntime: { id: 'codex' } } },
      contextInjection: 'always',
    } },
    // A finite allowlist also disables Codex native execution, MCP, and hooks.
    tools: readOnlyTools(),
  };
}

export async function writeConfig(fixture, config) {
  const configPath = join(fixture.directory, 'config.json');
  await writeFile(configPath, JSON.stringify(config), { mode: 0o600 });
  return configPath;
}

export function fixtureEnv(fixture, apiKey, codexHome) {
  // A fresh HOME and explicit config/state exclude operator sessions, plugins,
  // channels, and inherited credentials. Native-login tests explicitly point
  // Codex at its existing home; credentials are never copied into the fixture.
  // npm prepends dependency bins. Native-login mode must find the operator's
  // installed CLI rather than silently selecting our pinned test dependency.
  const nativePath = process.env.PATH?.split(delimiter)
    .filter(path => !(basename(path) === '.bin' && basename(dirname(path)) === 'node_modules'))
    .join(delimiter);
  return {
    PATH: codexHome ? nativePath : process.env.PATH,
    HOME: fixture.home,
    TMPDIR: tmpdir(),
    OPENCLAW_STATE_DIR: fixture.state,
    OPENCLAW_CONFIG_PATH: join(fixture.directory, 'config.json'),
    ALBERT_TEST_API_KEY: apiKey,
    ...(codexHome ? { CODEX_HOME: codexHome } : {}),
    NO_COLOR: '1',
  };
}

export async function runAgent(fixture, config, {
  apiKey = 'local-fixture-not-a-secret', timeoutSeconds = 30, thinking = 'off', signal, codexHome,
} = {}) {
  const configPath = await writeConfig(fixture, config);
  const env = fixtureEnv(fixture, apiKey, codexHome);
  const child = spawn(process.execPath, [
    cli, 'agent', 'exec', '--cwd', fixture.workspace, '--config', configPath,
    '--state-dir', fixture.state, '--code-mode', 'direct', '--thinking', thinking,
    '--timeout', String(timeoutSeconds), '--json', ordinaryTask,
  ], { cwd: fixture.workspace, env, signal, timeout: (timeoutSeconds + 30) * 1000, killSignal: 'SIGKILL' });
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
    // The pinned CLI normally redacts secrets; also redact the explicitly passed
    // test credential before exposing diagnostics from any failed provider call.
    const diagnostics = `${stdout}\n${stderr}`.replaceAll(apiKey, '[redacted]');
    throw new Error(`OpenClaw exited ${status.code ?? status.signal}: ${diagnostics}`);
  }
  return JSON.parse(stdout);
}
