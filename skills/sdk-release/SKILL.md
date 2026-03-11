---
name: sdk-release
description: Defines conventions for releasing open-source SDKs and libraries. Use when releasing a new version of an SDK, writing changelogs, or publishing to a language registry (npm, PyPI, Maven, etc.).
---

# SDK Release

Called by `sdk-implement` Phase 7.

**Rules:** [safety](../../rules/safety.md) · [change-control](../../rules/change-control.md)

## Versioning

Use [Semantic Versioning](https://semver.org/):

- **Initial version**: `0.1.0` for new packages.
- Increment **patch** for bug fixes, **minor** for new features, **major** for breaking changes.
- While on `0.x`, breaking changes bump **minor** (e.g., `0.1.0` → `0.2.0`).

## Package Naming

Convention: `altertable-{lang}` for product analytics SDKs (default product). `altertable-{product}-{lang}` for other product SDKs (e.g., `altertable-lakehouse-ruby`).

Package names, registries, and repository mappings are defined in [`repositories.config.json`](../../repositories.config.json).

Note: the JS/TS SDK and web framework wrappers live in the [`altertable-js` monorepo](https://github.com/altertable-ai/altertable-js) under `packages/` — that repo publishes multiple packages.

## Changelog

Follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

## [Unreleased]

### Added

- New feature description.

### Changed

- Changed behavior description.

### Fixed

- Bug fix description.

### Removed

- Removed feature description.
```

Rules:

- One entry per user-facing change.
- Use imperative mood ("Add support for…", not "Added support for…").
- Group by type (`Added`, `Changed`, `Fixed`, `Removed`).
- Link each version heading to a diff (e.g., `[0.2.0]: https://github.com/altertable-ai/altertable-js/compare/v0.1.0...v0.2.0`).

## Automated Releases

Use **release-please** GitHub Action for:

1. Automated version bumps from [Conventional Commits](https://www.conventionalcommits.org/).
2. Changelog generation.
3. GitHub Release creation with release notes.
4. Triggering registry publish on release.

Commit message prefixes:

| Prefix | Version Bump |
|--------|--------------|
| `fix:` | Patch |
| `feat:` | Minor |
| `feat!:` | Major |

## Registry Publishing

### Pre-publish checklist

- [ ] Version in manifest matches intended release.
- [ ] All tests pass in CI.
- [ ] Changelog is up to date.
- [ ] README has usage examples for all public API methods.
- [ ] Package metadata is complete (description, keywords, license, repository URL, homepage).
- [ ] Build artifacts are correct (no dev dependencies bundled, tree-shakeable where applicable).

### Language-specific notes

**npm (JS/TS)**:

- Set `"sideEffects": false` for tree shaking.
- Export both ESM and CJS via `exports` field.
- Include `types` field pointing to declarations.
- Use `files` array to allowlist published files.

**PyPI (Python)**:

- Use `pyproject.toml` with `[build-system]` section.
- Include `py.typed` marker for typed packages.

**Maven Central (Java/Kotlin)**:

- Sign artifacts with GPG.
- Include sources and javadoc JARs.

**crates.io (Rust)**:

- Run `cargo publish --dry-run` before release.

## License

All packages use the **MIT** license. Include `LICENSE` file at the package root.
