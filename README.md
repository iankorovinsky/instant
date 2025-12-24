# Instant

Demo-grade single-tenant trading system for **US Treasuries (Notes)** with event-sourced architecture, deterministic execution simulation, and **AI copilot**.

**Core principle**: The event log is the system of record; all UI screens are projections.

## Architecture

Event-sourced CQRS system:
- **EventStore**: Immutable append-only log (source of truth)
- **Command Service**: Validates commands → emits events
- **Projection Workers**: Build read models from events
- **Query Service**: Serves projections to UI
- **Time-travel**: Rebuild projections at any historical `asOfDate`

## Core Systems

- **OMS** (Order Management): Order capture, lifecycle, approvals, compliance gates
- **EMS** (Execution Management): Deterministic execution simulation, fills, slippage decomposition
- **PMS** (Portfolio Management): Holdings, targets, optimization, proposals
- **Compliance**: Rule authoring & evaluation (pre-trade, pre-exec, post-trade)
- **Market Data + Pricing**: Instrument master (350+ UST notes), yield curve ingestion, evaluated pricing/risk
- **AI Copilot**: Natural language → draft command plan → explicit user approval

## Tech Stack

- **Frontend**: Typescript (Next.js)
- **Backend**: Go (Gin)
- **AI Agent**: Python (FastAPI)
- **Workflows**: Temporal w/ Go (Self-Hosted Temporal Server on Old PC)
- **Event Store**: Postgres (Supabase)
- **Market Data**: FRED API, Financial Data Provider

## Services Required

### Infrastructure
1. **Postgres (Supabase)** - Event store + read store (projections)
2. **Temporal Server** - Workflow orchestration (self-hosted)

### Application Services
3. **Backend API (Go/Gin)** - Command service, query service, domain services:
   - **OMS Service** - Order Management: captures orders (single/bulk), manages lifecycle (draft → approval → sent), handles amendments/cancels, initiates compliance checks (pre-trade), sends eligible orders to EMS. Does NOT handle fills or execution logic.
   - **EMS Service** - Execution Management: deterministic execution simulation, generates fills with clip sizing/delays, computes slippage decomposition (bucket spread, size impact, limit constraints), marks order fill state. Does NOT create/edit order economic terms.
   - **PMS Service** - Portfolio Management: tracks holdings/cash/positions, manages portfolio targets (duration, bucket weights), runs optimization to generate trade proposals, computes portfolio analytics (duration, DV01).
   - **Compliance Service** - Rule evaluation: evaluates rules at pre-trade, pre-execution, and post-trade checkpoints. Emits warnings/blocks with explanations. Rules stored as data (DSL), not code.
   - **Pricing Service** - Evaluated pricing: computes clean/dirty prices, accrued interest, yield, duration, DV01 from yield curves and instrument cashflows. All pricing labeled as "Evaluated" with as-of date.
   - **Market Data Service** - Instrument master and yield curves: serves UST instrument data and daily yield curve data (par yields by tenor), tracks as-of dates for time-travel.
4. **Projection Workers** - Build read models from events: consumes events from event bus, builds optimized read models (blotter, market grid, account positions, compliance status, proposals, event timeline). Rebuildable for time-travel/replay.
5. **AI Copilot Service (Python/FastAPI)** - Natural language → command plans: accepts natural language requests, returns draft command plans with commands, rationale, assumptions, confidence. User must explicitly approve before execution (propose-only, never emits events directly).
6. **Frontend (Next.js)** - Web UI: displays projections (blotter, market grid, portfolios, compliance), sends commands via API, shows event timelines, time-travel controls, AI copilot interface.

### External APIs (Synced Via Temporal / Scripts)
7. **FRED API** - Daily yield curve data
8. **Financial Data Provider** - Instrument master data (CSV)

## Key Features

- **Deterministic**: Same inputs → same outputs (pricing, optimization, execution sim)
- **Explainable**: Compliance decisions, fill prices, pricing inputs, AI suggestions all have explanations
- **Time-travel**: View system state at any historical market date
- **Event Studio**: Timeline, replay, explainers

## Project Structure

```
├── services/          # Domain services (OMS, EMS, PMS, etc.)
│   └── temporal/      # Temporal workflows & activities
├── data/              # UST Data Ingestion Script
├── infra/             # Infrastructure configs
├── docs/              # Technical specification
└── client/            # Web UI
```

## Getting Started

1. **Set up Temporal**:
   ```bash
   # See infra/temporal/README.md
   ```

2. **Ingest market data**:
   ```bash
   # See data/README.md
   ```
   
3. **Run services**:
   ```bash
   # See services/README.md
   ```

4. **Run agent**:
   ```bash
   # See agent/README.md
   ```

5. **Run client**:
   ```bash
   # See client/README.md
   ```
   
## Scope (Non-Goals)

- ❌ Live trading / dealer connectivity / RFQ
- ❌ Corporates / munis / swaps / multi-currency  
- ❌ Real regulatory reporting
- ❌ Real-time market quotes

## Documentation

See full technical specifications in `docs/`!
