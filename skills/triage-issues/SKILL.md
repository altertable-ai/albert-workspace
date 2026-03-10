---
name: triage-issues
description: Triage incoming GitHub issues across Altertable SDK repositories. Use when processing new issues, labeling bugs and feature requests, detecting duplicates, requesting minimal reproductions, or marking stale issues.
---

# Issue Triage

## Purpose

Use this skill to triage incoming GitHub issues across all Altertable SDK repositories. It covers labeling, duplicate detection, reproduction requests, staleness management, and closing.

## Related Skills

- **[sync-repos](../sync-repos/SKILL.md)**: Repository inventory and issue template definitions
- **[bootstrap-sdk](../bootstrap-sdk/SKILL.md)**: Repo setup context

## Repository Scope

Triage applies to all repos listed in [sync-repos](../sync-repos/SKILL.md) — both Lakehouse and Product Analytics SDKs.

## Labels

Labels are managed at the **organization scope** (`altertable-ai`) and automatically apply to every repo. Ensure these labels exist at the org level:

| Label                | Color     | Description                                                                                                |
| -------------------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| `bug`                | `#d73a4a` | Confirmed bug                                                                                              |
| `enhancement`        | `#a2eeef` | Feature request                                                                                            |
| `question`           | `#d876e3` | Usage question (not a bug)                                                                                 |
| `duplicate`          | `#cfd3d7` | Duplicate of an existing issue                                                                             |
| `needs-repro`        | `#fbca04` | Awaiting minimal reproduction                                                                              |
| `needs-info`         | `#fbca04` | Awaiting more information from author                                                                      |
| `stale`              | `#e4e669` | No activity for 30+ days                                                                                   |
| `good first issue`   | `#7057ff` | Good for newcomers                                                                                         |
| `wontfix`            | `#ffffff` | Will not be addressed                                                                                      |
| `invalid`            | `#e4e669` | Not a valid issue                                                                                          |
| `security`           | `#d73a4a` | Security-related (see SECURITY.md)                                                                         |
| `needs-human-review` | `#ff8c00` | Escalation marker — blocker or ambiguity requiring human judgment (see [AGENTS.md](../../../AGENTS.md#communication)) |

## Triage Workflow

### Step 1: Classify the issue

Read the issue title, body, and any attached logs or code.

- **Bug report** → apply `bug` label
- **Feature request** → apply `enhancement` label
- **Usage question** → apply `question` label
- **Security vulnerability** → apply `security` label, close the issue, and comment directing the author to `SECURITY.md` (vulnerabilities must not be discussed publicly)

### Step 2: Check for duplicates

Search open and recently closed issues in the same repo for similar titles and descriptions.

```bash
gh issue list --repo <repo> --state all --search "<keywords>" --limit 20
```

If a duplicate is found:

1. Apply `duplicate` label
2. Comment linking to the original issue: `Closing as duplicate of #<number>.`
3. Close the issue

### Step 3: Validate bug reports

For issues labeled `bug`, check whether the report includes:

- [ ] SDK version
- [ ] Language/runtime version
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior

If any are missing, apply `needs-info` and comment requesting the missing details.

If steps to reproduce are vague or involve a large codebase, apply `needs-repro` and comment:

```
Thanks for reporting this! Could you provide a minimal reproduction case?
Ideally a short, self-contained script or test that demonstrates the issue.
This helps us investigate and fix it faster.
```

### Step 4: Attempt reproduction (bugs only)

When a bug report includes a reproduction:

1. Identify the SDK repo and language
2. Clone the repo (or use an existing checkout)
3. Install the reported SDK version
4. Run the reproduction steps
5. If reproduced → comment confirming and keep `bug` label
6. If not reproduced → comment with findings, apply `needs-info`, ask for clarification

### Step 5: Route the issue

After classification:

- **Actionable bugs**: leave open, ensure labels are correct
- **Feature requests**: leave open with `enhancement`
- **Questions**: answer if straightforward, otherwise apply `question` and leave open
- **Invalid**: apply `invalid`, comment explaining why, close

## Staleness Management

### Marking stale

Issues with no activity for 30 days:

```bash
gh issue list --repo <repo> --state open --label "needs-repro,needs-info" \
  --json number,updatedAt --jq '.[] | select(.updatedAt < (now - 2592000 | todate))'
```

For each stale issue:

1. Apply `stale` label
2. Comment:

```
This issue has been automatically marked as stale because it has not had
activity in 30 days. It will be closed in 7 days if no further activity occurs.
If this is still relevant, please respond with updated information.
```

### Closing stale

Issues with `stale` label and no activity for 7 more days:

1. Comment: `Closing due to inactivity. Feel free to reopen if this is still relevant.`
2. Close the issue

## Batch Triage

To triage all open unlabeled issues across repos:

```bash
for repo in $(gh repo list altertable-ai --json nameWithOwner -q '.[].nameWithOwner' | grep -E 'altertable-(lakehouse-|js|py|swift|kotlin|ruby|java|go|php|rust)'); do
  echo "=== $repo ==="
  gh issue list --repo "$repo" --state open --json number,title,labels \
    --jq '.[] | select(.labels | length == 0) | "\(.number)\t\(.title)"'
done
```

Process each unlabeled issue through the workflow above.

## Response Templates

### Not a bug (usage question)

```
Thanks for reaching out! This looks like a usage question rather than a bug.

[Provide brief answer or link to relevant docs]

If you believe this is actually a bug, please reopen with a minimal reproduction case.
```

### Insufficient information

```
Thanks for reporting this. To help us investigate, could you provide:

- SDK version: `<package-name> --version`
- {Language} version: `{language_version_command}`
- A minimal reproduction script
- Expected vs actual behavior

We'll revisit once we have more details.
```

## Acceptance Checklist

- [ ] All new issues have at least one label
- [ ] Duplicates are linked and closed
- [ ] Bug reports without repro have `needs-repro` or `needs-info`
- [ ] Security issues are redirected to SECURITY.md and closed
- [ ] Stale issues are marked and eventually closed
- [ ] No issues left unlabeled after triage pass
