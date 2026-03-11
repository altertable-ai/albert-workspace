---
name: ops-review
description: Review community pull requests against Altertable SDK standards. Use when reviewing contributor PRs, checking naming conventions, test coverage, changelog entries, and deciding whether to approve, request changes, or close.
---

# Community PR Review

Called by `routine-maintainer`. Ensures contributions meet project standards before merge.

**Rules:** [quality](../../rules/quality.md) · [team](../../rules/team.md) · [communication](../../rules/communication.md) · [contribution](../../rules/contribution.md)

## Review Workflow

### Step 1: Gather context

```bash
gh pr view <number> --repo <repo> --json title,body,author,labels,files,additions,deletions
gh pr diff <number> --repo <repo>
gh pr checks <number> --repo <repo>
```

Note the PR author — first-time contributors need a more welcoming tone. Check whether the contributor has enabled "Allow edits by maintainers" — this determines whether a stacked PR is possible.

### Step 2: Check CI status

All CI checks must pass before approving. If checks fail:

1. Identify the failing job (lint, typecheck, test, integration)
2. If the fix is obvious and small (e.g., a missing changelog entry, a formatting issue, a trivial lint error): push a fix directly to the contributor's branch (if they've allowed maintainer edits) or open a stacked PR per [rules/contribution.md](../../rules/contribution.md)
3. Otherwise, comment with the failure and a clear suggestion to fix

### Step 3: Review against standards

#### Naming conventions

Verify all new public API symbols follow the SDK's naming conventions:

| Aspect | Convention |
|--------|-----------|
| Package name | `altertable-{product}-{lang}` or `altertable-{lang}` (see [sdk-release](../sdk-release/SKILL.md)) |
| Methods | Language-idiomatic casing (`snake_case` for Ruby/Python/Rust/Go/PHP, `camelCase` for JS/TS/Java/Kotlin/Swift) |
| Constants | `UPPER_SNAKE_CASE` across all languages |
| Types/Classes | `PascalCase` across all languages |
| Config options | Match existing option naming in the SDK |

**Monorepo exception:** The [`altertable-js`](https://github.com/altertable-ai/altertable-js) repository is a monorepo containing multiple packages (React, Vue, Svelte wrappers) under `packages/`. Standard SDK naming and structure rules don't apply — review against the monorepo's own conventions and existing patterns.

#### Test coverage

Every PR must include tests for new or changed behavior:

- **New feature**: unit tests covering the happy path and at least one failure case (invalid input, disabled feature, or error condition)
- **Bug fix**: a regression test that fails without the fix and passes with it
- **Refactor**: existing tests must continue to pass; no coverage regression

Check that tests exist *and test the right thing*. A test that mocks the behavior under test, or always passes regardless of implementation, is worse than no test — flag it. If tests are missing, request them.

#### Spec alignment

For PRs touching public API, verify the implementation matches `specs/<type>/SPEC.md` (available in the repo's `specs/` submodule). Any deviation from spec — even a small one — requires an explicit explanation in the PR body. Without one, request changes.

#### Blast radius

For PRs touching shared utilities, core modules, or cross-cutting concerns: verify no downstream consumers within the same repo are broken. If the pattern exists in sibling SDKs, note it as a comment (not a blocker, but worth tracking).

#### Changelog

All user-facing changes must have a `CHANGELOG.md` entry under `[Unreleased]`:

- Uses imperative mood ("Add support for…", not "Added support for…")
- Categorized correctly (`Added`, `Changed`, `Fixed`, `Removed`)
- One entry per logical change

If missing, request it with a suggestion. For internal-only changes (CI, docs, refactors with no API change), a changelog entry is optional.

#### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `chore:` for maintenance
- `refactor:` for refactoring
- `test:` for test-only changes

Squash commits are fine — the merge commit message matters most.

#### Code quality

- No hardcoded secrets or credentials
- Error handling is comprehensive (no undocumented swallowed exceptions)
- Public API methods have documentation/docstrings
- No unnecessary dependencies added
- Backwards compatible unless explicitly a breaking change
- Follows existing code style and patterns in the repo

#### Breaking changes

If the PR introduces a breaking change:

- `BREAKING CHANGE:` must appear in the commit message footer
- Changelog entry must be under `Changed` or `Removed` with a migration note
- Version bump must be major (or minor if still on `0.x`)
- README must be updated to reflect the new API

## Decision Matrix

| Condition | Action |
|-----------|--------|
| CI green, standards met, tests included | **Approve** |
| Minor issues (typo, missing changelog entry, small style nit) | **Approve** with comments |
| CI failing or minor issue with an obvious fix | **Push fix** to contributor's branch or open a stacked PR (see [rules/contribution.md](../../rules/contribution.md)) |
| Missing tests or incomplete implementation | **Request changes** |
| Breaks public API without justification | **Request changes** |
| Spam, off-topic, or fundamentally misguided approach | **Close** with explanation |
| Duplicate of another PR | **Close** linking to the other PR |

## Comment Guidelines

### Tone

- Be welcoming, especially to first-time contributors
- Lead with what's good before noting what needs fixing
- Use suggestions, not commands ("Consider…", "Would you mind…")
- Link to relevant docs or examples when requesting a change

### Feedback format

Use GitHub suggestion blocks for concrete fixes:

````text
```suggestion
corrected code here
```
````

Categorize feedback:

- **Required**: must be addressed before merge
- **Suggestion**: optional improvement, won't block merge
- **Question**: clarification needed, may or may not block

### First-time contributors

Add a welcome message:

```text
Thanks for your first contribution to {repo}! 🎉

[review feedback here]
```

### Approving

```text
Looks great — thanks for the contribution!
```

Keep it short. Don't over-explain when approving.

### Requesting changes

```text
Thanks for working on this! A few things to address before we can merge:

1. [Specific, actionable item]
2. [Specific, actionable item]

Let me know if you have questions.
```

### Closing

```text
Thanks for the PR. [Reason for closing — duplicate/out of scope/etc.]

[If applicable: pointer to the right approach or issue to discuss first]
```

## Batch Review

To find PRs awaiting review across all repos:

```bash
for repo in $(jq -r '.[].repo' ../../repositories.config.json); do
  echo "=== $repo ==="
  gh pr list --repo "$repo" --state open --json number,title,author,createdAt \
    --jq '.[] | "\(.number)\t\(.author.login)\t\(.title)"'
done
```

Process each PR through the review workflow above. Prioritize by age (oldest first).

## Acceptance Checklist

- [ ] CI status checked
- [ ] Naming conventions verified for new public symbols
- [ ] Tests exist for new/changed behavior
- [ ] Changelog entry present for user-facing changes
- [ ] Commit messages follow Conventional Commits
- [ ] No hardcoded secrets or credentials
- [ ] Breaking changes properly flagged (if applicable)
- [ ] Review comment posted with clear, actionable feedback
