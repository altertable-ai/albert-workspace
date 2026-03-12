---
name: sdk-readme
description: Defines how to write README files for Altertable open-source SDK repositories. Use when creating or updating a README for monorepo roots or package-level SDKs. Enforces section order, copy-paste-ready examples, API/config tables, and modern OSS trust signals (badges, package matrix, contributor workflow).
---

# SDK README

Use this skill when writing or refactoring README files for Altertable SDK repositories. Also called by `sdk-implement` Phase 7. Two README types: **monorepo root** and **package**.

**Rules:** [quality](../../rules/quality.md) · [change-control](../../rules/change-control.md)

---

## Modern OSS Principles (baseline)

Apply these patterns consistently (inspired by `altertable-ruby` and `altertable-js`):

1. **Lead with trust signals**: title, concise value proposition, and relevant badges (CI, package registry, license).
2. **Optimize time-to-first-success**: install + minimal runnable snippet must appear early and work as-is.
3. **Use scannable structure**: short sections, tables over long prose, explicit headings.
4. **Separate audiences**:
   - users: Install / Quick start / API / Configuration
   - contributors: Development / Testing / Releasing / Contributing
5. **Prefer navigational docs for monorepos**: root README points to package READMEs instead of duplicating package API details.
6. **Keep examples realistic but minimal**: no pseudo-code placeholders; include authentic method names and imports.

---

## Monorepo Root README

### Required structure

```markdown
# {Repo Title}

{One-sentence description: language + purpose + quality signal}

## Packages

{Table: package link, description, registry badge}

## Examples

{Table: example path, description, port, framework} # only if examples exist

## Quick Start

{Short navigation text pointing to per-package READMEs. No code block.}

## Development

### Prerequisites

{Bullet list of required tools with links}

### Setup

{Single bash block: install, build, test}

### Development Workflow

{Table: Step | Command | Description}

### Monorepo Scripts

{Table: Script | Description (all root scripts)}

## Testing

{Short intro + bash block with 3 commands: all, watch, one package}

## Releasing

{Numbered release flow ending with GitHub Actions workflow link}

## Documentation

{Links to package READMEs / API docs}

## Contributing

{Standard 5-step fork flow}

## License

{Link to LICENSE file}

## Links

{Website + Documentation + GitHub repository}
```

### Conventions

- **Title**: plain product naming (e.g., `Altertable JavaScript SDK`).
- **Opening sentence**: concise, specific, and quality-oriented (e.g., “modern”, “type-safe”, “production-grade”).
- **Packages table columns**: `Package`, `Description`, registry column (`NPM`, `PyPI`, etc.).
- **Registry badges**: use `shields.io` linked to the package page.
- **Quick Start**: act as routing layer to package docs, not duplicate package install/API.
- **Monorepo Scripts**: document every root manifest script (no hidden scripts).
- **Testing**: always show full suite + watch mode + package-scoped execution.
- **Links**: always include:
  - Website: `https://altertable.ai`
  - Documentation: `https://altertable.ai/docs`
  - GitHub repository URL

**Canonical reference:** `altertable-js` root README.

---

## Package README

### Required section order

1. One-line description
2. `## Install`
3. `## Quick start`
4. `## API reference`
5. `## Configuration`
6. `## Development`
7. `## License`

### Content rules

#### 1) One-line description

- State what the package does and where it runs.
- Keep it concrete; avoid marketing fluff.

#### 2) Install

- Show one canonical install command only.
- Use ecosystem-native manager (`npm install`, `pip install`, `gem install`, etc.).

#### 3) Quick start

- Must be runnable copy/paste code (imports + init + one key action).
- Keep under ~20 lines.
- Analytics SDKs: include one `track` call.
- Lakehouse SDKs: include one query execution.

#### 4) API reference

- Document every public method.
- For each method include:
  - signature (or exact command form for CLI)
  - one-line behavior description
  - minimal usage snippet when useful
- Group by capability (Initialization, Tracking, Identity, Querying, etc.).

#### 5) Configuration

Use a single table:

| Option | Type | Default | Description |
|---|---|---|---|

Include all configurable keys/env vars, including defaults and requiredness.

#### 6) Development

- Include prerequisites (tool + minimum version).
- Include exact dependency install command.
- Include exact test command.
- Include exact lint command.
- Prefer one compact code block.

#### 7) License

- Link to repository `LICENSE` file.
- Do not paste full license text in README.

### Framework package add-on

If package targets a framework (e.g., React), add `## Usage` between Quick start and API reference to show provider/setup and common integration pattern.

---

## Style and formatting

- Write in second person and present tense.
- Keep prose short; favor tables, bullets, and runnable snippets.
- Use inline code for methods, commands, env vars, paths, config keys.
- Keep heading capitalization consistent (`Quick start`, `API reference`).
- Avoid duplicate content across root and package READMEs.
- Avoid broken promises (“coming soon”, TODO sections) in committed README files.

---

## Review checklist (before commit)

- [ ] Required sections exist and are in required order.
- [ ] All code blocks are syntactically valid and plausible to run.
- [ ] API reference covers all public methods/commands.
- [ ] Configuration table is complete and accurate.
- [ ] Development commands match real project tooling.
- [ ] License points to `LICENSE`.
- [ ] Root README (monorepo) links package docs instead of duplicating them.
- [ ] Badges and links resolve correctly.
