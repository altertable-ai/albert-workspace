#!/usr/bin/env bun
/** Workspace contracts that Markdown linting cannot catch. */

import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runCommand } from "./lib/gh.ts";
import { readOpenClawPin } from "./openclaw-check.ts";
import { validateWorkflowPolicy } from "./validate-workflow-policy.ts";

const ROOT = resolve(import.meta.dir, "..");

const REQUIRED_FILES = [
  "AGENTS.md",
  "SOUL.md",
  "IDENTITY.md",
  "USER.md",
  "openclaw/albert.config.example.json5",
  "openclaw/VERSION",
  "repositories.config.json",
  "package.json",
  "bun.lock",
  ".bun-version",
  ".node-version",
  "tsconfig.json",
  "scripts/sync-workspace.ts",
  "scripts/spec-status.ts",
  "scripts/ecosystem-status.ts",
  "scripts/github-activity.ts",
  "scripts/heartbeat-state.ts",
  "scripts/subscribe-repos.ts",
  "scripts/setup-github-repo.ts",
  "scripts/validate-workflow-policy.ts",
  "scripts/openclaw-check.ts",
  "scripts/openclaw-jobs.ts",
  "schemas/heartbeat-state.example.json",
  "skills/sdk-sync/templates/.github/workflows/semantic-pull-request.yml",
];

export async function validateWorkspace(root = ROOT): Promise<string[]> {
  const errors: string[] = [];
  for (const path of REQUIRED_FILES) {
    if (!existsSync(join(root, path))) {
      errors.push(`missing required file: ${path}`);
    }
  }
  try {
    JSON.parse(await Bun.file(join(root, "repositories.config.json")).text());
  } catch {
    errors.push("repositories.config.json is not valid JSON");
  }
  try {
    readOpenClawPin(await Bun.file(join(root, "openclaw/VERSION")).text());
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "openclaw/VERSION is invalid");
  }
  const example = runCommand([
    "bun",
    join(root, "scripts/heartbeat-state.ts"),
    "check",
    "--file",
    join(root, "schemas/heartbeat-state.example.json"),
  ]);
  if (example.exitCode) {
    errors.push(example.stderr.trim() || "heartbeat example is invalid");
  }
  const liveState = join(root, "code/heartbeat-state.json");
  if (existsSync(liveState)) {
    const live = runCommand(["bun", join(root, "scripts/heartbeat-state.ts"), "check", "--file", liveState]);
    if (live.exitCode) {
      errors.push(live.stderr.trim() || "heartbeat state is invalid");
    }
  }
  const trackedPython = runCommand(["git", "-C", root, "ls-files", "*.py"]).stdout.trim();
  if (trackedPython) {
    errors.push(`Python files are still tracked:\n${trackedPython}`);
  }
  const trackedShell = runCommand(["git", "-C", root, "ls-files", "scripts/*.sh"]).stdout.trim();
  if (trackedShell) {
    errors.push(`Shell scripts are still tracked:\n${trackedShell}`);
  }
  const localOnly = runCommand([
    "git",
    "-C",
    root,
    "ls-files",
    "memory",
    "MEMORY.md",
    "DREAMS.md",
    "code",
    ".DS_Store",
    ".rumdl_cache",
  ]).stdout.trim();
  if (localOnly) {
    errors.push("local-only files are tracked");
  }
  const docs = await Promise.all(
    ["AGENTS.md"].map(async (file) =>
      existsSync(join(root, file)) ? await Bun.file(join(root, file)).text() : "",
    ),
  );
  if (docs.some((text) => text.includes("git fetch upstream && git checkout main && git merge --ff-only upstream/main"))) {
    errors.push("raw workspace sync command is still documented; use scripts/sync-workspace.ts");
  }
  const close = runCommand([
    "grep",
    "-R",
    "-nE",
    "Close the issue|Close the PR|close the issue|close the PR|will be closed|linked and closed|redirected to SECURITY\\.md and closed|eventually closed|^### Closing stale",
    join(root, "skills"),
  ]);
  if (close.exitCode === 0) {
    const leftover = close.stdout.split("\n").filter((line) => line && !line.includes("core team member"));
    if (leftover.length) {
      errors.push("autonomous issue/PR close instruction found");
    }
  }
  errors.push(...validateWorkflowPolicy(root).map((error) => error.message));
  const templateRoot = mkdtempSync(join(tmpdir(), "albert-workflows-"));
  try {
    mkdirSync(join(templateRoot, ".github"), { recursive: true });
    cpSync(join(root, "skills/sdk-sync/templates/.github/workflows"), join(templateRoot, ".github/workflows"), {
      recursive: true,
    });
    errors.push(...validateWorkflowPolicy(templateRoot).map((error) => error.message));
  } finally {
    rmSync(templateRoot, { recursive: true, force: true });
  }
  return errors;
}

async function main() {
  const errors = await validateWorkspace();
  if (errors.length) {
    for (const error of errors) {
      console.error(`ERROR: ${error}`);
    }
    return 1;
  }
  console.log("Workspace validation passed");
  return 0;
}

if (import.meta.main) {
  process.exit(await main());
}
