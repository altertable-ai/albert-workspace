#!/usr/bin/env bash
# Usage: ./scripts/setup-github-repo.sh <org/repo-name> [description]
#
# Creates a public GitHub repository under the given org/name and configures
# it with the standard Altertable branch settings and protection rules.
#
# Prerequisites: gh CLI authenticated with sufficient org permissions.
#
# Referenced by: skills/sdk-bootstrap/SKILL.md (Phase 0: Create repository)

set -euo pipefail

# ── Args ─────────────────────────────────────────────────────────────────────

REPO="${1:-}"
DESCRIPTION="${2:-}"

if [[ -z "$REPO" ]]; then
  echo "Usage: $0 <org/repo-name> [description]" >&2
  exit 1
fi

# Derive org and short name (supports both "org/name" and bare "name")
if [[ "$REPO" == */* ]]; then
  ORG="${REPO%%/*}"
  NAME="${REPO##*/}"
else
  ORG="$(gh api user --jq '.login')"
  NAME="$REPO"
  REPO="$ORG/$NAME"
fi

echo "==> Creating repository $REPO"

# ── 1. Create the repo ───────────────────────────────────────────────────────

CREATE_ARGS=(
  --public
)
[[ -n "$DESCRIPTION" ]] && CREATE_ARGS+=(--description "$DESCRIPTION")

# gh repo create exits non-zero if repo already exists; tolerate that.
if gh repo create "$REPO" "${CREATE_ARGS[@]}" 2>/dev/null; then
  echo "    Repository created."
else
  echo "    Repository already exists or creation skipped — continuing."
fi

# ── 2. Configure repo-level merge settings ───────────────────────────────────
# Matches altertable-lakehouse-ruby:
#   allow_squash_merge=true, squash title=PR_TITLE, squash body=PR_BODY
#   allow_rebase_merge=true
#   allow_merge_commit=false
#   allow_update_branch=true
#   delete_branch_on_merge=true
#   has_projects=false, has_wiki=false, has_discussions=false

echo "==> Configuring merge settings"
gh api \
  --method PATCH \
  "repos/$REPO" \
  --field allow_squash_merge=true \
  --field squash_merge_commit_title="PR_TITLE" \
  --field squash_merge_commit_message="PR_BODY" \
  --field allow_rebase_merge=true \
  --field allow_merge_commit=false \
  --field allow_update_branch=true \
  --field delete_branch_on_merge=true \
  --field has_projects=false \
  --field has_wiki=false \
  --field has_discussions=false \
  > /dev/null
echo "    Done."

# ── 3. Ensure main branch exists ─────────────────────────────────────────────
# A freshly created empty repo has no commits and therefore no branches.
# We push a single empty commit so the branch protection rule can be applied.

echo "==> Ensuring 'main' branch exists"

BRANCH_EXISTS=$(gh api "repos/$REPO/branches/main" --jq '.name' 2>/dev/null || true)

if [[ "$BRANCH_EXISTS" != "main" ]]; then
  echo "    Branch not found — pushing an initial empty commit to create 'main'."

  TMPDIR_REPO="$(mktemp -d)"
  trap 'rm -rf "$TMPDIR_REPO"' EXIT

  git -C "$TMPDIR_REPO" init -b main -q
  git -C "$TMPDIR_REPO" commit --allow-empty -m "chore: initial commit" -q
  git -C "$TMPDIR_REPO" remote add origin "git@github.com:$REPO.git"
  git -C "$TMPDIR_REPO" push origin main -q
  echo "    'main' branch created."
else
  echo "    'main' branch already exists."
fi

# ── 4. Apply branch protection rules ─────────────────────────────────────────
# Matches the protection snapshot from altertable-lakehouse-ruby/branches/main:
#   required_pull_request_reviews.required_approving_review_count = 1
#   required_status_checks.strict = true  (up-to-date before merge)
#   enforce_admins = true                 (do not allow bypassing)
#   allow_force_pushes = false
#   allow_deletions = false

echo "==> Applying branch protection rules to 'main'"
# gh --field coerces all values to strings, so nested objects must be sent via
# a full JSON body using --input instead.
gh api \
  --method PUT \
  "repos/$REPO/branches/main/protection" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": []
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false
}
JSON
echo "    Done."

# ── 5. Summary ────────────────────────────────────────────────────────────────

echo ""
echo "✓ Repository bootstrap complete: https://github.com/$REPO"
echo ""
echo "  Merge settings"
echo "    Squash merge         : enabled  (title = PR title, body = PR description)"
echo "    Rebase merge         : enabled"
echo "    Merge commits        : disabled"
echo "    Suggest branch update: enabled"
echo ""
echo "  Branch protection — main"
echo "    Require PR + 1 approval before merging"
echo "    Require status checks to pass (branches must be up to date)"
echo "    Enforce for admins (no bypass)"
echo "    Force-push / deletion: disabled"
echo ""
echo "  Org-level labels: bug, enhancement, question, duplicate, needs-repro, needs-info,"
echo "          stale, good first issue, wontfix, invalid, security, needs-human-review"
