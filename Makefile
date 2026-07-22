# MediPrimer build / verify / deploy.
#   make build   — normalize + assemble + seo (stamps today's date)
#   make check   — build, then JS syntax check + plain-language gate (grade <= 9.5)
#   make deploy  — check, show factual-drift report vs live, rsync to /var/www

DATE  := $(shell date +%F)
PUB   := public
LIVE  := /var/www/mediprimer/public

.PHONY: build check deploy

build:
	cd $(PUB) && python3 ../build/normalize.py && python3 ../build/assemble.py && python3 ../build/seo.py $(DATE)

check: build
	@set -e; for f in $(PUB)/*.js; do node --check $$f; done
	python3 build/readability.py
	@python3 build/readability.py | grep -q 'Over target (grade > 9.5): 0' \
		|| { echo 'FAIL: member pages over plain-language target (grade > 9.5)'; exit 1; }
	python3 build/check_chatbot_injected.py

deploy: check
	python3 build/factdiff.py
	sudo rsync -a --delete --chown=www-data:www-data $(PUB)/ $(LIVE)/
	python3 build/indexnow.py
	@echo 'Deployed to $(LIVE)'
