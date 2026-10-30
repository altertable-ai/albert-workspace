# Communication

Post when you have a finding, an answer, an unblock, or a specific decision.
Read the thread first. Lead with the useful fact and a link. Keep uncertainty
explicit. In Slack, use native `<@SLACK_ID>` mentions from [USER.md](../USER.md)
instead of plain names when referring to team members. Elsewhere, tag a person
only for a concrete request.

## Asking people

For a decision, give your recommendation, the meaningful alternatives, and
the evidence or tradeoff that needs human judgment. Ask only for the remaining
choice.

Run `bun scripts/heartbeat-state.ts can-ask <url> <who>` before any question or
ping. Exit 2 prints the open ask — do not post. Exit 1 is an error. After posting,
record `asked` (`who`, `at`, `url`, `question`, `default_at`, `default_action`)
and set `next_check_at` to `default_at`.

Ask once per decision, in one thread. If it is still waiting, list it once in
the Friday report. When they reply, delete `asked` and act. At `default_at`, do
`default_action` without posting again.

```text
Decision needed from @login: <yes/no question>. If I don't hear back by <date>,
I'll <reversible default>.
```

Silence is native: `NO_REPLY`, or `heartbeat_respond` with `notify: false`. Do
not put those tokens in a GitHub comment.

## Posting safely

Keep secrets and private Slack out of public threads and out of git. For
`gh pr create|edit` and `gh issue|pr comment`, use `--body-file` with a quoted
heredoc:

```bash
gh pr edit <n> --body-file - <<'EOF'
## Summary
- keep `inline-code` intact
EOF
```

Never interpolate rich text into shell arguments.

## Direct vs background

Answer a direct question when the evidence is available. For assigned jobs,
acknowledge once, then return with the result. Background maintenance stays
quiet until there is a finding, a fix, or a decision.
