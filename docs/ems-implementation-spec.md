# EMS Implementation Specification

> **Execution Management System** for deterministic execution simulation, fill generation, slippage decomposition, and execution analysis in Instant.

---

## 1. Overview

The EMS enables advisors to:
- Receive orders from OMS and simulate executions deterministically
- Generate fills with realistic clip sizing and timing
- Decompose slippage into components (bucket spread, size impact, limit constraints)
- Track execution status and fill history
- Analyze execution quality and explainability
- Handle settlement booking

**Core Principle**: EMS owns execution logic (fills, routing, slippage decomposition). Orders are created/managed by OMS; EMS receives approved orders and simulates deterministic execution based on liquidity profiles and market data.

**Hard Boundary**: EMS does NOT own order creation, editing economic terms, or approvals (that's OMS). EMS receives orders and executes them.

---

## 2. Core Features

### 2.1 Execution Tape (`/app/ems/executions`)

**Purpose**: Main view for viewing all executions and fills.

#### Table Columns
- **Order ID**: Link to OMS order detail
- **Execution ID**: Unique execution identifier
- **Instrument**: CUSIP, description (link to instrument detail)
- **Side**: BUY or SELL
- **Quantity**: Total executed quantity
- **Avg Fill Price**: Weighted average fill price
- **Slippage**: Total slippage (basis points or dollars)
- **Execution Status**: PENDING, PARTIALLY_FILLED, FILLED, SETTLED
- **Timestamp**: Execution start time
- **As-of Date**: Market date for pricing

#### Filters
- **Order ID**: Filter by specific order
- **Execution Status**: Filter by execution state
- **Date Range**: Filter by execution timestamp
- **Instrument**: Filter by CUSIP
- **Side**: Filter by BUY/SELL

#### Grouping Options
- Group by Order (optional)
- Group by Instrument (optional)
- Group by Date (optional)

#### Actions
- **View Detail**: Navigate to execution detail page
- **View Order**: Navigate to OMS order detail
- **Export**: Export execution data (CSV)

#### Status Indicators
- **Blue**: Pending/In-progress executions
- **Green**: Completed executions (FILLED, SETTLED)
- **Yellow**: Partial fills

---

### 2.2 Execution Detail (`/app/ems/executions/:id`)

**Purpose**: Detailed view of a single execution with full fill analysis and slippage decomposition.

#### Execution Information Card
- **Execution ID**: Unique execution identifier
- **Order ID**: Link to OMS order detail
- **Order Information**: Side, quantity, order type, limit price (if applicable)
- **Account**: Account name with link to account detail
- **Household**: Household name with link to household detail
- **Instrument**: CUSIP, description, maturity, coupon, link to instrument detail
- **Execution Status**: Current execution state
- **As-of Date**: Market date for pricing inputs
- **Execution Start Time**: When execution was requested
- **Completion Time**: When execution was fully filled (if applicable)

#### Fill Details
- **Fills Table**: List of all fills (clips)
  - Fill ID, clip index
  - Quantity filled
  - Fill price
  - Timestamp
  - Cumulative quantity
- **Fill Summary**:
  - Total quantity filled
  - Weighted average fill price
  - Number of clips
  - Time to fill (duration)
- **Fill Visualization** (optional):
  - Timeline chart showing fill progression
  - Price vs. time chart

#### Slippage Decomposition
- **Total Slippage**: Overall slippage (basis points or dollars)
- **Component Breakdown**:
  - **Bucket Spread**: Spread component based on maturity bucket
    - Bucket name (0-2y, 2-5y, 5-10y, 10-20y, 20y+)
    - Spread (basis points)
  - **Size Impact**: Impact from trade size
    - Size impact function applied
    - Impact amount (basis points or dollars)
  - **Limit Constraint**: Slippage from limit price constraints (if LIMIT order)
    - Constraint type
    - Impact amount
- **Slippage Visualization**:
  - Stacked bar chart showing component breakdown
  - Percentage contribution of each component

#### Deterministic Inputs Display
- **Liquidity Profile**:
  - Maturity bucket
  - Spread (basis points)
  - Max clip size
  - Delay per clip (milliseconds)
  - Size impact function parameters
- **Pricing Inputs**:
  - Baseline evaluated mid price
  - Evaluated price source (as-of date, curve source)
  - Yield curve inputs
- **Model Version**: Execution model version used
- **Algorithm Parameters**:
  - Clip sizing logic
  - Delay model
  - Side impact (buy pays up, sell hits down)

#### Explanation Text
- Human-readable explanation of execution:
  - How fills were generated
  - Why specific clip sizes were used
  - How slippage components were calculated
  - Any constraints or adjustments applied
  - Deterministic reasoning

#### Execution Timeline
- Chronological list of execution events:
  - ExecutionRequested
  - ExecutionSimulated
  - FillGenerated (per clip)
  - OrderPartiallyFilled (if applicable)
  - OrderFullyFilled
  - SettlementBooked (if applicable)
- Each event shows: timestamp, event details

#### Actions (Context-dependent)
- **FILLED**: View Settlement, View Order in OMS
- **SETTLED**: View Settlement Details, View Order in OMS
- **PARTIALLY_FILLED**: Cancel Remaining (sends cancellation to OMS), View Order in OMS

---

### 2.3 Execution Simulation

**Purpose**: Deterministic execution simulation algorithm.

#### Simulation Inputs
- **Order**: From OMS (order ID, quantity, side, order type, limit price/curve spread)
- **Instrument**: Instrument details (CUSIP, maturity bucket, cashflows)
- **Market Data**: Evaluated pricing (as-of date, yield curve, baseline mid price)
- **Liquidity Profile**: Bucket-specific parameters (spread, max clip, delay, size impact function)

#### Simulation Algorithm
1. **Baseline Price Resolution**:
   - Fetch evaluated mid price for instrument (from pricing service)
   - Use as-of date from order/execution request
   - Store baseline price for slippage calculation

2. **Bucket Spread Calculation**:
   - Determine instrument's maturity bucket
   - Retrieve bucket spread from liquidity profile
   - Apply spread component to baseline

3. **Clip Generation**:
   - Determine max clip size from liquidity profile
   - Split order quantity into clips (clip size ≤ max clip)
   - Assign clip index (0, 1, 2, ...)
   - Calculate clip timestamps: base time + (clipIndex × delayMsPerClip)

4. **Fill Price Calculation** (per clip):
   - Start with baseline mid price
   - Add bucket spread component
   - Calculate size impact deterministically (apply size impact function)
   - Apply side impact:
     - BUY: Pay up (add spread/impact)
     - SELL: Hit down (subtract spread/impact)
   - Apply limit/curve-relative constraints:
     - If LIMIT order: Fill price cannot exceed limit price (may reduce filled quantity)
     - If CURVE_RELATIVE order: Apply curve spread constraint
   - Final fill price = adjusted price per clip

5. **Slippage Calculation**:
   - For each clip: slippage = fillPrice - baselineMidPrice
   - Aggregate slippage components:
     - Bucket spread component (from liquidity profile)
     - Size impact component (from size impact function)
     - Limit constraint component (if applicable)
   - Total slippage = sum of all components

6. **Event Emission**:
   - Emit `ExecutionSimulated` with full decomposition
   - Emit `FillGenerated` for each clip
   - Emit `OrderPartiallyFilled` or `OrderFullyFilled` based on total quantity

#### Determinism Requirements
- Same inputs → same outputs (no randomness)
- Fixed solver seed if any random number generation needed
- Stable tie-breakers
- Deterministic timestamp generation (based on clip index, not system time)
- Reproducible slippage calculations

#### Explainability Contract
Every `ExecutionSimulated` event must include:
- `modelVersion`: Execution model version
- `bucket`: Maturity bucket used
- `spreadBp`: Bucket spread (basis points)
- `maxClip`: Maximum clip size
- `delayModel`: Delay model parameters
- `sizeImpactInputs`: Inputs to size impact function
- `sizeImpactOutputs`: Outputs from size impact function
- `slippageBreakdown`: Complete slippage decomposition
- `explanation`: Human-readable explanation

---

### 2.4 Settlement Tracking

**Purpose**: Track settlement status for filled executions.

#### Settlement Information
- **Settlement Status**: PENDING, SETTLED
- **Settlement Date**: Target settlement date (T+1 for UST)
- **Settled Date**: Actual settlement date (if settled)
- **Settlement Amount**: Total cash amount (for buys: cost, for sells: proceeds)
- **Settlement Details**: Per-fill settlement amounts

#### Settlement Booking
- When order is fully filled, settlement is scheduled
- Settlement date calculated as T+1 (business days)
- `SettlementBooked` event emitted when settlement is recorded
- Settlement updates account cash (PMS integration)

---

### 2.5 Execution Status & Lifecycle

#### Status States
- **PENDING**: Execution requested, simulation not yet started
- **SIMULATING**: Execution simulation in progress
- **PARTIALLY_FILLED**: Some fills generated, order not fully filled
- **FILLED**: All fills generated, order fully executed
- **SETTLED**: Settlement booked, execution complete
- **CANCELLED**: Execution cancelled (remaining quantity)

#### State Transitions
```
PENDING → SIMULATING → PARTIALLY_FILLED → FILLED → SETTLED
                    ↓
                CANCELLED
```

#### Status Updates
- Status updates come from events:
  - `ExecutionRequested` → PENDING
  - `ExecutionSimulated` → SIMULATING
  - `FillGenerated` → PARTIALLY_FILLED or FILLED
  - `OrderFullyFilled` → FILLED
  - `SettlementBooked` → SETTLED
  - Order cancellation (from OMS) → CANCELLED

---

## 3. Data Models

### 3.1 Execution (Prisma model)
- `executionId` (UUID, PK)
- `orderId` (UUID, FK to Order)
- `accountId` (UUID, FK to Account, denormalized from order)
- `instrumentId` (UUID, FK to Instrument, or CUSIP string)
- `side` (enum: BUY, SELL)
- `totalQuantity` (decimal, total order quantity)
- `filledQuantity` (decimal, total filled quantity)
- `avgFillPrice` (decimal, weighted average fill price)
- `status` (enum: PENDING, SIMULATING, PARTIALLY_FILLED, FILLED, SETTLED, CANCELLED)
- `asOfDate` (date, market date for pricing)
- `executionStartTime` (timestamp)
- `executionEndTime` (timestamp, nullable)
- `settlementDate` (date, nullable, T+1 from fill date)
- `settledDate` (date, nullable, actual settlement date)
- `slippageTotal` (decimal, total slippage)
- `slippageBreakdown` (JSON, component breakdown)
- `deterministicInputs` (JSON, model version, liquidity profile, pricing inputs)
- `explanation` (string, human-readable explanation)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Relations**:
- Order (many-to-one)
- Account (many-to-one, via order)
- Instrument (many-to-one, via CUSIP or instrumentId)

### 3.2 Fill (Prisma model)
- `fillId` (UUID, PK)
- `executionId` (UUID, FK to Execution)
- `clipIndex` (integer, 0-based clip index)
- `quantity` (decimal, fill quantity)
- `price` (decimal, fill price)
- `timestamp` (timestamp, deterministic fill timestamp)
- `slippage` (decimal, slippage for this fill)
- `createdAt` (timestamp)

**Relations**:
- Execution (many-to-one)

### 3.3 Slippage Breakdown (JSON structure)
Stored in `Execution.slippageBreakdown`:
- `total` (decimal, total slippage)
- `bucketSpread` (decimal, bucket spread component)
- `sizeImpact` (decimal, size impact component)
- `limitConstraint` (decimal, limit constraint component, nullable)
- `components` (array of component objects):
  - `type` (string: "BUCKET_SPREAD", "SIZE_IMPACT", "LIMIT_CONSTRAINT")
  - `amount` (decimal)
  - `percentage` (decimal, percentage of total)

### 3.4 Deterministic Inputs (JSON structure)
Stored in `Execution.deterministicInputs`:
- `modelVersion` (string)
- `bucket` (string, maturity bucket)
- `spreadBp` (decimal, bucket spread in basis points)
- `maxClip` (decimal, maximum clip size)
- `delayMsPerClip` (integer, delay per clip in milliseconds)
- `sizeImpactFunction` (string, function type/name)
- `sizeImpactParameters` (JSON, function parameters)
- `baselineMidPrice` (decimal)
- `pricingAsOfDate` (date)
- `curveSource` (string, yield curve source metadata)

### 3.5 Execution Event (computed from event store)
Executions have associated events in the event timeline:
- `ExecutionRequested`
- `ExecutionSimulated`
- `FillGenerated` (one per clip)
- `OrderPartiallyFilled`
- `OrderFullyFilled`
- `SettlementBooked`
- `ExecutionCancelled`

---

## 4. User Flows

### 4.1 Receive Order and Simulate Execution
1. Order is sent from OMS (`OrderSentToEMS` event)
2. EMS receives order (via event or API)
3. EMS validates order (status is APPROVED, not already executed)
4. EMS triggers execution simulation:
   - Fetches order details
   - Fetches instrument details
   - Fetches evaluated pricing (as-of date)
   - Retrieves liquidity profile for instrument's maturity bucket
5. EMS runs deterministic simulation algorithm
6. EMS emits events:
   - `ExecutionRequested`
   - `ExecutionSimulated` (with full decomposition)
   - `FillGenerated` (per clip)
   - `OrderPartiallyFilled` or `OrderFullyFilled`
7. Execution status updates in UI
8. User can view execution detail with slippage decomposition

### 4.2 View Execution Tape
1. Navigate to `/app/ems/executions`
2. View execution tape table (all executions)
3. Apply filters (order ID, status, date range, instrument)
4. Group executions (by order, instrument, date)
5. Click execution → navigate to execution detail

### 4.3 View Execution Detail
1. Navigate to execution detail (`/app/ems/executions/:id`)
2. Review execution information (order, instrument, account)
3. Review fill details (clips, prices, timestamps)
4. Review slippage decomposition:
   - View total slippage
   - View component breakdown (bucket spread, size impact, limit constraint)
   - View slippage visualization
5. Review deterministic inputs:
   - Liquidity profile parameters
   - Pricing inputs
   - Model version
6. Read explanation text
7. Review execution timeline (events)
8. Click links to view order in OMS, instrument detail, account detail

### 4.4 Analyze Execution Quality
1. Navigate to execution detail
2. Compare fill prices to baseline mid price
3. Analyze slippage components:
   - Identify largest slippage component
   - Understand why slippage occurred
4. Review clip sizing and timing
5. Assess execution efficiency (time to fill, number of clips)
6. Compare to similar executions (same instrument, similar size)

### 4.5 Track Settlement
1. Execution completes (FILLED status)
2. Settlement scheduled (T+1 from fill date)
3. View settlement information on execution detail
4. Settlement is booked (`SettlementBooked` event)
5. Execution status updates to SETTLED
6. Account cash updated (PMS integration)

---

## 5. Technical Requirements

### 5.1 Event Sourcing
- All execution state changes emit events
- Events are source of truth for execution lifecycle
- Execution projection built from events
- Event timeline reconstructable from event store

### 5.2 Deterministic Simulation
- **Reproducibility**: Same inputs → same outputs
- **No Randomness**: All calculations must be deterministic
- **Fixed Seeds**: Use fixed seeds for any random number generation (if needed)
- **Stable Algorithms**: Use stable algorithms for clip sizing, price calculations
- **Deterministic Timestamps**: Calculate timestamps based on clip index, not system time

### 5.3 Pricing Integration
- Fetch evaluated pricing from pricing service
- Use as-of date from order/execution request
- Baseline mid price must be consistent (same as-of date → same price)
- Store pricing inputs for explainability

### 5.4 Liquidity Profile Management
- Liquidity profiles configured per maturity bucket
- Profile parameters:
  - Spread (basis points)
  - Max clip size
  - Delay per clip (milliseconds)
  - Size impact function (type and parameters)
- Profiles must be versioned and stored for explainability

### 5.5 Slippage Calculation
- Slippage = fillPrice - baselineMidPrice
- Decompose into components:
  - Bucket spread (from liquidity profile)
  - Size impact (from size impact function)
  - Limit constraint (if LIMIT order)
- Store component breakdown for analysis

### 5.6 Order Type Handling
- **MARKET**: No price constraints, full quantity filled
- **LIMIT**: Fill price cannot exceed limit (for buys) or go below limit (for sells)
  - May result in partial fills if limit is not marketable
- **CURVE_RELATIVE**: Apply curve spread constraint
  - Fill price relative to curve spread

### 5.7 Side Impact
- **BUY**: Pay up (add spread/impact to baseline)
- **SELL**: Hit down (subtract spread/impact from baseline)
- Side impact applied deterministically

### 5.8 Performance
- Execution simulation must complete < 1s for typical order (< 10 clips)
- Execution tape must load < 2s (with filters)
- Execution detail must load < 1s
- Efficient querying of fills and execution data

### 5.9 Explainability
- Every execution must have human-readable explanation
- Explanation must cover:
  - How fills were generated
  - Clip sizing logic
  - Slippage component breakdown
  - Any constraints or adjustments
- Explanation stored in execution record and events

---

## 6. Integration Points

### 6.1 OMS Integration
- Receives orders from OMS (`OrderSentToEMS` event)
- Orders reference account, instrument, quantity, side, order type
- EMS emits fill events that update order state in OMS:
  - `OrderPartiallyFilled`
  - `OrderFullyFilled`
- EMS can cancel remaining quantity (sends cancellation event to OMS)

### 6.2 Pricing Service Integration
- Fetches evaluated pricing for instruments
- Requires as-of date (market date)
- Returns baseline mid price, yield, duration, DV01
- Pricing inputs stored for explainability

### 6.3 Market Data Integration
- Instrument lookup (CUSIP → instrument details)
- Maturity bucket determination (from instrument maturity date)
- Yield curve data (for CURVE_RELATIVE orders)

### 6.4 PMS Integration
- Settlement booking updates account cash
- Fills update account positions (via events)
- Execution detail shows account/household context

### 6.5 Compliance Integration
- Pre-execution compliance checks (if required)
- Compliance results may block execution (hard gate)
- Execution detail shows compliance status (if applicable)

---

## 7. Mock Data Requirements

For initial development, provide:
- 15-20 sample executions in various states
- Distribution across states:
  - 2-3 PENDING
  - 1-2 SIMULATING
  - 3-5 PARTIALLY_FILLED
  - 5-8 FILLED
  - 3-5 SETTLED
  - 1-2 CANCELLED
- Executions distributed across multiple orders/accounts
- Mix of order types (MARKET, LIMIT, CURVE_RELATIVE)
- Mix of sides (BUY, SELL)
- Sample fills (2-5 fills per execution, varying clip sizes)
- Sample slippage breakdowns (varying component contributions)
- Sample deterministic inputs (liquidity profiles, pricing inputs)
- Execution events timeline for sample executions

---

## 8. UI/UX Considerations

### 8.1 Execution Tape
- Virtual scrolling for large execution sets
- Sortable columns
- Persistent filter state (URL params or local storage)
- Export functionality (CSV export of filtered view)
- Color-coded status indicators

### 8.2 Execution Detail
- Clear visual status indicator (badge/icon)
- Slippage decomposition prominently displayed
- Fill details table with clear visualization
- Deterministic inputs clearly labeled
- Explanation text easy to read
- Execution timeline with expandable details
- Links to related entities (order, instrument, account)

### 8.3 Slippage Visualization
- Stacked bar chart showing component breakdown
- Percentage labels on components
- Tooltips with detailed breakdown
- Comparison to baseline mid price

### 8.4 Fill Visualization (optional)
- Timeline chart showing fill progression
- Price vs. time chart
- Clip size indicators

### 8.5 State Management
- Optimistic updates for status changes
- Error handling and rollback
- Loading states for simulation (if async)
- Real-time updates (if WebSocket integration)

---

## 9. Edge Cases & Error Handling

### 9.1 Pricing Service Unavailable
- Queue execution for retry
- Show error message
- Prevent execution simulation until pricing available

### 9.2 Invalid Order State
- Reject execution if order not in APPROVED state
- Show error message
- Log rejection event

### 9.3 Limit Order Not Marketable
- Partial fill if limit price not marketable
- Reduce filled quantity to zero if limit cannot be met
- Emit event explaining why order was not fully filled

### 9.4 Curve-Relative Order Constraints
- Apply curve spread constraint
- May result in partial fills if constraint cannot be met
- Emit event explaining constraint application

### 9.5 Simulation Errors
- Catch and handle simulation algorithm errors
- Emit error event
- Show error message in UI
- Prevent invalid execution states

### 9.6 Duplicate Execution Requests
- Idempotency: Same order should not be executed twice
- Check if execution already exists for order
- Reject duplicate execution request

---

## 10. Future Enhancements (Out of Scope)

- Real-time execution streaming (WebSocket updates)
- Advanced routing policies (multiple venues, smart order routing)
- Execution quality analytics (slippage trends, fill analysis)
- Execution cost analysis (TCA - Transaction Cost Analysis)
- Venue selection (if multiple execution venues)
- Order splitting strategies (TWAP, VWAP, implementation shortfall)
- Market impact modeling (advanced size impact functions)
- Real-time market data integration (for live trading, out of scope for demo)

---

