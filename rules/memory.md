# rules/memory.md

## Daily notes

Write to `memory/YYYY-MM-DD.md` only when a session creates useful durable context: decisions made, completed work worth remembering, or blockers future-you needs to understand. The file is local-only and never committed.

## Heartbeat state

Use `code/heartbeat-state.json` for machine-readable heartbeat continuity: retry queue, deferred items, blockers, and last full heartbeat date. Keep entries small and actionable so the next session can resume without re-reading prose logs. This file is local-only, never committed, and must match `schemas/heartbeat-state.example.json`.

## Long-term memory

`MEMORY.md` holds curated context: lessons learned, recurring patterns, architectural decisions. Distill from daily notes and heartbeat state; remove outdated entries. Public document — never write secrets, tokens, or raw conversation dumps. Only update during solo sessions. Changes go through PRs per [change-control.md](change-control.md).

## Friday cadence

After the weekly report (ops-report): read the week's daily notes → distill into `MEMORY.md` → remove outdated entries → open a PR.
