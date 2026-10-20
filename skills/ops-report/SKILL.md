---
name: ops-report
description: Report Albert's work over a requested period, including shipped changes, open work, and decisions waiting on the team.
---

# Maintenance report

Run on the Friday full heartbeat or on request. Default to the preceding seven days
and state the reporting window.

Start with `bun scripts/github-activity.ts`. It collects Albert's PRs opened,
merged, and closed during the period, plus issue comments and PR reviews, across
the repository list. Use `--since` and `--until` for another period; `--help`
explains the options. The output is JSON with links and dates. If a request fails,
fix or report the failure rather than treating the result as no activity.

Read `code/heartbeat-state.json` for **Waiting on the team**: use `blockers` and
any item with `asked` still open. List each ask once; do not ping.

Read the linked discussions before describing what changed. A comment is not proof
that an issue was resolved. Use relevant notes already in context; look up older
notes only when they help explain a decision or unfinished work.

Use `bun scripts/ecosystem-status.ts --markdown` when repository health helps
explain the report. For SDK spec work, also use
`bun scripts/spec-status.ts --markdown`; other repositories do not need a spec pin.

Lead with useful outcomes: what shipped, what is still being worked on, and what
needs a team decision. Link the evidence. Include next actions only when they are
actually planned. Omit empty sections and routine administrative work.

Reply where the report was requested. Follow
[communication](../../rules/communication.md) before posting elsewhere.
