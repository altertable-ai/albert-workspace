#!/usr/bin/env bun
/** Compare each API SDK's specs submodule pin to the latest spec tag. */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { GhError, gh, pagesOf } from "./lib/gh.ts";
import { loadInventory } from "./lib/inventory.ts";

const ROOT = resolve(import.meta.dir, "..");
const CACHE_FILE = resolve(ROOT, "code/.last-spec-tag");
const SPECS_REPO = "altertable-ai/altertable-client-specs";

export type SpecRow = {
  repo: string;
  pinned: string;
  latest: string;
  status: "OK" | "OUTDATED" | "MISSING" | "UNKNOWN" | "NOT_FOUND";
};

type SpecTag = { name: string; commit: { sha: string } };

export function collect(configPath = resolve(ROOT, "repositories.config.json")): SpecRow[] {
  const { specRepos } = loadInventory(configPath);
  const tags = pagesOf<SpecTag>(gh.json({ endpoint: `repos/${SPECS_REPO}/tags`, paginate: true }));
  const latest = tags[0];
  const latestSha = latest?.commit.sha ?? "unknown";
  const latestTag = latest?.name ?? "unknown";
  return specRepos.map((repo) => {
    try {
      gh.json({ endpoint: `repos/${repo}` });
    } catch (error) {
      if (error instanceof GhError) {
        console.error(error.message);
        return { repo, pinned: "(404)", latest: latestTag, status: "NOT_FOUND" as const };
      }
      throw error;
    }
    try {
      const tree = gh.json({ endpoint: `repos/${repo}/git/trees/HEAD` }) as {
        tree?: { path: string; sha: string }[];
      };
      const pinnedSha = tree.tree?.find((entry) => entry.path === "specs")?.sha;
      if (!pinnedSha) {
        return { repo, pinned: "(none)", latest: latestTag, status: "MISSING" as const };
      }
      const pinnedTag = tags.find((tag) => tag.commit.sha === pinnedSha || tag.commit.sha.startsWith(pinnedSha.slice(0, 8)))?.name;
      if (pinnedSha === latestSha) {
        return { repo, pinned: pinnedTag ?? pinnedSha, latest: latestTag, status: "OK" as const };
      }
      if (!pinnedTag) {
        return { repo, pinned: pinnedSha, latest: latestTag, status: "UNKNOWN" as const };
      }
      return { repo, pinned: pinnedTag, latest: latestTag, status: "OUTDATED" as const };
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      return { repo, pinned: "unknown", latest: latestTag, status: "UNKNOWN" as const };
    }
  });
}

export function formatRows(rows: SpecRow[], markdown: boolean): string {
  const latest = rows[0]?.latest ?? "unknown";
  if (!markdown) {
    const lines = [
      `${"REPOSITORY".padEnd(45)} ${"PINNED TAG".padEnd(20)} ${"LATEST TAG".padEnd(20)} STATUS`,
      `${"----------".padEnd(45)} ${"----------".padEnd(20)} ${"----------".padEnd(20)} ------`,
    ];
    for (const row of rows) {
      lines.push(
        `${row.repo.padEnd(45)} ${row.pinned.padEnd(20)} ${row.latest.padEnd(20)} ${row.status}`,
      );
    }
    return lines.join("\n");
  }
  const action = rows.filter((row) => ["OUTDATED", "MISSING", "UNKNOWN"].includes(row.status));
  const lines = [
    "## Spec Status Report",
    "",
    `Latest spec: \`${latest}\` in [\`altertable-client-specs\`](https://github.com/${SPECS_REPO})`,
    "",
  ];
  if (action.length) {
    lines.push("### Action required", "", "| Repository | Pinned | Status |", "|------------|--------|--------|");
    for (const row of action) {
      lines.push(`| \`${row.repo}\` | \`${row.status === "MISSING" ? "—" : row.pinned}\` | ${row.status} |`);
    }
    lines.push("");
  }
  const ok = rows.filter((row) => row.status === "OK");
  if (ok.length) {
    lines.push(`### Up to date (${ok.length}/${rows.length})`, "");
    for (const row of ok) {
      lines.push(`- \`${row.repo}\``);
    }
  }
  return lines.join("\n");
}

export function writeCache(tag: string, cacheFile = CACHE_FILE) {
  if (tag === "unknown") {
    return;
  }
  mkdirSync(dirname(cacheFile), { recursive: true });
  writeFileSync(cacheFile, `${tag}\n`);
}

export function quickUnchanged(tag: string, cacheFile = CACHE_FILE): boolean {
  return tag !== "unknown" && existsSync(cacheFile) && readFileSync(cacheFile, "utf8").trim() === tag;
}

async function main() {
  const argv = Bun.argv.slice(2);
  const markdown = argv.includes("--markdown");
  const quick = argv.includes("--quick");
  try {
    const latest = pagesOf<SpecTag>(gh.json({ endpoint: `repos/${SPECS_REPO}/tags`, paginate: true }))[0]?.name ?? "unknown";
    if (quick && quickUnchanged(latest)) {
      console.log(`Spec status: no change (latest ${latest})`);
      return 0;
    }
    const rows = collect();
    console.log(formatRows(rows, markdown));
    writeCache(latest);
    return rows.some((row) => ["OUTDATED", "MISSING", "UNKNOWN"].includes(row.status)) ? 1 : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
}

if (import.meta.main) {
  process.exit(await main());
}
