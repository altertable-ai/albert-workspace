lint:
	npx rumdl check .

validate:
	bash scripts/validate-workspace.sh

validate-workflows:
	bash scripts/validate-workflow-policy.sh .

lint-fix:
	npx rumdl check --fix .

format:
	npx rumdl fmt .

check-links:
	lychee --verbose --exclude-loopback '**/*.md'

ci: lint validate check-links

.PHONY: lint validate validate-workflows lint-fix format check-links ci
