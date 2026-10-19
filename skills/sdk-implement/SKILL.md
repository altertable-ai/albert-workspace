---
name: sdk-implement
description: Implement or update an SDK against its pinned spec, including tests, fixtures, and affected documentation.
---

# SDK implementation

Read [specs](../../rules/specs.md), [quality](../../rules/quality.md), and
[contribution](../../rules/contribution.md). Accept the SDK type, target repo, and
optional old-to-new spec diff. This skill also works directly on an already pinned
repository; bootstrap is not a prerequisite.

## Read the contract

- Both SDK types: `specs/http/SPEC.md`.
- Lakehouse: `specs/lakehouse/SPEC.md`.
- Product Analytics: `specs/product-analytics/SPEC.md`, `CONSTANTS.md`,
  `TEST_PLAN.md`, and `fixtures/` in that directory.

Use the pinned submodule, not a workspace copy or unversioned web spec. Identify
affected APIs, consumers, tests, and docs. For a spec update, implement the changed
requirements rather than rebuilding the SDK. Respect the target tier and language.

## Implement and verify

Follow existing package structure and idioms. Test observable behavior and meaningful
failure paths. Run Product Analytics serializer fixtures with exact expected output.
Use the spec's platform fallback chains; do not invent universal polyfills or
silently weaken a requirement. For Lakehouse streaming, surface parse/backend
errors with line context rather than dropping rows; avoid exposing sensitive data.

Compare shared semantics, defaults, and error behavior with a sibling SDK of the
same type. A sibling implementation is evidence, not a replacement for the spec.
Record a real divergence in a focused follow-up (`cross-sdk-divergence`) when
posting is authorized; keep the current patch scoped.

If a referenced OpenAPI source is unavailable, use the pinned endpoint contract.
Product Analytics reference JS types can help resolve models; state their version
and any unresolved mismatch rather than silently treating them as normative.

Run the repository's tests, lint, type checks, and package build as applicable.
Integration tests should use the mock server without live credentials. If tooling
prevents a check, record the missing evidence and leave the PR visibly blocked
where it matters; a skipped test is not a passing check.

Update user-facing changelog and affected usage docs. Use
[sdk-readme](../sdk-readme/SKILL.md) for substantial README changes. Check package
contents and metadata; use [sdk-release](../sdk-release/SKILL.md) only when release
preparation is requested. Implementation alone does not authorize version bumps,
tags, or publishing. Return the diff, verification, and unresolved decisions.
