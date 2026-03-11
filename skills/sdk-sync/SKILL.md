---
name: sdk-sync
description: Keep shared configuration, community files, and CI templates consistent across all SDK repositories. Use when auditing cross-repo consistency or propagating a change (license, contributing guidelines, CI updates, bot config) to multiple SDK repos.
---

# SDK Sync

Audit and synchronize shared files across all Altertable SDK repositories. Repository inventory: [`repositories.config.json`](../../repositories.config.json) (each entry has `repo`, `type`, `package`, `registry`). Edit that file to add/remove repos — all scripts pick it up automatically.

**Rules:** [change-control](../../rules/change-control.md) · [contribution](../../rules/contribution.md) · [safety](../../rules/safety.md)

## Managed Files and File Templates

All files in the [`templates/`](./templates/) folder are the source of truth and must be copied into every target repo, mirroring the same directory structure. Files containing `{variable}` placeholders are templated; all others are copied verbatim.

### Template variables

Templated files contain `{variable}` placeholders. Render them with repo-specific values during sync:

| Variable | Source |
|----------|--------|
| `{package_name}` | From `sdk-release` naming conventions |
| `{package_type}` | Registry type: `node`, `python`, `ruby`, `rust`, `java`, `kotlin`, `go`, `php`, `swift` |
| `{language}` | Target language name |
| `{language_version}` | Minimum required version (e.g., `3.1`, `18`, `1.21`) |
| `{language_setup_action}` | GitHub Actions setup action (e.g., `actions/setup-node@v4`, `actions/setup-python@v5`) |
| `{language_version_key}` | Setup action version key (`node-version`, `python-version`, `ruby-version`, etc.) |
| `{install_command}` | Repo's existing toolchain |
| `{test_command}` | Repo's existing toolchain |
| `{check_command}` | Repo's existing toolchain |
| `{linter}` | Repo's existing toolchain |
| `{formatter}` | Repo's existing toolchain |
| `{lint_command}` | Repo's existing toolchain |

## Sync Workflow

### Phase 1: Audit

1. Clone or fetch all repos from `repositories.config.json`.
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
