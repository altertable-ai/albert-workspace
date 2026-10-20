import { afterEach, describe, expect, test } from "bun:test";
import { collect } from "../spec-status.ts";
import { GhError, gh } from "../lib/gh.ts";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const original = gh.json;
afterEach(() => {
  gh.json = original;
});

describe("spec-status", () => {
  test("marks outdated, missing, and ok pins", () => {
    gh.json = (request) => {
      if (request.endpoint.includes("/tags")) {
        return [[{ name: "v2.0.0", commit: { sha: "latest" } }, { name: "v1.0.0", commit: { sha: "old" } }]];
      }
      if (request.endpoint === "repos/acme/ok") return { full_name: "acme/ok" };
      if (request.endpoint === "repos/acme/old") return { full_name: "acme/old" };
      if (request.endpoint === "repos/acme/missing") return { full_name: "acme/missing" };
      if (request.endpoint === "repos/acme/gone") throw new GhError(request, "404", 1);
      if (request.endpoint === "repos/acme/ok/git/trees/HEAD") return { tree: [{ path: "specs", sha: "latest" }] };
      if (request.endpoint === "repos/acme/old/git/trees/HEAD") return { tree: [{ path: "specs", sha: "old" }] };
      if (request.endpoint === "repos/acme/missing/git/trees/HEAD") return { tree: [] };
      throw new GhError(request, request.endpoint, 1);
    };
    const path = join(mkdtempSync(join(tmpdir(), "spec-")), "config.json");
    writeFileSync(
      path,
      JSON.stringify({
        sdks: [
          { repo: "acme/ok", kind: "lakehouse" },
          { repo: "acme/old", kind: "lakehouse" },
          { repo: "acme/missing", kind: "product-analytics" },
          { repo: "acme/gone", kind: "lakehouse" },
          { repo: "acme/tool", kind: "tooling" },
        ],
      }),
    );
    const rows = Object.fromEntries(collect(path).map((row) => [row.repo, row]));
    expect(rows["acme/ok"].status).toBe("OK");
    expect(rows["acme/old"].status).toBe("OUTDATED");
    expect(rows["acme/missing"].status).toBe("MISSING");
    expect(rows["acme/gone"].status).toBe("NOT_FOUND");
    expect(rows["acme/tool"]).toBeUndefined();
  });
});
