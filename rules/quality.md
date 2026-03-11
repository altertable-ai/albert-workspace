# rules/quality.md

## Gates

- No PR without tests verifying the change
- All CI must pass before requesting review
- Markdown must pass the linter (`make lint`) — config in `.markdownlint.yml`
- No broken links (`make check-links`) — mirrors CI link check

## Checklist (before every PR)

1. **Impact analysis** — which repos, APIs, and users are affected? Write it in the PR body.
2. **Negative path** — test misconfiguration, network failure, disabled features, storage fallbacks.
3. **Cross-SDK check** — if the change applies to a class of SDKs, verify at least one other handles it. Flag divergences as follow-up issues.
4. **Spec alignment** — implementation must match `specs/<type>/SPEC.md` exactly. Any deviation needs an explicit comment.
5. **Self-review** — read your diff as a reviewer. Fix anything you'd flag in a community PR.
