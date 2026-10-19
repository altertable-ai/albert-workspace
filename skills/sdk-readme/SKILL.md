---
name: sdk-readme
description: Write or update SDK and monorepo READMEs with runnable usage, accurate API/configuration references, and development commands.
---

# SDK README

Inspect the package's actual API, manifest, scripts, examples, and existing docs.
Use [quality](../../rules/quality.md) to verify the result. Preserve useful existing
structure unless it impedes the reader; do not rewrite the whole README for one
changed method.

## Package README

Lead with what the package does and where it runs, then make the first successful
use easy: install, a short runnable quick start, API reference, configuration,
development, and license. Add framework setup where needed.

- Use real imports, initialization, and one meaningful action (`track` for analytics,
  a query for Lakehouse). Aim for a quick start under about 20 lines.
- Document public methods and options accurately, including defaults and required
  values. Use compact tables and examples where they reduce reader effort. Link
  maintained API docs rather than duplicating an exhaustive reference unnecessarily.
- Show actual prerequisites and dependency, test, lint, and build commands. Do not
  invent watch modes, scripts, or supported runtime versions.
- Link the repository license; do not paste its text.

## Monorepo root

Describe the project and route readers to package READMEs with a package table.
Include shared setup, development, tests, and the existing release workflow. Link
examples when present. Keep package-specific API and installation details in the
package docs.

## Check

Run practical examples or validate them against tests and source. Check commands,
option defaults, links, and package names. Keep prose concrete and omit unsupported
claims such as “production-grade”, placeholder sections, and ornamental badges.
Include useful project links: [Altertable](https://altertable.ai),
[documentation](https://altertable.ai/docs), and the actual repository.
