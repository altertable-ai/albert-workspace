# Contributing

Fork, branch (`feat/<desc>` or `fix/<issue>-<desc>`), PR against `main`. The core
team reviews every change.

- Runtime instructions: explain the behavior change.
- Scripts: cover missing data and API errors.
- CI must be green.

`make lint`, `make validate`, `make check-links` when lychee is installed. Bun
is pinned in `.bun-version`.
