#!/usr/bin/env bun
/** Collect dated GitHub activity for a report. Requires Bun and gh. */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gh } from "./lib/gh.ts";

const ROOT = resolve(import.meta.dir, "..");
const MAX_INVOLVED_THREADS = 80;
const MAX_THREAD_PAGES = 3;

export function timestamp(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00Z`);
  }
  if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    throw new Error("timestamps must include a timezone, for example Z");
  }
  const parsed = Date.parse(value.replace("Z", "+00:00"));
  if (Number.isNaN(parsed)) {
    throw new Error("invalid timestamp");
  }
  return new Date(parsed);
}

export function iso(value: Date): string {
  return value.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function defaultApi(endpoint: string, params: Record<string, string> = {}): unknown {
  return gh.json({ endpoint, paginate: true, fields: params });
}

function defaultThreadPages(endpoint: string, params: Record<string, string> = {}): unknown[][] {
  const pages: unknown[][] = [];
  for (let page = 1; page <= MAX_THREAD_PAGES; page += 1) {
    const body = gh.json({
      endpoint,
      fields: { ...params, page: String(page), per_page: "100" },
    });
    const batch = Array.isArray(body) ? body : [];
    pages.push(batch);
    if (batch.length < 100) {
      break;
    }
  }
  return pages;
}

export const deps = {
  api: defaultApi,
  threadPages: defaultThreadPages,
};

export function api(endpoint: string, params: Record<string, string> = {}) {
  return deps.api(endpoint, params);
}

export function search(query: string) {
  const items: Record<string, unknown>[] = [];
  for (const page of api("search/issues", { q: query, per_page: "100" }) as Record<string, unknown>[]) {
    if (page.incomplete_results || Number(page.total_count) > 1000) {
      throw new Error("GitHub search is incomplete; retry with a shorter period");
    }
    items.push(...((page.items as Record<string, unknown>[]) ?? []));
  }
  return items;
}

export type ActivityItem = {
  repo: string;
  number: number;
  title: string;
  url: string;
  at: string;
  state?: string;
};

export type ActivityReport = {
  since: string;
  until_exclusive: string;
  author: string;
  repositories: string[];
  opened_prs: ActivityItem[];
  merged_prs: ActivityItem[];
  closed_unmerged_prs: ActivityItem[];
  issue_comments: ActivityItem[];
  pr_reviews: ActivityItem[];
};

export function repositories(config: Record<string, unknown>) {
  const entries = [
    ...((config.sdks as { repo: string }[]) ?? []),
    ...((config.projects as { repo: string }[]) ?? []),
  ];
  if (config.workspace) {
    entries.push(config.workspace as { repo: string });
  }
  const repos = [...new Set(entries.map((entry) => entry.repo))].sort();
  if (!repos.length || repos.some((repo) => !/^[\w.-]+\/[\w.-]+$/.test(repo))) {
    throw new Error("repository list must contain valid owner/repository names");
  }
  return repos;
}

export function collect(
  config: Record<string, unknown>,
  author: string,
  since: Date,
  until: Date,
): ActivityReport {
  const repos = repositories(config);
  const repoSet = new Set(repos);
  const scope = repos.map((repo) => `repo:${repo}`).join(" ");
  const inPeriod = (value?: string | null) =>
    Boolean(value) && since <= timestamp(value!) && timestamp(value!) < until;
  const repoOf = (item: Record<string, unknown>) =>
    String(item.repository_url).split("/").slice(-2).join("/");

  const report: ActivityReport = {
    since: iso(since),
    until_exclusive: iso(until),
    author,
    repositories: repos,
    opened_prs: [],
    merged_prs: [],
    closed_unmerged_prs: [],
    issue_comments: [],
    pr_reviews: [],
  };

  const events = [
    ["opened_prs", "created", "", "created_at"],
    ["merged_prs", "merged", "is:merged", "merged_at"],
    ["closed_unmerged_prs", "closed", "is:unmerged", "closed_at"],
  ] as const;

  for (const [group, qualifier, extra, field] of events) {
    const query = `${scope} is:pr author:${author} ${extra} ${qualifier}:${iso(since)}..${iso(until)}`;
    for (const item of search(query)) {
      const repo = repoOf(item);
      if (!repoSet.has(repo)) {
        continue;
      }
      let value: string | undefined;
      if (field === "merged_at") {
        value = (item.pull_request as { merged_at?: string } | undefined)?.merged_at;
        if (!value) {
          const pages = api(`repos/${repo}/pulls/${item.number}`) as { merged_at: string }[];
          value = pages[0].merged_at;
        }
      } else {
        value = item[field] as string;
      }
      if (inPeriod(value)) {
        report[group].push({
          repo,
          number: Number(item.number),
          title: String(item.title),
          url: String(item.html_url),
          at: value,
        });
      }
    }
  }

  const query = `${scope} involves:${author} updated:>=${iso(since)}`;
  const involved = search(query);
  if (involved.length > MAX_INVOLVED_THREADS) {
    throw new Error("GitHub search is incomplete; retry with a shorter period");
  }
  for (const item of involved) {
    const repo = repoOf(item);
    if (!repoSet.has(repo)) {
      continue;
    }
    const commentPages = deps.threadPages(`repos/${repo}/issues/${item.number}/comments`, {
      since: iso(since),
    });
    for (const page of commentPages) {
      for (const comment of page as Record<string, unknown>[]) {
        const login = String((comment.user as { login?: string } | undefined)?.login ?? "");
        if (login.toLowerCase() === author.toLowerCase() && inPeriod(comment.created_at as string)) {
          report.issue_comments.push({
            repo,
            number: Number(item.number),
            title: String(item.title),
            url: String(comment.html_url),
            at: String(comment.created_at),
          });
        }
      }
    }
    if (!item.pull_request) {
      continue;
    }
    const reviewPages = deps.threadPages(`repos/${repo}/pulls/${item.number}/reviews`, {});
    for (const page of reviewPages) {
      for (const review of page as Record<string, unknown>[]) {
        const login = String((review.user as { login?: string } | undefined)?.login ?? "");
        const submitted = review.submitted_at as string | undefined;
        if (login.toLowerCase() === author.toLowerCase() && submitted && inPeriod(submitted)) {
          report.pr_reviews.push({
            repo,
            number: Number(item.number),
            title: String(item.title),
            url: String(review.html_url || item.html_url),
            at: submitted,
            state: String(review.state),
          });
        }
      }
    }
  }

  for (const group of ["opened_prs", "merged_prs", "closed_unmerged_prs", "issue_comments", "pr_reviews"] as const) {
    report[group].sort((a, b) =>
      a.at === b.at ? a.url.localeCompare(b.url) : a.at.localeCompare(b.at),
    );
  }
  return report;
}

function argValue(flag: string, argv: string[]) {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

async function main() {
  const argv = Bun.argv.slice(2);
  try {
    const author = argValue("--author", argv) ?? "albert20260301";
    if (!/^[\w-]+$/.test(author)) {
      throw new Error("author must be a GitHub login");
    }
    const until = argValue("--until", argv) ? timestamp(argValue("--until", argv)!) : new Date();
    const since = argValue("--since", argv)
      ? timestamp(argValue("--since", argv)!)
      : new Date(until.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (since >= until) {
      throw new Error("since must be earlier than until");
    }
    const configPath = resolve(argValue("--config", argv) ?? `${ROOT}/repositories.config.json`);
    const report = collect(JSON.parse(readFileSync(configPath, "utf8")), author, since, until);
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Activity report failed: ${message}`);
    return 1;
  }
  return 0;
}

if (import.meta.main) {
  process.exit(await main());
}
