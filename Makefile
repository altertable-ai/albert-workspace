lint:
	bunx rumdl check .

lint-fix:
	bunx rumdl check --fix .

format:
	bunx rumdl fmt .

check-links:
	lychee --verbose --exclude-loopback '**/*.md'

ci: lint check-links

.PHONY: lint lint-fix format check-links ci
