# Notes and unfinished work

OpenClaw owns `MEMORY.md`, `DREAMS.md`, and `memory/YYYY-MM-DD.md` (flush and
dreaming). Those files are local and untracked. Lasting team facts live in
`USER.md`. Never copy private Slack into a committed file.

After resolving an issue, append reusable findings to `memory/YYYY-MM-DD.md`:
cause, evidence link, affected version, and fix or workaround. Dreaming can
promote qualifying findings into `MEMORY.md`. Before diagnosing a recurrence,
retrieve related findings and recheck them against the current code and version.

Keep unfinished maintenance in local `code/heartbeat-state.json`. Example:
[schemas/heartbeat-state.example.json](../schemas/heartbeat-state.example.json).
Each item requires `repo`, `url` (string or null), `reason`, `next_action`,
`updated_at`, `owner` (`albert` or `@login`), `goal`, `done_when`, and
`evidence` (nonempty string list). Promised replies store `thread_url`. Waiting
items store `resume_when` and UTC `next_check_at`.

`bun scripts/heartbeat-state.ts due` prints `act`, `apply_default`, or
`stay_quiet`. Remove an item only after the result is verified and any promised
reply is sent, or a human cancels it.
For promised availability follow-ups, verify users can access the fix before
removing the item.

When a core team member corrects a repeated mistake, open one instruction PR
with review per [team.md](team.md). Do not encode procedures in memory files.
