# Instant

Event-sourced trading system for US Treasuries with AI copilot.

## Quick Start

```bash
make install          # Install all dependencies
cp .env.example .env  # Configure environment
make migrate          # Run database migrations
make dev              # Start all services
```

Open [localhost:3000](http://localhost:3000) in your browser.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js :3000)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                   ┌─────────────────┼─────────────────┐
                   ▼                 ▼                 ▼
        ┌──────────────────┐ ┌──────────────┐ ┌────────────────┐
        │  Go API (:8080)  │ │ AI Copilot   │ │    Temporal    │
        │                  │ │   (:8000)    │ │    (:7233)     │
        │ ┌────┐ ┌─────┐   │ │              │ │                │
        │ │OMS │ │ EMS │   │ │   Cohere     │ │   Workflows    │
        │ └────┘ └─────┘   │ │     LLM      │ │                │
        │ ┌────┐ ┌─────┐   │ │              │ │                │
        │ │PMS │ │Comp.│   │ └──────────────┘ └────────────────┘
        │ └────┘ └─────┘   │
        └──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PostgreSQL (Supabase)                             │
│                                                                         │
│      Event Store (immutable)  →  Projections  →  Read Models           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Projection Workers & Event Queue

The system uses an event-sourced architecture with CQRS (Command Query Responsibility Segregation). All state changes are captured as immutable events in the event store, and projection workers build optimized read models for queries.

**Event Flow:**
1. **Commands** are processed and validated
2. **Events** are appended to the event store (PostgreSQL) as the single source of truth
3. **Event Bus** (in-process pub/sub) publishes events to all subscribers
4. **Projection Workers** subscribe to events and update read models in real-time

**Projection Workers:**
- **OMS Projection**: Builds Order read models from order lifecycle events
- **EMS Projection**: Builds Execution and Fill read models from execution events
- **PMS Projection**: Builds Portfolio read models (holdings, targets, proposals) from settlement and target events
- **Compliance Projection**: Builds compliance rule and violation read models

Each worker runs as a background goroutine, subscribes to all events via the event bus, and filters/handles relevant events to update their domain-specific read models. This enables time-travel queries (rebuilding projections at any historical date) and ensures eventual consistency across all read models.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui |
| Backend | Go 1.25, Gin |
| AI Copilot | Python 3.14+, FastAPI, Cohere |
| Workflows | Temporal |
| Database | PostgreSQL (Supabase), Prisma |

## Implementation

[localhost:3000/implementation](http://localhost:3000/implementation)
