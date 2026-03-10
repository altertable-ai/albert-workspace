---
name: maintainer-routine
description: Notification-driven maintainer routine to identify actionable work across Altertable SDK repositories. Relies on GitHub notifications and API to monitor activity and respond to issues and PRs requiring attention. Use when starting a maintenance session to process notifications and prioritize work.
---

# Maintainer Routine

## Purpose

Use this skill at the start of each maintenance session to process GitHub notifications and identify actionable work across Altertable SDK repositories. This notification-driven routine surfaces:

- **New issues and issue comments**: Issues requiring triage, responses, or investigation
- **PRs requiring work**: Pull requests with failing CI, review feedback to address, or other blockers preventing merge
- **Activity requiring attention**: CI status changes, new reviews, merge conflicts, and other repository events

The goal is to get PRs green and ready for human merge, and ensure issues receive timely responses through proactive notification monitoring.

## Notification-Driven Monitoring

**Primary Approach**: When a repository is under your care, you should rely on GitHub notifications and the GitHub API to watch all activity, rather than manually polling repositories. This ensures you respond promptly to new activity without unnecessary API calls.

- **GitHub Notifications**: Monitor GitHub notifications for all repositories you maintain. These provide real-time awareness of:
  - New issues and issue comments
  - Pull request creation, updates, reviews, and CI status changes
  - Commit pushes and branch activity
  - Release creation and tag updates
- **API Context Gathering**: When a notification arrives, immediately gather full context using the GitHub API to understand the complete picture before taking action.
- **Proactive Detection**: By monitoring activity streams, you can detect patterns early (related issues, CI failures across multiple PRs, emerging bugs) and address them before they escalate.

## Related Skills

- **[triage-issues](../triage-issues/SKILL.md)**: How to process and label issues
- **[review-pr](../review-pr/SKILL.md)**: How to review and provide feedback on PRs
- **[sync-repos](../sync-repos/SKILL.md)**: Repository inventory (canonical list of all repos)

## Action Priorities

### Immediate (do first)

1. **PRs with failing CI authored by maintainers**: Fix CI failures to get PRs merge-ready
2. **PRs with merge conflicts**: Resolve conflicts so PRs can be merged
3. **PRs with `CHANGES_REQUESTED`**: Address feedback or respond to the reviewer

### High priority (same session)

4. **Open issues without maintainer responses** (older than 7 days): Triage or respond
5. **Issues labeled `needs-info` or `needs-repro`**: Follow up or attempt reproduction

### Medium priority (this week)

6. **Open issues needing triage**: Apply labels, check for duplicates
7. **PRs awaiting review**: Review using [review-pr](../review-pr/SKILL.md) workflow

### Low priority (backlog)

8. **Stale issues**: Mark as stale or close per [triage-issues](../triage-issues/SKILL.md)
9. **Feature requests**: Evaluate and prioritize

## Work Session Template

When starting a maintenance session:

1. **Check GitHub notifications** - these are your primary source of awareness for new activity
2. **For each notification**:
   - Gather full context using the GitHub API to understand the complete picture
   - Determine if action is needed (triage, response, fix, review)
   - Add to your prioritized action list
3. **Create a prioritized list** of actionable items from notifications
4. **Work through items** starting with immediate priorities
5. **For each PR**:
   - If CI failing: investigate, fix, push, wait for CI
   - If changes requested: address feedback, push, re-request review
   - If conflicts: rebase/merge main, resolve, push
6. **For each issue**:
   - If untriaged: apply [triage-issues](../triage-issues/SKILL.md) workflow
   - If needs response: provide helpful answer or request more info
   - If needs repro: attempt reproduction locally

## Success Metrics

A successful notification-driven workflow should result in:

- ✅ All notifications processed and responded to promptly
- ✅ All maintainer-authored PRs have green CI
- ✅ All PRs with `CHANGES_REQUESTED` have been addressed or responded to
- ✅ All new issues receive timely triage or responses
- ✅ All open issues have appropriate labels
- ✅ No PRs blocked by merge conflicts

## Acceptance Checklist

- [ ] GitHub notifications checked and processed
- [ ] Full context gathered for each notification using GitHub API
- [ ] PRs with failing CI identified and prioritized
- [ ] PRs with review feedback identified and addressed
- [ ] Issues from notifications triaged or responded to
- [ ] Actionable items prioritized and work begun
- [ ] At least one immediate priority item addressed
