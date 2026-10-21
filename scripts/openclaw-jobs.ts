#!/usr/bin/env bun
/** Define and apply Albert's two OpenClaw cron jobs. */

export const REPORT_SLACK_CHANNEL_ENV = "ALBERT_REPORT_SLACK_CHANNEL";

export type AlbertCronJob = {
  name: string;
  schedule: string;
  tz: string;
  session: "isolated";
  timeoutSeconds: number;
  message: string;
  noDeliver?: boolean;
  announce?: boolean;
  channel?: string;
  to?: string;
  declarationKey: string;
};

export function reportSlackChannel(env: NodeJS.ProcessEnv = process.env): string {
  const value = env[REPORT_SLACK_CHANNEL_ENV]?.trim();
  if (!value) {
    throw new Error(`${REPORT_SLACK_CHANNEL_ENV} is required (Slack channel id for the weekly report)`);
  }
  return value;
}

export function albertCronJobs(slackChannel: string): AlbertCronJob[] {
  return [
    {
      name: "Albert daily full sync",
      declarationKey: "albert.daily-full-sync",
      schedule: "0 8 * * *",
      tz: "Europe/Paris",
      session: "isolated",
      timeoutSeconds: 1800,
      noDeliver: true,
      message:
        "Run bun scripts/sync-workspace.ts on the live main checkout if needed. Then skills/routine-sync in full mode. If repositories.config.json changed, run bun scripts/subscribe-repos.ts. Stay in rules/safety.md. Reply NO_REPLY when the pass is clean.",
    },
    {
      name: "Albert weekly report",
      declarationKey: "albert.weekly-report",
      schedule: "0 9 * * 5",
      tz: "Europe/Paris",
      session: "isolated",
      timeoutSeconds: 1800,
      announce: true,
      channel: "slack",
      to: slackChannel,
      message: "Run skills/ops-report for the past seven days. Post once to this Slack channel.",
    },
  ];
}

export function cronJobArgv(job: AlbertCronJob, mode: "create" | "edit", id?: string): string[] {
  const args = ["cron", mode];
  if (mode === "edit") {
    if (!id) {
      throw new Error(`cron edit requires an id for ${job.name}`);
    }
    args.push(id, "--cron", job.schedule);
  } else {
    args.push(job.schedule);
  }
  args.push(
    "--name",
    job.name,
    "--tz",
    job.tz,
    "--session",
    job.session,
    "--timeout-seconds",
    String(job.timeoutSeconds),
  );
  if (mode === "create") {
    args.push("--declaration-key", job.declarationKey);
  }
  if (job.noDeliver) {
    args.push("--no-deliver");
  }
  if (job.announce) {
    args.push("--announce");
  }
  if (job.channel) {
    args.push("--channel", job.channel);
  }
  if (job.to) {
    args.push("--to", job.to);
  }
  args.push("--message", job.message);
  return args;
}

export type ListedCronJob = { id?: string; name?: string; declarationKey?: string };

export function parseCronList(stdout: string): ListedCronJob[] {
  const start = stdout.indexOf("{");
  if (start < 0) {
    return [];
  }
  const parsed = JSON.parse(stdout.slice(start)) as { jobs?: ListedCronJob[] } | ListedCronJob[];
  return Array.isArray(parsed) ? parsed : (parsed.jobs ?? []);
}

export function findListedJob(jobs: ListedCronJob[], spec: AlbertCronJob): ListedCronJob | undefined {
  return jobs.find((job) => job.declarationKey === spec.declarationKey || job.name === spec.name);
}

type RunResult = { exitCode: number; stdout: string; stderr: string };

function runCommand(command: string[], env?: Record<string, string>): RunResult {
  const result = Bun.spawnSync(command, {
    stdout: "pipe",
    stderr: "pipe",
    env,
  });
  return {
    exitCode: result.exitCode ?? 1,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

function requireOk(result: RunResult, label: string) {
  if (result.exitCode) {
    throw new Error(`${label} failed (${result.exitCode}): ${result.stderr.trim() || result.stdout.trim()}`);
  }
  return result;
}

export function extraOpenclawArgs(argv: string[]): string[] {
  const extra: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--port" || argv[i] === "--token" || argv[i] === "--url") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error(`${argv[i]} needs a value`);
      }
      extra.push(argv[i], value);
      i += 1;
    }
  }
  return extra;
}

export function applyAlbertCronJobs(options: {
  openclaw?: string;
  slackChannel?: string;
  extraArgs?: string[];
  env?: Record<string, string>;
} = {}): { action: "created" | "updated"; id: string; name: string }[] {
  const slackChannel = options.slackChannel ?? reportSlackChannel(options.env ?? process.env);
  const openclaw = options.openclaw ?? "openclaw";
  const extra = options.extraArgs ?? [];
  const list = requireOk(
    runCommand([openclaw, "cron", "list", "--all", "--json", ...extra], options.env),
    "openclaw cron list",
  );
  const existing = parseCronList(list.stdout);
  const applied: { action: "created" | "updated"; id: string; name: string }[] = [];
  for (const spec of albertCronJobs(slackChannel)) {
    const found = findListedJob(existing, spec);
    const argv = found?.id ? cronJobArgv(spec, "edit", found.id) : cronJobArgv(spec, "create");
    const result = requireOk(runCommand([openclaw, ...argv, "--json", ...extra], options.env), spec.name);
    const start = result.stdout.indexOf("{");
    const body = start >= 0 ? (JSON.parse(result.stdout.slice(start)) as { id?: string; job?: { id?: string } }) : {};
    const id = body.job?.id ?? body.id ?? found?.id;
    if (!id) {
      throw new Error(`${spec.name} did not return an id`);
    }
    applied.push({ action: found?.id ? "updated" : "created", id, name: spec.name });
  }
  return applied;
}

async function main() {
  try {
    const applied = applyAlbertCronJobs({ extraArgs: extraOpenclawArgs(process.argv.slice(2)) });
    for (const job of applied) {
      console.log(`${job.action} ${job.name} ${job.id}`);
    }
    return 0;
  } catch (error) {
    console.error(`ERROR: ${error instanceof Error ? error.message : error}`);
    return 1;
  }
}

if (import.meta.main) {
  process.exit(await main());
}
