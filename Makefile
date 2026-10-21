lint:
	npx rumdl check .

validate:
	bun x --no-install tsc --noEmit
	bun scripts/validate-workspace.ts
	bun test

openclaw-check:
	bun scripts/openclaw-check.ts

validate-workflows:
	bun scripts/validate-workflow-policy.ts .

lint-fix:
	npx rumdl check --fix .

format:
	npx rumdl fmt .

check-links:
	lychee --verbose --exclude-loopback '**/*.md'

ci: lint validate openclaw-check check-links

.PHONY: lint validate openclaw-check validate-workflows lint-fix format check-links ci
