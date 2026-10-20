# Quality

Verify the behavior the change affects, using the repository's actual tooling.
For bug fixes, prefer a regression test that fails before the fix and passes after.
Cover meaningful error paths; do not demand artificial tests for prose or metadata.

Before preparing a PR or recommending approval:

- Read the final diff and check affected callers, compatibility, and user impact.
- Run relevant tests, lint, type checks, and builds. State exactly what passed,
  what could not run, and why. CI must pass before recommending merge.
- For SDK API changes, check the pinned spec per [specs.md](specs.md), update usage
  docs and the user-facing changelog, and compare a sibling SDK if behavior is shared.
  Any deviation from the spec needs an explicit comment. Record relevant
  divergence without expanding the patch into a cross-repo rewrite.
- For workspace changes, run `make lint`, `make validate`, and `make check-links`
  when available. Describe behavioral validation for instruction changes.

PR titles use Conventional Commits. Title and description must describe the final
diff: they become the squash commit's permanent history. Explain material risks
and verification without adding a checklist to every PR.
