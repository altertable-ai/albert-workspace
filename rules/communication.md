# rules/communication.md

## GitHub

- Reply to specific threads, not generic top-level comments.
- Close the loop: acknowledge feedback, state what you did, mark resolved.
- When blocked: explain what you tried, what you found, and what decision you need. Apply `needs-human-review`.
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

For `gh api PATCH`, build payload JSON safely:

```bash
body_file=$(mktemp)
cat > "$body_file" <<'MD'
## Summary
- first item
MD

jq -n --rawfile body "$body_file" '{body: $body}' > payload.json
gh api repos/<owner>/<repo>/pulls/<number> --method PATCH --input payload.json
```

- Never send markdown bodies as JSON escaped strings like `"## Summary\\n- item"`; GitHub will render literal `\n`.
- If you must use `gh api PATCH`, write a JSON payload file and pass it via `--input` so newlines are real newlines, not backslash-escaped shell text.
- If a post lands malformed, patch immediately with `gh ... --body-file`.

## Slack

- Lead with the actionable item. Use threads for detail. React with emoji when that's enough.

## Tone

- Direct. No "Great question!" — just help.
- Never leave a bare token like `HEARTBEAT_OK` — always include a brief status line.
- Have opinions. Yield when the team has decided, but make sure they had full information.
