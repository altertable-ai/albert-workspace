---
name: sdk-sync
description: Audit and sync managed community files and GitHub Actions policy across selected repos.
---

Read [contribution](../../rules/contribution.md) and [safety](../../rules/safety.md).
Default to audit. Apply only when requested or on the daily full sync. Use the
`sdks` inventory.

[templates/](templates/) owns shared community files. Copy them verbatim except
declared placeholders: `{package_name}`, `{language}`, `{install_command}`,
`{test_command}`, `{check_command}`, `{linter}`, `{formatter}`, `{lint_command}`.

Every workflow: Linux `ubuntu-24.04`; third-party `uses:` pinned to a 40-character
SHA plus tag comment; Node/Bun versions from committed `.node-version` /
`.bun-version`. Audit with `bun scripts/validate-workflow-policy.ts <root>`.
One focused PR per repository. A template change here does not authorize a
rollout by itself.
