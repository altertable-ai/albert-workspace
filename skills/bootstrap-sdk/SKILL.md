---
name: bootstrap-sdk
description: Bootstrap or update an Altertable SDK repository from a versioned API spec. Use when given a target GitHub repository (e.g. altertable-ai/altertable-lakehouse-ruby) and a spec version tag (e.g. v0.1.0) to set up a git submodule, implement missing functionality, and submit a PR. Also use when a new spec version is released and the SDK needs to be updated to match.
---

# Bootstrap SDK from API Specs

## Purpose

Use this skill to initialize or update an SDK repository against a specific version of `altertable-ai/altertable-api-specs`. All contributions go through a fork + branch + PR workflow — the maintainer agent has no direct write access to the target repository.

## Related Skills

This skill coordinates with other SDK development skills:

- **[build-lakehouse-sdk](../build-lakehouse-sdk/SKILL.md)**: Implementation guide for Lakehouse API clients
- **[build-product-analytics-sdk](../build-product-analytics-sdk/SKILL.md)**: Implementation guide for Product Analytics SDKs
- **[build-http-sdk](../build-http-sdk/SKILL.md)**: HTTP client best practices (referenced by build-* skills)
- **[sync-repos](../sync-repos/SKILL.md)**: Cross-repo consistency for community files and config
- **[release-sdk](../release-sdk/SKILL.md)**: Versioning, changelog, and registry publishing conventions

## Inputs

Collect before starting:

- **Target repo**: GitHub repository slug (e.g. `altertable-ai/altertable-lakehouse-ruby`)
- **Spec tag**: Tag of `altertable-ai/altertable-api-specs` to target (e.g. `v0.1.0`)
- **SDK type**: Which SDK skill applies (`lakehouse-sdk`, `product-analytics-sdk`, etc.)

## Workflow

### Phase 1: Fork and clone

```bash
# Fork (skip if fork already exists)
gh repo fork <target-repo> --clone=false

# Clone your fork into code/
gh repo clone albert20260301/<repo-name> code/<repo-name>
cd code/<repo-name>

# Set up git identity
git config user.name "Albert"
git config user.email "albert20260301@gmail.com"

# Add upstream remote
git remote add upstream https://github.com/<target-repo>.git
git fetch upstream
```

### Phase 2: Setup CI (Initial bootstrap only)

**Skip this phase for spec updates.**

Before adding any code or submodules, CI must be operational to validate subsequent changes.

1. Create a branch: `ci/initial-setup`
2. Set up CI workflows for the target language (e.g. `.github/workflows/test.yml`).
3. Push branch and open a PR: `"ci: initial setup"`
4. **STOP and wait** for this PR to be merged before proceeding to Phase 3.

### Phase 3: Set up the specs submodule

1. Create a branch off the updated `main`. For initial bootstrap use `bootstrap/specs-<spec-tag>`; for spec updates use `update/specs-<spec-tag>`

**Initial bootstrap** (submodule does not exist yet):

```bash
git submodule add https://github.com/altertable-ai/altertable-api-specs.git specs
git -C specs checkout <spec-tag>
```

Then pin the submodule to the exact tag commit and commit:

```bash
git add .gitmodules specs
git commit -m "chore: add altertable-api-specs submodule at <spec-tag>"
```

**Spec update** (submodule already exists):

1. Identify the previous spec tag by reading `.gitmodules` and checking the submodule's current HEAD.
2. Update to the new tag:

```bash
git -C specs fetch --tags
git -C specs checkout <new-spec-tag>
```

3. Inspect the diff to understand what changed:

```bash
git -C specs diff <old-tag>..<new-spec-tag> -- .
```

4. Stage and commit the submodule pointer update:

```bash
git add specs
git commit -m "chore: update altertable-api-specs submodule to <new-spec-tag>"
```

### Phase 4: Populate community files (initial bootstrap only)

**Skip this phase for spec updates** — community files are managed separately via `sync-repos`.

For an initial bootstrap (repo has no community files yet), copy all managed files from [sync-repos](../sync-repos/SKILL.md) templates into the repo:

1. Copy all verbatim files from [`sync-repos/templates/`](../sync-repos/templates/) directly into the repo root — refer to that directory as the source of truth for which files are included and their content.

2. Render any templated files (those containing `{variable}` placeholders) by substituting repo-specific values — refer to [`sync-repos/SKILL.md`](../sync-repos/SKILL.md) for the list of templated files and the variables each one expects.

3. Commit all community files together: `"chore: add community files"`

4. Generate a comprehensive `.gitignore` using `https://www.toptal.com/developers/gitignore/api/{language}` as a reference.

5. Commit: `"chore: add .gitignore"`

### Phase 5: Implement or update the SDK

Read the specs submodule to understand the API surface, then apply the appropriate SDK skill:

- For Lakehouse SDKs: read and follow [build-lakehouse-sdk](../build-lakehouse-sdk/SKILL.md)
- For Product Analytics SDKs: read and follow [build-product-analytics-sdk](../build-product-analytics-sdk/SKILL.md)

**Initial bootstrap**: implement everything required by the skill from scratch.

**Spec update**: use the spec diff from Phase 3 to identify what changed. Only implement what is new or modified. Document breaking changes in `CHANGELOG.md`.

### Phase 6: Validate

Before opening the PR:

- [ ] All tests pass (`lint`, `typecheck`, `unit`, `integration` where applicable)
- [ ] Submodule points to the correct spec tag commit
- [ ] `CHANGELOG.md` is updated with a new entry
- [ ] `README.md` reflects any new public API surface
- [ ] Package version bumped if applicable (follow [release-sdk](../release-sdk/SKILL.md) conventions)
- [ ] Community files present (initial bootstrap only): `LICENSE`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CONTRIBUTING.md`, `.github/` templates

### Phase 7: Open a PR

Push the branch to your fork and open a PR against the upstream `main` branch.

## Decision tree

```
Given: target repo + spec tag
│
├── Is this a fresh repo (no CI)?
│   └── Yes → Phase 1 (fork) → Phase 2 (CI PR) → WAIT FOR MERGE → Phase 3 (submodule) ...
│
├── Does the repo have a `specs` submodule?
│   ├── No  → Phase 1 (fork) → Phase 3 (initial submodule) → Phase 4 (community files) → Phase 5 (impl)
│   └── Yes → Phase 1 (fork) → Phase 3 (update submodule) → Phase 5 (diff-based update)
│
└── Always → Phase 6 (validate) → Phase 7 (open PR)
```

## Notes

- Never push directly to the target repo's `main` branch — always go through fork + PR.
- The `specs/` directory should be treated as read-only; never modify files inside it.
- Pin the submodule to the tag's commit SHA, not a branch, to ensure reproducibility.
- If the fork already exists and is stale, sync it before branching: `gh repo sync <your-fork> --source <target-repo>`.
- **Monorepo exception**: Product Analytics web framework wrappers (React, Vue, Svelte, etc.) live in the [`altertable-js` monorepo](https://github.com/altertable-ai/altertable-js) under `packages/`, not in separate repositories. For these, skip the fork/clone workflow and work directly in the monorepo.
