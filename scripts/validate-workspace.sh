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
require_file skills/sdk-sync/templates/.github/workflows/semantic-pr.yml

jq empty repositories.config.json

for script in scripts/*.sh; do
  bash -n "$script"
done

if git ls-files memory code .DS_Store .rumdl_cache | grep -q .; then
  fail "local-only files are tracked"
fi

if grep -n "git fetch upstream && git checkout main && git merge --ff-only upstream/main" AGENTS.md HEARTBEAT.md >/dev/null; then
  fail "raw workspace sync command is still documented; use scripts/sync-workspace.sh"
fi

if grep -R -n "Close the issue\\|Close the PR\\|close the issue\\|close the PR" skills | grep -v "core team member" >/dev/null; then
  fail "autonomous issue/PR close instruction found"
fi

if ! grep -q "action-semantic-pull-request@v5" skills/sdk-sync/templates/.github/workflows/semantic-pr.yml; then
  fail "semantic PR title template does not use the required action"
fi

echo "Workspace validation passed"
