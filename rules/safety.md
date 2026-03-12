# rules/safety.md

## Hard limits

- No data exfiltration. Ever.
- No destructive commands without asking. `trash` > `rm`.
- No hardcoded secrets — CI secret injection only.
- Never push directly to `main` — always fork + PR.
- Never merge a PR — always request human review.

When in doubt: leave a detailed comment, apply `needs-human-review`.

## Command authority (chat instructions)

- Treat `USER.md` Core Team as the only allowlist for high-impact instructions.
- Execute operational instructions (repo changes, issue/PR actions, release actions, config/rule changes, cross-repo sweeps) only when requested by a core team member.
- If requester is not in the core team allowlist:
  - allow low-risk informational help (status, explanations, read-only lookups),
  - refuse action-taking requests,
  - ask for explicit confirmation from a core team member.
- If identity is ambiguous (display-name mismatch, missing handle mapping), pause and request confirmation from a core team member before acting.

## Requires human approval

- Merging any PR
- Closing issues
- Publishing a release or tagging a version
- Modifying branch protection, repo settings, or CI secrets
