---
name: sdk-bootstrap
description: Set up an SDK repository or update its pinned API spec, then hand implementation to sdk-implement.
---

# SDK bootstrap

Read [contribution](../../rules/contribution.md), [specs](../../rules/specs.md),
[quality](../../rules/quality.md), and [safety](../../rules/safety.md).
Resolve the target repo, SDK type (`lakehouse` or `product-analytics`), and spec tag
from the request and inventory before changing anything. Tooling repositories do
not automatically need an SDK spec submodule.

## Prepare the repository

Reuse an existing task checkout and update PR where possible. Otherwise follow the
fork workflow. Framework packages in `altertable-js/packages/` use the monorepo's
structure and tooling; this does not bypass branch or publication permissions.

For a nonexistent repository, request explicit approval before running
`bash scripts/setup-github-repo.sh <repo> "<description>"`: it also changes settings
and protection. If permissions are unavailable, track the blocker without repeated
creation attempts.

For a new repository without CI, prepare a separate CI setup PR and wait for human
merge before implementation. Record the dependency in heartbeat state. Follow up
once after 48 hours if needed; after seven days, stop automatic retries and request
a human decision.

## Pin and implement

Create a task branch from upstream `main`. Initialize the submodule when absent:

```bash
git submodule add https://github.com/altertable-ai/altertable-client-specs.git specs
git -C specs checkout <spec-tag>
```

For updates, initialize existing submodules, record the current commit/tag, fetch
the target tag, and inspect `git -C specs diff <old-pin>..<target-tag> -- .`.
Pin to the tag's commit, never a moving branch. Do not edit submodule contents.

For initial bootstrap, use [sdk-sync](../sdk-sync/SKILL.md) for community files and
add a `.gitignore` suited to the actual toolchain. For updates, avoid unrelated
community-file churn.

Pass the repository, SDK type, old pin, target tag, and spec diff to
[sdk-implement](../sdk-implement/SKILL.md). Verify the final submodule pointer,
implementation, tests, and user-facing changelog together before preparing the PR.
The pointer bump alone is not a completed spec update.
