import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import example from "../../schemas/heartbeat-state.example.json";
import {
  REQUIRED,
  QUEUES,
  canAsk,
  due,
  timestamp,
  validate,
} from "../heartbeat-state.ts";

const SCRIPT = join(import.meta.dir, "../heartbeat-state.ts");
const original = structuredClone(example);

function clone<T>(value: T): T {
  return structuredClone(value);
}

describe("heartbeat-state", () => {

  test("existing entries remain valid and due", () => {
    const state = clone(example) as Record<string, unknown>;
    for (const queue of QUEUES) {
      state[queue] = (state[queue] as Record<string, unknown>[]).map((entry) =>
        Object.fromEntries(Object.entries(entry).filter(([key]) => REQUIRED.has(key))),
      );
    }
    validate(state);
    const result = due(state, timestamp("2026-07-01T00:00:00Z"));
    expect(result).toHaveLength(3);
    expect(result.every((item) => item.action === "act")).toBe(true);
  });

  test("waiting items stay quiet until their check time", () => {
    const result = due(example, timestamp("2026-07-01T14:00:00+02:00"));
    expect(result.map((item) => [item.queue, item.action])).toEqual([
      ["retry_queue", "act"],
      ["blockers", "stay_quiet"],
      ["deferred", "stay_quiet"],
    ]);
    expect(result[0]).toHaveProperty("promise");
    expect(result[0]).toHaveProperty("evidence");
    expect(result[0]).toHaveProperty("done_when");
  });

  test("open asks stay quiet until default_at then apply_default", () => {
    const quiet = due(example, timestamp("2026-07-08T06:59:59Z"));
    expect(quiet.find((item) => item.queue === "blockers")?.action).toBe("stay_quiet");
    const ready = due(example, timestamp("2026-07-08T07:00:00Z"));
    expect(ready.find((item) => item.queue === "blockers")?.action).toBe("apply_default");
  });

  test("a reply that clears asked lets the item act", () => {
    const state = clone(example) as typeof example;
    const blocker = state.blockers[0];
    delete (blocker as { asked?: unknown }).asked;
    blocker.next_check_at = "2026-07-01T12:00:00Z";
    const result = due(state, timestamp("2026-07-01T12:00:00Z"));
    expect(result.find((item) => item.queue === "blockers")?.action).toBe("act");
  });

  test("due does not mutate state", () => {
    const state = clone(example);
    due(state, timestamp("2026-07-04T00:00:00Z"));
    expect(state).toEqual(original);
  });

  test("invalid state fails validation", () => {
    for (const [key, value] of [
      ["next_check_at", "2026-07-01T12:00:00"],
      ["next_check_at", "not a date"],
      ["evidence", "not a list"],
      ["evidence", []],
      ["goal", ""],
      ["owner", ""],
      ["updated_at", "2026-02-30"],
      ["unknown", "value"],
      ["owner", "Albert"],
    ] as const) {
      const state = clone(example) as Record<string, unknown>;
      (state.retry_queue as Record<string, unknown>[])[0][key] = value;
      expect(() => validate(state)).toThrow();
    }
  });

  test("broken or missing queues fail", () => {
    const changes = [
      (state: Record<string, unknown>) => {
        delete state.blockers;
      },
      (state: Record<string, unknown>) => {
        state.deferred = {};
      },
      (state: Record<string, unknown>) => {
        state.last_full_heartbeat = "2026-02-30";
      },
      (state: Record<string, unknown>) => {
        state.notes = "not allowed";
      },
    ];
    for (const change of changes) {
      const state = clone(example) as Record<string, unknown>;
      change(state);
      expect(() => validate(state)).toThrow();
    }
  });

  test("ask fields are valid", () => {
    validate(example);
    expect(example.blockers[0].owner).toBe("@fvaleye");
    expect(example.blockers[0].asked.who).toBe("@fvaleye");
    expect(example.blockers[0].next_check_at).toBe(example.blockers[0].asked.default_at);
  });

  test("invalid asked fields fail", () => {
    const changes = [
      (state: typeof example) => {
        state.blockers[0].asked = "pinged Florian" as never;
      },
      (state: typeof example) => {
        state.blockers[0].asked.at = "2026-07-01T10:00:00";
      },
      (state: typeof example) => {
        (state.blockers[0].asked as Record<string, unknown>).extra = "no";
      },
      (state: typeof example) => {
        delete (state.blockers[0].asked as { question?: string }).question;
      },
      (state: typeof example) => {
        state.blockers[0].next_check_at = "2026-07-02T09:00:00Z";
      },
    ];
    for (const change of changes) {
      const state = clone(example);
      change(state as never);
      expect(() => validate(state)).toThrow();
    }
  });

  test("empty queue is valid", () => {
    const state = { last_full_heartbeat: null, retry_queue: [], blockers: [], deferred: [] };
    expect(due(state, timestamp("2026-07-01T00:00:00Z"))).toEqual([]);
  });

  test("missing state is idle and does not create a file", () => {
    const folder = mkdtempSync(join(tmpdir(), "hb-"));
    const path = join(folder, "state.json");
    const result = Bun.spawnSync(["bun", SCRIPT, "due", "--file", path], {
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout.toString())).toEqual([]);
    expect(Bun.file(path).size).toBe(0);
  });

  test("invalid file is a failure not an empty backlog", () => {
    const folder = mkdtempSync(join(tmpdir(), "hb-"));
    const path = join(folder, "state.json");
    writeFileSync(path, '{"broken": true}');
    const result = Bun.spawnSync(["bun", SCRIPT, "due", "--file", path], {
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode).toBe(1);
    expect(result.stdout.toString()).toBe("");
    expect(result.stderr.toString()).toContain("Maintenance state error");
  });

  test("can-ask refuses a duplicate and allows a new question", () => {
    const asked = example.blockers[0].asked;
    expect(canAsk(example, asked.url, asked.who)).toEqual(asked);
    expect(canAsk(example, asked.url, "fvaleye")).toEqual(asked);
    expect(canAsk(example, asked.url, "@utay")).toBeNull();
    const folder = mkdtempSync(join(tmpdir(), "hb-"));
    const path = join(folder, "state.json");
    writeFileSync(path, JSON.stringify(example));
    const blocked = Bun.spawnSync(
      ["bun", SCRIPT, "can-ask", asked.url, asked.who, "--file", path],
      { stdout: "pipe", stderr: "pipe" },
    );
    expect(blocked.exitCode).toBe(2);
    expect(JSON.parse(blocked.stdout.toString()).question).toBe(asked.question);
    const allowed = Bun.spawnSync(
      ["bun", SCRIPT, "can-ask", asked.url, "@utay", "--file", path],
      { stdout: "pipe", stderr: "pipe" },
    );
    expect(allowed.exitCode).toBe(0);
    const errored = Bun.spawnSync(["bun", SCRIPT, "can-ask", "--file", path], {
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(errored.exitCode).toBe(1);
    expect(errored.stderr.toString()).toContain("Maintenance state error");
  });
});

afterEach(() => {
  expect(example).toEqual(original);
});
