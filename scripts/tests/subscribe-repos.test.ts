import { afterEach, describe, expect, test } from "bun:test";
import { reconcileSubscriptions } from "../subscribe-repos.ts";
import { GhError, gh } from "../lib/gh.ts";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const original = gh.json;
afterEach(() => {
  gh.json = original;
});

describe("subscribe-repos", () => {
  test("subscribes, skips missing, and unsubscribes extras", () => {
    const methods: string[] = [];
    gh.json = (request) => {
      methods.push(`${request.method ?? "GET"} ${request.endpoint}`);
      if (request.endpoint === "user") return { login: "albert20260301" };
      if (request.endpoint.startsWith("user/subscriptions")) {
        return [{ full_name: "altertable-ai/keep" }, { full_name: "altertable-ai/extra" }];
      }
      if (request.endpoint === "repos/altertable-ai/keep") return { full_name: "altertable-ai/keep" };
      if (request.endpoint === "repos/altertable-ai/new") return { full_name: "altertable-ai/new" };
      if (request.endpoint === "repos/altertable-ai/missing") throw new GhError(request, "404", 1);
      if (request.endpoint.endsWith("/subscription")) return {};
      throw new GhError(request, request.endpoint, 1);
    };
    const path = join(mkdtempSync(join(tmpdir(), "sub-")), "config.json");
    writeFileSync(
      path,
      JSON.stringify({
        workspace: { repo: "altertable-ai/keep" },
        sdks: [{ repo: "altertable-ai/new" }],
        projects: [{ repo: "altertable-ai/missing" }],
      }),
    );
    const result = reconcileSubscriptions(path);
    expect(result.already).toEqual(["altertable-ai/keep"]);
    expect(result.subscribed).toEqual(["altertable-ai/new"]);
    expect(result.skipped).toEqual(["altertable-ai/missing"]);
    expect(result.unsubscribed).toEqual(["altertable-ai/extra"]);
    expect(methods).toContain("PUT repos/altertable-ai/new/subscription");
    expect(methods).toContain("DELETE repos/altertable-ai/extra/subscription");
  });

  test("refuses to run as another GitHub user", () => {
    gh.json = () => ({ login: "someone-else" });
    expect(() => reconcileSubscriptions()).toThrow(/expected 'albert20260301'/);
  });
});
