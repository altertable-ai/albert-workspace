#!/usr/bin/env bash
# Validates Albert workspace contracts that Markdown linting cannot catch.
#
# Usage: bash scripts/validate-workspace.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_file() {
  local path="$1"
  [[ -f "$path" ]] || fail "missing required file: $path"
}

require_file AGENTS.md
require_file HEARTBEAT.md
require_file repositories.config.json
require_file scripts/sync-workspace.sh
require_file scripts/spec-status.sh
require_file scripts/ecosystem-status.sh
require_file scripts/subscribe-repos.sh
require_file schemas/heartbeat-state.example.json
require_file skills/sdk-sync/templates/.github/workflows/semantic-pr.yml

jq empty repositories.config.json

validate_heartbeat_state() {
  local path="$1"
  jq -e '
    type == "object"
    and ((keys - ["last_full_heartbeat", "retry_queue", "blockers", "deferred"]) | length == 0)
    and has("last_full_heartbeat")
    and has("retry_queue")
    and has("blockers")
    and has("deferred")
    and (.last_full_heartbeat == null or (.last_full_heartbeat | test("^[0-9]{4}-[0-9]{2}-[0-9]{2}$")))
    and (.retry_queue | type == "array")
    and (.blockers | type == "array")
    and (.deferred | type == "array")
    and ([.retry_queue[], .blockers[], .deferred[]] | all(
      type == "object"
      and ((keys - ["repo", "url", "reason", "next_action", "updated_at"]) | length == 0)
      and has("repo")
      and has("url")
      and has("reason")
      and has("next_action")
      and has("updated_at")
      and (.repo | type == "string" and length > 0)
      and (.url == null or (.url | type == "string"))
      and (.reason | type == "string" and length > 0)
      and (.next_action | type == "string" and length > 0)
      and (.updated_at | test("^[0-9]{4}-[0-9]{2}-[0-9]{2}$"))
    ))
  ' "$path" >/dev/null || fail "invalid heartbeat state shape: $path"
}

validate_heartbeat_state schemas/heartbeat-state.example.json
if [[ -f code/heartbeat-state.json ]]; then
  validate_heartbeat_state code/heartbeat-state.json
fi

for script in scripts/*.sh; do
  bash -n "$script"
done

if git ls-files memory code .DS_Store .rumdl_cache | grep -q .; then
  fail "local-only files are tracked"
fi

if grep -n "git fetch upstream && git checkout main && git merge --ff-only upstream/main" AGENTS.md HEARTBEAT.md >/dev/null; then
  fail "raw workspace sync command is still documented; use scripts/sync-workspace.sh"
fi

if grep -R -nE "Close the issue|Close the PR|close the issue|close the PR|will be closed|linked and closed|redirected to SECURITY\\.md and closed|eventually closed|^### Closing stale" skills | grep -v "core team member" >/dev/null; then
  fail "autonomous issue/PR close instruction found"
fi

if ! grep -q "action-semantic-pull-request@v5" skills/sdk-sync/templates/.github/workflows/semantic-pr.yml; then
  fail "semantic PR title template does not use the required action"
fi

echo "Workspace validation passed"
