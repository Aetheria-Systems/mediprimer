# MediPrimer build / verify / deploy.
#   make build   — normalize + assemble + seo (stamps today's date)
#   make check   — build, then JS syntax check + plain-language gate (grade <= 9.5)
#   make deploy  — check, factual-drift report, then commit -> PR -> merge -> GitHub Actions publishes

DATE  := $(shell date +%F)
PUB   := public
LIVE  := /var/www/mediprimer/public

.PHONY: build check deploy

build:
	cd $(PUB) && python3 ../build/normalize.py && python3 ../build/assemble.py && python3 ../build/render_diagrams.py &&	python3 ../build/hot_topics.py && python3 ../build/newsletter_block.py && python3 ../build/apply_lang_titles.py && python3 ../build/seo.py $(DATE) && python3 ../build/relink_missing_translations.py

check: build
	-python3 build/autorepair.py
	@set -e; for f in $(PUB)/*.js; do node --check $$f; done
	python3 build/readability.py
	@python3 build/readability.py | grep -q 'Over target (grade > 9.5): 0' \
		|| { echo 'FAIL: member pages over plain-language target (grade > 9.5)'; exit 1; }
	python3 build/check_language_coverage.py
	python3 build/check_tool_render.py
	python3 build/check_translated_attrs.py
	python3 build/check_facts.py --all
	python3 build/check_chrome_labels.py
	python3 build/check_chatbot_injected.py
	python3 update/validate.py

# Deploys happen from GitHub: .github/workflows/deploy.yml builds and publishes
# every merge to main on the self-hosted runner. `make deploy` therefore
# commits the working tree, opens and merges the PR, waits for that workflow,
# and verifies the live stamp. A direct rsync from a working tree is no longer
# a supported path (2026-10-09).
deploy: check
	python3 build/factdiff.py
	bash seo/deploy-via-github.sh "deploy: $(shell git log -1 --format=%s 2>/dev/null | cut -c1-60) + working-tree changes $(DATE)"
