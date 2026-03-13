#!/usr/bin/env bash
# Usage: ./scripts/subscribe-repos.sh
#
# Reconciles Albert's GitHub watch subscriptions against repositories.config.json:
#   - Subscribes to every repo listed in the config that exists on GitHub
#   - Unsubscribes from any altertable-ai/* repo that is no longer in the config
#
# This ensures gh api notifications surfaces exactly the supervised repos and
# nothing more (within the altertable-ai org).
#
# Prerequisites: gh CLI authenticated as albert20260301 with sufficient permissions.
#
# This script is idempotent — safe to re-run when repos are added or removed.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../repositories.config.json"

# ── Identity guard ────────────────────────────────────────────────────────────
# This script manages Albert's subscriptions. Refuse to run as anyone else to
# avoid modifying a human's personal GitHub watch list.

EXPECTED_USER="albert20260301"
CURRENT_USER="$(gh api user --jq '.login' 2>/dev/null || true)"

if [[ "$CURRENT_USER" != "$EXPECTED_USER" ]]; then
  echo "Error: gh CLI is authenticated as '${CURRENT_USER}', expected '${EXPECTED_USER}'." >&2
  echo "Switch accounts with: gh auth switch --user ${EXPECTED_USER}" >&2
  exit 1
fi

# ── Load config repos ─────────────────────────────────────────────────────────

CONFIG_REPOS=()
while IFS= read -r line; do CONFIG_REPOS+=("$line"); done \
  < <(jq -r '.[].repo' "$CONFIG_FILE")

# ── Load currently watched altertable-ai/* repos ──────────────────────────────
# GitHub paginates at 100; loop pages until the response is empty.

WATCHED_REPOS=()
page=1
while true; do
  batch=$(gh api "user/subscriptions?per_page=100&page=${page}" \
    --jq '[.[] | select(.full_name | startswith("altertable-ai/")) | .full_name] | .[]' \
    2>/dev/null || true)
  [[ -z "$batch" ]] && break
  while IFS= read -r repo; do WATCHED_REPOS+=("$repo"); done <<< "$batch"
  page=$((page + 1))
done

# ── Helpers (bash 3 compatible — no associative arrays) ───────────────────────

contains() {
  local needle="$1"; shift
  local item
  for item in "$@"; do [[ "$item" == "$needle" ]] && return 0; done
  return 1
}

# ── Subscribe ─────────────────────────────────────────────────────────────────

SUBSCRIBE_FAILED=0
SUBSCRIBE_SKIPPED=0
SUBSCRIBE_OK=0
SUBSCRIBE_NOOP=0

echo "==> Subscribing (${#CONFIG_REPOS[@]} repos in config)"
echo ""

for repo in "${CONFIG_REPOS[@]}"; do
  if contains "$repo" "${WATCHED_REPOS[@]+"${WATCHED_REPOS[@]}"}"; then
    echo "  · ${repo} (already watching)"
    SUBSCRIBE_NOOP=$((SUBSCRIBE_NOOP + 1))
    continue
  fi

  if ! gh api "repos/${repo}" --jq '.full_name' > /dev/null 2>&1; then
    echo "  ⊘ ${repo} (repo does not exist yet)"
    SUBSCRIBE_SKIPPED=$((SUBSCRIBE_SKIPPED + 1))
    continue
  fi

  if gh api \
    --method PUT \
    "repos/${repo}/subscription" \
    --field subscribed=true \
    --field ignored=false \
    > /dev/null 2>&1; then
    echo "  ✓ ${repo}"
    SUBSCRIBE_OK=$((SUBSCRIBE_OK + 1))
  else
    echo "  ✗ ${repo} (subscribe failed)"
    SUBSCRIBE_FAILED=$((SUBSCRIBE_FAILED + 1))
  fi
done

# ── Unsubscribe ───────────────────────────────────────────────────────────────

UNSUBSCRIBE_FAILED=0
UNSUBSCRIBE_OK=0

TO_REMOVE=()
for repo in "${WATCHED_REPOS[@]+"${WATCHED_REPOS[@]}"}"; do
  contains "$repo" "${CONFIG_REPOS[@]}" || TO_REMOVE+=("$repo")
done

if [[ ${#TO_REMOVE[@]} -gt 0 ]]; then
  echo ""
  echo "==> Unsubscribing (${#TO_REMOVE[@]} repos removed from config)"
  echo ""

  for repo in "${TO_REMOVE[@]}"; do
    if gh api \
      --method DELETE \
      "repos/${repo}/subscription" \
      > /dev/null 2>&1; then
      echo "  ✓ ${repo} (unsubscribed)"
      UNSUBSCRIBE_OK=$((UNSUBSCRIBE_OK + 1))
    else
      echo "  ✗ ${repo} (unsubscribe failed)"
      UNSUBSCRIBE_FAILED=$((UNSUBSCRIBE_FAILED + 1))
    fi
  done
fi

# ── Summary ───────────────────────────────────────────────────────────────────

echo ""
echo "── Summary ──────────────────────────────────────────────────────────────────"
[[ $SUBSCRIBE_OK -gt 0 ]]       && echo "  Subscribed      : ${SUBSCRIBE_OK}"
[[ $SUBSCRIBE_NOOP -gt 0 ]]     && echo "  Already watching: ${SUBSCRIBE_NOOP}"
[[ $SUBSCRIBE_SKIPPED -gt 0 ]]  && echo "  Skipped (not yet created): ${SUBSCRIBE_SKIPPED}"
[[ $SUBSCRIBE_FAILED -gt 0 ]]   && echo "  Subscribe failed: ${SUBSCRIBE_FAILED}"
[[ $UNSUBSCRIBE_OK -gt 0 ]]     && echo "  Unsubscribed    : ${UNSUBSCRIBE_OK}"
[[ $UNSUBSCRIBE_FAILED -gt 0 ]] && echo "  Unsubscribe failed: ${UNSUBSCRIBE_FAILED}"
echo ""

TOTAL_FAILED=$((SUBSCRIBE_FAILED + UNSUBSCRIBE_FAILED))
if [[ $TOTAL_FAILED -eq 0 ]]; then
  echo "✓ Subscriptions are in sync"
  exit 0
else
  echo "✗ ${TOTAL_FAILED} operation(s) failed"
  exit 1
fi
