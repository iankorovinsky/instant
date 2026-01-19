# Repository Guidelines

## Project Structure & Module Organization
- `services/`: Go API (`services/api`) and Temporal workflows/activities (`services/temporal`); tests live under `services/temporal/tests`.
- `agent/`: FastAPI copilot service (Python) with `pyproject.toml`.
- `client/`: Next.js app; routes in `client/app`, UI in `client/components`, data helpers in `client/lib`, Prisma in `client/prisma`.
- `data/`: Market data ingestion scripts and source CSVs.
- `infra/`: Temporal systemd service files and a TUI tool.
- `docs/`: Architecture and domain specifications.
- `temporal-worker`: Built worker binary; treat as generated output.

## Build, Test, and Development Commands
- `make dev`: Runs the infra TUI (installs `infra/tui` deps first).
- `make migrate`: Run database migrations.
- `make data`: Ingest market data (securities).
- `cd client && bun install`: Install frontend deps.
- `cd client && bun run dev`: Start Next.js with env from `../.env`.
- `cd client && bun run lint`: Run ESLint checks.
- `cd agent && uv run fastapi dev`: Start the copilot service on `:8000`.
- `go build -o temporal-worker ./services/temporal/worker/`: Build the Temporal worker binary (used by `infra/temporal`).
- Use `bun` and `bunx` wherever possible instead of npm/npx/node.

## Coding Style & Naming Conventions
- Go: format with `gofmt`; keep package names lowercase; tests use `*_test.go`.
- TypeScript/TSX: 2-space indentation; follow `client/eslint.config.mjs`; Tailwind utility classes live in JSX.
- Python: 4-space indentation; keep FastAPI modules flat (see `agent/main.py`).

## UI Components
- Use shadcn/ui components from `client/components/ui/` for all UI work.
- Add new shadcn components via `bunx shadcn@latest add [component]` when needed.

## Database Schema
- Use Prisma for adding tables and types to easily manage migrations.
- Schema files are in `client/prisma/schema/`; run `make migrate` after changes.

## MVP Development Philosophy
- This is an MVP; prioritize working, simplified solutions over fully functioning, proper solutions when encountering errors or complexity.
- Ship working code quickly rather than perfect implementations.

## Testing Guidelines
- Go: `go test ./services/temporal/...` (uses `testify`).
- No dedicated JS/Python test runner is configured; rely on linting and manual verification unless you add tests.

## Commit & Pull Request Guidelines
- Commit messages are short, sentence-case statements (e.g., “Fixed layout”); avoid prefixes unless introducing a convention.
- PRs should include a concise summary, testing notes, and screenshots for UI changes; link relevant specs in `docs/` when applicable.

## Security & Configuration Tips
- Copy `.env.example` to `.env` for local setup; frontend scripts load it via `dotenv -e ../.env`.
- Never commit Supabase keys or data-provider credentials; use `.env` or shell exports.
