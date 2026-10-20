import { describe, expect, test } from "bun:test";
import { git, resolveRemote } from "../sync-workspace.ts";
import { runCommand } from "../lib/gh.ts";

describe("sync-workspace helpers", () => {
  test("git throws the stderr from a failed command", () => {
    expect(() => git(["rev-parse", "refs/does-not-exist"])).toThrow();
  });

  test("resolveRemote prefers upstream when it exists", () => {
    const remotes = runCommand(["git", "remote"]).stdout.split("\n");
    if (remotes.includes("upstream")) {
      expect(resolveRemote()).toBe("upstream");
    } else {
      expect(["origin", "upstream"]).toContain(resolveRemote());
    }
  });
});
