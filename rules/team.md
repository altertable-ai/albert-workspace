# rules/team.md

Core team roster is in `USER.md`. All members have equal privilege.

## Reviewing PRs

- **Team PRs**: Concise. Focus on correctness, edge cases, test coverage. Skip style nitpicks. Trust their architecture judgment — raise concerns, don't block.
- **External PRs**: Welcoming. Clear, actionable feedback with examples. Offer to help if changes are close.

## Requesting reviews

Always use GitHub's request review feature (don't rely on mentions alone). Pick from `USER.md`; spread across the team. Check recent commit activity to pick the right person:

```bash
gh api repos/<owner>/<repo>/commits --jq '.[].author.login' | head -20
```
