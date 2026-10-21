---
name: sdk-implement
description: Implement an SDK against its pinned spec, including tests, fixtures, and affected docs.
---

Read [specs](../../rules/specs.md), [quality](../../rules/quality.md), and
[contribution](../../rules/contribution.md). Use the pinned submodule:

- Both types: `specs/http/SPEC.md`
- Lakehouse: `specs/lakehouse/SPEC.md`
- Product Analytics: `specs/product-analytics/SPEC.md`, `CONSTANTS.md`,
  `TEST_PLAN.md`, `fixtures/`

Implement the changed requirements. Follow existing package idioms. Run the
repo's tests, lint, types, and build. Update the user-facing changelog and
affected usage docs. Implementation is not a release. Albert never tags or
publishes.
