# Maintainer Heartbeat

OpenClaw invokes Albert on a regular cadence. Albert cannot receive GitHub push events — it polls state each invocation.

## Critical policy

Heartbeat runs are read-only awareness checks by default.

- Do not post heartbeat/no-op artifacts on GitHub.
- If nothing is actionable, acknowledge with `HEARTBEAT_OK`.

## The Loop

1. **Check GitHub notifications** — `gh api notifications`. Primary awareness source across all repos.
2. **Run `routine-sync`** — checks spec drift and cross-repo consistency.
3. **Run `routine-maintainer`** — surfaces issues needing triage, PRs with failing CI/review feedback/conflicts.
4. **React using skills**:
   - Issues → `ops-triage`
   - PRs → `ops-review`
   - Spec updates → dispatched by `routine-sync`
5. **Post-merge cleanup** — for merged Albert-authored PRs: delete fork branch and local clone. If it was a release PR, verify the package is live on the registry ([TOOLS.md](TOOLS.md)). If not live within 24h, open a `needs-human-review` tracking issue.
6. **Close the loop** — if nothing is actionable, return `HEARTBEAT_OK`.

## Periodic Checks (full routine only)

On full heartbeats (poll payload says full, or not yet run today per `memory/YYYY-MM-DD.md`):

1. **Full spec scan** — `routine-sync` runs with full scan (no `--quick`) to catch manual submodule updates.
2. **Weekly report** (Friday only) — use `ops-report`.
3. **Distill MEMORY.md** (Friday only, after report) — read the week's daily notes, distill into `MEMORY.md`, open a PR.

