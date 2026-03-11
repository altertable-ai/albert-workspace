# albert-workspace

This is **Albert's home** — the [OpenClaw](https://github.com/openclaw) workspace for the autonomous AI maintainer of Altertable's open-source SDKs. It is public and version-controlled. Every change is reviewed by the team via pull request.

## How it works

Albert is an autonomous AI maintainer. The workspace, specs, and SDK repos form a three-layer system:

```
albert-workspace          ← Albert's home: identity, skills, memory
        |
        | reads specs from altertable-client-specs
        ↓
altertable-client-specs       ← versioned API specs, fixtures, constants, test plans
        |
        | consumed as git submodule (pinned to a tag)
        ↓
SDK repos                     ← implementations: altertable-ruby, altertable-swift, etc.
  └── specs/                     submodule → altertable-client-specs@v0.x.0
```

**Typical flow when a new spec version ships:**

1. A spec change is merged and tagged in `altertable-client-specs` (e.g. `v0.3.0`).
2. On each heartbeat, Albert runs `spec-status.sh`, detects the new tag, and uses the `sdk-bootstrap` skill to open a PR in each outdated SDK, bumping its `specs/` submodule to the new tag and implementing the diff.
3. Team reviews and merges. Albert uses `sdk-release` to cut a new SDK release.

**Skills drive everything.** Each skill in `skills/` is a self-contained workflow Albert reads and follows. Skills reference composable rule bricks from `rules/` instead of loading a monolithic instruction file. Skills share community file templates via `skills/sdk-sync/templates/`.

## What's in here

| Path | Purpose |
|---|---|
| `AGENTS.md` | Slim entrypoint: workspace layout, session startup, rules index, heartbeat pointer |
| `SOUL.md` | Persona, tone, boundaries |
| `IDENTITY.md` | Name, email, GitHub handle |
| `USER.md` | About Altertable and the core team |
| `TOOLS.md` | Environment-specific notes |
| `MEMORY.md` | Curated long-term memory |
| `HEARTBEAT.md` | Heartbeat routine |
| `rules/` | Composable operating rule bricks — loaded per task, not all at once |
| `memory/` | Daily logs — gitignored, not committed |
| `skills/` | Operational skill definitions used by Albert |
| `scripts/` | Utility scripts |
| `code/` | Ephemeral work directory — gitignored |

## Rules

Rule bricks in `rules/` are focused, composable files. Each skill declares which bricks it depends on. Albert loads only what's relevant to the task.

| Brick | Purpose |
|---|---|
| [`rules/memory.md`](rules/memory.md) | Daily notes and MEMORY.md maintenance |
| [`rules/contribution.md`](rules/contribution.md) | Fork/branch/PR workflow for SDK repos |
| [`rules/quality.md`](rules/quality.md) | Quality gates and staff-level PR checklist |
| [`rules/team.md`](rules/team.md) | Working with team and external contributors |
| [`rules/communication.md`](rules/communication.md) | GitHub and Slack communication norms |
| [`rules/change-control.md`](rules/change-control.md) | What workspace changes require PRs |
| [`rules/safety.md`](rules/safety.md) | Hard limits and human approval gates |
| [`rules/specs.md`](rules/specs.md) | Spec-to-SDK pipeline: specs submodule, update event chain |

## Skills

### Operational skills (this repo)

| Skill | Description |
|---|---|
| [`sdk-bootstrap`](skills/sdk-bootstrap/SKILL.md) | Fork, clone, and wire up a new SDK repo or update an existing one to a new spec version |
| [`sdk-implement`](skills/sdk-implement/SKILL.md) | Implement an SDK from a versioned spec — dispatched by `sdk-bootstrap` |
| [`sdk-readme`](skills/sdk-readme/SKILL.md) | Write READMEs for SDK repos and monorepo roots following Altertable conventions |
| [`sdk-release`](skills/sdk-release/SKILL.md) | Release SDKs, write changelogs, and publish to language registries |
| [`routine-maintainer`](skills/routine-maintainer/SKILL.md) | Notification-driven maintainer routine to identify actionable work across Altertable SDK repositories |
| [`ops-review`](skills/ops-review/SKILL.md) | Review community pull requests against Altertable SDK standards |
| [`sdk-sync`](skills/sdk-sync/SKILL.md) | Keep shared configuration, community files, and CI templates consistent across SDK repositories |
| [`ops-triage`](skills/ops-triage/SKILL.md) | Triage incoming GitHub issues across Altertable SDK repositories |
| [`ops-report`](skills/ops-report/SKILL.md) | Generate weekly status summaries covering PRs, issues triaged, spec alignment, and blockers |

## Contributing

1. Fork this repository
2. Create a branch: `feat/<short-desc>` or `fix/<issue-number>-<short-desc>`
3. Commit your changes with a clear message
4. Push to your fork
5. Open a pull request against `main`

## Links

- Website: [https://altertable.ai](https://altertable.ai)
- Documentation: [https://altertable.ai/docs](https://altertable.ai/docs)
- GitHub: [https://github.com/altertable-ai/albert-workspace](https://github.com/altertable-ai/albert-workspace)
