#!/usr/bin/env bash
# Reports the altertable-client-specs version each SDK repo is pinned to,
# compared against the latest tag in the upstream specs repo.
# Usage: bash scripts/spec-status.sh [--quick] [--markdown]
#
# --quick: Fetch only the latest spec tag (1 API call). If unchanged since last
#          full run (cached in code/.last-spec-tag), exit 0 immediately. Otherwise
#          fall through to the full scan. Use on regular heartbeats to reduce API load.
#
# Referenced by: HEARTBEAT.md (step 2), skills/ops-report/SKILL.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE_ROOT="${SCRIPT_DIR}/.."
CACHE_FILE="${WORKSPACE_ROOT}/code/.last-spec-tag"

SDK_REPOS=()
while IFS= read -r line; do SDK_REPOS+=("$line"); done < <(jq -r '.sdks[].repo' "${WORKSPACE_ROOT}/repositories.config.json")

SPECS_REPO="altertable-ai/altertable-client-specs"
MARKDOWN=false
QUICK=false

for arg in "$@"; do
  if [[ "$arg" == "--markdown" ]]; then
    MARKDOWN=true
  elif [[ "$arg" == "--quick" ]]; then
    QUICK=true
  fi
done

REPOS=("${SDK_REPOS[@]}")

# Resolve the latest tag in altertable-client-specs
LATEST_TAG=$(gh api "repos/${SPECS_REPO}/tags" --jq '.[0].name' 2>/dev/null || echo "unknown")

# Quick check: if tag unchanged since last full run, skip the expensive scan
if [[ "$QUICK" == true ]]; then
  if [[ -f "$CACHE_FILE" ]]; then
    CACHED_TAG=$(cat "$CACHE_FILE")
    if [[ "$LATEST_TAG" == "$CACHED_TAG" && "$LATEST_TAG" != "unknown" ]]; then
      echo "Spec status: no change (latest ${LATEST_TAG})"
      exit 0
    fi
  fi
  # Tag changed or no cache — fall through to full scan
fi

LATEST_SHA=$(gh api "repos/${SPECS_REPO}/git/ref/tags/${LATEST_TAG}" --jq '.object.sha' 2>/dev/null || echo "unknown")

OUTDATED=()  # "repo|pinnedtag"
MISSING=()   # "repo"
OK=()        # "repo"
UNKNOWN=()   # "repo|pinnedtag_or_sha"
NOT_FOUND=() # "repo"

# Parallel arrays indexed like REPOS (used for plain table output)
PINNED_TAGS=()
STATUSES=()

for i in "${!REPOS[@]}"; do
  repo="${REPOS[$i]}"
  
  # Check if repo exists (404 means not created yet)
  if ! gh api "repos/${repo}" --silent 2>/dev/null; then
    PINNED_TAGS[$i]="(404)"
    STATUSES[$i]="NOT_FOUND"
    NOT_FOUND+=("$repo")
    continue
  fi
  
  pinned_sha=$(gh api "repos/${repo}/git/trees/HEAD" --jq \
    '.tree[] | select(.path == "specs") | .sha' 2>/dev/null || echo "")

  if [[ -z "$pinned_sha" ]]; then
    PINNED_TAGS[$i]="(none)"
    STATUSES[$i]="MISSING"
    MISSING+=("$repo")
    continue
  fi

  pinned_tag=$(gh api "repos/${SPECS_REPO}/tags" --jq \
    ".[] | select(.commit.sha == \"${pinned_sha}\") | .name" 2>/dev/null || echo "")

  if [[ -z "$pinned_tag" ]]; then
    pinned_tag=$(gh api "repos/${SPECS_REPO}/tags" \
      --jq ".[] | select(.commit.sha | startswith(\"${pinned_sha:0:8}\")) | .name" \
      2>/dev/null || echo "unknown")
  fi

  if [[ "$pinned_sha" == "$LATEST_SHA" ]]; then
    status="OK"
    OK+=("$repo")
  elif [[ "$pinned_tag" == "unknown" || -z "$pinned_tag" ]]; then
    status="UNKNOWN"
    UNKNOWN+=("$repo|${pinned_sha}")
  else
    status="OUTDATED"
    OUTDATED+=("$repo|${pinned_tag}")
  fi

  PINNED_TAGS[$i]="${pinned_tag:-$pinned_sha}"
  STATUSES[$i]="$status"
done

if [[ "$MARKDOWN" == true ]]; then
  # Markdown summary for GitHub issues or Slack
  echo "## Spec Status Report"
  echo ""
  echo "Latest spec: \`${LATEST_TAG}\` in [\`altertable-client-specs\`](https://github.com/${SPECS_REPO})"
  echo ""

  if [[ ${#OUTDATED[@]} -gt 0 || ${#MISSING[@]} -gt 0 || ${#UNKNOWN[@]} -gt 0 ]]; then
    echo "### Action required"
    echo ""
    echo "| Repository | Pinned | Status |"
    echo "|------------|--------|--------|"
    for entry in "${OUTDATED[@]:-}"; do
      echo "| \`${entry%%|*}\` | \`${entry##*|}\` | OUTDATED |"
    done
    for repo in "${MISSING[@]:-}"; do
      echo "| \`${repo}\` | — | MISSING |"
    done
    for entry in "${UNKNOWN[@]:-}"; do
      echo "| \`${entry%%|*}\` | \`${entry##*|}\` | UNKNOWN |"
    done
    echo ""
  fi

  if [[ ${#UNKNOWN[@]} -gt 0 ]]; then
    echo "### Unknown pinned version"
    echo ""
    echo "| Repository | Pinned SHA | Status |"
    echo "|------------|------------|--------|"
    for entry in "${UNKNOWN[@]:-}"; do
      echo "| \`${entry%%|*}\` | \`${entry##*|}\` | UNKNOWN |"
    done
    echo ""
  fi

  if [[ ${#NOT_FOUND[@]} -gt 0 ]]; then
    echo "### Not yet created"
    echo ""
    echo "| Repository | Status |"
    echo "|------------|--------|"
    for repo in "${NOT_FOUND[@]:-}"; do
      echo "| \`${repo}\` | NOT_FOUND (repo doesn't exist yet) |"
    done
    echo ""
  fi

  if [[ ${#OK[@]} -gt 0 ]]; then
    echo "### Up to date (${#OK[@]}/${#REPOS[@]})"
    echo ""
    for repo in "${OK[@]:-}"; do
      echo "- \`${repo}\`"
    done
  fi
else
  # Plain table output
  printf "%-45s %-20s %-20s %s\n" "REPOSITORY" "PINNED TAG" "LATEST TAG" "STATUS"
  printf "%-45s %-20s %-20s %s\n" "----------" "----------" "----------" "------"
  for i in "${!REPOS[@]}"; do
    printf "%-45s %-20s %-20s %s\n" \
      "${REPOS[$i]}" \
      "${PINNED_TAGS[$i]}" \
      "$LATEST_TAG" \
      "${STATUSES[$i]}"
  done
fi

# Update cache so --quick can short-circuit on next run
if [[ "$LATEST_TAG" != "unknown" ]]; then
  mkdir -p "$(dirname "$CACHE_FILE")"
  echo "$LATEST_TAG" > "$CACHE_FILE"
fi

# Exit non-zero if any repos need updates
if [[ ${#OUTDATED[@]} -gt 0 || ${#MISSING[@]} -gt 0 || ${#UNKNOWN[@]} -gt 0 ]]; then
  exit 1
fi
