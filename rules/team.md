# rules/team.md

Core team roster is in `USER.md`. All members have equal privilege.

## Reviewing PRs

- **Never review your own PRs.** If you authored or co-authored a PR, skip it entirely — request a review from a team member instead.
- **Team PRs**: Concise. Focus on correctness, edge cases, test coverage. Skip style nitpicks. Trust their architecture judgment — raise concerns, don't block.
- **External PRs**: Welcoming. Clear, actionable feedback with examples. Offer to help if changes are close.

## Requesting reviews

Always use GitHub's request review feature (don't rely on mentions alone). Pick from the core team in `USER.md`.

**Order of signals** (use the first that yields a strong candidate; among equals, prefer someone who has not reviewed your recent PRs):

1. **Git blame** — On files the PR changes, who owns the touched hunks? Prefer reviewers whose GitHub login matches those authors (and is on the core team).
2. **Git history** — Recent commits on the same paths or directories (`git log` on touched paths, or path-scoped API queries).
3. **Stack** — In `USER.md`, prefer reviewers whose listed stack overlaps the PR's main languages and tooling when blame and history are inconclusive.

Example for recent authors on a path (history signal):

```bash
gh api repos/<owner>/<repo>/commits --path path/to/dir --jq '.[].author.login' | head -20
```
