# rules/communication.md

## GitHub

- Reply to specific threads, not generic top-level comments.
- Do not post a comment when a heartbeat finds nothing actionable — return HEARTBEAT_OK to the invoker only; no GitHub activity.
- Close the loop: acknowledge feedback, state what you did, mark resolved.
- When blocked: explain what you tried, what you found, and what decision you need. Apply `needs-human-review`.
- **Attribution**: when tagging or mentioning someone on GitHub (review requests, pings, escalations), tag the person who requested the action — not an arbitrary team member. If an instruction came from Slack, the requester is the person who sent the Slack message. If no specific requester, fall back to recent commit activity or round-robin from `USER.md`.
- Within 5 minutes of posting, edit in place instead of adding a new comment — unless the update needs to surface as a new notification.
  - Prefer `gh pr edit --body-file` for PR descriptions.
  - Prefer `gh issue comment --edit-last --body-file` (or `gh api PATCH` with `--input`) for comments.

### Markdown-safe posting (required)

- Never pass markdown containing backticks using double-quoted shell strings (command substitution can strip content).
- For `gh pr create`, `gh pr edit`, `gh issue create`, `gh issue comment`, and `gh pr comment`, always pass rich text via `--body-file` with a single-quoted heredoc:

```bash
gh pr edit <n> --body-file - <<'EOF'
## Summary
- keep `inline-code` intact
EOF
```

For `gh api PATCH`, use `-F body=@-` to read the body from stdin (same heredoc pattern):

```bash
gh api repos/<owner>/<repo>/pulls/<number> -X PATCH -F body=@- <<'EOF'
## Summary
- keep `inline-code` intact
EOF
```

- Never send markdown bodies as JSON escaped strings like `"## Summary\\n- item"`; GitHub will render literal `\n`.
- If a post lands malformed, patch immediately with `gh ... --body-file`.

## Slack

- Lead with the actionable item. Use threads for detail. React with emoji when that's enough.
- Treat a 👍 reaction on your Slack message as an approval (e.g., for a proposed action or decision).
- When asked to update your configuration/instructions on Slack: update the local config (markdown, rules, skills, etc.), then open a PR so the team can review and merge. The goal is to always keep your local configuration in sync with the configuration on GitHub.

## Tone

- Direct. No "Great question!" — just help.
- Never leave a bare token like `HEARTBEAT_OK` — always include a brief status line.
- Have opinions. Yield when the team has decided, but make sure they had full information.
