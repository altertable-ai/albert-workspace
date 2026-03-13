#!/usr/bin/env bash
# Aggregates ecosystem health across all Altertable SDK repositories:
# - Spec version alignment (via spec-status.sh)
# - Open PR count per repo
# - Open issue count per repo
# - CI status of default branch per repo
#
# Usage: bash scripts/ecosystem-status.sh [--markdown] [--json]
#
# Referenced by: skills/ops-report/SKILL.md (Step 1: Gather data)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SDK_REPOS=()
while IFS= read -r line; do SDK_REPOS+=("$line"); done < <(jq -r '.sdks[].repo' "${SCRIPT_DIR}/../repositories.config.json")

MARKDOWN=false
JSON=false

for arg in "$@"; do
  case "$arg" in
    --markdown) MARKDOWN=true ;;
    --json)     JSON=true ;;
  esac
done

REPOS=("${SDK_REPOS[@]}")

SPECS_REPO="altertable-ai/altertable-client-specs"
LATEST_SPEC_TAG=$(gh api "repos/${SPECS_REPO}/tags" --jq '.[0].name' 2>/dev/null || echo "unknown")
LATEST_SPEC_SHA=$(gh api "repos/${SPECS_REPO}/git/ref/tags/${LATEST_SPEC_TAG}" --jq '.object.sha' 2>/dev/null || echo "unknown")

GENERATED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# gh_api <endpoint> <jq-filter> <fallback>
# Returns the jq-filtered result, or <fallback> if the request fails (404, network error, etc.)
gh_api() {
  local endpoint="$1"
  local filter="$2"
  local fallback="${3:--}"
  local result
  if result=$(gh api "$endpoint" --jq "$filter" 2>/dev/null); then
    echo "$result"
  else
    echo "$fallback"
  fi
}

# Collect data per repo
declare -a REPO_NAMES
declare -a SPEC_STATUSES
declare -a OPEN_PRS
declare -a OPEN_ISSUES
declare -a CI_STATUSES
declare -a REPO_EXISTS

for repo in "${REPOS[@]}"; do
  REPO_NAMES+=("$repo")

  # Check repo exists first to avoid cascading 404s
  if ! gh api "repos/${repo}" --jq '.full_name' &>/dev/null; then
    SPEC_STATUSES+=("NOT FOUND")
    OPEN_PRS+=("-")
    OPEN_ISSUES+=("-")
    CI_STATUSES+=("-")
    REPO_EXISTS+=("false")
    continue
  fi
  REPO_EXISTS+=("true")

  # Spec alignment
  pinned_sha=$(gh_api "repos/${repo}/git/trees/HEAD" \
    '.tree[] | select(.path == "specs") | .sha' "")

  if [[ -z "$pinned_sha" ]]; then
    SPEC_STATUSES+=("MISSING")
  elif [[ "$pinned_sha" == "$LATEST_SPEC_SHA" ]]; then
    SPEC_STATUSES+=("OK")
  else
    pinned_tag=$(gh_api "repos/${SPECS_REPO}/tags" \
      ".[] | select(.commit.sha == \"${pinned_sha}\") | .name" "")
    if [[ -z "$pinned_tag" ]]; then
      SPEC_STATUSES+=("UNKNOWN")
    else
      SPEC_STATUSES+=("OUTDATED (${pinned_tag})")
    fi
  fi

  # Open PRs
  pr_count=$(gh_api "repos/${repo}/pulls?state=open&per_page=100" 'length' "-")
  OPEN_PRS+=("$pr_count")

  # Open issues (excluding PRs, which GitHub counts as issues)
  issue_count=$(gh_api "repos/${repo}/issues?state=open&per_page=100" \
    '[.[] | select(.pull_request == null)] | length' "-")
  OPEN_ISSUES+=("$issue_count")

  # CI status of default branch
  default_branch=$(gh_api "repos/${repo}" '.default_branch' "main")
  ci_state=$(gh_api "repos/${repo}/commits/${default_branch}/status" '.state' "unknown")
  CI_STATUSES+=("$ci_state")
done

# Output
if [[ "$JSON" == true ]]; then
  echo "{"
  echo "  \"generated_at\": \"${GENERATED_AT}\","
  echo "  \"spec_latest\": \"${LATEST_SPEC_TAG}\","
  echo "  \"repos\": ["
  for i in "${!REPO_NAMES[@]}"; do
    comma=$( [ "$i" -lt $(( ${#REPO_NAMES[@]} - 1 )) ] && echo "," || echo "" )
    echo "    {\"repo\": \"${REPO_NAMES[$i]}\", \"spec\": \"${SPEC_STATUSES[$i]}\", \"open_prs\": \"${OPEN_PRS[$i]}\", \"open_issues\": \"${OPEN_ISSUES[$i]}\", \"ci\": \"${CI_STATUSES[$i]}\"}${comma}"
  done
  echo "  ]"
  echo "}"
elif [[ "$MARKDOWN" == true ]]; then
  echo "## Ecosystem Status"
  echo ""
  echo "_Generated: ${GENERATED_AT}_"
  echo ""
  echo "Latest spec: \`${LATEST_SPEC_TAG}\`"
  echo ""
  echo "| Repository | Spec | Open PRs | Open Issues | CI |"
  echo "|------------|------|----------|-------------|-----|"
  for i in "${!REPO_NAMES[@]}"; do
    repo="${REPO_NAMES[$i]}"
    spec="${SPEC_STATUSES[$i]}"
    prs="${OPEN_PRS[$i]}"
    issues="${OPEN_ISSUES[$i]}"
    ci="${CI_STATUSES[$i]}"
    repo_url="https://github.com/${repo}"

    case "$spec" in
      OK)        spec_icon="✅" ;;
      MISSING)   spec_icon="❌" ;;
      OUTDATED*) spec_icon="⚠️" ;;
      NOT\ FOUND) spec_icon="🚫" ;;
      *)         spec_icon="❓" ;;
    esac

    case "$ci" in
      success) ci_icon="✅" ;;
      failure) ci_icon="❌" ;;
      pending) ci_icon="🔄" ;;
      -)       ci_icon="-" ;;
      *)       ci_icon="❓" ;;
    esac

    echo "| [\`${repo##*/}\`](${repo_url}) | ${spec_icon} ${spec} | ${prs} | ${issues} | ${ci_icon} ${ci} |"
  done
else
  printf "%-45s %-22s %8s %13s %10s\n" "REPOSITORY" "SPEC" "OPEN PRS" "OPEN ISSUES" "CI"
  printf "%-45s %-22s %8s %13s %10s\n" "----------" "----" "--------" "-----------" "--"
  for i in "${!REPO_NAMES[@]}"; do
    printf "%-45s %-22s %8s %13s %10s\n" \
      "${REPO_NAMES[$i]}" \
      "${SPEC_STATUSES[$i]}" \
      "${OPEN_PRS[$i]}" \
      "${OPEN_ISSUES[$i]}" \
      "${CI_STATUSES[$i]}"
  done
  echo ""
  echo "Generated: ${GENERATED_AT}"
fi
