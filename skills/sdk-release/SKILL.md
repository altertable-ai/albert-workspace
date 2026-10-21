---
name: sdk-release
description: Prepare SDK versions, changelog, and a release or release-please PR. Humans publish and tag.
---

Read [safety](../../rules/safety.md) and the repo's release config. Package
names live in [repositories.config.json](../../repositories.config.json). MIT.
SemVer from `0.1.0`. Keep user-facing changelog entries under `[Unreleased]`.
Let release-please own version PRs where it is already configured.

Check versions, CI, changelog, docs, license, metadata, and archive contents.
Open or update the release / release-please PR with the exact version. Stop
there. Humans publish and tag.

After a human publishes, verify the registry per [AGENTS.md](../../AGENTS.md).
