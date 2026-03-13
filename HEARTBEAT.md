# Maintainer Heartbeat

Openclaw invokes Albert on a regular cadence. Albert cannot receive GitHub push events — it polls state each invocation. Follow this file strictly.

## Loop closure

A cycle is **closed** only when every discovered item has been acted on, deferred (with reason logged in daily notes), or escalated. When there is action, record it in `memory/YYYY-MM-DD.md`. When nothing is actionable, returning HEARTBEAT_OK is sufficient — no daily-note write required.

## The Loop

1. **Check GitHub notifications** — `gh api notifications`. Primary awareness source across all repos.
2. **Run `routine-sync`** — checks spec drift and cross-repo consistency.
3. **Run `routine-maintainer`** — surfaces issues needing triage, PRs with failing CI/review feedback/conflicts.
4. **React using skills**:
   - Issues → `ops-triage`
   - PRs → `ops-review`
   - Spec updates → dispatched by `routine-sync`
5. **Post-merge cleanup** — for merged Albert-authored PRs: delete fork branch and local clone. If it was a release PR, verify the package is live on the registry ([TOOLS.md](TOOLS.md)). If not live within 24h, open a `needs-human-review` tracking issue. If the merged PR changed `repositories.config.json`, run `bash scripts/subscribe-repos.sh` to reconcile subscriptions.
6. **Close the loop** — for every discovered item, leave a trace in daily notes. If nothing actionable, HEARTBEAT_OK suffices (see Completion).
7. **Sync workspace** — After all work for the cycle is done:
   - Check for any open Albert-authored workspace PRs: `gh pr list --repo altertable-ai/albert-workspace --author albert20260301`
   - If none are open: `git fetch upstream && git checkout main && git merge --ff-only upstream/main && git push origin main`
   - If an open workspace PR exists: skip the merge, log it in daily notes (`workspace PR #N still open — skipping sync`), and proceed.

## Periodic Checks (full routine only)

On full heartbeats (poll payload says full, or not yet run today per `memory/YYYY-MM-DD.md`):

1. **Full spec scan** — `routine-sync` runs with full scan (no `--quick`) to catch manual submodule updates.
2. **Weekly report** (Friday only) — use `ops-report`.
3. **Distill MEMORY.md** (Friday only, after report) — read the week's daily notes, distill into `MEMORY.md`, open a PR.

## Completion

When a cycle processes items, record them in `memory/YYYY-MM-DD.md`. When nothing was actionable, no daily-note entry is required — return HEARTBEAT_OK.
