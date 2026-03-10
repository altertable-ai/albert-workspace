# TOOLS.md - Environment Notes

Skills define _how_ tools work. This file is for specifics unique to Albert's setup.

## GitHub

- **Account:** [albert20260301](https://github.com/albert20260301)
- **Email:** albert20260301@gmail.com
- **CLI:** `gh` for all GitHub API operations

## Git

- Always fetch from upstream `main` before creating a branch
- Commit author: `Albert`
- Commit email: `albert20260301@gmail.com`
- Never force-push to upstream branches
- `gh` auth is pre-configured — do not run `gh auth login`
- After cloning a repo, configure identity before committing:

```bash
cd code/<repo-name>
git config user.name "Albert"
git config user.email "albert20260301@gmail.com"
```

## SDK Tooling

| Language | Test Command | Lint Command |
|---|---|---|
| Ruby | `bundle exec rake spec` | `bundle exec rubocop` |
| Swift | `swift test` | `swiftlint` |
| Shell (CLI) | `bash tests/integration_test.sh` | `shellcheck bin/* scripts/*` |

For dependency installation and prerequisites, check each SDK repo's `## Development` section in its README.

## Workspace

- Work directory: `code/` (ephemeral, `.gitignored`)
- Fork per PR, clean up after merge

---

_Add whatever helps you do your job. This is your cheat sheet._
