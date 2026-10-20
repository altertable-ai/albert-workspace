#!/usr/bin/env bun
/** Ecosystem health: spec pins, open PRs/issues, and default-branch CI. */

import { resolve } from "node:path";
import { GhError, gh, pagesOf } from "./lib/gh.ts";
import { loadInventory } from "./lib/inventory.ts";

const ROOT = resolve(import.meta.dir, "..");
const SPECS_REPO = "altertable-ai/altertable-client-specs";

export type RepoStatus = {
  repo: string;
  spec: string;
  open_prs: string;
  open_issues: string;
  ci: string;
};

export type Report = {
  generated_at: string;
  spec_latest: string;
  repos: RepoStatus[];
};

type SpecTag = { name: string; commit: { sha: string } };
type CheckRun = { status: string; conclusion?: string | null };

function argValue(flag: string, argv: string[]) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

function countOpen(endpoint: string, keep: (item: Record<string, unknown>) => boolean): string {
  let page = 1;
  let total = 0;
  while (true) {
    const separator = endpoint.includes("?") ? "&" : "?";
    const items = gh.json({
      endpoint: `${endpoint}${separator}per_page=100&page=${page}`,
    }) as Record<string, unknown>[] | null;
    if (!Array.isArray(items)) {
      throw new Error(`${endpoint} did not return a list`);
    }
    total += items.filter(keep).length;
    if (items.length < 100) {
      return String(total);
    }
    page += 1;
  }
}

function ciState(repo: string, ref: string): string {
  const commit = gh.json({ endpoint: `repos/${repo}/commits/${ref}` }) as { sha?: string };
  const sha = commit?.sha;
  if (!sha) {
    return "unknown";
  }
  const pages = pagesOf<{ check_runs?: CheckRun[] }>(
    gh.json({ endpoint: `repos/${repo}/commits/${sha}/check-runs?per_page=100`, paginate: true }),
  );
  const runs = pages.flatMap((page) => page.check_runs ?? []);
  if (runs.length === 0) {
    const status = gh.json({ endpoint: `repos/${repo}/commits/${ref}/status` }) as { state?: string };
    return status?.state ?? "unknown";
  }
  if (runs.some((run) => run.status !== "completed")) {
    return "pending";
  }
  if (runs.some((run) => !["success", "skipped", "neutral"].includes(run.conclusion ?? ""))) {
    return "failure";
  }
  return "success";
}

export function collect(configPath: string, now = new Date()): Report {
  const { repos, specRepos } = loadInventory(configPath);
  const specSet = new Set(specRepos);
  let specTags: SpecTag[] = [];
  if (specRepos.length) {
    specTags = pagesOf<SpecTag>(gh.json({ endpoint: `repos/${SPECS_REPO}/tags`, paginate: true }));
  }
  const latest = specTags[0];
  const rows: RepoStatus[] = [];
  for (const repo of repos) {
    try {
      const info = gh.json({ endpoint: `repos/${repo}` }) as { default_branch?: string };
      let spec = "N/A";
      if (specSet.has(repo)) {
        if (!latest?.commit.sha) {
          spec = "UNKNOWN";
        } else {
          try {
            const tree = gh.json({ endpoint: `repos/${repo}/git/trees/HEAD` }) as {
              tree?: { path: string; sha: string }[];
            };
            const pinned = tree.tree?.find((entry) => entry.path === "specs")?.sha;
            if (pinned == null) {
              spec = "MISSING";
            } else if (pinned === latest.commit.sha) {
              spec = "OK";
            } else {
              const tag = specTags.find((entry) => entry.commit.sha === pinned)?.name;
              spec = tag ? `OUTDATED (${tag})` : "UNKNOWN";
            }
          } catch (error) {
            console.error(error instanceof Error ? error.message : error);
            spec = "UNKNOWN";
          }
        }
      }
      rows.push({
        repo,
        spec,
        open_prs: countOpen(`repos/${repo}/pulls?state=open`, () => true),
        open_issues: countOpen(
          `repos/${repo}/issues?state=open`,
          (item) => !item.pull_request,
        ),
        ci: ciState(repo, info.default_branch ?? "main"),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error(detail);
      rows.push({ repo, spec: "UNAVAILABLE", open_prs: "-", open_issues: "-", ci: "-" });
    }
  }
  return {
    generated_at: now.toISOString().replace(/\.\d{3}Z$/, "Z"),
    spec_latest: latest?.name ?? "unknown",
    repos: rows,
  };
}

export function formatReport(report: Report, format: "json" | "markdown" | "table"): string {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }
  if (format === "markdown") {
    const specIcon = (spec: string) => {
      if (spec === "OK") return "✅";
      if (spec === "MISSING") return "❌";
      if (spec.startsWith("OUTDATED")) return "⚠️";
      if (spec === "N/A") return "—";
      return "❓";
    };
    const ciIcon = (ci: string) => {
      if (ci === "success") return "✅";
      if (ci === "failure") return "❌";
      if (ci === "pending") return "🔄";
      if (ci === "-") return "-";
      return "❓";
    };
    const lines = [
      "## Ecosystem Status",
      "",
      `_Generated: ${report.generated_at}_`,
      "",
      `Latest spec: \`${report.spec_latest}\``,
      "",
      "| Repository | API spec | Open PRs | Open Issues | CI |",
      "|------------|------|----------|-------------|-----|",
    ];
    for (const row of report.repos) {
      const name = row.repo.split("/")[1];
      lines.push(
        `| [\`${name}\`](https://github.com/${row.repo}) | ${specIcon(row.spec)} ${row.spec} | ${row.open_prs} | ${row.open_issues} | ${ciIcon(row.ci)} ${row.ci} |`,
      );
    }
    return lines.join("\n");
  }
  const lines = [
    `${"REPOSITORY".padEnd(45)} ${"API SPEC".padEnd(22)} ${"OPEN PRS".padStart(8)} ${"OPEN ISSUES".padStart(13)} ${"CI".padStart(10)}`,
    `${"----------".padEnd(45)} ${"----".padEnd(22)} ${"--------".padStart(8)} ${"-----------".padStart(13)} ${"--".padStart(10)}`,
  ];
  for (const row of report.repos) {
    lines.push(
      `${row.repo.padEnd(45)} ${row.spec.padEnd(22)} ${row.open_prs.padStart(8)} ${row.open_issues.padStart(13)} ${row.ci.padStart(10)}`,
    );
  }
  lines.push("", `Generated: ${report.generated_at}`);
  return lines.join("\n");
}

async function main() {
  const argv = Bun.argv.slice(2);
  const format = argv.includes("--json") ? "json" : argv.includes("--markdown") ? "markdown" : "table";
  const configPath = resolve(argValue("--config", argv) ?? `${ROOT}/repositories.config.json`);
  try {
    const report = collect(configPath);
    console.log(formatReport(report, format));
  } catch (error) {
    if (!(error instanceof GhError)) {
      console.error(error instanceof Error ? error.message : error);
    } else {
      console.error(error.message);
    }
    return 1;
  }
  return 0;
}

if (import.meta.main) {
  process.exit(await main());
}
