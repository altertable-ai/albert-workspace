---
name: review-pr
description: Review community pull requests against Altertable SDK standards. Use when reviewing contributor PRs, checking naming conventions, test coverage, changelog entries, and deciding whether to approve, request changes, or close.
---

# Community PR Review

## Purpose

Use this skill to review pull requests submitted to any Altertable SDK repository. Ensures contributions meet project standards before merge.

## Related Skills

- **[release-sdk](../release-sdk/SKILL.md)**: Naming, versioning, and changelog conventions
- **[sync-repos](../sync-repos/SKILL.md)**: Repository inventory and community file standards
- **[build-lakehouse-sdk](../build-lakehouse-sdk/SKILL.md)**: Lakehouse SDK implementation patterns
- **[build-product-analytics-sdk](../build-product-analytics-sdk/SKILL.md)**: Product Analytics SDK patterns

## Review Workflow

### Step 1: Gather context

```bash
gh pr view <number> --repo <repo> --json title,body,author,labels,files,additions,deletions
gh pr diff <number> --repo <repo>
gh pr checks <number> --repo <repo>
```

Note the PR author — first-time contributors need a more welcoming tone.

### Step 2: Check CI status

All CI checks must pass before approving. If checks fail:

1. Identify the failing job (lint, typecheck, test, integration)
2. Comment with the failure and a suggestion to fix
3. Do not approve until CI is green

### Step 3: Review against standards

#### Naming conventions

Verify all new public API symbols follow the SDK's naming conventions:

| Aspect | Convention |
|--------|-----------|
| Package name | `altertable-{product}-{lang}` or `altertable-{lang}` (see [release-sdk](../release-sdk/SKILL.md)) |
| Methods | Language-idiomatic casing (`snake_case` for Ruby/Python/Rust/Go/PHP, `camelCase` for JS/TS/Java/Kotlin/Swift) |
| Constants | `UPPER_SNAKE_CASE` across all languages |
| Types/Classes | `PascalCase` across all languages |
| Config options | Match existing option naming in the SDK |

#### Test coverage

Every PR must include tests for new or changed behavior:

- **New feature**: unit tests covering the happy path and at least one edge case
- **Bug fix**: a regression test that fails without the fix and passes with it
- **Refactor**: existing tests must continue to pass; no coverage regression

Check test files exist alongside implementation changes. If missing, request them.

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
| Missing tests or incomplete implementation | **Request changes** |
| CI failing | **Request changes** — ask author to fix |
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

````
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

```
Thanks for your first contribution to {repo}! 🎉

[review feedback here]
```

### Approving

```
Looks great — thanks for the contribution!
```

Keep it short. Don't over-explain when approving.

### Requesting changes

```
Thanks for working on this! A few things to address before we can merge:

1. [Specific, actionable item]
2. [Specific, actionable item]

Let me know if you have questions.
```

### Closing

```
Thanks for the PR. [Reason for closing — duplicate/out of scope/etc.]

[If applicable: pointer to the right approach or issue to discuss first]
```

## Batch Review

To find PRs awaiting review across all repos:

```bash
for repo in $(gh repo list altertable-ai --json nameWithOwner -q '.[].nameWithOwner' | grep -E 'altertable-(lakehouse-|js|py|swift|kotlin|ruby|java|go|php|rust)'); do
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
