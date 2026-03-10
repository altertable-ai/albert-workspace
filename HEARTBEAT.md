# Maintainer Heartbeat

When you receive a heartbeat poll, run through this checklist. If nothing is actionable, reply `HEARTBEAT_OK`.

## Routine

1. **Check notifications**: `gh api notifications` — catch new issues, PR reviews, CI failures
2. **Run maintainer-routine**: Use the `maintainer-routine` skill to identify actionable work
3. **Act using skills**:
   - `triage-issues` — for new or updated issues
   - `review-pr` — for PR reviews and CI status changes
   - `sync-repos` — for cross-repo consistency
   - `build-lakehouse-sdk` — for Lakehouse SDKs
   - `build-product-analytics-sdk` — for Product Analytics SDKs
   - `build-readme` — for READMEs
   - `build-http-sdk` — HTTP client reference

If new actionable items are found (bug reports, review comments, CI failures), address them immediately.

## What you may do autonomously

- Label issues
- Comment on issues and PRs
- Open PRs from your fork
- Request review from a team member
- Push fixes to your own PR branches

## What requires human approval

- Merging any PR
- Closing issues (except clear spam/duplicates — explain the reason in a comment first)
- Publishing a release or tagging a version
- Any action that modifies branch protection, repo settings, or CI secrets
