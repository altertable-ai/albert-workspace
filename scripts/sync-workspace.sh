#!/usr/bin/env bash
# Safely fast-forward Albert's workspace before a session or after a heartbeat.
#
# Usage: bash scripts/sync-workspace.sh

set -euo pipefail

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
REMOTE="upstream"
REMOTE_BRANCH="main"

if ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
  ORIGIN_URL="$(git remote get-url origin 2>/dev/null || true)"
  case "$ORIGIN_URL" in
    *altertable-ai/albert-workspace*)
      echo "upstream remote not configured; using canonical origin"
      REMOTE="origin"
      ;;
    *)
      echo "Error: upstream remote is not configured and origin is not canonical altertable-ai/albert-workspace." >&2
      exit 1
      ;;
  esac
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: workspace has local changes; refusing to sync." >&2
  git status --short >&2
  exit 1
fi

if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Error: sync-workspace.sh only runs from main; current branch is ${CURRENT_BRANCH}." >&2
  echo "Switch to main when you want to refresh the control-plane checkout." >&2
  exit 1
fi

git fetch "$REMOTE" "${REMOTE_BRANCH}:refs/remotes/${REMOTE}/${REMOTE_BRANCH}"

LOCAL_HEAD="$(git rev-parse HEAD)"
REMOTE_HEAD="$(git rev-parse "${REMOTE}/${REMOTE_BRANCH}")"
MERGE_BASE="$(git merge-base HEAD "${REMOTE}/${REMOTE_BRANCH}")"

if [[ "$LOCAL_HEAD" == "$REMOTE_HEAD" ]]; then
  echo "Workspace already up to date with ${REMOTE}/${REMOTE_BRANCH}"
elif [[ "$LOCAL_HEAD" == "$MERGE_BASE" ]]; then
  git merge --ff-only "${REMOTE}/${REMOTE_BRANCH}"
else
  echo "Error: local main diverged from ${REMOTE}/${REMOTE_BRANCH}; refusing to merge." >&2
  exit 1
fi

echo "Workspace synced with ${REMOTE}/${REMOTE_BRANCH}"
