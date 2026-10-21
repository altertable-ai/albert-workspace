import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  extractCronCreateCommands,
  mergeDummyGatewayConfig,
  nodeSatisfiesOpenClaw,
  parseExampleConfig,
  readOpenClawPin,
  splitCommand,
} from "../openclaw-check.ts";

describe("openclaw-check helpers", () => {
  test("reads the npm version and CLI revision pin", () => {
    expect(readOpenClawPin("2026.10.5\n1b58cb9\n")).toEqual({ npm: "2026.10.5", revision: "1b58cb9" });
    expect(() => readOpenClawPin("2026.10.5\n")).toThrow("openclaw/VERSION");
  });

  test("parses the example JSON5 object", () => {
    const parsed = parseExampleConfig(`
// comment
{
  agents: {
    defaults: { skipBootstrap: true },
    entries: { main: { identity: { name: "Albert" } } },
  },
}
`);
    expect((parsed.agents as { defaults: { skipBootstrap: boolean } }).defaults.skipBootstrap).toBe(true);
    const example = parseExampleConfig(
      readFileSync(resolve(import.meta.dir, "../../openclaw/albert.config.example.json5"), "utf8"),
    );
    expect((example.agents as { defaults: { skipBootstrap: boolean } }).defaults.skipBootstrap).toBe(true);
  });

  test("extracts the two HOST.md cron create commands", () => {
    const commands = extractCronCreateCommands(`
# host
\`\`\`bash
openclaw cron create "0 8 * * *" \\
  --name "Albert daily full sync" \\
  --no-deliver \\
  --message "sync"

openclaw cron create "0 9 * * 5" \\
  --name "Albert weekly report" \\
  --announce \\
  --channel slack \\
  --to "<SLACK_CHANNEL_ID>" \\
  --message "report"
\`\`\`
`);
    expect(commands).toHaveLength(2);
    expect(commands[0]).toContain("--no-deliver");
    expect(commands[1]).toContain("--channel slack");
    expect(splitCommand(commands[0])).toEqual([
      "openclaw",
      "cron",
      "create",
      "0 8 * * *",
      "--name",
      "Albert daily full sync",
      "--no-deliver",
      "--message",
      "sync",
    ]);
  });

  test("rejects the wrong number of cron create commands", () => {
    expect(() => extractCronCreateCommands("```bash\necho hi\n```")).toThrow("exactly two");
  });

  test("merges dummy gateway keys without adding entry skipBootstrap", () => {
    const merged = mergeDummyGatewayConfig(
      { agents: { defaults: { skipBootstrap: true }, entries: { main: { identity: { name: "Albert" } } } } },
      "/tmp/ws",
      19001,
    );
    const main = (merged.agents as { entries: { main: Record<string, unknown> } }).entries.main;
    expect(main.workspace).toBe("/tmp/ws");
    expect(main.skipBootstrap).toBeUndefined();
    expect((merged.gateway as { port: number }).port).toBe(19001);
  });

  test("accepts OpenClaw's Node range", () => {
    expect(nodeSatisfiesOpenClaw("v24.16.0")).toBe(true);
    expect(nodeSatisfiesOpenClaw("v22.14.0")).toBe(false);
    expect(nodeSatisfiesOpenClaw("v26.1.0")).toBe(true);
  });
});
