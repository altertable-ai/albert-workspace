---
name: release-sdk
description: Defines conventions for releasing open-source SDKs and libraries. Use when releasing a new version of an SDK, writing changelogs, or publishing to a language registry (npm, PyPI, Maven, etc.).
---

# Release SDK Skill

## Related Skills

This skill is referenced by `build-*` skills during their packaging/release phases:

- **[bootstrap-sdk](../bootstrap-sdk/SKILL.md)**: Repo initialization and `altertable-api-specs` submodule workflow
- **[build-lakehouse-sdk](../build-lakehouse-sdk/SKILL.md)**: Lakehouse API client implementation
- **[build-product-analytics-sdk](../build-product-analytics-sdk/SKILL.md)**: Product Analytics SDK implementation
- **[sync-repos](../sync-repos/SKILL.md)**: Cross-repo consistency

## Versioning

Use [Semantic Versioning](https://semver.org/):

- **Initial version**: `0.1.0` for new packages.
- Increment **patch** for bug fixes, **minor** for new features, **major** for breaking changes.
- While on `0.x`, breaking changes bump **minor** (e.g., `0.1.0` → `0.2.0`).

## Package Naming

Convention: `altertable-{product}-{lang}` for product-specific SDKs, `altertable-{lang}` for product analytics SDKs (the default product).

### Lakehouse SDKs

Each language gets its own repository: `altertable-ai/altertable-lakehouse-{lang}`.

| Language | Package Name | Registry |
|----------|--------------|----------|
| Ruby | `altertable-lakehouse-ruby` | RubyGems |
| Python | `altertable-lakehouse-python` | PyPI |
| Go | `altertable-lakehouse-go` | Go Modules |
| Java | `altertable-lakehouse-java` | Maven Central |
| Kotlin | `altertable-lakehouse-kotlin` | Maven Central |
| Rust | `altertable-lakehouse-rust` | crates.io |
| PHP | `altertable-lakehouse-php` | Packagist |

### Product Analytics SDKs

The JS/TS SDK and web framework wrappers live in the [`altertable-js` monorepo](https://github.com/altertable-ai/altertable-js) under `packages/`. Other languages get their own repositories.

| Language/Framework | Package Name | Registry |
|--------------------|--------------|----------|
| JavaScript/TypeScript | `altertable-js` | npm |
| React | `altertable-react` | npm |
| Vue | `altertable-vue` | npm |
| Svelte | `altertable-svelte` | npm |
| Python | `altertable-py` | PyPI |
| Swift | `altertable-swift` | Swift Package Index |
| Kotlin | `altertable-kotlin` | Maven Central |
| Ruby | `altertable-ruby` | RubyGems |
| Java | `altertable-java` | Maven Central |
| Go | `altertable-go` | Go Modules |
| PHP | `altertable-php` | Packagist |
| Rust | `altertable-rust` | crates.io |

Web framework SDKs (React, Vue, Svelte, etc.) belong in the `altertable-js` monorepo under `packages/`, not in separate repositories.

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
| `BREAKING CHANGE:` | Major |

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

## README Structure

Every package README should include:

1. **One-line description** — what the package does.
2. **Install** — single command to install.
3. **Quick start** — minimal working example.
4. **API reference** — all public methods with signatures and examples.
5. **Configuration** — all options with defaults.
6. **License** — link to LICENSE file.

## Exports

Export all public types and constants that consumers need.
