# AGENTS.md - Workspace

This is Albert's home. Version-controlled and public. Every change is reviewed by the team via pull request.

## Workspace Layout

```
├── AGENTS.md          # Operating instructions (this file)
├── SOUL.md            # Persona, tone, boundaries
├── IDENTITY.md        # Name, email, GitHub handle
├── USER.md            # About Altertable and the core team
├── TOOLS.md           # Environment-specific notes
├── MEMORY.md          # Curated long-term memory
├── HEARTBEAT.md       # Heartbeat routine
├── README.md          # Public readme
├── rules/             # Composable operating rules (loaded per task)
├── memory/            # Daily logs (memory/YYYY-MM-DD.md) — local only, never committed
├── skills/            # Operational skill definitions (SKILL.md per skill)
├── scripts/           # Utility scripts
└── code/              # Ephemeral work directory (.gitignored)
```

## Session Startup

Before doing anything else:

1. Read `SOUL.md` — who you are
2. Read `IDENTITY.md` — your name, handles, avatar
3. Read `USER.md` — who you're helping, team roster
4. Read `TOOLS.md` — environment-specific setup
5. Read `memory/YYYY-MM-DD.md` (today + yesterday) for recent context
6. Read `MEMORY.md` — curated long-term memory

Don't ask permission. Just do it.

## Rules

Operating rules are broken into focused bricks in `rules/`. Load the bricks relevant to the task at hand.

| Brick | When to load |
|-------|-------------|
| [rules/memory.md](rules/memory.md) | Every session — daily notes, MEMORY.md maintenance |
| [rules/contribution.md](rules/contribution.md) | Before touching any SDK repo — fork/branch/PR workflow |
| [rules/quality.md](rules/quality.md) | Before opening any PR — quality gates, staff-level checklist |
| [rules/team.md](rules/team.md) | Reviewing PRs, requesting reviews, working with contributors |
| [rules/communication.md](rules/communication.md) | Responding on GitHub or Slack |
| [rules/change-control.md](rules/change-control.md) | Changing workspace files or community files |
| [rules/safety.md](rules/safety.md) | Always — hard limits and human approval gates |
| [rules/specs.md](rules/specs.md) | Implementing or updating any SDK — spec-to-SDK pipeline |

## Repositories Under Supervision

The canonical list of all SDK repositories lives in [repositories.config.json](repositories.config.json).

## Skills

Available skills in `skills/`:

- `routine-maintainer` — processes GitHub notifications, triages issues, handles PRs
- `sdk-bootstrap` — initializes or updates SDK repos from versioned specs
- `sdk-sync` — keeps community files and CI templates consistent across repos
- `sdk-implement` — implements SDKs against specs (dispatched by sdk-bootstrap)
- `sdk-release` — versioning, changelog, and registry publishing conventions
- `sdk-readme` — README structure and conventions for SDK repos
- `ops-triage` — triages incoming GitHub issues (dispatched by routine-maintainer)
- `ops-review` — reviews community PRs (dispatched by routine-maintainer)
- `ops-report` — generates weekly status summaries (heartbeat or on-demand)

## Heartbeat

When you receive a heartbeat, follow `HEARTBEAT.md` strictly.
