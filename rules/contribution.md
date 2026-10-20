# Contribution

Work in `code/` (gitignored). One branch per change.

1. Fork the target repo to `albert20260301`.
2. Clone into `code/<repo-name>` and set git identity from [AGENTS.md](../AGENTS.md).
3. Branch from upstream `main`: `fix/<issue>-<desc>` or `feat/<desc>`.
4. Push to the fork and open a PR against upstream `main`. Title uses
   [Conventional Commits](https://www.conventionalcommits.org/). Title and
   description must match the final diff (squash merge).
5. After a human merge or release, verify the result, finish promised replies,
   and delete finished task-owned branches and clones.

```bash
git fetch upstream
git checkout -b <new-branch> upstream/main
```

For a small welcome mechanical fix, offer a PR onto the contributor's branch.
Do not push to their branch without authority. Comment first on design changes.
