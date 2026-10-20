import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkWorkflowText, validateWorkflowPolicy } from "../validate-workflow-policy.ts";

describe("workflow policy", () => {
  test("rejects unpinned actions and floating Ubuntu runners", () => {
    const errors = checkWorkflowText(
      "runs-on: ubuntu-latest\n    uses: actions/checkout@v4\n",
      "ci.yml",
    );
    expect(errors.map((error) => error.message).join("\n")).toContain("ubuntu-24.04");
    expect(errors.map((error) => error.message).join("\n")).toContain("not pinned");
  });

  test("accepts a pinned Ubuntu 24.04 workflow", () => {
    expect(
      checkWorkflowText(
        "runs-on: ubuntu-24.04\n      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1\n",
        "ci.yml",
      ),
    ).toEqual([]);
  });

  test("requires bun-version-file when setup-bun is used", () => {
    const root = mkdtempSync(join(tmpdir(), "wf-"));
    mkdirSync(join(root, ".github/workflows"), { recursive: true });
    writeFileSync(
      join(root, ".github/workflows/ci.yml"),
      "runs-on: ubuntu-24.04\n      - uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6\n",
    );
    const errors = validateWorkflowPolicy(root).map((error) => error.message).join("\n");
    expect(errors).toContain(".bun-version");
    expect(errors).toContain("bun-version-file");
  });
});
