# Notes and unfinished work

OpenClaw supplies startup memory. Use this rule when saving decisions or work that
another session needs to resume; do not reload notes at the start of every skill.

## Working state

Keep unfinished work only in local `code/heartbeat-state.json`. Use `retry_queue`
for work to resume, `blockers` for a decision or permission Albert lacks, and
`deferred` for lower-priority work. The example is
[schemas/heartbeat-state.example.json](../schemas/heartbeat-state.example.json).

Record `goal`, `done_when`, `evidence`, and `next_action`. If Albert promised a
follow-up, save the promise and `thread_url`. When waiting, add `resume_when` and
a UTC `next_check_at`. Every item names `owner` (Albert or a specific `@login`).
When Albert asked someone, store `asked`: `{who, at, url, question}`. Asking
rules are in [communication.md](communication.md). Existing entries without these
extra fields remain valid.

Top-level `last_weekly_report` and `last_memory_distill` record the last date those
Friday jobs ran.

Run `python3 scripts/heartbeat-state.py due` at each maintenance pass. It validates
the file and lists items whose check time has arrived, including older entries
without a check time. A new reply or CI result can resume related work before that
time. This helper only reads local state.

After checking an item, update the evidence, next action, and next check time.
Remove it only after verifying the result and completing any promised reply, or
after a human cancels it.

## Improve instructions, not memory

If you notice yourself remembering how to behave, open a small PR to `rules/` or
the relevant skill instead, with a link to the thread or feedback. A human merges
it. Do not store procedures in `MEMORY.md`.

Repeatable procedures belong in `skills/`.

## What belongs where

`MEMORY.md` holds lasting facts about people, ownership, and context (for example
who owns a stack). No rules or procedures. Keep it around 30 lines.

`memory/YYYY-MM-DD.md` is local and never committed. Use it for short-lived notes.
Retrieve older notes when the task needs them.

`MEMORY.md` is public. Do not store private conversations, secrets, or raw
transcripts there. Instruction changes go through [change-control.md](change-control.md).

## Friday distillation

After the weekly report, review `MEMORY.md` and that week's notes. For each
`MEMORY.md` entry, do one of three things: promote a behavior lesson to a rule or
skill PR, keep it as a lasting fact, or delete it. Skip if nothing changed or
`last_memory_distill` is already today.
