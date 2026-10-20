#!/usr/bin/env python3
"""Validate saved maintenance work or list items due for another check."""

import argparse
from datetime import date, datetime, timezone
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
QUEUES = ("retry_queue", "blockers", "deferred")
REQUIRED_STATE = {"last_full_heartbeat", *QUEUES}
OPTIONAL_STATE = {"last_weekly_report", "last_memory_distill"}
REQUIRED = {"repo", "url", "reason", "next_action", "updated_at"}
DETAILS = {"goal", "done_when", "promise", "resume_when", "last_notified", "owner", "thread_url"}
OPTIONAL = DETAILS | {"evidence", "next_check_at", "asked"}
ASKED_FIELDS = {"who", "at", "url", "question"}


def timestamp(value):
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("check times must include a timezone")
    return parsed.astimezone(timezone.utc)


def optional_date(value, name):
    if value is not None:
        date.fromisoformat(value)


def validate_asked(asked, queue):
    if not isinstance(asked, dict) or set(asked) != ASKED_FIELDS:
        raise ValueError(f"{queue}.asked must contain who, at, url, and question")
    for key in ("who", "url", "question"):
        if not isinstance(asked[key], str) or not asked[key].strip():
            raise ValueError(f"{queue}.asked.{key} must be a nonempty string")
    if not isinstance(asked["at"], str):
        raise ValueError(f"{queue}.asked.at must be a timestamp")
    timestamp(asked["at"])


def validate(state):
    if not isinstance(state, dict) or not REQUIRED_STATE <= set(state):
        raise ValueError("state must contain last_full_heartbeat and the three work queues")
    if set(state) - REQUIRED_STATE - OPTIONAL_STATE:
        raise ValueError("state has unknown fields")
    optional_date(state["last_full_heartbeat"], "last_full_heartbeat")
    for key in OPTIONAL_STATE & state.keys():
        optional_date(state[key], key)
    for queue in QUEUES:
        if not isinstance(state[queue], list):
            raise ValueError(f"{queue} must be a list")
        for entry in state[queue]:
            if not isinstance(entry, dict) or not REQUIRED <= entry.keys():
                raise ValueError(f"{queue} item is missing required fields")
            if set(entry) - REQUIRED - OPTIONAL:
                raise ValueError(f"{queue} item has unknown fields")
            for key in {"repo", "reason", "next_action", "updated_at"} | (DETAILS & entry.keys()):
                if not isinstance(entry[key], str) or not entry[key].strip():
                    raise ValueError(f"{queue}.{key} must be a nonempty string")
            if entry["url"] is not None and not isinstance(entry["url"], str):
                raise ValueError(f"{queue}.url must be a string or null")
            date.fromisoformat(entry["updated_at"])
            if "evidence" in entry:
                evidence = entry["evidence"]
                if not isinstance(evidence, list) or any(
                    not isinstance(value, str) or not value.strip() for value in evidence
                ):
                    raise ValueError(f"{queue}.evidence must be a list of nonempty strings")
            if "next_check_at" in entry:
                if not isinstance(entry["next_check_at"], str):
                    raise ValueError(f"{queue}.next_check_at must be a timestamp")
                timestamp(entry["next_check_at"])
            if "asked" in entry:
                validate_asked(entry["asked"], queue)
    return state


def due(state, now):
    validate(state)
    return [
        {"queue": queue, **entry}
        for queue in QUEUES
        for entry in state[queue]
        if "next_check_at" not in entry or timestamp(entry["next_check_at"]) <= now
    ]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("check", "due"))
    parser.add_argument("--file", type=Path, default=ROOT / "code/heartbeat-state.json")
    parser.add_argument("--now", help="ISO timestamp with timezone, for a repeatable due check")
    args = parser.parse_args()
    try:
        now = timestamp(args.now) if args.now else datetime.now(timezone.utc)
        if args.command == "due" and not args.file.exists():
            print("[]")
            return 0
        state = validate(json.loads(args.file.read_text()))
        if args.command == "due":
            print(json.dumps(due(state, now), indent=2, ensure_ascii=False))
        else:
            print(f"Valid maintenance state: {args.file}")
    except (OSError, TypeError, ValueError) as error:
        print(f"Maintenance state error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
