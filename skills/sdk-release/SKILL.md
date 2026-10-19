---
name: sdk-release
description: Prepare SDK versioning, changelogs, and package artifacts; publish or tag only with explicit human approval.
---

# SDK release

Read [safety](../../rules/safety.md), [quality](../../rules/quality.md), and the
target repository's release configuration. Distinguish package preparation from
publishing: neither an implementation task nor a green release PR authorizes a tag
or registry release.

## Prepare

Use [repositories.config.json](../../repositories.config.json) for package names,
registries, and monorepo mappings. Preserve existing published names. New Product
Analytics packages use `altertable-{lang}`; other products use
`altertable-{product}-{lang}` unless the ecosystem requires a different registry name.
All packages use MIT.

Use SemVer: start at `0.1.0`; fixes bump patch, features minor, breaking changes
major (minor while on `0.x`). Check the repository's actual release-please settings
and pre-1.0 behavior before relying on automation.

Keep user-facing entries under `[Unreleased]`, grouped by Added/Changed/Fixed/Removed,
with migration guidance for breaking changes and version comparison links at release.
For release-please repositories, let the configured automation own version/changelog
PRs. Conventional Commit PR titles matter because merges are squashed. The shared
title workflow and Actions policy are owned by [sdk-sync](../sdk-sync/SKILL.md).
Do not install a new release system as a side effect of preparing a package.

## Verify and hand off

Check intended versions, CI, changelog, usage docs, license, package metadata, and
the actual archive contents. Exclude credentials, local state, and development-only
artifacts. Preserve the package's supported module formats and runtime targets.

Registry-specific checks when relevant:

- npm: exports and declarations resolve; only intended files are published; declare
  `sideEffects: false` only when true.
- PyPI: valid build configuration and `py.typed` for typed packages.
- Maven Central: signatures, sources, and javadoc artifacts.
- crates.io: `cargo publish --dry-run`.

Present the exact version, artifacts, and release action for human approval before
tagging or publishing. After an authorized release, verify the version on its
registry using [TOOLS.md](../../TOOLS.md). Track publication failures without
repeatedly triggering a release.
