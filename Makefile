.PHONY: dev install-tui migrate migrate-deploy migrate-status prisma-generate

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
