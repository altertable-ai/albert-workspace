---
name: ops-report
description: Generate a weekly status summary covering PRs opened/merged/closed by Albert, issues triaged, spec alignment progress, and blockers awaiting human input.
---

# Ops Report

Weekly status report. Run on Friday full heartbeat or on demand.

**Rules:** [safety](../../rules/safety.md) · [communication](../../rules/communication.md) · [memory](../../rules/memory.md)

## Report Sections

1. **PRs opened by Albert** — links, titles, target repos, current state
2. **PRs merged** — what shipped this week
3. **PRs closed without merge** — with reason
4. **Issues triaged** — labeled, commented, or closed (explain if closed)
5. **Spec alignment** — current status from `spec-status.sh --markdown`
6. **Blockers** — open items explicitly waiting on human approval or input
7. **Next actions** — what Albert plans to do in the next cycle

## Workflow

### Step 1: Gather data

```bash
# PRs authored by Albert in the last 7 days across all SDK repos
gh search prs \
  --author albert20260301 \
  --updated ">=$(date -u -d '7 days ago' +%Y-%m-%d 2>/dev/null || date -u -v-7d +%Y-%m-%d)" \
  --json title,url,state,repository,createdAt,mergedAt \
  --limit 100
```

```bash
# Issues commented or labeled by Albert
gh search issues \
  --involves albert20260301 \
  --updated ">=$(date -u -d '7 days ago' +%Y-%m-%d 2>/dev/null || date -u -v-7d +%Y-%m-%d)" \
  --json title,url,state,repository,labels \
  --limit 100
```

```bash
# Spec alignment
bash scripts/spec-status.sh --markdown
```

```bash
# Full ecosystem health (supplementary to spec-status.sh)
# Reports: spec alignment, open PR count, open issue count, CI status per repo
bash scripts/ecosystem-status.sh --markdown
```

### Step 2: Compile the report

Produce a markdown document using this template:

```markdown
# Albert — Weekly Report (YYYY-MM-DD)

## PRs This Week

### Opened

| Repo | PR | State |
|------|----|-------|
| ... | [#N title](url) | open / merged / closed |

### Merged

- ...

### Closed Without Merge

- ...

## Issues Triaged

| Repo | Issue | Action |
|------|-------|--------|
| ... | [#N title](url) | Labeled `bug`, commented, closed (duplicate of #M) |

## Spec Alignment

<output of spec-status.sh --markdown>

## Blockers Awaiting Human Input

- [ ] PR [#N](url) in `altertable-ruby` — needs François to approve before merge.
- [ ] Issue [#M](url) — unclear requirements; tagged `needs-clarification`.

## Planned Next Actions

- Run `sdk-sync` for repos still missing `SECURITY.md`.
- Open submodule bump PRs for outdated SDKs once spec v0.X.Y is tagged.
```

## Acceptance Checklist

- [ ] All 7 report sections are present and non-empty
- [ ] Every PR and issue link resolves
- [ ] Spec alignment output matches `spec-status.sh --markdown` output
- [ ] Blockers section lists only items explicitly waiting on humans
