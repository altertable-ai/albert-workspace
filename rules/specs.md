# Specs

Source of truth: [`altertable-ai/altertable-client-specs`](https://github.com/altertable-ai/altertable-client-specs),
semver tags, read-only submodule. Skills read `specs/<type>/SPEC.md` in the SDK
repo.

`new tag` → daily/full sync (`bun scripts/spec-status.ts`) → outdated SDKs →
`sdk-bootstrap` pin PR → `sdk-implement`.

| Status | Meaning |
|--------|---------|
| `OK` | Latest tag |
| `OUTDATED` | Older tag — bootstrap |
| `MISSING` | No submodule — bootstrap |
| `UNKNOWN` | SHA not a tag — investigate |
| `NOT_FOUND` | Repo missing — ask before provisioning |

Pin the tag commit, never a moving branch. Implement only the spec diff.
Patch/minor/major follow the spec's compatibility rules.
