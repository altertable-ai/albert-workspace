import { afterEach, describe, expect, test } from "bun:test";
import { collect } from "../ecosystem-status.ts";
import { GhError, gh } from "../lib/gh.ts";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const original = gh.json;

afterEach(() => {
  gh.json = original;
});

const config = {
  workspace: { repo: "acme/workspace" },
  sdks: [
    { repo: "acme/sdk", kind: "lakehouse" },
    { repo: "acme/tool", kind: "tooling" },
  ],
  projects: [
    { repo: "acme/app", kind: "runtime" },
    { repo: "acme/tool", kind: "tooling" },
  ],
};

function fixtures(overrides: Record<string, unknown> = {}) {
  const responses: Record<string, unknown> = {
    "repos/altertable-ai/altertable-client-specs/tags": [
      { name: "v2.0.0", commit: { sha: "latest-commit" } },
      { name: "v1.0.0", commit: { sha: "older-commit" } },
    ],
    "repos/acme/sdk/git/trees/HEAD": { tree: [{ path: "specs", sha: "latest-commit" }] },
  };
  for (const repo of ["acme/workspace", "acme/sdk", "acme/tool", "acme/app"]) {
    responses[`repos/${repo}`] = { full_name: repo, default_branch: "main" };
    responses[`repos/${repo}/pulls?state=open&per_page=100&page=1`] = [];
    responses[`repos/${repo}/issues?state=open&per_page=100&page=1`] = [];
    responses[`repos/${repo}/commits/main`] = { sha: "head-commit" };
    responses[`repos/${repo}/commits/head-commit/check-runs?per_page=100`] = {
      total_count: 1,
      check_runs: [{ status: "completed", conclusion: "success" }],
    };
  }
  Object.assign(responses, overrides);
  return responses;
}

function install(responses: Record<string, unknown>) {
  const calls: string[] = [];
  gh.json = (request) => {
    calls.push(request.endpoint);
    if (!(request.endpoint in responses)) {
      throw new GhError(request, `Unexpected request: ${request.endpoint}`, 1);
    }
    const value = responses[request.endpoint];
    if (value && typeof value === "object" && "error" in (value as object)) {
      throw new GhError(request, String((value as { error: string }).error), 1);
    }
    if (request.paginate && value && typeof value === "object" && "_pages" in (value as object)) {
      return (value as { _pages: unknown })._pages;
    }
    return request.paginate ? [value] : value;
  };
  return calls;
}

function configFile() {
  const path = join(mkdtempSync(join(tmpdir(), "eco-")), "config.json");
  writeFileSync(path, JSON.stringify(config));
  return path;
}

describe("ecosystem-status", () => {
  test("all configured repositories and only API SDKs need specs", () => {
    const calls = install(fixtures());
    const report = collect(configFile());
    const repos = Object.fromEntries(report.repos.map((row) => [row.repo, row]));
    expect(new Set(Object.keys(repos))).toEqual(new Set(["acme/workspace", "acme/sdk", "acme/tool", "acme/app"]));
    expect(repos["acme/sdk"].spec).toBe("OK");
    for (const repo of ["acme/workspace", "acme/tool", "acme/app"]) {
      expect(repos[repo].spec).toBe("N/A");
      expect(calls.some((endpoint) => endpoint.includes(`repos/${repo}/git/trees`))).toBe(false);
    }
    expect(calls.some((endpoint) => endpoint.includes("git/ref/tags"))).toBe(false);
  });

  test("issues after a full page of PRs are counted", () => {
    const responses = fixtures({
      "repos/acme/app/issues?state=open&per_page=100&page=1": Array.from({ length: 100 }, () => ({
        pull_request: { url: "a-pr" },
      })),
      "repos/acme/app/issues?state=open&per_page=100&page=2": [{ number: 101 }],
    });
    install(responses);
    const repos = Object.fromEntries(collect(configFile()).repos.map((row) => [row.repo, row]));
    expect(repos["acme/app"].open_issues).toBe("1");
  });

  test("failed requests are unavailable not zero or missing", () => {
    install(
      fixtures({
        "repos/acme/app": { error: "network error" },
        "repos/acme/sdk/git/trees/HEAD": { error: "request failed" },
      }),
    );
    const repos = Object.fromEntries(collect(configFile()).repos.map((row) => [row.repo, row]));
    expect(repos["acme/app"].spec).toBe("UNAVAILABLE");
    expect(repos["acme/app"].open_prs).toBe("-");
    expect(repos["acme/sdk"].spec).toBe("UNKNOWN");
  });

  test("checks on later pages can fail or still be pending", () => {
    const firstPage = {
      total_count: 101,
      check_runs: Array.from({ length: 100 }, () => ({ status: "completed", conclusion: "success" })),
    };
    for (const [status, conclusion, expected] of [
      ["completed", "failure", "failure"],
      ["in_progress", null, "pending"],
    ] as const) {
      install(
        fixtures({
          "repos/acme/app/commits/head-commit/check-runs?per_page=100": {
            _pages: [firstPage, { total_count: 101, check_runs: [{ status, conclusion }] }],
          },
        }),
      );
      const repos = Object.fromEntries(collect(configFile()).repos.map((row) => [row.repo, row]));
      expect(repos["acme/app"].ci).toBe(expected);
    }
  });

  test("tooling-only inventory does not fetch specs", () => {
    const path = join(mkdtempSync(join(tmpdir(), "eco-")), "config.json");
    writeFileSync(
      path,
      JSON.stringify({ ...config, sdks: [{ repo: "acme/tool", kind: "tooling" }] }),
    );
    const calls = install(fixtures());
    const report = collect(path);
    expect(report.repos.every((row) => row.spec === "N/A")).toBe(true);
    expect(calls.some((endpoint) => endpoint.includes("altertable-client-specs"))).toBe(false);
  });
});
