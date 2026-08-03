#!/usr/bin/env bash
# Validates Altertable's GitHub Actions supply-chain and runtime policy.
#
# Usage: ./scripts/validate-workflow-policy.sh [repository-root]

set -euo pipefail

REPOSITORY_ROOT="${1:-.}"
REQUIRED_UBUNTU_RUNNER="ubuntu-24.04"
WORKFLOWS_DIRECTORY="$REPOSITORY_ROOT/.github/workflows"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

[[ -d "$WORKFLOWS_DIRECTORY" ]] || exit 0

while IFS= read -r -d '' workflow; do
  while IFS= read -r runner; do
    [[ "$runner" == "$REQUIRED_UBUNTU_RUNNER" ]] || fail \
      "$workflow must use $REQUIRED_UBUNTU_RUNNER instead of $runner"
  done < <(sed -nE 's/^[[:space:]]*runs-on:[[:space:]]*(ubuntu-(latest|[0-9]+\.[0-9]+))[[:space:]]*(#.*)?$/\1/p' "$workflow")

  while IFS= read -r action_reference; do
    action_reference="${action_reference%%[[:space:]]#*}"
    case "$action_reference" in
      ./*) continue ;;
      docker://*) fail "$workflow must pin container actions by digest: $action_reference" ;;
    esac

    [[ "$action_reference" =~ ^[^@]+@[0-9a-f]{40}$ ]] || fail \
      "$workflow has an action that is not pinned to a commit SHA: $action_reference"
  done < <(sed -nE \
    -e 's/^[[:space:]]*-[[:space:]]*uses:[[:space:]]*([^[:space:]#]+).*/\1/p' \
    -e 's/^[[:space:]]*uses:[[:space:]]*([^[:space:]#]+).*/\1/p' \
    "$workflow")
done < <(find "$WORKFLOWS_DIRECTORY" -type f \( -name '*.yml' -o -name '*.yaml' \) -print0)

if grep -R -qE 'uses:[[:space:]]*actions/setup-node@' "$WORKFLOWS_DIRECTORY"; then
  [[ -f "$REPOSITORY_ROOT/.node-version" ]] || fail \
    "$REPOSITORY_ROOT uses actions/setup-node but has no .node-version"
  grep -R -qE 'node-version-file:[[:space:]]*\.node-version([[:space:]]|$)' "$WORKFLOWS_DIRECTORY" || fail \
    "$REPOSITORY_ROOT must configure actions/setup-node with node-version-file: .node-version"
  if grep -R -qE '^[[:space:]]*node-version:[[:space:]]*[^[:space:]#]' "$WORKFLOWS_DIRECTORY"; then
    fail "$REPOSITORY_ROOT must not hard-code node-version in workflows; use .node-version"
  fi
fi

if grep -R -qE 'uses:[[:space:]]*oven-sh/setup-bun@' "$WORKFLOWS_DIRECTORY"; then
  [[ -f "$REPOSITORY_ROOT/.bun-version" ]] || fail \
    "$REPOSITORY_ROOT uses oven-sh/setup-bun but has no .bun-version"
  grep -R -qE 'bun-version-file:[[:space:]]*\.bun-version([[:space:]]|$)' "$WORKFLOWS_DIRECTORY" || fail \
    "$REPOSITORY_ROOT must configure oven-sh/setup-bun with bun-version-file: .bun-version"
  if grep -R -qE '^[[:space:]]*bun-version:[[:space:]]*[^[:space:]#]' "$WORKFLOWS_DIRECTORY"; then
    fail "$REPOSITORY_ROOT must not hard-code bun-version in workflows; use .bun-version"
  fi
fi

echo "Workflow policy passed: $REPOSITORY_ROOT"
