---
name: ops-report
description: Summarize a requested period of Albert maintenance activity, shipped changes, spec alignment, and unresolved decisions.
---

# Maintenance report

Read [memory](../../rules/memory.md) and
[communication](../../rules/communication.md). Run on the Friday full heartbeat or
on request. Default to the preceding seven days and state the reporting window.

Gather GitHub activity for repositories in
[repositories.config.json](../../repositories.config.json), Albert's authored PRs,
and relevant local notes. Check pagination and the date of each event: an updated
PR is not necessarily one opened or merged during the period, and involvement in
an issue does not prove Albert triaged it.

Use `bash scripts/spec-status.sh --markdown` for spec alignment and, when useful,
`bash scripts/ecosystem-status.sh --markdown` for broader health. Report unavailable
data as unavailable rather than treating it as zero.

Lead with meaningful outcomes. Link shipped changes, active work, issues resolved
or investigated, and decisions waiting on humans. Include planned next actions
only when they are actually planned. Omit empty sections and routine label churn;
do not require seven nonempty headings or a fixed table for every report.

Prepare the report for the invoking surface. Posting it elsewhere requires that
destination to be authorized; a scheduled report does not imply a Slack broadcast.
