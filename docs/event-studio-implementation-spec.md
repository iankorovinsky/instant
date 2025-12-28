# Event Studio Implementation Specification

> **Event Studio System** for event timeline visualization, time-travel replay, explainability, and projection rebuilding in Instant.

---

## 1. Overview

The Event Studio enables advisors to:
- View event timelines filtered by aggregate, correlation, or time range
- Understand event relationships (correlation and causation chains)
- Replay events to rebuild projections at specific points in time
- Analyze event explanations and payloads
- Trace user actions through correlation IDs
- Understand system state changes through event history

**Core Principle**: The event log is the system of record. All UI screens are projections. Event Studio provides visibility into the source of truth and enables time-travel debugging.

**Time Dimensions**: Event Studio operates with two independent time dimensions:
- **Market time** (`asOfDate`): Affects pricing inputs and what the system "knew"
- **System time**: Event replay cutoff (what events had been processed at that point)

---

## 2. Core Features

### 2.1 Event Timeline (`/app/events/timeline`)

**Purpose**: View and filter events from the event store with timeline visualization.

#### Timeline View Options
- **Vertical Timeline**: Chronological events stacked vertically (default)
- **Horizontal Timeline**: Events laid out horizontally (optional view)
- **List View**: Simple list format (optional, for large datasets)

#### Event Card Display
Each event card shows:
- **Event Type**: Event type name (e.g., `OrderCreated`, `ProposalGenerated`)
- **Timestamp**: `occurredAt` timestamp (formatted, relative time option)
- **Actor**: Actor ID and role
- **Aggregate**: Aggregate type and ID (e.g., `Order: abc-123`)
- **Summary**: Brief payload summary (first few fields)
- **Explanation**: Explanation text (if present, prominently displayed)
- **Badge/Icon**: Visual indicator by event category (OMS, EMS, PMS, Compliance, etc.)

#### Event Card Expansion
Clicking an event card expands to show:
- **Full Payload**: Complete JSON payload (formatted, syntax highlighted)
- **Correlation ID**: Link to view all events with same correlation ID
- **Causation ID**: Link to view the event that caused this event
- **Related Events**: 
  - Events with same correlation ID (same user action/flow)
  - Events caused by this event (causation chain)
  - Events for same aggregate (aggregate lifecycle)
- **Schema Version**: Event schema version
- **Raw Event**: Complete event envelope JSON (optional, for debugging)

#### Filters
- **Aggregate Type**: Filter by aggregate type (Order, Account, Proposal, Execution, Rule, etc.)
- **Aggregate ID**: Filter by specific aggregate ID (e.g., specific order ID)
- **Correlation ID**: Filter by correlation ID (view all events in a user action flow)
- **Event Type**: Filter by specific event type (e.g., `OrderCreated`, `ProposalGenerated`)
- **Module/Category**: Filter by module (OMS, EMS, PMS, Compliance, Market Data, Pricing)
- **Actor**: Filter by actor ID or role
- **Date Range**: Filter by `occurredAt` timestamp (from/to dates)
- **Has Explanation**: Filter to show only events with explanations
- **Schema Version**: Filter by schema version (optional)

#### Timeline Controls
- **Zoom**: Zoom in/out on timeline (for large time ranges)
- **Auto-scroll**: Auto-scroll to latest events
- **Pagination/Infinite Scroll**: Load events in chunks (for performance)
- **Jump to Date**: Quick navigation to specific date/time
- **Jump to Event**: Search by event ID and jump to it

#### Event Relationships Visualization
- **Correlation Chain**: Visual line/connector showing events with same correlation ID
- **Causation Chain**: Visual line/connector showing cause → effect relationships
- **Aggregate Lifecycle**: Visual flow showing all events for an aggregate over time
- **Collapse/Expand**: Collapse correlation chains to show only first event

#### Actions
- **View Related Events**: Click correlation/causation ID → filter timeline to related events
- **View Aggregate Timeline**: Click aggregate ID → show all events for that aggregate
- **Copy Event ID**: Copy event ID to clipboard
- **Export Events**: Export filtered events to JSON/CSV
- **Link to Entity**: Navigate to entity detail (e.g., order detail, account detail)

---

### 2.2 Event Replay (`/app/events/replay`)

**Purpose**: Time-travel replay interface for rebuilding projections at specific points in time.

#### Time Selection
- **Market Time (asOfDate) Selector**:
  - Date picker for market date
  - Affects pricing inputs (what yield curve was used, what prices were available)
  - Quick options: Today, Yesterday, Last Week, Custom
  - Visual indicator: "Market date: [date]"
  
- **System Time (Replay Cutoff) Selector**:
  - DateTime picker for event replay cutoff
  - Shows "Replay up to: [timestamp]"
  - Events after this timestamp are excluded from replay
  - Default: Current time (all events)

#### Replay Scope
- **Rebuild All Projections**: Rebuild all projections with selected time parameters
- **Rebuild Specific Projection**: Select projection to rebuild:
  - Market Grid View
  - Blotter View
  - Execution Tape View
  - Account Positions View
  - Compliance Status View
  - Proposal View
  - Event Timeline View

#### Replay Execution
- **Rebuild Button**: 
  - Triggers projection rebuild
  - Shows progress indicator
  - Estimated time remaining
- **Rebuild Process**:
  1. Collect all events up to replay cutoff
  2. Apply market date filter (affects pricing queries)
  3. Rebuild projection from scratch (or use snapshot + delta if available)
  4. Display rebuilt projection state
- **Rebuild Status**:
  - In Progress
  - Completed
  - Failed (with error message)

#### Replay Results
- **Projection State Display**: Show projection state as-of replay time
- **Comparison View** (optional): Compare current state vs. replayed state
- **Event Count**: Number of events replayed
- **Time Range**: Events from [first event] to [replay cutoff]
- **Projection Metadata**: Projection version, rebuild timestamp

#### Use Cases
- **Debugging**: "What did the system know at this point in time?"
- **Audit**: "What was the order state when it was approved?"
- **Time-travel Analysis**: "What would the portfolio look like if we used yesterday's prices?"
- **Testing**: Verify projection logic by replaying specific scenarios

---

### 2.3 Event Detail View (`/app/events/:eventId`)

**Purpose**: Detailed view of a single event with full context.

#### Event Information
- **Event ID**: Unique event identifier (UUID)
- **Event Type**: Event type name
- **Timestamp**: `occurredAt` timestamp (absolute and relative)
- **Actor**: Actor ID, role, and metadata
- **Aggregate**: Aggregate type and ID (with link to entity detail)

#### Event Envelope
Complete event envelope structure:
- `eventId` (UUID)
- `eventType` (string)
- `occurredAt` (timestamp)
- `actor` (object: `{actorId, role}`)
- `aggregate` (object: `{type, id}`)
- `correlationId` (UUID, nullable)
- `causationId` (UUID, nullable)
- `payload` (JSON object)
- `explanation` (string, nullable)
- `schemaVersion` (integer)

#### Payload Display
- **Formatted JSON**: Syntax-highlighted JSON payload
- **Structured View**: For common event types, show structured fields (optional)
- **Copy Payload**: Copy payload JSON to clipboard
- **Expand/Collapse**: Expand/collapse nested JSON structures

#### Explanation Display
- **Explanation Text**: Prominently displayed (if present)
- **Formatted**: Readable format with line breaks
- **Context**: When explanation is required (simulation, compliance decisions)

#### Event Relationships
- **Caused By**: Link to causation event (if `causationId` present)
- **Caused**: List of events caused by this event
- **Correlation Chain**: All events with same `correlationId`
- **Aggregate Timeline**: All events for same aggregate
- **Navigation**: Click to navigate to related events

#### Actions
- **View Aggregate**: Navigate to aggregate entity detail (order, account, etc.)
- **View Correlation Chain**: Filter timeline to correlation ID
- **View Causation Chain**: Show cause → effect chain
- **Copy Event**: Copy complete event JSON
- **Export Event**: Export event to JSON file

---

### 2.4 Event Search

**Purpose**: Search for specific events by various criteria.

#### Search Interface
- **Search Bar**: Full-text search across event type, payload, explanation
- **Advanced Search**: Form with multiple criteria:
  - Event ID
  - Event Type
  - Aggregate Type + ID
  - Correlation ID
  - Causation ID
  - Actor
  - Date Range
  - Payload field search (JSON path)

#### Search Results
- **Results List**: Matching events in chronological order
- **Highlight**: Highlight search terms in results
- **Quick Preview**: Hover to preview event details
- **Click to View**: Click result → navigate to event detail or timeline

---

## 3. Data Models

### 3.1 Event Envelope (from EventStore)

The complete event envelope structure:
- `eventId` (UUID, PK)
- `eventType` (string)
- `occurredAt` (timestamp, indexed)
- `actor` (JSON: `{actorId: string, role: string}`)
- `aggregate` (JSON: `{type: string, id: string}`)
- `correlationId` (UUID, nullable, indexed)
- `causationId` (UUID, nullable, indexed)
- `payload` (JSON, typed by eventType)
- `explanation` (string, nullable)
- `schemaVersion` (integer)

**Indexes**:
- `occurredAt` (for time-based queries)
- `aggregate.type + aggregate.id` (for aggregate queries)
- `correlationId` (for correlation chain queries)
- `causationId` (for causation chain queries)
- `eventType` (for event type filtering)

### 3.2 Event Timeline View (projected)

Projected view for efficient timeline queries:
- `eventId` (UUID, PK)
- `eventType` (string)
- `occurredAt` (timestamp)
- `aggregateType` (string, denormalized from aggregate.type)
- `aggregateId` (UUID, denormalized from aggregate.id)
- `correlationId` (UUID, nullable)
- `causationId` (UUID, nullable)
- `actorId` (string, denormalized)
- `actorRole` (string, denormalized)
- `summary` (string, computed from payload)
- `hasExplanation` (boolean)
- `schemaVersion` (integer)

**Relations**:
- Links to full event envelope (for detail view)

### 3.3 Event Categories/Modules

Events categorized by module:
- **Market Data**: `MarketDataCurveIngested`, `InstrumentIngested`, etc.
- **Pricing**: `EvaluatedPriceComputed`, `RiskMetricsComputed`, etc.
- **OMS**: `OrderCreated`, `OrderApproved`, `OrderSentToEMS`, etc.
- **EMS**: `ExecutionRequested`, `FillGenerated`, `OrderFullyFilled`, etc.
- **PMS**: `AccountCreated`, `ProposalGenerated`, `TargetSet`, etc.
- **Compliance**: `RuleEvaluated`, `OrderBlockedByCompliance`, etc.
- **Copilot**: `AIDraftProposed`, `AIDraftApproved`, etc.

---

## 4. User Flows

### 4.1 View Event Timeline
1. Navigate to `/app/events/timeline`
2. View default timeline (all events, most recent first)
3. Apply filters:
   - Select aggregate type (e.g., "Order")
   - Enter aggregate ID (e.g., specific order ID)
   - Select date range
4. View filtered events in timeline
5. Click event card → expand to see full details
6. Click correlation ID → view all events in correlation chain
7. Click aggregate ID → view all events for that aggregate

### 4.2 Trace User Action
1. Navigate to event timeline
2. Find an event of interest (e.g., order creation)
3. Note the correlation ID
4. Click correlation ID or "View Correlation Chain"
5. View all events with same correlation ID
6. See complete user action flow (command → events → side effects)

### 4.3 Replay Events and Rebuild Projection
1. Navigate to `/app/events/replay`
2. Select market date (asOfDate)
3. Select system time (replay cutoff)
4. Select projection to rebuild (e.g., "Account Positions View")
5. Enter aggregate ID (e.g., account ID)
6. Click "Rebuild Projection"
7. View rebuilt projection state
8. Compare with current state (optional)

### 4.4 Debug Event Chain
1. Navigate to event timeline
2. Filter by aggregate (e.g., specific order)
3. View aggregate lifecycle events
4. Click on event with issue → view event detail
5. View explanation (if present)
6. View payload to understand what happened
7. Trace causation chain to see what caused this event
8. View related events to understand context

### 4.5 Export Events for Analysis
1. Navigate to event timeline
2. Apply filters (aggregate, date range, event type)
3. Click "Export Events"
4. Select format (JSON or CSV)
5. Download exported file
6. Use for external analysis or debugging

---

## 5. Technical Requirements

### 5.1 Event Store Queries
- Efficient queries by:
  - Aggregate type + ID
  - Correlation ID
  - Causation ID
  - Date range
  - Event type
- Indexed queries for performance
- Pagination for large result sets
- Stream results for real-time updates (optional)

### 5.2 Event Timeline Projection
- Project events to timeline view format
- Denormalize aggregate/correlation/causation fields for fast filtering
- Compute summaries from payloads
- Update projection as new events arrive

### 5.3 Event Relationships
- Efficient queries for:
  - Correlation chains (all events with same correlation ID)
  - Causation chains (cause → effect relationships)
  - Aggregate lifecycles (all events for aggregate)
- Pre-compute or cache relationships for performance

### 5.4 Time-Travel Replay
- **Option A (Simple)**: Rebuild projections from scratch up to replay cutoff
  - Collect all events up to cutoff
  - Apply market date filter
  - Rebuild projection from events
  - Store rebuilt state (temporary, or cache)
- **Option B (Faster)**: Use projection snapshots + deltas
  - Use snapshot before replay cutoff
  - Apply events between snapshot and cutoff
  - Faster but requires snapshot infrastructure

### 5.5 Performance
- Timeline view must load < 2s (with filters, first page)
- Event detail must load < 500ms
- Replay projection rebuild: < 30s for typical dataset
- Efficient pagination (load more events on scroll)
- Virtual scrolling for large event lists (1000+ events)

### 5.6 Explainability
- Events with explanations prominently display explanation
- Explanation required for:
  - Compliance decisions
  - Execution simulation results
  - Optimization decisions
- Explanation displayed in readable format

---

## 6. Integration Points

### 6.1 Event Store Integration
- Query events from event store
- Support multiple event store backends (Postgres, etc.)
- Efficient event streaming (if real-time updates)

### 6.2 Projection Service Integration
- Trigger projection rebuilds via replay interface
- Query projection state at replay time
- Compare current vs. replayed state

### 6.3 Entity Detail Integration
- Link from events to entity detail pages
- Navigate to order detail, account detail, etc.
- Show event timeline in entity detail pages (reverse link)

### 6.4 Pricing Integration
- Market date (asOfDate) affects pricing queries during replay
- Use correct yield curve for replay date
- Show pricing context in event explanations

---

## 7. Mock Data Requirements

For initial development, provide:
- 100-200 sample events across all modules:
  - Market Data events (10-15 events)
  - Pricing events (15-20 events)
  - OMS events (30-40 events)
  - EMS events (20-30 events)
  - PMS events (20-30 events)
  - Compliance events (10-15 events)
  - Copilot events (5-10 events)
- Events with correlation chains (groups of related events)
- Events with causation chains (cause → effect)
- Events with explanations (compliance, execution)
- Events distributed across time (days/weeks of history)
- Events for multiple aggregates (orders, accounts, proposals)

---

## 8. UI/UX Considerations

### 8.1 Timeline Visualization
- Clear chronological ordering
- Visual distinction between event categories (colors, icons)
- Smooth scrolling and zoom
- Responsive design (works on different screen sizes)

### 8.2 Event Cards
- Concise summary information
- Expandable for full details
- Clear visual hierarchy (timestamp, type, summary)
- Explanation prominently displayed (if present)

### 8.3 Event Relationships
- Visual connectors showing correlation/causation chains
- Collapsible chains (show only key events, expand for details)
- Color coding for different relationship types
- Interactive navigation (click to follow chain)

### 8.4 Replay Interface
- Clear time selectors (market date, system time)
- Progress indicator during rebuild
- Side-by-side comparison (current vs. replayed, optional)
- Clear indication of replay state

### 8.5 Filters
- Persistent filter state (URL params or local storage)
- Clear active filters display
- Quick filter presets (e.g., "Today's Events", "Order Events")
- Filter combination logic (AND between different filter types)

### 8.6 Performance
- Virtual scrolling for large event lists
- Lazy loading of event details
- Debounced search/filter
- Progressive loading (load more on scroll)

---

## 9. Edge Cases & Error Handling

### 9.1 Missing Events
- Handle missing events gracefully (deleted, archived)
- Show placeholder for missing event in chain
- Allow replay even if some events are missing

### 9.2 Large Event Sets
- Efficient pagination
- Virtual scrolling
- Limit maximum events displayed (with warning)
- Suggest filters to narrow results

### 9.3 Replay Failures
- Handle projection rebuild failures gracefully
- Show error message with details
- Allow retry
- Log errors for debugging

### 9.4 Invalid Event Data
- Handle malformed events gracefully
- Show error indicator in timeline
- Allow viewing raw event data (for debugging)
- Skip invalid events in replay (with warning)

### 9.5 Schema Version Mismatches
- Handle events with different schema versions
- Display schema version in event detail
- Support backward compatibility
- Show warning if schema version is very old

---

## 10. Future Enhancements (Out of Scope)

- Real-time event streaming (WebSocket updates)
- Event replay animation (play events forward in time)
- Event statistics and analytics (event frequency, patterns)
- Event search indexing (full-text search on payloads)
- Event export to external systems
- Event replay scheduling (automated replay at specific times)
- Event diff view (compare two events side-by-side)
- Event visualization graphs (dependency graphs, flowcharts)

---

