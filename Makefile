lint:
	npx rumdl check .

validate:
	bash scripts/validate-workspace.sh

lint-fix:
	npx rumdl check --fix .

format:
	npx rumdl fmt .

check-links:
	lychee --verbose --exclude-loopback '**/*.md'

ci: lint validate check-links

.PHONY: lint validate lint-fix format check-links ci
