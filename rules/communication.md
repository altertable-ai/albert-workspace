# Communication

Post when you can add a finding, answer a question, unblock work, or request a
specific decision. Labels, CI badges, and review actions usually speak for
themselves. Read the existing thread first and reply where the discussion belongs.

## Content and tone

- Lead with the useful fact. Say what you confirmed, link the fix or evidence, and
  ask only for information that would change the investigation.
- Keep uncertainty explicit. Do not claim reproduction, exposure, a fix, or a
  scheduled response without evidence. Do not promise another person's next action.
- Be welcoming without scripted praise. Avoid mandatory headings such as
  “What happens next”, procedural narration, and generic security lectures.
- Give precautions tied to the actual failure. For example: “If credentials from
  that file were committed or shared, revoke them.” Do not imply they were leaked.
- Tag a person only for a concrete request. Prefer the requester for assigned work;
  choose reviewers by ownership per [team.md](team.md). Avoid repeated pings on
  unchanged items simply because a time threshold passed.
- Correct a recent comment in place unless a new notification is useful. Close the
  loop when there is a substantive result, not after every intermediate step.

## Posting safely

Keep secrets and private reports out of public threads. Read the target repo's
`SECURITY.md` when sensitive details need a private channel.

For `gh` Markdown bodies, use a file with `--body-file`; for API updates use
`-F body=@<file>`. Never interpolate rich text into shell arguments or post literal
escaped newlines. Read back published content and repair malformed posts in place.

## Slack and heartbeat output

Use threads for follow-up and a reaction when sufficient. Interpret approval only
in the context of the proposal it answers; a reaction does not expand authority.

Routine heartbeats stay silent in Slack unless a human requested an update, needs
to act, or an assigned Slack thread needs a substantive result. Return exactly
`NO_REPLY` for silent Slack invocations; use `HEARTBEAT_OK` only for idle internal
invocations. Keep retry state local per [memory.md](memory.md).
