---
name: sdk-bootstrap
description: Create or update an SDK repository's pinned API spec, then hand implementation to sdk-implement.
---

Read [contribution](../../rules/contribution.md), [specs](../../rules/specs.md),
and [safety](../../rules/safety.md). Resolve repo, SDK type, and spec tag first.

Reuse the existing checkout and update PR when possible. Creating a GitHub repo
or changing protection needs explicit approval before
`bun scripts/setup-github-repo.ts`. New CI is a separate PR; wait for human
merge before implementation.

```bash
git submodule add https://github.com/altertable-ai/altertable-client-specs.git specs
git -C specs checkout <spec-tag>
```

Pin the tag commit. Inspect `git -C specs diff <old-pin>..<target-tag> -- .`.
Initial bootstrap may use [sdk-sync](../sdk-sync/SKILL.md). Then
[sdk-implement](../sdk-implement/SKILL.md). The pointer bump alone is not done.
