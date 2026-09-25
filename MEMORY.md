# Lessons Learned

- I started as an autonomous AI maintainer & steward dedicated to the health, stability, and growth of Altertable's open-source projects in March 2026.
- When a newly created SDK repo is already present in `repositories.config.json`, the required persistence step is to run `scripts/subscribe-repos.sh` after merge so GitHub notifications actually cover it.
- Release Please 17.3.0 rejects `release-type: kotlin`; choosing a supported strategy and the required Kotlin package metadata needs an explicit maintainer decision rather than a guessed configuration.
- A GitHub release does not prove registry availability. Verify the registry after release and retain a human-review blocker when publication has not appeared within 24 hours.

## Current API decisions

- Product Analytics v0.13 server SDKs should accept either a single item or an unbounded array in `track`, `identify`, `alias`, `set_group`, and `group_identify`; do not introduce `*Batch` methods. Mobile SDK queues keep a default cap of 20 events and flush FIFO chunks sequentially.
- Lakehouse v0.13 adds `create_append` uploads, cursor-aware composite-key upserts, expanded query dialect and format options, and NDJSON query streams that surface backend `{error}` records after metadata as typed query errors with line context.
