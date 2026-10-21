#!/usr/bin/env bun
/** Install the pinned OpenClaw CLI and check HOST.md plus the example config. */

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const DUMMY_SLACK = "C0ALBERTCHECK";
const DUMMY_TOKEN = "test-token-not-real";
const SECRET_ENV = /token|secret|password|credential|api[_-]?key|authorization/i;

export type OpenClawPin = { npm: string; revision: string };

export function readOpenClawPin(text: string): OpenClawPin {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  if (lines.length < 2 || !/^\d{4}\.\d+\.\d+$/.test(lines[0]) || !/^[0-9a-f]{7,40}$/.test(lines[1])) {
    throw new Error("openclaw/VERSION must be '<npm version>' then '<CLI revision>'");
  }
  return { npm: lines[0], revision: lines[1] };
}

export function parseExampleConfig(text: string): Record<string, unknown> {
  const withoutComments = text
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
  const quoted = withoutComments
    .replace(/([{\[,]\s*)([A-Za-z_][\w]*)\s*:/g, '$1"$2":')
    .replace(/,(\s*[}\]])/g, "$1");
  const parsed = JSON.parse(quoted);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("example config must be an object");
  }
  return parsed as Record<string, unknown>;
}

export function extractCronCreateCommands(hostMarkdown: string): string[] {
  const commands: string[] = [];
  for (const match of hostMarkdown.matchAll(/```bash\n([\s\S]*?)```/g)) {
    const unfolded = match[1].replace(/\\\n/g, " ");
    for (const part of unfolded.split(/(?=openclaw cron create )/)) {
      const command = part.replace(/\s+/g, " ").trim();
      if (command.startsWith("openclaw cron create ")) {
        commands.push(command);
      }
    }
  }
  if (commands.length !== 2) {
    throw new Error(`HOST.md must contain exactly two openclaw cron create commands, found ${commands.length}`);
  }
  return commands;
}

export function splitCommand(command: string): string[] {
  const out: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  for (const char of command) {
    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) {
        out.push(current);
      }
      current = "";
      continue;
    }
    current += char;
  }
  if (quote) {
    throw new Error("unclosed quote in cron command");
  }
  if (current) {
    out.push(current);
  }
  return out;
}

export function mergeDummyGatewayConfig(example: Record<string, unknown>, workspace: string, port: number) {
  const agents = { ...((example.agents as Record<string, unknown> | undefined) ?? {}) };
  const defaults = { ...((agents.defaults as Record<string, unknown> | undefined) ?? {}) };
  const entries = { ...((agents.entries as Record<string, unknown> | undefined) ?? {}) };
  const main = { ...((entries.main as Record<string, unknown> | undefined) ?? {}) };
  defaults.workspace = workspace;
  main.workspace = workspace;
  entries.main = main;
  agents.defaults = defaults;
  agents.entries = entries;
  return {
    ...example,
    agents,
    gateway: {
      mode: "local",
      bind: "loopback",
      port,
      auth: { mode: "token", token: DUMMY_TOKEN },
    },
  };
}

function requireOk(result: { exitCode: number; stdout: string; stderr: string }, label: string) {
  if (result.exitCode) {
    throw new Error(`${label} failed (${result.exitCode}): ${result.stderr.trim() || result.stdout.trim()}`);
  }
  return result;
}

function parseSemver(version: string) {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

export function nodeSatisfiesOpenClaw(version: string): boolean {
  const parsed = parseSemver(version);
  if (!parsed) {
    return false;
  }
  if (parsed.major === 24) {
    return parsed.minor > 16 || (parsed.minor === 16 && parsed.patch >= 0);
  }
  return parsed.major > 26 || (parsed.major === 26 && parsed.minor >= 1);
}

function runCommand(
  command: string[],
  options: { input?: string; env?: Record<string, string> } = {},
) {
  const result = Bun.spawnSync(command, {
    stdout: "pipe",
    stderr: "pipe",
    stdin: options.input != null ? Buffer.from(options.input) : undefined,
    env: options.env,
  });
  return {
    exitCode: result.exitCode ?? 1,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

function isolatedEnv(home: string, pathValue: string | undefined): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value == null || SECRET_ENV.test(key)) {
      continue;
    }
    env[key] = value;
  }
  env.HOME = home;
  env.OPENCLAW_STATE_DIR = join(home, ".openclaw");
  env.OPENCLAW_CONFIG_PATH = join(home, ".openclaw", "openclaw.json");
  if (pathValue) {
    env.PATH = pathValue;
  }
  return env;
}

function ensureNode(wanted: string): string {
  const current = runCommand(["node", "-v"]);
  if (current.exitCode === 0 && nodeSatisfiesOpenClaw(current.stdout.trim())) {
    return "node";
  }
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  const platform = process.platform === "darwin" ? "darwin" : "linux";
  const name = `node-v${wanted}-${platform}-${arch}`;
  const unpacked = join(tmpdir(), name);
  const binary = join(unpacked, "bin", "node");
  if (existsSync(binary) && nodeSatisfiesOpenClaw(runCommand([binary, "-v"]).stdout.trim())) {
    return binary;
  }
  const url = `https://nodejs.org/dist/v${wanted}/${name}.tar.xz`;
  const archive = join(tmpdir(), `${name}.tar.xz`);
  console.log(`OpenClaw needs Node >=24.16; installing ${name}`);
  requireOk(runCommand(["curl", "-fsSL", url, "-o", archive]), `download Node ${wanted}`);
  requireOk(runCommand(["tar", "-xJf", archive, "-C", tmpdir()]), "unpack Node");
  return binary;
}

function waitForGateway(openclaw: string, env: Record<string, string>, port: number) {
  const deadline = Date.now() + 45_000;
  let last = "";
  while (Date.now() < deadline) {
    const probe = runCommand([openclaw, "cron", "list", "--json", "--port", String(port), "--token", DUMMY_TOKEN], {
      env,
    });
    if (probe.exitCode === 0 && probe.stdout.includes("{")) {
      return;
    }
    last = probe.stderr.trim() || probe.stdout.trim();
    Bun.sleepSync(500);
  }
  throw new Error(`gateway did not become ready: ${last}`);
}

function requireDocsCitePin(text: string, label: string, pin: OpenClawPin) {
  if (!text.includes(pin.npm) || !text.includes(pin.revision) || !text.includes("openclaw/VERSION")) {
    throw new Error(`${label} must cite both lines from openclaw/VERSION`);
  }
  if (text.includes("da0c264")) {
    throw new Error(`${label} still cites da0c264; use the CLI revision from openclaw/VERSION`);
  }
}

function jobJson(stdout: string): {
  id?: string;
  name?: string;
  payload?: { kind?: string; timeoutSeconds?: number };
  delivery?: { mode?: string; channel?: string; to?: string };
  schedule?: { tz?: string; expr?: string };
  sessionTarget?: string;
} {
  const start = stdout.indexOf("{");
  if (start < 0) {
    throw new Error(`expected JSON from cron create, got: ${stdout}`);
  }
  return JSON.parse(stdout.slice(start)) as ReturnType<typeof jobJson>;
}

function assertCronFlags(command: string, argv: string[], job: ReturnType<typeof jobJson>) {
  const flag = (name: string) => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  if (argv.includes("--timeout-seconds") && job.payload?.timeoutSeconds !== Number(flag("--timeout-seconds"))) {
    throw new Error(`${job.name} did not keep ${flag("--timeout-seconds")} from --timeout-seconds`);
  }
  if (argv.includes("--tz") && job.schedule?.tz !== flag("--tz")) {
    throw new Error(`${job.name} did not keep --tz ${flag("--tz")}`);
  }
  if (argv.includes("--session") && job.sessionTarget && job.sessionTarget !== flag("--session")) {
    throw new Error(`${job.name} did not keep --session ${flag("--session")}`);
  }
  if (argv.includes("--no-deliver") && job.delivery?.mode && job.delivery.mode !== "none") {
    throw new Error(`${job.name} --no-deliver produced delivery.mode=${job.delivery.mode}`);
  }
  if (argv.includes("--announce") && job.delivery?.mode && job.delivery.mode !== "announce") {
    throw new Error(`${job.name} --announce produced delivery.mode=${job.delivery.mode}`);
  }
  if (argv.includes("--channel") && job.delivery?.channel && job.delivery.channel !== flag("--channel")) {
    throw new Error(`${job.name} did not keep --channel ${flag("--channel")}`);
  }
  if (argv.includes("--to") && job.delivery?.to && job.delivery.to !== flag("--to")) {
    throw new Error(`${job.name} did not keep --to ${flag("--to")}`);
  }
  if (!command.includes(argv[2] ?? "") && argv[2]) {
    throw new Error("cron schedule expression missing from HOST.md command");
  }
}

export async function checkOpenClaw(root = ROOT): Promise<void> {
  const pin = readOpenClawPin(await Bun.file(join(root, "openclaw/VERSION")).text());
  const host = await Bun.file(join(root, "openclaw/HOST.md")).text();
  const exampleText = await Bun.file(join(root, "openclaw/albert.config.example.json5")).text();
  requireDocsCitePin(host, "HOST.md", pin);
  requireDocsCitePin(exampleText, "albert.config.example.json5", pin);
  const commands = extractCronCreateCommands(host).map((command) =>
    command.replaceAll("<SLACK_CHANNEL_ID>", DUMMY_SLACK),
  );
  const example = parseExampleConfig(exampleText);
  const work = mkdtempSync(join(tmpdir(), "albert-openclaw-"));
  const home = join(work, "home");
  const workspace = join(work, "workspace");
  const prefix = join(tmpdir(), `albert-openclaw-npm-${pin.npm}`);
  mkdirSync(home, { recursive: true });
  mkdirSync(join(home, ".openclaw"), { recursive: true });
  mkdirSync(workspace, { recursive: true });
  mkdirSync(prefix, { recursive: true });
  const wanted = (await Bun.file(join(root, ".node-version")).text()).trim().replace(/^v/, "") || "24.16.0";
  const node = ensureNode(wanted);
  const nodeDir = node === "node" ? "" : resolve(node, "..");
  const pathValue = nodeDir ? `${nodeDir}:${process.env.PATH ?? ""}` : process.env.PATH;
  const env = isolatedEnv(home, pathValue);
  const npm = node === "node" ? "npm" : join(nodeDir, "npm");
  const install = runCommand([npm, "install", "--prefix", prefix, `openclaw@${pin.npm}`], { env });
  if (install.exitCode) {
    throw new Error(`npm install openclaw@${pin.npm} failed: ${install.stderr.trim() || install.stdout.trim()}`);
  }
  const openclaw = join(prefix, "node_modules", ".bin", "openclaw");
  const version = requireOk(runCommand([openclaw, "--version"], { env }), "openclaw --version");
  if (!version.stdout.includes(pin.npm) || !version.stdout.includes(pin.revision)) {
    throw new Error(`openclaw --version was ${version.stdout.trim()}, expected ${pin.npm} (${pin.revision})`);
  }
  const port = 19000 + ((process.pid + Date.now()) % 1000);
  writeFileSync(
    env.OPENCLAW_CONFIG_PATH,
    `${JSON.stringify(mergeDummyGatewayConfig(example, workspace, port), null, 2)}\n`,
  );
  requireOk(runCommand([openclaw, "config", "validate", "--json"], { env }), "openclaw config validate");
  const gateway = Bun.spawn(
    [
      openclaw,
      "gateway",
      "--allow-unconfigured",
      "--port",
      String(port),
      "--bind",
      "loopback",
      "--auth",
      "token",
      "--token",
      DUMMY_TOKEN,
      "--force",
    ],
    { stdout: "pipe", stderr: "pipe", env, cwd: home },
  );
  const created: string[] = [];
  try {
    waitForGateway(openclaw, env, port);
    for (const command of commands) {
      const argv = splitCommand(command);
      if (argv[0] !== "openclaw" || argv[1] !== "cron" || argv[2] !== "create") {
        throw new Error(`expected openclaw cron create, got ${argv.slice(0, 3).join(" ")}`);
      }
      argv[0] = openclaw;
      argv.push("--port", String(port), "--token", DUMMY_TOKEN, "--json");
      const createdJob = requireOk(runCommand(argv, { env }), command);
      const job = jobJson(createdJob.stdout);
      if (!job.id) {
        throw new Error(`cron create did not return an id: ${createdJob.stdout}`);
      }
      assertCronFlags(command, argv, job);
      created.push(job.id);
      console.log(`created ${job.name} ${job.id}`);
    }
    for (const id of created) {
      requireOk(
        runCommand([openclaw, "cron", "rm", id, "--port", String(port), "--token", DUMMY_TOKEN, "--json"], { env }),
        `cron rm ${id}`,
      );
    }
  } finally {
    gateway.kill();
    try {
      await gateway.exited;
    } catch {
      // isolated gateway
    }
    rmSync(work, { recursive: true, force: true });
  }
}

async function main() {
  try {
    await checkOpenClaw();
    console.log("OpenClaw check passed");
    return 0;
  } catch (error) {
    console.error(`ERROR: ${error instanceof Error ? error.message : error}`);
    return 1;
  }
}

if (import.meta.main) {
  process.exit(await main());
}
