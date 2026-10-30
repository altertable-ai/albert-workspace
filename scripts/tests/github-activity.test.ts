import { afterEach, describe, expect, test } from "bun:test";
import * as activity from "../github-activity.ts";

const SINCE = activity.timestamp("2026-10-12");
const UNTIL = activity.timestamp("2026-10-19");
const CONFIG = {
  workspace: { repo: "acme/workspace" },
  sdks: [{ repo: "acme/sdk" }],
  projects: [{ repo: "acme/app" }],
};

function item(number: number, repo = "acme/sdk", fields: Record<string, unknown> = {}) {
  return {
    number,
    repository_url: `https://api.github.com/repos/${repo}`,
    title: `Change ${number}`,
    html_url: `https://github.com/${repo}/issues/${number}`,
    ...fields,
  };
}

const originalApi = activity.deps.api;
const originalThreadPages = activity.deps.threadPages;

afterEach(() => {
  activity.deps.api = originalApi;
  activity.deps.threadPages = originalThreadPages;
});

describe("github-activity", () => {
  test("uses event dates and includes workspace and projects", () => {
    const responses = [
      [
        item(1, "acme/sdk", { created_at: "2026-10-01T12:00:00Z" }),
        item(2, "acme/workspace", { created_at: "2026-10-12T00:00:00Z" }),
        item(3, "acme/sdk", { created_at: "2026-10-19T00:00:00Z" }),
      ],
      [item(1, "acme/sdk", { pull_request: { merged_at: "2026-10-15T12:00:00Z" } })],
      [item(4, "acme/app", { closed_at: "2026-10-16T12:00:00Z" })],
      [],
    ];
    let index = 0;
    const queries: string[] = [];
    activity.deps.api = (endpoint, params = {}) => {
      if (endpoint === "search/issues") {
        queries.push(params.q ?? "");
        const items = responses[index] ?? [];
        index += 1;
        return [{ total_count: items.length, items }];
      }
      throw new Error(endpoint);
    };
    const report = activity.collect(CONFIG, "albert", SINCE, UNTIL);
    expect(report.opened_prs.map((row: { number: number }) => row.number)).toEqual([2]);
    expect(report.merged_prs.map((row: { number: number }) => row.number)).toEqual([1]);
    expect(report.closed_unmerged_prs.map((row: { number: number }) => row.number)).toEqual([4]);
    for (const query of queries) {
      for (const repo of ["acme/workspace", "acme/sdk", "acme/app"]) {
        expect(query).toContain(`repo:${repo}`);
      }
    }
    expect(queries[2]).toContain("is:unmerged");
  });

  test("merge timestamp fetched when search omits it", () => {
    let searchCalls = 0;
    activity.deps.api = (endpoint) => {
      if (endpoint === "search/issues") {
        searchCalls += 1;
        if (searchCalls === 2) {
          return [{ total_count: 1, items: [item(5)] }];
        }
        return [{ total_count: 0, items: [] }];
      }
      if (endpoint === "repos/acme/sdk/pulls/5") {
        return [{ merged_at: "2026-10-13T12:00:00Z" }];
      }
      throw new Error(endpoint);
    };
    const report = activity.collect(CONFIG, "albert", SINCE, UNTIL);
    expect(report.merged_prs[0].at).toBe("2026-10-13T12:00:00Z");
  });

  test("issue comments filter author date and keep later pages", () => {
    const queries: string[] = [];
    activity.deps.api = (endpoint, params = {}) => {
      if (endpoint === "search/issues") {
        queries.push(params.q ?? "");
        if (queries.length === 4) {
          return [{ total_count: 1, items: [item(6)] }];
        }
        return [{ total_count: 0, items: [] }];
      }
      throw new Error(endpoint);
    };
    activity.deps.threadPages = () => [
      [
        { user: { login: "someone" }, created_at: "2026-10-13T00:00:00Z" },
        { user: { login: "albert" }, created_at: "2026-10-11T23:59:59Z" },
      ],
      [
        {
          user: { login: "Albert" },
          created_at: "2026-10-18T23:59:59Z",
          html_url: "https://github.com/acme/sdk/issues/6#issuecomment-1",
        },
        { user: { login: "albert" }, created_at: "2026-10-19T00:00:00Z" },
      ],
    ];
    const report = activity.collect(CONFIG, "albert", SINCE, UNTIL);
    expect(report.issue_comments).toHaveLength(1);
    expect(report.issue_comments[0].url.endsWith("issuecomment-1")).toBe(true);
    expect(report.pr_reviews).toEqual([]);
    expect(queries.at(-1)).toContain("involves:albert");
    expect(queries.at(-1)).not.toContain("is:issue");
    expect(queries.at(-1)).toContain("updated:>=");
    expect(queries.at(-1)?.includes("..")).toBe(false);
  });

  test("PR comments and reviews are included", () => {
    const pr = item(9, "acme/sdk", {
      html_url: "https://github.com/acme/sdk/pull/9",
      pull_request: { url: "https://api.github.com/repos/acme/sdk/pulls/9" },
    });
    activity.deps.api = (endpoint) => {
      if (endpoint === "search/issues") {
        return [{ total_count: 0, items: [] }];
      }
      throw new Error(endpoint);
    };
    let searchCount = 0;
    activity.deps.api = (endpoint) => {
      if (endpoint === "search/issues") {
        searchCount += 1;
        return [{ total_count: searchCount === 4 ? 1 : 0, items: searchCount === 4 ? [pr] : [] }];
      }
      throw new Error(endpoint);
    };
    activity.deps.threadPages = (endpoint) => {
      if (endpoint.endsWith("/comments")) {
        return [[
          {
            user: { login: "albert" },
            created_at: "2026-10-13T12:00:00Z",
            html_url: "https://github.com/acme/sdk/pull/9#issuecomment-2",
          },
        ]];
      }
      if (endpoint.endsWith("/reviews")) {
        return [[
          {
            user: { login: "albert" },
            submitted_at: "2026-10-14T12:00:00Z",
            html_url: "https://github.com/acme/sdk/pull/9#pullrequestreview-3",
            state: "APPROVED",
          },
          { user: { login: "albert" }, submitted_at: null, state: "PENDING" },
          {
            user: { login: "other" },
            submitted_at: "2026-10-14T12:00:00Z",
            state: "COMMENTED",
          },
        ]];
      }
      throw new Error(endpoint);
    };
    const report = activity.collect(CONFIG, "albert", SINCE, UNTIL);
    expect(report.issue_comments[0].url.endsWith("issuecomment-2")).toBe(true);
    expect(report.pr_reviews[0].url.endsWith("pullrequestreview-3")).toBe(true);
    expect(report.pr_reviews[0].state).toBe("APPROVED");
    expect(report.pr_reviews).toHaveLength(1);
  });

  test("search keeps all pages and rejects partial results", () => {
    activity.deps.api = () => [
      { total_count: 101, items: [item(1)] },
      { total_count: 101, items: [item(2)] },
    ];
    expect(activity.search("query").map((row) => row.number)).toEqual([1, 2]);
    for (const page of [{ total_count: 1001 }, { total_count: 1, incomplete_results: true }]) {
      activity.deps.api = () => [page];
      expect(() => activity.search("query")).toThrow(/incomplete/);
    }
  });

  test("api reads all pages without shell interpolation", () => {
    const spawn = Bun.spawnSync;
    const calls: string[][] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Bun as any).spawnSync = (command: string[]) => {
      calls.push(command);
      return { exitCode: 0, stdout: Buffer.from("[]\n[]\n"), stderr: Buffer.from("") };
    };
    try {
      expect(activity.api("search/issues", { q: "repo:acme/sdk author:albert" })).toEqual([[], []]);
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Bun as any).spawnSync = spawn;
    }
    const command = calls[0];
    expect(command[command.indexOf("--method") + 1]).toBe("GET");
    expect(command).toContain("--paginate");
    expect(command).toContain("q=repo:acme/sdk author:albert");
  });

  test("api failure is not reported as empty activity", () => {
    const spawn = Bun.spawnSync;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Bun as any).spawnSync = () => ({
      exitCode: 1,
      stdout: Buffer.from(""),
      stderr: Buffer.from("rate limit exceeded"),
    });
    try {
      expect(() => activity.api("search/issues")).toThrow(/rate limit exceeded/);
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Bun as any).spawnSync = spawn;
    }
  });

  test("timezone and invalid input", () => {
    expect(activity.timestamp("2026-10-12T02:00:00+02:00").getTime()).toBe(SINCE.getTime());
    expect(() => activity.timestamp("2026-10-12T00:00:00")).toThrow();
    expect(() => activity.repositories({ sdks: [{ repo: "not a repository" }] })).toThrow();
  });
});
