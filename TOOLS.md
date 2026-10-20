# TOOLS.md - Environment Notes

## GitHub permissions

Albert investigates public code and contributes through his own forks. Missing
rights and protected actions are in [rules/safety.md](rules/safety.md).

## GitHub / Git

- **CLI:** `gh` (pre-configured — do not run `gh auth login`)
- Always fetch from upstream `main` before branching; never force-push
- After cloning, configure identity:

```bash
git config user.name "Albert"
git config user.email "albert20260301@gmail.com"
```

## Unfinished work

Saved work and the due-work helper are described in
[rules/memory.md](rules/memory.md).

## Activity reports

Use `bun scripts/github-activity.ts` for the last seven days of Albert's PR,
issue-comment, and review activity. It uses Bun and the authenticated `gh` CLI, returns
JSON, and only reads GitHub. See `--help` for dates and author options.

## Workspace Linting

The workspace itself uses `rumdl` (Markdown linter) via `npx`.

| Command | Description |
|---------|-------------|
| `make lint` | Check Markdown files |
| `make lint-fix` | Auto-fix lint issues |
| `make format` | Format Markdown files |

## SDK Tooling

| Language | Install | Test Command | Lint Command | Build Command | Notes |
|---|---|---|---|---|---|
| Ruby | `bundle install` | `bundle exec rake spec` | `bundle exec rubocop` | `gem build *.gemspec` | Requires Ruby ≥ 3.1, Bundler |
| Python | `pip install -e ".[dev]"` | `pytest` | `ruff check .` | `python -m build` | Requires Python ≥ 3.9; formatter: `ruff format` |
| JavaScript / TypeScript | `npm install` | `npm test` | `npm run lint` | `npm run build` | Node ≥ 18; monorepo uses npm workspaces |
| Go | `go mod download` | `go test ./...` | `golangci-lint run` | `go build ./...` | Requires Go ≥ 1.21; install golangci-lint separately |
| Java | `mvn dependency:resolve` | `mvn test` | `mvn checkstyle:check` | `mvn package -DskipTests` | Requires JDK ≥ 11, Maven 3 |
| Kotlin | `./gradlew dependencies` | `./gradlew test` | `./gradlew ktlintCheck` | `./gradlew build -x test` | Requires JDK ≥ 11, Gradle wrapper in repo |
| Swift | `swift package resolve` | `swift test` | `swiftlint` | `swift build` | Requires Swift ≥ 5.9; Xcode or swift CLI |
| Rust | `cargo fetch` | `cargo test` | `cargo clippy -- -D warnings` | `cargo build --release` | Requires Rust stable; formatter: `cargo fmt` |
| PHP | `composer install` | `./vendor/bin/phpunit` | `./vendor/bin/phpcs` | _(library, no build step)_ | Requires PHP ≥ 8.1, Composer 2 |
| Shell (CLI) | _(none)_ | `bash tests/integration_test.sh` | `shellcheck bin/* scripts/*` | _(shipped as shell scripts)_ | Install shellcheck via apt/brew |

For prerequisites, also check the target repository's `## Development` section.

## Registry Verification

After a human-approved release starts, verify the version is live on its registry.
A merged release PR counts when the repository's automation uses it to publish;
an ordinary implementation merge does not start the publication check. The 24-hour
publication follow-up is in [HEARTBEAT.md](HEARTBEAT.md).

Commands for package registries:

| Registry | Command |
|----------|---------|
| npm | `npm view <pkg> version` |
| PyPI | `pip index versions <pkg>` |
| RubyGems | `gem info <pkg> --remote` |
| crates.io | `cargo search <pkg>` |
| Maven Central | `curl -s "https://search.maven.org/solrsearch/select?q=a:<pkg>" \| jq '.response.docs[0].latestVersion'` |
| Packagist | `curl -s "https://packagist.org/packages/<vendor>/<pkg>.json" \| jq '.package.versions \| keys \| .[-1]'` |
| Swift Package Index | `curl -s "https://swiftpackageindex.com/api/packages/<vendor>/<pkg>" \| jq '.releases.latest.version'` |
