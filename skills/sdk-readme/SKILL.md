---
name: sdk-readme
description: Defines how to write READMEs for Altertable open-source SDK repositories. Use when creating or updating a README for any SDK repo, monorepo root, or individual package. Covers monorepo root READMEs, per-package READMEs, section structure, tables, badges, and tone conventions.
---

# SDK README

Called by `sdk-implement` Phase 7. Two README types: **monorepo root** and **package**.

**Rules:** [quality](../../rules/quality.md) · [change-control](../../rules/change-control.md)

---

## Monorepo Root README

### Structure

```markdown
# {Repo Title}

{One-sentence description of what the repo contains and its purpose.}

## Packages

{Table: package path links, description, registry badge}

## Examples

{Table: example path, description, port, framework — only if examples exist}

## Quick Start

{Brief prose directing readers to per-package READMEs. No code block here.}

## Development

### Prerequisites

{Bullet list of required tools with installation links}

### Setup

{Single bash code block: install, build, test}

### Development Workflow

{Table: Step | Command | Description}

### Monorepo Scripts

{Table: Script | Description — all scripts in the root manifest}

## Testing

{Short description + bash block for common test commands}

## Releasing

{Numbered steps, referencing the GitHub Actions release workflow with a direct link}

## Documentation

{Bullet list linking to per-package READMEs and any API reference}

## Contributing

{Standard 5-step fork → PR flow}

## License

{Single link to the LICENSE file inside the first package, or root if present}

## Links

{Bullet list: Website, Documentation, GitHub repository}
```

### Conventions

- **Repo title**: Use the plain product name, e.g. `Altertable JavaScript SDK`. No monorepo jargon.
- **Top description**: One sentence. Mention language, purpose, and key quality words (e.g., "type-safe", "production-grade").
- **Packages table columns**: `Package` (linked name), `Description`, registry badge column (e.g., `NPM`, `PyPI`). Omit badge column for packages not on a registry.
- **Examples table columns**: `Example` (linked name), `Description`, `Port` (if applicable), `Framework`.
- **Badge format**: use `shields.io` npm/pypi/etc. badges linked to the registry page.
- **Quick Start section**: Do not duplicate install or code here. Link to per-package READMEs instead.
- **Development Workflow table columns**: `Step`, `Command`, `Description`.
- **Monorepo Scripts table columns**: `Script`, `Description`. List all scripts from the root manifest.
- **Testing section**: Include three commands — run all tests, run in watch mode, run for a specific package.
- **Releasing section**: Numbered steps ending with a link to the GitHub Actions release workflow URL.
- **Contributing**: Always the same 5-step flow (fork, branch, commit, push, PR).
- **License**: Link to the LICENSE file, not inline text.
- **Links section**: Always include Website (`https://altertable.ai`), Documentation (`https://altertable.ai/docs`), and GitHub Repository URL.

**Canonical reference:** See the [`altertable-js`](https://github.com/altertable-ai/altertable-js) repo for a complete example of a monorepo root README. Key patterns to replicate: packages table with shields.io npm badges, Development Workflow table (Step / Command / Description), Monorepo Scripts table covering all root-level scripts, Testing section with three command variants, Releasing section with link to the GitHub Actions workflow page.

---

## Package README

Every package README must include these sections in order:

1. **One-line description** — what the package does.
2. **Install** — single command to install.
3. **Quick start** — minimal working example.
4. **API reference** — all public methods with signatures and examples.
5. **Configuration** — all options with defaults.
6. **Development** — prerequisites, dependency installation, test command, lint command.
7. **License** — link to the LICENSE file.

### Additional conventions for Altertable packages

- **Install section**: Single command only. Use the canonical package manager for the ecosystem (e.g., `npm install`, `pip install`, `gem install`).
- **Quick start**: Provide the minimal working example — init + one `track` call (for analytics SDKs) or one query (for lakehouse SDKs). Keep it under 20 lines.
- **API reference**: Document every public method. Show the signature, a one-line description, and a usage example. Group by functional area (e.g., Identity, Tracking, Configuration).
- **Configuration**: Table with columns `Option`, `Type`, `Default`, `Description`. List all config keys.
- **Framework packages** (e.g., React): Add a "Usage" section between Quick Start and API Reference showing the provider setup and hooks.
- **Development section**: Include prerequisites (tools and versions), dependency installation commands, the exact test command, and the exact lint command. Keep it to one code block where possible. This is the canonical reference for contributors working on the SDK.

---

## Tone and Style

- Write in second person ("You can…", "Call `track()`…"). Avoid first person.
- Use present tense ("Returns", "Sends", not "Will return", "Will send").
- Keep prose minimal — prefer tables and code blocks over paragraphs.
- Code blocks must be runnable as-is (no placeholder-only examples).
- Use inline code (backticks) for all method names, config keys, file paths, and commands.
