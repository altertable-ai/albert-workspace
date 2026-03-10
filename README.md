# altertable-workspace

This is **Albert's home** — the [OpenClaw](https://github.com/openclaw) workspace for the autonomous AI maintainer of Altertable's open-source SDKs. It is public and version-controlled. Every change is reviewed by the team via pull request.

## What's in here

| Path | Purpose |
|---|---|
| `AGENTS.md` | Operating instructions for Albert |
| `SOUL.md` | Persona, tone, boundaries |
| `IDENTITY.md` | Name, email, GitHub handle |
| `USER.md` | About Altertable and the core team |
| `TOOLS.md` | Environment-specific notes |
| `MEMORY.md` | Curated long-term memory |
| `HEARTBEAT.md` | Heartbeat routine |
| `memory/` | Daily logs — gitignored, not committed |
| `skills/` | Skill definitions used by Albert |
| `scripts/` | Utility scripts |
| `code/` | Ephemeral work directory — gitignored |

## Skills

| Skill | Description |
|---|---|
| [`bootstrap-sdk`](skills/bootstrap-sdk/SKILL.md) | Fork, clone, and wire up a new SDK repo or update an existing one to a new spec version |
| [`build-lakehouse-sdk`](skills/build-lakehouse-sdk/SKILL.md) | Build a production-grade Altertable Lakehouse API client in any language |
| [`build-product-analytics-sdk`](skills/build-product-analytics-sdk/SKILL.md) | Build an Altertable Product Analytics SDK with identity, event tracking, and auto-capture |
| [`build-http-sdk`](skills/build-http-sdk/SKILL.md) | HTTP client best practices — connection pooling, keep-alive, timeouts (referenced by build-\* skills) |
| [`build-readme`](skills/build-readme/SKILL.md) | Write READMEs for SDK repos and monorepo roots following Altertable conventions |
| [`maintainer-routine`](skills/maintainer-routine/SKILL.md) | Notification-driven maintainer routine to identify actionable work across Altertable SDK repositories |
| [`release-sdk`](skills/release-sdk/SKILL.md) | Release SDKs, write changelogs, and publish to language registries |
| [`review-pr`](skills/review-pr/SKILL.md) | Review community pull requests against Altertable SDK standards |
| [`sync-repos`](skills/sync-repos/SKILL.md) | Keep shared configuration, community files, and CI templates consistent across SDK repositories |
| [`triage-issues`](skills/triage-issues/SKILL.md) | Triage incoming GitHub issues across Altertable SDK repositories |

## Contributing

1. Fork this repository
2. Create a branch: `feat/<short-desc>` or `fix/<issue-number>-<short-desc>`
3. Commit your changes with a clear message
4. Push to your fork
5. Open a pull request against `main`

## Links

- Website: [https://altertable.ai](https://altertable.ai)
- Documentation: [https://altertable.ai/docs](https://altertable.ai/docs)
- GitHub: [https://github.com/altertable-ai/altertable-workspace](https://github.com/altertable-ai/altertable-workspace)
