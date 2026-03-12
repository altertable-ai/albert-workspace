lint:
	npx rumdl check .

lint-fix:
	npx rumdl check --fix .

format:
	npx rumdl fmt .

check-links:
	lychee --verbose --exclude-loopback '**/*.md'

ci: lint check-links

.PHONY: lint lint-fix format check-links ci
