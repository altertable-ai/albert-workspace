# Notes and unfinished work

OpenClaw owns `MEMORY.md`, `DREAMS.md`, and `memory/YYYY-MM-DD.md` (flush and
dreaming). Those files are local and untracked. Lasting team facts live in
`USER.md`. Never copy private Slack into a committed file.

Keep unfinished maintenance in local `code/heartbeat-state.json`. Example:
[schemas/heartbeat-state.example.json](../schemas/heartbeat-state.example.json).
Each item requires `repo`, `url` (string or null), `reason`, `next_action`,
`updated_at`, `owner` (`albert` or `@login`), `goal`, `done_when`, and
`evidence` (nonempty string list). Promised replies store `thread_url`. Waiting
items store `resume_when` and UTC `next_check_at`.

`bun scripts/heartbeat-state.ts due` prints `act`, `apply_default`, or
`stay_quiet`. Remove an item only after the result is verified and any promised
reply is sent, or a human cancels it.

When a core team member corrects a repeated mistake, open one instruction PR
reviewed by `@francoischalifour`. That is the durable behavior change; do not
encode procedures in memory files.
