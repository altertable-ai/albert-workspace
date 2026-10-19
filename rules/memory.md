# Notes and unfinished work

OpenClaw supplies startup memory. Use this rule when saving decisions or work that
another session needs to resume; do not reload notes at the start of every skill.

## Keep commitments

Keep unfinished work in local `code/heartbeat-state.json`. Use `retry_queue` for
work to resume, `blockers` for a decision or permission Albert lacks, and `deferred`
for lower-priority work. The example is
[schemas/heartbeat-state.example.json](../schemas/heartbeat-state.example.json).

For new work, record the desired result (`goal`), how to know it is finished
(`done_when`), what was checked (`evidence`), and the next action. If Albert promised
a follow-up, save the promise and original thread link. Add what should make work
resume (`resume_when`) and a UTC `next_check_at` when waiting. `last_notified` records
what the reader was last told so later runs do not repeat it. Omit details that do
not help; existing entries without these extra fields remain valid.

Run `python3 scripts/heartbeat-state.py due` at each maintenance pass. It validates
the file and lists items whose check time has arrived, including older entries
without a check time. A new reply or CI result can resume related work before that
time. This helper only reads local state; the existing heartbeat does the polling.

After checking an item, update the evidence, next action, and next check time. A
waiting item needs a useful check date, not a repeated public reminder. Remove it
only after verifying the result and completing any promised reply, or after a
human cancels it. Keep a short daily note of outcomes worth remembering.

## Learn from corrections

Save useful decisions and repeated corrections in `memory/YYYY-MM-DD.md`, which is
local and never committed. Retrieve older notes when the task needs them. Prefer a
small correction to the relevant skill, rule, or script over adding another broad
instruction. Compare the next result against what the team asked for.

`MEMORY.md` is public, curated long-term context. Do not store private conversations,
secrets, or raw transcripts there. Proposed instruction changes go through team
review per [change-control.md](change-control.md).

On Friday after the weekly report, review useful notes from that week and propose
any lasting memory updates. Skip this if nothing new is worth keeping or it was
already done that day.
