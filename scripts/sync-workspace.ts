#!/usr/bin/env bun
/** Fast-forward Albert's live workspace checkout from upstream main. */

import { runCommand } from "./lib/gh.ts";

export function git(args: string[]) {
  const result = runCommand(["git", ...args]);
  if (result.exitCode) {
    throw new Error(result.stderr.trim() || result.stdout.trim() || `git ${args.join(" ")} failed`);
  }
  return result.stdout.trim();
}

export function pickRemote(remoteNames: string[], originUrl = ""): string {
  if (remoteNames.includes("upstream")) {
    return "upstream";
  }
  if (originUrl.includes("altertable-ai/albert-workspace")) {
    console.log("upstream remote not configured; using canonical origin");
    return "origin";
  }
  throw new Error(
    "upstream remote is not configured and origin is not canonical altertable-ai/albert-workspace.",
  );
}

export function resolveRemote(): string {
  const remotes = runCommand(["git", "remote"]).stdout.split("\n").map((name) => name.trim()).filter(Boolean);
  const origin = runCommand(["git", "remote", "get-url", "origin"]);
  return pickRemote(remotes, origin.exitCode === 0 ? origin.stdout : "");
}

export function syncWorkspace(): string {
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  const remote = resolveRemote();
  const dirty = runCommand(["git", "status", "--porcelain"]).stdout.trim();
  if (dirty) {
    throw new Error(`workspace has local changes; refusing to sync.\n${dirty}`);
  }
  if (branch !== "main") {
    throw new Error(
      `sync-workspace.ts only runs from main; current branch is ${branch}.\nSwitch to main when you want to refresh the control-plane checkout.`,
    );
  }
  git(["fetch", remote, `main:refs/remotes/${remote}/main`]);
  const localHead = git(["rev-parse", "HEAD"]);
  const remoteHead = git(["rev-parse", `${remote}/main`]);
  const mergeBase = git(["merge-base", "HEAD", `${remote}/main`]);
  if (localHead === remoteHead) {
    return `Workspace already up to date with ${remote}/main`;
  }
  if (localHead === mergeBase) {
    git(["merge", "--ff-only", `${remote}/main`]);
    return `Workspace synced with ${remote}/main`;
  }
  throw new Error(`local main diverged from ${remote}/main; refusing to merge.`);
}

async function main() {
  try {
    console.log(syncWorkspace());
    return 0;
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    return 1;
  }
}

if (import.meta.main) {
  process.exit(await main());
}
