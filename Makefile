.PHONY: dev install install-tui install-tools migrate migrate-deploy migrate-status prisma-generate data seed-test-data test test-api test-integration test-agent agent-dev

# Install all dependencies and tools
install:
	@echo "Installing dependencies..."
	@echo "→ Installing Go dependencies..."
	@go mod download
	@echo "→ Installing client dependencies..."
	@cd client && bun install
	@echo "→ Installing TUI dependencies..."
	@cd infra/tui && bun install
	@echo "→ Installing Python agent dependencies..."
	@cd agent && uv sync
	@echo "→ Installing air (hot reload for Go)..."
	@go install github.com/air-verse/air@latest || echo "⚠ Failed to install air (optional)"
	@echo "→ Generating Prisma client..."
	@cd client && npx dotenv-cli -e ../.env -- npx prisma generate 2>/dev/null || echo "⚠ Prisma generate skipped (no .env file yet)"
	@echo ""
	@echo "✓ All dependencies installed!"
	@echo ""
	@echo "Note: Temporal CLI must be installed separately:"
	@echo "  - macOS: brew install temporal"
	@echo "  - Or see: https://docs.temporal.io/cli"

# Install recommended development tools (deprecated - use install)
install-tools: install

# Install TUI dependencies
install-tui:
	@cd infra/tui && bun install

# Run the dev TUI
dev: install-tui
	@cd infra/tui && node run.js

# Run Prisma migration (creates and applies migration with auto-generated name)
migrate:
	@cd client && npx dotenv-cli -e ../.env -- npx prisma migrate dev --name migration_$(shell date +%Y%m%d_%H%M%S)

# Apply existing migrations (production/CI - does not create new migrations)
migrate-deploy:
	@cd client && npx dotenv-cli -e ../.env -- npx prisma migrate deploy

# Generate Prisma client from schema
prisma-generate:
	@cd client && npx dotenv-cli -e ../.env -- npx prisma generate

# Check migration status
migrate-status:
	@cd client && npx dotenv-cli -e ../.env -- npx prisma migrate status

# Ingest market data (securities and yield curves)
data:
	@cd data && python ingest_security_data.py
	@cd data && python ingest_yield_curves_fred.py
	@./data/seed-app.sh

# Seed test data
seed-test-data:
	@echo "Seeding test data..."
	@cd client && npx dotenv-cli -e ../.env -- npx prisma db execute --file ../integration/seed-test-data.sql
	@echo "✓ Test data seeded successfully!"

# Run API tests
test-api:
	@go test ./services/api/...

# Run integration tests (with auto-seed)
test-integration: seed-test-data
	@chmod +x integration/test-integration.sh
	@./integration/test-integration.sh

# Run agent/copilot tests
test-agent:
	@echo "Running agent tests..."
	@cd agent && uv run pytest tests/ -v

# Run agent development server
agent-dev:
	@cd agent && uv run fastapi dev --port 8000

# Run all tests (unit + integration)
test: test-api test-agent test-integration
	@echo "✓ All tests passed!"
