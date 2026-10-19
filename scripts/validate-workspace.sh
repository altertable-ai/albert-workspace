#!/usr/bin/env bash
# Validates Albert workspace requirements that Markdown linting cannot catch.
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
require_file ALBERT.md
require_file HEARTBEAT.md
require_file repositories.config.json
require_file scripts/sync-workspace.sh
require_file scripts/spec-status.sh
require_file scripts/ecosystem-status.sh
require_file scripts/github-activity.py
require_file scripts/heartbeat-state.py
require_file scripts/subscribe-repos.sh
require_file schemas/heartbeat-state.example.json
require_file skills/sdk-sync/templates/.github/workflows/semantic-pull-request.yml

jq empty repositories.config.json

python3 scripts/heartbeat-state.py check --file schemas/heartbeat-state.example.json
if [[ -f code/heartbeat-state.json ]]; then
  python3 scripts/heartbeat-state.py check --file code/heartbeat-state.json
fi

for script in scripts/*.sh; do
  bash -n "$script"
done

if git ls-files memory code .DS_Store .rumdl_cache | grep -q .; then
  fail "local-only files are tracked"
fi

if grep -n "git fetch upstream && git checkout main && git merge --ff-only upstream/main" AGENTS.md ALBERT.md HEARTBEAT.md >/dev/null; then
  fail "raw workspace sync command is still documented; use scripts/sync-workspace.sh"
fi

if grep -R -nE "Close the issue|Close the PR|close the issue|close the PR|will be closed|linked and closed|redirected to SECURITY\\.md and closed|eventually closed|^### Closing stale" skills | grep -v "core team member" >/dev/null; then
  fail "autonomous issue/PR close instruction found"
fi

bash scripts/validate-workflow-policy.sh .

template_root="$(mktemp -d)"
trap 'rm -rf "$template_root"' EXIT
mkdir -p "$template_root/.github"
cp -R skills/sdk-sync/templates/.github/workflows "$template_root/.github/workflows"
bash scripts/validate-workflow-policy.sh "$template_root"

echo "Workspace validation passed"
