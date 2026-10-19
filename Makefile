lint:
	npx rumdl check .

validate:
	bash scripts/validate-workspace.sh
	python3 -m unittest discover -s scripts/tests -p 'test_*.py'

validate-workflows:
	bash scripts/validate-workflow-policy.sh .

lint-fix:
	npx rumdl check --fix .

format:
	npx rumdl fmt .

check-links:
	lychee --verbose --exclude-loopback --exclude-path node_modules '**/*.md'

integration:
	npm run test:integration

ci: lint validate check-links integration

.PHONY: lint validate validate-workflows lint-fix format check-links integration ci
