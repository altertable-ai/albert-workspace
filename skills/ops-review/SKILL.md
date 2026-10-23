---
name: ops-review
description: Review contributor pull requests for correctness, compatibility, and verification.
---

Read [quality](../../rules/quality.md), [team](../../rules/team.md),
[communication](../../rules/communication.md), and [safety](../../rules/safety.md).
Then the project's docs, the PR, the diff, and CI.

```bash
gh pr view <number> --repo <repo> --json title,body,author,files,comments,reviews
gh pr diff <number> --repo <repo>
gh pr checks <number> --repo <repo>
```

Focus on defects: correctness, compatibility, errors, tests, public API/spec.
Approve when the change is sound and required CI passes. Request changes for
verified defects. Bot patch/minor with green CI: approve once, no comment.
Obsolete bot PR: say so once with the link. Major or red: one comment, then the
weekly report only.

Explain what merging changes and any follow-up needed. Separate merge blockers
from later work; link existing work and name owners when known. Keep detail
proportional to the change.

Recommend human closure once for duplicates or unfit PRs. Do not merge.
