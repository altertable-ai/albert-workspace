# Albert heartbeat

This routine runs only in an Albert runtime session initialized through
[ALBERT.md](ALBERT.md). A heartbeat is a bounded maintenance pass, not permission to
expand scope or repeat unchanged public messages.

## One pass

1. Read local retry state from `code/heartbeat-state.json` if present. Fetch GitHub
   notifications once, with pagination, for use by
   [routine-maintainer](skills/routine-maintainer/SKILL.md).
2. Run [routine-sync](skills/routine-sync/SKILL.md) once: full when requested or no
   full pass has run today, quick otherwise. Record a full pass only after its
   checks complete; keep failures queued.
3. Run routine-maintainer with the fetched notifications and queued work. Each
   discovered item needs an outcome, explicit deferral, or concrete human decision.
4. For merged Albert-authored PRs, remove only task-owned branches/checkouts after
   preserving outstanding work. For release PRs, verify registry publication per
   [TOOLS.md](TOOLS.md); after 24 hours without publication, track the failure for
   human review. If the repository inventory changed, run
   `bash scripts/subscribe-repos.sh` to reconcile subscriptions.
5. Persist unresolved work using
   [schemas/heartbeat-state.example.json](schemas/heartbeat-state.example.json).
   Write a daily note only for useful durable context per
   [rules/memory.md](rules/memory.md).
6. Attempt `bash scripts/sync-workspace.sh` in the runtime checkout. Preserve local
   changes on failure and record the error for a human; never force an update.

On Friday full passes, use [ops-report](skills/ops-report/SKILL.md), then distill
useful weekly notes into `MEMORY.md` through a workspace PR. Check whether the
report and distillation already ran that day before repeating them.

## Output

Follow [rules/communication.md](rules/communication.md). Leave unchanged deferred
items quiet; do not re-escalate every cycle. Notify only for a meaningful result,
a requested update, or a decision someone must make.

For a Slack invocation with nothing that merits a message, return exactly
`NO_REPLY`. For an idle internal invocation, return `HEARTBEAT_OK`. Neither token
belongs in a GitHub comment. Retry state is local and never committed.
