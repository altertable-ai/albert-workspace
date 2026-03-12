---
name: routine-maintainer
description: Notification-driven maintainer routine to identify actionable work across Altertable SDK repositories. Relies on GitHub notifications and API to monitor activity and respond to issues and PRs requiring attention. Use when starting a maintenance session to process notifications and prioritize work.
---

# Maintainer Routine

Dispatched by the heartbeat. Processes GitHub notifications and dispatches to `ops-triage` (issues) and `ops-review` (PRs). Primary source of awareness: `gh api notifications`.

**Rules:** [memory](../../rules/memory.md) · [communication](../../rules/communication.md) · [safety](../../rules/safety.md)

## Action Priorities

### Immediate (do first)

1. **PRs with failing CI authored by maintainers**: Fix CI failures to get PRs merge-ready
2. **PRs with merge conflicts**: Resolve conflicts so PRs can be merged
3. **PRs with `CHANGES_REQUESTED`**: Address feedback or respond to the reviewer
4. **Own PRs unreviewed for 3+ days**: Re-request review from a different team member from `USER.md`

### High priority (same session)

1. **Open issues without maintainer responses** (older than 7 days): Triage or respond
2. **Issues labeled `needs-info` or `needs-repro`**: Follow up or attempt reproduction
3. **Items labeled `needs-human-review` with no human response for 3+ days**: Post a follow-up comment pinging another team member from `USER.md` (re-escalation)

### Medium priority (this week)

1. **Open issues needing triage**: Apply labels, check for duplicates
2. **PRs awaiting review**: Review using [ops-review](../ops-review/SKILL.md) workflow
3. **Issues labeled `cross-sdk-divergence`**: Check if the divergence has been resolved by a subsequent PR

### Low priority (backlog)

1. **Stale issues**: Mark as stale or close per [ops-triage](../ops-triage/SKILL.md)
2. **Feature requests**: Evaluate and prioritize

## Work Session

1. **Assess scope** — is this isolated to one repo or ecosystem-wide? If ecosystem-wide, open a tracking issue via `bash scripts/upsert-github-issue.sh` rather than closing in isolation.
2. **Enforce watch subscriptions for all supervised repositories** — from workspace root:
   - `jq -r '.[].repo' repositories.config.json | while read -r repo; do gh api -X PUT "repos/$repo/subscription" -F subscribed=true -F ignored=false; done`
   - verify: `jq -r '.[].repo' repositories.config.json | while read -r repo; do gh api "repos/$repo/subscription" --jq '"\(.repository_url): subscribed=\(.subscribed) ignored=\(.ignored)"'; done`
3. **Check notifications** — `gh api notifications`
4. **For each notification**: gather full context via GitHub API, determine action, add to prioritized list
5. **Work through items** by priority. Close the loop on every thread. Mark notifications as read only after a visible outcome (comment, resolution, or explicit deferral): `gh api -X PATCH notifications/threads/{thread_id}`
6. **PRs**: CI failing → fix + push; changes requested → address + re-request review; conflicts → rebase + push
7. **Issues**: untriaged → `ops-triage`; needs response → answer or request info; needs repro → attempt locally

## Acceptance Checklist

- [ ] Notifications checked and processed
- [ ] PRs with failing CI identified and addressed
- [ ] Issues triaged or responded to
- [ ] Every acted-on notification has a visible response
- [ ] Every processed notification marked as read
- [ ] Blocked items have `needs-human-review` + team member tagged
