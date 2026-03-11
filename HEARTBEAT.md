# Maintainer Heartbeat

Openclaw invokes Albert on a regular cadence. Albert cannot receive GitHub push events — it polls state each invocation. Follow this file strictly. Every cycle must produce a visible artifact.

## Loop closure

A cycle is **closed** only when every discovered item has one visible outcome:

- **Acted on**: comment, label change, or PR opened
- **Deferred**: comment explaining why and when you'll revisit
- **Escalated**: `needs-human-review` label + comment tagging a team member from `USER.md`

Never mark a notification as read or end a cycle without one of these outcomes.

## The Loop

1. **Check GitHub notifications** — `gh api notifications`. Primary awareness source across all repos.
2. **Check spec status** — `bash scripts/spec-status.sh --quick`. If unchanged, skip. If any SDK is outdated: run `sdk-bootstrap`, create/update a tracking issue via `bash scripts/upsert-github-issue.sh` (`spec-update` or `spec-outdated` label). If `NOT_FOUND` repos: open a tracking issue; run `sdk-bootstrap` Phase 0 if Albert has org permissions, otherwise wait for a human.
3. **Run `routine-maintainer`** — surfaces issues needing triage, PRs with failing CI/review feedback/conflicts.
4. **React using skills**:
   - Issues → `ops-triage`
   - PRs → `ops-review`
   - Cross-repo drift → `sdk-sync`
   - Spec updates → `sdk-bootstrap`
5. **Post-merge cleanup** — for merged Albert-authored PRs: delete fork branch and local clone. If it was a release PR, verify the package is live on the registry ([TOOLS.md](TOOLS.md)). If not live within 24h, open a `needs-human-review` tracking issue.
6. **Close the loop** — leave a visible trace for every item. If nothing actionable, emit the no-op artifact (see Completion).

## Periodic Checks (full routine only)

On full heartbeats (poll payload says full, or not yet run today per `memory/YYYY-MM-DD.md`):

1. **Full spec scan** — `bash scripts/spec-status.sh` (no `--quick`) to catch manual submodule updates.
2. **Cross-repo consistency** — run `sdk-sync` if drift detected.
3. **Weekly report** (Friday only) — use `ops-report`.
4. **Distill MEMORY.md** (Friday only, after report) — read the week's daily notes, distill into `MEMORY.md`, open a PR.

## Completion

Every cycle must produce at least one visible artifact:

- **Work done**: Comment on relevant issues/PRs summarizing what happened. Post a brief Slack summary for significant work.
- **Nothing actionable**: Emit the no-op artifact:
  1. If an open `spec-outdated`/`spec-update` tracking issue exists, add a comment to it:

     ```bash
     bash scripts/upsert-github-issue.sh \
       --title "Spec drift tracking" \
       --body "Heartbeat ran at $(date -u). Spec drift: clean. Notifications: reviewed, no actionable items." \
       --label "spec-update" \
       --search-by-label
     ```

  2. Otherwise, upsert a heartbeat-status issue (creates on first run, comments on subsequent runs):

     ```bash
     bash scripts/upsert-github-issue.sh \
       --title "Heartbeat status" \
       --body "Heartbeat ran at $(date -u). Spec drift: clean. Notifications: reviewed, no actionable items."
     ```

- **Blocked**: Comment explaining the blocker, apply `needs-human-review`, mention a team member.
