# Instant Trading System - Quickstart Guide

## Prerequisites

- PostgreSQL database (via Supabase)
- Go 1.25+
- Node.js/Bun
- Python 3.14+ (for AI agent)

## Environment Setup

1. Copy `.env.example` to `.env` in the root directory
2. Fill in your Supabase credentials:
   ```
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   NEXT_PUBLIC_SUPABASE_URL="..."
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="..."
   SUPABASE_SERVICE_ROLE_KEY="..."
   ```

## Database Setup

Run migrations to create all tables:

```bash
make migrate
```

This will create:

- `events` table (event store)
- `orders` table (OMS projection)
- `instruments` table (market data)
- `yield_curves` table (pricing)
- `accounts`, `households` tables (PMS)
- All supporting tables and indexes

## Running the Services

### Option 1: Run All Services (Recommended)

```bash
make dev
```

This starts the TUI dashboard that orchestrates all services.

### Option 2: Run Services Manually

#### 1. Backend API (Go)

Terminal 1:

```bash
cd /Users/iankorovinsky/Projects/instant
go run services/api/main.go
```

The API will:

- Initialize EventStore and EventBus
- Start OMS Projection Worker
- Start HTTP server on port 8080

You should see:

```
Initializing EventStore...
EventStore initialized successfully
Initializing EventBus...
EventBus initialized successfully
Initializing OMS Service...
OMS Service initialized successfully
Initializing OMS Handlers...
OMS Handlers initialized successfully
Initializing OMS Projection Worker...
OMS Projection Worker started
Starting server on port 8080
```

#### 2. Frontend (Next.js)

Terminal 2:

```bash
cd client
bun install
bun run dev
```

Frontend will start on port 3000.

#### 3. AI Agent (Optional - Python)

Terminal 3:

```bash
cd agent
uv run fastapi dev
```

Agent will start on port 8000.

## Testing the Integration

### Automated Test (Recommended)

```bash
make test
```

This will:
1. Seed test data (accounts, instruments)
2. Create orders via API
3. Verify projection worker processed events
4. Query blotter and events
5. Test bulk operations

### Manual Testing

#### 1. Check API Health

```bash
curl http://localhost:8080/health
# Should return: {"status":"healthy"}
```

### 2. Create a Test Order

```bash
curl -X POST http://localhost:8080/api/oms/orders \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "test-account-id",
    "instrumentId": "912810TM6",
    "side": "BUY",
    "quantity": 100000,
    "orderType": "MARKET",
    "timeInForce": "DAY",
    "createdBy": "test-user"
  }'
```

### 3. View Orders (Blotter)

```bash
curl http://localhost:8080/api/views/blotter
```

### 4. View Events

```bash
curl "http://localhost:8080/api/events?eventType=OrderCreated"
```

### 5. Access Frontend

Open http://localhost:3000 in your browser and:

1. Log in with Supabase auth
2. Navigate to OMS → Orders
3. You should be able to see the order you created

## Architecture Flow

```
User Action (Frontend)
    ↓
API Request (HTTP)
    ↓
Command Handler
    ↓
OMS Service
    ↓
Emit Event → EventStore (PostgreSQL)
    ↓
Publish to EventBus
    ↓
Projection Worker (listening)
    ↓
Update Read Model (orders table)
    ↓
Frontend Queries Blotter
    ↓
Display Updated Data
```
