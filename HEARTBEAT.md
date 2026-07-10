# Maintainer Heartbeat

Albert runs on a regular cadence. Albert cannot receive GitHub push events — it polls state each invocation. Follow this file strictly.

## Loop closure

A cycle is **closed** only when every discovered item has been acted on, deferred, or escalated. When work needs a retry or human input, record it in `code/heartbeat-state.json` using the shape in `schemas/heartbeat-state.example.json`; when there is meaningful completed work, record a short note in `memory/YYYY-MM-DD.md`. When nothing is actionable, returning HEARTBEAT_OK is sufficient — no daily-note write required.

## The Loop

1. **Check GitHub notifications** — `gh api notifications`. Primary awareness source across all repos.
2. **Run `routine-sync`** — checks spec drift and cross-repo consistency.
3. **Run `routine-maintainer`** — surfaces issues needing triage, PRs with failing CI/review feedback/conflicts.
4. **React using skills**:
   - Issues → `ops-triage`
   - PRs → `ops-review`
   - Spec updates → dispatched by `routine-sync`
5. **Post-merge cleanup** — for merged Albert-authored PRs: delete fork branch and local clone. If it was a release PR, verify the package is live on the registry ([TOOLS.md](TOOLS.md)). If not live within 24h, open a `needs-human-review` tracking issue. If the merged PR changed `repositories.config.json`, run `bash scripts/subscribe-repos.sh` to reconcile subscriptions.
6. **Close the loop** — for every discovered item, either complete it, add/update an entry in `code/heartbeat-state.json`, or escalate with `needs-human-review`. If nothing actionable, HEARTBEAT_OK suffices (see Completion).
7. **Sync workspace (always attempt, safely)** — After all work for the cycle is done:
   - Check for any open Albert-authored workspace PRs (for logging/context): `gh pr list --repo altertable-ai/albert-workspace --author albert20260301`
   - Always attempt a safe upstream sync on every heartbeat: `bash scripts/sync-workspace.sh`
   - Safety rules: never force-push, never rebase here, and only accept fast-forward updates.
   - If sync fails (non-fast-forward, local state, remote rejection, etc.), log the exact error in daily notes and escalate for human review.

## Periodic Checks (full routine only)

On full heartbeats (poll payload says full, or not yet run today per `code/heartbeat-state.json`):

1. **Full spec scan** — `routine-sync` runs with full scan (no `--quick`) to catch manual submodule updates.
2. **Weekly report** (Friday only) — use `ops-report`.
3. **Distill MEMORY.md** (Friday only, after report) — read the week's daily notes, distill into `MEMORY.md`, open a PR.

## Slack visibility

Routine heartbeat runs must not post status updates to Slack channels or
threads. Use local state (`code/heartbeat-state.json` and daily notes) for
continuity, and use GitHub issues/PR comments for repo-specific follow-up.
Only notify Slack when the heartbeat discovers something that needs immediate
human input, when a human explicitly asks for a status update, or when a prior
Slack thread is the active place to close an assigned request.

## Completion

When a cycle creates durable context, record it in `memory/YYYY-MM-DD.md`. When a cycle leaves retries, blockers, or deferred work, update `code/heartbeat-state.json`. When nothing was actionable, no daily-note entry is required — return HEARTBEAT_OK.
