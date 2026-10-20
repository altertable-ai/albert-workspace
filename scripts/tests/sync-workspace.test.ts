import { describe, expect, test } from "bun:test";
import { git, pickRemote } from "../sync-workspace.ts";

describe("sync-workspace helpers", () => {
  test("git throws the stderr from a failed command", () => {
    expect(() => git(["rev-parse", "refs/does-not-exist"])).toThrow();
  });

  test("pickRemote prefers upstream, then canonical origin", () => {
    expect(pickRemote(["origin", "upstream"])).toBe("upstream");
    expect(pickRemote(["origin"], "https://github.com/altertable-ai/albert-workspace.git")).toBe(
      "origin",
    );
    expect(() => pickRemote(["origin"], "https://github.com/someone/fork.git")).toThrow(/canonical/);
  });
});
