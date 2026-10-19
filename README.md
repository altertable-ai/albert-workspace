# albert-workspace

This is **Albert's home** — the workspace for Altertable's autonomous maintainer of open-source repositories. It is public and version-controlled. Every change is reviewed by the team via pull request.

## What Albert does

Albert maintains every repository listed in
[repositories.config.json](repositories.config.json), including this workspace,
libraries, CLIs, integrations, and applications. The `sdks` and `projects` groups
organize the list; both are part of his responsibility.

He answers users, investigates bugs, reviews contributions, prepares verified
fixes in his fork, and follows his PRs through review. After a human merges or
releases a fix, he checks the result and returns to the original thread when a
follow-up was promised. Routine maintenance has
[standing permission](rules/safety.md#standing-maintenance-permission); product
decisions, merges, releases, and repository administration stay with the team.

Work arrives through direct requests and the existing periodic checks. Saved work
records the intended result, evidence, promises, and when to check again. Albert
resumes it on the next relevant polling pass. This workspace does not require
webhooks or a new scheduling service.

## Runtime and repository maintenance

OpenClaw loads [`AGENTS.md`](AGENTS.md) from the configured workspace. It directs
sessions running as Albert to read [`ALBERT.md`](ALBERT.md) before starting work,
including direct conversations and scheduled maintenance. No special launch
message is needed. See [OpenClaw startup instructions](https://docs.openclaw.ai/concepts/system-prompt).

The same `AGENTS.md` separately guides agents editing this repository. They review
Albert's configuration without adopting his identity or running his maintenance
loop. Keep Albert's live runtime on a dedicated `main` checkout and edit
configuration in separate worktrees. The sync script protects the live checkout;
it is not a startup requirement for repository editors.

After deploying changes, verify the connection in a fresh Albert conversation:
use `/context detail` to confirm the expected workspace's `AGENTS.md` is present,
then give an ordinary task and inspect the tool history for an `ALBERT.md` read.
Check a scheduled maintenance run too. These are live checks; repository validation
alone cannot prove which files the deployed host loaded. Deployment-specific
launcher settings are private and are not managed by this repository.

OpenClaw normally supplies identity and main memory at startup; skills use that
context and retrieve older notes only when needed. See the
[OpenClaw memory documentation](https://docs.openclaw.ai/concepts/memory).

For weekly activity, run `python3 scripts/github-activity.py`. It returns dated PR
and issue-comment links for all listed repositories. `--since` is inclusive and
`--until` exclusive; dates without a time mean midnight UTC. Use `--help` for options.

Skills describe how to do a task, `rules/` keeps shared instructions, and `scripts/`
handles repeated lookups and checks. Each skill can be used on its own. SDK-specific
skills and shared templates apply only where relevant; other projects use their own
contribution guide, architecture, and tests.

## What's in here

| Path | Purpose |
|---|---|
| `AGENTS.md` | Instructions for agents maintaining this repository |
| `ALBERT.md` | Explicit runtime entrypoint: startup, shared policy, task routing |
| `SOUL.md` | Persona, tone, boundaries |
| `IDENTITY.md` | Name, email, GitHub handle |
| `USER.md` | About Altertable and the core team |
| `TOOLS.md` | Environment-specific notes |
| `MEMORY.md` | Curated long-term memory |
| `HEARTBEAT.md` | Heartbeat routine |
| `rules/` | Shared instructions, read when needed |
| `memory/` | Daily logs — gitignored, not committed |
| `skills/` | Operational skill definitions used by Albert |
| `scripts/` | Reusable GitHub lookups, repository setup, and checks |
| `code/` | Ephemeral work directory — gitignored |

## Shared rules

Skills link to the shared rules they need. Albert reads only what helps with the task.

| Brick | Purpose |
|---|---|
| [`rules/memory.md`](rules/memory.md) | Daily notes and MEMORY.md maintenance |
| [`rules/contribution.md`](rules/contribution.md) | Fork/branch/PR workflow for supervised repos |
| [`rules/quality.md`](rules/quality.md) | Checks before review or a PR |
| [`rules/team.md`](rules/team.md) | Working with team and external contributors |
| [`rules/communication.md`](rules/communication.md) | GitHub and Slack communication norms |
| [`rules/change-control.md`](rules/change-control.md) | What workspace changes require PRs |
| [`rules/safety.md`](rules/safety.md) | Permissions and actions requiring approval |
| [`rules/specs.md`](rules/specs.md) | Spec-to-SDK pipeline: specs submodule, update event chain |

## Skills

### General maintenance

| Skill | Purpose |
|---|---|
| [routine-maintainer](skills/routine-maintainer/SKILL.md) | Handle notifications, saved work, and promised follow-ups |
| [ops-triage](skills/ops-triage/SKILL.md) | Investigate issues and prepare confirmed bug fixes |
| [ops-review](skills/ops-review/SKILL.md) | Review code and whether a change fits the project |
| [ops-report](skills/ops-report/SKILL.md) | Report useful outcomes across the configured repositories |
| [routine-sync](skills/routine-sync/SKILL.md) | Check supported SDK specs and shared files |

### SDK tasks

| Skill | Purpose |
|---|---|
| [sdk-bootstrap](skills/sdk-bootstrap/SKILL.md) | Set up an SDK or update its spec pin |
| [sdk-implement](skills/sdk-implement/SKILL.md) | Implement the requirements in a pinned spec |
| [sdk-readme](skills/sdk-readme/SKILL.md) | Write SDK package and monorepo documentation |
| [sdk-release](skills/sdk-release/SKILL.md) | Prepare package versions and releases for human approval |
| [sdk-sync](skills/sdk-sync/SKILL.md) | Maintain selected shared files and CI settings |

SDK repositories consume versioned specs from `altertable-client-specs` through a
`specs/` submodule. A new tag can lead to a pin-and-implementation PR through
routine-sync and sdk-bootstrap. This flow does not apply to every repository.

## Checking behavior changes

Use the [behavior cases](skills/routine-maintainer/references/behavior-cases.md) for
dry runs without posting or changing external state. They cover useful responses,
follow-through, permissions, and projects beyond SDKs. Check the result and actions,
not whether the model repeats the instructions. Script tests run with `make validate`.

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
