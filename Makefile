.PHONY: dev install-tui migrate migrate-deploy migrate-status prisma-generate data test test-integration

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

# Run integration tests
test-integration:
	@chmod +x test-integration.sh
	@./test-integration.sh

# Alias for integration tests
test: test-integration
