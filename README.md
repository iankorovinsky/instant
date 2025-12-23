# Instant

Demo-grade single-tenant trading system for **US Treasuries** with event-sourced architecture, deterministic execution simulation, and AI Copilot (propose-only).

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