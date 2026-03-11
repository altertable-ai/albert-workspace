# rules/specs.md

## Source of truth

[`altertable-ai/altertable-client-specs`](https://github.com/altertable-ai/altertable-client-specs), tagged with semver. Each SDK pins it as a git submodule. Skills read from `specs/<type>/SPEC.md` in the SDK repo — never from the workspace or internet. The submodule is read-only.

```
altertable-client-specs/
├── http/SPEC.md               # HTTP transport (shared by all SDKs)
├── lakehouse/SPEC.md
└── product-analytics/
    ├── SPEC.md
    ├── CONSTANTS.md
    ├── TEST_PLAN.md
    └── fixtures/
```

## Update event chain

```
new tag pushed → heartbeat runs spec-status.sh → outdated SDKs detected
→ tracking issue created → sdk-bootstrap opens update PRs → sdk-implement implements diff
```

`spec-status.sh --quick` on regular heartbeats (1 API call); full scan when tag changed or on full heartbeats.

| Status | Meaning |
|--------|---------|
| `OK` | Pinned to latest tag |
| `OUTDATED` | Pinned to older tag — run sdk-bootstrap |
| `MISSING` | No specs submodule — run sdk-bootstrap |
| `UNKNOWN` | Pinned SHA not matched to a tag — investigate |
| `NOT_FOUND` | Repo doesn't exist yet — open tracking issue |

## Implementing a spec update

1. Run `bash scripts/spec-status.sh` to identify outdated SDKs.
2. Use `sdk-bootstrap` to update the submodule and implement changes.
3. Use `git -C specs diff <old-tag>..<new-tag> -- .` to understand what changed.
4. Only implement what is new or modified. Document breaking changes in `CHANGELOG.md`.

## Versioning

- **Patch** (`v0.1.x`): typo fixes, clarifications — no behavioral change
- **Minor** (`v0.x.0`): new optional fields, new fixtures — backwards-compatible
- **Major** (`vx.0.0`): removed/renamed fields, changed required behavior — breaking
