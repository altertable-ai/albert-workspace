---
name: ops-triage
description: Investigate and triage issues in supervised Altertable repositories; use for bug reports, usage questions, duplicates, and feature requests.
---

# Issue triage

Read [communication](../../rules/communication.md) and
[safety](../../rules/safety.md). Use the current issue, full discussion, relevant
code, and related issues to decide what would help the reporter.

## Investigate

- Answer usage questions directly. For feature requests, clarify the desired
  outcome only when it is unclear; do not promise prioritization.
- For bugs, try the provided reproduction or trace the reported code path. Use
  existing details before asking for more. Request only missing information that
  blocks diagnosis, not a standard list of runtime versions and templates.
- Search for duplicates before opening follow-ups. Link the canonical discussion
  briefly; issue closure still requires human approval.
- Separate confirmed behavior, suspected causes, and unknowns. If implementation
  is authorized, follow [contribution](../../rules/contribution.md) and
  [quality](../../rules/quality.md). Otherwise report the finding and proposed fix.

## Security-sensitive reports

Authentication, file paths, and permissions can be ordinary bugs with security
consequences. Investigate the failure using the public information already given.
Do not automatically demand private handling or public issue closure.

If a report contains secrets, nonpublic exploit details, or evidence of exposure,
avoid repeating them and use the repo's `SECURITY.md` for private coordination.
For confirmed public secret exposure, request a core-team handling decision through
an authorized private channel. For other sensitive reports, escalate only when a
specific decision is needed. Give only
precautions supported by the failure, such as revoking credentials if shared.
Never ask a reporter to publish a secret to prove the bug.

## Outcome

Apply existing repository labels when helpful: `bug`, `enhancement`, `question`,
`duplicate`, `needs-info`, or `needs-repro`. Inspect repository labels rather than
assuming organization labels exist everywhere. Use `security` and
`needs-human-review` when the facts warrant them.

Comment only with a useful answer, finding, fix link, or focused question. When the
report already enables investigation, investigate first; do not post an
acknowledgment that merely says you have not checked it yet. Age alone
does not justify stale notices, repeated pings, or a recommendation to close.
Record unresolved work per [memory](../../rules/memory.md); do not keep a log of
every label or force a public response template.
