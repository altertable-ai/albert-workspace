#!/usr/bin/env bun
/** Validate saved maintenance work, list due actions, or guard duplicate asks. */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const QUEUES = ["retry_queue", "blockers", "deferred"] as const;
export type QueueName = (typeof QUEUES)[number];

const REQUIRED_STATE = new Set(["last_full_heartbeat", ...QUEUES]);
const OPTIONAL_STATE = new Set<string>();
export const REQUIRED = new Set([
  "repo",
  "url",
  "reason",
  "next_action",
  "updated_at",
  "owner",
  "goal",
  "done_when",
  "evidence",
]);
const OPTIONAL = new Set(["promise", "resume_when", "thread_url", "next_check_at", "asked"]);
const ASKED_FIELDS = new Set(["who", "at", "url", "question", "default_at", "default_action"]);
export const OWNER_RE = /^(albert|@[\w-]+)$/;

export type Asked = {
  who: string;
  at: string;
  url: string;
  question: string;
  default_at: string;
  default_action: string;
};

export type Action = "act" | "apply_default" | "stay_quiet";

const ROOT = resolve(import.meta.dir, "..");

export function timestamp(value: string): Date {
  const parsed = Date.parse(value.includes("T") ? value.replace("Z", "+00:00") : value);
  if (Number.isNaN(parsed)) {
    throw new Error("invalid timestamp");
  }
  if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    throw new Error("check times must include a timezone");
  }
  return new Date(parsed);
}

function calendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("invalid date");
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("invalid date");
  }
}

function optionalDate(value: unknown) {
  if (value != null) {
    if (typeof value !== "string") {
      throw new Error("dates must be strings");
    }
    calendarDate(value);
  }
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateAsked(asked: unknown, queue: string): Asked {
  if (!asked || typeof asked !== "object" || Array.isArray(asked)) {
    throw new Error(`${queue}.asked must contain who, at, url, question, default_at, and default_action`);
  }
  const record = asked as Record<string, unknown>;
  if ([...Object.keys(record)].some((key) => !ASKED_FIELDS.has(key)) || ASKED_FIELDS.size !== Object.keys(record).length) {
    throw new Error(`${queue}.asked must contain who, at, url, question, default_at, and default_action`);
  }
  for (const key of ["who", "url", "question", "default_action"] as const) {
    if (!nonempty(record[key])) {
      throw new Error(`${queue}.asked.${key} must be a nonempty string`);
    }
  }
  if (!OWNER_RE.test(record.who as string)) {
    throw new Error(`${queue}.asked.who must match ${OWNER_RE}`);
  }
  timestamp(String(record.at));
  timestamp(String(record.default_at));
  return record as Asked;
}

export function validate(state: unknown) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("state must contain last_full_heartbeat and the three work queues");
  }
  const record = state as Record<string, unknown>;
  if (![...REQUIRED_STATE].every((key) => key in record)) {
    throw new Error("state must contain last_full_heartbeat and the three work queues");
  }
  if (Object.keys(record).some((key) => !REQUIRED_STATE.has(key) && !OPTIONAL_STATE.has(key))) {
    throw new Error("state has unknown fields");
  }
  optionalDate(record.last_full_heartbeat);
  for (const key of OPTIONAL_STATE) {
    if (key in record) {
      optionalDate(record[key]);
    }
  }
  for (const queue of QUEUES) {
    const items = record[queue];
    if (!Array.isArray(items)) {
      throw new Error(`${queue} must be a list`);
    }
    for (const entry of items) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw new Error(`${queue} item is missing required fields`);
      }
      const item = entry as Record<string, unknown>;
      if (![...REQUIRED].every((key) => key in item)) {
        throw new Error(`${queue} item is missing required fields`);
      }
      if (Object.keys(item).some((key) => !REQUIRED.has(key) && !OPTIONAL.has(key))) {
        throw new Error(`${queue} item has unknown fields`);
      }
      for (const key of ["repo", "reason", "next_action", "updated_at", "owner", "goal", "done_when"]) {
        if (!nonempty(item[key])) {
          throw new Error(`${queue}.${key} must be a nonempty string`);
        }
      }
      if (!OWNER_RE.test(item.owner as string)) {
        throw new Error(`${queue}.owner must match ${OWNER_RE}`);
      }
      if (item.url != null && typeof item.url !== "string") {
        throw new Error(`${queue}.url must be a string or null`);
      }
      calendarDate(String(item.updated_at));
      const evidence = item.evidence;
      if (!Array.isArray(evidence) || evidence.length === 0 || evidence.some((value) => !nonempty(value))) {
        throw new Error(`${queue}.evidence must be a nonempty list of nonempty strings`);
      }
      if ("next_check_at" in item) {
        if (typeof item.next_check_at !== "string") {
          throw new Error(`${queue}.next_check_at must be a timestamp`);
        }
        timestamp(item.next_check_at);
      }
      if ("asked" in item) {
        const asked = validateAsked(item.asked, queue);
        if (!item.next_check_at || timestamp(String(item.next_check_at)).getTime() !== timestamp(asked.default_at).getTime()) {
          throw new Error(`${queue}.next_check_at must equal asked.default_at`);
        }
      }
    }
  }
  return record;
}

function actionFor(entry: Record<string, unknown>, now: Date): Action {
  if (entry.asked) {
    const asked = entry.asked as Asked;
    return timestamp(asked.default_at) <= now ? "apply_default" : "stay_quiet";
  }
  if (!("next_check_at" in entry) || timestamp(String(entry.next_check_at)) <= now) {
    return "act";
  }
  return "stay_quiet";
}

export function due(state: unknown, now: Date) {
  const valid = validate(state);
  return QUEUES.flatMap((queue) =>
    (valid[queue] as Record<string, unknown>[]).map((entry) => ({
      queue,
      action: actionFor(entry, now),
      ...entry,
    })),
  );
}

export function login(who: string): string {
  return who.trim().replace(/^@/, "").toLowerCase();
}

export function canAsk(state: unknown, url: string, who: string) {
  const valid = validate(state);
  const handle = login(who);
  for (const queue of QUEUES) {
    for (const entry of valid[queue] as Record<string, unknown>[]) {
      const asked = entry.asked as Asked | undefined;
      if (asked && asked.url === url && login(asked.who) === handle) {
        return asked;
      }
    }
  }
  return null;
}

function argValue(flag: string, argv: string[], fallback?: string) {
  const index = argv.indexOf(flag);
  if (index >= 0 && argv[index + 1]) {
    return argv[index + 1];
  }
  return fallback;
}

async function main() {
  const argv = Bun.argv.slice(2);
  const command = argv[0];
  const file = resolve(argValue("--file", argv, `${ROOT}/code/heartbeat-state.json`)!);
  try {
    const now = timestamp(argValue("--now", argv) ?? new Date().toISOString().replace(/\.\d{3}Z$/, "Z"));
    if (command === "due" && !existsSync(file)) {
      console.log("[]");
      return 0;
    }
    if (command === "can-ask" && !existsSync(file)) {
      return 0;
    }
    if (!command || !["check", "due", "can-ask"].includes(command)) {
      throw new Error("command must be check, due, or can-ask");
    }
    const state = JSON.parse(readFileSync(file, "utf8"));
    if (command === "due") {
      console.log(JSON.stringify(due(state, now), null, 2));
    } else if (command === "can-ask") {
      const url = argv[1];
      const who = argv[2];
      if (!url || !who || url.startsWith("--") || who.startsWith("--")) {
        throw new Error("usage: can-ask <url> <who>");
      }
      const existing = canAsk(state, url, who);
      if (existing) {
        console.log(JSON.stringify(existing, null, 2));
        return 2;
      }
    } else {
      validate(state);
      console.log(`Valid maintenance state: ${file}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Maintenance state error: ${message}`);
    return 1;
  }
  return 0;
}

if (import.meta.main) {
  process.exit(await main());
}
