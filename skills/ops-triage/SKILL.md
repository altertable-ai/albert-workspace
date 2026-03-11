---
name: ops-triage
description: Triage incoming GitHub issues across Altertable SDK repositories. Use when processing new issues, labeling bugs and feature requests, detecting duplicates, requesting minimal reproductions, or marking stale issues.
---

# Issue Triage

Called by `routine-maintainer`. Applies to all repos in [`repositories.config.json`](../../repositories.config.json).

**Rules:** [communication](../../rules/communication.md) · [team](../../rules/team.md) · [safety](../../rules/safety.md)

## Labels

Labels are managed at the **organization scope** (`altertable-ai`) and automatically apply to every repo. Ensure these labels exist at the org level:

| Label                   | Description                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `bug`                   | Confirmed bug                                                                                              |
| `enhancement`           | Feature request                                                                                            |
| `question`              | Usage question (not a bug)                                                                                 |
| `duplicate`             | Duplicate of an existing issue                                                                             |
| `needs-repro`           | Awaiting minimal reproduction                                                                              |
| `needs-info`            | Awaiting more information from author                                                                      |
| `stale`                 | No activity for 30+ days                                                                                   |
| `good first issue`      | Good for newcomers                                                                                         |
| `wontfix`               | Will not be addressed                                                                                      |
| `invalid`               | Not a valid issue                                                                                          |
| `security`              | Security-related (see SECURITY.md)                                                                         |
| `needs-human-review`    | Escalation marker — blocker or ambiguity requiring human judgment (see [rules/communication.md](../../rules/communication.md)) |
| `cross-sdk-divergence`  | API or behavior divergence between SDKs of the same type — created by sdk-implement when flagging follow-up work |

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
2. Comment with teammate structure: what you checked (e.g. "Searched for similar issues"), what you're doing ("Closing as duplicate of #<number>"), and what happens next ("Discussion continues there.")
3. Close the issue

### Step 3: Validate bug reports

For issues labeled `bug`, check whether the report includes:

- [ ] SDK version
- [ ] Language/runtime version
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior

If any are missing, apply `needs-info` and comment requesting the missing details.

If steps to reproduce are vague or involve a large codebase, apply `needs-repro` and comment:

```text
Thanks for reporting this! A minimal reproduction would help us investigate faster.

Could you provide a short, self-contained script or test that demonstrates the issue?

**What happens next**: Once you add a repro, I'll run it locally and either confirm the bug or follow up with questions.
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
2. Comment with teammate structure:

```text
No updates in 30 days. Marking as stale.

**What happens next**: This will be closed in 7 days if no further activity. If it's still relevant, respond with updated information and we'll reopen.
```

### Closing stale

Issues with `stale` label and no activity for 7 more days:

1. Comment: `Closing due to inactivity. Feel free to reopen with updated details if this is still relevant.`
2. Close the issue

## Batch Triage

To triage all open unlabeled issues across repos:

```bash
for repo in $(jq -r '.[].repo' ../../repositories.config.json); do
  echo "=== $repo ==="
  gh issue list --repo "$repo" --state open --json number,title,labels \
    --jq '.[] | select(.labels | length == 0) | "\(.number)\t\(.title)"'
done
```

Process each unlabeled issue through the workflow above.

## Response Templates

Every triage response must follow a teammate-style structure so the reporter knows what happened and what to expect:

1. **What I checked**: Brief summary of what you looked at (e.g. "Checked for duplicates", "Reviewed the repro steps")
2. **What I need from you / what I changed**: Either the requested info or the action you took (labels, closure, etc.)
3. **What happens next**: What you'll do when they respond, or what they should do next

### Not a bug (usage question)

```text
Thanks for reaching out! This looks like a usage question rather than a bug.

[Provide brief answer or link to relevant docs]

**What happens next**: If this resolves your question, we can close the issue. If you believe this is actually a bug, please reopen with a minimal reproduction case and I'll triage it as a bug.
```

### Insufficient information

```text
Thanks for reporting this. To investigate, I need:

- SDK version: `<package-name> --version`
- {Language} version: `{language_version_command}`
- A minimal reproduction script
- Expected vs actual behavior

**What happens next**: Once you add these details, I'll revisit and either reproduce locally or follow up with more questions.
```

## Acceptance Checklist

- [ ] All new issues have at least one label
- [ ] Duplicates are linked and closed
- [ ] Bug reports without repro have `needs-repro` or `needs-info`
- [ ] Security issues are redirected to SECURITY.md and closed
- [ ] Stale issues are marked and eventually closed
- [ ] No issues left unlabeled after triage pass
