---
name: sdk-bootstrap
description: Bootstrap or update an Altertable SDK repository from a versioned API spec. Use when given a target GitHub repository (e.g. altertable-ai/altertable-lakehouse-ruby) and a spec version tag (e.g. v0.1.0) to set up a git submodule, implement missing functionality, and submit a PR. Also use when a new spec version is released and the SDK needs to be updated to match.
---

# Bootstrap SDK from API Specs

Initialize or update an SDK repository against a specific version of `altertable-ai/altertable-client-specs`. All contributions go through the fork + branch + PR workflow in [rules/contribution.md](../../rules/contribution.md).

**Rules:** [contribution](../../rules/contribution.md) · [specs](../../rules/specs.md) · [quality](../../rules/quality.md) · [safety](../../rules/safety.md)

## Inputs

Collect before starting:

- **Target repo**: GitHub repository slug (e.g. `altertable-ai/altertable-lakehouse-ruby`)
- **Spec tag**: Tag of `altertable-ai/altertable-client-specs` to target (e.g. `v0.1.0`)
- **SDK type**: Which SDK skill applies (`lakehouse`, `product-analytics`)

## Workflow

### Phase 0: Create repository (NOT_FOUND repos only)

**Skip this phase if the target repo already exists.**

If `spec-status.sh` reports `NOT_FOUND` (repo in `repositories.config.json` doesn't exist yet), create it first using `bootstrap-github-repo.sh`. This script sets up branch protection, merge settings, and an initial commit.

**This is a human-gated action** — requires org permissions. If Albert doesn't have sufficient permissions, open a tracking issue in `albert-workspace` with the `spec-update` label listing which repos need to be created, and wait for a human to create them.

1. Determine the repo description from the SDK type and language (e.g., "Altertable Lakehouse SDK for Ruby").
2. Run `bash scripts/bootstrap-github-repo.sh <repo> "<description>"`.
3. Verify the repo was created and has the expected branch protection rules.
4. Proceed to Phase 1.

### Phase 1: Fork and clone

Follow [rules/contribution.md](../../rules/contribution.md) to fork the target repo, clone it into `code/<repo-name>`, configure git identity, and add the upstream remote.

### Phase 2: Setup CI (initial bootstrap only)

**Skip this phase for spec updates.**

Before adding any code or submodules, CI must be operational to validate subsequent changes.

1. Create a branch: `ci/initial-setup`
2. Commit the workflows: `"ci: initial setup"`
3. Push branch and open a PR: `"ci: initial setup"`
4. **STOP and wait** for this PR to be merged before proceeding to Phase 3.
5. **If the CI setup PR is not merged within 48 hours**: Apply `needs-human-review` label, comment mentioning a team member from `USER.md`, and log the blocker in `memory/YYYY-MM-DD.md`. Resume bootstrap on the next heartbeat after merge is detected.
6. **If the CI setup PR has not been merged within 7 days**: Close the PR, apply `needs-human-review` to the tracking issue, and stop retrying. Resume only when a human explicitly unblocks.

### Phase 3: Set up the specs submodule

1. Create a branch. For initial bootstrap use `bootstrap/specs-<spec-tag>`; for spec updates use `update/specs-<spec-tag>`.

**Initial bootstrap** (submodule does not exist yet):

```bash
git submodule add https://github.com/altertable-ai/altertable-client-specs.git specs
git -C specs checkout <spec-tag>
git add .gitmodules specs
git commit -m "chore: add altertable-client-specs submodule at <spec-tag>"
```

**Spec update** (submodule already exists):

1. Identify the previous spec tag by reading `.gitmodules` and checking the submodule's current HEAD.
2. Update to the new tag and inspect what changed:

```bash
git -C specs fetch --tags
git -C specs checkout <new-spec-tag>
git -C specs diff <old-tag>..<new-spec-tag> -- .
```

1. Stage and commit the submodule pointer update:

```bash
git add specs
git commit -m "chore: update altertable-client-specs submodule to <new-spec-tag>"
```

### Phase 4: Populate community files (initial bootstrap only)

**Skip this phase for spec updates** — community files are managed separately via `sdk-sync`.

Use the [sdk-sync](../sdk-sync/SKILL.md) skill to copy all managed community files into the repo. `sdk-sync` owns the file templates, variable substitution, and the canonical list of managed files.

Commit all community files together: `"chore: add community files"`

Then generate a comprehensive `.gitignore` using `https://www.toptal.com/developers/gitignore/api/{language}` as a reference and commit: `"chore: add .gitignore"`

### Phase 5: Implement or update the SDK

Use the [sdk-implement](../sdk-implement/SKILL.md) skill. It reads the spec from `specs/<type>/SPEC.md`, runs the cross-SDK consistency check, validates, and packages.

- **Initial bootstrap**: implement everything required by the spec from scratch.
- **Spec update**: pass the spec diff from Phase 3 as context. `sdk-implement` will identify what changed and only implement what is new or modified.

### Phase 6: Validate

Before opening the PR, verify bootstrap-specific items:

- [ ] Submodule points to the correct spec tag commit
- [ ] `CHANGELOG.md` has a new entry
- [ ] Community files present (initial bootstrap only): `LICENSE`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CONTRIBUTING.md`, `.github/` templates

All other quality gates (tests, lint, spec alignment, self-review) are covered by [rules/quality.md](../../rules/quality.md).

### Phase 7: Open a PR

Push the branch to your fork and open a PR against the upstream `main` branch per [rules/contribution.md](../../rules/contribution.md).

## Decision tree

| Scenario | Phases |
|----------|--------|
| Repo creation (NOT_FOUND) | 0 → 1 → 2 (if no CI) → 3 (initial) → 4 → 5 → 6 → 7 |
| Initial bootstrap | 1 → 2 (if no CI) → 3 (initial) → 4 → 5 → 6 → 7 |
| Spec update (submodule exists) | 1 → 3 (update) → 5 → 6 → 7 |

## Notes

- Never push to `main` — always fork + PR.
- `specs/` is read-only; never modify files inside it.
- Pin the submodule to the tag's commit SHA, not a branch.
- If the fork is stale, sync before branching: `gh repo sync <your-fork> --source <target-repo>`.
- **Monorepo exception**: Product Analytics web framework wrappers (React, Vue, Svelte) live in [`altertable-js`](https://github.com/altertable-ai/altertable-js) under `packages/`. Work directly in the monorepo — skip the fork/clone workflow.
