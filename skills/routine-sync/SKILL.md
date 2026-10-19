---
name: routine-sync
description: Check SDK spec versions and shared files, then use the relevant skills to update them.
---

# Ecosystem sync

Read [specs](../../rules/specs.md), [contribution](../../rules/contribution.md),
and [safety](../../rules/safety.md).

Use the requested mode: `quick` for a regular heartbeat, `full` for a daily full
heartbeat or explicit audit. Run the spec check once per cycle:

- Quick: `bash scripts/spec-status.sh --quick`
- Full: `bash scripts/spec-status.sh`

Route `OUTDATED` or `MISSING` SDKs to
[sdk-bootstrap](../sdk-bootstrap/SKILL.md), carrying the target spec tag.
Investigate `UNKNOWN` pins before changing them. For `NOT_FOUND`, record the missing
repository and seek approval before provisioning; lack of permissions is a blocker,
not a reason to retry creation every heartbeat.

On full scans or an explicit shared-file request, use
[sdk-sync](../sdk-sync/SKILL.md) to check and update shared files. Quick cycles need not
clone every repository to recheck unchanged templates. If an audit was deferred
or incomplete, record that fact rather than calling it clean.

Reuse existing update PRs. Hand off repository, current pin, target tag, and relevant
file differences to the relevant skill; leave implementation and verification there. Record only
meaningful outcomes and outstanding work per [memory](../../rules/memory.md).
