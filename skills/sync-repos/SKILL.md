---
name: sync-repos
description: Keep shared configuration, community files, and CI templates consistent across all SDK repositories. Use when auditing cross-repo consistency or propagating a change (license, contributing guidelines, CI updates, bot config) to multiple SDK repos.
---

# Sync Repos Skill

## Purpose

Use this skill to audit and synchronize shared files across all Altertable SDK repositories. Drift in community files, CI config, and bot settings creates maintenance burden and inconsistent contributor experience.

## Repository Inventory

All Altertable SDK repositories under active maintenance. This is the canonical list referenced by `triage-issues`, `review-pr`, and `sync-repos` batch operations.

### Lakehouse SDKs

| Repository | Package | Registry |
|------------|---------|----------|
| `altertable-ai/altertable-lakehouse-ruby` | `altertable-lakehouse-ruby` | RubyGems |
| `altertable-ai/altertable-lakehouse-python` | `altertable-lakehouse-python` | PyPI |
| `altertable-ai/altertable-lakehouse-go` | `altertable-lakehouse-go` | Go Modules |
| `altertable-ai/altertable-lakehouse-java` | `altertable-lakehouse-java` | Maven Central |
| `altertable-ai/altertable-lakehouse-kotlin` | `altertable-lakehouse-kotlin` | Maven Central |
| `altertable-ai/altertable-lakehouse-rust` | `altertable-lakehouse-rust` | crates.io |
| `altertable-ai/altertable-lakehouse-php` | `altertable-lakehouse-php` | Packagist |

### Product Analytics SDKs

| Repository | Package | Registry | Notes |
|------------|---------|----------|-------|
| `altertable-ai/altertable-js` | `altertable-js`, `altertable-react`, `altertable-vue`, `altertable-svelte` | npm | Monorepo |
| `altertable-ai/altertable-py` | `altertable-py` | PyPI | |
| `altertable-ai/altertable-swift` | `altertable-swift` | Swift Package Index | |
| `altertable-ai/altertable-kotlin` | `altertable-kotlin` | Maven Central | |
| `altertable-ai/altertable-ruby` | `altertable-ruby` | RubyGems | |
| `altertable-ai/altertable-java` | `altertable-java` | Maven Central | |
| `altertable-ai/altertable-go` | `altertable-go` | Go Modules | |
| `altertable-ai/altertable-php` | `altertable-php` | Packagist | |
| `altertable-ai/altertable-rust` | `altertable-rust` | crates.io | |

### Batch operation helper

To enumerate all repos for shell-based batch operations:

```bash
gh repo list altertable-ai --json nameWithOwner -q '.[].nameWithOwner' \
  | grep -E 'altertable-(lakehouse-|js$|py$|swift$|kotlin$|ruby$|java$|go$|php$|rust$)'
```

## Related Skills

- **[bootstrap-sdk](../bootstrap-sdk/SKILL.md)**: Initial repo setup (creates many of these files)
- **[release-sdk](../release-sdk/SKILL.md)**: Release conventions and package metadata

## Managed Files and File Templates

All files in the [`templates/`](./templates/) folder are the source of truth and must be copied into every target repo, mirroring the same directory structure. Files containing `{variable}` placeholders are templated; all others are copied verbatim.

### Template variables

Templated files contain `{variable}` placeholders. Render them with repo-specific values during sync:

| Variable | Source |
|----------|--------|
| `{package_name}` | From `release-sdk` naming conventions |
| `{language}` | Target language name |
| `{install_command}` | Repo's existing toolchain |
| `{test_command}` | Repo's existing toolchain |
| `{check_command}` | Repo's existing toolchain |
| `{linter}` | Repo's existing toolchain |
| `{formatter}` | Repo's existing toolchain |
| `{lint_command}` | Repo's existing toolchain |

## Sync Workflow

### Phase 1: Audit

1. Clone or fetch all repos from the inventory above.
2. For each managed file, compare the repo's version against the source of truth.
3. Report drift:

```
DRIFT REPORT
============
altertable-lakehouse-ruby:
  ✗ SECURITY.md — missing
  ✗ CONTRIBUTING.md — outdated (missing Conventional Commits section)
  ✓ LICENSE — ok

altertable-py:
  ✓ SECURITY.md — ok
  ✗ .github/ISSUE_TEMPLATE/bug_report.yml — missing
  ✓ LICENSE — ok
```

### Phase 2: Generate patches

For each repo with drift:

1. Copy verbatim files from `templates/` directly.
2. Render templated files from `templates/` with repo-specific variables (see **Template variables** above).

### Phase 3: Open PRs

For each repo with changes:

1. Create a branch: `chore/sync-community-files`
2. Commit all changes: `chore: sync community files`
3. Open a PR with the drift report as the body

## Adding a New Managed File

When a new file should be consistent across all repos:

1. Add the file to the `templates/` folder at the path it should occupy in the target repo.
2. If it needs per-repo values, use `{variable}` placeholders and add a row to the **Template variables** table above.
3. Run the sync workflow to propagate.

## Acceptance Checklist

- [ ] All repos in the inventory have been audited
- [ ] Drift report generated for all managed files
- [ ] Verbatim files are byte-identical across repos
- [ ] Templated files use correct repo-specific values
- [ ] PRs opened for all repos with drift
- [ ] No files outside the managed list were modified
