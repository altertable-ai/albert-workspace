#!/usr/bin/env bash
# Aggregates ecosystem health across all configured Altertable repositories:
# - API spec version alignment, for SDKs that use the shared spec
# - Open PR count per repo
# - Open issue count per repo
# - CI status of default branch per repo
#
# Usage: bash scripts/ecosystem-status.sh [--markdown] [--json] [--config <file>]
#
# Referenced by: skills/ops-report/SKILL.md (report data gathering)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../repositories.config.json"
MARKDOWN=false
JSON=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --markdown) MARKDOWN=true; shift ;;
    --json) JSON=true; shift ;;
    --config)
      [[ $# -ge 2 ]] || { echo "--config requires a path" >&2; exit 1; }
      CONFIG_FILE="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# General health includes the workspace, SDKs, tooling, and projects. Only API
# SDKs need a spec pin; a CLI or application must not be reported as MISSING.
jq empty "$CONFIG_FILE"
REPOS=()
while IFS= read -r repo; do REPOS+=("$repo"); done < <(
  jq -r '[.workspace.repo, .sdks[]?.repo, .projects[]?.repo] | map(select(. != null)) | unique[]' "$CONFIG_FILE"
)
SPEC_REPOS=()
while IFS= read -r repo; do SPEC_REPOS+=("$repo"); done < <(
  jq -r '.sdks[]? | select(.kind == "lakehouse" or .kind == "product-analytics") | .repo' "$CONFIG_FILE"
)

uses_api_spec() {
  local candidate
  for candidate in "${SPEC_REPOS[@]+"${SPEC_REPOS[@]}"}"; do
    [[ "$candidate" == "$1" ]] && return 0
  done
  return 1
}

SPECS_REPO="altertable-ai/altertable-client-specs"
SPEC_TAGS='[]'
if [[ ${#SPEC_REPOS[@]} -gt 0 ]]; then
  # /tags gives commit SHAs even for annotated tags, and older pins may require
  # later pages. Fetch once rather than repeating a tag request for every SDK.
  SPEC_TAGS=$(gh api "repos/${SPECS_REPO}/tags" --paginate --slurp 2>/dev/null | jq 'add' || echo '[]')
fi
LATEST_SPEC_TAG=$(jq -r '.[0].name // "unknown"' <<< "$SPEC_TAGS")
LATEST_SPEC_SHA=$(jq -r '.[0].commit.sha // "unknown"' <<< "$SPEC_TAGS")

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

gh_count_pages() {
  local endpoint="$1"
  local filter="$2"
  local page=1
  local total=0
  local counts
  local raw_count

  while true; do
    if [[ "$endpoint" == *\?* ]]; then
      counts=$(gh_api "${endpoint}&per_page=100&page=${page}" "[($filter), length]" "-")
    else
      counts=$(gh_api "${endpoint}?per_page=100&page=${page}" "[($filter), length]" "-")
    fi

    [[ "$counts" == "-" ]] && echo "-" && return 0
    total=$((total + $(jq '.[0]' <<< "$counts")))
    raw_count=$(jq '.[1]' <<< "$counts")
    [[ "$raw_count" -lt 100 ]] && break
    page=$((page + 1))
  done

  echo "$total"
}

gh_ci_state() {
  local repo="$1"
  local ref="$2"
  local sha
  local checks_state

  sha=$(gh_api "repos/${repo}/commits/${ref}" '.sha' "")
  if [[ -z "$sha" ]]; then
    echo "unknown"
    return 0
  fi

  checks_state=$(
    gh api "repos/${repo}/commits/${sha}/check-runs?per_page=100" --paginate --slurp 2>/dev/null \
      | jq -r '[.[].check_runs[]] | if length == 0 then "none" elif ([.[] | select(.status != "completed")] | length) > 0 then "pending" elif ([.[] | select(.conclusion as $c | ($c != "success" and $c != "skipped" and $c != "neutral"))] | length) > 0 then "failure" else "success" end' \
    || echo "unknown"
  )

  if [[ "$checks_state" != "none" && "$checks_state" != "unknown" ]]; then
    echo "$checks_state"
    return 0
  fi

  gh_api "repos/${repo}/commits/${ref}/status" '.state' "unknown"
}

# Collect data per repo
declare -a REPO_NAMES
declare -a SPEC_STATUSES
declare -a OPEN_PRS
declare -a OPEN_ISSUES
declare -a CI_STATUSES

for repo in "${REPOS[@]}"; do
  REPO_NAMES+=("$repo")

  # An inaccessible or failed request means unavailable, not proof of a missing repo.
  if ! gh api "repos/${repo}" --jq '.full_name' &>/dev/null; then
    SPEC_STATUSES+=("UNAVAILABLE")
    OPEN_PRS+=("-")
    OPEN_ISSUES+=("-")
    CI_STATUSES+=("-")
    continue
  fi

  if ! uses_api_spec "$repo"; then
    SPEC_STATUSES+=("N/A")
  elif [[ "$LATEST_SPEC_SHA" == "unknown" ]]; then
    SPEC_STATUSES+=("UNKNOWN")
  else
    pinned_sha=$(gh_api "repos/${repo}/git/trees/HEAD" \
      '.tree[] | select(.path == "specs") | .sha' "-")
    if [[ "$pinned_sha" == "-" ]]; then
      SPEC_STATUSES+=("UNKNOWN")
    elif [[ -z "$pinned_sha" ]]; then
      SPEC_STATUSES+=("MISSING")
    elif [[ "$pinned_sha" == "$LATEST_SPEC_SHA" ]]; then
      SPEC_STATUSES+=("OK")
    else
      pinned_tag=$(jq -r --arg sha "$pinned_sha" '.[] | select(.commit.sha == $sha) | .name' <<< "$SPEC_TAGS")
      if [[ -z "$pinned_tag" ]]; then
        SPEC_STATUSES+=("UNKNOWN")
      else
        SPEC_STATUSES+=("OUTDATED (${pinned_tag})")
      fi
    fi
  fi

  # Open PRs
  pr_count=$(gh_count_pages "repos/${repo}/pulls?state=open" 'length')
  OPEN_PRS+=("$pr_count")

  # Open issues (excluding PRs, which GitHub counts as issues)
  issue_count=$(gh_count_pages "repos/${repo}/issues?state=open" \
    '[.[] | select(.pull_request == null)] | length')
  OPEN_ISSUES+=("$issue_count")

  # CI status of default branch. Prefer GitHub Checks, fall back to legacy statuses.
  default_branch=$(gh_api "repos/${repo}" '.default_branch' "main")
  ci_state=$(gh_ci_state "$repo" "$default_branch")
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
  echo "| Repository | API spec | Open PRs | Open Issues | CI |"
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
      UNAVAILABLE) spec_icon="❓" ;;
      N/A)       spec_icon="—" ;;
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
  printf "%-45s %-22s %8s %13s %10s\n" "REPOSITORY" "API SPEC" "OPEN PRS" "OPEN ISSUES" "CI"
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
