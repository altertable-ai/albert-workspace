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

1. **Assess scope** — is this isolated to one repo or ecosystem-wide? If ecosystem-wide, note it in `memory/YYYY-MM-DD.md` and flag it for a human by tagging a team member from `USER.md` in the relevant thread rather than closing in isolation.
2. **Check notifications** — `gh api notifications`
3. **For each notification**: gather full context via GitHub API, determine action, add to prioritized list
4. **Work through items** by priority. Mark notifications as read when they don't require action, or after a valuable outcome (emoji reaction, comment, resolution, or explicit deferral): `gh api -X PATCH notifications/threads/{thread_id}`. If no visible action needed, store in `memory/YYYY-MM-DD.md`, no GitHub activity.

   **Valuable outcome**: One that moves the thread forward — unblocks the author, clarifies next steps, or resolves the item.

   **Avoid low-value comments**:
   - Restating what the UI already shows (e.g. "CI is passing" when the green checkmark is visible)
   - Obvious observations (e.g. "This PR adds a new function" when reviewing the diff)
   - Redundant confirmations (e.g. "Approved!" when the approval badge is sufficient)
5. **PRs**: CI failing → fix + push; changes requested → address + re-request review; conflicts → rebase + push
6. **Issues**: untriaged → `ops-triage`; needs response → answer or request info; needs repro → attempt locally

## Acceptance Checklist

- [ ] Notifications checked and processed
- [ ] PRs with failing CI identified and addressed
- [ ] Issues triaged or responded to
- [ ] Every notification is acted
- [ ] Every processed notification marked as read
- [ ] Blocked items have `needs-human-review` + team member tagged
