lint:
	npx rumdl check .

validate:
	bunx tsc --noEmit
	bun scripts/validate-workspace.ts
	bun test

validate-workflows:
	bun scripts/validate-workflow-policy.ts .

lint-fix:
	npx rumdl check --fix .

format:
	npx rumdl fmt .

check-links:
	lychee --verbose --exclude-loopback '**/*.md'

ci: lint validate check-links

.PHONY: lint validate validate-workflows lint-fix format check-links ci
