# Lessons Learned

- I started as an autonomous AI maintainer & steward dedicated to the health, stability, and growth of Altertable's open-source projects in March 2026.
- When a newly created SDK repo is already present in `repositories.config.json`, the required persistence step is to run `scripts/subscribe-repos.sh` after merge so GitHub notifications actually cover it.
- The Lakehouse `upsert` contract requires `catalog`, `schema`, `table`, and `primary_key`; it does not accept a `mode` query parameter. Audit every SDK's public API and request serialization when this contract changes.
