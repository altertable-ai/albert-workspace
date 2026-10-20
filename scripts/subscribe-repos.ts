#!/usr/bin/env bun
/** Reconcile GitHub watch subscriptions with repositories.config.json. */

import { resolve } from "node:path";
import { gh } from "./lib/gh.ts";
import { loadInventory } from "./lib/inventory.ts";

const ROOT = resolve(import.meta.dir, "..");
const EXPECTED_USER = "albert20260301";

export type SubscribeResult = {
  subscribed: string[];
  already: string[];
  skipped: string[];
  unsubscribed: string[];
  failed: { repo: string; error: string }[];
};

export function currentUser(): string {
  const user = gh.json({ endpoint: "user" }) as { login?: string };
  return user.login ?? "";
}

export function watchedAltertableRepos(): string[] {
  const watched: string[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const batch = gh.json({ endpoint: `user/subscriptions?per_page=100&page=${page}` }) as { full_name?: string }[];
    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }
    watched.push(
      ...batch.map((repo) => repo.full_name ?? "").filter((name) => name.startsWith("altertable-ai/")),
    );
    if (batch.length < 100) {
      break;
    }
  }
  return watched;
}

export function reconcileSubscriptions(configPath = resolve(ROOT, "repositories.config.json")): SubscribeResult {
  const user = currentUser();
  if (user !== EXPECTED_USER) {
    throw new Error(
      `gh CLI is authenticated as '${user}', expected '${EXPECTED_USER}'.\nSwitch accounts with: gh auth switch --user ${EXPECTED_USER}`,
    );
  }
  const wanted = loadInventory(configPath).repos;
  const watched = watchedAltertableRepos();
  const result: SubscribeResult = {
    subscribed: [],
    already: [],
    skipped: [],
    unsubscribed: [],
    failed: [],
  };
  for (const repo of wanted) {
    if (watched.includes(repo)) {
      result.already.push(repo);
      continue;
    }
    try {
      gh.json({ endpoint: `repos/${repo}` });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      result.skipped.push(repo);
      continue;
    }
    try {
      gh.json({
        endpoint: `repos/${repo}/subscription`,
        method: "PUT",
        fields: { subscribed: "true", ignored: "false" },
      });
      result.subscribed.push(repo);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      result.failed.push({ repo, error: message });
    }
  }
  for (const repo of watched.filter((name) => !wanted.includes(name))) {
    try {
      gh.json({ endpoint: `repos/${repo}/subscription`, method: "DELETE" });
      result.unsubscribed.push(repo);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      result.failed.push({ repo, error: message });
    }
  }
  return result;
}

function printResult(result: SubscribeResult) {
  console.log(`==> Subscribing (${result.subscribed.length + result.already.length + result.skipped.length} repos in config)`);
  for (const repo of result.already) console.log(`  · ${repo} (already watching)`);
  for (const repo of result.skipped) console.log(`  ⊘ ${repo} (repo does not exist yet)`);
  for (const repo of result.subscribed) console.log(`  ✓ ${repo}`);
  if (result.unsubscribed.length) {
    console.log(`\n==> Unsubscribing (${result.unsubscribed.length} repos removed from config)`);
    for (const repo of result.unsubscribed) console.log(`  ✓ ${repo} (unsubscribed)`);
  }
  console.log("\n── Summary ──────────────────────────────────────────────────────────────────");
  if (result.subscribed.length) console.log(`  Subscribed      : ${result.subscribed.length}`);
  if (result.already.length) console.log(`  Already watching: ${result.already.length}`);
  if (result.skipped.length) console.log(`  Skipped (not yet created): ${result.skipped.length}`);
  if (result.unsubscribed.length) console.log(`  Unsubscribed    : ${result.unsubscribed.length}`);
  if (result.failed.length) console.log(`  Failed          : ${result.failed.length}`);
  console.log("");
  if (result.failed.length) {
    throw new Error(`${result.failed.length} operation(s) failed`);
  }
  console.log("✓ Subscriptions are in sync");
}

async function main() {
  try {
    printResult(reconcileSubscriptions());
    return 0;
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    return 1;
  }
}

if (import.meta.main) {
  process.exit(await main());
}
