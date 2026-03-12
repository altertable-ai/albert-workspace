---
name: routine-sync
description: Cross-repo consistency routine dispatched by the heartbeat. Checks spec drift and synchronizes community files across all SDK repositories. Use when the heartbeat needs to verify spec alignment and community file consistency.
---

# Sync Routine

Dispatched by the heartbeat. Checks spec drift and cross-repo consistency, then dispatches to `sdk-bootstrap` (spec updates) and `sdk-sync` (community files).

**Rules:** [change-control](../../rules/change-control.md) · [contribution](../../rules/contribution.md) · [safety](../../rules/safety.md)

## Inputs

- **Mode**: `quick` (regular heartbeat) or `full` (full heartbeat). The heartbeat dispatcher provides this — use `quick` for step 2 of The Loop, `full` for step 1 of Periodic Checks.

## Workflow

### Step 1: Check spec status

Run `bash scripts/spec-status.sh` with the appropriate flag for the current mode:

- **Quick mode**: `bash scripts/spec-status.sh --quick` (1 API call)
- **Full mode**: `bash scripts/spec-status.sh` (no `--quick`, catches manual submodule updates)

Then:

- **If unchanged**: Skip to Step 2.
- **If any SDK is outdated**: Run `sdk-bootstrap` for each outdated SDK to update the submodule to the latest spec tag.
- **If `NOT_FOUND` repos**: Run `sdk-bootstrap` Phase 0 if Albert has org permissions, otherwise wait for a human. Log the blocker in `memory/YYYY-MM-DD.md`.

### Step 2: Audit community file drift

Run `sdk-sync` Phase 1 (Audit) to detect community file drift across all SDK repositories.

### Step 3: Sync community files

If drift is detected in Step 2:

1. Run `sdk-sync` Phase 2 (Generate patches) to create the necessary changes.
2. Run `sdk-sync` Phase 3 (Open PRs) to open PRs for all repos with drift.

## Acceptance Checklist

- [ ] Spec status checked via `scripts/spec-status.sh`
- [ ] Outdated SDKs updated via `sdk-bootstrap` (if any)
- [ ] Community file drift report generated via `sdk-sync` Phase 1
- [ ] PRs opened for all repos with community file drift (if any)
- [ ] All actions logged in `memory/YYYY-MM-DD.md`
