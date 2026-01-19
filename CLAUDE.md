# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Instant is a demo-grade single-tenant trading system for US Treasuries (Notes) with event-sourced architecture, deterministic execution simulation, and AI copilot. The event log is the system of record; all UI screens are projections.

## Development Commands

### Multi-Service Development (Recommended)
```bash
make dev                    # Starts TUI dashboard to orchestrate all services
make migrate                # Run database migrations (auto-generates timestamped migration name)
make migrate-deploy         # Apply existing migrations (production/CI)
make migrate-status         # Check migration status
make prisma-generate        # Generate Prisma client from schema
make data                   # Ingest market data (securities)
```

### Frontend (Next.js) - in client/
```bash
bun install                 # Install dependencies
bun run dev                 # Development server (port 3000)
bun run build               # Production build
bun run lint                # ESLint
bun run prisma:generate     # Generate Prisma client
bun run prisma:migrate      # Run database migrations
```

### Backend API (Go) - in services/api/
```bash
go run main.go              # Start API server (port 8080)
```

### Temporal Worker - in services/temporal/
```bash
go run worker/main.go       # Start Temporal worker
go test ./tests/...         # Run workflow tests
```

### AI Agent (Python) - in agent/
```bash
uv run fastapi dev          # Development server (port 8000)
```

## Architecture

### Event Sourcing + CQRS Pattern
- **EventStore** (PostgreSQL/Supabase): Immutable append-only log, source of truth
- **Command Service**: Validates commands → emits events
- **Projection Workers**: Consume events → build read models
- **Query Service**: Serves projections to UI
- **Time Travel**: Rebuild projections at any historical `asOfDate`

### Domain Services (module boundaries)
- **OMS** (Order Management): Order capture, lifecycle, approvals, compliance gates. Does NOT handle fills/execution.
- **EMS** (Execution Management): Deterministic simulation, fills, slippage decomposition. Does NOT create/edit orders.
- **PMS** (Portfolio Management): Holdings, targets, optimization, proposals
- **Compliance**: Rule evaluation at pre-trade, pre-exec, post-trade checkpoints
- **Market Data**: Instrument master (350+ UST notes), yield curve ingestion
- **Pricing**: Evaluated pricing/risk from curves and cashflows

### Tech Stack
- **Frontend**: TypeScript, Next.js 15, React 19, Radix UI + shadcn/ui, Tailwind CSS
- **Backend**: Go 1.25, Gin framework
- **AI Agent**: Python 3.14+, FastAPI
- **Workflows**: Temporal (self-hosted)
- **Database**: PostgreSQL via Supabase
- **Package Managers**: bun (client), uv (agent), go modules (services)
- **Tooling**: Use `bun` and `bunx` wherever possible instead of npm/npx/node.
- **UI Components**: Use shadcn/ui components from `client/components/ui/` for all UI work. Add new components via `bunx shadcn@latest add [component]` when needed.
- **Database Schema**: Use Prisma for adding tables and types to easily manage migrations. Schema files are in `client/prisma/schema/`. Run `make migrate` after schema changes.

## Key Directories

```
client/                   # Next.js frontend
  app/app/               # App Router pages (oms/, ems/, pms/, compliance/, marketdata/)
  components/ui/         # shadcn/ui components
  lib/*/types.ts         # Domain type definitions
  lib/*/mock-data.ts     # Mock data for development
services/api/            # Go API (Gin)
services/temporal/       # Temporal workflows & workers
agent/                   # Python AI Copilot (FastAPI)
data/                    # Market data ingestion scripts
docs/                    # Technical specifications
infra/                   # Infrastructure configs (Temporal, TUI)
```

## Core Principles

1. **Event-first**: Every meaningful change is an immutable event
2. **Deterministic**: Same inputs → same outputs (pricing, optimization, execution sim)
3. **Explainable**: Compliance decisions, fill prices, pricing inputs all have explanations
4. **AI Copilot is propose-only**: Never emits events directly; requires explicit user approval
5. **MVP-first**: Prioritize working, simplified solutions over fully functioning, proper solutions when encountering errors or complexity. Ship working code quickly rather than perfect implementations.

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` / `DIRECT_URL` - Supabase PostgreSQL connection
- Supabase credentials for auth

## API Patterns

- Commands: `POST /commands` with `{commandType, payload, correlationId}`
- Queries: `GET /views/{projection}?asOfDate=YYYY-MM-DD`
- Events: `GET /events?aggregateType=...&aggregateId=...`

## Quick Start

See [`QUICKSTART.md`](./QUICKSTART.md) for detailed setup and testing instructions.

**TL;DR:**
```bash
make migrate           # Run database migrations
make dev               # Start all services (or run manually)
./test-integration.sh  # Test the OMS integration
```

## Implemented Systems

### OMS (Order Management System) - ✅ COMPLETE & INTEGRATED

**Backend (Go):**
- `services/api/oms/` - Service implementation
  - `types.go` - Order types, enums, request/response models
  - `service.go` - Order lifecycle methods (Create, Amend, Approve, Cancel, SendToEMS)
- `services/api/handlers/oms_commands.go` - Command handlers (REST API endpoints)
- `services/api/handlers/oms_queries.go` - Query handlers (Blotter, Order detail, Batch orders)
- `services/api/projections/oms_projection.go` - Event consumer that builds Order read model

**Database:**
- `client/prisma/schema/oms.prisma` - Order model with full lifecycle state machine

**Frontend (TypeScript):**
- `client/lib/api/oms.ts` - OMS API client
- `client/lib/hooks/use-oms.ts` - React Query hooks for OMS operations
- `client/components/providers/query-provider.tsx` - React Query provider

**Events Emitted:**
- `OrderCreated`, `OrderAmended`, `OrderApprovalRequested`, `OrderApproved`, `OrderRejected`
- `OrderSentToEMS`, `OrderPartiallyFilled`, `OrderFullyFilled`, `OrderCancelled`
- `RuleEvaluated`, `OrderBlockedByCompliance`

**API Endpoints:**
```
POST   /api/oms/orders              # Create order
POST   /api/oms/orders/bulk         # Bulk create orders
PATCH  /api/oms/orders/:id/amend    # Amend order
POST   /api/oms/orders/:id/approve  # Approve order
POST   /api/oms/orders/:id/cancel   # Cancel order
POST   /api/oms/orders/:id/send-to-ems  # Send to EMS
GET    /api/views/blotter            # Get blotter (filterable)
GET    /api/views/orders/:id         # Get order detail with events
GET    /api/views/orders/batch/:batchId  # Get batch orders
```
