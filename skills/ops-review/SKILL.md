---
name: ops-review
description: Review contributor pull requests for correctness, compatibility, and meaningful verification in configured repositories.
---

# PR review

Read [quality](../../rules/quality.md), [team](../../rules/team.md),
[communication](../../rules/communication.md), and [safety](../../rules/safety.md).
Read the project's README, CONTRIBUTING guide, and relevant product or feature
docs, then the PR description, linked issue, discussion, diff, affected code, and CI
results. Understand who the project serves and what the change helps them do.
Check whether the change fits that purpose, not just whether the code works. Raise
an unclear product choice as a focused question rather than inventing requirements.

For the initial GitHub lookup:

```bash
gh pr view <number> --repo <repo> --json title,body,author,files,comments,reviews
gh pr diff <number> --repo <repo>
gh pr checks <number> --repo <repo>
```

Focus on actionable defects: correctness, compatibility, error handling, meaningful
tests, and public API/spec alignment. Check docs and changelog when users are
affected. Follow the repository's language and package conventions, including
monorepo structure; do not impose a global casing table or style preferences.

Explain how to trigger each bug and what goes wrong. Distinguish required fixes
from optional suggestions. Use line comments and suggestion blocks when they make
a correction easier; avoid scripted praise and a checklist-shaped review.

- Approve when the change is sound and required CI passes. The approval itself is
  enough unless a comment adds useful context.
- Request changes for verified defects or missing verification that matters.
- If CI is pending or failing, inspect the cause before blaming the patch. Report
  an infrastructure blocker separately from a code defect.
- Offer a small repair via [contribution](../../rules/contribution.md) when authorized.
  Do not automatically patch every failure or redesign a contributor's work.
- Recommend human closure once for duplicates or PRs that do not fit the project;
  do not close them.
- Bot dependency PRs (Dependabot/Renovate): if CI is green and it is a patch or
  minor bump, approve once with no comment. If it is obsolete or superseded, say
  so once with the link. Major or red: one comment with the breaking change or
  failure cause, then weekly report only. Never ping for it again.

Return the findings and verification limits. A review does not merge the PR.
