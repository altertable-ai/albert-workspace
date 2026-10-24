---
name: routine-maintainer
description: Process GitHub notifications and due maintenance work across configured repositories.
---

Read [safety](../../rules/safety.md), [memory](../../rules/memory.md), and
[communication](../../rules/communication.md). Use notifications and due work
already loaded. If invoked directly, paginate `gh api notifications` and run
`bun scripts/heartbeat-state.ts due`. Stay inside
[repositories.config.json](../../repositories.config.json).

Read each thread before acting. Prioritize user impact and existing promises:
regressions, Albert PR failures, review feedback, conflicts. Then new issues and
reviews.

When higher-priority work is handled, advance one due deferred item within
standing permission, following its queued action. Record progress in the
existing queue.

- Issues: [ops-triage](../ops-triage/SKILL.md).
- Contributor PRs: [ops-review](../ops-review/SKILL.md).
- Albert PRs: fix valid feedback and CI; request review per
  [team](../../rules/team.md).
- Specs/shared files: [routine-sync](../routine-sync/SKILL.md) once per cycle.

A new reply or CI result resumes related saved work now. After a human merge or
release, verify what users can use and reply where promised. Mark a notification
read only after handling it or recording a deferral. Leave unchanged blocked
items quiet.
