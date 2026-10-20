# Albert heartbeat

This routine runs only in an Albert runtime session initialized through
[ALBERT.md](ALBERT.md). A heartbeat is a bounded maintenance pass, not permission to
take on unrelated work or repeat unchanged public messages. Startup already synced
the checkout; do not run `scripts/sync-workspace.sh` again.

## One pass

1. Load due saved work per [memory](rules/memory.md). Fetch GitHub notifications
   once, with pagination, for use by
   [routine-maintainer](skills/routine-maintainer/SKILL.md).
2. Run routine-maintainer with notifications and due work across all configured
   repositories. A new reply or CI result also resumes the related item, even if
   its check time is later. Handle each item, record why it is waiting, or ask once
   per [communication](rules/communication.md). Prioritize reported problems and
   existing promises.
3. Run [routine-sync](skills/routine-sync/SKILL.md) once after urgent work: full when
   requested or no full pass has run today, quick otherwise. Record a full pass
   only after its checks complete; keep failures queued.
4. After a human-approved release, verify package publication where relevant per
   [TOOLS.md](TOOLS.md). After 24 hours without publication, post once on the
   release PR, tagging whoever approved the release. If the repository inventory
   changed, run `bash scripts/subscribe-repos.sh` to reconcile subscriptions.
5. Before removing completed work, verify the actual result and fulfill any
   promised follow-up in the original thread. A merged PR alone does not prove the
   user's problem is fixed. For unfinished work, update evidence and the next check
   time using
   [schemas/heartbeat-state.example.json](schemas/heartbeat-state.example.json).
   Clean up only task-owned branches and checkouts whose work is finished.
   Write a daily note only for useful durable context per
   [rules/memory.md](rules/memory.md).

On Friday full passes, use [ops-report](skills/ops-report/SKILL.md), then distill
`MEMORY.md` per [memory](rules/memory.md). Skip either job if
`last_weekly_report` or `last_memory_distill` is already today.

## Output

Follow [rules/communication.md](rules/communication.md). Leave unchanged deferred
items quiet.

For a Slack invocation with nothing that merits a message, return exactly
`NO_REPLY`. For an idle internal invocation, return `HEARTBEAT_OK`. Neither token
belongs in a GitHub comment. Retry state is local and never committed.
