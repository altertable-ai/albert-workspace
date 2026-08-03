---
name: sdk-sync
description: Keep shared configuration, community files, and CI templates consistent across all SDK repositories. Use when auditing cross-repo consistency or propagating a change (license, contributing guidelines, CI updates, bot config) to multiple SDK repos.
---

# SDK Sync

Audit and synchronize shared files across all Altertable SDK repositories. Repository inventory: [`repositories.config.json`](../../repositories.config.json). Edit that file to add/remove repos — all scripts pick it up automatically.

**Rules:** [change-control](../../rules/change-control.md) · [contribution](../../rules/contribution.md) · [safety](../../rules/safety.md)

## Managed Files and File Templates

All files in the [`templates/`](./templates/) folder are the source of truth and must be copied into every target repo, mirroring the same directory structure. Files containing `{variable}` placeholders are templated; all others are copied verbatim.

Managed files include community docs, issue/PR templates, funding metadata, and release automation guardrails. Language-specific CI workflows are owned by each SDK repo, but the semantic PR title workflow is shared because release-please depends on squash-merge titles.

## GitHub Actions policy

Apply this policy to every workflow in each repository, including language-specific CI, release, security, and semantic-title workflows:

- Linux jobs use `ubuntu-24.04`, the current GitHub-hosted Ubuntu LTS image; do not use `ubuntu-latest` or an older Ubuntu image. macOS and Windows jobs retain their platform-specific pinned image where required.
- Every third-party `uses:` reference is pinned to a 40-character commit SHA with its reviewed release tag in a comment. Local reusable workflows remain relative references.
- A repository that uses `actions/setup-node` commits a root `.node-version`; every Node setup reads it through `node-version-file: .node-version` rather than hard-coding a workflow value.
- A repository that uses `oven-sh/setup-bun` commits a root `.bun-version`; every Bun setup reads it through `bun-version-file: .bun-version` rather than hard-coding a workflow value.

`.node-version` and `.bun-version` are repository-owned runtime contracts, not shared templates: preserve the version that the repository supports and make its workflows consume that file. During an audit, run `bash scripts/validate-workflow-policy.sh <repository-root>` after fetching the target repository. Resolve any intentionally dynamic matrix runner or runtime version to an explicit, pinned value before opening the sync PR.

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

1. Read `repositories.config.json` and iterate over the `sdks` array (do not include the `workspace` entry).
2. Clone or fetch all SDK repos from the `sdks` array.
3. For each managed file, compare the repo's version against the source of truth.
4. Audit every `.github/workflows/*.{yml,yaml}` against the GitHub Actions policy and record runner, action-pin, and runtime-version-file drift.
5. Treat a missing `.github/workflows/semantic-pull-request.yml` as release automation drift for every repo that uses release-please.
6. Report drift:

```text
DRIFT REPORT
============
altertable-lakehouse-ruby:
  ✗ SECURITY.md — missing
  ✗ CONTRIBUTING.md — outdated (missing Conventional Commits section)
  ✗ .github/workflows/semantic-pull-request.yml — missing
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
3. For workflow-policy drift, update only the affected repository-owned workflow(s) and root runtime version file(s); do not overwrite language-specific workflow logic with a shared template.

### Phase 3: Open PRs

For each repo with changes:

1. Create a branch: `chore/sync-community-files`
2. Commit all changes: `chore: sync community files`
3. Open a PR with the drift report as the body

## Adding a New Managed File

When a new file should be consistent across all SDK repos:

1. Add the file to the `templates/` folder at the path it should occupy in the target repo.
2. If it needs per-repo values, use `{variable}` placeholders and add a row to the **Template variables** table above.
3. Run the sync workflow to propagate.

## Acceptance Checklist

- [ ] All SDK repos in the inventory have been audited
- [ ] Drift report generated and stored in `memory/YYYY-MM-DD.md` for all managed files
- [ ] Verbatim files are byte-identical across repos
- [ ] Templated files use correct repo-specific values
- [ ] PRs opened only for SDK repos with drift (skip repos that are already in sync)
- [ ] No files outside the managed list were modified
