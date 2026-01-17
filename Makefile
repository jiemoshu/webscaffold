# Singapore Math Platform - Development Commands
# Usage: make <target>

.PHONY: help setup neo4j-up neo4j-down \
        kg-dev kg-status kg-process kg-query kg-api kg-lint kg-format \
        web-dev web-install web-build web-lint clean

# Default target
help:
	@echo ""
	@echo "Singapore Math Platform - Available Commands"
	@echo "============================================="
	@echo ""
	@echo "Setup:"
	@echo "  make setup        - Full setup (Neo4j + KG Pipeline)"
	@echo ""
	@echo "Infrastructure:"
	@echo "  make neo4j-up     - Start Neo4j container"
	@echo "  make neo4j-down   - Stop Neo4j container"
	@echo ""
	@echo "KG Pipeline (services/kg-pipeline):"
	@echo "  make kg-dev       - Setup: create venv + install dependencies"
	@echo "  make kg-status    - Check pipeline status"
	@echo "  make kg-process   - Process PDFs in inbox"
	@echo "  make kg-query Q=\"...\" - Query the knowledge graph"
	@echo "  make kg-api       - Start FastAPI server (:18000)"
	@echo "  make kg-lint      - Lint Python code"
	@echo "  make kg-format    - Format Python code"
	@echo ""
	@echo "Web (web/):"
	@echo "  make web-dev      - Install deps + run dev server (:3000)"
	@echo "  make web-install  - Install dependencies only"
	@echo "  make web-build    - Build for production"
	@echo "  make web-lint     - Lint TypeScript code"
	@echo ""

# =============================================================================
# SETUP
# =============================================================================

setup: neo4j-up kg-dev
	@echo ""
	@echo "✅ Setup complete! Next steps:"
	@echo "   1. Edit .env and add your OPENAI_API_KEY"
	@echo "   2. make kg-status"
	@echo ""

# =============================================================================
# INFRASTRUCTURE
# =============================================================================

neo4j-up:
	@echo "Starting Neo4j..."
	@docker-compose up -d
	@echo "Neo4j Browser: http://localhost:17474"
	@echo "Credentials: neo4j / singapore_math_2024"

neo4j-down:
	@echo "Stopping Neo4j..."
	@docker-compose down

# =============================================================================
# KG PIPELINE
# =============================================================================

VENV = .venv/bin
KG_RUN = cd services/kg-pipeline && ../../$(VENV)/python -m

kg-dev:
	@./scripts/setup-kg-pipeline.sh

kg-status:
	@$(KG_RUN) src.cli status

kg-process:
	@$(KG_RUN) src.cli process

kg-query:
ifndef Q
	@echo "Usage: make kg-query Q=\"your question\""
	@echo "Example: make kg-query Q=\"什么是 bar model?\""
else
	@$(KG_RUN) src.cli query "$(Q)"
endif

kg-api:
	@cd services/kg-pipeline && ../../$(VENV)/uvicorn src.api:app --host 0.0.0.0 --port 18000 --reload

kg-lint:
	@cd services/kg-pipeline && ../../$(VENV)/ruff check src/
	@cd services/kg-pipeline && ../../$(VENV)/black --check src/

kg-format:
	@cd services/kg-pipeline && ../../$(VENV)/black src/
	@cd services/kg-pipeline && ../../$(VENV)/ruff check src/ --fix

# =============================================================================
# WEB
# =============================================================================

web-install:
	@echo "Installing Web dependencies..."
	@cd web && yarn install
	@echo "✅ Dependencies installed"

web-dev: web-install
	@echo "Starting Next.js dev server..."
	@cd web && yarn dev

web-build:
	@cd web && yarn build

web-lint:
	@cd web && yarn lint

# =============================================================================
# UTILITIES
# =============================================================================

clean:
	@echo "Cleaning..."
	@rm -rf .venv
	@rm -rf web/node_modules
	@rm -rf web/.next
	@docker-compose down -v 2>/dev/null || true
	@echo "✅ Cleaned"
