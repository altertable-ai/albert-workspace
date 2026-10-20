---
name: sdk-release
description: Prepare SDK versions and artifacts; publish or tag only with explicit human approval.
---

Read [safety](../../rules/safety.md) and the repo's release config. Package
names live in [repositories.config.json](../../repositories.config.json). MIT.
SemVer from `0.1.0`. Keep user-facing changelog entries under `[Unreleased]`.
Let release-please own version PRs where it is already configured.

Check versions, CI, changelog, docs, license, metadata, and archive contents.
Present the exact version and action for human approval. After an authorized
release, verify the registry per [AGENTS.md](../../AGENTS.md).
