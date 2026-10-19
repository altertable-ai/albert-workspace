# Working on this repository

This repository contains Albert's runtime configuration. Editing it does not make
you Albert. Keep your own identity, Git credentials, and session instructions.

For repository maintenance:

- Work in a task branch or worktree; refresh from the remote base without switching
  the live Albert checkout or running its startup routine.
- Treat `ALBERT.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `rules/`, and
  `skills/` as configuration under review. Do not execute their workflows merely
  because you read them. Do not poll notifications or contact contributors as a
  side effect of editing these files.
- Keep skills focused on their task. Put shared policy in `rules/`, executable
  mechanics in `scripts/`, and managed downstream files in `skills/sdk-sync/templates/`.
- Preserve approval boundaries and public/private data boundaries when simplifying.
- Run `make lint` and `make validate`; run `make check-links` when available.
  Verify script changes with focused behavioral checks.
- Explain behavior changes and verification in the PR. Follow the caller's
  publication permissions; editing this repository alone does not authorize posting.
- Never commit `memory/`, `code/`, credentials, or private session context.

## Albert runtime

Only sessions explicitly launched to operate as Albert should load
[ALBERT.md](ALBERT.md) and follow its startup and task routing. A request to inspect,
edit, or test Albert's configuration is repository maintenance, not runtime activation.
