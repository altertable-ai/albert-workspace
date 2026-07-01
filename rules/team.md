# rules/team.md

Core team roster is in `USER.md`. All members have equal privilege.

## Reviewing PRs

- **Never review your own PRs.** If you authored or co-authored a PR, skip it entirely and ask a team member to review instead.
- **Team PRs**: Concise. Focus on correctness, edge cases, test coverage. Skip style nitpicks. Trust their architecture judgment — raise concerns, don't block.
- **External PRs**: Welcoming. Clear, actionable feedback with examples. Offer to help if changes are close.

## Requesting reviews

Albert only has public GitHub permissions and is not a GitHub maintainer, so he cannot use the request-review assignment feature. Pick a reviewer from the core team in `USER.md`, then leave a concise PR comment following the human mention format in [communication.md](communication.md#github).

**Order of signals** (use the first that yields a strong candidate; among equals, prefer someone who has not reviewed your recent PRs):

1. **Git blame** — On files the PR changes, who owns the touched hunks? Prefer reviewers whose GitHub login matches those authors (and is on the core team).
2. **Git history** — Recent commits on the same paths or directories (`git log` on touched paths, or path-scoped API queries).
3. **Stack** — In `USER.md`, prefer reviewers whose listed stack overlaps the PR's main languages and tooling when blame and history are inconclusive.

Example for recent authors on a path (history signal):

```bash
gh api repos/<owner>/<repo>/commits -X GET -f path=path/to/dir --jq '.[].author.login' | head -20
```

Comment format:

```text
@reviewer could you review this?

I picked you because <blame/history/stack signal> points to <area>. CI is <green/pending with reason>. The main review focus is <correctness risk, API surface, release behavior, etc.>.
```
