---
name: ops-review
description: Review contributor pull requests for correctness, compatibility, and meaningful verification in supervised Altertable repositories.
---

# PR review

Read [quality](../../rules/quality.md), [team](../../rules/team.md),
[communication](../../rules/communication.md), and [safety](../../rules/safety.md).
Do not review a PR you authored or co-authored; request independent review.

Read the PR description, discussion, diff, relevant callers, and CI results.
Understand the intended behavior before judging the implementation.

Focus on actionable defects: correctness, compatibility, error handling, meaningful
tests, and public API/spec alignment. Check docs and changelog when users are
affected. Follow the repository's language and package conventions, including
monorepo structure; do not impose a global casing table or style preferences.

Trace a finding to a concrete trigger and consequence. Distinguish required fixes
from optional suggestions. Use line comments and suggestion blocks when they make
a correction easier; avoid scripted praise and a checklist-shaped review.

- Approve when the change is sound and required CI passes. The approval itself is
  enough unless a comment adds useful context.
- Request changes for verified defects or missing verification that matters.
- If CI is pending or failing, inspect the cause before blaming the patch. Report
  an infrastructure blocker separately from a code defect.
- Offer a small repair via [contribution](../../rules/contribution.md) when authorized.
  Do not automatically patch every failure or redesign a contributor's work.
- Recommend human closure for duplicates or out-of-scope PRs; do not close them.

Return the findings and verification limits. A review does not merge the PR.
