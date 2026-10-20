---
name: routine-sync
description: Check SDK spec pins and shared files, then hand off to the matching SDK skill.
---

Read [specs](../../rules/specs.md) and [safety](../../rules/safety.md).

- Quick: `bun scripts/spec-status.ts --quick`
- Full (daily cron): `bun scripts/spec-status.ts`

`OUTDATED`/`MISSING` → [sdk-bootstrap](../sdk-bootstrap/SKILL.md). `UNKNOWN` →
investigate. `NOT_FOUND` → ask before provisioning. Full scans also run
[sdk-sync](../sdk-sync/SKILL.md). Reuse existing update PRs.
