import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  mergeDummyGatewayConfig,
  nodeSatisfiesOpenClaw,
  parseExampleConfig,
  readOpenClawPin,
} from "../openclaw-check.ts";
import {
  albertCronJobs,
  cronJobArgv,
  findListedJob,
  parseCronList,
  reportSlackChannel,
} from "../openclaw-jobs.ts";

describe("openclaw-check helpers", () => {
  test("reads the npm version and CLI revision pin", () => {
    expect(readOpenClawPin("2026.10.5\n1b58cb9\n")).toEqual({ npm: "2026.10.5", revision: "1b58cb9" });
    expect(() => readOpenClawPin("2026.10.5\n")).toThrow("openclaw/VERSION");
  });

  test("parses the example JSON5 object", () => {
    const example = parseExampleConfig(
      readFileSync(resolve(import.meta.dir, "../../openclaw/albert.config.example.json5"), "utf8"),
    );
    expect((example.agents as { defaults: { skipBootstrap: boolean } }).defaults.skipBootstrap).toBe(true);
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

describe("openclaw jobs", () => {
  test("requires the weekly Slack channel env", () => {
    expect(() => reportSlackChannel({})).toThrow("ALBERT_REPORT_SLACK_CHANNEL");
    expect(reportSlackChannel({ ALBERT_REPORT_SLACK_CHANNEL: " C123 " })).toBe("C123");
  });

  test("defines daily no-deliver and weekly Slack announce jobs", () => {
    const [daily, weekly] = albertCronJobs("C0ALBERTCHECK");
    expect(daily.noDeliver).toBe(true);
    expect(cronJobArgv(daily, "create")).toContain("--no-deliver");
    expect(weekly.announce).toBe(true);
    expect(cronJobArgv(weekly, "create")).toEqual(expect.arrayContaining(["--announce", "--channel", "slack", "--to", "C0ALBERTCHECK"]));
    expect(findListedJob(parseCronList('{"jobs":[{"id":"1","name":"Albert daily full sync"}]}'), daily)?.id).toBe("1");
  });
});
