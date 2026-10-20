# Quality

Verify the behavior the change affects with the repository's actual tooling.
For bugs, prefer a regression test that failed before the fix.

Before a PR or an approval recommendation: read the final diff; run relevant
tests, lint, types, and builds; say what passed and what could not run. CI must
pass before recommending merge.

SDK API changes follow [specs.md](specs.md). Update usage docs and the
user-facing changelog. Note spec deviations in the PR; do not expand into a
cross-repo rewrite.

Workspace changes: `make lint`, `make validate`, and `make check-links` when
available.
