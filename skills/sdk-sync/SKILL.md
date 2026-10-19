---
name: sdk-sync
description: Audit and synchronize managed community files and GitHub Actions policy across selected Altertable repositories.
---

# Shared-file sync

Read [contribution](../../rules/contribution.md),
[change-control](../../rules/change-control.md), and [safety](../../rules/safety.md).
Accept a repository set and `audit` or `apply` mode; default to audit unless changes
are requested or covered by the maintenance routine. Use the `sdks` inventory in
[repositories.config.json](../../repositories.config.json) for an ecosystem audit.

## Managed files

[templates/](templates/) owns shared community documents, issue/PR templates,
funding metadata, and the semantic PR title workflow. Mirror paths in the target
repo. Copy literal templates verbatim and render only declared placeholders.

Current placeholders: `{package_name}` from the inventory; `{language}` from the
target package; `{install_command}`, `{test_command}`, `{check_command}`, `{linter}`,
`{formatter}`, and `{lint_command}` from its actual toolchain. Do not invent commands
or overwrite intentional repository-specific behavior without understanding it.

## GitHub Actions policy

Apply this policy to every workflow in each repository, including language-specific CI, release, security, and semantic-title workflows:

- Linux jobs use `ubuntu-24.04`, the workspace's pinned Ubuntu image; do not use `ubuntu-latest` or an older Ubuntu image. macOS and Windows jobs retain their platform-specific pinned image where required.
- Every third-party `uses:` reference is pinned to a 40-character commit SHA with its reviewed release tag in a comment. Local reusable workflows remain relative references.
- A repository that uses `actions/setup-node` commits a root `.node-version`; every Node setup reads it through `node-version-file: .node-version` rather than hard-coding a workflow value.
- A repository that uses `oven-sh/setup-bun` commits a root `.bun-version`; every Bun setup reads it through `bun-version-file: .bun-version` rather than hard-coding a workflow value.

`.node-version` and `.bun-version` are repository-owned runtime contracts, not shared templates: preserve the version that the repository supports and make its workflows consume that file. During an audit, run `bash scripts/validate-workflow-policy.sh <repository-root>` after fetching the target repository. Resolve any intentionally dynamic matrix runner or runtime version to an explicit, pinned value before opening the sync PR.

## Audit and apply

Compare rendered templates against each selected repository and report only drift:
missing, outdated, or intentionally different files. Check all workflows with
`bash scripts/validate-workflow-policy.sh <repository-root>`; the script is in this
workspace, not necessarily the target repository.

Repositories using release-please need semantic PR title validation because squash
commit titles drive releases. Use the canonical semantic workflow template rather
than duplicating its event list, action pin, and allowed types in other skills.

In apply mode, patch affected managed files and workflow/runtime contracts only.
Preserve language-specific CI logic. Check for unresolved placeholders, run relevant
validation, and prepare one focused PR per repository with its drift and checks.
Skip clean repositories and reuse existing sync PRs.

To manage a new shared file, add its template at the destination path and document
any new variables here before requesting propagation. A change to a template in this
workspace does not by itself authorize a cross-repository rollout.
