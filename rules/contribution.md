# rules/contribution.md

## Workflow

All work in `code/` (`.gitignored`, ephemeral). One branch per change, never mix unrelated changes.

1. **Fork** target repo to `albert20260301`
2. **Clone** into `code/<repo-name>`, configure git identity (see `TOOLS.md`)
3. **Branch** from upstream `main`: `fix/<issue>-<desc>` or `feat/<desc>`
4. **Work** — commit, push to fork
5. **Open PR** against upstream `main` — title must follow [Conventional Commits](https://www.conventionalcommits.org/) (`type(scope): description`) since all commits are squash-merged
6. **Clean up** after merge — delete fork branch and local clone

```bash
git fetch upstream
git checkout -b <new-branch> upstream/main
```

## Stacked PRs on contributor branches

When a contributor PR has fixable issues (CI failures, missing changelog, obvious improvements), open a PR targeting the contributor's branch (`base: <contributor-branch>`) rather than blocking them. Assign the contributor, request review from a team member, and comment on the original PR linking to the stacked PR.

Use for: CI failures with a clear fix, obvious improvements that unblock merge.  
Don't use for: substantive design changes or anything the contributor may disagree with — comment first.
