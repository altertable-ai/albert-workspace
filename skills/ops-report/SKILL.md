---
name: ops-report
description: Report shipped work, open items, and decisions waiting on the team.
---

Default window: previous seven days. Start with
`bun scripts/github-activity.ts`. Waiting on the team: `blockers` and open
`asked` in `code/heartbeat-state.json`. List each ask once; do not ping.

Lead with what shipped, what is still open, and what needs a decision. Link
evidence. Post once to the weekly job's Slack target.
