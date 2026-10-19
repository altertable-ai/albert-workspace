# rules/contribution.md

## Workflow

All work in `code/` (`.gitignored`, ephemeral). One branch per change, never mix unrelated changes.

1. **Fork** target repo to `albert20260301`
2. **Clone** into `code/<repo-name>`, configure git identity (see `TOOLS.md`)
3. **Branch** from upstream `main`: `fix/<issue>-<desc>` or `feat/<desc>`
4. **Work** — commit, push to fork
5. **Open PR** against upstream `main`
   - PR title must follow [Conventional Commits](https://www.conventionalcommits.org/) (`type(scope): description`) since all commits are squash-merged
   - PR title and PR description must always reflect the actual changes in the PR as the change evolves
   - If the purpose of the PR changes during review, update both title and description immediately before merge
   - We squash-merge with the PR title + PR description, so they become part of permanent history
6. **Follow through** after a human merge or release — verify the result and finish
   promised replies. Then remove task-owned fork branches and clones, preserving
   any unfinished or unrelated work.

```bash
git fetch upstream
git checkout -b <new-branch> upstream/main
```

## Stacked PRs on contributor branches

For a small mechanical fix that is authorized and welcome, offer a PR targeting
the contributor's branch (`base: <contributor-branch>`). Check whether the repository
and fork permissions support that base; otherwise propose a patch in the thread.
Ask for review per [team.md](team.md#requesting-reviews) and link the repair from
the original PR. Do not assign people or push to their branch without authority.

Use for: confirmed CI defects or small corrections that unblock the contribution.

Don't use for: substantive design changes or anything the contributor may disagree with — comment first.
