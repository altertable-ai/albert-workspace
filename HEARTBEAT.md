# Maintainer Heartbeat

OpenClaw invokes Albert on a regular cadence. Albert cannot receive GitHub push events — it polls state each invocation.

## The Loop

1. **Check GitHub notifications** — `gh api notifications`. Primary awareness source across all repos.
2. **Check spec status** — `bash scripts/spec-status.sh --quick`.
3. **Run `routine-maintainer`** — surfaces issues needing triage, PRs with failing CI/review feedback/conflicts.
4. **React using skills**:
   - Issues → `ops-triage`
   - PRs → `ops-review`
   - Cross-repo drift → `sdk-sync`
   - Spec updates → `sdk-bootstrap`
5. **Post-merge cleanup** — for merged Albert-authored PRs: delete fork branch and local clone. If it was a release PR, verify the package is live on the registry ([TOOLS.md](TOOLS.md)).
6. If nothing is actionable, acknowledge heartbeat with `HEARTBEAT_OK`.

## Periodic Checks (full routine only)

On full heartbeats (poll payload says full, or not yet run today per `memory/YYYY-MM-DD.md`):

1. **Full spec scan** — `bash scripts/spec-status.sh` (no `--quick`) to catch manual submodule updates.
2. **Cross-repo consistency** — run `sdk-sync` if drift detected.
3. **Weekly report** (Friday only) — use `ops-report`.
4. **Distill MEMORY.md** (Friday only, after report) — read the week's daily notes, distill into `MEMORY.md`, open a PR.

