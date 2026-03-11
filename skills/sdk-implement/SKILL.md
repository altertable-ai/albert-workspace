---
name: sdk-implement
description: Implement an SDK against a versioned spec. Use when sdk-bootstrap dispatches to Phase 5 — read the spec from specs/<type>/SPEC.md, implement per requirements, validate, and package. Takes SDK type (product-analytics, lakehouse) as input.
---

# Implement SDK

Dispatched by [sdk-bootstrap](../sdk-bootstrap/SKILL.md) Phase 5. Read the spec from the SDK repo's `specs/` submodule, implement, validate, and package.

**Rules:** [specs](../../rules/specs.md) · [contribution](../../rules/contribution.md) · [quality](../../rules/quality.md)

## Spec Mapping

| SDK type | Spec path | Additional files |
|---|---|---|
| `lakehouse` | `specs/lakehouse/SPEC.md` | — |
| `product-analytics` | `specs/product-analytics/SPEC.md` | `specs/product-analytics/CONSTANTS.md`, `specs/product-analytics/TEST_PLAN.md`, `specs/product-analytics/fixtures/*.json` |

For HTTP transport requirements (keep-alive, timeouts, language recommendations), read `specs/http/SPEC.md` — both lakehouse and product-analytics specs reference it.

## Workflow

### 0. Impact analysis (before writing any code)

Produce a short written summary — in the PR body or a local scratch file — covering:

- Which public API methods are added, changed, or removed
- Which existing tests need updating
- Which docs sections are affected
- Whether this change applies to other SDKs in the same category (if so, note which ones and whether they're already handled)

Do not skip this step. It forces you to understand the scope before committing to an implementation path.

### 1. Read the spec

Read `specs/<type>/SPEC.md`. Treat it as the source of truth. If anything in the spec is ambiguous, note it explicitly in the PR — do not silently assume an interpretation.

### 2. Scaffold

Per the spec's first phases (package structure, license, lint/test scripts).

### 3. Implement

Each requirement phase in order. Do not skip phases applicable to the target tier (web/mobile/server for product-analytics).

### 4. Test — happy path and failure cases

For every behavior you implement, write:

- A test that proves it works correctly (happy path)
- A test for at least one failure case: invalid input, disabled feature, network error, or storage unavailable

Fixture compliance for product-analytics: run all fixtures in `specs/product-analytics/fixtures/` through the serializer and assert exact output match.

### 5. Cross-SDK consistency check

After implementing, compare the public API surface against at least one existing SDK of the same type:

- Method names (language-idiomatic, but semantically equivalent)
- Config option names and defaults (must match `specs/product-analytics/CONSTANTS.md` or `specs/lakehouse/SPEC.md`)
- Error handling behavior

Flag any divergence as a follow-up issue with the `cross-sdk-divergence` label — don't fix other SDKs in the same PR, but don't ignore the gap either. Routine-maintainer will check these issues periodically to see if they've been resolved by a subsequent PR.

### 6. Validate before opening PR

- [ ] All tests pass (`lint`, `typecheck`, `unit`, `integration` where applicable)
- [ ] Fixtures compliance verified
- [ ] Submodule points to the correct spec tag commit
- [ ] `CHANGELOG.md` updated
- [ ] `README.md` reflects any new public API surface
- [ ] Package version bumped if applicable
- [ ] Self-review: read the diff as a reviewer before pushing

### 7. Package

Run in this order:

1. Apply release conventions per [sdk-release](../sdk-release/SKILL.md) (versioning, changelog, registry metadata)
2. Generate README per [sdk-readme](../sdk-readme/SKILL.md)

**Spec update** (not initial bootstrap): use `git -C specs diff <old-tag>..<new-tag> -- .` to identify changes. Only implement what is new or modified. Document breaking changes in `CHANGELOG.md`.

## When Things Go Wrong

### OpenAPI spec unavailable

If the OpenAPI URL cannot be fetched (timeout, 404):

- **Product Analytics**: Read the OpenAPI URL from `specs/product-analytics/SPEC.md` (it is documented there). If it cannot be fetched, use the reference JS implementation's types as the source of truth. Document which spec version you based the models on.
- **Lakehouse**: Use the endpoint reference in `specs/lakehouse/SPEC.md` as the source of truth.

### Missing platform APIs

Some platforms lack certain APIs (`crypto.randomUUID`, `navigator.sendBeacon`, etc.). Always provide a polyfill or fallback:

- **UUID generation**: Fall back to a manual v4 UUID implementation.
- **Beacon transport**: Fall back to `fetch` with `keepalive: true`, then plain `fetch`.
- **Storage APIs**: Follow the fallback chain in the spec. If all fail, use in-memory storage.

### Streaming parse failures (Lakehouse)

If NDJSON streaming produces unexpected line formats, fail loudly with line index and raw content in the error. Never silently drop rows.

### Tests cannot run

Integration tests use the mock server and require no live credentials. If blocked (e.g., Docker unavailable, missing Testcontainers bindings), skip with a clear `TODO` and a logged warning. Document what is skipped and why in the PR description. Do not silently omit test coverage.

## Notes

- **Monorepo exception**: Product Analytics web framework wrappers (React, Vue, Svelte) live in [`altertable-js`](https://github.com/altertable-ai/altertable-js) under `packages/`. Work directly in the monorepo — `sdk-bootstrap` handles this before dispatching here, but be aware the repo structure differs.
